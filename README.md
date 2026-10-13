# Skip AI Tunes

**Author:** Lari Temmes

Open-source software licensed under the [GNU General Public License v3.0](LICENSE)
(GPL-3.0-only). Copyright © 2026 Lari Temmes.

A Manifest V3 Chrome extension that advances to the next video in an actively
playing YouTube video when the current video displays YouTube’s **AI**
badge beneath the title or a disclosure explicitly identifies AI-generated music.
In a playlist it chooses the next item; outside a playlist it chooses YouTube's
next video or a suggestion so playback can continue.

## Install

1. Open Chrome's extensions page (`chrome://extensions`).
2. Enable **Developer mode**, select **Load unpacked**, and choose this directory.
3. Reload any already-open YouTube tabs and play a mix or playlist.

Use the extension popup to turn skipping on or off. No build or dependency
installation is required. Settings remain on your device; the extension sends
no data and requires only storage permission and access to www.youtube.com.

**Block all AI-tagged videos** is a separate setting that is off
by default. When enabled, videos with an AI badge are hidden from Home, search,
and recommendations. Version 1.3 automatically advances past tagged watch videos
instead of pausing or hiding the player. Either the skip setting or the block-all
setting enables advancing; turn both off to leave playback alone. Turn blocking
off to restore hidden cards. Settings persist and update open tabs.

Navigation prefers the next playlist item, then the player's Next button, then
an available untagged suggested video. Suggestions already marked AI are ignored.
If no usable target is available, the extension keeps checking without pausing
the player. Consecutive tagged playlist items are skipped as their badges load.
Playback that the user has paused is left alone.

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
Test with block-all enabled and skipping disabled, and with both enabled. For a
standalone tagged video, confirm it advances to a suggested video. At playlist
end, check the fallback when YouTube supplies no next playlist item.
Keep a real disclosure example when updating selectors; do not broaden detection
to arbitrary page text.
