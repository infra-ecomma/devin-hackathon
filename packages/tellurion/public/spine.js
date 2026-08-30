// The Spine, v4. A scrollable, animated timeline of the build record.
// No anatomical drawing: milestone gems on one luminous cord, product sections
// with sticky headers and accent bars, features as pink satellites, a minimap
// so the whole record stays in sight while you scroll. Full sentences, never
// truncated. During a replay, rows dated after the scrub position ghost out.

const SVGNS = 'http://www.w3.org/2000/svg';
const svgEl = (tag, attrs = {}, parent = null) => {
  const n = document.createElementNS(SVGNS, tag);
  for (const [k, v] of Object.entries(attrs)) n.setAttribute(k, v);
  if (parent) parent.appendChild(n);
  return n;
};
const div = (cls, parent, html) => {
  const n = document.createElement('div');
  if (cls) n.className = cls;
  if (html != null) n.innerHTML = html;
  if (parent) parent.appendChild(n);
  return n;
};
const esc = (s) => String(s).replace(/[&<>"]/g, (ch) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[ch]));

export function initSpine(listEl, minimapEl, { onHoverSeg = () => {}, onHoverVb = () => {} } = {}) {
  let world = null;
  let segs = [];
  let hot = null;
  let viewMode = 'record';
  let lastKey = '';
  let vbCount = 0, litFrontier = null;
  let pendingDraftOpen = false; // a draft the operator asked for: open the editor the moment it lands
  const headerEls = new Map();

  function setWorld(w) {
    world = w;

    // Record milestones, kept by the thing they belong to. The chat's to-do list
    // is not the plan: it dies with the chat and dates every row the day it was
    // typed, so it stays out of the spine entirely.
    const byEnt = new Map();
    for (const m of w.stat.milestones) {
      if (m.entity === 'plan') continue;
      if (!byEnt.has(m.entity)) byEnt.set(m.entity, []);
      byEnt.get(m.entity).push(m);
    }
    for (const list of byEnt.values()) list.sort((a, b) => ((a.date || '9999') < (b.date || '9999') ? -1 : 1));

    // THE SPINE IS THE PLAN, LED BY PRODUCT, AND A PRODUCT IS MADE OF FEATURES.
    // It used to list a product's STEPS here, because `stat.features` was every
    // plan step under a different name. A step is work and reads as a verb
    // ("Resolve a project to its git root"); a feature is a part of the product
    // and reads as a noun ("Project discovery"). Features are declared on the
    // product now, so this lists what the product IS and the steps sit one level
    // down, inside the feature they build.
    const rowOfFeature = (f) => {
      const n = (f.steps || []).length, d = f.stepsDone || 0;
      // Progress and custody are two different axes and they get two different
      // marks: how much of the work is done, and who has signed for it.
      const status = n ? (d === n ? 'done' : (d || f.inHand) ? 'in-progress' : 'planned')
                       : (f.status !== 'open' ? 'done' : 'planned');
      return {
        id: f.id, kind: 'feature', featureId: f.feature, label: f.name,
        plain: f.plain || f.name, date: '', status, tier: f.status, inHand: f.inHand,
        staleVerdict: f.staleVerdict, staleAccept: f.staleAccept,
        failedBy: f.failedBy, failedNote: f.failedNote, inherited: f.inherited,
        steps: f.steps || [], stepsDone: d, stepsTotal: n,
      };
    };
    const rowOfMs = (m) => ({
      id: 'ms:' + (m.id || m.label), kind: 'milestone', label: m.label,
      plain: m.plain || m.label, date: m.date || '',
      status: m.status === 'done' ? 'done' : m.status === 'in-progress' ? 'in-progress' : 'planned',
    });

    const featsOf = (pid) => (w.stat.features || []).filter((f) => f.parent === pid && String(f.id).startsWith('feat:'));
    const planets = w.stat.planets || [];
    const pl = w.plan;
    const declared = [];
    const seen = new Set();

    if (pl && pl.products && pl.products.length) {
      // The plan lists its products in an order and that order is a statement,
      // so the spine follows it rather than re-sorting by date.
      for (const pr of pl.products) {
        const pid = 'plan:' + pr.id;
        seen.add(pid);
        const planet = planets.find((x) => x.id === pid);
        const feats = featsOf(pid);
        const loose = (planet && planet.loose) || [];
        declared.push({
          id: pid, name: pr.name, kind: 'product', plan: true,
          declared: pr.declared !== false,
          status: pr.declared === false ? 'dormant' : (planet ? planet.status : 'building'),
          note: pr.note || '', feats, loose,
          ms: byEnt.get(pr.id) || [],
          rows: feats.map(rowOfFeature),
          // A plan written before features existed declares none. Counting
          // features then reports 0/0 against a plan with 25 steps and 21 of
          // them done, which is a worse answer than the one it replaced. Until
          // such a plan is migrated the fraction falls back to its steps, so
          // progress is still said. Display is unaffected: these are counted,
          // never drawn as features.
          countRows: feats.length ? feats.map(rowOfFeature) : loose.map((st) => ({
            id: 'step:' + st.id, kind: 'step', label: st.title, plain: st.title, date: '',
            status: st.planStatus === 'done' ? 'done' : st.planStatus === 'active' ? 'in-progress' : 'planned',
          })),
        });
      }
    }

    // Directories the instrument noticed activity in. These are NOT products
    // anybody declared, and drawing them identically to declared ones is why the
    // header's product count and this list disagreed. They keep their record and
    // their own group (decision D4, 2026-08-30); nothing is hidden.
    const discovered = [];
    for (const p of planets) {
      if (seen.has(p.id) || String(p.id).startsWith('plan:') || p.tier !== 'flagship') continue;
      const ms = byEnt.get(p.id) || [];
      if (!ms.length) continue;
      discovered.push({
        id: p.id, name: p.name, kind: 'discovered', plan: false, declared: false,
        status: p.status, note: '', feats: [], loose: [], ms,
        rows: ms.map(rowOfMs), countRows: ms.map(rowOfMs),
      });
    }
    discovered.sort((a, b) => (b.ms.length - a.ms.length));

    // With no plan at all the record is all there is, so it leads rather than
    // sitting under a heading that says it is the leftovers.
    segs = declared.length ? declared.concat(discovered) : discovered;

    // A draft the operator asked for has landed: the sky already drew itself;
    // open the editor on the new plan so the read-and-fix pass starts now. The
    // `at` marker keeps an OLD plan's steps from passing for the new draft's.
    const dr = (w.project && w.project.draft) || null;
    if (pendingDraftOpen && dr && dr.state === 'done' && dr.at !== pendingDraftOpen.since
        && w.plan && w.plan.exists && !w.plan.error && w.plan.totals && w.plan.totals.steps > 0) {
      pendingDraftOpen = null;
      setTimeout(() => openPlanEditor(), 60);
    }
    lastKey = '';
  }

  const msTime = (m) => (m.date ? +new Date(m.date + 'T12:00:00Z') : null);
  const isDoneAt = (m, T) => m.status === 'done' && (T == null || m.date === '' || (msTime(m) != null && msTime(m) <= T));
  const isFuture = (m, T) => T != null && m.date !== '' && (msTime(m) == null || msTime(m) > T);

  // The headline counts what the spine LISTS, which is features once a plan
  // declares them. It used to count plan steps while the header three inches
  // away counted every feature-ish thing discovered anywhere, so one screen gave
  // two answers to the same question (decision D5, 2026-08-30).
  const scope = () => (segs.some((s) => s.plan) ? segs.filter((s) => s.plan) : segs);
  function doneCount(T) {
    let n = 0;
    for (const s of scope()) for (const m of (s.countRows || s.rows)) if (isDoneAt(m, T)) n++;
    return n;
  }
  const total = () => scope().reduce((a, s) => a + (s.countRows || s.rows).length, 0);

  // A product is a headline; its features are what you open. Collapsed by
  // default is what stops the spine being a wall of text, which is the other
  // half of the same complaint.
  const openSegs = new Set();
  // A feature opens to show its steps; the discovered group opens to show the
  // directories nobody declared. Both closed by default: collapsed is what keeps
  // an expanded product legible rather than a wall.
  const openFeats = new Set();
  let showDiscovered = false;
  try { showDiscovered = localStorage.getItem('tellurion-show-discovered') === '1'; } catch {}
  function toggleFeat(id) {
    if (openFeats.has(id)) openFeats.delete(id); else openFeats.add(id);
    try { localStorage.setItem('tellurion-open-feats', JSON.stringify([...openFeats])); } catch {}
    lastKey = ''; render({});
  }
  try { for (const id of JSON.parse(localStorage.getItem('tellurion-open-feats') || '[]')) openFeats.add(id); } catch {}
  function toggleSeg(id) {
    if (openSegs.has(id)) openSegs.delete(id); else openSegs.add(id);
    try { localStorage.setItem('tellurion-open-segs', JSON.stringify([...openSegs])); } catch {}
    lastKey = ''; render({});
  }
  try { for (const id of JSON.parse(localStorage.getItem('tellurion-open-segs') || '[]')) openSegs.add(id); } catch {}

  function setHot(segId) {
    if (hot === segId) return;
    hot = segId;
    for (const sec of listEl.querySelectorAll('.sseg, .mseg')) sec.classList.toggle('hot', sec.dataset.seg === hot);
  }

  function setViewMode(v) { viewMode = ['map', 'logic'].includes(v) ? v : 'record'; lastKey = ''; }

  const fmtDate = (d) => (d ? d.slice(5).replace('-', '.') : '');

  function nodeSvg(status) {
    const s = svgEl('svg', { viewBox: '-8 -8 16 16' });
    if (status === 'done') {
      svgEl('path', { class: 'gem-done', d: 'M 0 -6 L 5.4 0 L 0 6 L -5.4 0 Z' }, s);
      svgEl('path', { class: 'gem-done-tick', d: 'M -2.3 0 L -0.6 1.9 L 2.6 -1.7' }, s);
    } else if (status === 'progress') {
      svgEl('circle', { class: 'gem-prog-pulse', cx: 0, cy: 0, r: 5, 'stroke-width': 1 }, s);
      svgEl('path', { class: 'gem-prog', d: 'M 0 -5.4 L 4.8 0 L 0 5.4 L -4.8 0 Z' }, s);
    } else {
      svgEl('path', { class: 'gem-plan', d: 'M 0 -5.4 L 4.8 0 L 0 5.4 L -4.8 0 Z' }, s);
    }
    return s;
  }

  function render({ scrubT = null } = {}) {
    if (!world) return;
    const key = [viewMode, scrubT || 'now', total(), openSegs.size, openFeats.size, showDiscovered,
      (world.project && world.project.draft && world.project.draft.state) || ''].join(':');
    if (key === lastKey) return;
    lastKey = key;
    if (viewMode === 'map') { renderMap(scrubT); return; }
    if (viewMode === 'logic') { renderLogic(); return; }
    if (minimapEl) minimapEl.style.display = '';

    const keepScroll = listEl.scrollTop;
    listEl.innerHTML = '';
    headerEls.clear();

    // A plan that could not be read, or one whose ids collided, is SAID. The
    // reducer already refuses to silently swallow either, but nothing ever put
    // them on the glass, so a typo that emptied the spine looked exactly like a
    // project with no plan yet — the one confusion the plan file exists to end.
    planTrouble(listEl);

    // The plan is never finished (T3): wherever the spine is drawn from one,
    // the way back into the editor sits at its head.
    editBar(listEl);

    // Day zero. Nothing declared and nothing recorded, which is the honest state
    // of a project on its first morning. It used to render an empty rail and a
    // ten pixel cord stub that looked like a stray character on the page. It
    // says what to do now, and it does the doing.
    if (!segs.length) {
      renderEmpty();
      return;
    }

    const wrap = div('srail-wrap', listEl);
    div('srail', wrap);
    const cordGlow = div('scord-glow', wrap);
    const cord = div('scord', wrap);

    let rowIx = 0;
    let lastDoneRow = null;

    let groupDrawn = false;
    for (const s of segs) {
      // The discovered group gets one heading, once, and opens on click. Before
      // this the two kinds of section were indistinguishable.
      if (s.kind === 'discovered' && !groupDrawn) {
        groupDrawn = true;
        const n = segs.filter((x) => x.kind === 'discovered').length;
        const gh = div('sgroup' + (showDiscovered ? ' open' : ''), wrap);
        gh.innerHTML = `<span class="sgroup-caret">${showDiscovered ? '&#9662;' : '&#9656;'}</span>` +
          `<b>Also seen in this repo</b><span class="sgroup-n">${n} not in the plan</span>`;
        gh.addEventListener('click', () => {
          showDiscovered = !showDiscovered;
          try { localStorage.setItem('tellurion-show-discovered', showDiscovered ? '1' : '0'); } catch {}
          lastKey = ''; render({ scrubT });
        });
      }
      if (s.kind === 'discovered' && !showDiscovered) continue;

      const sec = div('sseg' + (s.id === hot ? ' hot' : '') + (s.kind === 'discovered' ? ' found' : ''), wrap);
      sec.dataset.seg = s.id;

      const doneN = s.rows.filter((m) => isDoneAt(m, scrubT)).length;
      const open = openSegs.has(s.id);
      const h = div('sseg-h' + (s.status === 'dormant' ? ' dormant' : '') + ' clickable' + (open ? ' open' : ''), sec);
      div('sa', h);
      div('sseg-caret', h, open ? '&#9662;' : '&#9656;');
      const nameEl = div('sseg-name', h, esc(s.name));
      nameEl.title = s.note || s.name;
      // A product with nothing under it says so once, quietly. "0/0 features" on
      // fifteen rows says nothing fifteen times.
      if (!s.rows.length) div('sseg-score empty', h, s.kind === 'product' ? 'no features yet' : 'nothing yet');
      else div('sseg-score', h, `<b>${doneN}</b>/${s.rows.length}`);
      headerEls.set(s.id, h);
      h.addEventListener('pointerenter', () => onHoverSeg(s.id));
      h.addEventListener('pointerleave', () => onHoverSeg(null));
      h.style.cursor = 'pointer';
      h.addEventListener('click', () => toggleSeg(s.id));

      for (const m of (open ? s.rows : [])) {
        const future = isFuture(m, scrubT);
        const cls = m.status === 'done' ? 'done' : m.status === 'in-progress' ? 'progress' : 'planned';
        const isFeat = m.kind === 'feature';
        const fOpen = isFeat && openFeats.has(m.id);
        const row = div('srow vb ' + cls + (future ? ' future' : '') + (isFeat ? ' feat' : '') + (fOpen ? ' fopen' : ''), sec);
        row.style.setProperty('--i', Math.min(rowIx, 34));
        rowIx++;
        const node = div('snode', row);
        node.appendChild(nodeSvg(future && m.status === 'done' ? 'planned' : cls === 'done' ? 'done' : cls === 'progress' && !future ? 'progress' : 'planned'));
        // A feature carries how much of it is done. A milestone carries its date.
        // Neither is "next": printing that against every row said the same untrue
        // thing eight times and buried which one is actually in hand.
        div('sdate', row, isFeat
          ? (m.stepsTotal ? `${m.stepsDone}/${m.stepsTotal}` : (m.status === 'done' ? 'done' : ''))
          : (m.date ? fmtDate(m.date) : (m.status === 'done' ? 'done' : m.status === 'in-progress' ? 'now' : '')));
        const tx = div('stext', row, esc(m.plain || m.label));
        if (m.plain && m.plain !== m.label) div('stech', tx, esc(m.label));

        // The custody mark, on the row. This is the cue the whole instrument is
        // for: a feature that has been verified has to be visible as verified
        // from across the room (decision D3, 2026-08-30).
        if (isFeat) {
          const t = m.failedBy ? 'failed' : m.inHand ? 'in-hand' : m.tier;
          const mark = document.createElement('i');
          mark.className = 'stier t-' + t;
          mark.title = m.failedBy
            ? `${m.failedBy} failed this${m.failedNote ? ': ' + m.failedNote : ''}`
            : t === 'in-hand' ? 'in hand right now'
            : t === 'open' ? 'nobody has spoken for this'
            : t === 'claimed' ? 'the builder claims it' + (m.staleVerdict ? ' — an earlier version was judged' : '')
            : t === 'verified' ? 'a judge passed it' + (m.inherited ? ', inherited from its steps' : '') + (m.staleAccept ? ' — you accepted an earlier version' : '')
            : 'you accepted it';
          row.appendChild(mark);
          headerEls.set(m.id, row);
          if (m.steps.length) {
            row.classList.add('has-steps');
            row.addEventListener('click', (ev) => { ev.stopPropagation(); toggleFeat(m.id); });
          }
        }
        row.addEventListener('pointerenter', (ev) => onHoverVb(m, s, ev.clientX, ev.clientY));
        row.addEventListener('pointerleave', () => onHoverVb(null));
        if (m.status === 'done' && !future) lastDoneRow = row;

        // THE STEPS, one level down and closed by default. They are the long
        // sentences, and putting them at the top level is what made the spine a
        // wall of text. Custody still lives here too, so nothing left the panel.
        if (isFeat && fOpen) {
          for (const st of m.steps) {
            const scls = st.planStatus === 'done' ? 'done' : st.planStatus === 'active' ? 'progress' : 'planned';
            const sr = div('sstep ' + scls, sec);
            div('sstep-dot', sr);
            div('sstep-txt', sr, esc(st.title));
            const smk = document.createElement('i');
            smk.className = 'stier small t-' + (st.failedBy ? 'failed' : st.inHand ? 'in-hand' : st.status);
            smk.title = st.failedBy ? `${st.failedBy} failed this` : st.inHand ? 'in hand right now' : st.status;
            sr.appendChild(smk);
            headerEls.set('step:' + st.id, sr);
          }
        }
      }

      // Steps that name this product but no feature. They are not dressed up as
      // features, which is the whole point of the change; they are said plainly
      // so the gap is visible and can be closed in the plan.
      if (open && s.loose.length) {
        const lh = div('sloose-h', sec, `${s.loose.length} step${s.loose.length === 1 ? '' : 's'} not under a feature yet`);
        lh.title = 'These name the product but no feature. Give each a produces.feature in the plan and they join one.';
        for (const st of s.loose) {
          const sr = div('sstep loose ' + (st.planStatus === 'done' ? 'done' : st.planStatus === 'active' ? 'progress' : 'planned'), sec);
          div('sstep-dot', sr);
          div('sstep-txt', sr, esc(st.title));
        }
      }
    }


    vbCount = total();

    // light the cord to the frontier once layout exists
    requestAnimationFrame(() => {
      const wrapRect = wrap.getBoundingClientRect();
      let fy = 10;
      if (lastDoneRow) {
        // rect difference is content-relative regardless of scroll; offsetTop is not
        fy = lastDoneRow.getBoundingClientRect().top - wrapRect.top + 15;
      }
      litFrontier = fy;
      cord.style.height = fy + 'px';
      cordGlow.style.height = fy + 'px';
      buildMinimap(scrubT);
    });

    listEl.scrollTop = keepScroll;
  }

  function planTrouble(host) {
    const pl = world.plan;
    if (!pl) return;
    if (pl.error) {
      div('splan-bad', host, `<b>The plan file could not be read.</b><span>${esc(pl.error)}</span>
        <span>Nothing below is missing, it simply could not be parsed. Fix the file and this clears itself.</span>`);
      return;
    }
    const stale = (world.stat.features || []).filter((f) => f.staleVerdict || f.staleAccept);
    if (stale.length) {
      div('splan-warn', host, `<b>${stale.length} sign-off${stale.length === 1 ? '' : 's'} no longer match${stale.length === 1 ? 'es' : ''} the step it was given for.</b>
        <span>${stale.slice(0, 6).map((f) => esc(f.name) + (f.staleAccept ? ' — you accepted an earlier version of this' : ' — the judge passed an earlier version of this')).join('<br/>')}</span>
        <span>The step was edited after it was signed, so the sign-off does not carry. Run the judge again, or put the wording back.</span>`);
    }
    if (pl.orphans && pl.orphans.length) {
      div('splan-warn', host, `<b>${pl.orphans.length} sign-off${pl.orphans.length === 1 ? '' : 's'} point at a step that is gone.</b>
        <span>${pl.orphans.slice(0, 6).map(esc).join('<br/>')}</span>
        <span>Left alone, one of these lands on the next step that reuses the id. Remove the row, or put the step back.</span>`);
    }
    if (pl.collisions && pl.collisions.length) {
      div('splan-warn', host, `<b>Two things in the plan share one id.</b>
        <span>${pl.collisions.map(esc).join('<br/>')}</span>
        <span>A sign-off is addressed by id, so a shared one would let a single verdict cover two different steps. They have been made unique for now; give them real ids in the file.</span>`);
    }
  }

  function renderEmpty() {
    if (minimapEl) { minimapEl.style.display = 'none'; minimapEl.innerHTML = ''; }
    const name = (world.project && world.project.name) || 'this project';
    // F1 (honest card), operator ruling 2026-08-30: this screen used to display
    // an editable JSON starter full of invented placeholder products. Only 2 of
    // the 22 projects it can see had plans, so in most windows the instrument
    // led with fake products and read as broken. No placeholders: the card names
    // what the plate actually sees, and the doors are the instrument draft, the
    // blank hand editor, and /inception.
    // A file that could not be read is NOT "no plan yet", and the two messages
    // used to stack. Worse, the button underneath offered to overwrite the one
    // file whose contents are unknown.
    if (world.plan && world.plan.error) return;

    const s = world.stat || {};
    const seen = `${(s.tools || []).length} tools, ${(s.processes || []).length} processes, ${(s.workflows || []).length} workflows`;
    const wrap = div('sempty', listEl);
    wrap.innerHTML = `
      <h4>No plan declared yet</h4>
      <p>The spine draws the plan you declare, and the plate draws the bodies that plan produces.
         Until one exists there are no products here; what the plate already sees in ${esc(name)}
         is ${seen} this project has actually used.</p>
      <p>Ways to one: run <code>/inception</code> and the plan is born from the spec you approve,
         let the project's own harness read this repo and draft it, or write it by hand at
         <code>.tellurion/plan.json</code> and open it here from the blank editor. A missing spec
         file does not mean a missing product; the draft uses judgment, and
         every draft stays editable.</p>
      <div class="sempty-actions">
        <button id="planDraft" class="primary">Draft it with the instrument</button>
        <button id="planEdit">Edit by hand</button>
      </div>
      <span class="ok" id="planOk"></span>`;
    const ok = wrap.querySelector('#planOk');
    const f = window.__laFetch || fetch;
    const draftState = (world.project && world.project.draft) || null;

    const draftBtn = wrap.querySelector('#planDraft');
    // The click only STARTS the draft; the state then rides the world snapshot
    // (world.project.draft) and the plan file landing flips this whole panel out
    // of the empty state. A careful read of a real repo takes minutes, and the
    // button waits on the sky, not on the HTTP call.
    if (draftState && draftState.state === 'running') {
      draftBtn.disabled = true;
      ok.textContent = 'drafting — the project’s own harness is reading this repo. A careful read takes minutes; the sky draws itself when the plan lands.';
    } else if (draftState && draftState.state === 'failed') {
      ok.textContent = 'the draft failed: ' + (draftState.error || 'unknown') + ' — click again to retry.';
    }
    draftBtn.addEventListener('click', async () => {
      draftBtn.disabled = true;
      ok.textContent = 'starting the draft…';
      try {
        const r = await f('/api/plan/draft', { method: 'POST', headers: { 'content-type': 'application/json' }, body: '{}' });
        const d = await r.json();
        if (d && d.ok) { pendingDraftOpen = { since: draftState && draftState.at }; ok.textContent = 'drafting — the harness is reading this repo.'; }
        else { ok.textContent = (d && d.error) || 'the draft did not start'; draftBtn.disabled = false; }
      } catch { ok.textContent = 'the server did not answer'; draftBtn.disabled = false; }
    });
    wrap.querySelector('#planEdit').addEventListener('click', () => openPlanEditor());
  }

  /* ---- the plan editor (T3): one editor, reachable in every state, writing
          the same file a hand edit would. After every save the deterministic
          connection check runs (T4) and unmatched products can be handed to the
          harness for home proposals, which the operator accepts or ignores. ---- */

  function editBar(host) {
    if (!world || !world.plan || !world.plan.exists || world.plan.error) return;
    // An archive has no server behind it, so the editor's first move — GET
    // /api/plan — cannot resolve: the click did nothing at all and printed
    // "Fetch API cannot load file:///api/plan" where nobody was looking. The
    // Browser link already withdraws itself here for the same reason, on the
    // same reasoning: a control that cannot do anything is worse than no control.
    if (window.__EMBEDDED_WORLD__) return;
    // Same reasoning on a published instrument: every write route answers 403
    // there by construction, so the editor could only ever fail.
    if (world.project && world.project.public) return;
    const bar = div('splan-edit', host);
    const b = document.createElement('button');
    b.textContent = 'Edit plan';
    // The path used to sit beside the button as a code chip. It is noise on a
    // panel that is read constantly and says nothing the button does not, so it
    // lives on the button's own tooltip: available when wanted, invisible when not.
    b.title = 'The plan is yours to change; the spine follows it. (.tellurion/plan.json)';
    b.addEventListener('click', () => openPlanEditor());
    bar.appendChild(b);
    const dr = (world.project && world.project.draft) || null;
    if (dr && dr.state === 'running') div('splan-edit-note', bar, 'a draft is running; the file it lands will replace what you see.');
    else if (dr && dr.state === 'failed') div('splan-edit-note bad', bar, 'the last draft failed: ' + esc(dr.error || 'unknown'));
  }

  async function openPlanEditor(planData, connections) {
    const f = window.__laFetch || fetch;
    let pl = planData;
    if (!pl) {
      try { pl = await (await f('/api/plan')).json(); } catch { pl = null; }
      if (!pl) return;
    }
    const overlay = div('pedit-overlay', document.body);
    const close = () => overlay.remove();
    overlay.addEventListener('click', (e) => { if (e.target === overlay) close(); });

    // One working copy the rows edit directly; ids are settled server-side and
    // re-read after every save, so a rename never orphans a sign-off.
    const work = {
      project: pl.project || (world.project && world.project.name) || '',
      products: (pl.products || []).filter((p) => p.declared !== false).map((p) => ({ id: p.id, name: p.name, note: p.note || '', home: p.home || '' })),
      phases: (pl.phases || []).map((ph) => ({ id: ph.id, title: ph.title, steps: (ph.steps || []).map((s) => ({ id: s.id, title: s.title, status: s.status || 'planned', of: (s.produces && s.produces.of) || '' })) })),
    };

    const box = div('pedit', overlay);
    box.innerHTML = `
      <div class="pedit-h"><b>Edit the plan</b><span>${esc(work.project)} · writes <code>.tellurion/plan.json</code></span></div>
      <div class="pedit-body">
        <h5>Products</h5><div class="pedit-products"></div>
        <h5>Phases and steps</h5><div class="pedit-phases"></div>
      </div>
      <div class="pedit-conn"></div>
      <div class="pedit-f">
        <button class="primary" data-a="save">Save the plan</button>
        <button data-a="redraft" title="The project's own harness reads the repo and drafts again over this one">Re-draft</button>
        <button data-a="cancel">Close</button>
        <span class="ok"></span>
      </div>`;

    const productsEl = box.querySelector('.pedit-products');
    const phasesEl = box.querySelector('.pedit-phases');
    const connEl = box.querySelector('.pedit-conn');
    const okEl = box.querySelector('.pedit-f .ok');

    function productRow(p) {
      const r = div('pedit-prow', productsEl);
      r.innerHTML = `
        <input class="p-name" value="${esc(p.name)}" placeholder="Product name"/>
        <input class="p-home" value="${esc(p.home)}" placeholder="home path, e.g. src/app (optional)"/>
        <input class="p-note" value="${esc(p.note)}" placeholder="what it is, one line (optional)"/>
        <button class="p-del" title="Remove this product">×</button>`;
      r.querySelector('.p-name').addEventListener('input', (e) => { p.name = e.target.value; });
      r.querySelector('.p-home').addEventListener('input', (e) => { p.home = e.target.value; });
      r.querySelector('.p-note').addEventListener('input', (e) => { p.note = e.target.value; });
      r.querySelector('.p-del').addEventListener('click', () => { work.products = work.products.filter((x) => x !== p); r.remove(); renderPhaseProductOptions(); });
    }
    function addProductRow(p) { productRow(p); }
    const addP = div('pedit-add', productsEl, '<button>+ product</button>');
    addP.querySelector('button').addEventListener('click', () => { const p = { id: '', name: '', note: '', home: '' }; work.products.push(p); productRow(p); renderPhaseProductOptions(); });

    function renderPhaseProductOptions() {
      // Step "produces" selects track the product list as it is edited.
      for (const sel of phasesEl.querySelectorAll('select.s-of')) {
        const keep = sel.value;
        sel.innerHTML = '<option value="">— produces nothing declared —</option>' + work.products.filter((p) => p.name.trim()).map((p) => `<option value="${esc(p.id || p.name)}">${esc(p.name)}</option>`).join('');
        sel.value = keep;
      }
    }

    function stepRow(stepsEl, ph, s) {
      const r = div('pedit-srow', stepsEl);
      r.innerHTML = `
        <input class="s-title" value="${esc(s.title)}" placeholder="What is or was done"/>
        <select class="s-status">
          <option value="planned">planned</option><option value="active">active</option><option value="done">done</option>
        </select>
        <select class="s-of"></select>
        <button class="s-del" title="Remove this step">×</button>`;
      r.querySelector('.s-title').addEventListener('input', (e) => { s.title = e.target.value; });
      const status = r.querySelector('.s-status');
      status.value = s.status;
      status.addEventListener('change', (e) => { s.status = e.target.value; });
      const of = r.querySelector('.s-of');
      of.innerHTML = '<option value="">— produces nothing declared —</option>' + work.products.filter((p) => p.name.trim()).map((p) => `<option value="${esc(p.id || p.name)}">${esc(p.name)}</option>`).join('');
      of.value = s.of;
      of.addEventListener('change', (e) => { s.of = e.target.value; });
      r.querySelector('.s-del').addEventListener('click', () => { ph.steps = ph.steps.filter((x) => x !== s); r.remove(); });
    }

    function phaseBlock(ph) {
      const b = div('pedit-phase', phasesEl);
      b.innerHTML = `<div class="pedit-phase-h"><input class="ph-title" value="${esc(ph.title)}" placeholder="Phase title"/><button class="ph-del" title="Remove this phase">×</button></div><div class="pedit-steps"></div>`;
      b.querySelector('.ph-title').addEventListener('input', (e) => { ph.title = e.target.value; });
      b.querySelector('.ph-del').addEventListener('click', () => { work.phases = work.phases.filter((x) => x !== ph); b.remove(); });
      const stepsEl = b.querySelector('.pedit-steps');
      for (const s of ph.steps) stepRow(stepsEl, ph, s);
      const addS = div('pedit-add', stepsEl, '<button>+ step</button>');
      addS.querySelector('button').addEventListener('click', () => { const s = { id: '', title: '', status: 'planned', of: '' }; ph.steps.push(s); stepRow(stepsEl, ph, s); });
    }
    for (const p of work.products) addProductRow(p);
    for (const ph of work.phases) phaseBlock(ph);
    const addPh = div('pedit-add', phasesEl, '<button>+ phase</button>');
    addPh.querySelector('button').addEventListener('click', () => { const ph = { id: '', title: '', steps: [] }; work.phases.push(ph); phaseBlock(ph); phasesEl.appendChild(addPh); });

    function showConnections(list) {
      // T4 made visible: every product is either connected to a real path, or
      // named as unmatched with the offer of harness proposals.
      connEl.innerHTML = '';
      if (!list || !list.length) return;
      const unmatched = list.filter((c) => !c.matched);
      const head = div('pedit-conn-h', connEl, unmatched.length
        ? `${list.length - unmatched.length} of ${list.length} products connect to this repo.`
        : `Every product connects to this repo.`);
      void head;
      for (const c of list) {
        div('pedit-conn-row ' + (c.matched ? 'ok' : 'miss'), connEl, c.matched
          ? `<b>${esc(c.product.name)}</b> → <code>${esc(c.home || c.entry || '')}</code> <span>(${c.via === 'home' ? 'declared home' : 'name match'})</span>`
          : `<b>${esc(c.product.name)}</b> <span>— no path in this repo matches it</span>`);
      }
      if (unmatched.length) {
        const b = document.createElement('button');
        b.textContent = 'Propose connections';
        b.title = 'The harness looks at the real tree and proposes a home for each unmatched product. You accept; nothing is applied silently.';
        b.addEventListener('click', async () => {
          b.disabled = true; okEl.textContent = 'the harness is reading the tree…';
          try {
            const r = await f('/api/plan/reconcile', { method: 'POST' });
            const d = await r.json();
            if (d && d.ok && d.proposals && d.proposals.length) {
              let offered = 0;
              for (const pr of d.proposals) {
                if (!pr.home) { div('pedit-conn-row miss', connEl, `<b>${esc(pr.id)}</b> <span>— the harness found no honest home for it${pr.why ? ': ' + esc(pr.why) : ''}</span>`); continue; }
                offered++;
                const row = div('pedit-conn-row prop', connEl, `<b>${esc(pr.id)}</b> could live at <code>${esc(pr.home)}</code> <span>${esc(pr.why || '')}</span>`);
                const take = document.createElement('button');
                take.textContent = 'Accept';
                take.addEventListener('click', () => {
                  const prod = work.products.find((x) => (x.id || x.name) === pr.id);
                  if (prod) { prod.home = pr.home; row.remove(); okEl.textContent = 'home set — save to make it stick.'; syncProductInputs(); }
                });
                row.appendChild(take);
              }
              if (!offered) okEl.textContent = 'no honest proposal came back — the unmatched products may need a path created first.';
            } else okEl.textContent = (d && d.note) || 'no honest proposal came back';
          } catch { okEl.textContent = 'the server did not answer'; }
          b.disabled = false;
        });
        connEl.appendChild(b);
      }
    }
    function syncProductInputs() {
      [...productsEl.querySelectorAll('.pedit-prow')].forEach((r, i) => {
        const p = work.products[i];
        if (!p) return;
        r.querySelector('.p-home').value = p.home || '';
      });
    }
    if (connections) showConnections(connections);

    box.querySelector('[data-a="cancel"]').addEventListener('click', close);
    box.querySelector('[data-a="save"]').addEventListener('click', async (e) => {
      const btn = e.target;
      btn.disabled = true; okEl.textContent = 'writing…';
      const payload = {
        project: work.project,
        products: work.products.filter((p) => p.name.trim()).map((p) => ({ ...(p.id ? { id: p.id } : {}), name: p.name.trim(), ...(p.note.trim() ? { note: p.note.trim() } : {}), ...(p.home.trim() ? { home: p.home.trim() } : {}) })),
        phases: work.phases.filter((ph) => ph.title.trim() || ph.steps.length).map((ph) => ({
          ...(ph.id ? { id: ph.id } : {}), title: ph.title.trim() || 'Untitled phase',
          steps: ph.steps.filter((s) => s.title.trim()).map((s) => ({ ...(s.id ? { id: s.id } : {}), title: s.title.trim(), status: s.status, ...(s.of ? { produces: { of: s.of } } : {}) })),
        })),
      };
      try {
        const r = await f('/api/plan', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(payload) });
        const d = await r.json();
        if (d && d.ok) {
          okEl.textContent = 'written — the spine is already following it.';
          // Settle ids from what the server wrote, so the next save renames
          // rather than duplicates.
          const saved = d.plan || {};
          work.products = (saved.products || []).filter((p) => p.declared !== false).map((p) => ({ id: p.id, name: p.name, note: p.note || '', home: p.home || '' }));
          work.phases = (saved.phases || []).map((ph) => ({ id: ph.id, title: ph.title, steps: (ph.steps || []).map((s) => ({ id: s.id, title: s.title, status: s.status, of: (s.produces && s.produces.of) || '' })) }));
          showConnections(d.connections);
        } else okEl.textContent = (d && d.error) || 'the write was refused';
      } catch { okEl.textContent = 'the server did not answer'; }
      btn.disabled = false;
    });
    box.querySelector('[data-a="redraft"]').addEventListener('click', async (e) => {
      const btn = e.target;
      if (btn.dataset.arm !== '1') { btn.dataset.arm = '1'; btn.textContent = 'Really re-draft over this?'; return; }
      btn.disabled = true; okEl.textContent = 'starting the draft…';
      try {
        const r = await f('/api/plan/draft', { method: 'POST', headers: { 'content-type': 'application/json' }, body: '{"force":true}' });
        const d = await r.json();
        if (d && d.ok) {
          // The draft runs free; when the new plan lands the editor reopens on
          // it. Until then the old plan stays on the plate, untouched.
          pendingDraftOpen = { since: (world.project && world.project.draft && world.project.draft.at) || null };
          close();
        }
        else { okEl.textContent = (d && d.error) || 'the draft did not start'; btn.disabled = false; btn.dataset.arm = ''; btn.textContent = 'Re-draft'; }
      } catch { okEl.textContent = 'the server did not answer'; btn.disabled = false; btn.dataset.arm = ''; btn.textContent = 'Re-draft'; }
    });
  }

  /* ---- map view: the condensed bough — trunk of products, milestone beads
          branching right, feature leaves branching left ---- */
  function renderMap(scrubT) {
    if (minimapEl) { minimapEl.style.display = 'none'; minimapEl.innerHTML = ''; }
    listEl.innerHTML = '';
    headerEls.clear();
    const wrap = div('srail-wrap', listEl);
    div('mtrunk', wrap);

    // The SAME sections the record view shows. This used to build its own union
    // of "every entity with a record", which on this repo drew 25 branches beside
    // a record view listing 14: one panel, two tabs, two different answers about
    // what the project is made of. The spine has one set of products and both
    // views draw it.

    segs.forEach((e, ix) => {
      const seg = div('mseg' + (e.status === 'dormant' ? ' dormant' : '') + (e.id === hot ? ' hot' : ''), wrap);
      seg.dataset.seg = e.id;
      seg.style.setProperty('--i', ix);

      const leaves = div('mleaves', seg);
      if (e.feats.length) {
        div('mstem', leaves);
        for (const f of e.feats) {
          const i = document.createElement('i');
          // one class per tier, so the strip cannot say fewer things than the plate
          i.className = f.inHand ? 'in-hand' : f.status === 'fully-verified' ? 'accepted' : f.status === 'verified' ? 'verified' : f.status === 'open' ? 'open' : 'claimed';
          i.title = f.plain || f.name;
          leaves.appendChild(i);
        }
      }

      const doneN = e.ms.filter(m => isDoneAt(m, scrubT)).length;
      const node = div('mnode', seg);
      const r = Math.min(11, 4.5 + 1.6 * Math.sqrt(e.ms.length + e.feats.length * 0.55));
      const sv = svgEl('svg', { viewBox: '-13 -13 26 26', width: 26, height: 26 });
      if (e.status === 'dormant') svgEl('circle', { cx: 0, cy: 0, r, fill: 'none', stroke: 'var(--ink-45)', 'stroke-width': 1.2, 'stroke-dasharray': '3 2.4' }, sv);
      else {
        svgEl('circle', { cx: 0, cy: 0, r, fill: 'var(--card)', stroke: 'var(--ink-70)', 'stroke-width': 1.3 }, sv);
        if (e.status === 'live') svgEl('ellipse', { cx: 0, cy: 0, rx: r * 0.96, ry: r * 0.34, fill: 'none', stroke: 'var(--blue)', 'stroke-width': 1 }, sv);
      }
      node.appendChild(sv);

      const body = div('mbody', seg);
      const nm = div('mname', body);
      const nspan = document.createElement('span');
      nspan.textContent = e.name.toUpperCase();
      nm.appendChild(nspan);
      const sc = document.createElement('span');
      sc.className = 'mscore';
      const bits = [];
      if (e.ms.length) bits.push(`${doneN}/${e.ms.length}`);
      if (e.feats.length) bits.push(`${e.feats.length} feat`);
      if (e.status !== 'live') bits.push(e.status);
      sc.textContent = bits.join(' · ');
      nm.appendChild(sc);

      if (e.ms.length) {
        const beads = div('mbeads', body);
        for (const m of e.ms) {
          const b = document.createElement('b');
          const future = isFuture(m, scrubT);
          if (m.status === 'in-progress' && !future) b.className = 'progress';
          else if (m.status !== 'done' || future) b.className = 'planned';
          b.title = (m.date ? fmtDate(m.date) + '  ' : '') + (m.plain || m.label);
          beads.appendChild(b);
        }
      }

      headerEls.set(e.id, seg);
      seg.addEventListener('pointerenter', () => onHoverSeg(e.id));
      seg.addEventListener('pointerleave', () => onHoverSeg(null));
    });
  }

  /* ---- logic view: the construction rulebook, readable in-product ---- */
  function renderLogic() {
    if (minimapEl) { minimapEl.style.display = 'none'; minimapEl.innerHTML = ''; }
    listEl.innerHTML = '';
    const wrap = div('lg-wrap', listEl);
    const sec = (title) => { const s = div('lg-sec', wrap); div('lg-h', s, title); return s; };
    const row = (s, term, text) => { const r = div('lg-row', s); div('lg-t', r, term); div('lg-d', r, text); };

    // Everything on this tab is either DERIVED from the world in front of you or
    // is a rule this code actually enforces. It used to be a hardcoded essay
    // about "10 flagships", "the Features Ledger" and directories becoming
    // planets, none of which had been true since the declared plan took over —
    // the one tab whose whole job is to be trustworthy was the one saying false
    // things.
    const st = world.stat;
    const pl = world.plan;
    const declared = !!(pl && pl.totals && pl.totals.products);
    const flag = st.planets.filter(p => p.tier === 'flagship').length;

    let s = sec('Where the bodies on this plate came from');
    if (declared) {
      row(s, 'planet', `a product you DECLARED in .tellurion/plan.json (${flag} of them)`);
      row(s, 'moon', 'a plan step that names what it produces; the step and the moon are one record, so renaming it here renames it there');
      row(s, 'the core', `this project, ringed by one segment per plan step (${pl.totals.stepsDone} of ${pl.totals.steps} lit)`);
      row(s, 'not guessed', 'with a plan declared, nothing on the plate is inferred from directory names. A guess beside a declaration is how the two come to disagree.');
    } else {
      row(s, 'no plan yet', 'nothing here is yours. Declare .tellurion/plan.json and the products and their features appear.');
      row(s, 'planet', 'without a plan, a directory becomes a planet on its first write, which is a guess and is why the plan exists');
      row(s, 'the core', 'a plain dial, because there is no plan to ring it with. Silence is the honest state.');
    }
    row(s, 'the bench', `the belt (${st.tools.length} tools), ring arcs (${st.processes.length} processes) and comets (${st.workflows.length} workflows) are the STANDING FLEET. They are identical on every project and are not part of yours.`);
    row(s, 'chevron', `an agent, drawn unlike a planet on purpose: presence, activity and target, nothing else (${Object.keys(world.agents || {}).length} seen)`);

    s = sec('The chain of custody · the rule that makes it mean anything');
    row(s, 'open', 'nobody has spoken for it');
    row(s, 'in hand', 'the step marked active in the plan. Not a tier: nobody has signed it, it is simply the work you are doing.');
    row(s, 'claimed', 'the BUILDER says it is done. That is the plan file, and a plan can carry a feature no further than this.');
    row(s, 'verified', 'the JUDGE passed it, from .tellurion/verdicts.json. A row without a pass and a name is not a verdict.');
    row(s, 'accepted', 'YOU put your name to it, from .tellurion/accepted.json, written by a deliberate act.');
    row(s, 'the rule', 'no party can grant its own tier, and the ladder is climbed in order. That is why the three live in three files: one file would let an edit forge the whole chain.');
    row(s, 'a product', 'sits at its LEAST advanced feature, and wears the same rings. One unexamined part keeps the whole product short of the tier above.');

    s = sec('What each mark actually encodes');
    row(s, 'planet size', 'milestones plus half-weight features, square-rooted and capped');
    row(s, 'rings', 'a count of sign-offs, on a moon and on its product alike');
    row(s, 'lime', 'only what is happening right now, always with a blue pulse ring');
    row(s, 'hatched', 'not yet built at the date you are replaying');
    row(s, 'belt sector', 'the tool&#39;s trade; sector width = how many tools it holds; spot = stable hash of its name');
    row(s, 'comet orbit', 'stable hash of the workflow&#39;s name: same workflow, same orbit, every load');

    s = sec('The one exception, declared');
    row(s, 'orbit + angle', 'which ring a body sits on, and where along it, is composition. It carries no data.');
    row(s, 'so trust', 'size, form, fill, rings, sector, notch position and spine order. Nothing else.');

    s = sec('Live events land by lookup, never by guess');
    row(s, 'file write', 'longest matching home path pulses that planet');
    row(s, 'agent dispatch', 'raises a chevron and threads it to what it is touching');
    row(s, 'skill call', 'flies the comet with that name');
    row(s, 'shell command', 'lights the belt tool it names');
    row(s, 'commit', 'pulses the product named in its subject');
    row(s, 'no match', 'still turns the drive gauge, and lights nothing');

    s = sec('What is NOT built yet, named rather than implied');
    row(s, 'ledgers', 'no ledger is drawn as strata on this plate');
    row(s, 'scars', 'faults flash and expire; an open incident does not persist as a mark');
    row(s, 'product motion', 'products do not yet spin at a rate set by recency');
    row(s, 'job cadence', 'scheduled jobs do not yet turn once per cycle');
  }

  /* ---- minimap: the whole record at a glance, click to travel ---- */
  function buildMinimap(scrubT) {
    if (!minimapEl) return;
    minimapEl.innerHTML = '';
    const mb = minimapEl.getBoundingClientRect();
    const H = Math.max(60, mb.height);
    minimapEl.setAttribute('viewBox', `0 0 16 ${H}`);
    const wrap = listEl.querySelector('.srail-wrap');
    const wrapRect = wrap ? wrap.getBoundingClientRect() : listEl.getBoundingClientRect();
    const contentH = Math.max(1, listEl.scrollHeight);
    const rows = listEl.querySelectorAll('.srow');
    const css = getComputedStyle(document.documentElement);
    const blue = css.getPropertyValue('--blue').trim();
    const ghost = css.getPropertyValue('--ink-28').trim();
    for (const row of rows) {
      const y = ((row.getBoundingClientRect().top - wrapRect.top) / contentH) * H;
      const done = row.classList.contains('done') && !row.classList.contains('future');
      const prog = row.classList.contains('progress') && !row.classList.contains('future');
      svgEl('rect', {
        class: 'mt', x: prog ? 3 : 4.5, y: y.toFixed(1), width: prog ? 10 : 7, height: 2,
        rx: 1, fill: done ? blue : prog ? blue : ghost, opacity: done ? 0.9 : prog ? 0.55 : 0.35,
      }, minimapEl);
    }
    const view = svgEl('rect', { class: 'mview', x: 0.5, y: 0, width: 15, height: 10, rx: 3 }, minimapEl);
    const syncView = () => {
      const y = (listEl.scrollTop / contentH) * H;
      const h = Math.max(8, (listEl.clientHeight / contentH) * H);
      view.setAttribute('y', y.toFixed(1));
      view.setAttribute('height', h.toFixed(1));
    };
    syncView();
    listEl.onscroll = syncView;
    minimapEl.onpointerdown = (ev) => {
      const r = minimapEl.getBoundingClientRect();
      const frac = (ev.clientY - r.top) / r.height;
      listEl.scrollTo({ top: frac * contentH - listEl.clientHeight / 2, behavior: 'smooth' });
    };
  }

  return {
    setWorld, render, setHot, setViewMode,
    doneCount, total,
    segAnchor: (id) => (headerEls.has(id) ? { el: headerEls.get(id) } : null),
    stats: () => ({ vertebrae: vbCount, frontier: litFrontier, segs: segs.length }),
    invalidate: () => { lastKey = ''; },
  };
}
