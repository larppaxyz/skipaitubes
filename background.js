// Session storage survives MV3 worker suspension, but not a browser restart.
// Serialize updates so simultaneous detections in several tabs cannot lose counts.
let queue = Promise.resolve();
async function refreshBadge(ids) {
  const count = ids.length;
  await chrome.action.setBadgeBackgroundColor({ color: '#176c45' });
  await chrome.action.setBadgeText({ text: String(count) });
  await chrome.action.setTitle({ title: `Skip AI Tunes — ${count} AI videos blocked this session` });
}
function enqueue(task) {
  const result = queue.then(task);
  queue = result.catch(error => console.error('Could not update AI block counter:', error));
  return result;
}
enqueue(async () => {
  const { blockedVideoIds = [] } = await chrome.storage.session.get('blockedVideoIds');
  await refreshBadge(blockedVideoIds);
});
chrome.runtime.onMessage.addListener((message, sender, respond) => {
  if (message?.type !== 'ai-video-blocked') return;
  let url;
  try { url = new URL(sender.url); } catch { return; }
  if (!sender.tab || url.origin !== 'https://www.youtube.com' ||
      typeof message.videoId !== 'string' || !/^[A-Za-z0-9_-]{1,128}$/.test(message.videoId)) return;
  enqueue(async () => {
    const { blockedVideoIds = [] } = await chrome.storage.session.get('blockedVideoIds');
    if (!blockedVideoIds.includes(message.videoId)) {
      blockedVideoIds.push(message.videoId);
      await chrome.storage.session.set({ blockedVideoIds });
    }
    await refreshBadge(blockedVideoIds);
    respond({ count: blockedVideoIds.length });
  }).catch(() => respond({ error: 'Counter unavailable' }));
  return true;
});
