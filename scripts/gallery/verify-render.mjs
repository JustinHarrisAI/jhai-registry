#!/usr/bin/env node
/**
 * verify-render.mjs — the second, stronger half of the proof.
 *
 * WHY A BUILD IS NOT ENOUGH
 *   run-batch proves an item compiles and its imports resolve. That is necessary and it is not
 *   what "I have this component" means. A component that compiles to an empty div is worse than
 *   one that fails, because it enters the catalog, gets picked for a wireframe slot, and renders
 *   nothing. So every item that built is mounted in a real browser against the built app and
 *   classified RENDERS / BLANK / CRASH_PROPS / CRASH.
 *
 * TWO FIXTURE PASSES, AND WHY
 *   The harness invents props from prop names. A name does not say whether `faq` is a string or
 *   a list, and guessing wrong throws. Pass 1 defaults unknown names to strings; anything that
 *   crashed is retried with the server restarted under HARNESS_FX=arr, which defaults them to
 *   lists. A component only stays CRASH_PROPS if neither shape works, and CRASH_PROPS is
 *   reported separately from CRASH because it is the harness's guess failing, not the component.
 *
 * THE PALETTE SPOT CHECK
 *   Rebranding is the point of the registry, so a per-registry sample has the shadcn semantic
 *   tokens overridden to deliberately absurd values and is re-measured. A component that paints
 *   from the token layer changes colour; one that hardcodes its palette does not.
 *
 * Usage:
 *   node verify-render.mjs --record /tmp/gallery2/out/hirael.json --port 4311
 */
