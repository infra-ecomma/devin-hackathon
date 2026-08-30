---
name: onboarding-ux
description: Design first-run experiences — empty states, welcome flows, guided tours, contextual tooltips, progressive disclosure, aha-moment targeting. Use when building onboarding, improving activation rates, or designing empty states. Triggers on "onboarding", "first-run", "empty state", "welcome flow", "activation", "getting started".
---

> **CHAIN:** After this skill → design-critique, quality-gate, web-design-review, responsive-design, web-accessibility


# Onboarding UX


## Overview

The first-run experience is the highest-stakes screen in any product. Users decide whether to stay or leave in minutes. Every onboarding decision must answer: "Does this help the user reach their first success moment faster?"

The first-run experience is the highest-stakes screen in any product. Users decide whether to stay or leave in minutes. Every onboarding decision must answer: "Does this help the user reach their first success moment faster?"

---

## Core Principle

**Get the user to the aha moment as fast as possible.**

The aha moment is the specific instant when a user personally experiences the product's core value. Everything in onboarding is friction that precedes the aha moment. Minimize it.

Examples:
- Slack: "Oh, my whole team is actually in here talking."
- Notion: "I can structure this exactly how I think."
- Analytics tool: "That's why conversion dropped on Tuesday."

Define the aha moment for your product before designing anything else.

---

## Phase 1 — Map the Journey

Before building, map what stands between a new user and their aha moment:

1. What is the aha moment? (be specific)
2. What is the minimum data/setup required to reach it?
3. What can be deferred until after the aha moment?
4. What does the product look like before the user has any data? (empty state)
5. Where do most users drop off today? (or where will they likely drop off?)

---

## Phase 2 — Empty States

Empty states are not the absence of content. They are the product's first conversation with the user.

### The Three Types of Empty States

**1. First-run empty state (user has no data yet)**
Most important. Must guide the user toward their first action. Never leave a blank white box.

Structure:
- Illustration or icon (relevant to the feature, not generic)
- Benefit-oriented headline: "Your projects live here" not "No projects"
- One-sentence explanation of what this feature does
- Single primary CTA: the exact action that creates the first item
- Optional: example/sample data they can explore

**2. Search/filter empty state (query returned nothing)**
- Acknowledge what was searched
- Suggest a correction or broadened search
- Offer to clear filters
- Never say just "No results found."

**3. Error-caused empty state (data failed to load)**
- Explain what happened (briefly, humanly)
- Offer a retry action
- Don't make the user wonder if the page is broken or empty by design

### Empty State Copy Rules

- Headline = benefit or context, not the absent thing ("See all your campaigns" not "No campaigns")
- Body = 1-2 sentences, tells the user what they'll get when they create their first item
- CTA = clear verb + noun ("Create your first project", "Add a team member", "Connect your account")

---

## Phase 3 — Welcome Flows

Welcome flows run once. They must earn every second they take.

### Principles

**Ask only what is essential.** If you don't use data within the first session, don't collect it on signup. Every extra field is a user you lose.

**Show progress.** If the flow has multiple steps, show a step indicator. Users drop off when they don't know how long something takes.

**Respect the back button.** Every step in a welcome flow must be navigable backward without losing entered data.

**Let users skip.** A forced tour is a hostage situation. Every guided flow needs a visible skip option. Users who skip but arrive at the product are better than users who quit because they were trapped.

### Welcome Flow Patterns

**Minimal flow (2-3 steps):**
1. Confirm or personalize account (name, avatar, timezone)
2. One setup action that directly enables the aha moment
3. Land on the product — done

**Progressive setup flow:**
1. Welcome screen — name the value proposition, show what awaits
2. 2-3 questions that personalize the experience
3. First action that creates real value
4. Checklist of optional setup steps (not required, but visible for completion-driven users)

---

## Phase 4 — Guided Tours

Tours work when they are contextual. They fail when they are a slideshow of the whole product.

### Rules for Tours

**Contextual, not global.** Show a tooltip when the user hovers a feature for the first time, not a 12-step tour the moment they log in.

