import { useEffect, useRef, useState } from 'react';
import type { AdminCmd, ChatLine, DurakMode, LobbyInfo, View } from '../lib/types';
import type { SessionHandle } from '../lib/host';
import PokerTable from './PokerTable';
import DurakTable from './DurakTable';
import AdminPanel from './AdminPanel';
import { Btn, CodeBig, Panel, Seg } from '../components/Shared';
import {
  SuitIcon, IconCopy, IconGear, IconFlag, IconUsers, IconSoundOn, IconSoundOff,
  IconBot, IconCrown, IconSend, IconCards,
} from '../components/Icons';
import { play } from '../lib/sound';

const AVATARS = ['#e3a93c', '#46ab77', '#e5484d', '#8fb7ff', '#d179d6', '#7fd6d2'];
const avatarColor = (id: string) => {
  let h = 0;
  for (const ch of id) h = (h * 31 + ch.charCodeAt(0)) >>> 0;
  return AVATARS[h % AVATARS.length];
};

export default function Room({
  session, view, lobby, chat, onChat, onAdmin, onLeave, shake, sound, onToggleSound,
}: {
  session: SessionHandle;
  view: View | null;
  lobby: LobbyInfo | null;
  chat: ChatLine[];
  onChat: (text: string) => void;
  onAdmin: (cmd: AdminCmd) => void;
  onLeave: () => void;
  shake: number;
  sound: boolean;
  onToggleSound: () => void;
}) {
  const [adminOpen, setAdminOpen] = useState(false);
  const [chatOpen, setChatOpen] = useState(false);
  const [chatText, setChatText] = useState('');
  const [copied, setCopied] = useState(false);
  const [unread, setUnread] = useState(0);
  const listRef = useRef<HTMLDivElement>(null);
  const prevLen = useRef(0);

  useEffect(() => {
    if (chat.length > prevLen.current) {
      if (chatOpen && listRef.current) listRef.current.scrollTop = listRef.current.scrollHeight;
      else setUnread((u) => u + (chat.length - prevLen.current));
    }
    prevLen.current = chat.length;
  }, [chat, chatOpen]);

  useEffect(() => {
    if (chatOpen) {
      setUnread(0);
      setTimeout(() => { if (listRef.current) listRef.current.scrollTop = listRef.current.scrollHeight; }, 30);
    }
  }, [chatOpen]);

  if (!lobby) {
    return (
      <div className="h-full grid place-items-center relative z-10">
        <div className="flex flex-col items-center gap-4 fade-in">
          <div className="w-14 h-14 grid place-items-center rounded-2xl bg-gold-500/15 border border-gold-500/30">
            <SuitIcon s={0} className="w-7 h-7 text-gold-300 animate-pulse" />
          </div>
          <div className="font-display font-bold text-gold-200 tracking-wide">Подключение к комнате…</div>
          <div className="text-[12px] text-cream/45">Стучимся по коду. Если не выйдет — проверьте цифры.</div>
          <Btn tone="ghost" onClick={onLeave}>Отмена</Btn>
        </div>
      </div>
    );
  }

  const inGame = lobby.started && view && view.phase !== 'lobby';
  const copy = () => {
    navigator.clipboard?.writeText(lobby.code).catch(() => {});
    setCopied(true);
    play('click');
    setTimeout(() => setCopied(false), 1400);
  };
  const sendChat = () => {
    if (!chatText.trim()) return;
    onChat(chatText);
    setChatText('');
    play('click');
  };

  return (
    <div className="h-full flex flex-col relative z-10">
      {/* шапка */}
      <header className="h-14 shrink-0 flex items-center gap-3 px-4 border-b border-white/8 bg-felt-950/70 backdrop-blur-sm z-30">
        <span className="w-8 h-8 grid place-items-center bg-gradient-to-b from-gold-300 to-gold-600 rounded-lg">
          <SuitIcon s={0} className="w-4.5 h-4.5 text-felt-950" />
        </span>
        <span className="font-display font-black text-lg text-cream tracking-wide hidden sm:block">КОЗЫРЬ</span>
        <span className="w-px h-7 bg-white/10 hidden sm:block" />
        {lobby.code === '---' ? (
          <span className="flex items-center gap-2 bg-felt-900/80 border border-felt-500/40 rounded-lg px-3 py-1.5">
            <span className="text-[9px] font-display font-bold uppercase tracking-widest text-cream/45">стол</span>
            <span className="font-display font-black text-sm text-felt-400 tracking-wider leading-none">ЛОКАЛЬНО · БОТЫ</span>
          </span>
        ) : (
          <button onClick={copy} title="Скопировать код" className="flex items-center gap-2 bg-felt-900/80 border border-gold-500/30 rounded-lg pl-3 pr-2 py-1.5 hover:border-gold-400/60 transition-colors">
            <span className="text-[9px] font-display font-bold uppercase tracking-widest text-cream/45">комната</span>
            <span className="font-display font-black text-xl text-gold-300 tracking-[0.25em] leading-none">{lobby.code}</span>
            <IconCopy className={`w-4 h-4 ${copied ? 'text-felt-400' : 'text-cream/40'}`} />
          </button>
        )}
        <span className="text-[10px] font-display font-bold uppercase tracking-widest bg-white/6 border border-white/10 rounded-full px-2.5 py-1 text-cream/60 hidden md:block">
          {lobby.game === 'poker' ? `Покер · ${lobby.sb}/${lobby.bb}` : `Дурак · ${lobby.mode === 'transfer' ? 'переводной' : 'подкидной'}`}
        </span>
        <div className="flex-1" />
        <span className="flex items-center gap-1.5 text-[12px] text-cream/60">
          <IconUsers className="w-4 h-4 text-gold-400" /> {lobby.seats.length}/{lobby.maxSeats}
        </span>
        <button onClick={onToggleSound} className="p-2 rounded-lg hover:bg-white/8 text-cream/60 hover:text-cream transition-colors" title="Звук">
          {sound ? <IconSoundOn className="w-5 h-5" /> : <IconSoundOff className="w-5 h-5" />}
        </button>
        {session.isHost && (
          <button
            onClick={() => { setAdminOpen(true); play('click'); }}
            className="flex items-center gap-1.5 text-[11px] font-display font-bold uppercase tracking-wider bg-gold-500/15 border border-gold-500/40 text-gold-300 rounded-lg px-3 py-2 hover:bg-gold-500/25 transition-colors"
          >
            <IconGear className="w-4 h-4" /> Админ
          </button>
        )}
        <button onClick={onLeave} className="p-2 rounded-lg hover:bg-hotred/15 text-cream/60 hover:text-hotred transition-colors" title="Выйти из комнаты">
          <IconFlag className="w-5 h-5" />
        </button>
      </header>

      {/* игровая зона */}
      <main className="flex-1 min-h-0 relative">
        <div key={shake} className={`h-full ${shake > 0 ? 'anim-shake' : ''}`}>
          {!inGame ? (
            <LobbyView lobby={lobby} isHost={session.isHost} onAdmin={onAdmin} />
          ) : view!.game === 'poker' ? (
            <PokerTable view={view as any} onAction={(a, _c, v) => session.action(a, undefined, v)} isHost={session.isHost} onAdmin={onAdmin} />
          ) : (
            <DurakTable view={view as any} onAction={(a, c) => session.action(a, c)} isHost={session.isHost} onAdmin={onAdmin} />
          )}
        </div>
      </main>

      {/* чат */}
      <div className="absolute bottom-4 right-4 z-40 flex flex-col items-end gap-2">
        {chatOpen && (
          <div className="w-[290px] bg-felt-950/92 border border-white/12 rounded-xl shadow-2xl backdrop-blur-sm overflow-hidden anim-rise">
            <div className="flex items-center justify-between px-3.5 py-2.5 border-b border-white/8">
              <span className="font-display text-[11px] font-bold uppercase tracking-widest text-gold-400">Чат стола</span>
              <button onClick={() => setChatOpen(false)} className="text-cream/40 hover:text-cream text-[16px] leading-none">×</button>
            </div>
            <div ref={listRef} className="h-44 overflow-y-auto scroll-thin px-3.5 py-2.5 flex flex-col gap-1.5">
              {chat.length === 0 && <div className="text-[12px] text-cream/30">Тишина за столом…</div>}
              {chat.map((m) => (
                <div key={m.id} className="text-[12.5px] leading-snug">
                  <b className={m.mine ? 'text-gold-300' : 'text-felt-400'}>{m.mine ? 'Вы' : m.from}:</b>{' '}
                  <span className="text-cream/80">{m.text}</span>
                </div>
              ))}
            </div>
            <div className="flex gap-1.5 p-2 border-t border-white/8">
              <input
                value={chatText}
                onChange={(e) => setChatText(e.target.value.slice(0, 140))}
                onKeyDown={(e) => e.key === 'Enter' && sendChat()}
                placeholder="Сообщение…"
                className="flex-1 bg-black/40 border border-white/10 rounded-lg px-3 py-1.5 text-[13px] outline-none focus:border-gold-500/50"
              />
              <button onClick={sendChat} className="p-2 rounded-lg bg-gold-500/20 text-gold-300 hover:bg-gold-500/35 transition-colors">
                <IconSend className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
        <button
          onClick={() => setChatOpen((v) => !v)}
          className="relative w-12 h-12 rounded-full bg-gradient-to-b from-gold-300 to-gold-600 text-felt-950 grid place-items-center shadow-[0_8px_26px_rgba(227,169,60,0.45)] hover:brightness-110 active:translate-y-[2px] transition-all"
          title="Чат"
        >
          <IconSend className="w-5 h-5" />
          {unread > 0 && !chatOpen && (
            <span className="absolute -top-1 -right-1 min-w-5 h-5 px-1 rounded-full bg-hotred text-white text-[10px] font-bold grid place-items-center anim-pop">
              {unread}
            </span>
          )}
        </button>
      </div>

      {session.isHost && (
        <AdminPanel
          open={adminOpen}
          onClose={() => setAdminOpen(false)}
          lobby={lobby}
          view={view}
          onAdmin={onAdmin}
          onLeave={onLeave}
        />
      )}
    </div>
  );
}

/* ---------- лобби ---------- */
function LobbyView({ lobby, isHost, onAdmin }: {
  lobby: LobbyInfo;
  isHost: boolean;
  onAdmin: (cmd: AdminCmd) => void;
}) {
  const empty = Array.from({ length: Math.max(0, lobby.maxSeats - lobby.seats.length) });
  return (
    <div className="h-full overflow-y-auto scroll-thin">
      <div className="max-w-4xl mx-auto px-5 py-8 flex flex-col gap-6">
        <div className="grid md:grid-cols-[1fr_1.2fr] gap-6 items-start">
          {/* код */}
          <Panel title="Код комнаты">
            <CodeBig code={lobby.code} />
            <p className="mt-3 text-[12.5px] text-cream/55 leading-relaxed text-center">
              Пусть игроки в вашей локальной сети откроют «КОЗЫРЬ» и введут эти три цифры — «Войти в комнату».
            </p>
            <div className="mt-3 flex items-center justify-center gap-2 text-[11px] text-cream/40">
              <span className={`w-2 h-2 rounded-full ${lobby.seats.length > 1 ? 'bg-felt-400' : 'bg-gold-400'} animate-pulse`} />
              {lobby.seats.length > 1 ? 'Компания собирается' : 'Пока только вы'}
            </div>
          </Panel>

          {/* места */}
          <Panel
            title={`Стол · ${lobby.seats.length}/${lobby.maxSeats}`}
            right={isHost ? (
              <button
                onClick={() => { play('join'); onAdmin({ cmd: 'addBot' }); }}
                className="flex items-center gap-1.5 text-[11px] font-bold text-felt-400 hover:text-felt-300 transition-colors"
              >
                <IconBot className="w-4 h-4" /> Бот
              </button>
            ) : undefined}
          >
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
              {lobby.seats.map((s) => (
                <div key={s.id} className="flex items-center gap-2.5 bg-felt-950/60 border border-white/8 rounded-xl px-3 py-2.5">
                  <span
                    className="w-9 h-9 rounded-full grid place-items-center font-display font-black text-felt-950 text-sm shrink-0"
                    style={{ background: avatarColor(s.id) }}
                  >
                    {s.name[0]?.toUpperCase() ?? '?'}
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="text-[13px] font-bold truncate flex items-center gap-1">
                      {s.name}
                      {s.isHost && <IconCrown className="w-3.5 h-3.5 text-gold-400 shrink-0" />}
                    </div>
                    <div className="text-[10px] uppercase tracking-wider font-bold">
                      {s.bot ? <span className="text-felt-400">бот</span> : s.connected ? <span className="text-gold-400/80">за столом</span> : <span className="text-hotred">оффлайн</span>}
                    </div>
                  </div>
                </div>
              ))}
              {empty.map((_, i) => (
                <div key={'e' + i} className="h-[58px] rounded-xl border-2 border-dashed border-white/8 grid place-items-center text-[10px] uppercase tracking-widest text-cream/25 font-display font-bold">
                  свободно
                </div>
              ))}
            </div>
          </Panel>
        </div>

        {/* управление хоста */}
        <div className="flex flex-wrap items-center gap-3">
          {isHost ? (
            <>
              <Btn tone="gold" size="lg" disabled={lobby.seats.length < 2} onClick={() => { play('shuffle'); onAdmin({ cmd: 'start' }); }}>
                <IconCards className="w-5 h-5" /> Начать игру
              </Btn>
              {lobby.game === 'durak' && (
                <Seg<DurakMode>
                  value={lobby.mode}
                  onChange={(v) => { play('click'); onAdmin({ cmd: 'setMode', v }); }}
                  options={[
                    { v: 'classic', label: 'Подкидной' },
                    { v: 'transfer', label: 'Переводной' },
                  ]}
                />
              )}
              <span className="text-[12px] text-cream/45">
                {lobby.seats.length < 2 ? 'Нужен второй игрок — бот или друг по коду' : `Играем: ${lobby.game === 'poker' ? `холдем, блайнды ${lobby.sb}/${lobby.bb}` : lobby.mode === 'transfer' ? 'переводной дурак, 36 карт' : 'подкидной дурак, 36 карт'}`}
              </span>
            </>
          ) : (
            <div className="flex items-center gap-3 text-[13px] text-cream/55">
              <span className="w-2.5 h-2.5 rounded-full bg-gold-400 animate-pulse" />
              Ждём, пока хост начнёт игру…
            </div>
          )}
        </div>

        {/* правила и управление */}
        <div className="grid md:grid-cols-2 gap-4 pb-6">
          <Panel title={lobby.game === 'poker' ? 'Правила · Техасский холдем' : 'Правила · Дурак'}>
            {lobby.game === 'poker' ? (
              <ul className="text-[12.5px] text-cream/60 space-y-1.5 leading-relaxed list-none">
                <li>• Каждому — по 2 карты втёмную, на стол — 5 общих (флоп, тёрн, ривер).</li>
                <li>• Торги: фолд / чек / колл / рейз. Блайнды {lobby.sb}/{lobby.bb}, стартовые фишки — 1000.</li>
                <li>• Справа за столом — живой справочник комбинаций: подсвечивает вашу текущую руку.</li>
                <li>• На ход 25 секунд, дальше — авто-чек или авто-фолд.</li>
              </ul>
            ) : (
              <ul className="text-[12.5px] text-cream/60 space-y-1.5 leading-relaxed list-none">
                <li>• 36 карт, козырь лежит под колодой. Бьют старшей той же масти или любым козырем.</li>
                <li>• Подкидывать можно карты рангов, уже лежащих на столе (первый кон — до 5 карт).</li>
                {lobby.mode === 'transfer'
                  ? <li>• Переводной: отбейте той же картой ранга — и атака уйдёт следующему.</li>
                  : <li>• Подкидной: отбиться нужно от каждой карты, иначе — берёте всё.</li>}
                <li>• Подсказки: <b className="text-hotred">красное свечение</b> — чем бить, <b className="text-warnyellow">жёлтое</b> — чем перевести, <b className="text-felt-400">зелёное</b> — что можно подкинуть.</li>
                <li>• Кто остался с картами, когда колода пуста, — тот и дурак.</li>
              </ul>
            )}
          </Panel>
          <Panel title="Управление">
            <ul className="text-[12.5px] text-cream/60 space-y-1.5 leading-relaxed list-none">
              <li>• <b className="text-cream/85">Клик по карте</b> в руке — сыграть её (если она подсвечена).</li>
              <li>• Кнопки под рукой: взять / бито / перевести — по ситуации.</li>
              <li>• {isHost ? 'Админ-панель (шестерёнка): боты, кик, блайнды, рестарт, журнал.' : 'Хост управляет игрой — вам придут его решения.'}</li>
              <li>• Чат — золотая кнопка справа внизу.</li>
            </ul>
          </Panel>
        </div>
      </div>
    </div>
  );
}
