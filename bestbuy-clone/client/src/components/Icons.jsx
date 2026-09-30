const base = { width: 22, height: 22, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: 2, strokeLinecap: 'round', strokeLinejoin: 'round', 'aria-hidden': true };

export const MenuIcon = (p) => <svg {...base} {...p}><path d="M3 6h18M3 12h18M3 18h18" /></svg>;
export const SearchIcon = (p) => <svg {...base} {...p}><circle cx="11" cy="11" r="7" /><path d="M21 21l-4.3-4.3" /></svg>;
export const CartIcon = (p) => <svg {...base} {...p}><circle cx="9" cy="20" r="1.5" /><circle cx="18" cy="20" r="1.5" /><path d="M2 3h3l2.7 12.2a2 2 0 0 0 2 1.6h7.9a2 2 0 0 0 2-1.5L21 8H6" /></svg>;
export const StoreIcon = (p) => <svg {...base} {...p}><path d="M3 9l1.5-5h15L21 9M3 9v11h18V9M3 9h18M9 20v-6h6v6" /></svg>;
export const UserIcon = (p) => <svg {...base} {...p}><circle cx="12" cy="8" r="4" /><path d="M4 21a8 8 0 0 1 16 0" /></svg>;
export const HeartIcon = ({ filled, ...p }) => <svg {...base} {...p} fill={filled ? 'currentColor' : 'none'}><path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1-1.1a5.5 5.5 0 0 0-7.8 7.8L12 21l8.8-8.6a5.5 5.5 0 0 0 0-7.8z" /></svg>;
export const CloseIcon = (p) => <svg {...base} {...p}><path d="M18 6L6 18M6 6l12 12" /></svg>;
export const ChevronIcon = (p) => <svg {...base} {...p}><path d="M9 6l6 6-6 6" /></svg>;
export const TruckIcon = (p) => <svg {...base} {...p}><path d="M1 4h13v12H1zM14 9h4l4 4v3h-8" /><circle cx="6" cy="18" r="2" /><circle cx="18" cy="18" r="2" /></svg>;
export const CheckIcon = (p) => <svg {...base} {...p}><path d="M20 6L9 17l-5-5" /></svg>;
export const TagIcon = (p) => <svg {...base} {...p}><path d="M20.6 13.4L13.4 20.6a2 2 0 0 1-2.8 0L2 12V2h10l8.6 8.6a2 2 0 0 1 0 2.8z" /><circle cx="7" cy="7" r="1.5" /></svg>;
