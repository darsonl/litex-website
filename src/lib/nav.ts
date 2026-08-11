/**
 * Primary navigation, in display order.
 *
 * Add a route here only once the page exists — tests/chrome.test.ts walks every
 * chrome link and fails if the build emitted no file behind it. That is deliberate:
 * a broken nav entry is broken on every page of the site simultaneously.
 */
export type NavItem = { href: string; label: string };

export const NAV: readonly NavItem[] = [
  { href: '/products/', label: 'Products' },
  { href: '/applications/', label: 'Applications' },
  { href: '/technology/', label: 'Technology' },
];
