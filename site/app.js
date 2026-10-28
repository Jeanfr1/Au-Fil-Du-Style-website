/* Modèle 1 · mouvement en couches. Aucune vidéo, dépendance ou requête API. */
(() => {
  'use strict';
  const content = window.AU_FIL_DU_STYLE;
  if (!content) return;
  const root = document.documentElement;
  root.classList.add('has-js');
  const hero = document.getElementById('accueil');
  const stage = hero.querySelector('.hero-stage');
  const heroCopy = document.getElementById('hero-copy');
  const heroHeader = document.getElementById('hero-header');
  const heroScroll = document.getElementById('hero-scroll');
  const motionButton = document.getElementById('motion-toggle');
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  const finePointer = window.matchMedia('(hover: hover) and (pointer: fine)');
  const photos = [...document.querySelectorAll('[data-parallax]')];
  let storedPause = false;
  try { storedPause = localStorage.getItem('aufil.motion.paused') === '1'; } catch (_) { /* Préférence non persistée. */ }
  let motionEnabled = false;
  let frame = 0;
  let pointerX = 0;
  let introTimer;
  const clamp = (value, low = 0, high = 1) => Math.min(high, Math.max(low, value));
  const smooth = (a, b, value) => { const t = clamp((value - a) / (b - a)); return t * t * (3 - 2 * t); };

  function setInteractive(element, enabled) {
    element.inert = !enabled;
    if (enabled) element.removeAttribute('aria-hidden');
    else element.setAttribute('aria-hidden', 'true');
  }
  function draw() {
    frame = 0;
    if (!motionEnabled || document.hidden) return;
    const rect = hero.getBoundingClientRect();
    const runway = Math.max(1, hero.offsetHeight - stage.offsetHeight);
    const progress = clamp(-rect.top / runway);
    const portal = smooth(.34, 1, progress);
    const copyOpacity = 1 - smooth(.22, .65, progress);
    stage.style.setProperty('--copy-opacity', copyOpacity.toFixed(4));
    stage.style.setProperty('--copy-y', `${(-progress * 32).toFixed(2)}px`);
    stage.style.setProperty('--foreground-x', `${(progress * 20).toFixed(2)}px`);
    stage.style.setProperty('--foreground-scale', (1 + progress * .045).toFixed(5));
    stage.style.setProperty('--foreground-opacity', (1 - portal).toFixed(4));
    stage.style.setProperty('--halo-rotate', `${(progress * 12).toFixed(2)}deg`);
    stage.style.setProperty('--halo-x', `${(progress * -18).toFixed(2)}px`);
    stage.style.setProperty('--halo-opacity', (1 - smooth(.72, 1, progress)).toFixed(4));
    stage.style.setProperty('--portal-radius', `${(portal * 145).toFixed(3)}%`);
    stage.style.setProperty('--pointer-x', `${pointerX.toFixed(2)}px`);
    const interactive = copyOpacity > .15;
    [heroCopy, heroHeader, heroScroll].forEach(element => setInteractive(element, interactive));
    if (progress > .02) root.classList.remove('intro-ready');
    const viewHeight = window.innerHeight;
    const mobile = window.innerWidth <= 760;
    const moves = photos.map(element => {
      const box = element.getBoundingClientRect();
      const visible = box.bottom > -100 && box.top < viewHeight + 100;
      const ratio = clamp((viewHeight / 2 - (box.top + box.height / 2)) / viewHeight, -.8, .8);
      return [element, visible ? ratio * (mobile ? 12 : 24) : 0];
    });
    moves.forEach(([element, y]) => element.style.setProperty('--photo-y', `${y.toFixed(2)}px`));
  }
  function schedule() {
    if (motionEnabled && !frame && !document.hidden) frame = window.requestAnimationFrame(draw);
  }
  function applyMotion() {
    motionEnabled = !storedPause && !reducedMotion.matches && !navigator.connection?.saveData;
    root.classList.toggle('motion-on', motionEnabled);
    root.classList.toggle('motion-off', !motionEnabled);
    const systemOff = reducedMotion.matches || !!navigator.connection?.saveData;
    motionButton.disabled = systemOff;
    motionButton.setAttribute('aria-pressed', String(!motionEnabled));
    motionButton.setAttribute('aria-label', systemOff ? 'Animations désactivées selon vos préférences' : motionEnabled ? 'Mettre en pause les animations' : 'Reprendre les animations');
    motionButton.querySelector('span').textContent = motionEnabled ? 'Ⅱ' : '▷';
    if (!motionEnabled) {
      if (frame) window.cancelAnimationFrame(frame);
      frame = 0;
      clearTimeout(introTimer);
      root.classList.remove('intro-ready');
      stage.removeAttribute('style');
      photos.forEach(element => element.style.removeProperty('--photo-y'));
      [heroCopy, heroHeader, heroScroll].forEach(element => setInteractive(element, true));
    } else schedule();
  }
  motionButton.addEventListener('click', () => {
    storedPause = !storedPause;
    try { localStorage.setItem('aufil.motion.paused', storedPause ? '1' : '0'); } catch (_) { /* Facultatif. */ }
    applyMotion();
  });
  if (reducedMotion.addEventListener) reducedMotion.addEventListener('change', applyMotion);
  else reducedMotion.addListener(applyMotion);
  navigator.connection?.addEventListener?.('change', applyMotion);
  window.addEventListener('scroll', schedule, {passive:true});
  window.addEventListener('resize', () => { pointerX = 0; schedule(); }, {passive:true});
  document.addEventListener('visibilitychange', schedule);
  stage.addEventListener('pointermove', event => {
    if (!motionEnabled || !finePointer.matches) return;
    pointerX = clamp(event.clientX / Math.max(1, window.innerWidth) - .5, -.5, .5) * 10;
    schedule();
  }, {passive:true});
  stage.addEventListener('pointerleave', () => { pointerX = 0; schedule(); });
  applyMotion();
  const portrait = hero.querySelector('.hero-person img');
  const ready = [document.fonts?.ready || Promise.resolve(), portrait.decode ? portrait.decode().catch(() => {}) : Promise.resolve()];
  Promise.all(ready).then(() => {
    if (motionEnabled && window.scrollY < 24) {
      root.classList.add('intro-ready');
      introTimer = window.setTimeout(() => root.classList.remove('intro-ready'), 1450);
    }
    schedule();
  });
  if ('IntersectionObserver' in window) {
    const observer = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (entry.isIntersecting) { entry.target.classList.add('is-visible'); observer.unobserve(entry.target); }
      });
    }, {threshold:.12, rootMargin:'0px 0px -25px 0px'});
    document.querySelectorAll('.reveal').forEach(element => { element.classList.add('will-reveal'); observer.observe(element); });
  }
  document.querySelectorAll('.mobile-nav a').forEach(link => link.addEventListener('click', () => link.closest('details').removeAttribute('open')));

  const serviceDialog = document.getElementById('service-dialog');
  const galleryDialog = document.getElementById('gallery-dialog');
  let serviceOpener = null;
  let galleryOpener = null;
  const tabs = [...serviceDialog.querySelectorAll('[data-tab]')];
  function selectService(key, focus = false) {
    const service = content.services[key];
    if (!service) return;
    document.getElementById('service-dialog-title').textContent = service.title;
    document.getElementById('service-description').textContent = service.description;
    const list = document.getElementById('service-list');
    list.replaceChildren(...service.items.map(text => { const li = document.createElement('li'); li.textContent = text; return li; }));
    tabs.forEach(tab => {
      const selected = tab.dataset.tab === key;
      tab.setAttribute('aria-selected', String(selected));
      tab.tabIndex = selected ? 0 : -1;
      if (selected && focus) tab.focus();
    });
    document.getElementById('service-panel').setAttribute('aria-labelledby', `tab-${key}`);
  }
  document.querySelectorAll('[data-service]').forEach(link => link.addEventListener('click', event => {
    if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey || event.button !== 0) return;
    if (typeof serviceDialog.showModal !== 'function') return;
    event.preventDefault();
    serviceOpener = link;
    selectService(link.dataset.service);
    if (!serviceDialog.open) serviceDialog.showModal();
    serviceDialog.querySelector('[data-close-dialog]').focus();
  }));
  tabs.forEach((tab, index) => {
    tab.addEventListener('click', () => selectService(tab.dataset.tab, true));
    tab.addEventListener('keydown', event => {
      let next;
      if (event.key === 'ArrowRight') next = (index + 1) % tabs.length;
      if (event.key === 'ArrowLeft') next = (index + tabs.length - 1) % tabs.length;
      if (event.key === 'Home') next = 0;
      if (event.key === 'End') next = tabs.length - 1;
      if (next !== undefined) { event.preventDefault(); selectService(tabs[next].dataset.tab, true); }
    });
  });
  let galleryIndex = 0;
  function showPhoto(index) {
    galleryIndex = (index + content.gallery.length) % content.gallery.length;
    const photo = content.gallery[galleryIndex];
    const image = document.getElementById('gallery-image');
    image.setAttribute('href', photo.src);
    image.setAttribute('width', String(photo.width));
    image.setAttribute('height', String(photo.height));
    document.getElementById('gallery-art').setAttribute('viewBox', photo.viewBox);
    document.getElementById('gallery-caption').textContent = photo.caption;
    document.getElementById('gallery-position').textContent = `${galleryIndex + 1} / ${content.gallery.length}`;
  }
  document.querySelectorAll('[data-open-gallery]').forEach(button => {
    if (typeof galleryDialog.showModal !== 'function') { button.hidden = true; button.style.display = 'none'; return; }
    button.addEventListener('click', () => {
      galleryOpener = button;
      showPhoto(0);
      if (!galleryDialog.open) galleryDialog.showModal();
      galleryDialog.querySelector('[data-close-dialog]').focus();
    });
  });
  document.getElementById('gallery-prev').addEventListener('click', () => showPhoto(galleryIndex - 1));
  document.getElementById('gallery-next').addEventListener('click', () => showPhoto(galleryIndex + 1));
  galleryDialog.addEventListener('keydown', event => {
    if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') { event.preventDefault(); showPhoto(galleryIndex + (event.key === 'ArrowRight' ? 1 : -1)); }
  });
  [serviceDialog, galleryDialog].forEach(dialog => {
    dialog.querySelector('[data-close-dialog]').addEventListener('click', () => dialog.close());
    dialog.addEventListener('click', event => {
      const box = dialog.getBoundingClientRect();
      if (event.target === dialog && (event.clientX < box.left || event.clientX > box.right || event.clientY < box.top || event.clientY > box.bottom)) dialog.close();
    });
  });
  serviceDialog.addEventListener('close', () => { if (serviceOpener?.isConnected) serviceOpener.focus({preventScroll:true}); });
  galleryDialog.addEventListener('close', () => { if (galleryOpener?.isConnected) galleryOpener.focus({preventScroll:true}); });
  selectService('coupe');
})();
