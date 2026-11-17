/* Shared tutorial UI enhancement. Preserves API, calculations, and Plotly trace definitions. */
(function () {
  'use strict';
  const colors = { mint: '#99f2dc', lilac: '#c8b4ff', gold: '#ffd68a', coral: '#ffb8b4', blue: '#84bbec' };
  function axisTheme(axis) {
    return Object.assign({ showgrid: true, gridcolor: '#344265', zerolinecolor: '#5b6386', linecolor: '#566588', tickfont: { color: '#c4c9e8' }, titlefont: { color: '#d4dcf4' } }, axis || {});
  }
  function styleLayout(layout) {
    const source = layout || {};
    const result = Object.assign({}, source, {
      paper_bgcolor: '#111a34', plot_bgcolor: '#111a34',
      font: Object.assign({ family: 'DM Sans, Arial, sans-serif', size: 12 }, source.font || {}, { color: '#e2e9fb' }),
      colorway: [colors.mint, colors.lilac, colors.gold, colors.coral, colors.blue, '#cbf3ff', '#93bea8']
    });
    if (source.xaxis || source.yaxis || !source.scene) {
      result.xaxis = axisTheme(source.xaxis);
      result.yaxis = axisTheme(source.yaxis);
    }
    if (source.scene) {
      result.scene = Object.assign({}, source.scene, {
        bgcolor: '#111a34',
        xaxis: axisTheme(source.scene.xaxis),
        yaxis: axisTheme(source.scene.yaxis),
        zaxis: axisTheme(source.scene.zaxis)
      });
    }
    if (source.title) result.title = typeof source.title === 'string'
      ? { text: source.title, font: { size: 16, color: '#f2eaff' } }
      : Object.assign({}, source.title, {font: Object.assign({color:'#f2eaff'}, source.title.font||{})});
    return result;
  }
  if (window.Plotly) {
    ['newPlot','react'].forEach((method) => {
      if (typeof window.Plotly[method] !== 'function') return;
      const original = window.Plotly[method].bind(window.Plotly);
      window.Plotly[method] = function (root, traces, layout, config) {
        const options = Object.assign({ responsive: true, displaylogo: false }, config || {});
        return original(root, traces, styleLayout(layout), options);
      };
    });
  }
  document.addEventListener('DOMContentLoaded', () => {
    const fx = document.getElementById('tutorialCrt');
    if (fx) fx.addEventListener('click', () => {
      const enabled = document.body.classList.toggle('no-crt') === false;
      fx.setAttribute('aria-pressed', String(enabled));
      fx.querySelector('span').textContent = enabled ? 'ON' : 'OFF';
    });
    const year = document.getElementById('tutorialYear');
    if (year) year.textContent = String(new Date().getFullYear());
    const status = document.getElementById('status');
    if (status) {
      const update = () => {
        const message = status.textContent || '';
        status.classList.toggle('status-success', /simulation complete|complete\.|calculation complete/i.test(message));
        status.classList.toggle('status-error', /error|could not|failed/i.test(message));
      };
      new MutationObserver(update).observe(status, { childList: true, subtree: true, characterData: true });
      update();
    }
  });
})();
