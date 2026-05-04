# Adapter User Script Workflow

Use this checklist whenever implementing adapter user scripts.

## Goal

Build each site script as a standalone file under `packages/adapter/official/`, then export it into the generated registry so the loader can decide whether to run it by `regexSite`.

## Script Contract

1. Every script file must export:
   - `export const regexSite = '...'`
   - `export default defineSiteAdapter({ ... })`
2. Use `permissions.managers` to declare which built-in managers are initialized:
   - `DanmakuSender`
   - `DanmakuManager`
   - `SubtitleManager`
3. Use `permissions.extensions` to declare internal extension usage (permission-style).
4. In `setup(context)`, call:
   - `context.initDanmakuSender(...)`
   - `context.initDanmakuManager(...)`
   - `context.initSubtitleManager(...)`
   - `context.useExtension(...)`

## Bundle & Load Flow

1. Add/update scripts in `official/*.ts`.
2. Run `pnpm --filter @dmMiniPlayer/adapter run build:registry`.
3. Generated file `official/generated-registry.ts` is the bundling output.
4. Loader uses `officialSiteAdapterLoader.match(url)` / `load(url)` to decide and execute matched scripts.

## Fixed Rules

- Keep extension permissions inside `core/extensions.ts`.
- Do not bypass `defineSiteAdapter`.
- Keep comments in English.
