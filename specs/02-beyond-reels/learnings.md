# Learnings — S02

## Learned
- 2026-10-21 — **Spike: how each kind looks in the Relay store** (six read threads, read only).
  Every message record is a `SlideMessage`; its kind is `record.content_type` plus the content's
  `__typename`, and for shares the XMA's `__typename`:

  | Kind | content_type | content → xma | Marker |
  |---|---|---|---|
  | Reel | MESSAGE_INLINE_SHARE | XMAContent → PortraitXMA | target `/reel/<code>/`, decoration REEL |
  | Post, one photo | MESSAGE_INLINE_SHARE | XMAContent → StandardXMA | target `/p/<code>/`, decoration null |
  | Post, carousel | same | same | decoration COLLAGE |
  | Post, video | same | same | decoration VIDEO |
  | Unavailable post or reel | MESSAGE_INLINE_SHARE | XMAContent → PlaceholderXMA | no target, no preview |
  | Story reply or reaction | MONTAGE_SHARE_XMA | XMAContent → PortraitXMA | `xma_text_body` non-empty |
  | Expired story | MONTAGE_SHARE_XMA | XMAContent → ExpiredPlaceholderXMA | no target, no preview |
  | Link | SHARE_URL_WRAPPER_XMA | XMAContent → StandardXMA | external target |
  | Gallery video | VIDEOS | SlideMessageVideosContent | `videos[]` |
  | Voice | AUDIOS | SlideMessageAudiosContent | — |

  - The decoration is `preview_image.preview_image_decoration_type`. `preview_layout_type` is
    always SINGLE, even for carousels.
  - **Availability has no boolean.** The XMA typename is the flag: PlaceholderXMA and
    ExpiredPlaceholderXMA hold only fixed UI copy. `tombstone_reason` and the expiration fields
    were null everywhere. → NOTES.md (Reading Instagram, Playback)
  - **What the store alone can show:** a one-photo post's `preview_image.url` is full resolution.
    A carousel's preview is its first slide only; a video post's is a poster. A gallery video's
    `videos[].attachment_cdn_url` is a direct mp4, so it needs no lookup.
  - **A story share vs a story reply:** only replies were seen live (`xma_text_body` non-empty,
    usually my own story being answered). A share is read as the same record with an empty
    `xma_text_body`, which is how the expired variant splits. Not confirmed on a live share.
  - **Gallery photos were not seen live.** The loaded bundle names
    `SlideMessageImageContent.attachments` (photos), `SlideMessageMultiMediaContent
    .ordered_photo_video_attachments` (mixed sends, one message with N attachments) and the same
    `attachment_cdn_url` / `preview_cdn_url` fields as videos. Static evidence only.
  - **The media lookup (`/api/v1/media/<id>/info/`) answered 302 to the home page for every kind**,
    reels included, with or without extra headers. Reels still play through the embed fallback;
    carousel slides beyond the first and video-post mp4s have no other source in the store.
- 2026-10-21 — **Spike: chat cards** (fiber depth counted up from the card).
  - Reel: `[role=button]`, `isReel` at 4, `slideMessageRef` at 5.
  - Post (one photo and carousel render the same): `[role=button]`, no flag, `standardXMARef` at
    5, `slideMessageRef` at 13.
  - Story: an `<a href="/stories/…">`, not a pressable; `slideMessageRef` about 26 up from its img.
  - Gallery video: `[role=button]`, `attachmentType=4` at 4, `slideMessageRef` at 7.
  - So the one rule that covers every kind is "the nearest `slideMessageRef` above a pressable or a
    story link", and the listed items decide whether that message opens the player. → NOTES.md
- 2026-10-21 — **Spike: paging.** Every page adds 20 messages in 450–625 ms, plus ~600 ms to
  settle. Two months back is ~2 pages in a quiet thread and 30+ in a busy one (1.5–2 min at a
  person's pace). → NOTES.md
- 2026-10-21 — Revealing a row near the top of the loaded list makes Instagram fetch more older
  pages on its own, so list indices shift under the caller. → NOTES.md

## Concepts learned

## Promoted
- 2026-10-21 — all four entries → NOTES.md (decisions and gotchas about Instagram's page). Nothing for CLAUDE.md, lessons or rules: each is true of this repo only.
