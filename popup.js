const toggle = document.getElementById('enabled');
const status = document.getElementById('status');
chrome.storage.local.get({ enabled: true }).then(({ enabled }) => {
  toggle.checked = enabled;
  toggle.disabled = false;
}).catch(() => { status.textContent = 'Could not load settings.'; });
toggle.addEventListener('change', async () => {
  try {
    await chrome.storage.local.set({ enabled: toggle.checked });
    status.textContent = toggle.checked ? 'Skipping enabled.' : 'Skipping paused.';
  } catch {
    status.textContent = 'Could not save settings.';
  }
});
