# appbuilder remediation plan

Companion to [review](REVIEW.md). All steps and commands below are **future work**, not executed. Preserve the prototype boundary unless the owner explicitly approves a real-camera project.

## Phases and dependencies

| Phase | Tasks | Entry → exit |
|---|---|---|
| 0: baseline | AB-T1 | Owner grants CI access → failure reproduced or documented with logs and baseline |
| 1: correctness and demo UX | AB-T2, T3, T4 | T1 → storage, gallery, timer and control regressions demonstrated fixed |
| 2: security and automation | AB-T5 → AB-T6 | T1; T2–T5 for regression gate → risk decisions and meaningful green checks |
| 3: release and independent acceptance | AB-T7 | T1–T6 → release/rollback rehearsal and independent evidence reviewed |

### AB-T1 — establish baseline and diagnose CI (AB-05)

**Prerequisite:** owner permits access to Actions and a disposable checkout. **Observed paths:** `.github/workflows/ci.yml`, `package.json`.

1. Retrieve run 41607576893 logs and record failed step, error, SHA and Node version; do not assume that the older run has the same cause.
2. In isolation reproduce the existing workflow steps: planned `npm ci`, `npx tsc --noEmit`, `npm run lint`, `npm test`, `npm run build`; capture output and avoid changing lockfiles as a workaround.
3. Correct the evidenced failure in a separately reviewed change, then repeat the full sequence and current-branch CI. If registry or permissions block reproduction, record that as a blocker.

**Output/verification:** log-linked baseline and successful clean-checkout CI for the candidate revision, or explicit unresolved failure. **DoD:** [ ] cause evidenced; [ ] all original gates retained; [ ] candidate SHA and results recorded.

### AB-T2 — validate persisted state (AB-01; data protection)

**Prerequisite:** T1 baseline. **Observed path:** `src/hooks/useCameraSettings.ts`; existing hook tests at `src/hooks/useCameraSettings.test.ts` require inspection before editing.

1. Enumerate every field and allowed value from the actual camera types and controls, including nested preset settings; define versioning and an allowlisted reconstruction policy.
2. Add regression cases for `focusMode: {}`, unknown fields, invalid enums, malformed JSON, out-of-range location and valid legacy partial settings. Verify invalid persisted data cannot crash rendering and safe values survive.
3. Implement sanitization/migration for both settings and presets; handle storage unavailability without silently promising persistence. Avoid treating storage as confidential or including raw location in logs.

**Output/verification:** schema/migration and user-observable storage failure behavior; run existing hook and app tests plus a reload check in a browser. Deliberately remove a type guard and confirm the malformed-value regression fails. **DoD:** [ ] all accepted fields validated; [ ] regression fails when broken; [ ] legacy and denied-storage behavior documented.

### AB-T3 — repair gallery and recording simulation (AB-02–04, AB-07)

**Prerequisite:** T1; product owner decides cancel-selection behavior and recording continuity. **Observed paths:** `src/App.tsx`, `src/components/GalleryView.tsx`, `src/components/Viewfinder.tsx`.

1. Reproduce delete → leave → return, select → cancel → re-enter, and record → change tab → return; capture the intended outcomes in behavior tests.
2. Clear or visibly retain selection on cancel, require deletion confirmation, and label mock gallery reset and mock download/share behavior honestly. Keep simulated data distinct from real media.
3. For recording, preserve start time across view remounts or explicitly stop on exit; test elapsed time with a controlled clock and verify navigation does not falsely claim a saved recording.

**Output/verification:** unambiguous demo flows and regression tests that assert selected IDs, remaining gallery items and elapsed time, not just headings. **DoD:** [ ] retained selections cannot be unexpectedly deleted; [ ] reset behavior disclosed; [ ] timer behavior matches decision.

### AB-T4 — accessibility and truthful device indicators (AB-06–07)

**Prerequisite:** T1; coordinate affected UI changes with T3. **Observed paths:** `src/App.tsx`, `src/components/Viewfinder.tsx`, `src/components/GalleryView.tsx`.

