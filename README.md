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
