import { StatTile } from './StatTile';
import { Container, Section } from './shell';
import type { Ground } from './shell';
import type { StatEntry } from './content-types';

export function RecordBand({
  stats,
  /* BOTH ADDED 2026-08-14, both optional, both defaulting to what this band has always done,
     so the approved homepage and the four interior page types render byte-identically.

     WHY. The two hubs are four bands total and one of them is the proof band (DECISIONS.md
     D9: the homepage's four figures, sitewide, unchanged). This band has always assumed a
     `LogoWall` directly above it on the same paper — the one same-ground adjacency design.md
     sanctions, and the reason its top padding is zero. Mounted alone it needs its own ground
     and its own air, or it reads as a band that lost the thing above it.

     `standalone` governs the padding only and `ground` governs the ground only. Neither
     infers the other, because a later caller could want either without the other. */
  ground = 'paper',
  standalone = false,
}: {
  stats: StatEntry[];
  ground?: Ground;
  standalone?: boolean;
}) {
  return (
    /* `!` on the padding because HomeStyles is unlayered CSS and its `.v2-section` padding
       therefore outranks any @layer utility. `pb-section-y` reads the same token the inline
       value read, so the band still steps down under 760px. */
    <Section
      id="record"
      label="Result band"
      ground={ground}
      className={standalone ? 'py-section-y!' : 'pt-0! pb-section-y!'}
    >
      <Container>
        {/* The 104px is the gap up to the logo wall this band hangs off. Standing alone there
            is nothing above it inside the section, so the row starts on the section padding. */}
        <div className={`v2-grid-4 gap-x-0 gap-y-8 ${standalone ? '' : 'pt-[104px]'}`}>
          {stats.map((stat, i) => {
            /* The figure counts up on entry, which is the export's behaviour. StatTile is a
               shared primitive this lane does not own, so the count attributes ride on a
               wrapper and `data-count-in` names the descendant the runtime writes into. The
               target number is parsed off the authored value, never typed here. */
            const parts = /^(\D*)(\d+(?:\.\d+)?)(.*)$/.exec(stat.value);
            /* The first tile loses its left padding so the row starts on the container edge.
               StatTile takes no className and paints its own padding inline, so the override
               is a child selector and has to carry `!` to outrank that inline style. */
            return (
              <div
                key={stat.label}
                data-rv={i}
                className={i === 0 ? '[&>div]:pl-0!' : undefined}
                {...(parts
                  ? {
                      'data-count': parts[2],
                      'data-count-prefix': parts[1],
                      'data-count-suffix': parts[3],
                      'data-count-in': ':scope > div > div:first-child',
                    }
                  : null)}
              >
                <StatTile value={stat.value} label={stat.label} divider={i > 0} />
              </div>
            );
          })}
        </div>
      </Container>
    </Section>
  );
}
