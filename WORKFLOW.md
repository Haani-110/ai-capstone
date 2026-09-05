# AI Development Workflow Comparison

## Overview

This exercise compared two ways of using AI to build the same settings-form feature. Round 1 used a single vague prompt: “Build a settings form with validation for this project.” The generated result was accepted with minimal intervention and committed to `workflow/vague-prompt`. Round 2 started independently from `main` on `workflow/spec-driven` and used repository exploration, a structured implementation plan, explicit constraints, accessibility requirements, edge cases, and automated verification.

## Correctness and Edge Cases

Round 1 provided a working basic settings form, but it had no automated test suite; running `npm test` on the branch failed because no test script existed. Round 2 introduced a shared `src/validateSettings.js` module so client and server validation use the same rules. It also added handling for null/non-object payloads, whitespace-only values, invalid types, boundary values, unknown enum values, malformed JSON, and corrupt persisted settings. The server remains authoritative for validation.

The Git diff provides concrete evidence of the difference: Round 2 added 136 lines in `tests/server.test.js` and 183 lines in `tests/validateSettings.test.js`. The final test run passed all 19 tests.

## Accessibility and UX

Round 2 made accessibility more deliberate by adding labels and descriptions, `aria-describedby`, `aria-invalid`, accessible error announcements, and focus management for the first invalid field. It also improved submission UX by preventing double submission, showing a saving state, and handling server/network failures.

## Review Effort

Round 1 required less initial prompting and review because the scope was left mostly to the AI. However, this also meant important behavior was not systematically verified. Round 2 required more upfront specification and review, but the resulting implementation was easier to verify because requirements were explicit and tests documented expected behavior. The branch comparison shows 775 insertions and 140 deletions in Round 2 relative to Round 1.

## AI Mistake Caught

During Round 2, the AI initially used `node --test tests/` for the test script. This failed because Node treated `tests` as a module path. The mistake was caught during verification and corrected to `node --test tests/*.test.js`, after which all 19 tests passed.

## Rules Learned

The project rules were updated in `CLAUDE.md` to require authoritative server-side validation, shared client/server validation, accessible form feedback, and automated testing with `npm test` for behavioral changes.

Overall, the spec-driven workflow required more planning but produced a more testable, accessible, and verifiable implementation with substantially less ambiguity during review.