1. Inventory icon-only buttons, status text and focus transitions, including shutter, control toggle, flip and gallery detail actions; distinguish disabled mock features from working actions.
2. Add meaningful accessible names, expanded/pressed state where appropriate, visible focus and clear simulated indicators; review touch sizes and contrast on small screens.
3. Add role/name/state assertions and keyboard journeys, then manually inspect with Android screen reader and supported viewport; record device, browser and findings.

**Output/verification:** accessibility inventory and evidence of navigation, operation and state announcements. Remove a control label deliberately to prove its assertion fails. **DoD:** [ ] essential buttons named; [ ] mock status visible; [ ] device checks recorded or release blocked.

### AB-T5 — assess security and dependency boundaries (preventive; AB-01, AB-05)

**Prerequisite:** T1 and T2. **Observed paths:** `package.json`, `package-lock.json`, `.github/workflows/ci.yml`, `src/hooks/useCameraSettings.ts`.

1. Inspect actual lockfile, sources and built artifact for dependency integrity, unsafe DOM sinks, embedded credentials and unexpected network access; record findings without copying secrets.
2. Define local settings/location retention and deletion; check storage failure behavior and sharing URL for unintended sensitive data. Decide whether any backend/authentication is in scope before designing authorization.
3. Review advisory results, pin CI actions to verified immutable commits where practical, and select compatible supported Node versions; document accepted risk and owner approval for dependency changes.

**Output/verification:** threat-boundary and dependency report, with a controlled canary check for accidental credential inclusion if a build exists. **DoD:** [ ] injection and secrets reviewed; [ ] location policy approved; [ ] actionable advisories resolved or explicitly accepted.

### AB-T6 — strengthen automated behavioral gates (AB-05; preventive)

**Prerequisite:** T2–T5 and a reproducible T1. **Observed paths:** `src/App.test.tsx`, `src/components/GalleryView.test.tsx`, `vitest.config.ts`, `.github/workflows/ci.yml`.

1. Replace the gallery filter's heading-only check with known input and exact inclusion/exclusion assertions; test navigation, presets, selection, timer and storage failure using isolated fixtures.
2. Run the existing type, lint, test and build gates in CI without dropping tests or relaxing thresholds; add an accessibility gate only after defining and reviewing its configuration.
3. Independently mutate filtering, selection and storage guards one at a time and confirm relevant tests fail; restore each deliberate mutation and capture final CI results.

**Output/verification:** deterministic regression suite and mutation evidence. **DoD:** [ ] tests assert user-visible outcomes; [ ] deliberate breaks detected; [ ] full CI passes on candidate SHA.

### AB-T7 — release, recovery and independent acceptance (preventive)

**Prerequisite:** T1–T6. **Observed path:** `README.md`; proposed release/runbook location: `docs/release.md`.

1. Obtain owner decisions on demo-only distribution, hosting, release credentials, artifact provenance and supported Android devices; do not claim the single HTML file is an APK.
2. Document reproducible build, artifact verification, rollback to a previous verified artifact, and settings/data retention. If durable user data is introduced, define backup, restore owner and measured restore drill before release.
3. An independent reviewer tests the built artifact on target devices, checks disclosures and accessibility, reviews CI/security evidence and performs a release rollback rehearsal; log results and blockers.

**Output/verification:** approved runbook, candidate artifact hash and observed rehearsal. **DoD:** [ ] rollback observed; [ ] device checks independently recorded; [ ] owner accepts residual risk.

## Acceptance, approvals and rollback

- [ ] Current candidate has observed green CI, reproducible artifact and no unexplained failing gate.
- [ ] Storage corruption, gallery cancellation, timer navigation and mock disclosure regressions pass; deliberate breaks fail.
- [ ] Android/browser accessibility and privacy checks are observed, not inferred from jsdom.
- [ ] Owner approves distribution, credentials, data retention, dependency risk and any real camera/location work. Camera integration requires its own design, permission handling and device acceptance; it is not authorized by this plan.
- [ ] Release owner can redeploy the previous verified artifact; if data storage is added, restore is actually rehearsed. Stop release on failed verification, retain evidence and roll back through the approved procedure rather than weakening checks.
