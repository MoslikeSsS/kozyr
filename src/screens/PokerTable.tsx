import { useState } from 'react';
import type { AdminCmd, Card, PokerView } from '../lib/types';
import { CardFace, CardBack } from '../components/CardView';
import { Btn, AmountPill, Banner } from '../components/Shared';
import { HAND_NAMES, describeHand, pokerLive, chenScore, chenLabel } from '../lib/poker';
import { cardKey } from '../lib/cards';
import { IconCrown } from '../components/Icons';
import { play } from '../lib/sound';

const POS: Record<number, { x: number; y: number }[]> = {
  2: [{ x: 50, y: 82 }, { x: 50, y: 12 }],
  3: [{ x: 50, y: 82 }, { x: 13, y: 24 }, { x: 87, y: 24 }],
  4: [{ x: 50, y: 82 }, { x: 9, y: 48 }, { x: 50, y: 10 }, { x: 91, y: 48 }],
  5: [{ x: 50, y: 82 }, { x: 10, y: 58 }, { x: 22, y: 13 }, { x: 78, y: 13 }, { x: 90, y: 58 }],
  6: [{ x: 50, y: 82 }, { x: 9, y: 58 }, { x: 17, y: 13 }, { x: 50, y: 8 }, { x: 83, y: 13 }, { x: 91, y: 58 }],
};

const EXAMPLES: Record<number, string> = {
  8: 'Т К Д В 10 одной масти',
  7: 'Т Т Т Т + любая',
  6: 'К К К + 9 9',
  5: 'любые 5 одной масти',
  4: '9 8 7 6 5',
  3: 'Д Д Д + 4 2',
  2: 'К К + 8 8 + 3',
  1: 'В В + 9 5 2',
  0: 'Т К 9 5 2',
};

const PHASE_LABEL: Record<string, string> = {
  preflop: 'Префлоп', flop: 'Флоп', turn: 'Тёрн', river: 'Ривер', showdown: 'Вскрытие', idle: 'Матч окончен',
};

