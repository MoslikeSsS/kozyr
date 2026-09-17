/*
  КОЗЫРЬ — локальный сервер комнаты (без интернета)
  ─────────────────────────────────────────────────────────────
  Запуск:         node server.mjs
  Перед запуском: npm run build   (один раз, и после изменений)

  Что делает сервер:
   • раздаёт собранную игру из папки dist/
   • поднимает сигнальный сервер PeerJS на /peerjs того же порта
   • вся игра — прямой WebRTC-трафик между браузерами в вашей сети

  Игроки открывают:  http://<ваш-IP>:9000
  Хост создаёт комнату (получает 3-значный код), остальные входят
  по коду на главной странице.

  Порт 9000 — намеренно не 3000: 3000 занимает Vite в режиме
  разработки (npm run dev), и тогда сигнализация живёт здесь же,
  на 9000. Клиент сам понимает, куда стучаться.
  Свой порт:  PORT=8080 node server.mjs   (в этом режиме клиент
  ожидает игру и сигнализацию на одном порту — так и будет).
*/
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { fileURLToPath } from 'node:url';
import { PeerServer } from 'peer';

const DIST = path.join(path.dirname(fileURLToPath(import.meta.url)), 'dist');

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript',
  '.css': 'text/css',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.ico': 'image/x-icon',
  '.json': 'application/json',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.ttf': 'font/ttf',
};

function staticHandler(req, res) {
  const url = (req.url || '/').split('?')[0];
  if (url.startsWith('/peerjs')) return res.writeHead(404).end(); // этим владеет PeerServer

  let rel = decodeURIComponent(url);
  if (rel === '/') rel = '/index.html';
  let file = path.normalize(path.join(DIST, rel));
  if (!file.startsWith(DIST)) { res.writeHead(403).end('forbidden'); return; }

  try {
    if (!fs.existsSync(file) || fs.statSync(file).isDirectory()) file = path.join(DIST, 'index.html');
  } catch {
    file = path.join(DIST, 'index.html');
  }

  if (!fs.existsSync(file)) {
    res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
    res.end('Папка dist/ не найдена. Сначала выполните: npm run build');
    return;
  }
  res.writeHead(200, { 'Content-Type': MIME[path.extname(file)] || 'application/octet-stream' });
  fs.createReadStream(file).pipe(res);
}

const server = http.createServer(staticHandler);

// Сигнализация PeerJS — только знакомство браузеров, дальше всё напрямую
PeerServer({ server, path: '/peerjs', allow_discovery: false, concurrent_limit: 5000 });

function lanIPs() {
  const out = [];
  for (const list of Object.values(os.networkInterfaces())) {
    for (const n of list || []) {
      if (n.family === 'IPv4' && !n.internal) out.push(n.address);
    }
  }
  return out;
}

const PORT = Number(process.env.PORT) || 9000;

server.listen(PORT, '0.0.0.0', () => {
  console.log('');
  console.log('  ♠  КОЗЫРЬ — локальный сервер готов');
  console.log('  ─────────────────────────────────────────');
  console.log(`  Для себя:     http://localhost:${PORT}`);
  for (const ip of lanIPs()) console.log(`  Для игроков:  http://${ip}:${PORT}`);
  console.log('');
  console.log('  Раздайте ссылку «Для игроков» остальным.');
  console.log('  Вы — «Создать комнату», они — «Войти по коду».');
  console.log('');
});

server.on('error', (e) => {
  console.error(`Не удалось занять порт ${PORT}: ${e.message}`);
  console.error('Освободите порт или запустите с другим: PORT=9001 node server.mjs');
  process.exit(1);
});
