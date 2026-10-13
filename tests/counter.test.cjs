const { test } = require('node:test');
const assert = require('node:assert/strict');
const vm = require('node:vm');
const fs = require('node:fs');

async function worker(session = {}) {
  let listener;
  let badge;
  const chrome = {
    storage: { session: {
      get: async () => structuredClone(session),
      set: async data => Object.assign(session, structuredClone(data))
    } },
    action: {
      setBadgeBackgroundColor: async () => {},
      setBadgeText: async ({ text }) => { badge = text; },
      setTitle: async () => {}
    },
    runtime: { onMessage: { addListener: fn => { listener = fn; } } }
  };
  vm.runInNewContext(fs.readFileSync(require.resolve('../background.js'), 'utf8'), { chrome, URL, console });
  await new Promise(resolve => setImmediate(resolve));
  return {
    badge: () => badge,
    send(videoId, url = 'https://www.youtube.com/watch?v=video', tab = {}) {
      return new Promise(resolve => {
        if (listener({ type: 'ai-video-blocked', videoId }, { url, tab }, resolve) !== true) resolve(null);
      });
    }
  };
}
test('initial badge shows zero and counts unique videos across simultaneous tabs', async () => {
  const page = await worker();
  assert.equal(page.badge(), '0');
  await Promise.all([page.send('a'), page.send('b'), page.send('a')]);
  assert.equal(page.badge(), '2');
  await page.send('b');
  assert.equal(page.badge(), '2');
});
test('worker restart retains session count; new browser session resets it', async () => {
  const session = {};
  const first = await worker(session);
  await first.send('a');
  const restarted = await worker(session);
  assert.equal(restarted.badge(), '1');
  await restarted.send('a');
  assert.equal(restarted.badge(), '1');
  assert.equal((await worker()).badge(), '0');
});
test('rejects invalid IDs and messages outside YouTube content tabs', async () => {
  const page = await worker();
  for (const args of [['bad id'], ['a', 'https://example.com'], ['a', 'https://www.youtube.com', null]]) {
    assert.equal(await page.send(...args), null);
  }
  assert.equal(page.badge(), '0');
});
test('content reporter avoids repeated messages and retries failed sends', async () => {
  const ids = [];
  let fail = true;
  const sandbox = { SkipAITunes: {}, chrome: { runtime: {
    sendMessage: async message => {
      ids.push(message.videoId);
      if (fail) throw new Error('Worker unavailable');
    }
  } } };
  vm.runInNewContext(fs.readFileSync(require.resolve('../counter.js'), 'utf8'), sandbox);
  sandbox.SkipAITunes.reportBlocked('a');
  await new Promise(resolve => setImmediate(resolve));
  fail = false;
  sandbox.SkipAITunes.reportBlocked('a');
  sandbox.SkipAITunes.reportBlocked('a');
  sandbox.SkipAITunes.reportBlocked('b');
  assert.deepEqual(ids, ['a', 'a', 'b']);
});
