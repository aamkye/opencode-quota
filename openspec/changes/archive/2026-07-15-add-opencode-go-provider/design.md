## Context

The quota TUI currently instantiates Z.AI and OpenAI adapters behind a shared reactive provider interface. OpenCode Go already has known runtime IDs in token metadata, but it has no quota adapter or selection mapping. OpenCode documents 5-hour, weekly, and monthly monetary limits, while its API-key inference endpoints expose no documented usage endpoint or quota headers. The authenticated console embeds exact `lite.subscription.get` results in Solid hydration assignments on the Go workspace page.

The provider must therefore fetch the authenticated Go workspace page and strictly extract the three structured hydration records using a workspace ID and auth-cookie value supplied through native local options. This creates markup compatibility and secret-storage risks that must be isolated from semantic mapping and aggregate composition.

## Goals / Non-Goals

**Goals:**
- Retrieve exact OpenCode Go rolling, weekly, and monthly usage from the authenticated Go workspace page.
- Present 5H, 7D, and 1M remaining percentages and reset times through the existing semantic quota panel.
- Participate in active-provider selection, configurable polling, stale handling, reset-boundary refresh, percentage modes, and progress coloring.
- Fail closed on invalid configuration, authentication, or response shape without exposing the configured token.
- Keep the page transport and hydration parser replaceable if OpenCode later publishes a supported usage API.

**Non-Goals:**
- Discovering or decrypting browser cookies automatically.
- Estimating quota from local message history.
- Managing subscriptions, workspaces, balance fallback, regions, or account settings.
- Changing inference requests, OpenCode-managed API keys, token reports, or upstream OpenCode behavior.

## Decisions

### Isolate authenticated page transport and hydration extraction

Add a dedicated OpenCode Go provider with separate page transport, bounded hydration extraction, response validation, semantic mapping, and reactive adapter layers. The first implementation task sanitizes the observed Go page and freezes the current `rollingUsage`, `weeklyUsage`, and `monthlyUsage` assignment shapes before production transport code is written. Tests use fixtures containing no real credentials or identifiers.

The parser targets only Solid hydration assignments for the three named usage records, requires the observed static `status: "ok"` field before the two numeric fields, and never interprets visible localized HTML or executes page scripts. A bounded deterministic HTML lexical pass recognizes real tags outside comments, honors attribute quotes, skips script-like text in `textarea`, `title`, `style`, `xmp`, `iframe`, `noembed`, and `noframes`, and emits only actual script bodies. A bounded deterministic JavaScript lexical pass then recognizes code, quoted strings, no-substitution templates, and line/block comments; marker candidates count only in code state. Both passes fail closed on malformed or unclosed relevant constructs.

The JavaScript scanner does not parse expressions. A shared bounded helper checks only the three fixed `${name}:$R` prefixes with at most one `indexOf` per prefix. On a template `${`, the helper checks the remainder of that script body: a candidate rejects the response, while a candidate-free remainder lets the scanner stop that body and preserve markers already found. On a code-state `/` other than `//` or `/*`, the helper checks only through the next CR, LF, or body end: a candidate rejects the response, while a candidate-free line is skipped and scanning resumes on the next line. Unrelated division, regex literals, and template expressions therefore do not invalidate markers in other script bodies. Exact `${name}:$R`, `<name>:$R[digits]=`, no-whitespace object grammar, 1,000,000-code-unit HTML limit, 4,096-code-unit record limit, and atomic three-record acceptance remain mandatory. Suffix validation walks the real script remainder through spaces/tabs and requires an actual delimiter or actual body end, never a truncated-slice end. This is preferred over reverse-engineering an unobserved server-function wire endpoint and over local reconstruction, which omits other clients and devices.

### Configure the console session through native options

Read `quota.opencodego.workspaceId` and `quota.opencodego.workspaceToken` from local plugin options. `workspaceToken` is the value of the console's `auth` cookie; the transport sends it only as `Cookie: auth=<workspaceToken>`. Both values remain in local `.opencode/tui.json`; they are never logged, serialized into reports, or copied into tests. Requests use a fixed `https://opencode.ai` origin and do not accept a configurable destination.

This follows the explicit configuration choice and avoids browser-specific cookie discovery. The documentation will warn that the option stores a plaintext session secret and must not be committed.

### Map console usage into the existing provider contract

Map `rollingUsage`, `weeklyUsage`, and `monthlyUsage` to 5H, 7D, and 1M progress/timer pairs. Console used percentages become remaining percentages before entering composition, and reset epochs are derived from the server-provided `resetInSec`. The home summary uses 5H as primary and 7D as secondary; the expanded panel includes all three windows.

The provider reports runtime ID `opencode-go`, while selection maps both `opencode-go` and `opencode-go-subscription` to it. No renderer-specific branch is added.

### Reuse polling and lifecycle semantics

The provider uses the normalized shared refresh interval, immediately refreshes when selected, serializes overlapping requests, schedules reset-boundary refreshes, updates countdowns once per second, and cancels work on disposal. Transient network and server failures retain last-known data as stale until the existing stale horizon expires. Authentication redirects, malformed or partial hydration records, and workspace failures clear quota and expose a configuration-required or unavailable state.

This keeps adapter behavior consistent with existing providers while distinguishing recoverable transport failures from invalid credentials.

## Risks / Trade-offs

- [Solid hydration markup changes] -> Keep extraction behind one bounded parser, require all three named records atomically, fail closed, and cover the sanitized page contract with fixtures.
- [Script-like text creates false hydration records] -> Separate HTML and JavaScript lexical context, ignore comments/attributes/raw-text and JavaScript strings/templates/comments, and scope unsupported ambiguity with bounded fixed-prefix checks.
- [Ambiguous JavaScript hides or precedes a quota marker] -> Search only the bounded ambiguous remainder for the three fixed marker prefixes; reject when one is present, otherwise skip the slash line or stop the template-expression body without invalidating unrelated scripts.
- [Division precedes a real marker on the same line] -> Accept a scoped false negative by rejecting that response; exact regex-versus-division classification would require a broader JavaScript parser, while next-line and separate-script markers remain supported.
- [A plaintext auth-cookie token is stored in native options] -> Document local-only storage, prohibit logging and committed examples, and test diagnostic redaction.
- [Frequent polling places load on the console page] -> Reuse the user-configurable shared interval, serialize requests, and avoid polling when configuration is absent.
- [The session expires or references the wrong workspace] -> Clear current quota and show configuration required instead of displaying fabricated or indefinitely cached values.
- [Server reset values drift during request latency] -> Derive epochs at response receipt and refresh at the next reported boundary.

## Migration Plan

Add the optional provider without changing existing Z.AI or OpenAI configuration. Document local OpenCode Go options, build and deploy the three plugin artifacts, then validate with a real uncommitted console session. Rollback removes the OpenCode Go adapter registration and repeats local deployment; existing providers remain unaffected.

## Open Questions

None. The authenticated Go page and three hydration record names were confirmed before this revision.
