(function (root) {
  const patterns = [
    /\b(?:ai|artificial intelligence)[ -]generated\s+music\b/i,
    /\bmusic\s+(?:was\s+|is\s+)?(?:generated|created)\s+(?:by|with|using)\s+(?:ai|artificial intelligence)\b/i,
    /\b(?:synthetically generated|synthetic)\s+music\b/i,
    /\b(?:sound or music|music)\s+(?:was\s+|is\s+|has been\s+)?synthetically generated\b/i
  ];
  function isMusicDisclosure(text) {
    const normalized = String(text || '').replace(/\s+/g, ' ').trim();
    return patterns.some(pattern => pattern.test(normalized));
  }
  function playbackContext(url) {
    const parsed = new URL(url);
    return parsed.pathname === '/watch' && parsed.searchParams.get('list') && parsed.searchParams.get('v')
      ? { videoId: parsed.searchParams.get('v'), listId: parsed.searchParams.get('list') }
      : null;
  }
  function isAIBadge(text) {
    return String(text || '').trim().toUpperCase() === 'AI';
  }
  function videoIdFromURL(value) {
    try {
      const url = new URL(value, 'https://www.youtube.com');
      if (url.origin !== 'https://www.youtube.com') return null;
      if (url.pathname === '/watch') return url.searchParams.get('v');
      if (url.pathname.startsWith('/shorts/')) return url.pathname.split('/')[2] || null;
    } catch { /* Ignore malformed links. */ }
    return null;
  }
  const rules = { isMusicDisclosure, isAIBadge, playbackContext, videoIdFromURL };
  root.SkipAITunes = rules;
  if (typeof module !== 'undefined') module.exports = rules;
})(globalThis);
