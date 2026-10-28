/* Use native fullscreen when available; retain the viewport viewer everywhere. */
(() => {
  const viewers = [...document.querySelectorAll('.lightbox, #awardViewer')];
  if (!viewers.length) return;
  let ownedFullscreen = false;
  let pending = false;
  const isOpen = viewer => viewer.matches('dialog')
    ? viewer.open
    : !viewer.hidden && viewer.classList.contains('open') ||
      !viewer.hidden && viewer.id === 'courseLightbox';
  const anyOpen = () => viewers.some(isOpen);
  const leaveFullscreen = () => {
    if (!ownedFullscreen || !document.fullscreenElement) return;
    ownedFullscreen = false;
    document.exitFullscreen?.().catch(() => {});
  };
  viewers.forEach(viewer => {
    viewer.classList.add('immersive-viewer');
    new MutationObserver(() => {
      if (!anyOpen()) leaveFullscreen();
    }).observe(viewer, {attributes: true, attributeFilter: ['class', 'hidden', 'open']});
  });
  document.addEventListener('fullscreenchange', () => {
    if (!document.fullscreenElement) ownedFullscreen = false;
  });
  document.addEventListener('click', event => {
    // Existing gallery handlers have opened the viewer during this same click.
    if (!event.isTrusted || !anyOpen() || pending || document.fullscreenElement ||
        !document.fullscreenEnabled || !document.documentElement.requestFullscreen) return;
    // Navigation and close controls must never re-enter fullscreen.
    if (viewers.some(viewer => viewer.contains(event.target))) return;
    pending = true;
    try {
      Promise.resolve(document.documentElement.requestFullscreen()).then(() => {
        ownedFullscreen = document.fullscreenElement === document.documentElement;
        if (!anyOpen()) leaveFullscreen();
      }).catch(() => {}).finally(() => { pending = false; });
    } catch (_) { pending = false; }
  });
})();
