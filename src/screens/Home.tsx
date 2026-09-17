import { useState } from 'react';
import type { GameKind } from '../lib/types';
import { Btn, CodeBig, Panel } from '../components/Shared';
import { CardFace } from '../components/CardView';
import { SuitIcon, IconBolt, IconUsers, IconCards } from '../components/Icons';
import { play } from '../lib/sound';

export default function Home({
  name, setName, onHost, onJoin, onLocal,
}: {
  name: string;
  setName: (s: string) => void;
  onHost: (game: GameKind) => void;
  onJoin: (code: string) => void;
  onLocal: (game: GameKind) => void;
}) {
  const [game, setGame] = useState<GameKind>('durak');
  const [code, setCode] = useState('');
  const codeOk = /^\d{3}$/.test(code);

  const pick = (g: GameKind) => {
    setGame(g);
    play('click');
  };

  return (
    <div className="relative z-10 h-full overflow-y-auto scroll-thin">
      {/* парящие карты-декорации */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden>
        <div className="anim-float absolute left-[4%] top-[12%] opacity-25" style={{ ['--tilt' as string]: '-14deg' }}>
          <CardFace c={{ r: 14, s: 0 }} size="xl" />
        </div>
        <div className="anim-float absolute right-[6%] top-[8%] opacity-20" style={{ ['--tilt' as string]: '12deg', animationDelay: '0.8s' }}>
          <CardFace c={{ r: 13, s: 1 }} size="xl" />
        </div>
        <div className="anim-float absolute left-[12%] bottom-[8%] opacity-15" style={{ ['--tilt' as string]: '9deg', animationDelay: '1.6s' }}>
          <CardFace c={{ r: 6, s: 2 }} size="xl" />
        </div>
        <SuitIcon s={3} className="absolute -right-24 -bottom-24 w-[420px] h-[420px] text-felt-700/25" />
      </div>

      <div className="max-w-6xl mx-auto px-6 py-8 lg:py-12 min-h-full flex flex-col">
        {/* шапка-бренд */}
        <header className="flex items-end justify-between flex-wrap gap-4 mb-8">
          <div>
            <div className="flex items-center gap-3">
              <span className="w-11 h-11 grid place-items-center bg-gradient-to-b from-gold-300 to-gold-600 rounded-xl shadow-[0_6px_24px_rgba(227,169,60,0.4)]">
                <SuitIcon s={0} className="w-6 h-6 text-felt-950" />
              </span>
              <h1 className="font-display font-black text-4xl lg:text-5xl tracking-tight text-cream leading-none">
                КОЗЫРЬ
              </h1>
            </div>
            <p className="mt-3 text-cream/60 text-[15px] max-w-xl leading-relaxed">
              Своя комната на вашу компанию: <b className="text-gold-300">покер</b> или <b className="text-gold-300">дурак</b>,
              трёхзначный код — и игроки с соседних компьютеров уже за столом.
            </p>
          </div>
          <div className="flex items-center gap-2 text-[12px] text-cream/50">
            <span className="w-2 h-2 rounded-full bg-felt-400 animate-pulse" />
            P2P-комнаты · без регистрации
          </div>
        </header>

        <div className="grid lg:grid-cols-[1.15fr_0.85fr] gap-6 flex-1 items-start">
          {/* выбор игры */}
          <div className="flex flex-col gap-5">
            <div className="font-display text-[11px] font-bold uppercase tracking-[0.22em] text-gold-400/90 flex items-center gap-2">
              <IconCards className="w-4 h-4" /> Во что играем?
            </div>

            <button
              onClick={() => pick('poker')}
              className={[
                'group relative text-left rounded-2xl border-2 p-5 lg:p-6 transition-all duration-200 no-select',
                game === 'poker'
                  ? 'border-gold-400 bg-gradient-to-br from-felt-800 to-felt-900 shadow-[0_12px_50px_rgba(227,169,60,0.22)] -rotate-0 scale-[1.01]'
                  : 'border-white/10 bg-felt-900/70 hover:border-gold-500/50 hover:-translate-y-1 -rotate-1',
              ].join(' ')}
            >
              <div className="flex items-center gap-5">
                <div className="relative w-24 h-28 shrink-0 hidden sm:block">
                  <CardFace c={{ r: 14, s: 0 }} size="md" className="absolute left-0 top-2 -rotate-12 group-hover:-rotate-[16deg] transition-transform" />
                  <CardFace c={{ r: 13, s: 1 }} size="md" className="absolute left-8 top-0 rotate-6 group-hover:rotate-10 transition-transform" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-3">
                    <span className="font-display font-black text-2xl lg:text-3xl text-cream">ПОКЕР</span>
                    <span className="text-[10px] font-display font-bold uppercase tracking-widest bg-gold-500/20 text-gold-300 border border-gold-500/40 rounded-full px-2 py-0.5">
                      Техасский холдем
                    </span>
                  </div>
                  <p className="mt-2 text-[13px] text-cream/55 leading-relaxed">
                    Блайнды, торги, олл-ины и сайд-поты. Живая подсказка вашей комбинации и полный справочник рук — прямо за столом.
                  </p>
                </div>
                <Radio checked={game === 'poker'} />
              </div>
            </button>

            <button
              onClick={() => pick('durak')}
              className={[
                'group relative text-left rounded-2xl border-2 p-5 lg:p-6 transition-all duration-200 no-select',
                game === 'durak'
                  ? 'border-gold-400 bg-gradient-to-br from-felt-800 to-felt-900 shadow-[0_12px_50px_rgba(227,169,60,0.22)] rotate-0 scale-[1.01]'
                  : 'border-white/10 bg-felt-900/70 hover:border-gold-500/50 hover:-translate-y-1 rotate-1',
              ].join(' ')}
            >
              <div className="flex items-center gap-5">
                <div className="relative w-24 h-28 shrink-0 hidden sm:block">
                  <CardFace c={{ r: 7, s: 1 }} size="md" className="absolute left-0 top-2 -rotate-12 group-hover:-rotate-[16deg] transition-transform" />
                  <CardFace c={{ r: 6, s: 1 }} size="md" className="absolute left-8 top-0 rotate-6 group-hover:rotate-10 transition-transform" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-3 flex-wrap">
                    <span className="font-display font-black text-2xl lg:text-3xl text-cream">ДУРАК</span>
                    <span className="text-[10px] font-display font-bold uppercase tracking-widest bg-hotred/15 text-[#ffb1ad] border border-hotred/40 rounded-full px-2 py-0.5">
                      36 карт · козыри
                    </span>
                  </div>
                  <p className="mt-2 text-[13px] text-cream/55 leading-relaxed">
                    Подкидной или переводной. Подсказки подсветят карты: <span className="text-hotred font-semibold">красным — чем бить</span>,{' '}
                    <span className="text-warnyellow font-semibold">жёлтым — чем перевести</span>.
                  </p>
                </div>
                <Radio checked={game === 'durak'} />
              </div>
            </button>

            {/* как это работает */}
            <div className="mt-2 flex items-stretch gap-3 text-[12px] text-cream/55">
              {[
                ['01', 'Создайте комнату — получите код из трёх цифр'],
                ['02', 'Назовите код друзьям в вашей сети — они введут его справа'],
                ['03', 'Хост рулит игрой через админ-панель: боты, кик, блайнды'],
              ].map(([n, t], i) => (
                <div key={n} className="flex-1 bg-felt-900/60 border border-white/8 rounded-xl px-3.5 py-3 flex gap-2.5 items-start" style={{ transform: `rotate(${i % 2 ? 0.6 : -0.6}deg)` }}>
                  <span className="font-display font-black text-gold-500 text-lg leading-none">{n}</span>
                  <span className="leading-snug">{t}</span>
                </div>
              ))}
            </div>
          </div>

          {/* комната */}
          <div className="flex flex-col gap-5">
            <Panel title="Ваше имя за столом">
              <input
                value={name}
                onChange={(e) => setName(e.target.value.slice(0, 14))}
                placeholder="Например: Шулер"
                className="w-full bg-felt-950/70 border border-white/12 rounded-lg px-4 py-3 text-[15px] text-cream placeholder:text-cream/30 outline-none focus:border-gold-500/60 transition-colors"
              />
              <button
                onClick={() => { play('shuffle'); onHost(game); }}
                className="mt-4 w-full font-display font-black uppercase tracking-wider text-[15px] rounded-xl px-6 py-4 bg-gradient-to-b from-gold-300 to-gold-600 text-felt-950 shadow-[0_8px_30px_rgba(227,169,60,0.4)] hover:brightness-110 active:translate-y-[2px] transition-all inline-flex items-center justify-center gap-2.5"
              >
                <IconUsers className="w-5 h-5" /> Создать комнату
              </button>
              <div className="mt-4 flex items-center gap-3 text-[11px] text-cream/40">
                <span className="flex-1 h-px bg-white/10" /> или войдите по коду <span className="flex-1 h-px bg-white/10" />
              </div>
              <div className="mt-4 flex gap-2.5">
                <input
                  value={code}
                  onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 3))}
                  placeholder="···"
                  inputMode="numeric"
                  className="w-28 text-center bg-felt-950/70 border border-white/12 rounded-lg px-2 py-3 font-display font-black text-2xl tracking-[0.4em] text-gold-300 placeholder:text-cream/20 outline-none focus:border-gold-500/60 transition-colors"
                />
                <button
                  disabled={!codeOk || !name.trim()}
                  onClick={() => { play('join'); onJoin(code); }}
                  className="flex-1 font-display font-bold uppercase tracking-wider text-[13px] rounded-lg px-4 bg-felt-700/60 border border-felt-500/50 text-cream hover:bg-felt-600/70 active:translate-y-[2px] transition-all disabled:opacity-35 disabled:pointer-events-none"
                >
                  Войти в комнату
                </button>
              </div>
              {!name.trim() && <p className="mt-2 text-[11px] text-warnyellow/80">Введите имя, чтобы сесть за стол</p>}
            </Panel>

            <Panel title="Нет компании под рукой?">
              <div className="flex items-center gap-4">
                <div className="flex-1 text-[13px] text-cream/60 leading-relaxed">
                  Быстрый стол с ботами — работает даже без сети. {game === 'poker' ? 'Три соперника, блайнды 10/20.' : 'Два соперника, ' + 'обычная партия.'}
                </div>
                <Btn tone="green" size="lg" onClick={() => { play('start' as string); onLocal(game); }}>
                  <IconBolt className="w-4 h-4" /> Играть
                </Btn>
              </div>
            </Panel>

            <div className="text-[11px] text-cream/35 leading-relaxed px-1">
              Хост — администратор комнаты: добавляет ботов, кикает, меняет правила, форсирует раздачу.
              Для онлайн-игры используется публичный сигнальный сервер PeerJS (интернет нужен только для знакомства), дальше трафик прямой.
              Для локальной сети можно запустить свой сервер: <span className="text-gold-400/70">node server.mjs</span>.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function Radio({ checked }: { checked: boolean }) {
  return (
    <span
      className={[
        'w-6 h-6 rounded-full border-2 grid place-items-center shrink-0 transition-all',
        checked ? 'border-gold-400 bg-gold-500/20' : 'border-white/20',
      ].join(' ')}
    >
      {checked && <span className="w-2.5 h-2.5 rounded-full bg-gold-400" />}
    </span>
  );
}
