import { test, expect } from '@rstest/core';
import { BroadcastChannel } from 'node:worker_threads';

test('Node BroadcastChannel delivers a message under the jsdom environment', async () => {
  const a = new BroadcastChannel('repro');
  const b = new BroadcastChannel('repro');
  const received = new Promise<unknown>((resolve) => {
    b.onmessage = (event: MessageEvent) => resolve(event.data);
  });
  a.postMessage('hi');
  await expect(received).resolves.toBe('hi');
  a.close();
  b.close();
});
