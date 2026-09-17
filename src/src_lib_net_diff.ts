--- src/lib/net.ts (原始)
import Peer from 'peerjs';
import type { DataConnection, PeerOptions } from 'peerjs';
import type { Msg } from './types';

const PREFIX = 'kozyr-room-';

export function randomCode(): string {
  return String(100 + Math.floor(Math.random() * 900));
}

/**
 * Конфигурация сигнализации:
 * - Локальный сервер (node server.mjs): host=локальный IP, port=9000
 * - GitHub Pages / статический хостинг: публичный PeerJS-сервер
 */
function signalingConfig(): PeerOptions {
  const loc = window.location;
  const port = Number(loc.port) || (loc.protocol === 'https:' ? 443 : 80);

  // Если на localhost:3000 — режим разработки с локальным сервером
  if (loc.hostname === 'localhost' && port === 3000) {
    return { host: 'localhost', port: 9000, path: '/peerjs' };
  }

  // Если на кастомном порту (например, 9000) — локальный сервер
  if (port === 9000 || port === 8080) {
    return {
      host: loc.hostname || 'localhost',
      port,
      path: '/peerjs',
      secure: loc.protocol === 'https:',
    };
  }

  // GitHub Pages или другой статический хостинг — публичный PeerJS
  return {
    host: '0.peerjs.com',
    port: 443,
    path: '/peerjs',
    secure: true,
  };
}

const NET_ERR = 'Не удалось подключиться к серверу комнаты. Проверьте интернет или запустите локальный сервер: node server.mjs';

/* ---------- Хост комнаты ---------- */
export class HostNet {
  private peer: Peer | null = null;
  private conns = new Map<string, DataConnection>();
  code: string;

  constructor(
    code: string,
    private cb: {
      onReady: (code: string) => void;
      onJoin: (connId: string) => void;
      onData: (connId: string, data: Msg) => void;
      onLeave: (connId: string) => void;
      onError: (msg: string) => void;
    },
  ) {
    this.code = code;
    this.init(code, 0);
  }

  private init(code: string, tries: number) {
    const peer = new Peer(PREFIX + code, signalingConfig());
    this.peer = peer;
    peer.on('open', () => {
      this.code = code;
      this.cb.onReady(code);
    });
    peer.on('connection', (conn) => {
      conn.on('open', () => {
        this.conns.set(conn.peer, conn);
        this.cb.onJoin(conn.peer);
      });
      conn.on('data', (d) => this.cb.onData(conn.peer, d as Msg));
      conn.on('close', () => {
        if (this.conns.has(conn.peer)) {
          this.conns.delete(conn.peer);
          this.cb.onLeave(conn.peer);
        }
      });
      conn.on('error', () => {});
    });
    peer.on('error', (e: any) => {
      const type = e?.type || '';
      if (type === 'unavailable-id' && tries < 6) {
        try { peer.destroy(); } catch { /* noop */ }
        this.conns.clear();
        this.init(randomCode(), tries + 1);
      } else if (type === 'peer-unavailable') {
        // гость не найден — игнорируем
      } else if (type === 'network' || type === 'socket-error' || type === 'socket-closed' || type === 'browser-incompatible') {
        this.cb.onError(NET_ERR);
      } else if (type !== 'disconnected') {
        this.cb.onError('Сеть: ' + type);
      }
    });
    peer.on('disconnected', () => {
      try { peer.reconnect(); } catch { /* noop */ }
    });
  }

  send(connId: string, msg: Msg) {
    const c = this.conns.get(connId);
    if (c && c.open) {
      try { c.send(msg); } catch { /* noop */ }
    }
  }

  broadcast(msg: Msg) {
    for (const c of this.conns.values()) {
      if (c.open) {
        try { c.send(msg); } catch { /* noop */ }
      }
    }
  }

  kick(connId: string) {
    const c = this.conns.get(connId);
    if (c) {
      try { c.send({ t: 'kicked' }); } catch { /* noop */ }
      setTimeout(() => { try { c.close(); } catch { /* noop */ } }, 150);
    }
  }

  close() {
    try { this.peer?.destroy(); } catch { /* noop */ }
    this.conns.clear();
  }
}

/* ---------- Гость ---------- */
export class GuestNet {
  private peer: Peer;
  private conn: DataConnection | null = null;
  private timeout: ReturnType<typeof setTimeout> | null = null;

