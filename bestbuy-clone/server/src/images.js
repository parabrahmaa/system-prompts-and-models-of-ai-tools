// Generates product artwork as SVG so the store needs no binary image assets.

const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

const ICONS = {
  tv: (c) => `<rect x="60" y="90" width="280" height="170" rx="8" fill="#111" stroke="${c}" stroke-width="6"/>
    <rect x="72" y="102" width="256" height="146" fill="url(#screen)"/>
    <rect x="185" y="262" width="30" height="24" fill="#333"/><rect x="140" y="284" width="120" height="10" rx="5" fill="#333"/>`,
  laptop: (c) => `<rect x="95" y="90" width="210" height="140" rx="10" fill="#222" stroke="${c}" stroke-width="5"/>
    <rect x="106" y="101" width="188" height="118" fill="url(#screen)"/>
    <path d="M60 240 h280 l-20 30 h-240 z" fill="#b8bec6"/><rect x="175" y="244" width="50" height="6" rx="3" fill="#8a9099"/>`,
  phone: (c) => `<rect x="140" y="60" width="120" height="240" rx="22" fill="#1b1b1b" stroke="${c}" stroke-width="5"/>
    <rect x="150" y="80" width="100" height="200" rx="10" fill="url(#screen)"/><rect x="185" y="68" width="30" height="6" rx="3" fill="#444"/>`,
  headphones: (c) => `<path d="M110 200 v-40 a90 90 0 0 1 180 0 v40" fill="none" stroke="#222" stroke-width="16"/>
    <rect x="90" y="180" width="50" height="90" rx="20" fill="${c}"/><rect x="260" y="180" width="50" height="90" rx="20" fill="${c}"/>`,
  gamepad: (c) => `<path d="M100 150 h200 a55 55 0 0 1 40 95 l-25 25 a30 30 0 0 1 -45 -5 l-20 -25 h-100 l-20 25 a30 30 0 0 1 -45 5 l-25 -25 a55 55 0 0 1 40 -95z" fill="#222" stroke="${c}" stroke-width="5"/>
    <rect x="125" y="180" width="40" height="12" fill="#ddd"/><rect x="139" y="166" width="12" height="40" fill="#ddd"/>
    <circle cx="260" cy="175" r="9" fill="${c}"/><circle cx="280" cy="195" r="9" fill="#fff"/><circle cx="240" cy="195" r="9" fill="#fff"/><circle cx="260" cy="215" r="9" fill="${c}"/>`,
  fridge: (c) => `<rect x="130" y="50" width="140" height="260" rx="10" fill="#dfe3e8" stroke="#9aa3ad" stroke-width="4"/>
    <line x1="200" y1="50" x2="200" y2="200" stroke="#9aa3ad" stroke-width="4"/><line x1="130" y1="200" x2="270" y2="200" stroke="#9aa3ad" stroke-width="4"/>
    <rect x="185" y="110" width="6" height="50" rx="3" fill="${c}"/><rect x="209" y="110" width="6" height="50" rx="3" fill="${c}"/><rect x="175" y="220" width="50" height="6" rx="3" fill="${c}"/>`,
  camera: (c) => `<rect x="80" y="120" width="240" height="150" rx="16" fill="#222"/><rect x="120" y="100" width="60" height="30" rx="6" fill="#222"/>
    <circle cx="200" cy="195" r="58" fill="#444" stroke="${c}" stroke-width="6"/><circle cx="200" cy="195" r="34" fill="url(#screen)"/><circle cx="285" cy="140" r="8" fill="${c}"/>`,
  speaker: (c) => `<rect x="140" y="80" width="120" height="210" rx="50" fill="#2a2a2a"/><circle cx="200" cy="200" r="42" fill="#3d3d3d" stroke="${c}" stroke-width="4"/>
    <circle cx="200" cy="200" r="16" fill="#555"/><rect x="170" y="110" width="60" height="8" rx="4" fill="${c}"/>`,
  tablet: (c) => `<rect x="105" y="60" width="190" height="250" rx="18" fill="#1b1b1b" stroke="${c}" stroke-width="5"/><rect x="118" y="76" width="164" height="218" rx="6" fill="url(#screen)"/>`,
  watch: (c) => `<rect x="170" y="50" width="60" height="70" rx="10" fill="#333"/><rect x="170" y="240" width="60" height="70" rx="10" fill="#333"/>
    <rect x="140" y="110" width="120" height="140" rx="30" fill="#1b1b1b" stroke="${c}" stroke-width="5"/><rect x="152" y="124" width="96" height="112" rx="20" fill="url(#screen)"/>`,
};

export function productSvg({ icon, hue, brand, variant = 0 }) {
  const h = (hue + variant * 40) % 360;
  const accent = `hsl(${h} 70% 50%)`;
  const draw = ICONS[icon] || ICONS.tv;
  const rotate = [0, -6, 6, 0][variant % 4];
  const scale = variant === 3 ? 1.15 : 1;
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 360" width="400" height="360">
  <defs>
    <linearGradient id="screen" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="hsl(${h} 80% 60%)"/><stop offset="1" stop-color="hsl(${(h + 60) % 360} 70% 35%)"/>
    </linearGradient>
  </defs>
  <rect width="400" height="360" fill="#fff"/>
  <g transform="rotate(${rotate} 200 180) translate(200 180) scale(${scale}) translate(-200 -180)">${draw(accent)}</g>
  <text x="200" y="345" font-family="Arial, sans-serif" font-size="18" font-weight="700" fill="#9aa3ad" text-anchor="middle">${esc(brand.toUpperCase())}</text>
</svg>`;
}
