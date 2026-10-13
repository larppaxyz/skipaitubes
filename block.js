(() => {
  const badgeSelector = [
    'yt-video-attribute-view-model', 'yt-attribute-view-model',
    'ytd-badge-supported-renderer', '.yt-badge-shape',
    'yt-content-metadata-view-model .yt-content-metadata-view-model__metadata-text'
  ].join(',');
  const cardSelector = [
    'ytd-rich-item-renderer', 'ytd-video-renderer', 'yt-lockup-view-model',
    'ytd-compact-video-renderer', 'ytd-grid-video-renderer'
  ].join(',');
  const hidden = new Set();
  let enabled = false;
  let pending = false;
  let blockedPlayer = null;
  let notice = null;

  function tagged(root) {
    return Array.from(root.querySelectorAll(badgeSelector)).some(badge =>
      !badge.closest('#description, #description-inline-expander, #owner, ytd-comments') &&
      !badge.hidden && badge.getAttribute('aria-hidden') !== 'true' &&
      globalThis.SkipAITunes.isAIBadge(badge.textContent));
  }

  function restorePlayer() {
    if (blockedPlayer) blockedPlayer.removeAttribute('data-skip-ai-blocked');
    blockedPlayer = null;
    if (notice) notice.remove();
    notice = null;
  }

  function update() {
    pending = false;
    // Recheck hidden cards too: YouTube reuses renderers while scrolling.
    for (const card of document.querySelectorAll(cardSelector)) {
      const shouldHide = enabled && tagged(card);
      if (shouldHide) {
        if (!hidden.has(card)) card.setAttribute('data-skip-ai-hidden', '');
        hidden.add(card);
        // Count video identities rather than DOM nodes: YouTube renders the same
        // result more than once and recycles cards during infinite scrolling.
        const id = Array.from(card.querySelectorAll('a[href]'))
          .map(link => globalThis.SkipAITunes.videoIdFromURL(link.href)).find(Boolean);
        if (id) globalThis.SkipAITunes.reportBlocked(id);
      } else if (hidden.delete(card)) {
        card.removeAttribute('data-skip-ai-hidden');
      }
    }
    for (const card of hidden) {
      if (!card.isConnected) {
        card.removeAttribute('data-skip-ai-hidden');
        hidden.delete(card);
      }
    }
    const watch = document.querySelector('ytd-watch-flexy');
    const id = new URL(location.href).searchParams.get('v');
    const player = document.querySelector('#movie_player');
    const metadata = watch && watch.querySelector('ytd-watch-metadata');
    const shouldBlock = enabled && location.pathname === '/watch' && id &&
      watch && watch.getAttribute('video-id') === id && metadata && tagged(metadata) && player;
    if (!shouldBlock) {
      restorePlayer();
      return;
    }
    const video = player.querySelector('video');
    if (video && !video.paused) video.pause();
    globalThis.SkipAITunes.reportBlocked(id);
    if (blockedPlayer !== player) {
      restorePlayer();
      blockedPlayer = player;
      player.setAttribute('data-skip-ai-blocked', '');
      notice = document.createElement('div');
      notice.className = 'skip-ai-block-notice';
      notice.setAttribute('role', 'status');
      notice.textContent = 'AI-tagged video blocked. Turn off “Block all AI-tagged videos” in Skip AI Tunes to watch it.';
      player.parentElement.insertBefore(notice, player);
    }
  }
  function schedule() {
    if (pending) return;
    pending = true;
    setTimeout(update, 250);
  }
  chrome.storage.local.get({ blockAllAI: false }).then(settings => {
    enabled = settings.blockAllAI === true;
    schedule();
  });
  chrome.storage.onChanged.addListener((changes, area) => {
    if (area === 'local' && changes.blockAllAI) {
      enabled = changes.blockAllAI.newValue === true;
      schedule();
    }
  });
  document.addEventListener('yt-navigate-start', restorePlayer);
  document.addEventListener('yt-navigate-finish', schedule);
  document.addEventListener('playing', schedule, true);
  new MutationObserver(schedule).observe(document.documentElement, {
    subtree: true, childList: true, characterData: true,
    attributes: true, attributeFilter: ['video-id', 'aria-hidden', 'hidden']
  });
  setInterval(schedule, 2000);
})();
