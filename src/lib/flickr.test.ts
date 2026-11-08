import { describe, expect, it } from 'vitest';
import { describePhoto, embedFlickrPhotos, parseFlickrRef, photoIdsInHtml, pickSizes, srcset, type FlickrPhoto } from './flickr';

const photo = (id: string, title = 'Zonsondergang'): FlickrPhoto => ({
  id,
  title,
  alt: title,
  pageUrl: `https://www.flickr.com/photos/me/${id}/`,
  thumb: { src: `https://live.staticflickr.com/${id}_c.jpg`, width: 800, height: 533 },
  large: { src: `https://live.staticflickr.com/${id}_k.jpg`, width: 2048, height: 1365 },
  variants: [
    { src: `https://live.staticflickr.com/${id}_n.jpg`, width: 320, height: 213 },
    { src: `https://live.staticflickr.com/${id}_c.jpg`, width: 800, height: 533 },
    { src: `https://live.staticflickr.com/${id}_b.jpg`, width: 1024, height: 683 },
    { src: `https://live.staticflickr.com/${id}_k.jpg`, width: 2048, height: 1365 },
  ],
});

describe('parseFlickrRef', () => {
  it('accepts photo page URLs, flickr:ID and bare IDs', () => {
    expect(parseFlickrRef('https://www.flickr.com/photos/12345@N01/53210987654/in/album-1/')).toBe('53210987654');
    expect(parseFlickrRef('flickr:42')).toBe('42');
    expect(parseFlickrRef(' 42 ')).toBe('42');
  });

  it('rejects anything else', () => {
    expect(parseFlickrRef('https://example.com/photos/x/1')).toBeUndefined();
  });
});

describe('photoIdsInHtml', () => {
  it('finds refs alone in a paragraph, linked or not', () => {
    const html = [
      '<p>Intro text https://www.flickr.com/photos/me/1/ inline is ignored</p>',
      '<p><a href="https://www.flickr.com/photos/me/2/">https://www.flickr.com/photos/me/2/</a></p>',
      '<p>flickr:3</p>',
    ].join('\n');
    expect(photoIdsInHtml(html)).toEqual(['2', '3']);
  });

  it('finds every ref in a row paragraph, including ones split by <br>', () => {
    expect(photoIdsInHtml('<p>flickr:4<br>\nflickr:5\nflickr:6</p>')).toEqual(['4', '5', '6']);
  });
});

describe('pickSizes', () => {
  it('picks the largest size within each edge limit, ignoring string dimensions', () => {
    const sizes = [
      { label: 'Original', source: 'o', width: 6000, height: 4000 },
      { label: 'Medium 800', source: 'c', width: '800', height: '533' },
      { label: 'Large 2048', source: 'k', width: 2048, height: 1365 },
      { label: 'Small', source: 'm', width: 240, height: 160 },
    ];
    const { thumb, large } = pickSizes(sizes);
    expect(thumb.src).toBe('c');
    expect(large).toEqual({ src: 'k', width: 2048, height: 1365 });
  });

  it('falls back to the smallest size when none fit', () => {
    expect(pickSizes([{ label: 'Original', source: 'o', width: 5000, height: 3000 }]).thumb.src).toBe('o');
  });

  it('fails on an empty size list', () => {
    expect(() => pickSizes([])).toThrow();
  });

  it('lists every uncropped size up to 2048px as a variant, smallest first', () => {
    const sizes = [
      { label: 'Original', source: 'o', width: 6000, height: 4000 },
      { label: 'Large 2048', source: 'k', width: 2048, height: 1365 },
      { label: 'Square', source: 's', width: 75, height: 75 },
      { label: 'Large Square', source: 'q', width: 150, height: 150 },
      { label: 'Small 320', source: 'n', width: 320, height: 213 },
      { label: 'Medium 800', source: 'c', width: 800, height: 533 },
    ];
    expect(pickSizes(sizes).variants.map((v) => v.src)).toEqual(['n', 'c', 'k']);
  });

  it('never picks a square crop as thumb or large', () => {
    const sizes = [
      { label: 'Large Square', source: 'q', width: 150, height: 150 },
      { label: 'Original', source: 'o', width: 5000, height: 3000 },
    ];
    const { thumb, large, variants } = pickSizes(sizes);
    expect([thumb.src, large.src]).toEqual(['o', 'o']);
    expect(variants.map((v) => v.src)).toEqual(['o']);
  });
});

