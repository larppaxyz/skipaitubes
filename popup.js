const toggle = document.getElementById('enabled');
const blockToggle = document.getElementById('blockAllAI');
const status = document.getElementById('status');
chrome.storage.local.get({ enabled: true, blockAllAI: false }).then(({ enabled, blockAllAI }) => {
  toggle.checked = enabled;
  toggle.disabled = false;
  blockToggle.checked = blockAllAI;
  blockToggle.disabled = false;
}).catch(() => { status.textContent = 'Could not load settings.'; });
toggle.addEventListener('change', async () => {
  try {
    await chrome.storage.local.set({ enabled: toggle.checked });
    status.textContent = toggle.checked ? 'Skipping enabled.' : 'Skipping paused.';
  } catch {
    status.textContent = 'Could not save settings.';
  }
});
blockToggle.addEventListener('change', async () => {
  try {
    await chrome.storage.local.set({ blockAllAI: blockToggle.checked });
    status.textContent = blockToggle.checked ? 'AI blocking enabled.' : 'AI blocking disabled.';
  } catch {
    status.textContent = 'Could not save settings.';
  }
});
