# Camera Cleanup and Chat Image MIME Implementation Plan

**Goal:** Resolve the README camera-track lifecycle finding and non-JPEG chat MIME finding in one bounded session.

**Architecture:** Give camera ownership and asynchronous invalidation a focused hook. Preserve the MIME type already produced by the uploader alongside the active image bytes, then forward it to chat. Keep existing analysis and sample fallback behavior.

**Tech Stack:** Existing React/TypeScript/Vite application; proposed Vitest, jsdom, and React Testing Library regression tests.

**Spec:** `README.md`, Known limitations and review findings: camera cleanup (High) and chat MIME preservation (Medium). This document defines the selected session scope.

## Scope and constraints

- Planning deliverable only for this turn; no application changes yet.
- Two implementation tasks, each targeted around 4,000 tokens; session ceiling around 30,000 tokens. Summarize and hand off at a budget boundary.
- Implement sequentially in this chat; avoid delegation overhead for these two small fixes.
- Leave unrelated work untouched. Commit/push/deployment are separate from this plan.
- No live Gemini calls, personal photos, or API keys are required for regression tests.
- Public-launch security remains unresolved: authentication, rate limits, usage budgets, model allowlists, schema validation, and upload limits are deferred.
- Also defer chat-history/request isolation, task persistence, analysis concurrency, accessibility, hotspot geometry, and messaging cleanup.
- Before library-specific implementation, fetch current documentation with Context7 per the supplied project instructions. The plan does not depend on changing framework versions.

## Evidence and baseline

- No root `AGENTS.md` or `CLAUDE.md` was found; follow the instructions supplied in this chat.
- Working tree was clean during inspection. Existing `docs/raspberry-pi-deployment.md` concerns deployment and does not specify these fixes.
- `RoomUploader.tsx` accepts a stream after awaiting `getUserMedia`; cancellation only stops the currently stored stream. There is no unmount cleanup.
- `App.tsx` receives `payload.mimeType` and sends it for analysis, but stores only image bytes/URL. All three result-setting paths omit MIME storage.
- `DeclutterChatbot.tsx` sends image bytes without `mimeType`, allowing the server's JPEG default to label PNG/WebP incorrectly.
- `package.json` has type-check (`lint`) and build scripts, but no test script or test dependencies. Dependencies are not installed in this checkout. No runtime reproduction or validation has been run yet.

## Review focus

The regression cases below must cover these five boundaries:

1. Camera permission resolves after Cancel or unmount: every obsolete track stops and no preview reopens.
2. An older camera attempt resolves/rejects after a newer attempt: it cannot replace or close the current camera.
3. A file or sample replaces the camera while permission is pending or streaming: camera ownership ends.
4. Analysis enters either bundled fallback path: chat keeps the image's original MIME type.
5. New Scan or text-only chat: no previous image MIME type is sent.

## Task 1: Own and clean up camera resources

**Files:** Create `src/hooks/useCamera.ts`, `src/hooks/useCamera.test.tsx`, `src/components/RoomUploader.test.tsx`, `vitest.config.ts`, and `src/test/setup.ts`; modify `src/components/RoomUploader.tsx`, `package.json`, and `package-lock.json`.

**Interface:** `useCamera(): { videoRef: React.RefObject<HTMLVideoElement | null>; isCameraActive: boolean; cameraError: string | null; startCamera: () => Promise<void>; stopCamera: () => void }`. The hook owns streams; the uploader retains canvas capture and selected-image state.

