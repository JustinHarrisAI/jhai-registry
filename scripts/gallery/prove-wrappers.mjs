#!/usr/bin/env node
/**
 * prove-wrappers.mjs — evidence, not assertion, that each adopted dependency actually wraps.
 *
 * The rule this exists to satisfy: a library only counts as adopted once a @jhai item wraps it
 * and that wrapper is shown to take a client palette with no edits. Saying "it should work" is
 * how the dogfood's unwired baseline ended up claiming it was rebrandable when it was not.
 *
 * So this installs the four wrappers from the live registry into a throwaway project on the
 * shadcn default neutral palette, uses each one the way a real page would, builds, and then
 * re-renders the same page with the semantic tokens overridden to absurd values. A wrapper
 * passes when the page compiles, renders visibly, and MOVES under the palette swap.
 *
 * Writes docs/WRAPPER-PROOF.json and two screenshots into docs/gallery/proof/.
 */
import { execSync, spawn } from 'node:child_process';
import { mkdirSync, writeFileSync, readFileSync, existsSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import { chromium } from 'playwright';
import { peersFor } from './lib/peers.mjs';

const ROOT = process.argv[2] || process.cwd();
const WORK = process.argv[3] || '/tmp/wrapper-proof';
const PORT = Number(process.argv[4] || 4520);
const CLI = 'shadcn@4.21.0';
const ITEMS = ['@jhai/theme-base', '@jhai/chart', '@jhai/carousel-rail', '@jhai/reveal', '@jhai/contact-form'];

const sh = (cmd, opts = {}) =>
  execSync(cmd, { encoding: 'utf8', stdio: 'pipe', timeout: 1800000, maxBuffer: 64 * 1024 * 1024, ...opts });
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const WILD = `:root{
  --background: oklch(0.22 0.09 300) !important; --foreground: oklch(0.95 0.18 95) !important;
  --card: oklch(0.28 0.12 300) !important; --primary: oklch(0.72 0.25 25) !important;
  --primary-foreground: oklch(0.15 0.02 300) !important; --secondary: oklch(0.45 0.2 150) !important;
  --muted: oklch(0.35 0.1 300) !important; --muted-foreground: oklch(0.85 0.15 95) !important;
  --accent: oklch(0.6 0.28 330) !important; --destructive: oklch(0.65 0.3 20) !important;
  --border: oklch(0.7 0.25 190) !important; --input: oklch(0.7 0.25 190) !important;
  --ring: oklch(0.8 0.25 60) !important;
  --chart-1: oklch(0.72 0.25 25) !important; --chart-2: oklch(0.45 0.2 150) !important;
  --chart-3: oklch(0.6 0.28 330) !important;
}`;

const PROBE = `(() => {
  const host = document.querySelector('[data-proof]');
  if (!host) return { found: false };
  const els = [host, ...host.querySelectorAll('*')].slice(0, 600);
  const paint = els.map((e) => { const s = getComputedStyle(e);
    return s.backgroundColor + '|' + s.color + '|' + s.borderTopColor + '|' + s.fill + '|' + s.stroke; });
  const byBlock = {};
  for (const b of host.querySelectorAll('[data-block]')) {
    const r = b.getBoundingClientRect();
    byBlock[b.getAttribute('data-block')] = { w: Math.round(r.width), h: Math.round(r.height),
      text: (b.innerText || '').trim().length, nodes: b.querySelectorAll('*').length };
  }
  return { found: true, nodes: els.length, paint, byBlock };
})()`;

/* A page that uses each wrapper the way a real service site would, not a smoke test. */
const PAGE = `'use client';
import { Chart } from "@/components/jhai/Chart";
import { CarouselRail } from "@/components/jhai/CarouselRail";
import { Reveal } from "@/components/jhai/Reveal";
import { ContactForm } from "@/components/jhai/ContactForm";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip } from "recharts";

const DATA = [
  { month: "Jan", leads: 18, booked: 7 }, { month: "Feb", leads: 24, booked: 11 },
  { month: "Mar", leads: 31, booked: 16 }, { month: "Apr", leads: 27, booked: 14 },
  { month: "May", leads: 38, booked: 21 }, { month: "Jun", leads: 44, booked: 26 },
];

export const dynamic = "force-dynamic";

export default function Proof() {
  return (
    <main data-proof className="mx-auto max-w-5xl bg-background p-10 text-foreground">
      <section data-block="chart" className="mb-12">
        <Chart height={260} caption="Leads and booked work, six months">
          <BarChart data={DATA}>
            <CartesianGrid stroke="var(--series-grid)" vertical={false} />
            <XAxis dataKey="month" stroke="var(--series-axis)" tickLine={false} />
            <YAxis stroke="var(--series-axis)" tickLine={false} />
            <Tooltip cursor={{ fill: "var(--series-grid)" }} />
            <Bar dataKey="leads" fill="var(--series-1)" radius={[3, 3, 0, 0]} />
            <Bar dataKey="booked" fill="var(--series-2)" radius={[3, 3, 0, 0]} />
          </BarChart>
        </Chart>
      </section>

      <section data-block="carousel" className="mb-12">
        <CarouselRail label="Recent work">
          {[1, 2, 3, 4, 5].map((n) => (
            <article key={n} className="rounded-[var(--ui-radius-card)] border border-border bg-card p-6 text-card-foreground">
              <h3 className="text-ui-card-title">Project {n}</h3>
              <p className="text-ui-body text-muted-foreground">A short line about the engagement.</p>
            </article>
          ))}
        </CarouselRail>
      </section>

      <section data-block="reveal" className="mb-12">
        <Reveal from="up">
          <div className="rounded-[var(--ui-radius-card)] bg-muted p-8 text-muted-foreground">
            <p className="text-ui-lede">This block enters on scroll, at the theme&apos;s own duration.</p>
          </div>
        </Reveal>
      </section>

      <section data-block="form" className="max-w-md">
        <ContactForm onSubmit={async () => {}} />
      </section>
    </main>
  );
}
`;

async function waitForServer(port, ms = 90000) {
  const t0 = Date.now();
  while (Date.now() - t0 < ms) {
    try { const r = await fetch(`http://127.0.0.1:${port}/proof`, { signal: AbortSignal.timeout(3000) });
      if (r.status < 600) return true; } catch { /* not up */ }
    await sleep(700);
  }
  return false;
}

const result = { date: new Date().toISOString().slice(0, 10), items: ITEMS, steps: {} };
const dir = WORK;
rmSync(dir, { recursive: true, force: true });
mkdirSync(dir, { recursive: true });

sh(`pnpm dlx create-next-app@latest app --ts --tailwind --eslint --app --src-dir --import-alias "@/*" --use-pnpm --no-turbopack --yes`, { cwd: dir });
const app = join(dir, 'app');
const registries = JSON.parse(readFileSync(join(ROOT, 'registry/components.registries.json'), 'utf8')).registries;
writeFileSync(join(app, 'components.json'), JSON.stringify({
  $schema: 'https://ui.shadcn.com/schema.json', style: 'new-york', rsc: true, tsx: true,
  tailwind: { config: '', css: 'src/app/globals.css', baseColor: 'neutral', cssVariables: true, prefix: '' },
  iconLibrary: 'lucide',
  aliases: { components: '@/components', utils: '@/lib/utils', ui: '@/components/ui', lib: '@/lib', hooks: '@/hooks' },
  registries,
}, null, 2));
writeFileSync(join(app, 'pnpm-workspace.yaml'),
  'allowBuilds:\n  es5-ext: false\n  sharp: false\n  unrs-resolver: false\nstrictDepBuilds: false\n');
rmSync(join(app, 'next.config.ts'), { force: true });
writeFileSync(join(app, 'next.config.mjs'), 'export default { images: { unoptimized: true } };\n');
mkdirSync(join(app, 'src/lib'), { recursive: true });
writeFileSync(join(app, 'src/lib/utils.ts'),
  'import { clsx, type ClassValue } from "clsx";\nimport { twMerge } from "tailwind-merge";\nexport function cn(...i: ClassValue[]) { return twMerge(clsx(i)); }\n');
sh(`pnpm add ${peersFor('radix-only').join(' ')}`, { cwd: app });

/*
 * cssVars only apply to items named on the command line, never to one pulled in as a registry
 * dependency, so the theme is installed explicitly and first. This was a real defect: the theme
 * arrived silently empty when it came in behind another item.
 */
const installOut = sh(`yes y | pnpm dlx ${CLI} add ${ITEMS.map((i) => `"${i}"`).join(' ')} --yes --overwrite 2>&1`,
  { cwd: app, shell: '/bin/bash' });
result.steps.install = { ok: !/Something went wrong/i.test(installOut), tail: installOut.slice(-600) };

mkdirSync(join(app, 'src/app/proof'), { recursive: true });
writeFileSync(join(app, 'src/app/proof/page.tsx'), PAGE);

try {
  sh('pnpm exec tsc --noEmit -p tsconfig.json 2>&1', { cwd: app, shell: '/bin/bash' });
  result.steps.typecheck = { ok: true };
} catch (e) {
  result.steps.typecheck = { ok: false, out: ((e.stdout || '') + (e.stderr || '')).slice(-1800) };
}
try {
  sh('pnpm exec next build 2>&1', { cwd: app, shell: '/bin/bash' });
  result.steps.build = { ok: true };
} catch (e) {
  result.steps.build = { ok: false, out: ((e.stdout || '') + (e.stderr || '')).slice(-1800) };
}

if (result.steps.build.ok) {
  const server = spawn('pnpm', ['exec', 'next', 'start', '-p', String(PORT)], { cwd: app, stdio: 'ignore', detached: true });
  try {
    if (!await waitForServer(PORT)) throw new Error('server never answered');
    const browser = await chromium.launch();
    const ctx = await browser.newContext({ viewport: { width: 1180, height: 1400 }, deviceScaleFactor: 1 });
    const shots = join(ROOT, 'docs/gallery/proof');
    mkdirSync(shots, { recursive: true });

    const base = await ctx.newPage();
    await base.goto(`http://127.0.0.1:${PORT}/proof`, { waitUntil: 'domcontentloaded' });
    await base.waitForTimeout(1200);
    const before = await base.evaluate(PROBE);
    await base.screenshot({ path: join(shots, 'wrappers-neutral.webp'), type: 'webp', quality: 70, fullPage: true });
    await base.close();

    const wild = await ctx.newPage();
    await wild.addInitScript((css) => {
      const put = () => { const s = document.createElement('style'); s.textContent = css; document.head.appendChild(s); };
      if (document.head) put(); else document.addEventListener('DOMContentLoaded', put);
    }, WILD);
    await wild.goto(`http://127.0.0.1:${PORT}/proof`, { waitUntil: 'domcontentloaded' });
    await wild.waitForTimeout(1200);
    const after = await wild.evaluate(PROBE);
    await wild.screenshot({ path: join(shots, 'wrappers-swapped.webp'), type: 'webp', quality: 70, fullPage: true });
    await wild.close();
    await browser.close();

    const n = Math.min(before.paint?.length || 0, after.paint?.length || 0);
    let changed = 0;
    for (let i = 0; i < n; i++) if (before.paint[i] !== after.paint[i]) changed++;
    result.steps.render = {
      ok: !!before.found,
      blocks: before.byBlock,
      everyBlockRendered: Object.values(before.byBlock || {}).every((b) => b.h > 20 && b.nodes > 0),
    };
    result.steps.palette = {
      nodes: n, changed, ratio: n ? +(changed / n).toFixed(3) : 0,
      verdict: n && changed / n >= 0.25 ? 'RETOKENS' : changed ? 'PARTIAL' : 'IGNORES_TOKENS',
      screenshots: ['docs/gallery/proof/wrappers-neutral.webp', 'docs/gallery/proof/wrappers-swapped.webp'],
    };
  } catch (e) {
    result.steps.render = { ok: false, error: String(e.message || e) };
  }
  try { process.kill(-server.pid); } catch { /* gone */ }
}

result.verdict = result.steps.install?.ok && result.steps.build?.ok
  && result.steps.render?.everyBlockRendered && result.steps.palette?.verdict === 'RETOKENS'
  ? 'PROVEN' : 'NOT PROVEN';
writeFileSync(join(ROOT, 'docs/WRAPPER-PROOF.json'), JSON.stringify(result, null, 1));
console.log(JSON.stringify({ verdict: result.verdict, build: result.steps.build?.ok,
  typecheck: result.steps.typecheck?.ok, palette: result.steps.palette?.verdict,
  blocks: result.steps.render?.blocks }, null, 1));
