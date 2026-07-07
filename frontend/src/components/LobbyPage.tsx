import { useEffect, useState } from 'react';
import type { PrivateStateDto, PublicRoomDto, RoomLanguage } from '../types';
import { RoomChat } from './RoomChat';
import { parseNickname } from '../labels';

const AUTO_READY_KEY = 'boneThief.autoReady';

interface LobbyPageProps {
  room: PublicRoomDto;
  privateState: PrivateStateDto | null;
  playerId: string;
  connected: boolean;
  language: RoomLanguage;
  onReady: (ready: boolean) => void;
  onStart: () => void;
  onSettings: (settings: {
    maxPlayers?: number;
    nightSeconds?: number;
    packSelectionSeconds?: number;
    language?: RoomLanguage;
    password?: string;
    whiteDogEnabled?: boolean;
  }) => void;
  onDisplayName: (nickname: string) => void;
  onLeave: () => void;
  onKick: (targetPlayerId: string) => void;
  onChat: (message: string) => void;
}

export function LobbyPage({
  room,
  privateState,
  connected,
  language,
  onReady,
  onStart,
  onSettings,
  onDisplayName,
  onLeave,
  onKick,
  onChat,
}: LobbyPageProps) {
  const myPublicId = privateState?.publicPlayerId ?? '';
  const me = room.players.find(player => player.id === myPublicId);
  const isHost = room.hostPlayerId === myPublicId;
  const hostPlayer = room.players.find(player => player.host || player.id === room.hostPlayerId);
  const hostNickname = hostPlayer ? parseNickname(hostPlayer.nickname).nickname : 'Host';
  const isFull = room.players.length === room.settings.maxPlayers;
  const everyoneReady = room.players.every(player => player.ready);
  const canStart = isHost && isFull && everyoneReady;
  const [displayName, setDisplayName] = useState(me ? parseNickname(me.nickname).nickname : '');
  const [password, setPassword] = useState('');
  const [autoReady, setAutoReady] = useState(() => localStorage.getItem(AUTO_READY_KEY) === 'true');

  useEffect(() => {
    setDisplayName(me ? parseNickname(me.nickname).nickname : '');
  }, [me?.nickname]);

  useEffect(() => {
    if (connected && autoReady && me && !me.ready) {
      onReady(true);
    }
  }, [connected, autoReady, me?.ready, me, onReady]);

  useEffect(() => {
    const syncAutoReadyPreference = () => {
      setAutoReady(localStorage.getItem(AUTO_READY_KEY) === 'true');
    };
    const handleStorage = (event: StorageEvent) => {
      if (event.key === AUTO_READY_KEY) {
        syncAutoReadyPreference();
      }
    };
    window.addEventListener('storage', handleStorage);
    window.addEventListener('boneThief.preferencesChanged', syncAutoReadyPreference);
    return () => {
      window.removeEventListener('storage', handleStorage);
      window.removeEventListener('boneThief.preferencesChanged', syncAutoReadyPreference);
    };
  }, []);

  const handleToggleAutoReady = (checked: boolean) => {
    setAutoReady(checked);
    localStorage.setItem(AUTO_READY_KEY, String(checked));
  };

  return (
    <main className="lobby-shell">
      <header className="result-header-modern app-shell-header">
        <p className="result-eyebrow">{language === 'EN' ? 'LOBBY' : 'PHÒNG'}</p>
        <div className="result-title-row">
          <h1>
            {language === 'EN' 
              ? `${hostNickname}'s Room` 
              : `Phòng của ${hostNickname}`}
          </h1>
          <span className="room-badge">
            #{room.roomCode}
            <span className="conn-dot" data-online={connected ? "true" : "false"} />
          </span>
        </div>
      </header>

      <section className="lobby-grid-layout">
        {/* Cột trái: Cài đặt phòng */}
        <section className="panel lobby-settings-panel">
          <div className="panel-heading">
            <span>⚙️</span>
            <h2>{language === 'EN' ? 'Room Settings' : 'Cài đặt phòng chơi'}</h2>
          </div>

          <div className="settings-vertical-flow">
            <div className="settings-item-group">
              <label>{language === 'EN' ? 'Display name' : 'Tên hiển thị'}</label>
              <div className="input-with-btn">
                <input
                  value={displayName}
                  onChange={event => setDisplayName(event.target.value)}
                  maxLength={24}
                  placeholder={language === 'EN' ? 'Your name' : 'Tên của bạn'}
                />
                <button
                  className="secondary-button"
                  disabled={!displayName.trim() || displayName.trim() === me?.nickname}
                  onClick={() => onDisplayName(displayName)}
                >
                  {language === 'EN' ? 'Change' : 'Đổi tên'}
                </button>
              </div>
            </div>

            <div className="settings-item-group">
              <label>{language === 'EN' ? 'Max players' : 'Số chú chó'}</label>
              <select
                value={room.settings.maxPlayers}
                disabled={!isHost}
                onChange={event => onSettings({ maxPlayers: Number(event.target.value) })}
              >
                {[4, 5, 6, 7, 8].map(count => (
                  <option key={count} value={count}>
                    {count} {language === 'EN' ? 'Players' : 'Chó'}
                  </option>
                ))}
              </select>
            </div>

            <div className="settings-item-group">
              <label>{language === 'EN' ? 'Each night hour (seconds)' : 'Mỗi canh giờ (giây)'}</label>
              <input
                type="number"
                min={5}
                max={120}
                disabled={!isHost}
                value={room.settings.nightSeconds}
                onChange={event => onSettings({ nightSeconds: Number(event.target.value) })}
              />
            </div>

            <div className="settings-item-group">
              <label>{language === 'EN' ? 'Choose packmates (seconds)' : 'Chọn đồng bọn (giây)'}</label>
              <input
                type="number"
                min={5}
                max={120}
                disabled={!isHost}
                value={room.settings.packSelectionSeconds}
                onChange={event => onSettings({ packSelectionSeconds: Number(event.target.value) })}
              />
            </div>


            <div className="settings-item-group">
              <label className="settings-check">
                <input
                  type="checkbox"
                  disabled={!isHost}
                  checked={room.settings.whiteDogEnabled}
                  onChange={event => onSettings({ whiteDogEnabled: event.target.checked })}
                />
                <span>{language === 'EN' ? 'Play White Dog' : 'Chơi Chó Trắng'}</span>
              </label>
            </div>

            {isHost && (
              <div className="settings-item-group">
                <label>{language === 'EN' ? 'Room password' : 'Password phòng'}</label>
                <div className="input-with-btn">
                  <input
                    value={password}
                    onChange={event => setPassword(event.target.value)}
                    type="password"
                    maxLength={40}
                    placeholder={language === 'EN' 
                      ? (room.settings.passwordProtected ? 'Empty to unlock' : 'Set password')
                      : (room.settings.passwordProtected ? 'Trống để mở khóa' : 'Đặt password')}
                  />
                  <button
                    className="secondary-button"
                    onClick={() => {
                      onSettings({ password });
                      setPassword('');
                    }}
                  >
                    {language === 'EN' ? 'Lock' : 'Khóa'}
                  </button>
                </div>
              </div>
            )}
          </div>

          <div className="room-facts-column">
            <div className="fact-pill">
              👥 {room.players.length}/{room.settings.maxPlayers} {language === 'EN' ? 'Players' : 'Chó'}
            </div>
            <div className="fact-pill">
              💬 {language === 'EN' 
                ? `Discussion: ${Math.round(room.settings.discussionSeconds / 60)} min` 
                : `Thảo luận: ${Math.round(room.settings.discussionSeconds / 60)} phút`}
            </div>
            <div className="fact-pill">
              🗳️ {language === 'EN' ? `Vote: ${room.settings.votingSeconds}s` : `Vote: ${room.settings.votingSeconds}s`}
            </div>
            <div className="fact-pill">
              🔒 {language === 'EN' 
                ? (room.settings.passwordProtected ? 'Password set' : 'No password') 
                : (room.settings.passwordProtected ? 'Có password' : 'Không password')}
            </div>
            <div className="fact-pill">
              🤍 {language === 'EN' 
                ? (room.settings.whiteDogEnabled ? 'White Dog on' : 'White Dog off') 
                : (room.settings.whiteDogEnabled ? 'Có Chó Trắng' : 'Không Chó Trắng')}
            </div>
          </div>
        </section>

        {/* Cột phải: Người chơi & nút bấm */}
        <section className="panel lobby-players-panel">
          <div className="panel-heading">
            <span>🐾</span>
            <h2>{language === 'EN' ? 'Players' : 'Người chơi'} ({room.players.length}/{room.settings.maxPlayers})</h2>
          </div>

          <div className="player-grid">
            {room.players.map(player => {
              const { icon, nickname } = parseNickname(player.nickname);
              const cardClass = player.host 
                ? 'player-tile card-host' 
                : player.ready 
                  ? 'player-tile card-ready' 
                  : 'player-tile card-waiting';
              return (
                <article className={cardClass} key={player.id}>
                  <span className="avatar">{icon}</span>
                  <strong>{nickname}</strong>
                  <small>
                    {player.host 
                      ? '👑 Host' 
                      : player.ready 
                        ? (language === 'EN' ? '✓ Ready' : '✓ Sẵn sàng') 
                        : (language === 'EN' ? '... Waiting' : '... Đang chờ')}
                  </small>
                  {isHost && player.id !== myPublicId && (
                    <button className="kick-button" type="button" onClick={() => onKick(player.id)}>
                      {language === 'EN' ? 'Kick' : 'Đuổi'}
                    </button>
                  )}
                </article>
              );
            })}

            {/* Các slot trống */}
            {Array.from({ length: Math.max(0, room.settings.maxPlayers - room.players.length) }).map((_, index) => (
              <article className="player-tile card-empty-slot" key={`empty-slot-${index}`}>
                <span className="avatar-plus">+</span>
                <strong>{language === 'EN' ? 'Empty' : 'Trống'}</strong>
                <small>{language === 'EN' ? 'Waiting...' : 'Chờ người chơi...'}</small>
              </article>
            ))}
          </div>

          <div className="lobby-actions-area">
            <div className="auto-ready-row">
              <label className="switch-container">
                <input
                  type="checkbox"
                  checked={autoReady}
                  onChange={event => handleToggleAutoReady(event.target.checked)}
                />
                <span className="switch-slider" />
              </label>
              <span className="auto-ready-label">{language === 'EN' ? 'Auto Ready' : 'Tự động sẵn sàng'}</span>
            </div>

            <div className="button-row">
              <button className="secondary-button size-large" onClick={() => onReady(!me?.ready)}>
                {me?.ready 
                  ? (language === 'EN' ? 'Not ready' : 'Chưa sẵn sàng') 
                  : (language === 'EN' ? 'Ready' : 'Sẵn sàng')}
              </button>
              {isHost && (
                <button className="primary-button size-large" disabled={!canStart} onClick={onStart}>
                  {language === 'EN' ? 'Start game' : 'Bắt đầu chơi'} ({room.players.length}/{room.settings.maxPlayers})
                </button>
              )}
              <button className="ghost-button size-large" onClick={onLeave}>
                {language === 'EN' ? 'Leave' : 'Rời phòng'}
              </button>
            </div>

            {!canStart && isHost && (
              <p className="hint hint-centered">
                {language === 'EN' 
                  ? 'Host starts when everyone is ready.' 
                  : 'Chủ phòng bắt đầu khi tất cả đã sẵn sàng.'}
              </p>
            )}
          </div>
        </section>

        <RoomChat
          messages={room.chatMessages}
          myPublicId={myPublicId}
          language={language}
          disabled={!connected}
          disabledReason={language === 'EN' ? 'Realtime is reconnecting.' : 'Realtime đang kết nối lại.'}
          onSend={onChat}
        />
      </section>
    </main>
  );
}
