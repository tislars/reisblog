import { describe, expect, it } from 'vitest';
import { escapeHtml, splitLead } from './html';

describe('escapeHtml', () => {
  it('escapes the characters that matter in text and attributes', () => {
    expect(escapeHtml('<a href="x">&</a>')).toBe('&lt;a href=&quot;x&quot;&gt;&amp;&lt;/a&gt;');
  });
});

describe('splitLead', () => {
  it('takes the opening paragraph off the rest', () => {
    expect(splitLead('<p>Eerste <em>alinea</em>.</p>\n<h2>Kop</h2>\n<p>Twee</p>')).toEqual({
      lead: 'Eerste <em>alinea</em>.',
      rest: '<h2>Kop</h2>\n<p>Twee</p>',
    });
  });

  it('has no lead when the post opens with something else', () => {
    const html = '<figure class="photo"></figure>\n<p>Tekst</p>';
    expect(splitLead(html)).toEqual({ lead: '', rest: html });
    expect(splitLead('<h2>Kop</h2><p>x</p>').lead).toBe('');
  });

  it('does not take an image paragraph as the lead', () => {
    const html = '<p><img src="x.jpg" alt=""></p><p>Tekst</p>';
    expect(splitLead(html)).toEqual({ lead: '', rest: html });
  });

  it('only takes the first paragraph', () => {
    expect(splitLead('<p>Een</p><p>Twee</p>')).toEqual({ lead: 'Een', rest: '<p>Twee</p>' });
  });

  it('handles an empty post', () => {
    expect(splitLead('')).toEqual({ lead: '', rest: '' });
  });
});
