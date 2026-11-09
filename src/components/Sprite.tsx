const ICONS: Record<string, string> = {
  search: '<circle cx="7" cy="7" r="4.5"/><path d="M10.5 10.5L14 14"/>',
  keys: '<rect x="1.5" y="3.5" width="13" height="9" rx="1.5"/><path d="M4.5 6.5h.01M7.5 6.5h.01M10.5 6.5h.01M4.5 9.5h7"/>',
  sun: '<circle cx="8" cy="8" r="2.8"/><path d="M8 1.5v1.6M8 12.9v1.6M1.5 8h1.6M12.9 8h1.6M3.4 3.4l1.1 1.1M11.5 11.5l1.1 1.1M3.4 12.6l1.1-1.1M11.5 4.5l1.1-1.1"/>',
  moon: '<path d="M13 9.5A5.5 5.5 0 0 1 6.5 3a5.5 5.5 0 1 0 6.5 6.5z"/>',
  play: '<path d="M5 3.2v9.6L12.5 8z"/>',
  pause: '<path d="M5.5 3.5v9M10.5 3.5v9"/>',
  prev: '<path d="M10 3.5L5.5 8 10 12.5"/>',
  next: '<path d="M6 3.5L10.5 8 6 12.5"/>',
  reset: '<path d="M3 8a5 5 0 1 0 1.6-3.7"/><path d="M3 2.8v2.7h2.7"/>',
  arrow: '<path d="M3 8h10M9 4l4 4-4 4"/>',
  copy: '<rect x="5.5" y="5.5" width="8" height="8" rx="1.5"/><path d="M10.5 5.5V4A1.5 1.5 0 0 0 9 2.5H4A1.5 1.5 0 0 0 2.5 4v5A1.5 1.5 0 0 0 4 10.5h1.5"/>',
  check: '<path d="M3 8.5l3.2 3.2L13 4.8"/>',
  zap: '<path d="M9 1.5L3.5 9H8l-1 5.5L12.5 7H8z"/>',
  target: '<circle cx="8" cy="8" r="5.5"/><circle cx="8" cy="8" r="1.8"/>',
  out: '<path d="M5 3h8v8M13 3L4 12"/>',
  embed: '<path d="M5.5 4.5L2 8l3.5 3.5M10.5 4.5L14 8l-3.5 3.5"/>',
  chev: '<path d="M4 6l4 4 4-4"/>',
};

export default function Sprite() {
  const html = Object.entries(ICONS)
    .map(([k, v]) => `<symbol id="i-${k}" viewBox="0 0 16 16">${v}</symbol>`)
    .join("");
  return (
    <svg className="sprite" aria-hidden="true" focusable="false">
      <defs dangerouslySetInnerHTML={{ __html: html }} />
    </svg>
  );
}
