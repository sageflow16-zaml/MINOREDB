import http from 'node:http';
import fs from 'node:fs';

const BASE = process.env.LT_BASE || 'http://localhost:4173';
const DURATION_MS = 10_000;
const LEVELS = [10, 50, 100];
const ASSETS = JSON.parse(process.env.LT_ASSETS || 'null');

function pickAssets() {
  if (ASSETS) return ASSETS.map((a) => ({ url: a, weight: 1 }));
  const html = fs.readFileSync('dist/index.html', 'utf8');
  const js = (html.match(/\/assets\/[^"]+\.js/g) || []).slice(0, 4);
  const css = html.match(/\/assets\/[^"]+\.css/g) || [];
  return [
    { url: '/', weight: 3 },
    ...js.map((u) => ({ url: u, weight: 1 })),
    ...css.map((u) => ({ url: u, weight: 1 })),
  ];
}

const targets = pickAssets();
const totalWeight = targets.reduce((a, t) => a + t.weight, 0);
const pool = new http.Agent({ keepAlive: true, maxSockets: 64 });

function run(concurrency) {
  return new Promise((resolve) => {
    const latencies = [];
    let ok = 0;
    let err = 0;
    let inflight = 0;
    let draining = false;
    const start = Date.now();
    let stop = false;
    const deadline = start + DURATION_MS;

    function pickTarget() {
      let r = Math.random() * totalWeight;
      for (const t of targets) {
        r -= t.weight;
        if (r <= 0) return t;
      }
      return targets[0];
    }

    function fire() {
      if (stop || draining) return;
      const t = pickTarget();
      const t0 = Date.now();
      const req = http.get(BASE + t.url, { agent: pool }, (res) => {
        res.resume();
        res.on('end', () => {
          latencies.push(Date.now() - t0);
          if (res.statusCode < 400) ok++;
          else err++;
          inflight--;
          if (!stop) setImmediate(fire);
        });
      });
      req.on('error', () => {
        latencies.push(Date.now() - t0);
        err++;
        inflight--;
        if (!stop) setImmediate(fire);
      });
      inflight++;
    }

    for (let i = 0; i < concurrency; i++) fire();

    const timer = setInterval(() => {
      if (Date.now() >= deadline) draining = true;
      if (draining && (inflight === 0 || Date.now() > deadline + 5000)) {
        stop = true;
        clearInterval(timer);
        latencies.sort((a, b) => a - b);
        const p = (q) => latencies[Math.min(latencies.length - 1, Math.floor((q / 100) * latencies.length))] || 0;
        const total = ok + err;
        resolve({
          concurrency,
          requests: total,
          rps: Math.round((total / DURATION_MS) * 1000),
          p50: p(50),
          p95: p(95),
          p99: p(99),
          ok,
          err,
          targets: targets.map((t) => t.url),
        });
      }
    }, 200);
  });
}

const out = [];
for (const lvl of LEVELS) {
  console.log(`== level ${lvl} ==`);
  const r = await run(lvl);
  console.log(JSON.stringify(r));
  out.push(r);
}
fs.writeFileSync('e2e/loadtest-results.json', JSON.stringify(out, null, 2));
console.log('saved e2e/loadtest-results.json');
