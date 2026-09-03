// Inline client-side script for copying fenced code blocks in post content.
export const codeCopyScript = `(function () {
  document.addEventListener('DOMContentLoaded', function () {
    document.addEventListener('click', function (e) {
      var btn = e.target.closest('.code-copy');
      if (!btn) return;
      var block = btn.closest('.code-block');
      if (!block) return;
      var code = block.querySelector('code');
      if (!code) return;
      var text = code.textContent || '';
      var label = btn.textContent;
      navigator.clipboard.writeText(text).then(function () {
        btn.textContent = 'Copied!';
        setTimeout(function () { btn.textContent = label; }, 2000);
      }).catch(function () { /* clipboard unavailable */ });
    });
  });
})();`
