/**
 * SiteHeader — the page header. Brand left, nav centre-right, one optional ask.
 *
 * WHY THE MOBILE MENU IS A <details>. This is a server component and the registry ships no
 * runtime, so the disclosure has to work without JavaScript or not exist. `FAQItem` already
 * set that precedent for the same reason, and a native disclosure gets keyboard handling,
 * focus order and the open/closed announcement for free. The cost is that it cannot animate
 * its own height, which is a fair trade for a menu.
 *
 * `SectionHeader` is a heading block INSIDE a band and is a different thing entirely. This is
 * the page's own header, which is why the name is `site-header` and not `header`.
 *
 * Token-only, no colour literals, and it survives a grayscale theme with radius zero: the
 * only shapes are a bottom hairline and the button's own radius token.
 */

import { Button } from './Button';
import { Container } from './shell';
import type { SiteHeaderContent } from './content-types';

export type SiteHeaderVariant = 'simple' | 'centered';

export function SiteHeader({
  content,
  variant = 'simple',
  sticky = false,
}: {
  content: SiteHeaderContent;
  /** simple: brand left, nav right · centered: brand left, nav centred, ask right */
  variant?: SiteHeaderVariant;
  /** pins the header to the top of the viewport */
  sticky?: boolean;
}) {
  const { brand, nav, action } = content;
  const centered = variant === 'centered';

  const navLinks = (
    <>
      {nav.map((item) => (
        <a
          key={item.href + item.label}
          href={item.href}
          className="v2-link font-sans text-ui-small text-muted-foreground hover:text-foreground"
        >
          {item.label}
        </a>
      ))}
    </>
  );

  return (
    <header
      data-screen-label="Site header"
      className={[
        /* `relative` is the positioning context the mobile panel below anchors to. */
        'relative w-full border-b border-border bg-background',
        sticky ? 'sticky top-0 z-50' : '',
      ]
        .filter(Boolean)
        .join(' ')}
    >
      <Container>
        <div className="flex h-ui-header-offset items-center gap-ui-gap-inline">
          <a
            href="/"
            className="v2-link font-sans text-ui-card-title-lg [font-weight:var(--ui-weight-heading)] tracking-[-0.02em] text-foreground"
          >
            {brand}
          </a>

          {/* The nav is hidden below 1024, where the disclosure below takes over. Two separate
              renderings of the same array rather than one that reflows, because a centred row
              and a stacked panel are different layouts, not one layout at two widths. */}
          <nav
            aria-label="Primary"
            className={[
              'hidden items-center gap-8 lg:flex',
              centered ? 'flex-1 justify-center' : 'ml-auto',
            ].join(' ')}
          >
            {navLinks}
          </nav>

          <div className={['hidden items-center lg:flex', centered ? '' : 'ml-8'].join(' ')}>
            {action ? (
              <Button href={action.href} size="nav">
                {action.label}
              </Button>
            ) : null}
          </div>

          {/* Mobile. `ml-auto` so it sits right regardless of which variant is in play. */}
          <details className="group ml-auto lg:hidden">
            <summary
              className="flex h-ui-button-h-nav cursor-pointer list-none items-center gap-2 font-mono text-ui-eyebrow tracking-[0.24em] text-muted-foreground uppercase [&::-webkit-details-marker]:hidden"
              aria-label="Menu"
            >
              <span aria-hidden="true" className="group-open:hidden">
                Menu
              </span>
              <span aria-hidden="true" className="hidden group-open:inline">
                Close
              </span>
            </summary>
            {/* Absolutely positioned against the header so opening the menu overlays the page
                instead of pushing it down. `top-full` hangs it off the bottom hairline. */}
            <div className="absolute inset-x-0 top-full z-40 border-b border-border bg-background">
              <Container>
                <nav aria-label="Primary" className="flex flex-col gap-5 py-8">
                  {navLinks}
                  {action ? (
                    <div className="pt-2">
                      <Button href={action.href} size="nav">
                        {action.label}
                      </Button>
                    </div>
                  ) : null}
                </nav>
              </Container>
            </div>
          </details>
        </div>
      </Container>
    </header>
  );
}
