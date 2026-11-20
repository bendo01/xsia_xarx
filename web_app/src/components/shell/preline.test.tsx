// jsdom stand-ins for Preline's global collections: the behaviours below are the ones
// whose absence caused the stuck navigation backdrop.
import { afterEach, describe, expect, it, vi } from 'vitest';

import { closeOpenOverlays, destroyDetachedInstances, sweepOverlayLeftovers } from './preline';

type W = Record<string, unknown>;
const w = window as unknown as W;

function instance(el: HTMLElement) {
  const destroy = vi.fn();
  const close = vi.fn();
  return { element: { el, destroy, close }, destroy, close };
}

afterEach(() => {
  for (const k of Object.keys(w)) if (/^\$hs.+Collection$/.test(k)) delete w[k];
  document.body.innerHTML = '';
  document.body.className = '';
  document.body.removeAttribute('style');
  vi.useRealTimers();
});

describe('destroyDetachedInstances', () => {
  it('destroys only instances whose element left the page, across every collection', () => {
    const live = document.createElement('div');
    document.body.append(live);
    const gone = document.createElement('div'); // never attached
    const a = instance(live);
    const b = instance(gone);
    const c = instance(gone);
    w.$hsOverlayCollection = [a, b];
    w.$hsDropdownCollection = [c];
    w.notACollection = [instance(gone)];

    expect(destroyDetachedInstances()).toBe(2);
    expect(a.destroy).not.toHaveBeenCalled();
    expect(b.destroy).toHaveBeenCalledOnce();
    expect(c.destroy).toHaveBeenCalledOnce();
  });

  it('survives an instance whose destroy() throws', () => {
    const gone = document.createElement('div');
    const bad = instance(gone);
    bad.destroy.mockImplementation(() => { throw new Error('boom'); });
    const ok = instance(gone);
    w.$hsOverlayCollection = [bad, ok];
    expect(() => destroyDetachedInstances()).not.toThrow();
    expect(ok.destroy).toHaveBeenCalledOnce();
  });

  it('is a no-op when Preline has not loaded', () => {
    expect(destroyDetachedInstances()).toBe(0);
  });
});

describe('sweepOverlayLeftovers', () => {
  const backdrop = (id: string) => {
    const b = document.createElement('div');
    b.id = `${id}-backdrop`;
    b.setAttribute('data-hs-overlay-backdrop-template', '');
    document.body.append(b);
    return b;
  };
  const overlay = (id: string, open: boolean) => {
    const o = document.createElement('div');
    o.id = id;
    o.className = open ? 'hs-overlay open' : 'hs-overlay';
    document.body.append(o);
    return o;
  };

  it('removes a backdrop whose overlay is closed or gone, and releases the scroll lock', () => {
    overlay('drawer', false);
    backdrop('drawer'); // overlay closed
    backdrop('ghost'); // overlay not in the document at all
    document.body.classList.add('hs-overlay-body-open');
    document.body.style.overflow = 'hidden';

    sweepOverlayLeftovers();

    expect(document.querySelectorAll('[data-hs-overlay-backdrop-template]')).toHaveLength(0);
    expect(document.body.classList.contains('hs-overlay-body-open')).toBe(false);
    expect(document.body.style.overflow).toBe('');
  });

  it('leaves the backdrop and the lock of an overlay that is genuinely open', () => {
    overlay('drawer', true);
    const b = backdrop('drawer');
    document.body.classList.add('hs-overlay-body-open');
    sweepOverlayLeftovers();
    expect(document.body.contains(b)).toBe(true);
    expect(document.body.classList.contains('hs-overlay-body-open')).toBe(true);
  });
});

describe('closeOpenOverlays', () => {
  it('force-closes open overlays only, without loading Preline, then sweeps', () => {
    vi.useFakeTimers();
    const open = document.createElement('div');
    open.className = 'hs-overlay open';
    open.id = 'drawer';
    const closed = document.createElement('div');
    closed.className = 'hs-overlay';
    document.body.append(open, closed);
    const a = instance(open);
    const b = instance(closed);
    w.$hsOverlayCollection = [a, b];
    const orphan = document.createElement('div');
    orphan.id = 'old-backdrop';
    orphan.setAttribute('data-hs-overlay-backdrop-template', '');
    document.body.append(orphan);

    closeOpenOverlays();

    expect(a.close).toHaveBeenCalledWith(true);
    expect(b.close).not.toHaveBeenCalled();
    open.classList.remove('open'); // what Preline's close() does
    vi.advanceTimersByTime(500);
    expect(document.body.contains(orphan)).toBe(false); // the sweep removed it
  });
});