export default function PokerTable({
  view, onAction, isHost, onAdmin,
}: {
  view: PokerView;
  onAction: (a: string, c?: Card, v?: number) => void;
  isHost: boolean;
  onAdmin: (cmd: AdminCmd) => void;
}) {
  const [raiseTo, setRaiseTo] = useState(0);
  const [showHelp, setShowHelp] = useState(true);
  const you = view.you;
  const youIdx = view.seats.findIndex((s) => s.isYou);
  const ordered = youIdx >= 0 ? [...view.seats.slice(youIdx), ...view.seats.slice(0, youIdx)] : view.seats;
  const n = Math.min(6, Math.max(2, ordered.length));
  const pos = POS[n];
  const live = pokerLive(you.hole, view.community);
  const chen = you.hole.length === 2 ? chenScore(you.hole) : null;
  const betting = view.phase !== 'showdown' && view.phase !== 'lobby';
  const minR = Math.max(view.you.minRaiseTo, view.currentBet + 1);
  const effRaise = Math.min(Math.max(raiseTo || minR, minR), Math.max(you.maxRaiseTo, minR));
  const actorName = view.seats.find((s) => s.id === view.toAct)?.name ?? '';
  const nameOf = (id: string) => {
    const s = view.seats.find((x) => x.id === id);
    return s ? (s.isYou ? 'Вы' : s.name) : '…';
  };
  const timerKey = `${view.handNum}-${view.phase}-${view.toAct}`;

  return (
    <div className="h-full flex flex-col p-3 gap-2">
      {/* стол */}
      <div className="relative flex-1 min-h-0">
        <div className="table-felt absolute inset-0 rounded-[46%_/_50%] border-[6px] border-felt-950 shadow-[0_0_0_2px_rgba(227,169,60,0.35),0_24px_70px_rgba(0,0,0,0.55),inset_0_0_90px_rgba(0,0,0,0.5)]" />

        {/* центр: банк и общие карты */}
        <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 flex flex-col items-center gap-2.5 z-10">
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-display font-bold uppercase tracking-[0.2em] text-gold-400/80">{PHASE_LABEL[view.phase]}</span>
            <span className="text-[10px] text-cream/40">#{view.handNum}</span>
          </div>
          <div className="flex gap-1.5 min-h-[76px] items-center">
            {[0, 1, 2, 3, 4].map((i) => {
              const c = view.community[i];
              return c ? (
                <div key={cardKey(c)} className="anim-deal">
                  <CardFace c={c} size="md" />
                </div>
              ) : (
                <div key={'e' + i} className="w-13 h-[76px] rounded-lg border-2 border-dashed border-cream/10" />
              );
            })}
          </div>
          <AmountPill value={<span>Банк {view.pot}</span>} className="text-[14px] px-3.5 py-1" />
        </div>

        {/* места */}
        {ordered.map((s, i) => {
          const p = pos[i] ?? { x: 50, y: 50 };
          const active = betting && view.toAct === s.id;
          const isWinner = view.winners?.some((w) => w.seatId === s.id) && view.phase === 'showdown';
          return (
            <div key={s.id} className="absolute z-20" style={{ left: p.x + '%', top: p.y + '%', transform: 'translate(-50%,-50%)' }}>
              <div className={`flex flex-col items-center gap-1 transition-opacity ${s.folded ? 'opacity-40 grayscale' : ''}`}>
                {/* карты */}
                <div className="flex -space-x-3 h-[48px] items-start">
                  {s.revealed ? (
                    s.revealed.map((c) => (
                      <div key={cardKey(c)} className="anim-deal"><CardFace c={c} size="xs" /></div>
                    ))
                  ) : s.cardCount > 0 ? (
                    [0, 1].map((k) => <CardBack key={k} size="xs" className={k ? '-rotate-6' : 'rotate-3'} />)
                  ) : (
                    !s.out && <div className="w-16 h-10" />
                  )}
                </div>
                {/* табличка */}
                <div
                  className={[
                    'relative rounded-xl border px-3 py-1.5 min-w-[118px] text-center bg-felt-950/90 backdrop-blur-sm transition-all',
                    active ? 'border-gold-400 glow-gold' : isWinner ? 'border-gold-500 glow-gold' : 'border-white/12',
                    s.out ? 'opacity-45' : '',
                  ].join(' ')}
                >
                  {s.dealer && (
                    <span className="absolute -left-2.5 -top-2.5 w-6 h-6 rounded-full bg-gradient-to-b from-gold-300 to-gold-600 text-felt-950 font-display font-black text-[11px] grid place-items-center shadow border border-felt-950">
                      D
                    </span>
                  )}
                  {isWinner && <IconCrown className="absolute -top-3.5 right-2 w-5 h-5 text-gold-300 drop-shadow" />}
                  <div className="text-[12px] font-bold truncate max-w-[120px]">
                    {s.isYou ? <span className="text-gold-300">Вы</span> : s.name}
                    {s.bot && <span className="ml-1 text-[9px] text-felt-400 font-bold uppercase">бот</span>}
                  </div>
                  <div className="flex items-center justify-center gap-1.5 mt-0.5">
                    <AmountPill value={s.chips ?? 0} className="text-[11px] px-2 py-0" />
                    {s.allIn && <span className="text-[9px] font-display font-black text-hotred uppercase">олл-ин</span>}
                    {s.out && <span className="text-[9px] font-display font-black text-cream/40 uppercase">выбыл</span>}
                  </div>
                  {active && (
                    <div key={timerKey} className="absolute -bottom-[7px] left-2 right-2 h-[3px] rounded-full bg-black/60 overflow-hidden">
                      <div className="timer-bar h-full bg-gradient-to-r from-gold-300 to-gold-500 rounded-full" />
                    </div>
                  )}
                </div>
                {(s.bet ?? 0) > 0 && <div className="anim-pop"><AmountPill value={s.bet} className="text-[11px]" /></div>}
              </div>
            </div>
          );
        })}

        {/* баннер победителя */}
        {view.phase === 'showdown' && view.winners && !view.matchWinner && (
          <Banner tone="gold">
            <div className="font-display font-black text-2xl text-gold-200 leading-tight">
              {view.winners.map((w) => nameOf(w.seatId)).join(' и ')} забирает{view.winners.length > 1 ? 'ют' : ''} банк!
            </div>
            <div className="mt-1.5 text-gold-300/90 font-display text-lg font-bold">
              +{view.winners.reduce((t, w) => t + w.amount, 0)} фишек
            </div>
            <div className="mt-1 text-[13px] text-cream/60">{view.winners[0]?.handName}</div>
          </Banner>
        )}

        {view.matchWinner && (
          <Banner tone="gold">
            <IconCrown className="w-10 h-10 text-gold-300 mx-auto" />
            <div className="mt-1 font-display font-black text-2xl text-gold-200">Чемпион стола — {nameOf(view.matchWinner)}</div>
            <div className="mt-1 text-[13px] text-cream/60">Все фишки собраны. Матч окончен.</div>
            {isHost && (
              <div className="mt-4 pointer-events-auto">
                <Btn tone="gold" onClick={() => { play('shuffle'); onAdmin({ cmd: 'start' }); }}>
                  Новый матч
                </Btn>
              </div>
            )}
          </Banner>
        )}

        {/* справочник комбинаций */}
        <div className="absolute right-2 top-2 bottom-2 flex flex-col items-end z-10 pointer-events-none">
          <button
            onClick={() => { setShowHelp((v) => !v); play('click'); }}
            className="pointer-events-auto text-[10px] font-display font-bold uppercase tracking-widest text-gold-400/90 bg-felt-950/80 border border-gold-500/30 rounded-full px-3 py-1.5 hover:bg-felt-950 transition-colors"
          >
            {showHelp ? 'Скрыть комбинации' : 'Комбинации'}
          </button>
          {showHelp && (
            <div className="pointer-events-auto mt-2 w-[228px] bg-felt-950/88 border border-gold-500/20 rounded-xl p-3 backdrop-blur-sm overflow-y-auto scroll-thin max-h-full fade-in">
              <div className="text-[11px] text-cream/55 leading-snug mb-2 min-h-[30px]">
                {betting && you.hole.length === 2 ? (
                  view.phase === 'preflop' && chen !== null ? (
                    <>Префлоп: <b className="text-gold-300">{chenLabel(chen)}</b> <span className="text-cream/40">({chen} б.)</span></>
                  ) : live ? (
                    <>Сейчас у вас: <b className="text-gold-300">{describeHand(live)}</b></>
                  ) : (
                    'Ждём раздачи…'
                  )
                ) : view.phase === 'showdown' && live ? (
                  <>Итог: <b className="text-gold-300">{describeHand(live)}</b></>
                ) : (
                  'Справочник рук холдема'
                )}
              </div>
              <div className="flex flex-col gap-1">
                {[8, 7, 6, 5, 4, 3, 2, 1, 0].map((cat) => {
                  const activeCat = live && view.phase !== 'preflop' ? live.cat : -1;
                  return (
                    <div
                      key={cat}
                      className={[
                        'flex items-baseline justify-between gap-2 rounded-md px-2 py-1 text-[11px] transition-colors',
                        activeCat === cat ? 'bg-gold-500/20 border border-gold-400/60 text-gold-200' : 'text-cream/55 border border-transparent',
                      ].join(' ')}
                    >
                      <span className="font-bold">{HAND_NAMES[cat]}</span>
                      <span className="text-[10px] opacity-70 text-right">{EXAMPLES[cat]}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* нижняя панель действий */}
      <div className="h-[118px] shrink-0 flex items-center justify-center gap-5">
        <div className="flex items-end gap-2">
          {you.hole.length === 2 ? (
            <>
              <div className="anim-deal"><CardFace c={you.hole[0]} size="lg" /></div>
              <div className="anim-deal" style={{ animationDelay: '0.08s' }}><CardFace c={you.hole[1]} size="lg" /></div>
            </>
          ) : (
            <div className="w-[136px] h-[92px] rounded-lg border-2 border-dashed border-cream/10 grid place-items-center text-[11px] text-cream/30">
              вне раздачи
            </div>
          )}
        </div>

        <div className="bg-felt-950/85 border border-white/12 rounded-2xl px-5 py-3.5 backdrop-blur-sm shadow-[0_12px_40px_rgba(0,0,0,0.5)]">
          {you.canAct ? (
            <div className="flex items-center gap-3">
              <Btn tone="red" onClick={() => { play('fold'); onAction('fold'); }}>Фолд</Btn>
              <Btn tone="green" onClick={() => { play('chip'); onAction(you.callAmount === 0 ? 'check' : 'call'); }}>
                {you.callAmount === 0 ? 'Чек' : `Колл ${you.callAmount}`}
              </Btn>
              {you.maxRaiseTo > you.minRaiseTo && (
                <div className="flex items-center gap-2.5 pl-1">
                  <input
                    type="range"
                    className="raise-slider w-36"
                    min={minR}
                    max={you.maxRaiseTo}
                    step={Math.max(1, Math.round(view.bb / 2))}
                    value={effRaise}
                    onChange={(e) => setRaiseTo(+e.target.value)}
                  />
                  <span className="font-display font-bold text-gold-200 text-[13px] w-12 text-right">{effRaise}</span>
                  <Btn tone="gold" onClick={() => { play('bet'); onAction('raise', undefined, effRaise); }}>Рейз</Btn>
                </div>
              )}
              <Btn tone="dark" onClick={() => { play('hit'); onAction('raise', undefined, you.maxRaiseTo); }}>Олл-ин</Btn>
            </div>
          ) : (
            <div className="flex items-center gap-3 text-[13px] text-cream/60 h-[42px]">
              {betting ? (
                <>
                  <span className="w-2.5 h-2.5 rounded-full bg-gold-400 animate-pulse" />
                  Думает: <b className="text-cream">{view.toAct === you.seatId ? 'вы' : actorName}</b>
                  <span className="text-cream/35 text-[11px]">(25 сек на ход)</span>
                </>
              ) : view.phase === 'showdown' ? (
                <span className="text-gold-300 font-display font-bold uppercase tracking-wider text-[12px]">Вскрытие — следующая раздача…</span>
              ) : (
                <span>Ожидание…</span>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
