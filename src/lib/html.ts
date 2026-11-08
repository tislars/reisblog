export function escapeHtml(text: string): string {
  return text
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;');
}

/**
 * Splits the opening paragraph off rendered post HTML, so the page can set it as the lead under the title.
 * Only a plain text paragraph at the very start counts; a post that opens with a heading or photo has no lead.
 */
export function splitLead(html: string): { lead: string; rest: string } {
  const match = html.match(/^\s*<p>([\s\S]*?)<\/p>/);
  // A paragraph holding only an image is not a lead.
  if (!match || /^\s*<img\b/.test(match[1])) return { lead: '', rest: html };
  return { lead: match[1], rest: html.slice(match[0].length).replace(/^\s+/, '') };
}
