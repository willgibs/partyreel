(() => {
  // red-team 45: the album's tiles counted at MutationObserver callback time and on every frame.
  // Counts: [data-album-grid] > [data-media-tile] (the brief's), any tile under the grid (the head slot's
  // stack included), [data-upload-stack] anywhere; per frame also how many grid tiles are laid out.
  if (window.__if) return 'already';
  const t0 = performance.now();
  const st = () => Math.round((performance.now() - t0) * 10) / 10;
  const q = (s) => document.querySelectorAll(s).length;
  const count = () => ({
    direct: q('[data-album-grid] > [data-media-tile]'),
    nested: q('[data-album-grid] [data-media-tile]'),
    stack: q('[data-upload-stack]'),
  });
  const cb = []; const maxCb = { direct: 0, nested: 0, stack: 0 }; let nCb = 0;
  const mo = new MutationObserver(() => {
    nCb++;
    const c = count(); const t = st();
    for (const k of Object.keys(maxCb)) maxCb[k] = Math.max(maxCb[k], c[k]);
    const key = JSON.stringify(c);
    const last = cb[cb.length - 1];
    if (!last || last.key !== key) cb.push({ t, key, ...c });
  });
  mo.observe(document, { childList: true, subtree: true });
  const shown = (e) => { const r = e.getBoundingClientRect(); return r.width > 2 && r.height > 2; };
  const frames = []; let last = ''; let nFrames = 0; const maxFr = { direct: 0, nested: 0, stack: 0, shown: 0 };
  let raf = 0;
  const tick = () => {
    nFrames++;
    const c = count();
    const sh = [...document.querySelectorAll('[data-album-grid] [data-media-tile], [data-upload-stack]')].filter(shown).length;
    const tr = document.querySelector('[data-upload-tracker]');
    const rows = [...document.querySelectorAll('[data-upload-tracker-row]')].map((r) => r.getAttribute('data-upload-tracker-row') + (r.querySelector('[data-upload-tracker-remove]') ? '+R' : '') + ':' + (r.innerText || '').replace(/\s+/g, ' ').trim().slice(0, 28));
    const dlg = [...document.querySelectorAll('[role=dialog],[role=alertdialog]')].map((d) => (d.innerText || '').replace(/\s+/g, ' ').trim().slice(0, 90));
    const note = document.querySelector('[data-develop-note]');
    const s = { ...c, shown: sh, tracker: tr ? tr.getAttribute('aria-label') : null, rows: rows.join(' | '), dlg: dlg.join(' || '), note: note ? note.innerText.slice(0, 40) : null };
    for (const k of Object.keys(maxFr)) maxFr[k] = Math.max(maxFr[k], s[k]);
    const k = JSON.stringify(s);
    if (k !== last) { frames.push({ t: st(), ...s }); last = k; }
    raf = requestAnimationFrame(tick);
  };
  raf = requestAnimationFrame(tick);
  window.__if = {
    cb, frames, t0, st,
    max: () => ({ cb: maxCb, fr: maxFr, nFrames, nCb }),
    mark: (m) => { const t = st(); frames.push({ t, mark: m }); cb.push({ t, mark: m }); return t; },
    stop: () => { mo.disconnect(); cancelAnimationFrame(raf); },
    reset: () => { cb.length = 0; frames.length = 0; last = ''; nFrames = 0; nCb = 0; for (const k of Object.keys(maxCb)) maxCb[k] = 0; for (const k of Object.keys(maxFr)) maxFr[k] = 0; },
  };
  return 'on ' + document.visibilityState;
})()
