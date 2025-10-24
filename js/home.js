document.addEventListener('DOMContentLoaded', () =&gt; {
  console.log('Home page loaded.');

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

