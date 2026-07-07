import { useEffect, useRef, useState } from 'react';
import { api } from './api/client';
import { createRoomSocket, type RoomSocket } from './api/socket';
import { GamePage } from './components/GamePage';
import { HomePage } from './components/HomePage';
import { LobbyPage } from './components/LobbyPage';
import { Navbar } from './components/Navbar';
import type { ActionPayload, ChatMessageDto, JoinRoomResponse, PrivateStateDto, PublicRoomDto, RoomLanguage } from './types';

const ROOM_KEY = 'boneThief.roomCode';
const PLAYER_KEY = 'boneThief.playerId';
const NICKNAME_KEY = 'boneThief.nickname';
const LANGUAGE_KEY = 'boneThief.language';

export default function App() {
  const [room, setRoom] = useState<PublicRoomDto | null>(null);
  const [privateState, setPrivateState] = useState<PrivateStateDto | null>(null);
  const [roomCode, setRoomCode] = useState(() => localStorage.getItem(ROOM_KEY) ?? '');
  const [playerId, setPlayerId] = useState(() => localStorage.getItem(PLAYER_KEY) ?? '');
  const [preferredLanguage, setPreferredLanguage] = useState<RoomLanguage>(() =>
    localStorage.getItem(LANGUAGE_KEY) === 'EN' ? 'EN' : 'VI',
  );
  const [connected, setConnected] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const socketRef = useRef<RoomSocket | null>(null);
  const restoredRef = useRef(false);

  useEffect(() => {
    if (restoredRef.current) return;
    restoredRef.current = true;
    const storedRoomCode = localStorage.getItem(ROOM_KEY);
    const storedPlayerId = localStorage.getItem(PLAYER_KEY);
    if (!storedRoomCode || !storedPlayerId) return;

    setLoading(true);
    Promise.all([api.getRoom(storedRoomCode), api.getPrivateState(storedRoomCode, storedPlayerId)])
      .then(([publicRoom, privateData]) => {
        setRoom(publicRoom);
        setPrivateState(privateData);
        setRoomCode(publicRoom.roomCode);
        setPlayerId(storedPlayerId);
      })
      .catch((exception: Error) => {
        setError(exception.message);
        clearSession();
      })
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (!roomCode || !playerId) return undefined;

    socketRef.current?.disconnect();
    const socket = createRoomSocket({
      roomCode,
      playerId,
      onRoom: setRoom,
      onPrivateState: setPrivateState,
      onChat: (message: ChatMessageDto) => {
        setRoom(current => {
          if (!current || current.roomCode !== roomCode) return current;
          if (current.chatMessages.some(item => item.id === message.id)) return current;
          return {
            ...current,
            chatMessages: [...current.chatMessages, message].slice(-100),
          };
        });
      },
      onError: setError,
      onConnectionChange: setConnected,
    });
    socketRef.current = socket;

    return () => {
      socket.disconnect();
      if (socketRef.current === socket) {
        socketRef.current = null;
      }
    };
  }, [roomCode, playerId]);

  useEffect(() => {
    const handlePreferencesChanged = () => {
      setPreferredLanguage(localStorage.getItem(LANGUAGE_KEY) === 'EN' ? 'EN' : 'VI');
      
      const savedNickname = localStorage.getItem(NICKNAME_KEY);
      if (room && playerId && savedNickname) {
        const icon = localStorage.getItem('boneThief.icon') ?? '🐶';
        const fullName = `${icon} ${savedNickname.trim()}`;
        const myPublicId = privateState?.publicPlayerId;
        const me = room.players.find(p => p.id === myPublicId);
        if (me && me.nickname !== fullName) {
          void run(async () => {
            const updated = await api.updateDisplayName(room.roomCode, playerId, fullName);
            setRoom(updated);
          });
        }
      }
    };
    const handleStorage = (event: StorageEvent) => {
      if (event.key === LANGUAGE_KEY || event.key === NICKNAME_KEY || event.key === 'boneThief.icon') {
        handlePreferencesChanged();
      }
    };
    window.addEventListener('storage', handleStorage);
    window.addEventListener('boneThief.preferencesChanged', handlePreferencesChanged);
    return () => {
      window.removeEventListener('storage', handleStorage);
      window.removeEventListener('boneThief.preferencesChanged', handlePreferencesChanged);
    };
  }, [room, playerId, privateState?.publicPlayerId]);

  const applyJoinResponse = (response: JoinRoomResponse, nickname: string) => {
    localStorage.setItem(ROOM_KEY, response.room.roomCode);
    localStorage.setItem(PLAYER_KEY, response.playerId);
    localStorage.setItem(NICKNAME_KEY, nickname);
    setRoom(response.room);
    setPrivateState(response.privateState);
    setRoomCode(response.room.roomCode);
    setPlayerId(response.playerId);
  };

  const run = async (operation: () => Promise<void>) => {
    setError('');
    setLoading(true);
    try {
      await operation();
    } catch (exception) {
      setError(exception instanceof Error ? exception.message : 'Có lỗi xảy ra.');
    } finally {
      setLoading(false);
    }
  };

  const clearSession = () => {
    socketRef.current?.disconnect();
    socketRef.current = null;
    localStorage.removeItem(ROOM_KEY);
    localStorage.removeItem(PLAYER_KEY);
    setRoom(null);
    setPrivateState(null);
    setRoomCode('');
    setPlayerId('');
    setConnected(false);
  };

  useEffect(() => {
    const publicPlayerId = privateState?.publicPlayerId;
    if (!room || !publicPlayerId) return;
    const stillInRoom = room.players.some(player => player.id === publicPlayerId);
    if (!stillInRoom) {
      clearSession();
      setError('Bạn đã rời hoặc bị đưa khỏi phòng.');
    }
  }, [room, privateState?.publicPlayerId]);

  const buildFullName = (rawName: string) => {
    const icon = localStorage.getItem('boneThief.icon') ?? '🐶';
    return `${icon} ${rawName.trim()}`;
  };

  const createRoom = (nickname: string, maxPlayers: number, password: string) => {
    void run(async () => {
      const cleanName = nickname.trim() || 'Dog host';
      const fullName = buildFullName(cleanName);
      const response = await api.createRoom(fullName, maxPlayers, password, preferredLanguage);
      applyJoinResponse(response, cleanName);
    });
  };

  const joinRoom = (code: string, nickname: string, password: string) => {
    void run(async () => {
      const cleanName = nickname.trim() || 'Dog khách';
      const fullName = buildFullName(cleanName);
      const response = await api.joinRoom(code, fullName, password);
      applyJoinResponse(response, cleanName);
    });
  };

  const updateSettings = (settings: {
    maxPlayers?: number;
    nightSeconds?: number;
    packSelectionSeconds?: number;
    language?: RoomLanguage;
    password?: string;
    whiteDogEnabled?: boolean;
  }) => {
    if (!room || !playerId) return;
    void run(async () => {
      const updated = await api.updateSettings(room.roomCode, playerId, settings);
      setRoom(updated);
    });
  };

  const updateDisplayName = (nickname: string) => {
    if (!room || !playerId) return;
    void run(async () => {
      const fullName = buildFullName(nickname);
      const updated = await api.updateDisplayName(room.roomCode, playerId, fullName);
      setRoom(updated);
      localStorage.setItem(NICKNAME_KEY, nickname);
    });
  };

  const leaveRoom = () => {
    if (!room || !playerId) {
      clearSession();
      return;
    }
    if (room.phase !== 'LOBBY') {
      clearSession();
      return;
    }
    void run(async () => {
      await api.leaveRoom(room.roomCode, playerId);
      clearSession();
    });
  };

  const kickPlayer = (targetPlayerId: string) => {
    if (!room || !playerId) return;
    void run(async () => {
      const updated = await api.kickPlayer(room.roomCode, playerId, targetPlayerId);
      setRoom(updated);
    });
  };

  const startGame = () => {
    if (!room || !playerId) return;
    void run(async () => {
      const updated = await api.startGame(room.roomCode, playerId);
      setRoom(updated);
    });
  };

  const restartGame = () => {
    if (!room || !playerId) return;
    void run(async () => {
      const updated = await api.restartGame(room.roomCode, playerId);
      setRoom(updated);
    });
  };

  const sendReady = (ready: boolean) => {
    socketRef.current?.sendReady(ready);
  };

  const sendAction = (payload: ActionPayload) => {
    socketRef.current?.sendAction(payload);
  };

  const sendChat = (message: string) => {
    socketRef.current?.sendChat(message);
  };

  const syncPreferences = () => {
    setPreferredLanguage(localStorage.getItem(LANGUAGE_KEY) === 'EN' ? 'EN' : 'VI');
  };

  return (
    <>
      <Navbar 
        connected={connected} 
        language={preferredLanguage} 
        onHome={clearSession} 
        onPreferencesChanged={syncPreferences}
      />
      <div className="page">
        {error && (
          <div className="toast" role="alert">
            <span>{error}</span>
            <button onClick={() => setError('')} aria-label="Đóng thông báo">
              ×
            </button>
          </div>
        )}

        {!room && <HomePage loading={loading} language={preferredLanguage} onCreate={createRoom} onJoin={joinRoom} />}

        {room?.phase === 'LOBBY' && (
          <LobbyPage
            room={room}
            privateState={privateState}
            playerId={playerId}
            connected={connected}
            language={preferredLanguage}
            onReady={sendReady}
            onStart={startGame}
            onSettings={updateSettings}
            onDisplayName={updateDisplayName}
            onLeave={leaveRoom}
            onKick={kickPlayer}
            onChat={sendChat}
          />
        )}

        {room && room.phase !== 'LOBBY' && (
          <GamePage
            room={room}
            privateState={privateState}
            playerId={playerId}
            connected={connected}
            language={preferredLanguage}
            onAction={sendAction}
            onRestart={restartGame}
            onLeave={clearSession}
            onChat={sendChat}
          />
        )}
      </div>
    </>
  );
}
