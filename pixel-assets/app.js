'use strict';

const questInfo = {
  spin: {
    tag: 'MISSION BRIEF / 001', title: 'Decode the radical pair.',
    text: 'Explore how light-triggered radical pairs and their spin dynamics produce measurable magnetic field effects in biological molecules.',
    url: 'archive.html#services', link: 'RESEARCH OVERVIEW'
  },
  sensing: {
    tag: 'MISSION BRIEF / 002', title: 'Find a quantum signal in living cells.',
    text: 'Investigate magnetosensitive fluorescent proteins, spectroscopy, and the exciting possibilities of protein-based quantum sensing.',
    url: 'https://www.nature.com/articles/s41586-025-09971-3', link: 'DISCOVER THE PAPER'
  },
  software: {
    tag: 'MISSION BRIEF / 003', title: 'Simulate the invisible.',
    text: 'Use open-source tools and interactive tutorials to understand spin Hamiltonians, relaxation, magnetic field effects, and radical-pair kinetics.',
    url: 'https://github.com/Spin-Chemistry-Labs/radicalpy', link: 'EXPLORE RADICALPY'
  }
};

for (const button of document.querySelectorAll('[data-quest]')) {
  button.addEventListener('click', () => {
    const chosen = questInfo[button.dataset.quest];
    if (!chosen) return;
    document.querySelectorAll('[data-quest]').forEach((item) => {
      const active = item === button;
      item.classList.toggle('selected', active);
      item.setAttribute('aria-pressed', String(active));
    });
    document.querySelector('.detail-tag').textContent = chosen.tag;
    document.getElementById('questDetailTitle').textContent = chosen.title;
    document.getElementById('questDetailCopy').textContent = chosen.text;
    const link = document.getElementById('questDetailLink');
    link.href = chosen.url;
    link.textContent = chosen.link + ' →';
    if (chosen.url.startsWith('http')) { link.target = '_blank'; link.rel = 'noopener noreferrer'; }
    else { link.removeAttribute('target'); link.removeAttribute('rel'); }
  });
}

const fieldButtons = document.querySelectorAll('[data-field]');
for (const button of fieldButtons) {
  button.addEventListener('click', () => {
    const on = button.dataset.field === 'on';
    fieldButtons.forEach((item) => {
      const active = item === button;
      item.classList.toggle('active', active);
      item.setAttribute('aria-pressed', String(active));
    });
    document.querySelector('.terminal-wrap').classList.toggle('field-on', on);
    document.getElementById('fieldReadout').textContent = on ? 'FIELD APPLIED / ACTIVE' : 'IDLE / BASELINE';
  });
}

const fxButton = document.querySelector('.fx-toggle');
fxButton.addEventListener('click', () => {
  const enabled = document.body.classList.toggle('no-crt') === false;
  fxButton.setAttribute('aria-pressed', String(enabled));
  document.getElementById('fxLabel').textContent = enabled ? 'ON' : 'OFF';
});

const menuButton = document.querySelector('.mobile-menu-button');
const mobileNav = document.getElementById('mobileNav');
menuButton.addEventListener('click', () => {
  const opened = menuButton.getAttribute('aria-expanded') === 'true';
  menuButton.setAttribute('aria-expanded', String(!opened));
  menuButton.setAttribute('aria-label', opened ? 'Open menu' : 'Close menu');
  mobileNav.hidden = opened;
});
mobileNav.querySelectorAll('a').forEach((link) => link.addEventListener('click', () => {
  mobileNav.hidden = true;
  menuButton.setAttribute('aria-expanded', 'false');
  menuButton.setAttribute('aria-label', 'Open menu');
}));

const navLinks = [...document.querySelectorAll('.desktop-nav a')];
const sections = [...document.querySelectorAll('main section[id]')];
if ('IntersectionObserver' in window) {
  const sectionObserver = new IntersectionObserver((entries) => {
    const showing = entries.filter((entry) => entry.isIntersecting).sort((a,b) => b.intersectionRatio - a.intersectionRatio)[0];
    if (!showing) return;
    const id = showing.target.id;
    navLinks.forEach((link) => link.classList.toggle('active', link.hash === '#' + id));
  }, { rootMargin: '-15% 0px -70% 0px', threshold: [0, .1, .25] });
  sections.forEach((section) => sectionObserver.observe(section));
}

document.getElementById('year').textContent = new Date().getFullYear();
