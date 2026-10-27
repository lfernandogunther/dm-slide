# Learnings — S05

## Learned
- **2026-10-22 — The comments page is ranked, and the author's comments are mostly replies.** Read
  live on 6 public posts (keys and types only): `/api/v1/media/<id>/comments/` returns 11–15
  comments in mixed date order, with no top-level comment by the author in any of the 6; the
  author's comments sat only in `preview_child_comments`, as replies. So "first" is found by
  `created_at`, never by position, and replies are left out: an answer to someone else reads wrong on
  its own. Large accounts will mostly show the caption alone. → stays
- **2026-10-22 — The caption rides on the info read the media already makes.** `items[0].caption`
  (`text`, `created_at` in seconds, `user`) came back in 6 of 6; `preview_comments` was always empty,
  so it can't stand in for the comments read. Ids are compared by `pk_id` (a string): a numeric pk
  can outgrow a JSON number. → notes
- **2026-10-22 — The author-comment fields were read live, a match never was.** Task 01's live read
  had `items[0].comment_count` as a number and `pk_id` on `items[0].user`, `caption.user` and every
  `comments[].user`, so the read compares `pk_id` only. No post of the 6 had a top-level author comment,
  so the match itself is first seen in the manual run on Instagram. → stays

- **2026-10-27 — The public embed carries the caption, the author and the counts, not the comments
  or the time.** Two live reads, in an isolated tab on public posts, keys and types only:
  - **The data:** `gql_data.shortcode_media` in `contextJSON`, the same in `embed/` and
    `embed/captioned/`, for reels (GraphVideo) and carousels (GraphSidecar). It holds:
    - `edge_media_to_caption.edges[0].node.text`;
    - `owner.{username, is_verified}`;
    - `edge_liked_by.count`, and `edge_media_to_comment.count` (a count only, with no edges);
    - on reels, `video_view_count`, `video_duration` and
      `clips_music_attribution_info.{artist_name, song_name, uses_original_audio}`.
  - **One-photo posts** have a null `contextJSON`. Only their `captioned` HTML has the caption,
    under `.Caption`.
  - **Missing from the embed:** comment bodies, any post time, location and tagged users. A collab
    post's second author is only in the `captioned` page's DOM.
  - **Paths must be bare:** with a `/<user>/` prefix, `embed/captioned/` returns 404, and `embed/`
    returns another page without `contextJSON`.
  - **Speed:** a reel's `captioned` iframe gave its `<video>` as fast as the plain one did, within
    the 1 s sample.

  → notes
- **2026-10-27 — A post's time can be decoded from its shortcode, to the day.**
  - **The steps:** decode the shortcode as base64url to get the media id. It matched the JSON `id`
    and `data-media-id` on 3 of 3 posts. Then `(id >> 23) + 1314220021721` gives milliseconds.
  - **Accuracy:** against `taken_at` on the logged-out post page, it was 17 s and 7 s early on a
    carousel and a photo, and 2.4 h early on a reel. The id is probably given out at upload, not at
    publish.
  - **Why not `taken_at`:** loading that full page would be a new kind of request, so the card
    shows a date, never a time.

  → notes

- **2026-10-27 — The card waits for the item's media read, by design.** Every move clears it and
  it comes back once the read settles, so it flickers between items, and a slow reel shows none
  until its embed read ends (up to the timeout). The facts arrive with that same read, so an
  earlier card would show the date alone and then grow. → stays

## Concepts learned
- **Caption**: the text the author wrote when posting, returned with the post's info.
- **Top-level comment**: a comment on the post itself, not a reply inside another comment's thread.
- **Shortcode**: the post's code in its link; base64url for the media id.
- **Epoch seconds**: Instagram's dates are seconds since 1970; JavaScript's are milliseconds.

## Promoted
