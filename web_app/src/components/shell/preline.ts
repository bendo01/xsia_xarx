// Preline's JS plugins (dropdown, overlay, collapse, ...) bind to elements by
// data-attributes. `preline/non-auto` runs nothing until asked, which suits an SPA.
//
// Rules learned the hard way (see preline.test.tsx):
//  * autoInit() is idempotent: it binds only elements that have no instance yet and
//    prunes instances whose element left the page. Call it freely after DOM changes.
//  * Never call cleanCollection(): it only empties Preline's global arrays, it does NOT
//    destroy instances or their listeners. The shell's elements persist across client
//    navigations, so after each cleanCollection()+autoInit() the same drawer button had
//    several live instances: one click opened the drawer several times, built several
//    backdrops, and closing removed only one (a stuck backdrop).
//  * Instances whose element has been removed (e.g. switching to another role layout)
//    must be destroyed, so their listeners and backdrops go with them.

type Instance = { el: HTMLElement; destroy?: () => void; close?: (force?: boolean) => unknown };
type Item = { element?: Instance };
type Win = Window & Record<string, unknown>;

/** Every `window.$hs*Collection` array Preline keeps its instances in. */
function collections(): { name: string; items: Item[] }[] {
  const w = window as unknown as Win;
  return Object.keys(w)
    .filter((k) => /^\$hs.+Collection$/.test(k) && Array.isArray(w[k]))
    .map((name) => ({ name, items: w[name] as Item[] }));
}

/** Destroy instances whose element is no longer in the document. Returns how many. */
export function destroyDetachedInstances(): number {
  if (typeof window === 'undefined') return 0;
  let n = 0;
  for (const { items } of collections()) {
    // (destroy() reassigns the collection array, so iterating this one is safe.)
    for (const item of items) {
      const el = item.element?.el;
      if (el && !el.isConnected) {
        try { item.element?.destroy?.(); } catch { /* a half-torn-down instance must not block the rest */ }
        n++;
      }
    }
  }
  return n;
}

/**
 * Remove backdrops that no longer belong to an open overlay, and release the body
 * scroll lock when nothing is open. Normally Preline does this itself when an overlay
 * closes; this is the safety net for the cases it cannot (the overlay was removed, or
 * its close transition never finished).
 */
export function sweepOverlayLeftovers(): void {
  if (typeof document === 'undefined') return;
  for (const backdrop of document.querySelectorAll<HTMLElement>('[data-hs-overlay-backdrop-template]')) {
    const overlay = document.getElementById(backdrop.id.replace(/-backdrop$/, ''));
    if (!overlay?.classList.contains('open')) backdrop.remove();
  }
  if (!document.querySelector('.hs-overlay.open')) {
    document.body.classList.remove('hs-overlay-body-open');
    document.body.style.overflow = '';
    document.body.style.paddingRight = '';
  }
}

/**
 * Close any open overlay (the navigation drawer) right away. The shell persists across
 * routes, so without this the drawer would stay open after a link click.
 */
export function closeOpenOverlays(): void {
  if (typeof document === 'undefined') return;
  const w = window as unknown as Win;
  const overlays = Array.isArray(w.$hsOverlayCollection) ? (w.$hsOverlayCollection as Item[]) : [];
  for (const { element } of overlays) {
    if (element?.el?.classList.contains('open')) {
      try { void element.close?.(true); } catch { /* sweep below covers it */ }
    }
  }
  // Preline removes the backdrop after its fade-out; sweep once that is certainly over.
  setTimeout(sweepOverlayLeftovers, 450);
}

let scheduled = false;

export function reinitPreline(): void {
  if (typeof window === 'undefined' || scheduled) return;
  scheduled = true;
  // Next frame: let the framework commit the DOM first; coalesce bursts.
  requestAnimationFrame(async () => {
    scheduled = false;
    closeOpenOverlays();
    const { HSStaticMethods } = await import('preline/non-auto');
    destroyDetachedInstances();
    HSStaticMethods.autoInit();
  });
}
