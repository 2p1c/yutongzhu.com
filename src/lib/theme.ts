// Inline client-side script injected into the document <head>.
// It sets the initial theme — from localStorage, falling back to the system
// `prefers-color-scheme` preference — before the page paints, then wires the
// toggle button to switch themes without a reload. The sun/moon icons swap via
// CSS, driven solely by the `data-theme` attribute on <html>.
export const themeScript = `(function () {
  var root = document.documentElement;

  function currentTheme() {
    try {
      var saved = localStorage.getItem('theme');
      if (saved === 'light' || saved === 'dark') return saved;
    } catch (e) { /* localStorage unavailable */ }
    var prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
    return prefersDark ? 'dark' : 'light';
  }

  root.setAttribute('data-theme', currentTheme());

  document.addEventListener('DOMContentLoaded', function () {
    var toggle = document.getElementById('theme-toggle');
    if (!toggle) return;
    toggle.addEventListener('click', function () {
      var next = root.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
      root.setAttribute('data-theme', next);
      try {
        localStorage.setItem('theme', next);
      } catch (e) { /* localStorage unavailable */ }
    });
  });
})();`
