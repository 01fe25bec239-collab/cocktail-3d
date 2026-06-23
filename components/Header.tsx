'use client';

/**
 * Floating header that inherits its colour from the global CSS
 * custom properties — so it automatically shifts hue as the user
 * scrolls through cocktail sections.
 *
 * Uses a translucent glass effect backed by `backdrop-filter`
 * so the colour journey feels like one continuous surface.
 */
export default function Header() {
  return (
    <header className="header">
      <div className="header-inner">
        <span className="header-logo">Cocktail Showcase</span>
      </div>
    </header>
  );
}
