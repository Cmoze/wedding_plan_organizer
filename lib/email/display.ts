/**
 * Tidies inbound emails for reading. Store and newsletter emails (logos, tracking links,
 * invisible "preheader" filler) look messy as plain text, so we clean that up and wrap the
 * HTML version in a few reading-friendly styles. Safe to import from Client Components.
 */

// Zero-width spaces/joiners, soft hyphens, word joiners and the combining grapheme joiner that
// marketing emails pad their preview text with.
const INVISIBLE = /[­͏؜ᅟᅠ឴឵᠎​-‏⁠-⁤﻿]/g;

/** Plain-text email without image placeholders, tracking links and filler. */
export function cleanEmailText(text: string): string {
  return (
    text
      .replace(/\r\n?/g, "\n")
      .replace(INVISIBLE, "")
      .replace(/ /g, " ")
      // "[image: Target logo]" placeholders, and links in angle brackets after link text.
      .replace(/\[image:[^\]]*\]/gi, "")
      .replace(/<(?:https?:|mailto:)[^>\s]*>/gi, "")
      // Bare links long enough to be tracking links.
      .replace(/https?:\/\/\S{60,}/g, "(link)")
      .split("\n")
      .map((line) => line.trimEnd())
      // Lines that are only a logo's alt text, e.g. "[Target]", or only divider characters.
      .filter((line) => !/^\s*\[[^\]]{1,60}\]\s*$/.test(line))
      .filter((line) => !/^\s*[-_=*~|]{4,}\s*$/.test(line))
      .join("\n")
      .replace(/[ \t]{2,}/g, " ")
      .replace(/\n{3,}/g, "\n\n")
      .trim()
  );
}

const READING_STYLES = `<base target="_blank"><style>
html,body{margin:0;padding:0;background:#fff}
body{padding:16px;font-family:system-ui,-apple-system,"Segoe UI",sans-serif;font-size:16px;line-height:1.5;color:#20352f;overflow-wrap:anywhere}
img{max-width:100%!important;height:auto!important}
table{max-width:100%!important}
a{color:#315b4b}
</style>`;

/**
 * An email's HTML as a full page for a sandboxed iframe: no scripts, links open in a new tab,
 * wide tables and big logos shrink to fit.
 */
export function emailHtmlDocument(html: string): string {
  const clean = html
    .replace(/<script[\s\S]*?<\/script>/gi, "")
    .replace(/<(meta)[^>]*http-equiv[^>]*>/gi, "")
    .replace(INVISIBLE, "");
  if (/<head[^>]*>/i.test(clean))
    return clean.replace(/<head[^>]*>/i, (head) => `${head}${READING_STYLES}`);
  return `<!doctype html><html><head><meta charset="utf-8">${READING_STYLES}</head><body>${clean}</body></html>`;
}