- [ ] Install existing locked dependencies with `npm ci`; record baseline results from `npm run lint` and `npm run build` before edits.
- [ ] Add only the test tooling needed for these component/hook regressions, with `test` mapped to `vitest run` and a jsdom environment. Mock media devices, track stops, canvas capture, scrolling, and network requests as needed.
- [ ] Write failing tests using deferred media promises: Cancel then resolve, unmount then resolve, active-stream unmount, attempt A then B with reversed resolution, and stale rejection after B succeeds. Assert obsolete tracks stop, the newest preview survives, and stale errors do not appear.
- [ ] Add uploader interaction regressions: file/sample selection cancels active or pending camera ownership; capture stops tracks; denied permission still allows retry.
- [ ] Run `npm test -- src/hooks/useCamera.test.tsx src/components/RoomUploader.test.tsx` and confirm the lifecycle assertions fail before the fix.
- [ ] Implement request-generation invalidation and unmount cleanup in the hook. Stop all obsolete streams immediately; detach `srcObject` on stop; attach a current stream when the video element mounts. Cleanup must survive React Strict Mode effect setup/cleanup.
- [ ] Integrate the hook and stop camera ownership when file/sample selection replaces it. Preserve the existing camera error text and JPEG capture behavior.
- [ ] Repeat the targeted tests and type check; require passing output. Manually check permission denial/retry, delayed permission cancellation, capture, and leaving the uploader with a camera active when browser access is available.

## Task 2: Preserve MIME type from analysis to chat

**Files:** Modify `src/App.tsx` and `src/components/DeclutterChatbot.tsx`; create `src/App.test.tsx` and `src/components/DeclutterChatbot.test.tsx`.

**Interface:** Add `imageMimeType: string | null` to `DeclutterChatbotProps`; App owns `activeImageMimeType: string | null`. When image bytes exist, the chat JSON includes their matching `mimeType`; text-only chat omits it.

- [ ] Write failing App tests that invoke the uploader callback and inspect chatbot props. Parameterize PNG, WebP, and JPEG across normal success, HTTP-error sample fallback, and thrown-request sample fallback. Each must preserve bytes and MIME together.
- [ ] Write failing chatbot request tests: a PNG/WebP image reaches `/api/chat` with the matching `mimeType`; text-only chat omits image MIME metadata. Test New Scan clearing bytes and MIME before a later chat request.
- [ ] Run `npm test -- src/App.test.tsx src/components/DeclutterChatbot.test.tsx` and confirm the MIME assertions fail before edits.
- [ ] Store `payload.mimeType` whenever an active image is accepted in each of App's three result paths, clear it in `handleNewScan`, and pass it to the chatbot.
- [ ] Forward `imageMimeType` in image-bearing chat requests. The normal App path must always provide matching metadata; do not silently relabel PNG/WebP as JPEG.
- [ ] Repeat the targeted tests and type check; require passing output. Manually inspect PNG/WebP/JPEG chat request bodies in the browser, using mocked backend responses when practical.

## Completion and handoff

- [ ] Run the complete `npm test`, `npm run lint`, `npm run build`, and `git diff --check`; report failures or unavailable checks explicitly.
- [ ] Update README descriptions affected by these two fixes, including relevant usage/privacy/API wording and findings. Do not mark deferred findings resolved.
- [ ] Update `docs/implementation-summary-2026-10-07.md` with actual changed files, regression coverage, command results, and remaining limitations.
- [ ] Review the final diff for scope and report the two resolved findings with evidence. No production-readiness claim or live model-availability claim.

## Plan self-review

Both selected findings have implementation and regression tasks. The five review boundaries map to Task 1 (1–3) and Task 2 (4–5). Hook/property names are consistent across tasks. Test scaffolding belongs to the first camera deliverable; MIME preservation is independently reviewable. Deferred security/state issues remain explicitly visible.

## Execution record — 2026-10-07

- [x] Task 1 implementation and automated verification: nine camera regression tests pass.
- [x] Task 2 implementation and automated verification: thirteen MIME tests pass, including New Scan.
- [x] Full test suite (22 tests), type check, production build, README updates, and implementation summary.
- [ ] Physical camera/manual browser checks: Browser runtime failed before initialization; no fallback used. File selection is unavailable while the camera UI is open, so replacement tests use the available sample controls.

Executed in the supplied checkout on `codex/camera-chat-image`, without commits or delegation. Tests exercise real App/chat payload behavior rather than mocked chatbot props. See `docs/implementation-summary-2026-10-07.md` for evidence and remaining limitations. The task checklists above preserve the original plan; this record describes completed work and the verification boundary.
