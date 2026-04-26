## @apades/logger

Important: after you're done with a feature, and have enough holistic vision, make sure you do a pass over all the files again and see if you can simplify anything. Don't change things for the sake of, but if there are simplifications, YELL **I DID A HOLISTIC PASS AND FOUND SIMPLIFICATIONS** with a brief summary.

Important: do NOT monkey-patch. If you found yourself solving the symptom instead of the root cause, reconsider and do a proper fix, then YELL **I SOLVED THE ROOT CAUSE NOT THE SYMPTOM** with a brief summary.

Important: After making changes, update the `packages/logger/promote.md` documentation as appropriate according to the feature(s) added or modified. If there are no significant changes, try to avoid editing this document unnecessarily.

### Path conventions

1. If the path starts with `/`, it refers to the project root path. For example, `/tsconfig.json` points to `../../tsconfig.json` relative to the current file directory.
2. If there is no special path prefix, such as `package.json`, it refers to the `package.json` file in the current directory.

### Entry points

- **`ext.ts`** — extension scripts (content script or background). Import **`logger`** from `@apades/logger/ext`. Extension context (**cs** vs **bg**) is inferred with `/src/shared/isBG.ts` (do not pass context manually). Also exports **`appendLoggerLinesToChromeStorage`** for the main content script when persisting inject-origin batches, and installs **`globalThis.$clearLoggerLogs()`** for clearing logger memory, pending batches, and persisted storage logs.
- **`inject.ts`** — injected (page) scripts. Import **`logger`** from `@apades/logger/inject`.
- **`index.ts`** — shared exports (`createRootLogger`, `createNamespacedLogger`, `setLoggerNamespaceEnabled`, types, helpers) for code that does not use the `ext` / `inject` singletons.

Supporting modules in this package include **`core.ts`** (root + namespaced loggers, in-memory buffer), **`persist-chrome.ts`** (sequential `chrome.storage.local` writes per environment to avoid lost updates), **`session-key.ts`**, **`namespaces.ts`**, **`namespace-style.ts`**, **`types.ts`**.

### Public surface (`ext` / `inject`)

Both environments expose a single **`logger`** object:

- **Root (console-like):** `logger.log`, `logger.info`, `logger.warn`, `logger.error`, `logger.assert`, and **`logger.userAction`** (user actions only on the root logger).
- **Namespaced loggers:** `logger.namespace(name)` returns a logger with the same methods **except** `userAction`. Namespaced instances are cached per `name`.
- **Toggle namespaces:** `logger.namespace.enable(namespace, enabled)` — enable or disable console + persistence for that namespace (default enabled).

Types: **`ExtensionLogger`** (`ext.ts`), **`InjectLogger`** (`inject.ts`).

### Cross-environment wiring

- **Extension:** persistence goes directly to `chrome.storage.local` via `persist-chrome.ts`.
- **Inject:** no `chrome.storage` in the page world. Batches are sent with **`PostMessageEvent.loggerPersist`** (`/src/shared/postMessageEvent.ts`) using **`postMessageToTop`** from `/src/utils/windowMessages.ts`. The main content script handles it under `/src/contents/main/run-on-top` and calls **`appendLoggerLinesToChromeStorage('inject', lines)`**.

### Console and persistence rules

- API mirrors **`console`** for the listed methods; **`userAction`** is an extra channel for user-intent events.
- In development, logger output, memory mirroring, and persistence are enabled by default. In production, the `ext` / `inject` singletons emit only when logging is explicitly enabled. Extension content scripts read the current frame document's **`dm-show-log`** attribute; extension background reads the **`SHOW_LOG`** sync-storage value; injected scripts read the current document and also check `window.top.document` for document Picture-in-Picture windows.
- Namespaced console lines use a **`[namespace]`** prefix styled with **`%c`**; color is deterministic from the namespace string and **cached** after first use.
- Each log is mirrored in **local memory** as raw `LogPayload` (see `getLoggerMemorySnapshot` in `index.ts` / `core.ts`); the **persist** path writes `LoggerPersistEntry` objects with `level`, `timestamp`, optional `namespace`, and `parts`. Only `parts` is serialized via **`/packages/serialize`**; metadata fields are kept as plain values.
- **Storage keys** differ by origin:
  - **`inject_…`** vs **`ext_cs_…`** vs **`ext_bg_…`** (cs = content script, bg = background).
- Key shape: **`environment_YYMMDDHHmm_uuid`** where **`uuid`** is **4 hex characters**, generated once per runtime for that environment (not restored after tab close). For **`ext_cs`**, the uuid is **created when the top-frame script runs** and shared by all content-script instances in the same tab: same-origin frames read a **`data-apades-logger-ext-cs`** attribute on the top `documentElement`; cross-origin iframes request it from top via **`PostMessageEvent.loggerExtCsUuid_req` / `loggerExtCsUuid_resp`** (`/src/utils/windowMessages.ts`). **`ext_bg`** / **`inject`** uuids are in-memory in that extension context only.
- Stored value: an array of `LoggerPersistEntry` objects, one per log line. `parts` is the serialized message content; `level`, `timestamp`, and optional `namespace` are stored directly.
- **`globalThis.$clearLoggerLogs()`** is available from the extension logger entry and returns a Promise. It clears this runtime's memory log buffer, pending persist queues, in-session chrome-storage buffers, and persisted keys matching the logger storage-key format.
