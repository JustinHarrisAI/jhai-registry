#!/usr/bin/env node
/**
 * resolve-licenses.mjs — establish the ASSET / POINTER label for every wired registry.
 *
 * The label decides what may be copied into @jhai and re-served, so it has to come from the
 * LICENSE text, not from a badge or an assumption. ASSET means a permissive grant that permits
 * redistribution. POINTER means the components are installable in client work but may not be
 * copied into @jhai — Commons Clause and the "do not redistribute separate from an End Product"
 * family land here.
 *
 * Writes docs/LICENSES.json.
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const ROOT = process.argv[2] || process.cwd();
const UA = { 'User-Agent': 'Mozilla/5.0' };
const ASSET_LICENSE = /\b(MIT License|Apache License|BSD|ISC License|The Unlicense|CC0|Mozilla Public License)\b/i;
const COMMONS_CLAUSE = /Commons Clause/i;
const NON_REDIST = /(resell|redistribute)[^.]{0,120}(separate from|components themselves|ported version)/i;

/*
 * Homepages are the only reliable way in: a registry URL is a JSON endpoint and rarely says who
 * publishes it. These are the human-facing sites the registry endpoints belong to.
 */
const HOMEPAGE = {
  '@jhai': 'https://github.com/JustinHarrisAI/jhai-registry',
  '@tailark-oss': 'https://oss.tailark.com',
  '@kibo-ui': 'https://www.kibo-ui.com',
  '@magicui': 'https://magicui.design',
  '@blocks-so': 'https://blocks.so',
  '@fancy': 'https://www.fancycomponents.dev',
  '@hirael': 'https://hirael.com',
  '@bundui': 'https://bundui.io',
  '@flx': 'https://ui.flexnative.com',
  '@ilinxa': 'https://ui.ilinxa.com',
  '@8bitcn': 'https://www.8bitcn.com',
  '@cnippet': 'https://ui.cnippet.dev',
  '@ns-ui': 'https://design.helpmarq.com',
  '@pulld': 'https://pulld.pages.dev',
  '@vllnt-ui': 'https://ui.vllnt.com',
  '@shadcnui-blocks': 'https://shadcnui-blocks.com',
  '@nusaiba': 'https://nusaiba.dev',
};

/** Repos the homepage does not advertise, established by hand and recorded so they are auditable. */
const KNOWN_REPO = {
  '@jhai': 'JustinHarrisAI/jhai-registry',
  '@tailark-oss': 'tailark/blocks',
  '@kibo-ui': 'shadcnblocks/kibo',
  '@magicui': 'magicuidesign/magicui',
  '@blocks-so': 'ephraimduncan/blocks',
  '@fancy': 'danielpetho/fancy',
  '@8bitcn': 'TheOrcDev/8bitcn-ui',
  '@shadcnui-blocks': 'akash3444/shadcn-ui-blocks',
};

/*
 * Registries whose publisher could not be identified from the site or the index. They stay
 * POINTER-by-default: an unread licence is not a permissive one, and the cost of being wrong is
 * redistributing someone's work from @jhai without a grant. Installing them into client work is
 * unaffected — that is what POINTER means.
 */
const NO_REPO_FOUND = {
  '@pulld': 'site serves the registry only; no repository or licence published',
  '@vllnt-ui': 'site serves the registry only; no repository or licence published',
  '@nusaiba': 'site serves the registry only; no repository or licence published',
  '@kibo-ui': 'repository not resolvable from the site; licence not read',
  '@8bitcn': 'repository found but no LICENSE file present on main or master',
};

const get = async (url) => {
  try {
    const r = await fetch(url, { headers: UA, signal: AbortSignal.timeout(25000) });
    return { status: r.status, body: await r.text() };
  } catch (e) { return { status: 0, body: '', err: String(e.message || e) }; }
};

async function repoFor(reg) {
  if (KNOWN_REPO[reg]) return KNOWN_REPO[reg];
  const home = HOMEPAGE[reg];
  if (!home) return null;
  const { body } = await get(home);
  const m = /github\.com\/([A-Za-z0-9_.-]+)\/([A-Za-z0-9_.-]+)/.exec(body || '');
  if (!m) return null;
  const repo = `${m[1]}/${m[2]}`.replace(/\.git$/, '');
  if (/\/(sponsors|orgs|features|topics)$/.test(repo)) return null;
  return repo;
}

async function licenseFor(repo) {
  for (const name of ['LICENSE', 'LICENSE.md', 'LICENCE.md', 'LICENSE.txt', 'license']) {
    for (const branch of ['main', 'master']) {
      const { status, body } = await get(`https://raw.githubusercontent.com/${repo}/${branch}/${name}`);
      if (status === 200 && body.length > 50) return { file: name, branch, text: body };
    }
  }
  return null;
}

function classify(text) {
  if (!text) return { label: 'UNVERIFIED', why: 'no LICENSE file found in the repo' };
  if (COMMONS_CLAUSE.test(text)) {
    return { label: 'POINTER', why: 'Commons Clause bars redistributing the components themselves' };
  }
  if (NON_REDIST.test(text)) {
    return { label: 'POINTER', why: 'licence bars resale or redistribution separate from an end product' };
  }
  const m = ASSET_LICENSE.exec(text.slice(0, 2500));
  if (m) return { label: 'ASSET', why: `permissive grant read from the LICENSE file (${m[1]})` };
  return { label: 'POINTER', why: 'no permissive grant found — usable in client work, not redistributable' };
}

const regs = JSON.parse(readFileSync(join(ROOT, 'registry/components.registries.json'), 'utf8')).registries;
const out = {};
for (const reg of Object.keys(regs)) {
  const repo = await repoFor(reg);
  const lic = repo ? await licenseFor(repo) : null;
  let c = classify(lic?.text);
  if (reg === '@jhai') c = { label: 'OWN', why: 'JHAI\u2019s own registry; nothing to redistribute from someone else' };
  else if (c.label === 'UNVERIFIED' && NO_REPO_FOUND[reg]) {
    c = { label: 'POINTER', why: `${NO_REPO_FOUND[reg]} \u2014 treated as not redistributable until a grant is read` };
  }
  out[reg] = { repo, licenseFile: lic ? `${lic.branch}/${lic.file}` : null, ...c };
  console.log(`${reg.padEnd(18)} ${String(repo).padEnd(34)} ${c.label.padEnd(10)} ${c.why}`);
}
writeFileSync(join(ROOT, 'docs/LICENSES.json'), JSON.stringify({
  $comment: 'ASSET = permissive, may be copied into @jhai and re-served. POINTER = installable in client work, not redistributable. Read from each project LICENSE file by scripts/gallery/resolve-licenses.mjs.',
  $date: new Date().toISOString().slice(0, 10),
  registries: out,
}, null, 1));
