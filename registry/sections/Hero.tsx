/**
 * Hero — eyebrow, headline, subhead, actions, optional media.
 *
 * jhai-composer assembled a hero out of atoms because this did not exist. It exists now, and
 * the one thing it does that the ad-hoc version could not is treat MISSING MEDIA as a first-
 * class state rather than an error.
 *
 * `media.src` is optional. Omit it and `ImageSlot` draws its grey plate at the declared
 * ratio, so a hero can be placed in a wireframe before a single photograph has been chosen.
 * That is the whole reason `Answer` needed a local workaround downstream: it hard-requires a
 * URL, so a placeholder composition had to fork the layout. Do not add a required `src` here.
 *
 * `actions` is an array and the FIRST entry is the primary. That is a rendering rule, not
 * content, so it lives here rather than as an `intent` field the caller has to set correctly
 * every time. Two actions is the house pattern; a third renders and is a taste question.
 *
 * `display` scale on the headline, not `section`: a hero headline is the largest type on the
 * page and the scale is what makes it read as the top of the document.
 */

import { Button } from './Button';
import { Eyebrow } from './Eyebrow';
import { ImageSlot } from './ImageSlot';
import { Container, Section } from './shell';
import type { Ground } from './shell';
import type { HeroContent } from './content-types';

export type HeroVariant = 'centered' | 'split';

export function Hero({
  content,
  variant = 'centered',
  ground = 'paper',
}: {
  content: HeroContent;
  variant?: HeroVariant;
  ground?: Ground;
}) {
  const { eyebrow, headline, subhead, actions, media } = content;
  const split = variant === 'split';

  const copy = (
    <div className={split ? '' : 'flex flex-col items-center text-center'}>
      {eyebrow ? <Eyebrow>{eyebrow}</Eyebrow> : null}
      <h1
        className={[
          'mt-ui-eyebrow-gap mr-0 mb-0 ml-0 font-sans text-ui-hero leading-[0.98] [font-weight:var(--ui-weight-heading)] tracking-[-0.045em] text-balance text-foreground',
          split ? 'max-w-ui-measure-heading' : 'max-w-ui-measure-statement',
        ].join(' ')}
      >
        {headline}
      </h1>
      {subhead ? (
        <p
          className={[
            'mt-6 m-0 max-w-ui-measure-lede font-sans text-ui-lede leading-[1.6] text-muted-foreground',
            split ? '' : 'mx-auto',
          ].join(' ')}
        >
          {subhead}
        </p>
      ) : null}
      {actions.length ? (
        <div
          className={[
            'mt-10 flex flex-wrap items-center gap-ui-gap-inline',
            split ? '' : 'justify-center',
          ].join(' ')}
        >
          {actions.map((action, i) => (
            <Button
              key={action.href + action.label}
              href={action.href}
              variant={i === 0 ? 'primary' : 'ghost'}
            >
              {action.label}
            </Button>
          ))}
        </div>
      ) : null}
    </div>
  );

  /* The centred hero runs wider and shorter; the split one is taller and sits beside the copy.
     Two ratios, one component, and the caller can override either with `media.ratio`. */
  const plate = media ? (
    <ImageSlot
      src={media.src}
      alt={media.alt ?? ''}
      placeholder={media.placeholder ?? 'Drop: hero image'}
      ratio={media.ratio ?? (split ? '4/3' : '16/7')}
    />
  ) : null;

  return (
    <Section id="hero" label="Hero" ground={ground}>
      <Container>
        {split ? (
          <div className="grid grid-cols-1 items-center gap-ui-gap-grid lg:grid-cols-2">
            {copy}
            {plate ? <div>{plate}</div> : null}
          </div>
        ) : (
          <>
            {copy}
            {plate ? <div className="mt-ui-gap-grid">{plate}</div> : null}
          </>
        )}
      </Container>
    </Section>
  );
}
