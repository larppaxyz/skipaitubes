const { test } = require('node:test');
const assert = require('node:assert/strict');
const vm = require('node:vm');
const fs = require('node:fs');
const sandbox = { SkipAITunes: { ...require('../rules.js') }, URL };
vm.runInNewContext(fs.readFileSync(require.resolve('../navigation.js'), 'utf8'), sandbox);
const { selectNextVideo } = sandbox.SkipAITunes;
const link = (id, extra = '') => ({ href: `https://www.youtube.com/watch?v=${id}${extra}`, getAttribute: () => null });
function document({ items = [], next = null, suggestions = [] } = {}) {
  return { querySelector: () => next,
    querySelectorAll: selector => selector === 'ytd-playlist-panel-video-renderer' ? items : suggestions };
}
function item(id, selected = false) {
  const anchor = link(id, '&list=mix');
  return { hasAttribute: () => selected, querySelector: () => anchor };
}
test('prefers the next playlist item over a recommendation', () => {
  const current = item('current', true);
  const next = item('next');
  assert.equal(selectNextVideo(document({ items: [current, next], next: link('suggested') }),
    'https://www.youtube.com/watch?v=current&list=mix'), next.querySelector());
});
test('falls back to an untagged suggested video when player next is unavailable', () => {
  const ai = { textContent: 'AI', getAttribute: () => null, querySelectorAll: () => [] };
  const tagged = { hasAttribute: () => false,
    querySelectorAll: selector => selector === 'a[href]' ? [link('tagged')] : [ai] };
  const anchor = link('suggested');
  const ordinary = { hasAttribute: () => false,
    querySelectorAll: selector => selector === 'a[href]' ? [anchor] : [] };
  assert.equal(selectNextVideo(document({ suggestions: [tagged, ordinary] }),
    'https://www.youtube.com/watch?v=current'), anchor);
});
test('ignores disabled, self, and external next links and returns null without a target', () => {
  for (const next of [null, link('current'), { ...link('a'), getAttribute: () => 'true' },
    { href: 'https://example.com/watch?v=a', getAttribute: () => null }]) {
    assert.equal(selectNextVideo(document({ next }), 'https://www.youtube.com/watch?v=current'), null);
  }
});
