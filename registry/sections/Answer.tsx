/**
 * The answer: six ticked pillars against a cut-out portrait.
 *
 * The portrait is the counterweight this section needs. It is contained in a
 * 440px column with a soft mask at its foot rather than bleeding to the section edge, so
 * the figure meets the paper instead of being cropped by it.
 */

import { Eyebrow } from './Eyebrow';
import { Container, Section } from './shell';
import type { AnswerContent } from './content-types';

export function Answer({ content }: { content: AnswerContent }) {
  return (
    /* `!` because HomeStyles is unlayered and its `.v2-section` padding outranks any
       @layer utility. 150px is the export's own frozen number, not `pt-section-y`, which
       steps to 90px under 760px where this band never has. */
    <Section id="answer" label="The answer" ground="white" className="pt-[150px]! pb-0!">
      <Container className="v2-split grid grid-cols-[minmax(0,8fr)_minmax(240px,4fr)] items-end gap-14">
        <div className="pb-[100px]">
          <Eyebrow number={content.number}>{content.label}</Eyebrow>
          <h2
            data-rv=""
            className="mt-eyebrow-gap font-sans text-type-feature leading-[1.02] [font-weight:var(--weight-heading)] tracking-[-0.04em] text-text-heading"
          >
            {content.titleLead}
            <em className="italic">{content.titleEm}</em>
          </h2>
          <p
            data-rv=""
            className="mt-6 max-w-measure-lede font-sans text-[19px] leading-[1.5] text-text-body"
          >
            {content.ledeLead}
            <em className="italic text-text-heading">{content.ledeEm}</em>
          </p>
          <div data-rv="" className="v2-grid-2 mt-12 gap-x-12 gap-y-10">
            {content.pillars.map((pillar) => (
              <div key={pillar.title}>
                <div className="flex items-baseline gap-[14px]">
                  <span aria-hidden="true" className="flex-none font-mono text-[23px] text-bjarmi-ink">
                    ✓
                  </span>
                  <h3 className="font-sans text-[clamp(26px,2.4vw,34px)] leading-[1.08] [font-weight:var(--weight-heading)] tracking-[-0.03em] text-text-heading">
                    {pillar.title}
                  </h3>
                </div>
                <p className="mt-2.5 ml-[30px] max-w-[400px] font-sans text-type-body leading-[1.6] text-text-body">
                  {pillar.body}
                </p>
              </div>
            ))}
          </div>
        </div>
        <div
          id="answer-figure"
          className="v2-split-media w-full max-w-[440px] justify-self-end self-end overflow-hidden"
        >
          {/* Both filter and mask are written as whole declarations: the filter so grayscale
              still runs BEFORE contrast (Tailwind's filter chain would reverse them), the
              mask because the soft foot is one gradient in two spellings. */}
          <img
            src={content.image}
            alt={content.imageAlt}
            className="block h-auto w-full [filter:grayscale(1)_contrast(1.06)] [-webkit-mask-image:linear-gradient(180deg,#000_88%,transparent_100%)] [mask-image:linear-gradient(180deg,#000_88%,transparent_100%)]"
          />
        </div>
      </Container>
    </Section>
  );
}
