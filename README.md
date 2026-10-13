# Skip AI Tunes

A Manifest V3 Chrome extension that advances to the next video in an actively
playing YouTube mix or playlist when the current video displays YouTube’s **AI**
badge beneath the title or a disclosure explicitly identifies AI-generated music.
An ordinary video outside a playlist is left alone.

## Install

1. Open Chrome's extensions page (`chrome://extensions`).
2. Enable **Developer mode**, select **Load unpacked**, and choose this directory.
3. Reload any already-open YouTube tabs and play a mix or playlist.

Use the extension popup to turn skipping on or off. No build or dependency
installation is required. Settings remain on your device; the extension sends
no data and requires only storage permission and access to www.youtube.com.

Version 1.1 adds **Block all AI-tagged videos**, a separate setting that is off
by default. When enabled, videos with an AI badge are hidden from Home, search,
and recommendations. Tagged watch pages are paused and replaced with a blocking
notice, including videos outside playlists. Blocking takes priority over playlist
skipping. Turn blocking off to restore hidden items and player controls; resume
playback manually. The setting persists and updates open tabs.

Filtering can only detect AI badges YouTube exposes in a card's markup. If Home
or search omits a video's badge, it cannot be identified before opening the video.
The extension does not fetch every result's watch page or classify its audio.

Version 1.2 adds a counter on the toolbar icon. Pin the extension in Chrome's
Extensions menu to keep it visible. It counts unique videos hidden, blocked,
or skipped across all YouTube tabs during the current browser session. Repeated
checks, duplicate cards, reloads, and toggling settings do not count the same video
again. Cards without a usable video link are hidden but cannot be counted.
The count survives background-worker suspension and resets when Chrome restarts
or the extension is reloaded, disabled, or updated. It is not saved to disk.

## Detection limits

The **AI** badge triggers skipping even when the disclosure does not specify
music. This can also skip videos where only the visuals or speech use AI.
Detection checks visible badge components in the current video's metadata and
explicit English music wording inside disclosure components, not arbitrary
titles, descriptions, or comments. Generic disclosure wording without the AI
badge or music-specific details does not trigger skipping. This is not an audio
classifier: undisclosed AI music is not detected.

YouTube's markup may change, and the disclosure may be hidden or unavailable.
The current selectors and wording need verification against real labeled videos;
automated fixture tests do not establish compatibility with live YouTube.

## Development and verification

Run `npm test` with Node.js 18 or newer. The tests exercise disclosure matching,
playlist guards, and content-script behavior with DOM fixtures.

For a live check, load unpacked in Chrome and play a playlist containing a video
with the AI badge or an explicit music disclosure. Confirm it advances once,
leaves untagged videos alone, and stops skipping when disabled. Also check
paused playback, ordinary watch pages, and navigation between playlist videos.
Keep a real disclosure example when updating selectors; do not broaden detection
to arbitrary page text.
