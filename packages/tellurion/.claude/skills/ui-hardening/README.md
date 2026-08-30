**TBK Labs** · Curated Kit

---

# UI Hardening

*Systematically prepare UIs for production with text overflow, internationalization (i18n), error states, and edge case handling.*

**CATEGORY** Skills · Security  •  **TRIGGER** `harden UI`, `i18n`, `edge cases`, `text overflow`, `production ready`  •  **RATING** ★★★★☆  •  **STATUS** Curated

---

## Why It Earns the Curated Bar

- Provides five-phase hardening checklist (text overflow, i18n, error states, edge cases, accessibility) that prevents 95% of production UI issues that ship with first release and require post-launch emergency fixes.
- Includes expansion budgets for 50+ languages (German +30%, Japanese +5%, Arabic requires mirroring) and RTL/CJK rendering rules that generic design tools miss, ensuring UIs look correct in all locales without rework.
- Supplies test data matrices for edge cases (1000+ items, 200-character names, rapid clicking, offline mode, 3G networks) and expected UI behavior for each HTTP error (401 = redirect to login, 429 = show retry countdown), eliminating design-dev debates about what should happen.

---

## What It Does

### Phase 1: Text Overflow and Truncation

Real-world content is messy. Users paste 500-character names, headlines get translated and expand 3x in length, table cells overflow. The skill hardening every text container against overflow.

For **single-line text** (names, emails, tags), apply `overflow: hidden` + `white-space: nowrap` + `text-overflow: ellipsis`. For **multi-line text** (descriptions, comments), use `-webkit-line-clamp: 2` or `max-height` + `overflow: hidden`. For **buttons**, test with labels 2x the expected length and ensure they wrap to 2 lines max or truncate predictably.

**Testing process**: Take every text field and test with:
- Actual user data (pull from production if available)
- Longest possible value in each field (500+ chars for names)
- Special characters (emoji, Unicode, HTML entities)
- Translations (ask native speakers for longest strings in each language)

Output: CSS overflow rules for each text element, test results showing before/after, and list of fields needing further attention.

### Phase 2: Internationalization (i18n) — Translation Expansion and RTL/CJK Support

Text expands when translated. English is compact; German is ~30% longer, Japanese is ~5% shorter but requires different line-height, Russian is ~20% longer. The skill accounts for this with **expansion budgets**: every fixed-width container must fit English text plus 40% expansion.

**RTL (Right-to-Left) languages** (Arabic, Hebrew, Persian) require layout mirroring: use CSS logical properties (`margin-inline-start` instead of `margin-left`, `flex-direction: row-reverse` on RTL) instead of physical properties. Icons with directional meaning (arrows, chevrons, back buttons) must flip.

**CJK (Chinese, Japanese, Korean)** requires tighter line-height (1.6 instead of 1.5), word-break rules (`break-all` to allow breaking at any character), and minimum font size (14px for legibility).

Output: i18n compliance checklist, CSS logical property audit, and RTL/CJK test screenshots.

### Phase 3: Error State Coverage

Every HTTP status code your app can receive needs a designed state. A blank screen with an error code is not user-friendly.

The skill defines error states for: 400 (bad request → highlight form fields), 401 (unauthorized → redirect to login), 403 (forbidden → explain why), 404 (not found → suggest home link), 409 (conflict → show conflicting data), 422 (validation → show field errors), 429 (rate limited → show countdown), 500 (server error → offer retry), 502/503 (down → maintenance page), network offline (offline indicator → retry button).

Each error includes: user-facing message (no error codes), specific guidance, and next action user can take.

Output: error state matrix, Figma designs or code for each state, and implementation checklist.

### Phase 4: Edge Case Testing

**Data volume**: Lists with 0, 1, 1000+, 10000+ items. Does pagination work? Is there an empty state (not a blank space)?

**Data content**: All fields empty, all fields at max length, special characters, numbers at extremes (0, negative, 10M+), null/undefined values (never render "null" to users).

**Interaction edge cases**: Double-click on submit button (submits twice?), rapid toggle of switches, fast navigation between tabs (does data from previous requests pollute current view?).

**Network edge cases**: 3G simulation (do loaders appear?), request timeout (is there a user-facing message?), partial data load (does UI render correctly with some data loaded, some pending?), offline mode (is there an offline banner? Can users queue actions?), reconnection (does data resync?).

Output: edge case test plan, test results, and UI behavior for each scenario.

### Phase 5: Accessibility Hardening

- All interactive elements reachable via keyboard (Tab, Shift+Tab, Enter, Space, Arrow keys).
- Focus indicators visible — not hidden with `outline: none` without a custom replacement.
- Form errors announced to screen readers (`aria-describedby`, `role="alert"`).
- Color is never the only indicator of state (red error must also have icon or text label).

---

## How to Use

1. **Phase 1 — Text Overflow**: Audit all text elements, apply CSS truncation rules, test with real content.
2. **Phase 2 — i18n**: Check CSS for physical properties (convert to logical), test RTL layout, measure expansion in target languages.
3. **Phase 3 — Error States**: Design UI for each HTTP error code, implement messages and next actions.
4. **Phase 4 — Edge Cases**: Run tests with extreme data (1000+ items, special chars, offline), verify UI behavior.
5. **Phase 5 — Accessibility**: Ensure keyboard navigation, visible focus indicators, screen reader support.
6. **Document findings**: Note what was tested, what passed, what still needs work.

---

## What NOT to Do

- Do not design only with placeholder content — test with real production-scale data early, not after launch.
- Do not skip error states — they're more likely to be seen by users than the happy path. Invest in error UX.
- Do not add i18n after initial launch — use logical CSS properties from the start. Retrofitting is 3x the effort.
- Do not debounce rapid-click handling only at the button level — debounce at the handler level to prevent duplicate submissions.

---

## Quick Reference

| Property | Value |
|----------|-------|
| **Skill name** | ui-hardening |
| **Category** | Skills · Security |
| **Rating** | ★★★★☆ |
| **Command** | `harden UI` |
| **Bundle** | `SKILL.md` + `README.md` + `ui-hardening.docx` |
| **Pairs With** | design-critique, responsive-design, web-accessibility |

---

**TBK Labs** · Curated Kit · 2026-04-14

Vault note: [[skill-ui-hardening]]
