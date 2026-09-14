/**
 * The questions. Native details elements, so the page needs no script to open one and a
 * find-in-page hit inside a closed answer still resolves.
 *
 * `FAQItem` keeps its native <details> and is NOT a candidate for `@/components/ui/accordion`
 * That file belongs to another lane agent and is untouched here.
 *
 * Inline styles became Tailwind utilities. The closing
 * hairline under the last row used to be a per-index `style` prop passed into FAQItem; it
 * is now a last-child variant on the stack, which is the same rule stated once.
 */

import { FAQItem } from './FAQItem';
import { Eyebrow } from './Eyebrow';
import { Container, Section } from './shell';
import type { QuestionsContent } from './content-types';

export function Questions({ content }: { content: QuestionsContent }) {
  return (
    <Section id="questions" label="FAQ" ground="paper">
      <Container className="flex flex-col items-center">
        <div className="flex flex-col items-center gap-4.5 text-center">
          <Eyebrow number={content.number}>{content.label}</Eyebrow>
          <h2
            data-rv=""
            className="m-0 font-sans text-type-section leading-[1.06] [font-weight:var(--weight-heading)] tracking-[-0.035em] text-text-heading"
          >
            {content.title}
          </h2>
          <p className="m-0 max-w-[460px] font-sans text-type-body leading-[1.62] text-text-secondary">
            {content.lede}
          </p>
        </div>
        {/* the stack closes on a hairline: every row carries a top border, so the last one
            needs a bottom. Stated once here rather than as a per-row style prop. */}
        <div className="mt-16 w-full max-w-[760px] [&>details:last-child]:border-b">
          {content.faq.map((row) => (
            <FAQItem key={row.q} question={row.q}>
              {row.a}
            </FAQItem>
          ))}
        </div>
      </Container>
    </Section>
  );
}
