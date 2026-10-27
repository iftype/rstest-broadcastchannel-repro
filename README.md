# rstest jsdom environment breaks Node's `BroadcastChannel`

Minimal reproduction for an rstest bug: under `testEnvironment: 'jsdom'`, Node's
`BroadcastChannel` (and `MessagePort`) throw on every message:

```
TypeError: The "event" argument must be an instance of Event. Received an instance of MessageEvent
    at BroadcastChannel.dispatchEvent (node:internal/event_target)
    at BroadcastChannel.onMessageEvent (node:internal/worker/io)
```

## Run

```sh
pnpm install
pnpm test          # one test, fails
node node-only.cjs # same bug without rstest or jsdom
```

Verified with `@rstest/core@0.12.5`, `jsdom@30.1.3` on Node 22.23.4 and 24.20.0.
`node-only.cjs` fails on Node 22.23.4, 24.20.0 and 26.12.1.

## What happens

Node's `BroadcastChannel` and `MessagePort` dispatch a `MessageEvent` created by
Node's bundled undici. That `MessageEvent` class is created lazily, the first
time any undici-backed global (`MessageEvent`, `fetch`, `Headers`, ...) is
touched, and it extends whatever `globalThis.Event` is at that moment.

rstest's jsdom environment (`installGlobal` in
`packages/core/src/runtime/worker/env/utils.ts`) replaces globals one key at a
time: save the original descriptor, then override. `Event` comes before
`MessageEvent` in its key list, so by the time it reads the `MessageEvent`
descriptor, `Event` is already jsdom's. Node's `MessageEvent` ends up extending
jsdom's `Event`, and Node's `dispatchEvent` rejects it.

`node-only.cjs` shows the same thing with ten lines and no test framework:
replace `globalThis.Event`, then use `BroadcastChannel`. Pass `touch-first` to
read `globalThis.MessageEvent` before the swap, and it works.

## Fix

Read every original descriptor first, then override. Node's `MessageEvent` is
then created while `Event` is still Node's own.
