/**
 * Pricing — plan cards, optionally over a feature comparison.
 *
 * The three things `ComparisonTable` has no slot for are the three things a pricing section
 * is: a PRICE, a BILLING NOTE and a PER-PLAN CTA. jhai-composer rendered all three as local
 * markup above the table for exactly that reason. They live here now.
 *
 * `price` is a STRING and is never computed. "$95/mo", "From $1,200", "Free" and "Let's talk"
 * are all legitimate and none of them is a number. A component that took a number and a
 * period would have to own currency, rounding and pluralisation, and would still be wrong for
 * the fourth case.
 *
 * `highlight` is one plan or none. The highlighted card opens a nested `.dark` scope — the
 * same device shell.tsx uses for an ink band — so it reads as the chosen plan against the
 * consuming project's own dark palette. It does NOT paint a fixed grey, and it does not use
 * `text-card`, which is the bug that made ComparisonTable's highlighted column invisible.
 *
 * `cards-with-comparison` reuses `ComparisonTable` rather than growing a second table. The
 * plans become its columns, in plan order, so the two halves cannot drift out of sync.
 */

import { Button } from './Button';
import { ComparisonTable } from './ComparisonTable';
import { Eyebrow } from './Eyebrow';
import { Container, Section } from './shell';
import type { Ground } from './shell';
import type { PricingContent, PricingPlan } from './content-types';

export type PricingVariant = 'cards' | 'cards-with-comparison';

/*
 * Tailwind utilities, not `v2-grid-*`. See the note in Testimonials: those classes come from
 * HomeStyles, and a section that needs a stylesheet mounted elsewhere to keep its columns is
 * not self-sufficient. Measured — the plan cards stacked in jhai-composer.
 */
const CARD_GRID: Record<number, string> = {
  1: 'grid grid-cols-1',
  2: 'grid grid-cols-1 md:grid-cols-2',
  3: 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3',
  4: 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4',
};

function PlanCard({ plan }: { plan: PricingPlan }) {
  const dark = plan.highlight === true;

  return (
    <div
      className={[
        'v2-card-h flex h-full flex-col border border-border p-8',
        /* See the header: a scope, not a literal. Inside it every semantic below inverts. */
        dark ? 'dark bg-background text-foreground' : 'bg-card',
      ].join(' ')}
    >
      <p className="m-0 font-mono text-ui-eyebrow tracking-[0.24em] text-muted-foreground uppercase">
        {plan.label}
      </p>
      <p className="mt-4 m-0 font-sans text-ui-feature leading-[1.02] [font-weight:var(--ui-weight-heading)] tracking-[-0.04em] tabular-nums text-foreground">
        {plan.price}
      </p>
      {plan.note ? (
        <p className="mt-2 m-0 font-sans text-ui-small leading-[1.5] text-muted-foreground">
          {plan.note}
        </p>
      ) : null}
      {plan.action ? (
        /* `mt-auto` so every CTA in a row sits on the same baseline no matter how long the
           note above it ran. The row is the unit the eye reads, not the card. */
        <div className="mt-auto pt-8">
          <Button href={plan.action.href} size="nav">
            {plan.action.label}
          </Button>
        </div>
      ) : null}
    </div>
  );
}

export function Pricing({
  content,
  variant = 'cards',
  ground = 'paper',
}: {
  content: PricingContent;
  variant?: PricingVariant;
  ground?: Ground;
}) {
  const { number, label, title, rowHeading, plans, rows } = content;
  const withTable = variant === 'cards-with-comparison' && Boolean(rows?.length);

  return (
    <Section id="pricing" label="Pricing" ground={ground}>
      <Container>
        {label || title ? (
          <div className="flex flex-col gap-ui-eyebrow-gap">
            {label ? <Eyebrow number={number}>{label}</Eyebrow> : null}
            {title ? (
              <h2 className="m-0 max-w-ui-measure-heading font-sans text-ui-section leading-[1.06] [font-weight:var(--ui-weight-heading)] tracking-[-0.035em] text-foreground">
                {title}
              </h2>
            ) : null}
          </div>
        ) : null}

        <div
          className={[
            label || title ? 'mt-ui-gap-grid' : '',
            CARD_GRID[plans.length] ?? 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3',
            'gap-ui-gap-card',
          ]
            .filter(Boolean)
            .join(' ')}
        >
          {plans.map((plan) => (
            <PlanCard key={plan.label} plan={plan} />
          ))}
        </div>

        {withTable ? (
          <div className="mt-ui-gap-grid">
            <ComparisonTable
              rowHeading={rowHeading}
              caption={title}
              columns={plans.map((p) => ({
                label: p.label,
                note: p.note,
                highlight: p.highlight,
              }))}
              rows={(rows ?? []).map((row) => ({
                label: row.label,
                /* "yes" / "no" become the table's own marks; anything else is literal text,
                   which is what lets a row say "6" or "pay each" without a second API. */
                values: row.values.map((v) => {
                  const t = v.trim().toLowerCase();
                  if (t === 'yes' || t === 'true') return true;
                  if (t === 'no' || t === 'false') return false;
                  return v;
                }),
              }))}
            />
          </div>
        ) : null}
      </Container>
    </Section>
  );
}
