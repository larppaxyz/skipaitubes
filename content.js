(() => {
  const { isMusicDisclosure, isAIBadge, playbackContext } = globalThis.SkipAITunes;
  let enabled = false;
  let blockAllAI = false;
  let navigationAt = Date.now();
  let pending = false;
  let lastSkip = null;

  // Restrict detection to YouTube disclosure components, never titles,
  // comments, recommendations, or creator-written description text.
  const disclosureSelector = [
    'ytd-watch-metadata ytd-info-panel-content-renderer',
    'ytd-watch-metadata ytd-info-panel-container-renderer',
    'ytd-watch-metadata [data-content-type="synthetic-media"]',
    'ytd-watch-metadata [data-content-type="altered-content"]',
    '#above-the-fold ytd-info-panel-content-renderer'
  ].join(',');
  const badgeSelector = [
    'ytd-watch-metadata yt-video-attribute-view-model',
    'ytd-watch-metadata yt-attribute-view-model',
    'ytd-watch-metadata ytd-badge-supported-renderer',
    'ytd-watch-metadata .yt-badge-shape',
    'ytd-watch-metadata yt-content-metadata-view-model .yt-content-metadata-view-model__metadata-text'
  ].join(',');

  function hasAIBadge() {
    return Array.from(document.querySelectorAll(badgeSelector)).some(element => {
      if (element.closest('#description, #description-inline-expander, #owner, ytd-comments')) return false;
      // Hidden templates and inactive badges must not trigger a skip.
      return element.getClientRects().length > 0 && isAIBadge(element.textContent);
    });
  }

  function check() {
    pending = false;
    if (!enabled || blockAllAI || Date.now() - navigationAt < 1500) return;
    const context = playbackContext(location.href);
    if (!context) return;
    const watch = document.querySelector('ytd-watch-flexy');
    if (!watch || watch.getAttribute('video-id') !== context.videoId) return;
    if (document.querySelector('#movie_player.ad-showing')) return;
    const video = document.querySelector('#movie_player video');
    if (!video || video.paused || video.ended || video.readyState < 2) return;
    const musicDisclosure = Array.from(document.querySelectorAll(disclosureSelector))
      .some(element => isMusicDisclosure(element.textContent));
    if (!musicDisclosure && !hasAIBadge()) return;

    const next = document.querySelector('#movie_player .ytp-next-button');
    if (!next || next.getAttribute('aria-disabled') === 'true') return;
    const target = playbackContext(next.href || 'https://www.youtube.com/');
    if (!target || target.listId !== context.listId || target.videoId === context.videoId) return;
    const key = `${context.listId}:${context.videoId}`;
    if (lastSkip === key) return;
    lastSkip = key;
    console.info('[Skip AI Tunes] Skipping video with an AI badge or music disclosure.');
    next.click();
  }

  function schedule() {
    if (pending) return;
    pending = true;
    setTimeout(check, 250);
  }
  chrome.storage.local.get({ enabled: true, blockAllAI: false }).then(settings => {
    enabled = settings.enabled;
    blockAllAI = settings.blockAllAI === true;
    schedule();
  });
  chrome.storage.onChanged.addListener((changes, area) => {
    if (area === 'local' && changes.blockAllAI) {
      blockAllAI = changes.blockAllAI.newValue === true;
      schedule();
    }
    if (area === 'local' && changes.enabled) {
      enabled = changes.enabled.newValue !== false;
      schedule();
    }
  });
  document.addEventListener('yt-navigate-start', () => {
    navigationAt = Date.now();
  });
  document.addEventListener('yt-navigate-finish', () => {
    navigationAt = Date.now();
    lastSkip = null;
    setTimeout(schedule, 1600);
  });
  document.addEventListener('playing', schedule, true);
  new MutationObserver(schedule).observe(document.documentElement, {
    childList: true, subtree: true, characterData: true
  });
  setInterval(schedule, 2000);
})();
