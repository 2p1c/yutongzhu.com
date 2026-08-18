// Inline client-side script injected into the document <head>.
// The HTML ships with `data-lang="zh"` on <html>; this script restores a saved
// English preference before first paint and wires the translate toggle to
// switch languages without a reload. Chinese/English content swaps via CSS,
// driven by the `data-lang` attribute.
export const langScript = `(function () {
  var root = document.documentElement;

  try {
    if (localStorage.getItem('lang') === 'en') root.setAttribute('data-lang', 'en');
  } catch (e) { /* localStorage unavailable */ }

  document.addEventListener('DOMContentLoaded', function () {
    var toggle = document.getElementById('lang-toggle');
    if (!toggle) return;
    toggle.addEventListener('click', function () {
      var next = root.getAttribute('data-lang') === 'zh' ? 'en' : 'zh';
      root.setAttribute('data-lang', next);
      try {
        localStorage.setItem('lang', next);
      } catch (e) { /* localStorage unavailable */ }
    });
  });
})();`
