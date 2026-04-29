document.addEventListener('DOMContentLoaded', () =&gt; {
  const storageKey = 'pure-document-theme';
  const media = window.matchMedia &amp;&amp; window.matchMedia('(prefers-color-scheme: dark)');
  const toggle = document.querySelector('.theme-toggle');

  function savedTheme() {
    try {
      const value = localStorage.getItem(storageKey);
      return value === 'dark' || value === 'light' ? value : null;
    } catch (e) {
      return null;
    }
  }

  function effectiveTheme() {
    return savedTheme() || (media &amp;&amp; media.matches ? 'dark' : 'light');
  }

  function applyTheme(theme) {
    if (theme === 'dark' || theme === 'light') {
      document.documentElement.setAttribute('data-theme', theme);
    }

    if (!toggle) return;
    const isDark = effectiveTheme() === 'dark';
    toggle.setAttribute('aria-pressed', isDark ? 'true' : 'false');
    toggle.setAttribute('title', isDark ? 'Switch to light mode' : 'Switch to dark mode');
    toggle.setAttribute('aria-label', isDark ? 'Switch to light mode' : 'Switch to dark mode');
  }

  applyTheme(savedTheme());

  if (toggle) {
    toggle.addEventListener('click', () =&gt; {
      const next = effectiveTheme() === 'dark' ? 'light' : 'dark';
      try {
        localStorage.setItem(storageKey, next);
      } catch (e) {}
      applyTheme(next);
    });
  }

  if (media) {
    const onChange = () =&gt; {
      if (!savedTheme()) {
        document.documentElement.removeAttribute('data-theme');
        applyTheme(null);
      }
    };
    if (media.addEventListener) {
      media.addEventListener('change', onChange);
    } else if (media.addListener) {
      media.addListener(onChange);
    }
  }

  // Smooth scroll for footer link
  const footerLink = document.querySelector('footer a');
  if (footerLink &amp;&amp; footerLink.getAttribute('href').startsWith('#')) {
    footerLink.addEventListener('click', e =&gt; {
      e.preventDefault();
      document.querySelector(footerLink.getAttribute('href')).scrollIntoView({ behavior: 'smooth' });
    });
  }

  // Subtle hover animation for project cards
  document.querySelectorAll('.project-card').forEach(card =&gt; {
    card.addEventListener('mouseenter', () =&gt; card.classList.add('hovered'));
    card.addEventListener('mouseleave', () =&gt; card.classList.remove('hovered'));
  });
});

