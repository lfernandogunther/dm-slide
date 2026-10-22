# Learnings — S04

## Learned
- 2026-10-22: esbuild 0.28's `serve` writes the bundle into `outdir` on the first request, even
  without `watch`. The demo's bundle is gitignored; nothing reaches `dist/`. → notes
- 2026-10-22: `?` shows the key card over the tips, not the tips alone; a tips-only screenshot needs
  Option held down (Playwright: a held key through `run_code_unsafe`). → notes
- 2026-10-22: the Playwright MCP browser was sitting on a real Instagram DM thread when the
  screenshot subagent started; it navigated away without touching it. A demo-only subagent should
  open a new tab, never reuse what is on screen. → notes + CLAUDE.md (proposed)
- 2026-10-22: the Web Store counts data handled only on the device as "handled": personal
  communications, website content and the sender's name are declared, though none leaves the page. → notes
- 2026-10-22: the store's docs name only gcloud impersonation and a JSON key for the service
  account, never federation. `google-github-actions/auth` with `service_account` and
  `token_format: access_token` impersonates it from a federated identity; the store sees the
  service account. One service account per publisher. → notes
- 2026-10-22: `.gitignore`'s `node_modules/` (trailing slash) doesn't match a symlink, so a scratch
  clone with a linked `node_modules` reads as a dirty tree. → stays
- 2026-10-22: the first push of `.github/workflows/` was refused: the personal `gh` token had no
  `workflow` scope. `gh auth refresh -s workflow` only took once the browser was signed in to the
  right account (a private window); with another account signed in, the scope never arrived. → notes
- 2026-10-22: Claude Code's auto mode refuses `git push` and `npm run release` here as a public
  surface; the owner runs them. → stays
- 2026-10-22: a guide line naming a block ("the `storage` block") got pasted into the dashboard as
  is. Give the text itself, ready to copy, never a pointer to it. → lessons (proposed)
- 2026-10-22: the dashboard's privacy tab rejects nothing until submit; one popup then lists every
  missing privacy field at once. Screenshots upload one per drop: four files dragged once landed one. → notes

## Concepts learned
- **Repository variables vs secrets**: `vars.*` are readable in a job's `if:`, `secrets.*` are not;
  ids that are not credentials belong in variables, and gating a job on them is plain.

## Promoted
- 2026-10-22: seven entries → NOTES.md (`## Demo`, `## Release and the store`); two stay here;
  one proposed for CLAUDE.md, one for cn-lessons.
