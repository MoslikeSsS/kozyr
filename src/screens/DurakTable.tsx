import type { AdminCmd, Card, DurakView } from '../lib/types';
import { CardFace, CardBack } from '../components/CardView';
import { Btn, Banner } from '../components/Shared';
import { durakHints, durakStatusText } from '../lib/durak';
import { cardKey, RANK_LABEL } from '../lib/cards';
import { SuitIcon, IconCrown } from '../components/Icons';
import { play } from '../lib/sound';

export default function DurakTable({
  view, onAction, isHost, onAdmin,
}: {
  view: DurakView;
  onAction: (a: string, c?: Card) => void;
  isHost: boolean;
  onAdmin: (cmd: AdminCmd) => void;
}) {
  const hints = durakHints(view);
  const you = view.you;
  const others = view.seats.filter((s) => !s.isYou);
  const names: Record<string, string> = {};
  view.seats.forEach((s) => { names[s.id] = s.isYou ? 'Вы' : s.name; });
  const status = durakStatusText(view, names);
  const allBeaten = view.table.length > 0 && view.table.every((p) => p.d !== null);
  const firstUnbeatenIdx = view.table.findIndex((p) => p.d === null);

  const glowFor = (i: number): 'red' | 'yellow' | 'green' | null => {
    if (hints.beat.includes(i)) return 'red';
    if (hints.transfer.includes(i)) return 'yellow';
    if (hints.play.includes(i)) return 'green';
    return null;
  };

  const clickCard = (c: Card, i: number) => {
    if (view.phase !== 'attack') return;
    if (you.role === 'defend' && !view.taking) {
      if (hints.beat.includes(i)) { play('hit'); onAction('beat', c); return; }
      if (hints.transfer.includes(i)) { play('transfer'); onAction('transfer', c); return; }
      return;
    }
    if (you.role === 'attack') {
      if (hints.play.includes(i)) { play('deal'); onAction('attack', c); }
    }
  };

  return (
    <div className="h-full flex flex-col relative">
      {/* соперники */}
      <div className="flex flex-wrap justify-center gap-x-8 gap-y-2 px-4 pt-3 min-h-[118px] items-start">
        {others.map((s) => (
          <div key={s.id} className="flex flex-col items-center gap-1.5">
            <div className="flex -space-x-3.5 h-[50px] items-start">
              {s.cardCount > 0 ? (
                Array.from({ length: Math.min(s.cardCount, 6) }).map((_, k) => (
                  <CardBack key={k} size="xs" className={k % 2 ? 'rotate-3' : '-rotate-2'} />
                ))
              ) : (
                <div className="w-14 h-10 grid place-items-center text-[10px] text-cream/30 uppercase font-display font-bold">
                  {s.out ? 'вышел' : 'пусто'}
                </div>
              )}
            </div>
            <div
              className={[
                'rounded-lg border px-3 py-1 text-center bg-felt-950/85 min-w-[104px] transition-all',
                view.toAct === s.id && view.phase === 'attack' ? 'border-gold-400 glow-gold' : 'border-white/10',
                s.out ? 'opacity-40' : '',
              ].join(' ')}
            >
              <div className="text-[12px] font-bold truncate max-w-[110px]">{s.name}{s.bot && <span className="ml-1 text-[9px] text-felt-400 uppercase">бот</span>}</div>
              <div className="flex justify-center gap-1 mt-0.5">
                {s.attacker && !s.out && (
                  <span className="text-[9px] font-display font-black uppercase tracking-wider text-gold-300 bg-gold-500/15 border border-gold-500/40 rounded px-1.5">атака</span>
                )}
                {s.defender && !s.out && (
                  <span className="text-[9px] font-display font-black uppercase tracking-wider text-[#ffb1ad] bg-hotred/15 border border-hotred/40 rounded px-1.5">защита</span>
                )}
                <span className="text-[10px] text-cream/50 font-bold">{s.cardCount}</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* средняя зона */}
      <div className="flex-1 min-h-0 relative flex items-center justify-center">
        {/* колода и козырь */}
        <div className="absolute left-4 lg:left-10 top-1/2 -translate-y-1/2 flex flex-col items-center gap-2">
          <div className="relative w-24 h-24">
            {view.trump && view.deckCount > 0 && (
              <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rotate-90">
                <CardFace c={view.trump} size="sm" className="opacity-95" />
              </div>
            )}
            {view.deckCount > 0 && (
              <>
                <CardBack size="sm" className="absolute left-1/2 top-1/2 -translate-x-[46%] -translate-y-[58%] rotate-[4deg]" />
                <CardBack size="sm" className="absolute left-1/2 top-1/2 -translate-x-[54%] -translate-y-[50%] -rotate-[3deg]" />
              </>
            )}
            {view.deckCount === 0 && view.trump && (
              <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 text-[10px] text-cream/40 whitespace-nowrap">колода пуста</div>
            )}
          </div>
          <div className="font-display text-xl font-black text-gold-300">{view.deckCount}</div>
          {view.trumpSuit !== null && (
            <span className="flex items-center gap-1.5 text-[11px] font-bold text-cream/70 bg-felt-950/80 border border-white/10 rounded-full px-2.5 py-1">
              козырь <SuitIcon s={view.trumpSuit} className={`w-3.5 h-3.5 ${view.trumpSuit === 1 || view.trumpSuit === 2 ? 'text-hotred' : 'text-cream'}`} />
            </span>
          )}
        </div>

        {/* бито */}
        <div className="absolute right-4 lg:right-10 top-1/2 -translate-y-1/2 flex flex-col items-center gap-2">
          <div className="relative w-20 h-20">
            {view.discardCount > 0 ? (
              <>
                <CardBack size="sm" className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rotate-[24deg] opacity-50" />
                <CardBack size="sm" className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 -rotate-[14deg] opacity-60" />
              </>
            ) : (
              <div className="absolute inset-1 rounded-lg border-2 border-dashed border-cream/12" />
            )}
          </div>
          <div className="text-[11px] text-cream/50 font-bold">бито · {view.discardCount}</div>
        </div>

        {/* стол */}
        <div className="max-w-[480px] px-24">
          {view.table.length === 0 ? (
            <div className="w-[300px] h-[130px] mx-auto rounded-2xl border-2 border-dashed border-cream/12 grid place-items-center text-center text-[12px] text-cream/35 leading-relaxed">
              Стол пуст
              <br />
              {view.phase === 'attack' && you.role === 'attack' ? 'Выберите карту — зелёные можно кинуть' : 'Ход атакующего…'}
            </div>
          ) : (
            <div className="flex flex-wrap justify-center gap-4">
              {view.table.map((p, i) => (
                <div key={i} className={`relative w-14 h-[96px] ${i === firstUnbeatenIdx && !view.taking ? 'glow-red rounded-lg' : ''}`}>
                  <div className="anim-deal absolute inset-x-0 top-0">
                    <CardFace c={p.a} size="md" />
                  </div>
                  {p.d && (
                    <div className="anim-pop absolute inset-x-0 top-3" style={{ transform: 'rotate(13deg) translate(8px,0)' }}>
                      <CardFace c={p.d} size="md" />
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
          <div className="mt-4 text-center">
            <span className="text-[13px] text-cream/70 font-medium">{status}</span>
            <span className="ml-2 text-[11px] text-cream/35">кон #{view.boutNum} · {view.mode === 'transfer' ? 'переводной' : 'подкидной'}</span>
          </div>
        </div>
      </div>

      {/* ваша рука */}
      <div className="shrink-0 pb-4 pt-1 flex flex-col items-center gap-2.5 relative">
        {/* легенда подсказок */}
        {(hints.beat.length > 0 || hints.transfer.length > 0 || hints.play.length > 0) && view.phase === 'attack' && (
          <div className="flex items-center gap-3 text-[11px] font-bold">
            {hints.beat.length > 0 && (
              <span className="flex items-center gap-1.5 text-[#ffb1ad]"><span className="w-3 h-3 rounded glow-red inline-block bg-hotred/60" /> этими бить</span>
            )}
            {hints.transfer.length > 0 && (
              <span className="flex items-center gap-1.5 text-warnyellow"><span className="w-3 h-3 rounded glow-yellow inline-block bg-warnyellow/60" /> этими перевести</span>
            )}
            {hints.play.length > 0 && (
              <span className="flex items-center gap-1.5 text-felt-400"><span className="w-3 h-3 rounded glow-green inline-block bg-felt-400/60" /> можно подкинуть</span>
            )}
          </div>
        )}

        <div className="flex justify-center items-end px-4 max-w-full overflow-visible">
          {you.hand.map((c, i) => {
            const g = glowFor(i);
            return (
              <div key={cardKey(c)} className={i > 0 ? '-ml-5' : ''} style={{ zIndex: i }}>
                <div className="anim-deal transition-transform duration-150 hover:-translate-y-3" style={{ animationDelay: `${i * 0.04}s` }}>
                  <CardFace c={c} size="lg" glow={g} onClick={() => clickCard(c, i)} />
                </div>
              </div>
            );
          })}
          {you.hand.length === 0 && view.phase === 'attack' && (
            <div className="text-[12px] text-cream/35 py-6">У вас нет карт — доигрывайте кон наблюдателем</div>
          )}
        </div>

        {/* контекстные кнопки */}
        <div className="h-[46px] flex items-center gap-3">
          {view.phase === 'attack' && you.role === 'defend' && !view.taking && firstUnbeatenIdx >= 0 && (
            <>
              <Btn tone="red" onClick={() => { play('take'); onAction('take'); }}>Взять</Btn>
              {view.mode === 'transfer' && (
                <span className="text-[11px] text-warnyellow/90 max-w-[220px] leading-tight">
                  {hints.transfer.length > 0 ? 'Жёлтая карта переводит атаку дальше' : 'Перевод: нужна карта той же масти ранга'}
                </span>
              )}
            </>
          )}
          {view.phase === 'attack' && you.role === 'attack' && view.taking && (
            <Btn tone="green" onClick={() => { play('bito'); onAction('doneTaking'); }}>Готово — соперник берёт</Btn>
          )}
          {view.phase === 'attack' && you.role === 'attack' && !view.taking && allBeaten && (
            <Btn tone="green" onClick={() => { play('bito'); onAction('bito'); }}>Бито!</Btn>
          )}
          {view.phase === 'attack' && you.role === null && (
            <span className="text-[12px] text-cream/45">Вы наблюдаете этот кон{you.hand.length > 0 ? ' — карты ещё есть, ждите' : ''}</span>
          )}
        </div>
      </div>

      {/* финал */}
      {view.phase === 'done' && (
        <Banner tone={view.draw ? 'green' : 'red'}>
          {view.draw ? (
            <>
              <div className="font-display font-black text-3xl text-[#c9f5de]">Ничья!</div>
              <div className="mt-1 text-[13px] text-cream/60">Все сбросили карты одновременно — классика.</div>
            </>
          ) : (
            <>
              <div className="font-display font-black text-3xl text-[#ffc9c6]">
                {view.loser ? names[view.loser] : '…'} — ДУРАК!
              </div>
              <div className="mt-1 text-[13px] text-cream/60">Остался с картами, когда колода закончилась.</div>
            </>
          )}
          {isHost && (
            <div className="mt-5 pointer-events-auto flex gap-2 justify-center">
              <Btn tone="gold" onClick={() => { play('shuffle'); onAdmin({ cmd: 'start' }); }}>
                <IconCrown className="w-4 h-4" /> Реванш
              </Btn>
            </div>
          )}
        </Banner>
      )}
    </div>
  );
}
