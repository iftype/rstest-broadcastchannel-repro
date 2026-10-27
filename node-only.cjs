// node event-swap.cjs [touch-first]
// Replace the global Event the way a DOM test environment does, then use Node's BroadcastChannel.
if (process.argv[2] === 'touch-first') void globalThis.MessageEvent; // load Node's bundled undici before the swap
class FakeDomEvent { constructor(type) { this.type = type; } }
globalThis.Event = FakeDomEvent;
process.on('uncaughtException', (e) => { console.log(process.version, (process.argv[2] || 'no-touch').padEnd(12), 'FAIL:', e.message.slice(0, 85)); process.exit(0); });
const a = new BroadcastChannel('c'), b = new BroadcastChannel('c');
b.onmessage = (e) => { console.log(process.version, (process.argv[2] || 'no-touch').padEnd(12), 'ok:', e.data); a.close(); b.close(); };
a.postMessage('hi');
