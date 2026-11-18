"use strict";
document.addEventListener('DOMContentLoaded', () => {
// Shared UI controls on the styled secondary pages (no external dependencies).
const fxButton = document.querySelector('.fx-toggle');
if (fxButton) fxButton.addEventListener('click', () => {
  const isEnabled = document.body.classList.toggle('no-crt') === false;
  fxButton.setAttribute('aria-pressed', String(isEnabled));
  const label = document.getElementById('fxLabel');
  if (label) label.textContent = isEnabled ? 'ON' : 'OFF';
});
const menuButton = document.querySelector('.mobile-menu-button');
const menu = document.getElementById('mobileNav');
if (menuButton && menu) {
  menuButton.addEventListener('click', () => {
    const open = menuButton.getAttribute('aria-expanded') !== 'true';
    menuButton.setAttribute('aria-expanded', String(open));
    menuButton.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
    menu.hidden = !open;
  });
  menu.querySelectorAll('a').forEach(a=>a.addEventListener('click',()=>{
    menu.hidden = true;
    menuButton.setAttribute('aria-expanded','false');
    menuButton.setAttribute('aria-label','Open menu');
  }));
}
for (const input of document.querySelectorAll('[data-filter-input]')) {
  const id = input.dataset.filterInput;
  const rows = [...document.querySelectorAll(`[data-filter-list="${id}"] [data-filter-item]`)];
  const count = document.querySelector(`[data-count-for="${id}"]`);
  const empty = document.querySelector(`[data-filter-empty="${id}"]`);
  const apply = () => {
    const query = input.value.trim().toLocaleLowerCase();
    let showing = 0;
    for (const row of rows) {
      const match = row.textContent.toLocaleLowerCase().includes(query);
      row.hidden = !match;
      if (match) showing++;
    }
    if (count) count.textContent = `${showing} of ${rows.length} ${id==='talk-list'?'talks':'research records'} shown`;
    if (empty) empty.hidden = showing > 0;
  };
  input.addEventListener('input', apply);
  apply();
}
const year = document.getElementById('year');
if (year) year.textContent = new Date().getFullYear();
});
