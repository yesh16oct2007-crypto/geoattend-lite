// GeoAttend Lite server — zero dependencies. Static app + REST + Server-Sent Events for live sync.
const http = require('http'), fs = require('fs'), path = require('path');
const PORT = process.env.PORT || 3000;
const DIR = process.env.DATA_DIR || path.join(__dirname, 'data');
const FILE = path.join(DIR, 'db.json');

let DB = {};
try { DB = JSON.parse(fs.readFileSync(FILE, 'utf8')); } catch (e) {}
let timer = null;
const persist = () => {
  clearTimeout(timer);
  timer = setTimeout(() => {
    try { fs.mkdirSync(DIR, { recursive: true }); fs.writeFileSync(FILE + '.tmp', JSON.stringify(DB)); fs.renameSync(FILE + '.tmp', FILE); }
    catch (e) { console.error('persist failed', e.message); }
  }, 300);
};

const clients = new Set();
const broadcast = o => { const m = 'data: ' + JSON.stringify(o) + '\n\n'; clients.forEach(r => r.write(m)); };
const okPath = p => /^classroom\/meta(\/[A-Za-z0-9_-]{1,200}){0,2}$/.test(p);
const INDEX = path.join(__dirname, 'public', 'index.html');

http.createServer((req, res) => {
  const u = new URL(req.url, 'http://localhost');

  if (u.pathname === '/api/events') {
    res.writeHead(200, { 'Content-Type': 'text/event-stream', 'Cache-Control': 'no-cache', Connection: 'keep-alive', 'X-Accel-Buffering': 'no' });
    res.write('data: ' + JSON.stringify({ t: 'init', data: DB }) + '\n\n');
    clients.add(res);
    const hb = setInterval(() => res.write(': ping\n\n'), 20000);
    req.on('close', () => { clearInterval(hb); clients.delete(res); });
    return;
  }

  if (u.pathname.startsWith('/api/doc/')) {
    const p = decodeURIComponent(u.pathname.slice('/api/doc/'.length));
    if (!okPath(p)) { res.writeHead(400); return res.end(); }
    if (req.method === 'DELETE') {
      delete DB[p]; broadcast({ t: 'del', p }); persist(); res.writeHead(204); return res.end();
    }
    if (req.method === 'PUT' || req.method === 'PATCH') {
      let body = '';
      req.on('data', c => { body += c; if (body.length > 50000) req.destroy(); });
      req.on('end', () => {
        try {
          const d = JSON.parse(body);
          if (!d || typeof d !== 'object' || Array.isArray(d)) throw new Error('bad');
          DB[p] = req.method === 'PATCH' ? Object.assign({}, DB[p], d) : d;
          broadcast({ t: 'set', p, d: DB[p] }); persist();
          res.writeHead(200, { 'Content-Type': 'application/json' }); res.end('{}');
        } catch (e) { res.writeHead(400); res.end(); }
      });
      return;
    }
    res.writeHead(405); return res.end();
  }

  if (u.pathname === '/health') { res.writeHead(200); return res.end('ok'); }
  if (u.pathname === '/' || u.pathname === '/index.html') {
    res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
    return fs.createReadStream(INDEX).pipe(res);
  }
  res.writeHead(404); res.end('Not found');
}).listen(PORT, () => console.log('GeoAttend Lite running on port ' + PORT));
