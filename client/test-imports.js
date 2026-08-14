async function test() {
  try { await import('ol/Map.js'); console.log('ol/Map OK'); } catch (e) { console.error('ol/Map err', e.message); }
  try { await import('@tanstack/charts'); console.log('@tanstack/charts OK'); } catch (e) { console.error('@tanstack/charts err', e.message); }
  try { await import('@tanstack/charts/polar'); console.log('@tanstack/charts/polar OK'); } catch (e) { console.error('@tanstack/charts/polar err', e.message); }
}
test();
