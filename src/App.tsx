import { useCallback, useRef, useState } from 'react';
import Home from './screens/Home';
import Room from './screens/Room';
import { HostCore, createGuestSession, type RoomCallbacks, type SessionHandle } from './lib/host';
import { randomCode } from './lib/net';
import { play, setSound } from './lib/sound';
import { Toasts, type Toast } from './components/Shared';
import type { ChatLine, GameKind, LobbyInfo, View } from './lib/types';

export default function App() {
  const [screen, setScreen] = useState<'home' | 'room'>('home');
  const [name, setNameState] = useState(() => localStorage.getItem('kozyr-name') ?? '');
  const [session, setSession] = useState<SessionHandle | null>(null);
  const [view, setView] = useState<View | null>(null);
  const [lobby, setLobby] = useState<LobbyInfo | null>(null);
  const [chat, setChat] = useState<ChatLine[]>([]);
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [shake, setShake] = useState(0);
  const [sound, setSoundState] = useState(true);
  const sessionRef = useRef<SessionHandle | null>(null);
  const idRef = useRef(1);

  const setName = (s: string) => {
    setNameState(s);
    localStorage.setItem('kozyr-name', s);
  };

  const toast = useCallback((text: string, tone: Toast['tone'] = 'info') => {
    const id = idRef.current++;
    setToasts((t) => [...t.slice(-3), { id, text, tone }]);
    window.setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 4200);
  }, []);

  const makeCb = useCallback((): RoomCallbacks => ({
    onView: (v) => setView(v),
    onLobby: (l) => setLobby(l),
    onEv: (k) => {
      play(k);
      if (k === 'hit' || k === 'lose' || k === 'take') setShake((s) => s + 1);
    },
    onChat: (from, text, mine) => {
      const id = idRef.current++;
      const myName = name.trim() || 'Гость';
      setChat((c) => [...c.slice(-80), { id, from, text, mine: mine || from === myName }]);
    },
    onToast: (msg, tone = 'info') => toast(msg, tone),
    onLeft: (reason) => {
      toast(reason, 'err');
      play('error');
      teardown();
      setScreen('home');
    },
  }), [toast, name]); // eslint-disable-line

  const teardown = useCallback(() => {
    sessionRef.current?.leave();
    sessionRef.current = null;
    setSession(null);
    setView(null);
    setLobby(null);
    setChat([]);
    setShake(0);
  }, []);

  const enterRoom = (core: HostCore, hostName: string) => {
    const handle: SessionHandle = {
      isHost: true,
      action: (a, c, v) => core.action('host', a, c, v),
      chat: (t) => core.chat(hostName, t, true),
      admin: (cmd) => core.admin(cmd),
      leave: () => core.leave(),
    };
    sessionRef.current = handle;
    setSession(handle);
    setLobby(core.lobbyInfo());
    setView(core.makeView('host'));
    setChat([]);
    setScreen('room');
  };

  const hostGame = (game: GameKind) => {
    const nm = name.trim() || 'Хост';
    teardown();
    const core = new HostCore(makeCb(), { name: nm, game, withNet: true, code: randomCode() });
    enterRoom(core, nm);
    toast('Комната создаётся… код появится в шапке', 'ok');
  };

  const localGame = (game: GameKind) => {
    const nm = name.trim() || 'Хост';
    teardown();
    const core = new HostCore(makeCb(), { name: nm, game, withNet: false, code: '---' });
    if (game === 'poker') { core.addBot(); core.addBot(); core.addBot(); }
    else { core.addBot(); core.addBot(); }
    enterRoom(core, nm);
    core.startGame();
  };

  const joinGame = (code: string) => {
    const nm = name.trim() || 'Гость';
    teardown();
    const handle = createGuestSession(code, nm, makeCb());
    sessionRef.current = handle;
    setSession(handle);
    setLobby(null);
    setView(null);
    setChat([]);
    setScreen('room');
  };

  const leaveRoom = () => {
    play('leave');
    teardown();
    setScreen('home');
  };

  const toggleSound = () => {
    setSoundState((s) => {
      setSound(!s);
      if (s) play('fold');
      return !s;
    });
  };

  return (
    <div className="h-full bg-felt relative overflow-hidden">
      {screen === 'home' ? (
        <Home name={name} setName={setName} onHost={hostGame} onJoin={joinGame} onLocal={localGame} />
      ) : (
        session && (
          <Room
            session={session}
            view={view}
            lobby={lobby}
            chat={chat}
            onChat={(t) => session.chat(t)}
            onAdmin={(cmd) => session.admin(cmd)}
            onLeave={leaveRoom}
            shake={shake}
            sound={sound}
            onToggleSound={toggleSound}
          />
        )
      )}
      <Toasts items={toasts} onClose={(id) => setToasts((t) => t.filter((x) => x.id !== id))} />
    </div>
  );
}
