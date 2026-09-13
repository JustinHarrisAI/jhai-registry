/**
 * The mid-page CTA band. The dark card is the only ink surface between the case strip and
 * the testimonials, so it reads as a stop rather than a section.
 *
 * The export lays a grain overlay inside this card. `CTABand` (wave 1) does not take
 * children, and widening its API for one page would push a homepage detail into a
 * primitive every template shares, so the grain is skipped here rather than forked. Logged
 * to GAP-LEDGER.md.
 */

import type { ReactNode } from 'react';
import { CTABand } from './CTABand';
import { Container, Section } from './shell';
import type { CtaBandContent } from './content-types';

export function CtaBandSection({
  content,
  field,
}: {
  content: CtaBandContent;
  /** the capture slot — see CTABand. Omit for the statement-only shape. */
  field?: ReactNode;
}) {
  return (
    /* `!` because HomeStyles is unlayered and `.v2-section { padding: var(--section-y) 0 }`
       outranks any @layer utility. `pb-section-y` reads the same token the inline value did. */
    <Section label="CTA band" ground="paper" className="pt-0! pb-section-y!">
      <Container>
        <div data-rv="">
          <CTABand
            title={content.title}
            subline={content.subline}
            field={field}
            link={content.link}
          />
        </div>
      </Container>
    </Section>
  );
}
