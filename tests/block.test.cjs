const { test } = require('node:test');
const assert = require('node:assert/strict');
const vm = require('node:vm');
const fs = require('node:fs');

function badge(text = 'AI') {
  return { textContent: text, hidden: false, closest: () => null, getAttribute: () => null, querySelectorAll: () => [] };
}
function card(labels = [], id = 'card-video') {
  const attributes = new Set();
  return {
    labels, isConnected: true,
    querySelectorAll(selector) { return selector === 'a[href]' ? [{ href: `https://www.youtube.com/watch?v=${id}` }] : this.labels; },
    setAttribute: name => attributes.add(name),
    removeAttribute: name => attributes.delete(name),
    has: name => attributes.has(name)
  };
}
async function fixture({ cards = [], enabled = false, watchAI = false, watchLabel = null, path = '/' } = {}) {
  const timers = [];
  const reports = [];
  let storage;
  let tick;
  const video = { paused: false, pause() { this.paused = true; } };
  const player = card();
  player.querySelector = () => video;
  player.parentElement = { insertBefore() {} };
  const metadata = card(watchAI ? [badge()] : []);
  if (watchLabel) metadata.labels = [{ ...badge('Al'), getAttribute: () => watchLabel }];
  const watch = { getAttribute: () => 'current', querySelector: () => metadata };
  const sandbox = {
    SkipAITunes: { ...require('../rules.js'), reportBlocked: id => reports.push(id) }, URL,
    location: { href: `https://www.youtube.com${path}`, pathname: path.split('?')[0] },
    setTimeout: fn => timers.push(fn), setInterval: fn => { tick = fn; },
    MutationObserver: class { observe() {} },
    chrome: { storage: {
      local: { get: async () => ({ blockAllAI: enabled }) },
      onChanged: { addListener: fn => { storage = fn; } }
    } },
    document: {
      documentElement: {}, addEventListener() {},
      querySelectorAll: () => cards,
      querySelector: selector => selector === 'ytd-watch-flexy' ? watch : player,
      createElement: () => ({ setAttribute() {}, remove() {} })
    }
  };
  vm.runInNewContext(fs.readFileSync(require.resolve('../block.js'), 'utf8'), sandbox);
  await Promise.resolve();
  const flush = () => { while (timers.length) timers.shift()(); };
  flush();
  return { player, video, metadata, reports,
    tick() { tick(); flush(); },
    setting(value) { storage({ blockAllAI: { newValue: value } }, 'local'); flush(); }
  };
}

test('Home and search hide tagged cards only, and restore them when disabled', async () => {
  for (const path of ['/', '/results?search_query=music']) {
    const tagged = card([badge()]);
    const ordinary = card([badge('Official Artist Channel')]);
    const page = await fixture({ cards: [tagged, ordinary], enabled: true, path });
    assert.equal(tagged.has('data-skip-ai-hidden'), true);
    assert.equal(ordinary.has('data-skip-ai-hidden'), false);
    assert.deepEqual(page.reports, ['card-video']);
    page.setting(false);
    assert.equal(tagged.has('data-skip-ai-hidden'), false);
  }
});
test('blocking is off by default and handles newly tagged and recycled cards', async () => {
  const item = card([badge()]);
  const page = await fixture({ cards: [item] });
  assert.equal(item.has('data-skip-ai-hidden'), false);
  page.setting(true);
  assert.equal(item.has('data-skip-ai-hidden'), true);
  item.labels = [];
  page.tick();
  assert.equal(item.has('data-skip-ai-hidden'), false);
  item.labels = [badge()];
  page.tick();
  assert.equal(item.has('data-skip-ai-hidden'), true);
});
