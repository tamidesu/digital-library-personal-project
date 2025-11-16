(function () {
  const KEY = 'theme'; 
  const root = document.documentElement;

  function apply(theme) {
    root.setAttribute('data-theme', theme);
    localStorage.setItem(KEY, theme); 
    const btn = document.getElementById('themeToggle');
    if (btn) btn.textContent = theme === 'dark' ? '🌙' : '☀️';
  }
 
  const saved = localStorage.getItem(KEY);
  apply(saved === 'light' || saved === 'dark' ? saved : 'dark');
 
  function wire() {
    const btn = document.getElementById('themeToggle');
    if (!btn) return;
    btn.addEventListener('click', () => {
      const next = (root.getAttribute('data-theme') === 'dark') ? 'light' : 'dark';
      apply(next);
    }); 
    btn.textContent = (root.getAttribute('data-theme') === 'dark') ? '🌙' : '☀️';
  }

  if (document.readyState !== 'loading') wire();
  document.addEventListener('DOMContentLoaded', wire);
  document.addEventListener('includes:loaded', wire);
})();
