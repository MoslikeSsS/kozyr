import { useState } from 'react';
import type { AdminCmd, DurakMode, LobbyInfo, View } from '../lib/types';
import { Btn, Panel, Seg, CodeBig } from '../components/Shared';
import { IconBot, IconCopy, IconCrown, IconX, IconRefresh, IconFlag, IconTimer } from '../components/Icons';
import { play } from '../lib/sound';

export default function AdminPanel({
  open, onClose, lobby, view, onAdmin, onLeave,
}: {
  open: boolean;
  onClose: () => void;
  lobby: LobbyInfo;
  view: View | null;
  onAdmin: (cmd: AdminCmd) => void;
  onLeave: () => void;
}) {
  const [copied, setCopied] = useState(false);
  const [sb, setSb] = useState(String(lobby.sb));
  const [bb, setBb] = useState(String(lobby.bb));

  const copy = () => {
    navigator.clipboard?.writeText(lobby.code).catch(() => {});
    setCopied(true);
    play('click');
    setTimeout(() => setCopied(false), 1400);
  };

  return (
    <>
      <div
        className={`fixed inset-0 z-[60] bg-black/50 transition-opacity duration-200 ${open ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
        onClick={onClose}
      />
      <aside
        className={[
          'fixed top-0 right-0 z-[70] h-full w-[350px] max-w-[92vw] bg-felt-900 border-l border-gold-500/20 shadow-[-20px_0_60px_rgba(0,0,0,0.6)]',
          'transition-transform duration-250 ease-out flex flex-col',
          open ? 'translate-x-0' : 'translate-x-full',
        ].join(' ')}
      >
        <div className="flex items-center justify-between px-5 py-4 border-b border-white/8">
          <div>
            <div className="font-display font-black text-lg text-gold-300 tracking-wide">АДМИН-ПАНЕЛЬ</div>
            <div className="text-[11px] text-cream/45">вы — хост комнаты</div>
          </div>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-white/8 text-cream/60 hover:text-cream transition-colors">
            <IconX className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto scroll-thin p-4 flex flex-col gap-4">
          <Panel title="Код комнаты">
            {lobby.code === '---' ? (
              <p className="text-[12px] text-cream/55 leading-relaxed">
                Это локальный стол с ботами — кода нет. Чтобы играть с людьми, создайте комнату с главной страницы.
              </p>
            ) : (
              <>
                <CodeBig code={lobby.code} />
                <button
                  onClick={copy}
                  className="mt-3 w-full flex items-center justify-center gap-2 text-[12px] font-bold text-gold-300 bg-gold-500/10 border border-gold-500/30 rounded-lg py-2 hover:bg-gold-500/20 transition-colors"
                >
                  <IconCopy className="w-4 h-4" /> {copied ? 'Скопировано!' : 'Скопировать код'}
                </button>
                <p className="mt-2 text-[11px] text-cream/45 leading-snug">
                  Игроки в вашей сети вводят этот код на главной — «Войти в комнату».
                </p>
              </>
            )}
          </Panel>

          <Panel
            title={`Игроки · ${lobby.seats.length}/${lobby.maxSeats}`}
            right={
              <button
                onClick={() => { play('join'); onAdmin({ cmd: 'addBot' }); }}
                className="flex items-center gap-1.5 text-[11px] font-bold text-felt-400 hover:text-felt-300 transition-colors"
              >
                <IconBot className="w-4 h-4" /> Добавить бота
              </button>
            }
          >
            <div className="flex flex-col gap-2">
              {lobby.seats.map((s) => (
                <div key={s.id} className="flex items-center gap-2.5 bg-felt-950/60 border border-white/6 rounded-lg px-3 py-2">
                  <span
                    className={[
                      'w-2 h-2 rounded-full shrink-0',
                      s.bot ? 'bg-felt-400' : s.connected ? 'bg-gold-400' : 'bg-hotred',
                    ].join(' ')}
                  />
                  <span className="flex-1 text-[13px] font-semibold truncate">{s.name}</span>
                  {s.isHost && <IconCrown className="w-4 h-4 text-gold-400" />}
                  {s.bot && <span className="text-[10px] uppercase tracking-wider text-felt-400 font-bold">бот</span>}
                  {!s.bot && !s.connected && <span className="text-[10px] uppercase tracking-wider text-hotred font-bold">оффлайн</span>}
                  {!s.isHost && (
                    <button
                      onClick={() => { play('error'); onAdmin({ cmd: 'kick', seatId: s.id }); }}
                      title="Кикнуть"
                      className="p-1 rounded hover:bg-hotred/20 text-cream/40 hover:text-hotred transition-colors"
                    >
                      <IconX className="w-4 h-4" />
                    </button>
                  )}
                </div>
              ))}
            </div>
          </Panel>

          <Panel title="Правила">
            {lobby.game === 'durak' ? (
              <div className="flex flex-col gap-2.5">
                <div className="text-[12px] text-cream/55">Режим игры {lobby.started && <span className="text-warnyellow">(со следующего кона)</span>}</div>
                <Seg<DurakMode>
                  value={lobby.mode}
                  onChange={(v) => { play('click'); onAdmin({ cmd: 'setMode', v }); }}
                  options={[
                    { v: 'classic', label: 'Подкидной' },
                    { v: 'transfer', label: 'Переводной' },
                  ]}
                />
              </div>
            ) : (
              <div className="flex flex-col gap-2.5">
                <div className="text-[12px] text-cream/55">Блайнды {lobby.started && <span className="text-warnyellow">(со следующей раздачи)</span>}</div>
                <div className="flex items-center gap-2">
                  <input value={sb} onChange={(e) => setSb(e.target.value.replace(/\D/g, '').slice(0, 4))} inputMode="numeric"
                    className="w-20 bg-felt-950/70 border border-white/12 rounded-lg px-3 py-2 text-center font-display font-bold text-gold-200 outline-none focus:border-gold-500/60" />
                  <span className="text-cream/40">/</span>
                  <input value={bb} onChange={(e) => setBb(e.target.value.replace(/\D/g, '').slice(0, 4))} inputMode="numeric"
                    className="w-20 bg-felt-950/70 border border-white/12 rounded-lg px-3 py-2 text-center font-display font-bold text-gold-200 outline-none focus:border-gold-500/60" />
                  <Btn size="sm" tone="dark" onClick={() => { play('chip'); onAdmin({ cmd: 'setBlinds', sb: Math.max(1, +sb || 10), bb: Math.max(2, +bb || 20) }); }}>
                    ОК
                  </Btn>
                </div>
                <Btn size="sm" tone="dark" onClick={() => onAdmin({ cmd: 'topUp' })}>
                  +1000 фишек каждому
                </Btn>
              </div>
            )}
          </Panel>

          <Panel title="Управление игрой">
            <div className="grid grid-cols-2 gap-2">
              <Btn tone="gold" size="sm" onClick={() => { play('start' as string); onAdmin({ cmd: 'start' }); }}>
                {lobby.started ? <IconRefresh className="w-4 h-4" /> : null}
                {lobby.started ? 'Рестарт' : 'Старт'}
              </Btn>
              <Btn tone="dark" size="sm" onClick={() => onAdmin({ cmd: 'endHand' })} disabled={!lobby.started}>
                <IconTimer className="w-4 h-4" /> {lobby.game === 'poker' ? 'Сдать заново' : 'Бито форс'}
              </Btn>
              <Btn tone="red" size="sm" onClick={() => onAdmin({ cmd: 'endGame' })} disabled={!lobby.started}>
                <IconFlag className="w-4 h-4" /> В лобби
              </Btn>
              <Btn tone="ghost" size="sm" onClick={onLeave}>
                <IconX className="w-4 h-4" /> Закрыть всё
              </Btn>
            </div>
          </Panel>

          <Panel title="Журнал стола">
            <div className="flex flex-col gap-1.5 max-h-44 overflow-y-auto scroll-thin">
              {(view?.log ?? []).slice().reverse().map((l, i) => (
                <div key={i} className="text-[11.5px] text-cream/55 leading-snug border-l-2 border-gold-500/25 pl-2">
                  {l}
                </div>
              ))}
              {!(view?.log?.length) && <div className="text-[11.5px] text-cream/30">Пока тихо…</div>}
            </div>
          </Panel>
        </div>
      </aside>
    </>
  );
}
