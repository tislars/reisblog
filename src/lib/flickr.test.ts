import { describe, expect, it } from 'vitest';
import { embedFlickrPhotos, parseFlickrRef, photoIdsInHtml, pickSizes, type FlickrPhoto } from './flickr';

const photo = (id: string, title = 'Zonsondergang'): FlickrPhoto => ({
  id,
  title,
  alt: title,
  pageUrl: `https://www.flickr.com/photos/me/${id}/`,
  thumb: { src: `https://live.staticflickr.com/${id}_c.jpg`, width: 800, height: 533 },
  large: { src: `https://live.staticflickr.com/${id}_k.jpg`, width: 2048, height: 1365 },
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