  constructor(
    code: string,
    name: string,
    private cb: {
      onConnected: () => void;
      onData: (data: Msg) => void;
      onClose: (kicked: boolean) => void;
      onError: (msg: string) => void;
    },
  ) {
    this.peer = new Peer(signalingConfig());

    // Таймаут подключения — 10 секунд
    this.timeout = setTimeout(() => {
      if (!this.conn) {
        this.cb.onError('Таймаут подключения. Проверьте интернет или попробуйте позже.');
        this.close();
      }
    }, 10000);

    this.peer.on('open', () => {
      const conn = this.peer.connect(PREFIX + code, { reliable: true });
      this.conn = conn;
      conn.on('open', () => {
        if (this.timeout) clearTimeout(this.timeout);
        conn.send({ t: 'hello', name });
        this.cb.onConnected();
      });
      conn.on('data', (d) => {
        const msg = d as Msg;
        if (msg.t === 'kicked') {
          this.cb.onClose(true);
          return;
        }
        this.cb.onData(msg);
      });
      conn.on('close', () => this.cb.onClose(false));
      conn.on('error', () => this.cb.onError('Ошибка соединения'));
    });
    this.peer.on('error', (e: any) => {
      const type = e?.type || '';
      if (type === 'peer-unavailable') {
        this.cb.onError('Комната с таким кодом не найдена. Проверьте код и убедитесь, что хост создал комнату.');
      } else if (type === 'network' || type === 'socket-error' || type === 'socket-closed') {
        this.cb.onError('Не удалось подключиться к серверу. Проверьте интернет или попробуйте позже.');
      } else if (type === 'browser-incompatible') {
        this.cb.onError('Ваш браузер не поддерживает WebRTC. Попробуйте Chrome, Firefox или Edge.');
      } else if (type !== 'disconnected') {
        this.cb.onError('Ошибка сети: ' + type);
      }
    });
    this.peer.on('disconnected', () => {
      try { this.peer.reconnect(); } catch { /* noop */ }
    });
  }

  send(msg: Msg) {
    if (this.conn && this.conn.open) {
      try { this.conn.send(msg); } catch { /* noop */ }
    }
  }

  close() {
    if (this.timeout) clearTimeout(this.timeout);
    try { this.conn?.close(); } catch { /* noop */ }
    try { this.peer.destroy(); } catch { /* noop */ }
  }
}


+++ src/lib/net.ts (修改后)
import Peer from 'peerjs';
import type { DataConnection, PeerOptions } from 'peerjs';
import type { Msg } from './types';

const PREFIX = 'kozyr-room-';

export function randomCode(): string {
  return String(100 + Math.floor(Math.random() * 900));
}

/**
 * Конфигурация сигнализации:
 * - Локальный сервер (node server.mjs): host=локальный IP, port=9000
 * - GitHub Pages / статический хостинг: публичный PeerJS-сервер
 */
function signalingConfig(): PeerOptions {
  const loc = window.location;
  const port = Number(loc.port) || (loc.protocol === 'https:' ? 443 : 80);

  // Если на localhost:3000 — режим разработки с локальным сервером
  if (loc.hostname === 'localhost' && port === 3000) {
    return { host: 'localhost', port: 9000, path: '/peerjs' };
  }

  // Если на кастомном порту (например, 9000) — локальный сервер
  if (port === 9000 || port === 8080) {
    return {
      host: loc.hostname || 'localhost',
      port,
      path: '/peerjs',
      secure: loc.protocol === 'https:',
    };
  }

  // GitHub Pages или другой статический хостинг — публичный PeerJS
  // Пробуем основной сервер, если не работает — используем альтернативный
  return {
    host: '0.peerjs.com',
    port: 443,
    path: '/peerjs',
    secure: true,
    config: {
      iceServers: [
        { urls: 'stun:stun.l.google.com:19302' },
        { urls: 'stun:stun1.l.google.com:19302' },
        { urls: 'stun:stun2.l.google.com:19302' },
        { urls: 'stun:stun3.l.google.com:19302' },
        { urls: 'stun:stun4.l.google.com:19302' },
      ],
    },
  };
}

const NET_ERR = 'Не удалось подключиться к серверу комнаты. Возможные причины:\n• Нет интернета\n• Публичный PeerJS-сервер временно недоступен\n• Брандмауэр блокирует WebSocket\n\nПопробуйте:\n1. Проверить интернет-соединение\n2. Обновить страницу (F5)\n3. Подождать 1-2 минуты и попробовать снова\n4. Если не работает — запустить локальный сервер: node server.mjs';

// Альтернативный PeerJS-сервер (fallback)
function fallbackConfig(): PeerOptions {
  return {
    host: 'peerjs-server.herokuapp.com',
    port: 443,
    path: '/',
    secure: true,
    config: {
      iceServers: [
        { urls: 'stun:stun.l.google.com:19302' },
        { urls: 'stun:stun1.l.google.com:19302' },
        { urls: 'stun:stun2.l.google.com:19302' },
        { urls: 'stun:stun3.l.google.com:19302' },
        { urls: 'stun:stun4.l.google.com:19302' },
      ],
    },
  };
}