**One spotlight at a time.** Highlight one element, explain one thing. Multiple simultaneous tooltips = noise.

**Trigger on intent, not time.** Show the tooltip when the user reaches the relevant area, not 3 seconds after login.

**Permanent dismiss.** If a user dismisses a tooltip, it stays dismissed. Never re-show after dismissal.

**Tooltip structure:**
- Title: what this feature is called (optional if obvious)
- Body: 1-2 sentences on what it does or why it matters
- CTA or "Got it" dismiss
- Step indicator if part of a sequence

---

## Phase 5 — Progressive Disclosure

Don't show everything at once. Reveal complexity as the user earns it.

### Implementation Patterns

**Beginner/advanced modes:**
Simple interface by default. "Advanced settings" expands additional options. The advanced path must be obvious but not in the way.

**Contextual feature reveal:**
Feature X appears in the UI only after the user has completed prerequisite step Y. No orphaned advanced tools presented to users who haven't set up the basics.

**Inline education:**
Replace help docs with in-context explanations adjacent to complex fields. "Why do we ask this?" links that expand inline, not links that open a new tab.

**Checklists:**
Activation checklists work for completion-motivated users. Rules:
- Show completion percentage
- Check off steps automatically when the user takes the action (don't require manual checking)
- Make each uncompleted item a link to the relevant feature
- Hide or minimize the checklist once 100% complete — don't leave it there forever

---

## Dos and Don'ts

**Do:**
- Define the aha moment before designing anything.
- Treat empty states as primary design surfaces, not afterthoughts.
- Allow skipping at every step.
- Auto-dismiss checklists on completion.
- Test with real new users who have never seen the product.

**Don't:**
- Force users through a full tour before they can use the product.
- Ask for information you won't use in the first session.
- Show "No results" without context or a path forward.
- Use modal onboarding that blocks the product — use inline guidance instead.
- Re-show dismissed tooltips — it destroys trust.
- Assume users will read — they scan; design for scanners.

---

## Metrics That Indicate Onboarding Health

- **Activation rate** — percentage of signups who complete the aha moment within 7 days
- **Time to first value** — median time from signup to first meaningful action
- **Step completion rate** — where in the welcome flow do users drop off?
- **Empty state → first item conversion** — what % of users who see the empty state create their first item?

---

## Kit Integration

- **During GSD** — fires when onboarding screens, empty states, or welcome flows are in the build plan
- **During /kit planning** — consulted when user activation is a project goal
- **During design-critique** — referenced when reviewing first-run experience or empty states
- **On demand** — triggered by "onboarding", "first-run", "empty state", "welcome flow", "activation", "getting started"




---

## Example Session

```
User: Design first-run onboarding for new FleetCraft dispatchers

Activation moment: assign first job successfully

Flow (4 steps, 5 minutes target):
  1. Welcome + skip option (always visible)
     "Hey, you're 5 minutes from your first dispatch."
  2. Import truck CSV (or use a sample fleet of 8 trucks)
     One-click "Use sample fleet" button
  3. Assign a sample job to a sample truck (real interaction with mock data)
     Tooltip arrow points to drag handle on first attempt only
  4. Confetti moment + transition to real workflow
     "Tap below to import your real fleet"

Empty states defined:
  Trucks page (no trucks): hero illustration + 2 CTAs (upload CSV / try sample)
  Jobs page (no jobs): minimal — "Drag a truck onto a time slot to create a job"
  Map page (no trucks active): single sentence + link to truck list

Persistence:
  user.onboarding_completed_at: timestamp set on step 4 completion
  user.tour_dismissed: separate flag for skip vs complete
  Re-trigger tour only on explicit "Show tour again" from settings

Activation metric:
  % of new dispatchers who complete step 3 within first session: target 70%

Saved: dev_docs/specs/onboarding-flow.md + web/src/components/Onboarding.tsx
Chain → design-critique, ab-test-setup (test variants on step 2)
```

---

## Chain Dispatch

### Always invoke after this skill:
Skill: design-critique
Skill: quality-gate

### If UI was touched, also invoke:
Skill: web-design-review
Skill: responsive-design
Skill: web-accessibility
