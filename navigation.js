(() => {
  const { videoIdFromURL, badgeHasAILabel } = globalThis.SkipAITunes;
  const badges = 'badge-shape, .ytBadgeShapeHost, yt-badge-view-model, ytd-badge-supported-renderer, yt-video-attribute-view-model, .yt-badge-shape';
  function selectNextVideo(document, currentURL) {
    const current = new URL(currentURL);
    const currentId = videoIdFromURL(currentURL);
    const list = current.searchParams.get('list');
    function usable(link, playlist = false) {
      if (!link || link.getAttribute('aria-disabled') === 'true') return false;
      const id = videoIdFromURL(link.href);
      if (!id || id === currentId) return false;
      const target = new URL(link.href, currentURL);
      return !playlist || !target.searchParams.get('list') || target.searchParams.get('list') === list;
    }
    if (list) {
      const items = Array.from(document.querySelectorAll('ytd-playlist-panel-video-renderer'));
      const index = items.findIndex(item => item.hasAttribute('selected') ||
        videoIdFromURL(item.querySelector('a[href]')?.href) === currentId);
      if (index >= 0 && index + 1 < items.length) {
        const link = items[index + 1].querySelector('a[href]');
        if (usable(link, true)) return link;
      }
    }
    const next = document.querySelector('#movie_player .ytp-next-button');
    // YouTube often omits list= on the player next button's href.
    if (usable(next, !!list)) return next;
    const suggestions = document.querySelectorAll(
      '#related ytd-compact-video-renderer, #related yt-lockup-view-model, #secondary ytd-video-renderer');
    for (const card of suggestions) {
      if (card.hasAttribute('data-skip-ai-hidden') ||
          Array.from(card.querySelectorAll(badges)).some(badgeHasAILabel)) continue;
      const link = Array.from(card.querySelectorAll('a[href]')).find(link => usable(link));
      if (link) return link;
    }
    return null;
  }
  globalThis.SkipAITunes.selectNextVideo = selectNextVideo;
})();