describe('srcset', () => {
  it('lists variants with their width, up to a maximum edge', () => {
    expect(srcset(photo('9'), 1024)).toBe(
      'https://live.staticflickr.com/9_n.jpg 320w, https://live.staticflickr.com/9_c.jpg 800w, https://live.staticflickr.com/9_b.jpg 1024w',
    );
  });

  it('includes every variant without a maximum', () => {
    expect(srcset(photo('9')).split(', ')).toHaveLength(4);
  });

  it('keeps one variant per width', () => {
    const p = photo('9');
    p.variants = [p.variants[0], { ...p.variants[0], src: 'dup' }];
    expect(srcset(p)).toBe('https://live.staticflickr.com/9_n.jpg 320w');
  });
});

describe('embedFlickrPhotos', () => {
  it('replaces photo paragraphs with figures and escapes Flickr text', async () => {
    const html = await embedFlickrPhotos('<p>Hoi</p>\n<p>flickr:7</p>', async (id) => photo(id, 'A "nice" <b>'));
    expect(html).toContain('<p>Hoi</p>');
    expect(html).toContain('data-pswp-width="2048"');
    expect(html).toContain('data-flickr-page="https://www.flickr.com/photos/me/7/"');
    expect(html).toContain('<figcaption>A &quot;nice&quot; &lt;b&gt;</figcaption>');
    expect(html).not.toContain('flickr:7');
  });

  it('gives figures a srcset so phones download a smaller size', async () => {
    const html = await embedFlickrPhotos('<p>flickr:7</p>', async (id) => photo(id));
    expect(html).toContain('srcset="https://live.staticflickr.com/7_n.jpg 320w, ');
    expect(html).toContain('7_k.jpg 2048w"');
    expect(html).toContain('sizes="(min-width: 60rem) 60rem, 100vw"');
  });

  it('sizes photos in a row by their share of the row', async () => {
    const html = await embedFlickrPhotos('<p>flickr:1\nflickr:2</p>', async (id) => photo(id));
    expect(html.match(/sizes="\(min-width: 60rem\) 30rem, 50vw"/g)).toHaveLength(2);
  });

  it('puts refs on consecutive lines side by side in a row', async () => {
    const html = await embedFlickrPhotos(
      '<p><a href="https://www.flickr.com/photos/me/1/">https://www.flickr.com/photos/me/1/</a>\nflickr:2</p>',
      async (id) => photo(id),
    );
    expect(html.match(/<div class="photo-row">/g)).toHaveLength(1);
    expect(html.match(/<figure class="photo" style="flex: 1.501">/g)).toHaveLength(2);
    expect(html).not.toContain('<p>');
  });

  it('leaves four refs in one paragraph untouched', async () => {
    const html = '<p>flickr:1\nflickr:2\nflickr:3\nflickr:4</p>';
    expect(await embedFlickrPhotos(html, async (id) => photo(id))).toBe(html);
  });

  it('refuses more than 30 photos per page', async () => {
    const html = Array.from({ length: 31 }, (_, i) => `<p>flickr:${i}</p>`).join('');
    await expect(embedFlickrPhotos(html, async (id) => photo(id))).rejects.toThrow(/at most 30/);
  });
});

describe('describePhoto', () => {
  it('uses a short description as alt and the title as caption', () => {
    expect(describePhoto('El Peñol', 'De rots vanaf het meer.')).toEqual({ alt: 'De rots vanaf het meer.', caption: 'El Peñol' });
  });

  it('strips markup and collapses whitespace in the description', () => {
    expect(describePhoto('X', '<b>Een</b>\n\n  rots ').alt).toBe('Een rots');
  });

  it('falls back to the first sentence of a long description', () => {
    const long = 'Wax palms in the Cocora valley. ' + 'They grow to sixty metres and live for decades. '.repeat(5);
    expect(describePhoto('Cocora', long).alt).toBe('Wax palms in the Cocora valley.');
  });

  it('falls back to the title when even the first sentence is long', () => {
    expect(describePhoto('Cocora', 'a'.repeat(200)).alt).toBe('Cocora');
  });

  it('drops camera file names as caption and alt', () => {
    expect(describePhoto('IMG_4021', '')).toEqual({ alt: 'Foto', caption: '' });
    expect(describePhoto('DSC-0012.jpg', 'Markt in Getsemaní')).toEqual({ alt: 'Markt in Getsemaní', caption: '' });
    expect(describePhoto('PXL_20261107_123456789', '').caption).toBe('');
  });
});
