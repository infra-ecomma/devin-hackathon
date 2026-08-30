**TBK Labs** · Curated Kit

---

# Web Accessibility

_Comprehensive audit: semantic HTML, ARIA, color contrast, keyboard nav, screen reader compat_

**CATEGORY** Skills · Product  •  **TRIGGER** `test accessibility, audit wcag, check a11y, accessibility audit`  •  **RATING** ★★★★☆ (8/10)  •  **STATUS** Curated

---

## Why It Earns the Curated Bar

- Combines automated checks (Lighthouse, axe) with manual testing (keyboard nav, screen reader)—automated alone misses 30%
- Three-part methodology: Lighthouse baseline, semantic structure verification, real screen reader testing
- Checks heading hierarchy, form labels, color contrast (4.5:1 AA / 7:1 AAA), focus management, tap target sizes (48x48px)

---

## What It Does


Comprehensive accessibility auditing combining automated checks and manual testing because automation alone catches only ~70% of real-world accessibility issues. Automated tools like Lighthouse and axe find contrast failures, missing alt text, and ARIA violations quickly, but they miss critical problems: whether focus is actually visible, whether keyboard-only navigation works end-to-end, whether screen readers announce dynamic content correctly. This skill runs both to catch what each does best.

The three-part methodology starts with automated baseline: Lighthouse and axe scan for low-hanging violations—color contrast failures, missing form labels, ARIA attribute errors. Those results are documented with severity and location. Then semantic structure verification checks heading hierarchy (h1 → h2 → h3 with no skips), ensures every form input has an associated label, verifies list structure uses semantic `<ul>/<ol>` elements, and validates landmark regions (`<header>`, `<nav>`, `<main>`, `<footer>`) exist so screen reader users can navigate by section.

Manual testing is where the other 30% emerges: testing with keyboard only (Tab, arrow keys, Enter, Escape), verifying focus is visible and never lost, testing with a screen reader (NVDA on Windows, VoiceOver on Mac), and confirming dynamic content announcements work. One specific check: Tab through every interactive element on the page—if focus disappears or jumps unexpectedly, keyboard users are trapped. Modal dialogs get special attention: when they open, focus must move to the first focusable element inside; when they close, focus must return to the button that opened them, never to the void.

Color contrast is audited against WCAG AA standard (4.5:1 for normal text, 3:1 for large/components) or AAA (7:1 for normal, 4.5:1 for large) if you're targeting enhanced conformance. Tools like webaim.org/resources/contrastchecker or DevTools color picker verify ratios. Critical rule: never convey information by color alone—always pair with icon, label, or pattern so color-blind users understand the intent.

Output is a priority-ordered report combining automated findings and manual test results, with specific recommendations for each issue. The combined report shows which WCAG criteria are violated and which users are affected by each issue—contrast problems block low-vision users, missing keyboard support locks out motor-impaired users, poor screen reader announcements exclude blind users.


---

## How to Use

1. **Invoke skill**: `test accessibility` or `audit wcag`
2. **Skill runs automated baseline**: Lighthouse + axe findings
3. **Skill checks semantics**: Heading hierarchy, form labels, ARIA
4. **Skill guides manual testing**: Keyboard nav, screen reader testing
5. **Review combined report**: Automated + manual findings
6. **Fix issues**: Priority-ordered by severity

---

## What NOT to Do

- **Do not rely only on automated tools**: They miss ~30% of issues. Manual keyboard/SR testing is required.
- **Do not ignore WCAG criteria**: If one criterion fails, the whole UI is inaccessible to that user group.

---

## Quick Reference

| Property | Value |
|----------|-------|
| **Skill name** | web-accessibility |
| **Category** | Skills · Product |
| **Rating** | ★★★★☆ |
| **Command** | test accessibility, audit wcag, check a11y, accessibility audit |
| **Bundle** | `SKILL.md` + `README.md` + `web-accessibility.docx` |

---

**TBK Labs** · Curated Kit · 2026-04-14

Vault note: [[skill-web-accessibility]]
