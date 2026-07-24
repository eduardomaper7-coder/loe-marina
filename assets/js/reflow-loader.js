
(() => {
  const cfg = window.LOE_MARINA_REFLOW || {};
  const projectId = String(cfg.projectId || '').trim();
  const connected = /^\d+$/.test(projectId);
  document.documentElement.classList.toggle('reflow-connected', connected);
  document.documentElement.classList.toggle('reflow-demo', !connected);

  // Set query-driven category before the toolkit initializes.
  const params = new URLSearchParams(location.search);
  const category = params.get('category');
  if (category) document.querySelectorAll('[data-reflow-type="product-list"]').forEach(el => el.setAttribute('data-reflow-category', category));

  if (!connected) {
    document.dispatchEvent(new CustomEvent('loe:reflow-demo'));
    return;
  }
  const css = document.createElement('link');
  css.rel = 'stylesheet';
  css.href = 'https://cdn.reflowhq.com/v2/toolkit.min.css';
  document.head.appendChild(css);
  const script = document.createElement('script');
  script.src = 'https://cdn.reflowhq.com/v2/toolkit.min.js';
  script.defer = true;
  script.dataset.reflowProject = projectId;
  if (cfg.testMode) script.dataset.testmode = 'true';
  document.body.appendChild(script);
})();
