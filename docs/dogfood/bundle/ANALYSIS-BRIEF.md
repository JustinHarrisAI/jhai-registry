# Analysis brief — for an independent agent auditing this bundle

You are being asked to audit an experiment whose conclusion favours the thing its author
built. Treat that as reason for care, not for reflexive disagreement. The author has already
published the result; a finding that the result is wrong is more useful than a finding that it
is right, and is what this brief is for.

Read `README.md` first. Then work the checks below. **Do not accept any number in `README.md`
without re-deriving it.**

---

## The claim under audit

> A project wired with the `@jhai` registry and five curated third-party registries produces a
> page that can be rebranded by changing CSS variables alone, while an unwired baseline
> produces one that cannot — and the wired project writes roughly half as much code to do it.

---

## 1. Re-derive the numbers

```bash
node measure.mjs
node measure.mjs --all
node measure.mjs --json | jq '.repos[] | {root, handWritten, verdict}'
```

Check the script itself before trusting its output. Specifically:

- **Are the regexes honest?** `PALETTE` decides the headline finding. Does it catch everything
  it should, and does it avoid catching things that are not fixed colours? Try adding a
  `bg-emerald-400` to a repo-b file and confirm the verdict flips.
- **Is the boilerplate exclusion fair?** `measure.mjs` skips `src/app/page.tsx`. Verify that
  file is genuinely `create-next-app` output and genuinely identical in both repos
  (`diff repo-a/src/app/page.tsx repo-b/src/app/page.tsx`). If it differs, the exclusion is
  doing work it should not.
- **Is `PROVENANCE.json` accurate?** It determines the hand-written/installed split, and it was
  written by the same party that benefits from the split. Spot-check: does
  `repo-b/src/components/faqs-1.tsx` actually look like third-party Tailark source rather than
  something typed for this test? Do the `@jhai/*` files match the published registry at
  `https://raw.githubusercontent.com/JustinHarrisAI/jhai-registry/main/r/logo-wall.json`?

## 2. Attack the framing

These are the places the experiment is most likely to be wrong. Each is a real question.

- **Is "palette utilities" the right proxy for rebrandability?** A page could use zero palette
  utilities and still be unrebrandable for other reasons — fixed pixel dimensions tied to a
  logo, a layout that only works with short German-free copy, hardcoded font stacks. Read both
  pricing pages and judge rebrandability yourself, by eye, then say whether the metric tracked
  what it claimed to.

- **Would a better-prompted baseline have closed the gap?** repo-a was told nothing about
  tokens. If the brief had said "use semantic tokens so this can be rebranded," repo-a might
  have scored the same for free — in which case the registry's contribution is the *default*,
  not the *ceiling*. This is the strongest available objection. Evaluate it.

- **Is 4/5 sections installed actually good?** repo-b installed 1,501 lines it now owns and did
  not write. Is that an asset or a liability? Consider: upgrade path, unreviewed third-party
  code, and the fact that one of the four installs (`pricing-1`) was wrong and discarded.

- **Does 12 min vs 2.5 min reverse the conclusion for JHAI's actual use case?** JHAI builds
  many small, fast sites. Read `README.md`'s stated criteria and say whether the speed cost is
  correctly weighted or whether it was minimised because it was inconvenient.

- **Is `n=1` doing too much work?** One brief, one run each, no repetition. Say plainly how much
  confidence the design supports.

## 3. Check the self-reports against reality

`reports/` holds each agent's own account, unedited.

- repo-a claimed its page "reskins via CSS variables alone — no component edits needed."
  Confirm this is false.
- repo-b claimed "0 hardcoded colors." Confirm whether that is true at the scope it implied,
  and whether its own framing was as loose as repo-a's.
- **Then ask the harder question:** the author caught repo-a's false claim and reported it, but
  repo-b's claim came from an agent working for the same author. Was it audited as hard? Check.

## 4. Anything the bundle does not contain

Name what you would need that is not here. The bundle was assembled to be sufficient; if it is
not, that is a finding.

---

## Output

Return:

1. **Verdict** — does the evidence support the claim, and at what confidence.
2. **Numbers you could not reproduce**, with what you got instead.
3. **The strongest argument against the conclusion** that the bundle does not already make
   against itself.
4. **Anything the author appears to have avoided measuring.**

State disagreement plainly. Do not soften a finding because the bundle is candid about some of
its weaknesses — candour about three flaws is not evidence there is no fourth.
