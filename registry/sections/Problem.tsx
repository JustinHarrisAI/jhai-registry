/**
 * The problem. Centred, five crosses, no illustration.
 *
 * This is the one band on the page that is deliberately bare: it names the buyer's last
 * vendor, and any image here would soften a paragraph that has to sting. The standing * "every section needs a visual" note is about selling sections, and the crosses are the
 * visual here.
 */

import { Eyebrow } from './Eyebrow';
import { Container, Section } from './shell';
import type { ProblemContent } from './content-types';

export function Problem({ content }: { content: ProblemContent }) {
  return (
    /* `!` because HomeStyles is unlayered and its `.v2-section` padding outranks any
       @layer utility. The 160px is the export's own frozen number rather than
       `py-ui-section-y-display`: that token steps to 96px under 760px and this band never has. */
    <Section id="problem" label="Problem" ground="white" className="py-[160px]!">
      <Container>
        <div className="flex flex-col items-center text-center">
          <Eyebrow number={content.number}>{content.label}</Eyebrow>
          <h2
            data-rv=""
            className="mt-ui-eyebrow-gap max-w-[820px] font-sans text-ui-display leading-none [font-weight:var(--ui-weight-heading)] tracking-[-0.045em] text-foreground"
          >
            {content.titleLead}
            <em className="italic">{content.titleEm}</em>
            {content.titleTail}
          </h2>
          <p
            data-rv=""
            className="mt-6 max-w-ui-measure-lede font-sans text-ui-lede leading-[1.6] text-muted-foreground"
          >
            {content.lede}
          </p>
        </div>
        <div data-rv="" className="v2-grid-5 mt-16 gap-x-10 gap-y-6">
          {content.bullets.map((bullet) => (
            <div key={bullet} className="flex items-baseline gap-ui-gap-inline">
              {/* `--ui-ink-400`, not `--ui-ink-300`. This cross is the row's scanning cue and a
                  reader reads it; `--ui-ink-300` is the disabled/muted step and puts it at
                  2.17:1 on white against a WCAG 2.2 AA floor of 4.5:1. `--ui-ink-400` reads
                  5.11:1 and still sits quieter than the heading beside it. Same move as the
                  comparison table's cross. */}
              <span aria-hidden="true" className="flex-none font-mono text-[12px] text-muted-foreground">
                ✕
              </span>
              <span className="font-sans text-[15.5px] leading-[1.5] [font-weight:var(--ui-weight-heading)] tracking-[-0.01em] text-foreground">
                {bullet}
              </span>
            </div>
          ))}
        </div>
      </Container>
    </Section>
  );
}
