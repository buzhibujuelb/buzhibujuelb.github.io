document.addEventListener('DOMContentLoaded', function() {
  var storageKey = 'pure-document-theme';
  var media = window.matchMedia ? window.matchMedia('(prefers-color-scheme: dark)') : null;
  var toggle = document.querySelector('.theme-toggle');

  function savedTheme() {
    try {
      var value = localStorage.getItem(storageKey);
      return value === 'dark' || value === 'light' ? value : null;
    } catch (e) {
      return null;
    }
  }

  function effectiveTheme() {
    if (savedTheme()) {
      return savedTheme();
    }
    if (media) {
      return media.matches ? 'dark' : 'light';
    }
    return 'light';
  }

  function applyTheme(theme) {
    if (theme === 'dark' || theme === 'light') {
      document.documentElement.setAttribute('data-theme', theme);
    }

    if (!toggle) return;
    var isDark = effectiveTheme() === 'dark';
    toggle.setAttribute('aria-pressed', isDark ? 'true' : 'false');
    toggle.setAttribute('title', isDark ? 'Switch to light mode' : 'Switch to dark mode');
    toggle.setAttribute('aria-label', isDark ? 'Switch to light mode' : 'Switch to dark mode');
  }

  applyTheme(savedTheme());

  if (toggle) {
    toggle.addEventListener('click', function() {
      var next = effectiveTheme() === 'dark' ? 'light' : 'dark';
      try {
        localStorage.setItem(storageKey, next);
      } catch (e) {}
      applyTheme(next);
    });
  }

  if (media) {
    var onChange = function() {
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
  var footerLink = document.querySelector('footer a');
  if (footerLink) {
    if (footerLink.getAttribute('href').startsWith('#')) {
      footerLink.addEventListener('click', function(e) {
        e.preventDefault();
        document.querySelector(footerLink.getAttribute('href')).scrollIntoView({ behavior: 'smooth' });
      });
    }
  }

  // Subtle hover animation for project cards
  document.querySelectorAll('.project-card').forEach(function(card) {
    card.addEventListener('mouseenter', function() {
      card.classList.add('hovered');
    });
    card.addEventListener('mouseleave', function() {
      card.classList.remove('hovered');
    });
  });
});

