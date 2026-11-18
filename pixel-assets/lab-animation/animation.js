// Animated, illustrative QUBE Lab workflow. No scientific measurement data.
(() => {
  const video = document.getElementById('labAnimation');
  const button = document.getElementById('labAnimationToggle');
  if (!video || !button) return;
  const scene = video.closest('.game-scene');
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)');
  const stages = [
    ['SIGNAL MONITORING', 'FIELD: STANDBY'],
    ['MAGNETIC FIELD ACTIVATED', 'FIELD: ACTIVE'],
    ['FLUORESCENCE DETECTION', 'OPTICS: ACTIVE'],
    ['DATA ANALYSIS COMPLETE', 'DATA: READY']
  ];
  let explicitPause = reduce.matches;
  let inView = true;
  video.muted = true;
  const update = () => {
    const n = Math.min(3, Math.floor(video.currentTime / 5));
    document.getElementById('labStage').textContent = `STAGE 0${n+1}/04`;
    document.getElementById('labCaption').textContent = stages[n][0];
    document.getElementById('labField').textContent = stages[n][1];
    document.getElementById('labCoordinates').textContent = 'QUBE LAB / DEMO';
  };
  const sync = () => {
    button.textContent = video.paused ? '▶ PLAY' : 'Ⅱ PAUSE';
    button.setAttribute('aria-label', video.paused ? 'Play laboratory animation' : 'Pause laboratory animation');
  };
  const maybePlay = () => {
    if (explicitPause || !inView || document.hidden) return;
    video.play().catch(sync);
  };
  video.addEventListener('loadeddata', () => {
    scene.classList.add('lab-video-ready'); button.hidden = false; update(); sync(); maybePlay();
  });
  video.addEventListener('error', () => {scene.classList.remove('lab-video-ready'); button.hidden = true;});
  video.addEventListener('timeupdate', update);
  video.addEventListener('play', sync);
  video.addEventListener('pause', sync);
  button.addEventListener('click', () => {
    if (video.paused) {explicitPause = false; inView = true; maybePlay();}
    else {explicitPause = true; video.pause();}
    sync();
  });
  if ('IntersectionObserver' in window) {
    new IntersectionObserver(entries => {
      inView = entries[0].isIntersecting;
      if (inView) maybePlay(); else video.pause();
    }, {threshold: 0.15}).observe(scene);
  }
  document.addEventListener('visibilitychange', () => {if (document.hidden) video.pause(); else maybePlay();});
  reduce.addEventListener?.('change', e => {if (e.matches) {explicitPause = true; video.pause();} else {explicitPause = false; maybePlay();}});
  // Some browsers preload only metadata; load first frame for the static poster/controls.
  video.preload = 'auto';
  if (video.readyState >= 2) {scene.classList.add('lab-video-ready'); button.hidden = false; update(); sync(); maybePlay();}
})();
