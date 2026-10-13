(() => {
  const reported = new Set();
  globalThis.SkipAITunes.reportBlocked = videoId => {
    if (!videoId || reported.has(videoId)) return;
    reported.add(videoId);
    chrome.runtime.sendMessage({ type: 'ai-video-blocked', videoId }).catch(() => {
      // Retry on the next detection if the worker was temporarily unavailable.
      reported.delete(videoId);
    });
  };
})();
