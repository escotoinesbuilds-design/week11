# Agua a Tiempo MX — Implementation Plan

Build a small Spanish-language, client-only Vite + React + JavaScript demo using only fictional records and session state. Follow `PACKET.md`: no resident fees, backend, authentication, real contact/utility integrations, precise location, automated official alerts, repair dispatch, or impact claims.

## Features and acceptance criteria

1. **Vite foundation and visual shell**
   - Acceptance: starts locally with a simple documented command; responsive Spanish interface; no unnecessary services or secrets.
2. **Private household reserve dashboard**
   - Acceptance: select a fictional household/coarse zone; safely validate a manual estimate; display it as an estimate; support missing reading without penalty; simulated sensor readings are prominently `SIMULADO`.
3. **Incident verification register**
   - Acceptance: show fictional source, owner, status, updates, escalation/correction, and next update; a simulated authorized reviewer can approve, correct, or reject; unverified items never appear as confirmed notices; only verified notices matching the coarse zone appear in the household view.
4. **Local anomaly review and preparation**
   - Acceptance: execute local k-nearest-neighbors against fictional reference data; flag implausible readings for human review only; no outage predictions/alerts. Offer preparation choices including a useful no-storage path.
5. **Accessible and adversarial workflows**
   - Acceptance: preview-only SMS and agreed offline-contact route; test false alerts, missing/suspicious readings, no phone, no storage, unauthorized repairs, privacy, and exclusion; label every demo action as simulated; no repair approval/spending.
6. **Mechanical validation and decision records**
   - Acceptance: automated Node tests cover incident confirmation, kNN, input validation, and repair safeguards; build succeeds; `DECISIONS.md` records actual choices, verification, and next action without claiming future work is done.

## Commit plan

1. `docs: add implementation plan`
2. `build: scaffold minimal Vite React app`
3. `feat: add safe incident and reserve domain rules`
4. `feat: build Spanish household and verification dashboard`
5. `feat: add adversarial test workflows`
6. `docs: record implementation decisions and validation`

At least the first four commits form the working implementation. Keep the required post-first-deployment bug-fix/redeploy cycle, screenshot-based synthetic-persona test, second deployment, PDFs, and demo video as explicitly pending follow-up work. Deploy only if GitHub/Vercel are already accessible without adding secrets or paid services.
