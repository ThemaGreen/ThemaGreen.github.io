/* Inline SVG icon set — replaces the Font Awesome CDN (≈60 KB CSS + 4 font files). */
const P = (d, extra = "") =>
  `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${d}${extra}</svg>`;

export const ICONS = {
  search:   P('<circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/>'),
  close:    P('<path d="M18 6 6 18M6 6l12 12"/>'),
  menu:     P('<path d="M4 7h16M4 12h16M4 17h16"/>'),
  moon:     P('<path d="M20 14.5A8.5 8.5 0 0 1 9.5 4a8.5 8.5 0 1 0 10.5 10.5Z"/>'),
  sun:      P('<circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/>'),
  arrowUp:  P('<path d="M12 19V5M5 12l7-7 7 7"/>'),
  arrowRight: P('<path d="M5 12h14M12 5l7 7-7 7"/>'),
  arrowDown: P('<path d="M12 5v14M19 12l-7 7-7-7"/>'),
  chevronDown: P('<path d="m6 9 6 6 6-6"/>'),
  external: P('<path d="M14 4h6v6M20 4l-9 9M18 13v6a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1h6"/>'),
  mail:     P('<rect x="3" y="5" width="18" height="14" rx="2"/><path d="m3.5 7 8.5 6 8.5-6"/>'),
  pin:      P('<path d="M12 21s7-5.4 7-11a7 7 0 1 0-14 0c0 5.6 7 11 7 11Z"/><circle cx="12" cy="10" r="2.6"/>'),
  cap:      P('<path d="m2 8 10-4 10 4-10 4Z"/><path d="M6 10.5V16c0 1.5 2.7 3 6 3s6-1.5 6-3v-5.5"/>'),
  send:     P('<path d="m21 3-9.5 18-2.2-7.3L2 11.5Z"/><path d="M21 3 9.3 13.7"/>'),
  sparkle:  P('<path d="M12 3v4M12 17v4M3 12h4M17 12h4M5.6 5.6 8.4 8.4M15.6 15.6l2.8 2.8M18.4 5.6 15.6 8.4M8.4 15.6l-2.8 2.8"/>'),
  brain:    P('<path d="M9.5 4a2.5 2.5 0 0 0-2.5 2.5A2.5 2.5 0 0 0 5 9v1a2.5 2.5 0 0 0 1 2 2.5 2.5 0 0 0-1 2v1a2.5 2.5 0 0 0 2 2.4A2.5 2.5 0 0 0 9.5 20H12V4Z"/><path d="M14.5 4a2.5 2.5 0 0 1 2.5 2.5A2.5 2.5 0 0 1 19 9v1a2.5 2.5 0 0 1-1 2 2.5 2.5 0 0 1 1 2v1a2.5 2.5 0 0 1-2 2.4A2.5 2.5 0 0 1 14.5 20H12V4Z"/>'),
  flask:    P('<path d="M9 3h6M10 3v6.5L4.8 18A2 2 0 0 0 6.5 21h11a2 2 0 0 0 1.7-3L14 9.5V3"/><path d="M7.5 15h9"/>'),
  chip:     P('<rect x="7" y="7" width="10" height="10" rx="2"/><path d="M10 2v3M14 2v3M10 19v3M14 19v3M2 10h3M2 14h3M19 10h3M19 14h3"/>'),
  compass:  P('<circle cx="12" cy="12" r="9"/><path d="m15.5 8.5-2 5.2-5.2 2 2-5.2Z"/>'),
  scale:    P('<path d="M12 3v18M7 21h10M12 6 5 9l3 5a3.2 3.2 0 0 1-6 0l3-5M12 6l7 3-3 5a3.2 3.2 0 0 0 6 0l-3-5"/>'),
  waveform: P('<path d="M3 12h2M7 7v10M11 4v16M15 8v8M19 11h2"/>'),
  globe:    P('<circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3a15 15 0 0 1 0 18 15 15 0 0 1 0-18Z"/>'),
  shield:   P('<path d="M12 3 5 6v5.5c0 4.3 2.9 8.2 7 9.5 4.1-1.3 7-5.2 7-9.5V6Z"/><path d="m9 12 2 2 4-4"/>'),
  people:   P('<circle cx="9" cy="8" r="3"/><path d="M3 20a6 6 0 0 1 12 0"/><path d="M16 5.3a3 3 0 0 1 0 5.4M17 14.2A5.5 5.5 0 0 1 21 20"/>'),
  leaf:     P('<path d="M20 4C9 4 4 9.5 4 16c0 2 1 4 1 4s2.5-8 15-12"/><path d="M5 20c0-8 6-12 15-12 0 8-5 13-11 13a5.6 5.6 0 0 1-4-1Z"/>'),
  phone:    P('<rect x="7" y="2" width="10" height="20" rx="2.4"/><path d="M11 18.5h2"/>'),
  book:     P('<path d="M4 5.5A2.5 2.5 0 0 1 6.5 3H19v15H6.5A2.5 2.5 0 0 0 4 20.5Z"/><path d="M4 20.5A2.5 2.5 0 0 1 6.5 18H19v3H6.5"/>'),
  recycle:  P('<path d="m7 17-2.5-4 2-3.5M12 4l2.4 4M17 17l2.5-4-2.6-4.5"/><path d="M4.5 13H3l2.2 4a2 2 0 0 0 1.7 1H10M19.5 13H21l-2.2 4a2 2 0 0 1-1.7 1H13M12 4h-1.6a2 2 0 0 0-1.7 1L7.5 8"/>'),
  vr:       P('<rect x="2" y="7" width="20" height="10" rx="3"/><path d="M9.5 17c.6-1.6 1.3-2.4 2.5-2.4s1.9.8 2.5 2.4"/>'),
  layers:   P('<path d="m12 3 9 5-9 5-9-5Z"/><path d="m3 13 9 5 9-5M3 17l9 5 9-5"/>'),
  bus:      P('<rect x="4" y="4" width="16" height="12" rx="2"/><path d="M4 10h16M7 20v-2M17 20v-2"/><circle cx="8" cy="16" r="1"/><circle cx="16" cy="16" r="1"/>'),
  watch:    P('<circle cx="12" cy="12" r="5.5"/><path d="M9 6.5 9.4 3h5.2L15 6.5M9 17.5 9.4 21h5.2l.4-3.5M12 10v2.4l1.6 1"/>'),
  puzzle:   P('<path d="M10 4a2 2 0 1 1 4 0v1h3a1 1 0 0 1 1 1v3h1a2 2 0 1 1 0 4h-1v3a1 1 0 0 1-1 1h-3v1a2 2 0 1 1-4 0v-1H7a1 1 0 0 1-1-1v-3H5a2 2 0 1 1 0-4h1V6a1 1 0 0 1 1-1h3Z"/>'),
  gear:     P('<circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.6 1.6 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.6 1.6 0 0 0-1.8-.3 1.6 1.6 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.6 1.6 0 0 0-1-1.5 1.6 1.6 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.6 1.6 0 0 0 .3-1.8 1.6 1.6 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.6 1.6 0 0 0 1.5-1 1.6 1.6 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.6 1.6 0 0 0 1.8.3H9a1.6 1.6 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.6 1.6 0 0 0 1 1.5 1.6 1.6 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.6 1.6 0 0 0-.3 1.8V9a1.6 1.6 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.6 1.6 0 0 0-1.5 1Z"/>'),
  star:     `<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="m12 2.6 2.9 5.9 6.5.9-4.7 4.6 1.1 6.5-5.8-3-5.8 3 1.1-6.5L2.6 9.4l6.5-.9Z"/></svg>`,
  check:    P('<path d="m4 12.5 5 5L20 6.5"/>'),
  info:     P('<circle cx="12" cy="12" r="9"/><path d="M12 11v5.5M12 7.8h.01"/>'),
  filter:   P('<path d="M3 5h18l-7 8v6l-4 2v-8Z"/>'),
  command:  P('<path d="M9 6a3 3 0 1 0-3 3h12a3 3 0 1 0-3-3v12a3 3 0 1 0 3-3H6a3 3 0 1 0 3 3Z"/>'),
  bolt:     P('<path d="M13 2 4 14h7l-1 8 9-12h-7Z"/>'),
  linkedin: `<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M4.98 3.5a2.5 2.5 0 1 1 0 5 2.5 2.5 0 0 1 0-5ZM3 9h4v12H3V9Zm7 0h3.8v1.7h.06c.53-1 1.83-2.06 3.76-2.06C21.6 8.64 23 10.9 23 14.3V21h-4v-6c0-1.5-.03-3.4-2.1-3.4-2.1 0-2.4 1.6-2.4 3.3V21h-4V9Z"/></svg>`,
  github:   `<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M12 2a10 10 0 0 0-3.16 19.49c.5.09.68-.22.68-.48v-1.7c-2.78.6-3.37-1.34-3.37-1.34-.45-1.16-1.11-1.47-1.11-1.47-.91-.62.07-.6.07-.6 1 .07 1.53 1.03 1.53 1.03.9 1.53 2.34 1.09 2.91.83.09-.65.35-1.09.63-1.34-2.22-.25-4.55-1.11-4.55-4.94 0-1.09.39-1.98 1.03-2.68-.1-.25-.45-1.27.1-2.65 0 0 .84-.27 2.75 1.02a9.5 9.5 0 0 1 5 0c1.91-1.29 2.75-1.02 2.75-1.02.55 1.38.2 2.4.1 2.65.64.7 1.03 1.59 1.03 2.68 0 3.84-2.34 4.68-4.57 4.93.36.31.68.92.68 1.85v2.74c0 .27.18.58.69.48A10 10 0 0 0 12 2Z"/></svg>`,
};

/** Injects an icon into every [data-icon] element inside `root`. */
export function paintIcons(root = document) {
  root.querySelectorAll("[data-icon]").forEach((el) => {
    const svg = ICONS[el.dataset.icon];
    if (svg) el.innerHTML = svg;
  });
}
