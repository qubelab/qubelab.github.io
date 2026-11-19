'use strict';

const questInfo = {
instrument: {
  tag: 'MISSION BRIEF / 001',
  title: 'Build the instrument. Reveal the spin.',
  text: 'Develop custom optical measurements that detect quantum spin effects through light, combining instrument design with precision experiments.',
  url: 'research.html#optical-instrumentation',
  link: 'EXPLORE THE RESEARCH'
},
simulation: {
  tag: 'MISSION BRIEF / 002',
  title: 'Simulate the spin system.',
  text: 'Develop simulation software and new computational approaches to model spin evolution, magnetic-field effects and spin-selective kinetics.',
  url: 'research.html#spin-dynamics-software',
  link: 'EXPLORE THE RESEARCH'
},
protein: {
  tag: 'MISSION BRIEF / 003',
  title: 'Follow the protein in motion.',
  text: 'Investigate protein conformations and fluctuations using molecular dynamics to connect their changing structure with spin-active molecular environments.',
  url: 'research.html#protein-molecular-dynamics',
  link: 'EXPLORE THE RESEARCH'
},
cells: {
  tag: 'MISSION BRIEF / 004',
  title: 'Sense the quantum world inside cells.',
  text: 'Explore quantum spin-sensitive measurements in living cells and at subcellular length scales, bridging molecular physics and biological readouts.',
  url: 'research.html#cellular-quantum-sensing',
  link: 'EXPLORE THE RESEARCH'
},
photochemistry: {
  tag: 'MISSION BRIEF / 005',
  title: 'Observe the radical pair. Reveal magnetic sensitivity.',
  text: 'Use photochemistry and spin spectroscopy to investigate magnetic-field-sensitive flavin and cryptochrome radical pairs.',
  url: 'research.html#radical-pair-photochemistry',
  link: 'EXPLORE THE RESEARCH'
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
