// Escape text interpolated into webview HTML. Quest data (adventurer name,
// quest name, scroll names) is user-controlled, so escape it even though it is
// local — defence in depth alongside the webview CSP.
export function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}