/* ---------- Хост комнаты ---------- */
export class HostNet {
  private peer: Peer | null = null;
  private conns = new Map<string, DataConnection>();
  code: string;
  private useFallback = false;
  private connectTimeout: ReturnType<typeof setTimeout> | null = null;

  constructor(
    code: string,
    private cb: {
      onReady: (code: string) => void;
      onJoin: (connId: string) => void;
      onData: (connId: string, data: Msg) => void;
      onLeave: (connId: string) => void;
      onError: (msg: string) => void;
    },
  ) {
    this.code = code;
    this.init(code, 0);
  }

  private init(code: string, tries: number) {
    const config = this.useFallback ? fallbackConfig() : signalingConfig();
    const peer = new Peer(PREFIX + code, config);
    this.peer = peer;

    // Таймаут подключения — 15 секунд
    this.connectTimeout = setTimeout(() => {
      if (!this.useFallback) {
        console.warn('PeerJS: основной сервер недоступен, переключаюсь на fallback...');
        this.useFallback = true;
        try { peer.destroy(); } catch { /* noop */ }
        this.init(code, tries);
      } else {
        this.cb.onError(NET_ERR);
      }
    }, 15000);
    peer.on('open', () => {
      if (this.connectTimeout) clearTimeout(this.connectTimeout);
      this.code = code;
      this.cb.onReady(code);
    });
    peer.on('connection', (conn) => {
      conn.on('open', () => {
        this.conns.set(conn.peer, conn);
        this.cb.onJoin(conn.peer);
      });
      conn.on('data', (d) => this.cb.onData(conn.peer, d as Msg));
      conn.on('close', () => {
        if (this.conns.has(conn.peer)) {
          this.conns.delete(conn.peer);
          this.cb.onLeave(conn.peer);
        }
      });
      conn.on('error', () => {});
    });
    peer.on('error', (e: any) => {
      const type = e?.type || '';
      if (type === 'unavailable-id' && tries < 6) {
        try { peer.destroy(); } catch { /* noop */ }
        this.conns.clear();
        this.init(randomCode(), tries + 1);
      } else if (type === 'peer-unavailable') {
        // гость не найден — игнорируем
      } else if (type === 'network' || type === 'socket-error' || type === 'socket-closed') {
        if (!this.useFallback) {
          console.warn('PeerJS: ошибка сети, переключаюсь на fallback-сервер...');
          this.useFallback = true;
          if (this.connectTimeout) clearTimeout(this.connectTimeout);
          try { peer.destroy(); } catch { /* noop */ }
          this.init(code, tries);
        } else {
          if (this.connectTimeout) clearTimeout(this.connectTimeout);
          this.cb.onError(NET_ERR);
        }
      } else if (type === 'browser-incompatible') {
        if (this.connectTimeout) clearTimeout(this.connectTimeout);
        this.cb.onError('Ваш браузер не поддерживает WebRTC. Попробуйте Chrome, Firefox или Edge.');
      } else if (type !== 'disconnected') {
        if (this.connectTimeout) clearTimeout(this.connectTimeout);
        this.cb.onError('Сеть: ' + type);
      }
    });
    peer.on('disconnected', () => {
      try { peer.reconnect(); } catch { /* noop */ }
    });
  }

  send(connId: string, msg: Msg) {
    const c = this.conns.get(connId);
    if (c && c.open) {
      try { c.send(msg); } catch { /* noop */ }
    }
  }

  broadcast(msg: Msg) {
    for (const c of this.conns.values()) {
      if (c.open) {
        try { c.send(msg); } catch { /* noop */ }
      }
    }
  }

  kick(connId: string) {
    const c = this.conns.get(connId);
    if (c) {
      try { c.send({ t: 'kicked' }); } catch { /* noop */ }
      setTimeout(() => { try { c.close(); } catch { /* noop */ } }, 150);
    }
  }

  close() {
    if (this.connectTimeout) clearTimeout(this.connectTimeout);
    try { this.peer?.destroy(); } catch { /* noop */ }
    this.conns.clear();
  }
}

/* ---------- Гость ---------- */
export class GuestNet {
  private peer: Peer;
  private conn: DataConnection | null = null;
  private timeout: ReturnType<typeof setTimeout> | null = null;
  private useFallback = false;
  private code: string;
  private name: string;

