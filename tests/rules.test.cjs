const { test } = require('node:test');
const assert = require('node:assert/strict');
const { isMusicDisclosure, isAIBadge, playbackContext, videoIdFromURL } = require('../rules.js');
const { badgeHasAILabel } = require('../rules.js');

test('finds a nested AI label even when its badge wrapper includes help text', () => {
  const label = { textContent: 'AI', getAttribute: () => null, closest: () => null };
  const wrapper = { textContent: 'AI Altered or synthetic content', getAttribute: () => null,
    querySelectorAll: () => [label] };
  assert.equal(badgeHasAILabel(wrapper), true);
  label.closest = () => ({});
  assert.equal(badgeHasAILabel(wrapper), false, 'tooltip-only label must not qualify');
});
test('recognizes accessible AI labels and leaves unrelated badges alone', () => {
  const element = { textContent: '', getAttribute: () => 'AI', querySelectorAll: () => [] };
  assert.equal(badgeHasAILabel(element), true);
  element.getAttribute = () => 'Official Artist Channel';
  assert.equal(badgeHasAILabel(element), false);
});
test('recognizes the reported Finnish badge even when its visible text is Al', () => {
  const element = { textContent: 'Al', getAttribute: () => 'AI: Sisältö on luotu tekoälyllä',
    querySelectorAll: () => [] };
  assert.equal(badgeHasAILabel(element), true);
  element.getAttribute = () => 'AI: Content is generated using artificial intelligence';
  assert.equal(badgeHasAILabel(element), true);
  element.getAttribute = () => 'Official Artist Channel';
  assert.equal(badgeHasAILabel(element), false);
});

test('extracts video IDs from result links without counting channel links', () => {
  assert.equal(videoIdFromURL('/watch?v=abc&list=mix'), 'abc');
  assert.equal(videoIdFromURL('/shorts/abc'), 'abc');
  assert.equal(videoIdFromURL('/@creator'), null);
  assert.equal(videoIdFromURL('https://example.com/watch?v=abc'), null);
});

test('matches only the standalone AI badge label', () => {
  for (const label of ['AI', ' AI\n', 'ai']) assert.equal(isAIBadge(label), true);
  for (const label of ['AI music', 'Contains AI', 'Paid promotion', '']) {
    assert.equal(isAIBadge(label), false, label);
  }
});

test('recognizes explicit music disclosures', () => {
  for (const text of ['AI-generated music', 'Music was generated using artificial intelligence',
    'Sound or music was synthetically generated', 'Synthetically generated music']) {
    assert.equal(isMusicDisclosure(text), true, text);
  }
});
test('generic disclosures and unrelated music references do not qualify', () => {
  for (const text of ['Altered or synthetic content', 'AI-generated visuals with live music',
    'Music video', 'AI music discussion', '', 'Realistic-looking scenes were synthetically generated']) {
    assert.equal(isMusicDisclosure(text), false, text);
  }
});
test('requires both a watch video and playlist', () => {
  assert.deepEqual(playbackContext('https://www.youtube.com/watch?v=a&list=RDabc'), {
    videoId: 'a', listId: 'RDabc'
  });
  for (const path of ['/watch?v=a', '/watch?list=abc', '/shorts/a?list=abc', '/']) {
    assert.equal(playbackContext(`https://www.youtube.com${path}`), null);
  }
});
