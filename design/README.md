# Earned Light, the design

The ratified design for the Tellurion VS Code extension, in the repo so it travels with the
code it specifies. The implementation on `main` (engine under `src/core/engine`, webview at
`media/tellurion.html`) is built against this spec and gated by `verify/earned-light-walk.mjs`.

## The law of light, locked 2026-08-30

- Planets are products, moons are features. A body appears in the sky only when work on it
  has started (a first commit, branch, or agent mission touching its paths); a declared but
  untouched item stays a dashed row in the Flight Plan.
- Verification is the only source of light. A recorded check exiting 0 flips a moon to
  verified: category fill under a 32 percent verification-green wash, a bold 1.8px halo, a
  soft glow. Stale evidence keeps the wash while the halo decays to dotted amber. A failing
  check draws a broken red arc with its consecutive count. Nothing can be set by hand, and
  revoke exists.
- The product cue is no ring, then ring. A partially verified planet wears no ring geometry
  at all; its fraction prints in the label. When every feature is verified at HEAD and the
  product's own end-to-end walk passes, a verification shade blooms around the whole system,
  a 3.2px band ring with an outer hairline appears, and the product's orbit line lights.
  Falling out of verified fades the shade and withdraws the band to a dotted ring.
- Four skins, one law: Futuristic and Rustic, each in dark and light, toggled in the product.
  Rustic Light is the default. A skin changes tokens and typefaces only, never geometry or
  state meaning. Moon radius floor is 5px in every skin; size never encodes state.

## What is here

- `renders/` is the quick look: every board as a PNG. Start with
  `renders/SkyRusticLight.png` (the default skin), `renders/Cues.png` (the cue comparison
  that locked the verification treatment), `renders/StyleMatrix.png` (the four-skin token
  table), and `renders/real-sky-rustic-light.png` (this very repo's computed state, its
  light earned by its own checks).
- `boards/` is the source: fifteen `.dc.html` artboards plus `canvas.json` (their layout).
  Each board is a self-contained HTML file; open one in a browser to view it 1:1.

Boards, by page: Cover, Main (the Sky), Grammar (every state with its formula), Ignition
(the demo beat), FirstLight (empty state and honest inception), Plate (the exportable chart)
· Cues, StyleMatrix, SkyRusticLight, SkyRusticDark, SkyFuturisticLight (the styles page)
· DirectionEscapement, DirectionFirstLight, DirectionCapcom, DirectionAtlas (the four
adversarially critiqued concepts the synthesis came from, judge scores 7.5 to 8.5).

The living strategy record is the canonical page at
https://shares.tbk-labs.dev/tbk/tellurion.html (model tab carries the rulings and their
dates; the changelog carries the history).