import { spawn } from 'node:child_process';
import { mkdirSync, writeFileSync, readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { chromium } from 'playwright';

const args = Object.fromEntries(
  process.argv.slice(2).reduce((a, v, i, arr) => (v.startsWith('--') ? [...a, [v.slice(2), arr[i + 1]]] : a), [])
);
const RECORD = args.record;
const PORT = Number(args.port || 4390);
const SHOTS = args.shots || '/tmp/gallery2/shots';
const SAMPLE = Number(args.sample || 5);
const NAV_TIMEOUT = Number(args.navTimeout || 15000);

/** Deliberately absurd values: if a component paints from tokens, this is impossible to miss. */
const WILD = `:root{
  --background: oklch(0.22 0.09 300) !important;
  --foreground: oklch(0.95 0.18 95) !important;
  --card: oklch(0.28 0.12 300) !important;
  --card-foreground: oklch(0.95 0.18 95) !important;
  --popover: oklch(0.28 0.12 300) !important;
  --popover-foreground: oklch(0.95 0.18 95) !important;
  --primary: oklch(0.72 0.25 25) !important;
  --primary-foreground: oklch(0.15 0.02 300) !important;
  --secondary: oklch(0.45 0.2 150) !important;
  --secondary-foreground: oklch(0.98 0 0) !important;
  --muted: oklch(0.35 0.1 300) !important;
  --muted-foreground: oklch(0.85 0.15 95) !important;
  --accent: oklch(0.6 0.28 330) !important;
  --accent-foreground: oklch(0.98 0 0) !important;
  --destructive: oklch(0.65 0.3 20) !important;
  --border: oklch(0.7 0.25 190) !important;
  --input: oklch(0.7 0.25 190) !important;
  --ring: oklch(0.8 0.25 60) !important;
}`;

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

/** What the element actually painted: enough to tell "changed colour" from "did not". */
const PROBE = `(() => {
  const host = document.querySelector('[data-item]');
  if (!host) return { found: false };
  const els = [host, ...host.querySelectorAll('*')].slice(0, 400);
  const paint = els.map((e) => {
    const s = getComputedStyle(e);
    return s.backgroundColor + '|' + s.color + '|' + s.borderTopColor + '|' + s.backgroundImage.slice(0, 60);
  });
  const r = host.getBoundingClientRect();
  const text = (host.innerText || '').trim();
  const visible = els.filter((e) => {
    const b = e.getBoundingClientRect();
    const s = getComputedStyle(e);
    return b.width > 1 && b.height > 1 && s.visibility !== 'hidden' && s.display !== 'none' && s.opacity !== '0';
  }).length;
  return { found: true, nodes: els.length, visible, textLen: text.length,
           area: Math.round(r.width * r.height), paint };
})()`;

/**
 * Errors the HARNESS caused by mounting a component with invented props, not defects.
 * Calling these broken components would repeat run 1's mistake in a new place.
 */
const HARNESS_ERROR = new RegExp([
  'Objects are not valid as a React child',
  'Functions are not valid as a React child',
  'Cannot read propert(y|ies) of (undefined|null)',
  'is not a function',
  'is not iterable',
  'undefined is not an object',
  'void element tag',
  'Minified React error #(31|130|137|418|423|425)',
].join('|'), 'i');

function classify(p, httpStatus, errText) {
  const crash = httpStatus >= 500 || !p || !p.found;
  if (crash) return HARNESS_ERROR.test(errText) ? 'CRASH_PROPS' : 'CRASH';
  if (p.visible <= 1 && p.textLen === 0 && p.area < 2000) return 'BLANK';
  if (p.nodes <= 1 && p.textLen === 0) return 'BLANK';
  return 'RENDERS';
}

/*
 * The server log is the only place the REAL error text survives: a production Next build reports
 * React errors to the browser minified ("Minified React error #441"), which says nothing about
 * whether the component is broken or whether the harness handed it the wrong prop shape.
 */
function startServer(app, port, env) {
  const proc = spawn('pnpm', ['exec', 'next', 'start', '-p', String(port)], {
    cwd: app, stdio: ['ignore', 'pipe', 'pipe'], detached: true,
    env: { ...process.env, ...env },
  });
  const state = { proc, log: '' };
  const cap = (b) => {
    state.log += b.toString();
    if (state.log.length > 4_000_000) state.log = state.log.slice(-2_000_000);
  };
  proc.stdout.on('data', cap);
  proc.stderr.on('data', cap);
  return state;
}

async function waitForServer(port, ms = 90000) {
  const t0 = Date.now();
  while (Date.now() - t0 < ms) {
    try {
      const r = await fetch(`http://127.0.0.1:${port}/`, { signal: AbortSignal.timeout(3000) });
      if (r.status < 600) return true;
    } catch { /* not up yet */ }
    await sleep(700);
  }
  return false;
}

function stopServer(s) {
  try { process.kill(-s.proc.pid, 'SIGTERM'); } catch { /* already gone */ }
}

async function visit(page, server, port, slug, { shot } = {}) {
  const errs = [];
  const onErr = (e) => errs.push(String(e).slice(0, 300));
  page.on('pageerror', onErr);
  const mark = server.log.length;
  let status = 0, probe = null;
  try {
    const resp = await page.goto(`http://127.0.0.1:${port}/i/${slug}`, { waitUntil: 'domcontentloaded', timeout: NAV_TIMEOUT });
    status = resp?.status() ?? 0;
    await page.waitForTimeout(320);
    probe = await page.evaluate(PROBE);
  } catch (e) {
    errs.push(String(e.message || e).slice(0, 300));
  }
  page.off('pageerror', onErr);
  const serverErr = server.log.slice(mark)
    .split('\n').filter((l) => /error|Error|⨯/.test(l)).slice(0, 6).join('\n').slice(0, 900);
  const render = classify(probe, status, `${errs.join(' ')} ${serverErr}`);
  const out = { render, httpStatus: status, nodes: probe?.nodes ?? 0, visible: probe?.visible ?? 0,
                textLen: probe?.textLen ?? 0, area: probe?.area ?? 0,
                errors: errs.slice(0, 2), serverError: serverErr || undefined, probe };
  if (render === 'RENDERS' && shot) {
    try {
      const el = await page.$('[data-item]');
      await (el || page).screenshot({ path: join(SHOTS, shot), type: 'webp', quality: 55 });
      out.shot = shot;
    } catch (e) { out.shotError = String(e.message || e).slice(0, 160); }
  }
  return out;
}

async function main() {
  const rec = JSON.parse(readFileSync(RECORD, 'utf8'));
  const app = rec.summary.appDir;
  const reg = rec.summary.registry;
  const regDir = reg.replace('@', '');
  const targets = rec.items.filter((i) => i.status === 'BUILT' && i.route);
  const outPath = RECORD.replace(/\.json$/, '.render.json');
  if (!targets.length || !app || !existsSync(app)) {
    writeFileSync(outPath, JSON.stringify({ registry: reg, counts: {}, rendered: {}, palette: null,
      note: 'nothing to render' }, null, 1));
    return;
  }
  mkdirSync(join(SHOTS, regDir), { recursive: true });

  const rendered = {};
  let palette = null;
  let server = startServer(app, PORT, {});
  let browser;
  try {
    if (!await waitForServer(PORT)) throw new Error(`next start never answered on :${PORT}`);
    browser = await chromium.launch();
    const ctx = await browser.newContext({ viewport: { width: 1280, height: 800 }, deviceScaleFactor: 1 });
    const page = await ctx.newPage();
    page.setDefaultTimeout(NAV_TIMEOUT);

    for (const it of targets) {
      rendered[it.slug] = await visit(page, server, PORT, it.slug, { shot: join(regDir, `${it.slug}.webp`) });
    }

    // Pass 2: only what the string-shaped fixture crashed on, retried with list-shaped props.
    const retry = Object.entries(rendered).filter(([, v]) => v.render === 'CRASH_PROPS').map(([s]) => s);
    if (retry.length) {
      stopServer(server);
      await sleep(1200);
      server = startServer(app, PORT + 1, { HARNESS_FX: 'arr' });
      if (await waitForServer(PORT + 1)) {
        for (const slug of retry) {
          const r = await visit(page, server, PORT + 1, slug, { shot: join(regDir, `${slug}.webp`) });
          if (r.render === 'RENDERS' || r.render === 'BLANK') {
            rendered[slug] = { ...r, fixturePass: 'arr' };
          } else {
            rendered[slug].retriedWithLists = true;
          }
        }
      }
    }

    // Palette spot check on a sample that actually renders, against whichever server is up.
    const activePort = retry.length ? PORT + 1 : PORT;
    const sample = Object.entries(rendered)
      .filter(([, v]) => v.render === 'RENDERS' && v.probe?.paint?.length > 3)
      .slice(0, SAMPLE).map(([s]) => s);
    if (sample.length) {
      const results = [];
      for (const slug of sample) {
        let after = null;
        try {
          const p2 = await ctx.newPage();
          await p2.addInitScript((css) => {
            const put = () => {
              const s = document.createElement('style'); s.textContent = css; document.head.appendChild(s);
            };
            if (document.head) put(); else document.addEventListener('DOMContentLoaded', put);
          }, WILD);
          await p2.goto(`http://127.0.0.1:${activePort}/i/${slug}`, { waitUntil: 'domcontentloaded', timeout: NAV_TIMEOUT });
          await p2.waitForTimeout(400);
          after = await p2.evaluate(PROBE);
          await p2.close();
        } catch { /* recorded as an error below */ }
        const base = rendered[slug].probe;
        if (after?.paint && base?.paint) {
          const n = Math.min(after.paint.length, base.paint.length);
          let changed = 0;
          for (let i = 0; i < n; i++) if (after.paint[i] !== base.paint[i]) changed++;
          results.push({ slug, nodes: n, changed, ratio: n ? +(changed / n).toFixed(3) : 0 });
        } else {
          results.push({ slug, error: 'probe failed' });
        }
      }
      const ok = results.filter((r) => typeof r.ratio === 'number');
      const mean = ok.length ? +(ok.reduce((a, r) => a + r.ratio, 0) / ok.length).toFixed(3) : null;
      palette = {
        sampled: results.length, meanChangedRatio: mean,
        verdict: mean === null ? 'UNKNOWN' : mean >= 0.25 ? 'RETOKENS' : mean >= 0.08 ? 'PARTIAL' : 'IGNORES_TOKENS',
        results,
      };
    }
  } catch (e) {
    for (const v of Object.values(rendered)) delete v.probe;
    writeFileSync(outPath, JSON.stringify({ registry: reg, rendered, palette, fatal: String(e.message || e) }, null, 1));
    if (browser) await browser.close().catch(() => {});
    stopServer(server);
    return;
  }
  if (browser) await browser.close().catch(() => {});
  stopServer(server);

  for (const v of Object.values(rendered)) delete v.probe;   // paint arrays are huge and served their purpose
  const counts = Object.values(rendered).reduce((a, v) => (a[v.render] = (a[v.render] || 0) + 1, a), {});
  writeFileSync(outPath, JSON.stringify({ registry: reg, counts, palette, rendered }, null, 1));
  console.log(`[${reg}] render ${JSON.stringify(counts)} palette=${palette?.verdict || 'n/a'}`);
}

main().catch((e) => { console.error('FATAL', e.message); process.exit(1); });