  constructor(
    code: string,
    name: string,
    private cb: {
      onConnected: () => void;
      onData: (data: Msg) => void;
      onClose: (kicked: boolean) => void;
      onError: (msg: string) => void;
    },
  ) {
    this.code = code;
    this.name = name;
    this.peer = new Peer(signalingConfig());

    // Таймаут подключения — 15 секунд
    this.timeout = setTimeout(() => {
      if (!this.conn) {
        if (!this.useFallback) {
          console.warn('GuestNet: таймаут, переключаюсь на fallback-сервер...');
          this.useFallback = true;
          try { this.peer.destroy(); } catch { /* noop */ }
          this.reconnect();
        } else {
          this.cb.onError('Таймаут подключения. Проверьте интернет или попробуйте позже.');
          this.close();
        }
      }
    }, 15000);

    this.peer.on('open', () => {
      const conn = this.peer.connect(PREFIX + code, { reliable: true });
      this.conn = conn;
      conn.on('open', () => {
        if (this.timeout) clearTimeout(this.timeout);
        conn.send({ t: 'hello', name });
        this.cb.onConnected();
      });
      conn.on('data', (d) => {
        const msg = d as Msg;
        if (msg.t === 'kicked') {
          this.cb.onClose(true);
          return;
        }
        this.cb.onData(msg);
      });
      conn.on('close', () => this.cb.onClose(false));
      conn.on('error', () => this.cb.onError('Ошибка соединения'));
    });
    this.peer.on('error', (e: any) => {
      const type = e?.type || '';
      if (type === 'peer-unavailable') {
        if (this.timeout) clearTimeout(this.timeout);
        this.cb.onError('Комната с таким кодом не найдена. Проверьте код и убедитесь, что хост создал комнату.');
      } else if (type === 'network' || type === 'socket-error' || type === 'socket-closed') {
        if (!this.useFallback) {
          console.warn('GuestNet: ошибка сети, переключаюсь на fallback-сервер...');
          this.useFallback = true;
          if (this.timeout) clearTimeout(this.timeout);
          try { this.peer.destroy(); } catch { /* noop */ }
          this.reconnect();
        } else {
          if (this.timeout) clearTimeout(this.timeout);
          this.cb.onError('Не удалось подключиться к серверу. Проверьте интернет или попробуйте позже.');
        }
      } else if (type === 'browser-incompatible') {
        if (this.timeout) clearTimeout(this.timeout);
        this.cb.onError('Ваш браузер не поддерживает WebRTC. Попробуйте Chrome, Firefox или Edge.');
      } else if (type !== 'disconnected') {
        if (this.timeout) clearTimeout(this.timeout);
        this.cb.onError('Ошибка сети: ' + type);
      }
    });
    this.peer.on('disconnected', () => {
      try { this.peer.reconnect(); } catch { /* noop */ }
    });
  }

  private reconnect() {
    const config = this.useFallback ? fallbackConfig() : signalingConfig();
    this.peer = new Peer(config);

    this.timeout = setTimeout(() => {
      if (!this.conn) {
        this.cb.onError('Таймаут подключения. Проверьте интернет или попробуйте позже.');
        this.close();
      }
    }, 15000);

    this.peer.on('open', () => {
      const conn = this.peer.connect(PREFIX + this.code, { reliable: true });
      this.conn = conn;
      conn.on('open', () => {
        if (this.timeout) clearTimeout(this.timeout);
        conn.send({ t: 'hello', name: this.name });
        this.cb.onConnected();
      });
      conn.on('data', (d) => {
        const msg = d as Msg;
        if (msg.t === 'kicked') {
          this.cb.onClose(true);
          return;
        }
        this.cb.onData(msg);
      });
      conn.on('close', () => this.cb.onClose(false));
      conn.on('error', () => this.cb.onError('Ошибка соединения'));
    });
    this.peer.on('error', (e: any) => {
      const type = e?.type || '';
      if (type === 'peer-unavailable') {
        if (this.timeout) clearTimeout(this.timeout);
        this.cb.onError('Комната с таким кодом не найдена. Проверьте код и убедитесь, что хост создал комнату.');
      } else if (type === 'network' || type === 'socket-error' || type === 'socket-closed') {
        if (this.timeout) clearTimeout(this.timeout);
        this.cb.onError('Не удалось подключиться к серверу. Проверьте интернет или попробуйте позже.');
      } else if (type === 'browser-incompatible') {
        if (this.timeout) clearTimeout(this.timeout);
        this.cb.onError('Ваш браузер не поддерживает WebRTC. Попробуйте Chrome, Firefox или Edge.');
      } else if (type !== 'disconnected') {
        if (this.timeout) clearTimeout(this.timeout);
        this.cb.onError('Ошибка сети: ' + type);
      }
    });
    this.peer.on('disconnected', () => {
      try { this.peer.reconnect(); } catch { /* noop */ }
    });
  }

  send(msg: Msg) {
    if (this.conn && this.conn.open) {
      try { this.conn.send(msg); } catch { /* noop */ }
    }
  }

  close() {
    if (this.timeout) clearTimeout(this.timeout);
    try { this.conn?.close(); } catch { /* noop */ }
    try { this.peer.destroy(); } catch { /* noop */ }
  }
}
