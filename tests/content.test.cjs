const { test } = require('node:test');
const assert = require('node:assert/strict');
const vm = require('node:vm');
const fs = require('node:fs');
const rules = require('../rules.js');

async function fixture(options = {}) {
  let clicks = 0;
  let interval;
  let storageListener;
  const timers = [];
  const events = {};
  const disclosure = { textContent: options.text ?? 'AI-generated music' };
  const next = {
    href: options.next ?? 'https://www.youtube.com/watch?v=next&list=mix',
    getAttribute: () => options.disabled ? 'true' : null,
    click: () => { clicks++; }
  };
  const video = { paused: !!options.paused, ended: false, readyState: 4 };
  const sandbox = {
    SkipAITunes: rules,
    location: { href: options.url ?? 'https://www.youtube.com/watch?v=current&list=mix' },
    Date: { now: () => now },
    console: { info() {} },
    setTimeout: fn => timers.push(fn),
    setInterval: fn => { interval = fn; },
    MutationObserver: class { observe() {} },
    chrome: { storage: {
      local: { get: async () => ({ enabled: options.enabled !== false, blockAllAI: !!options.blockAllAI }) },
      onChanged: { addListener: fn => { storageListener = fn; } }
    } },
    document: {
      documentElement: {},
      addEventListener: (name, fn) => { events[name] = fn; },
      querySelector: selector => {
        if (selector === '#movie_player.ad-showing') return options.ad ? {} : null;
        if (selector === 'ytd-watch-flexy') return { getAttribute: () => options.stale ? 'old' : 'current' };
        if (selector === '#movie_player video') return video;
        return next;
      },
      querySelectorAll: selector => {
        if (selector.includes('yt-video-attribute-view-model')) {
          return options.badge === undefined ? [] : [{
            textContent: options.badge,
            closest: () => options.badgeInDescription ? {} : null,
            getClientRects: () => options.hiddenBadge ? [] : [{}]
          }];
        }
        return options.noDisclosure ? [] : [disclosure];
      }
    }
  };
  let now = 0;
  vm.runInNewContext(fs.readFileSync(require.resolve('../content.js'), 'utf8'), sandbox);
  await Promise.resolve();
  now = 2000;
  function flush() { while (timers.length) timers.shift()(); }
  flush();
  return {
    clicks: () => clicks,
    tick() { interval(); flush(); },
    disable() { storageListener({ enabled: { newValue: false } }, 'local'); flush(); },
    video, disclosure
  };
}

test('advances once for an explicit disclosure during playlist playback', async () => {
  const page = await fixture();
  assert.equal(page.clicks(), 1);
  page.tick();
  assert.equal(page.clicks(), 1);
});

test('leaves generic labels, paused playback, stale pages, and unrelated next links alone', async () => {
  for (const options of [
    { text: 'Altered or synthetic content' }, { paused: true }, { stale: true },
    { enabled: false }, { blockAllAI: true }, { noDisclosure: true }, { disabled: true }, { ad: true },
    { url: 'https://www.youtube.com/watch?v=current' },
    { next: 'https://www.youtube.com/watch?v=next&list=other' },
    { next: 'https://www.youtube.com/watch?v=current&list=mix' }
  ]) {
    const page = await fixture(options);
    assert.equal(page.clicks(), 0, JSON.stringify(options));
  }
});

test('reacts to playback and setting changes', async () => {
  const page = await fixture({ paused: true });
  page.disable();
  page.video.paused = false;
  page.tick();
  assert.equal(page.clicks(), 0);
  const playing = await fixture({ paused: true });
  playing.video.paused = false;
  playing.tick();
  assert.equal(playing.clicks(), 1);
});

test('visible AI badge triggers a skip without music-specific disclosure text', async () => {
  const page = await fixture({ text: 'Altered or synthetic content', badge: ' AI ' });
  assert.equal(page.clicks(), 1);
  page.tick();
  assert.equal(page.clicks(), 1);
});

test('hidden badges, description text, and unrelated badges do not trigger skips', async () => {
  for (const options of [
    { badge: 'AI', hiddenBadge: true }, { badge: 'AI', badgeInDescription: true },
    { badge: 'AI music discussion' }, { badge: 'Official Artist Channel' },
    { badge: 'AI', paused: true }, { badge: 'AI', enabled: false },
    { badge: 'AI', url: 'https://www.youtube.com/watch?v=current' }
  ]) {
    const page = await fixture({ noDisclosure: true, ...options });
    assert.equal(page.clicks(), 0, JSON.stringify(options));
  }
});
