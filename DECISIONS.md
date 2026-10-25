# Agua a Tiempo MX — Session Decisions

## Decisions made

- The demo is a client-only Vite/React/JavaScript application with in-memory state. No backend, database, account, API key, real contact route, or external utility integration was added.
- All households, reserve readings, notices, reviewers, and incident actions are fictional. All incident approvals and sensor readings are labeled simulated. Missing readings do not block notices or create penalties.
- Incident notices are zone-matched and shown to residents only when their status is `verified`. The register defaults to a resident view with no review controls; a separate simulated reviewer mode reveals demo controls. The client-side role guard rejects resident attempts to approve, correct, or reject. This is not authentication or real authorization.
- The reserve anomaly check is a locally executed k-nearest-neighbors classifier using fictional reference examples. It flags an unusual value for review and never creates a municipal outage alert or prediction.
- Repair requests are always denied in the demo. Household plumbing is distinguished from public-network issues, and no dispatch or spending path exists.
- Household records and changes remain in the browser session; only the selected fictional household's reserve is shown. Service zones are coarse and there is no household map.
- Pending anomaly-review readings are scoped to their originating fictional household so switching profiles cannot transfer a candidate reading.
- SMS is preview-only; the no-phone path uses an agreed offline-contact message. No messages are sent.
- Styling uses native CSS and system fonts to avoid a remote font request or extra UI package.
- Removed the unused Vite React plugin; Vite and React are the only runtime/build dependencies needed.

## Work completed and verification

- Completed the household reserve dashboard, incident register/reviewer controls, preparation options, no-phone/no-storage paths, and interactive adversarial view.
- Added automated tests for authorization, unverified notices, correction/rejection handling, reserve validation, local kNN behavior, and repair denial.
- Owner-provided, genuine Valeria screenshot-based persona feedback is documented in `docs/PERSONA_TEST.md`; no second persona evaluation was run. Four first-deployment screenshots and the supplementary no-phone/no-storage view are retained in `docs/`.
- Highest-priority persona issue fixed: incident-review actions are hidden in the default resident view and only appear in a clearly labeled simulated reviewer mode; role checks reject resident status changes.
- Additional persona-driven copy changes clarify estimated percentages, simulated sensor movement, no-notice uncertainty, the resident's zone, no-phone/offline access, no-storage actions, and expected-vs-executed adversarial checks.
- `npm test`: 6 passed, 0 failed after persona fixes.
- `npm run build`: passed after persona fixes.
- Browser verification confirmed zero incident review buttons in resident mode and controls appear only after opting into the simulated reviewer mode. Automated domain checks reject resident approval, correction, and rejection; the original pending incident remains pending and produces no verified notice.
- Earlier browser checks confirmed repair requests are denied, invalid reserve input is rejected, valid estimates update in-session, and the no-phone/no-storage profile receives its offline route and zone's simulated verified notice.
- Browser testing found that pending anomaly readings could otherwise follow a profile switch; changed pending review state to be keyed by fictional household.
- A first automated test revealed that the kNN's fictional training points did not classify a large reserve drop consistently; added neighboring fictional anomaly examples and the test now passes.
- Browser verification revealed a missing React binding in the JSX runtime; added the import and confirmed the dashboard renders normally.
- The initial automated test attempt used an unsupported runner; the project's Node test runner succeeded. This was a tooling mismatch, not an application test failure.
- GitHub repository creation currently redirects to GitHub sign-in. The Vercel new-project page loads, but no GitHub repository is connected to this local project.

## Commits

1. `85d6b39` — `docs: complete Week 11 packet and generated mockup`
2. `324ec22` — `docs: add implementation plan`
3. `9309f46` — `build: scaffold minimal Vite React app`
4. `46061ef` — `feat: add safe incident and reserve domain rules`
5. `5dfc1d3` — `feat: build Spanish household and verification dashboard`
6. `fd8f3b2` — `build: trim unused Vite plugin dependency`
7. `0082874` — `docs: record implementation decisions and validation`
8. Pending — persona-driven resident/reviewer separation, language updates, screenshots, and feedback report.

## Next action and pending work

- **Next action:** commit these persona-driven changes, push them to the configured GitHub `main` branch, then verify that Vercel completes the second deployment from the push and that the live app shows the resident/reviewer separation.
- The first deployment is `https://week11-kohl.vercel.app/`; second deployment verification is pending.
- Still pending: final PDFs and demo video.
- No production pilot results or impact are claimed. A real pilot with no real events must be reported as inconclusive.
