**TBK Labs** · Curated Kit

---

# Navigation Patterns

_Tab vs drawer vs stack, deep linking, modals, and platform-specific gestures — when each pattern wins, with React Navigation references._

**CATEGORY** Skills · Design  •  **TRIGGER** "mobile navigation pattern" · "tab vs drawer" · "deep linking setup"  •  **RATING** ★★★★☆ (8/10)  •  **STATUS** Curated

---

## Why It Earns the Curated Bar

- Decision tree, not opinion. Tab bar wins for ≤5 top-level destinations; drawer wins for hierarchical sub-categories; stack wins for sequential flows. The skill maps each app shape to its right pattern.
- Deep linking section covers the part most teams skip — universal links vs URL schemes, the iOS associated-domains setup, the Android intent-filter setup, the cold-start vs warm-resume code path divergence.
- Platform conventions explicit: iOS users expect swipe-back from the left edge, Android users expect the system back button. The skill includes the per-platform configuration to honor both without conflict.

## What It Does

navigation-patterns is the mobile navigation reference for picking and implementing the right navigation shape for an app. It walks through the four primary patterns (tab bar, drawer, stack, modal) with concrete decision criteria (top-level destination count, hierarchy depth, flow linearity), and the per-platform conventions that determine whether the navigation feels native or wrong.

Decision criteria are explicit. Tab bar: 2-5 top-level destinations, all peers. Drawer: 6+ destinations or strong hierarchy. Stack: sequential flows where 'back' is meaningful. Modal: blocking sub-flows that need explicit dismiss. Apps mix patterns (tab bar at root, stack within each tab, modal for sub-flows) — the skill walks the composition rules.

Deep linking gets a full section because it's where most teams discover their navigation architecture is wrong. Universal links (iOS) require associated-domains config and a server-side `/.well-known/apple-app-site-association` file. App Links (Android) require intent-filters and Digital Asset Links. Cold-start (app launched by link) vs warm-resume (app already running) take different code paths in React Navigation. The skill includes the working setup per platform.

Platform conventions: iOS swipe-back from the left edge of the screen pops the stack; Android's system back button pops the stack OR exits a tab. iOS prefers full-screen modals; Android prefers bottom sheets for the same role. The skill is opinionated about respecting each platform — the wrong convention makes the app feel foreign. Pairs with mobile-design (which covers the visual layer) and standalone-mobile-template (which sets up the navigation library).

## How to Use

1. Inventory top-level destinations first. ≤5 = tab bar. 6+ or hierarchical = drawer. Sequential = stack only.
2. Compose patterns: tab bar at root, stack within each tab, modal for blocking sub-flows. Document the composition.
3. Wire deep linking before shipping v1. Doing it later means reshaping every screen's params.
4. Test platform conventions: swipe-back on iOS, system back on Android. Both should work without code change.

## What NOT to Do

- Don't put 6+ tabs in a tab bar. The label space breaks; users hit the wrong tab. Use a drawer or a 'More' tab.
- Don't ship without deep linking. Every share, every email, every push notification relies on it; retrofitting is expensive.
- Don't override iOS swipe-back without a strong reason. It's the most-used navigation gesture and removing it makes the app feel broken.

## Quick Reference

| Property | Value |
|---|---|
| **Skill name** | navigation-patterns |
| **Category** | Skills · Design |
| **Rating** | ★★★★☆ (8/10) |
| **Trigger** | "mobile navigation pattern" · "tab vs drawer" · "deep linking setup" |
| **Bundle** | `SKILL.md` + `README.md` + `navigation-patterns.docx` |
| **Pairs With** | mobile-design, standalone-mobile-template, mobile-e2e-tests |

---

**TBK Labs** · Curated Kit · 2026-04-26
