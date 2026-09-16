import type { CSSProperties } from 'react';

/**
 * BookingEmbed — a GoHighLevel booking calendar, on the page, showing real
 * open times.
 *
 * WHY THIS IS A REGISTRY ITEM RATHER THAN THREE LINES OF JSX
 *
 * The markup is trivial and the behaviour is not. Every JHAI surface that wants
 * a calendar hits the same two defects, and both are invisible until somebody
 * loads the page and finds the calendar missing.
 *
 * DEFECT ONE: THE SCRIPT HIDES YOUR IFRAME AND MAY NEVER UNHIDE IT
 *
 * `form_embed.js` parks the frame off-screen while the widget boots, and
 * reveals it once the widget reports back. Measured on a live embed, the script
 * left the node in this state and stopped:
 *
 *   position: absolute; left: -9999px; opacity: 0; visibility: hidden;
 *   pointer-events: none; width: 100%; height: 804px;
 *
 * The height is real, so the measurement pass ran and succeeded. The reveal is
 * what never arrived. On the page that reads as a heading, a paragraph, and
 * then nothing at all. This component reverses the concealment in CSS and
 * leaves the geometry the script gets right alone, because the height is the
 * entire reason the script is loaded.
 *
 * DEFECT TWO: THE WIDTH RESOLVES AGAINST THE WINDOW
 *
 * The same pass resolves its 100% against the viewport rather than the column
 * the iframe sits in. In a 1024px column at a 1440px viewport the calendar
 * renders 1440px wide, breaks its container, and can push a horizontal
 * scrollbar onto the document.
 *
 * PRINT
 *
 * An iframe prints as a blank rectangle at best. The booking address renders as
 * text, hidden on screen and shown on paper, so somebody holding the printout
 * can still type it in. That fallback is also what a reader gets if the script
 * is blocked entirely.
 *
 * PRIVACY
 *
 * The widget is the vendor's own surface running in the vendor's origin, and
 * this component only gives it a frame. `form_embed.js` speaks to it through
 * postMessage, so no third-party script touches the host page's DOM.
 */

export interface BookingEmbedProps {
  /**
   * The full widget URL, e.g.
   * `https://api.leadconnectorhq.com/widget/booking/<calendarId>`.
   */
  url: string;
  /** Accessible name for the frame. */
  title?: string;
  /**
   * Floor for the frame before the script reports the real height. Not the
   * final height: the script overwrites it, which is what it is for.
   */
  minHeight?: number;
  className?: string;
  style?: CSSProperties;
}

export function BookingEmbed({
  url,
  title = 'Book a time',
  minHeight = 720,
  className,
  style,
}: BookingEmbedProps) {
  /*
   * The vendor keys its resize messages off the calendar id in the URL, so the
   * element id is derived from the URL rather than passed in beside it. Two
   * sources for one id is how they end up disagreeing.
   */
  const calendarId = url.split('/').filter(Boolean).pop() ?? 'booking';

  return (
    <div className={className} style={style}>
      {/* A plate around media is a legal container: the widget is somebody
          else's surface and needs an edge, or it reads as part of the page. */}
      <div className="jhai-booking overflow-hidden rounded-ui-card border border-border bg-card">
        <iframe
          src={url}
          id={calendarId}
          title={title}
          scrolling="no"
          style={{ display: 'block', width: '100%', minHeight, border: 'none' }}
        />
      </div>

      <p className="jhai-booking-fallback">
        Or book at <span className="font-mono break-all">{url}</span>
      </p>

      {/*
       * Scoped to this component's own plate so it cannot reach any other
       * iframe on the page. Every !important here is undoing something the
       * vendor script wrote inline, and an inline style beats a normal rule.
       */}
      <style>{`
        .jhai-booking iframe {
          position: static !important;
          left: auto !important;
          opacity: 1 !important;
          visibility: visible !important;
          pointer-events: auto !important;
          width: 100% !important;
          max-width: 100% !important;
        }
        .jhai-booking-fallback { display: none; }
        @media print {
          .jhai-booking { display: none !important; }
          .jhai-booking-fallback { display: block; margin-top: 1rem; }
        }
      `}</style>

      {/*
       * Loaded with a plain <script defer> rather than a framework-specific
       * loader so the item stays framework-agnostic. In Next.js, swap this for
       * next/script with strategy="lazyOnload" when the calendar sits below the
       * fold, which it usually does.
       */}
      <script src="https://link.msgsndr.com/js/form_embed.js" defer />
    </div>
  );
}
