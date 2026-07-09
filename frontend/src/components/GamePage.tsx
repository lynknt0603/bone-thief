import { useEffect, useMemo, useState, useRef } from 'react';
import { actionLabel, phaseLabel, parseNickname, roleLabel, roleEmoji, roleGuides } from '../labels';
import type { ActionPayload, PrivateStateDto, PublicRoomDto, RoomLanguage } from '../types';
import { PrivatePanel } from './PrivatePanel';
import { ResultPage } from './ResultPage';
import { RoomChat } from './RoomChat';

interface GamePageProps {
  room: PublicRoomDto;
  privateState: PrivateStateDto | null;
  playerId: string;
  connected: boolean;
  language: RoomLanguage;
  prevPhase: string | null;
  onAction: (payload: ActionPayload) => void;
  onRestart: () => void;
  onLeave: () => void;
  onChat: (message: string) => void;
}

type LocalizedText = Record<RoomLanguage, string>;

interface AlertModalState {
  show: boolean;
  title: LocalizedText;
  content: LocalizedText;
}

export function GamePage({ room, privateState, playerId, connected, language, prevPhase, onAction, onRestart, onLeave, onChat }: GamePageProps) {
  const [peekTarget, setPeekTarget] = useState('');
  const [voteTarget, setVoteTarget] = useState('');
  const [selectedPackmates, setSelectedPackmates] = useState<string[]>([]);
  const [alertModal, setAlertModal] = useState<AlertModalState | null>(null);
  const [prevPeekCount, setPrevPeekCount] = useState<number | null>(null);
  const [prevTheftCount, setPrevTheftCount] = useState<number | null>(null);
  const [prevPresentObservationCount, setPrevPresentObservationCount] = useState<number | null>(null);
  const [prevMissingObservationCount, setPrevMissingObservationCount] = useState<number | null>(null);
  const [showRoleReveal, setShowRoleReveal] = useState(() => prevPhase === 'LOBBY');


  const myPublicId = privateState?.publicPlayerId ?? '';
  const me = room.players.find(player => player.id === myPublicId);
  const isHost = room.hostPlayerId === myPublicId;
  const allowed = privateState?.allowedActions ?? [];
  const countdown = useCountdown(room);
  const chatLocked = room.phase === 'NIGHT_HOUR' || room.phase === 'PACK_SELECTION';
  const chatDisabled = !connected || chatLocked;
  const chatDisabledReason = !connected
    ? (language === 'EN' ? 'Realtime is reconnecting.' : 'Realtime đang kết nối lại.')
    : (language === 'EN'
        ? 'Chat is locked during night calls and pack selection.'
        : 'Chat bị khóa trong đêm gọi và lúc chọn đồng bọn.');
  const otherPlayers = useMemo(() => room.players.filter(player => player.id !== myPublicId), [room.players, myPublicId]);
  const wakeChoices = useMemo(
    () => Array.from(new Set(privateState?.diceRolls ?? [])).sort((left, right) => left - right),
    [privateState?.diceRolls],
  );
  const selectedPeekPlayer = otherPlayers.find(player => player.id === peekTarget);
  const selectedVotePlayer = otherPlayers.find(player => player.id === voteTarget);

  useEffect(() => {
    setPeekTarget('');
    setVoteTarget('');
    setSelectedPackmates([]);
  }, [room.phase, room.currentHour]);

  useEffect(() => {
    if (prevPhase === 'LOBBY') {
      setShowRoleReveal(true);
      const timer = setTimeout(() => {
        setShowRoleReveal(false);
      }, 10000);
      return () => clearTimeout(timer);
    }
  }, [prevPhase]);

  useEffect(() => {
    if (!privateState) {
      setPrevPeekCount(null);
      setPrevTheftCount(null);
      setPrevPresentObservationCount(null);
      setPrevMissingObservationCount(null);
      return;
    }

    const currentPeekCount = privateState.peekResults?.length ?? 0;
    const currentTheftCount = privateState.witnessedBoneThefts?.length ?? 0;
    const currentPresentObservationCount = privateState.observedBonePresentHours?.length ?? 0;
    const currentMissingObservationCount = privateState.observedBoneMissingHours?.length ?? 0;

    if (prevPeekCount !== null && currentPeekCount > prevPeekCount) {
      const latestPeek = privateState.peekResults[currentPeekCount - 1];
      setAlertModal({
        show: true,
        title: {
          EN: '🔍 Peek Clue',
          VI: '🔍 Xem dấu vết',
        },
        content: {
          EN: `Dog ${parseNickname(latestPeek.targetNickname).nickname} woke up at ${latestPeek.wakeTimes.map(formatWakeHour).join(', ')}.`,
          VI: `Chú chó ${parseNickname(latestPeek.targetNickname).nickname} thức dậy lúc ${latestPeek.wakeTimes.map(formatWakeHour).join(', ')}.`,
        },
      });
    }

    if (prevTheftCount !== null && currentTheftCount > prevTheftCount) {
      const latestTheft = privateState.witnessedBoneThefts[currentTheftCount - 1];
      setAlertModal({
        show: true,
        title: {
          EN: '🦴 Bone Theft Caught!',
          VI: '🦴 Phát hiện Trộm Xương!',
        },
        content: {
          EN: `Bone Thief ${parseNickname(latestTheft.thief.nickname).nickname} took the bone at ${formatWakeHour(latestTheft.hour)}!`,
          VI: `Chó Trộm Xương ${parseNickname(latestTheft.thief.nickname).nickname} đã lấy xương lúc ${formatWakeHour(latestTheft.hour)}!`,
        },
      });
    }

    if (prevPresentObservationCount !== null && currentPresentObservationCount > prevPresentObservationCount) {
      const latestHour = privateState.observedBonePresentHours[currentPresentObservationCount - 1];
      setAlertModal({
        show: true,
        title: {
          EN: '🦴 Bone Is Still There',
          VI: '🦴 Xương vẫn còn',
        },
        content: {
          EN: `When you woke at ${formatWakeHour(latestHour)}, the bone was still in the yard.`,
          VI: `Khi bạn thức lúc ${formatWakeHour(latestHour)}, xương vẫn còn trong sân.`,
        },
      });
    }

    if (prevMissingObservationCount !== null && currentMissingObservationCount > prevMissingObservationCount) {
      const latestHour = privateState.observedBoneMissingHours[currentMissingObservationCount - 1];
      setAlertModal({
        show: true,
        title: {
          EN: '🦴 Bone Is Missing!',
          VI: '🦴 Xương đã mất!',
        },
        content: {
          EN: `When you woke at ${formatWakeHour(latestHour)}, the bone was already missing.`,
          VI: `Khi bạn thức lúc ${formatWakeHour(latestHour)}, xương đã bị lấy mất.`,
        },
      });
    }

    setPrevPeekCount(currentPeekCount);
    setPrevTheftCount(currentTheftCount);
    setPrevPresentObservationCount(currentPresentObservationCount);
    setPrevMissingObservationCount(currentMissingObservationCount);
  }, [privateState, language]);

  if (room.phase === 'RESULT') {
    return (
      <ResultPage
        room={room}
        myPublicId={privateState?.publicPlayerId ?? ''}
        connected={connected}
        language={language}
        onRestart={onRestart}
        onLeave={onLeave}
        onChat={onChat}
      />
    );
  }

  const togglePackmate = (targetId: string) => {
    const required = privateState?.requiredSelectionCount ?? 0;
    setSelectedPackmates(current => {
      if (current.includes(targetId)) {
        return current.filter(id => id !== targetId);
      }
      if (current.length >= required) {
        return [...current.slice(1), targetId];
      }
      return [...current, targetId];
    });
  };

  return (
    <main className="app-shell">
      <section className="yard-area">
        <header className="topbar">
          <div />
          <span className="room-badge">
            #{room.roomCode}
            <span className="conn-dot" data-online={connected ? "true" : "false"} />
          </span>
        </header>

        <section className="phase-band">
          <div>
            <span className="phase-icon">{phaseIcon(room.phase)}</span>
            <div>
              <h2>{phaseLabel(room.phase, language)}</h2>
              <p>{phaseDescription(room, language)}</p>
            </div>
          </div>
          <div className="timer-stack">
            {room.currentHour && <strong>{formatWakeHour(room.currentHour)}</strong>}
            {countdown && <strong>{countdown}</strong>}
          </div>
        </section>

        <section className="panel yard-status-panel">
          <div className="panel-heading">
            <span>🏡</span>
            <h2>{language === 'EN' ? 'Pack Overview' : 'Theo dõi đàn chó'}</h2>
          </div>
          <div className="player-grid compact">
            {room.players.map(player => {
              const { icon, nickname } = parseNickname(player.nickname);
              const isMe = player.id === myPublicId;
              const cardClass = isMe ? 'player-tile card-self' : 'player-tile';
              
              // Calculate role label
              let roleText = '???';
              if (privateState) {
                if (isMe) {
                  roleText = privateState.role ? roleLabel(privateState.role, language) : '???';
                } else {
                  const isThief = privateState.knownBoneThief?.id === player.id || 
                                  privateState.witnessedBoneThefts.some(w => w.thief.id === player.id);
                  const isPackmate = privateState.knownPackmates.some(p => p.id === player.id);
                  if (isThief) {
                    roleText = roleLabel('BONE_THIEF', language);
                  } else if (isPackmate) {
                    roleText = roleLabel('PACKMATE', language);
                  }
                }
              }
              
              const voteText = room.phase === 'VOTING' && player.hasVoted 
                ? ` | ${language === 'EN' ? 'Voted' : 'Đã vote'}` 
                : '';
              
              return (
                <article className={cardClass} key={player.id}>
                  <span className="avatar">{icon}</span>
                  <strong>{nickname}</strong>
                  <small>
                    {roleText}{voteText}
                  </small>
                </article>
              );
            })}
          </div>
        </section>

        <section className="panel action-panel">
          <div className="panel-heading">
            <span>🦴</span>
            <h2>{language === 'EN' ? 'Actions' : 'Hành động'}</h2>
          </div>

          {room.phase === 'WAKE_SELECTION' && (
            <div className="action-stack">
              {allowed.includes('SELECT_WAKE_TIME') ? (
                <>
                  <p>{language === 'EN' ? 'Choose 1 wake time from your 2 secret dice.' : 'Chọn 1 giờ thức từ 2 xúc sắc bí mật của bạn.'}</p>
                  <div className="choice-grid">
                    {wakeChoices.map(time => (
                      <button
                        className="choice-tile button-choice"
                        key={time}
                        type="button"
                        onClick={() => onAction({ type: 'SELECT_WAKE_TIME', selectedWakeTime: time })}
                      >
                        <span>🌙 {formatWakeHour(time)}</span>
                      </button>
                    ))}
                  </div>
                </>
              ) : (
                <p>{language === 'EN' ? 'Wait for Yard Dogs to choose wake time.' : 'Đợi các Chó Canh Sân chọn giờ thức bí mật.'}</p>
              )}
            </div>
          )}

          {(room.phase === 'PACK_SELECTION' || allowed.includes('SELECT_PACKMATE')) && (
            <div className="action-stack">
              {!allowed.includes('SELECT_PACKMATE') && <p>{language === 'EN' ? 'Wait for Bone Thief to choose packmates.' : 'Chờ Chó Trộm Xương chọn đồng bọn.'}</p>}
              {allowed.includes('SELECT_PACKMATE') && privateState && (
                <>
                  <p>{language === 'EN' ? `Choose exactly ${privateState.requiredSelectionCount} players.` : `Chọn đúng ${privateState.requiredSelectionCount} chú chó.`}</p>
                  <div className="peek-card-grid">
                    {privateState.selectablePlayers.map(player => {
                      const { icon, nickname } = parseNickname(player.nickname);
                      const isSelected = selectedPackmates.includes(player.id);
                      return (
                        <button
                          className="peek-card"
                          data-selected={isSelected}
                          key={player.id}
                          type="button"
                          onClick={() => togglePackmate(player.id)}
                        >
                          <span className="peek-avatar">{icon}</span>
                          <strong>{nickname}</strong>
                          <small>
                            {isSelected 
                              ? (language === 'EN' ? 'Selected' : 'Đã chọn') 
                              : (language === 'EN' ? 'Tap to select' : 'Nhấp để chọn')}
                          </small>
                        </button>
                      );
                    })}
                  </div>
                  <button
                    className="primary-button"
                    disabled={selectedPackmates.length !== privateState.requiredSelectionCount}
                    onClick={() => onAction({ type: 'SELECT_PACKMATE', targetPlayerIds: selectedPackmates })}
                  >
                    {language === 'EN' ? 'Confirm packmates' : 'Xác nhận đồng bọn'}
                  </button>
                </>
              )}
            </div>
          )}

          {room.phase === 'NIGHT_HOUR' && !allowed.includes('SELECT_PACKMATE') && (
            <div className="action-stack">
              {privateState?.message ? (
                (privateState.message.includes("Không có dấu vết riêng") || privateState.message.toLowerCase().includes("no private clue")) &&
                privateState.role === 'YARD_DOG' && privateState.awakePlayers.length > 0 ? (
                  <div className="co-awake-alert">
                    <span>⚠️</span>
                    <p>
                      {language === 'EN' 
                        ? `${privateState.awakePlayers.map(p => parseNickname(p.nickname).nickname).join(', ')} are awake with you, so you cannot peek at clues.` 
                        : `${privateState.awakePlayers.map(p => parseNickname(p.nickname).nickname).join(', ')} đang thức cùng bạn nên không thể xem dấu vết.`}
                    </p>
                  </div>
                ) : (
                  <p>{privateState.message}</p>
                )
              ) : (
                <>
                  {!privateState?.awake && <p>{language === 'EN' ? 'Not your turn yet. Keep secret and watch the phase.' : 'Chưa tới giờ của bạn. Giữ bí mật và quan sát phase.'}</p>}
                  {privateState?.awake && (
                    <p>{language === 'EN' ? 'You are awake at this hour.' : 'Bạn đang thức ở giờ này.'}</p>
                  )}
                </>
              )}

              {allowed.includes('TAKE_BONE') && (
                <button className="primary-button" onClick={() => onAction({ type: 'TAKE_BONE' })}>
                  🦴 {actionLabel('TAKE_BONE', language)}
                </button>
              )}

              {allowed.includes('PEEK_WAKE_TIME') && (
                <div className="peek-action">
                  <div className="peek-card-grid">
                      {otherPlayers.map(player => {
                        const { icon, nickname } = parseNickname(player.nickname);
                        return (
                          <button
                            className="peek-card"
                            data-selected={peekTarget === player.id}
                            key={player.id}
                            type="button"
                            onClick={() => setPeekTarget(player.id)}
                          >
                            <span className="peek-avatar">{icon}</span>
                            <strong>{nickname}</strong>
                            <small>{player.host ? '👑 Host' : (language === 'EN' ? '... Waiting' : '... Đang chờ')}</small>
                          </button>
                        );
                      })}
                  </div>
                  <button
                    className="secondary-button"
                    disabled={!peekTarget}
                    onClick={() => onAction({ type: 'PEEK_WAKE_TIME', targetPlayerId: peekTarget })}
                  >
                    {selectedPeekPlayer 
                      ? (language === 'EN' ? `Peek at ${parseNickname(selectedPeekPlayer.nickname).nickname}` : `Xem giờ của ${parseNickname(selectedPeekPlayer.nickname).nickname}`) 
                      : (language === 'EN' ? 'Choose player to peek' : 'Chọn người chơi để xem giờ')}
                  </button>
                </div>
              )}

              {allowed.includes('WAIT') && (
                <button className="ghost-button" onClick={() => onAction({ type: 'WAIT' })}>
                  {language === 'EN' ? 'Wait out this hour' : 'Đợi qua giờ này'}
                </button>
              )}
            </div>
          )}

          {room.phase === 'DISCUSSION' && (
            <div className="action-stack">
              <p>{language === 'EN' ? 'The bone is missing. Discuss to find the suspicious thief.' : 'Xương đã biến mất. Cả sân thảo luận để tìm người chơi đáng nghi.'}</p>
              {isHost && (
                <button className="primary-button" onClick={() => onAction({ type: 'START_VOTE' })}>
                  {language === 'EN' ? 'Start voting' : 'Bắt đầu bỏ phiếu'}
                </button>
              )}
            </div>
          )}

          {room.phase === 'VOTING' && (
            <div className="action-stack">
              {!allowed.includes('VOTE') && <p>{language === 'EN' ? 'You have voted. Wait for others.' : 'Bạn đã vote. Đợi những người chơi còn lại.'}</p>}
              {allowed.includes('VOTE') && (
                <>
                  <p>{language === 'EN' ? 'Vote for the player you suspect took the bone.' : 'Bỏ phiếu cho người chơi bạn nghi đã lấy xương.'}</p>
                  <div className="peek-card-grid">
                    {otherPlayers.map(player => {
                      const { icon, nickname } = parseNickname(player.nickname);
                      return (
                        <button
                          className="peek-card"
                          data-selected={voteTarget === player.id}
                          key={player.id}
                          type="button"
                          onClick={() => setVoteTarget(player.id)}
                        >
                          <span className="peek-avatar">{icon}</span>
                          <strong>{nickname}</strong>
                          <small>
                            {player.host 
                              ? '👑 Host' 
                              : player.hasVoted 
                                ? (language === 'EN' ? 'Voted' : 'Đã vote') 
                                : (language === 'EN' ? 'Playing' : 'Trong sân')}
                          </small>
                        </button>
                      );
                    })}
                  </div>
                  <button
                    className="primary-button"
                    disabled={!voteTarget}
                    onClick={() => onAction({ type: 'VOTE', targetPlayerId: voteTarget })}
                  >
                    {selectedVotePlayer 
                      ? (language === 'EN' ? `Submit vote for ${parseNickname(selectedVotePlayer.nickname).nickname}` : `Gửi vote ${parseNickname(selectedVotePlayer.nickname).nickname}`) 
                      : (language === 'EN' ? 'Submit vote' : 'Gửi vote')}
                  </button>
                </>
              )}
            </div>
          )}
        </section>
        <RoomChat
          className="game-chat-panel"
          messages={room.chatMessages}
          myPublicId={myPublicId}
          language={language}
          disabled={chatDisabled}
          disabledReason={chatDisabledReason}
          onSend={onChat}
        />
      </section>

      <aside className="side-stack">
        <PrivatePanel privateState={privateState} language={language} />
        {alertModal && alertModal.show && (
          <div className="modal-overlay">
            <div className="modal-content settings-panel modal-alert-content">
              <h2>{alertModal.title[language]}</h2>
              <p className="modal-message-body">
                {alertModal.content[language]}
              </p>
              <div className="modal-actions">
                <button className="primary-button modal-confirm-btn" onClick={() => setAlertModal(null)}>
                  {language === 'EN' ? 'Confirm' : 'Xác nhận'}
                </button>
              </div>
            </div>
          </div>
        )}
      </aside>
      {showRoleReveal && privateState?.role && (
        <div className="role-reveal-overlay">
          <div className="role-reveal-card">
            <span className="role-reveal-emoji">
              {roleEmoji(privateState.role)}
            </span>
            <small className="role-reveal-subtitle">
              {language === 'EN' ? 'Your Secret Role' : 'Vai Trò Bí Mật Của Bạn'}
            </small>
            <h1 className="role-reveal-title">
              {roleLabel(privateState.role, language)}
            </h1>
            
            <div className="role-reveal-guide-box">
              <p className="role-reveal-guide-row">
                <strong>{language === 'EN' ? 'Alignment: ' : 'Phe: '}</strong> 
                <span className="role-reveal-alignment">{roleGuides[language][privateState.role].alignment}</span>
              </p>
              <p className="role-reveal-win-condition-row">
                <strong>{language === 'EN' ? 'Win Condition: ' : 'Điều kiện thắng: '}</strong> 
                <span className="role-reveal-win-condition">{roleGuides[language][privateState.role].winCondition}</span>
              </p>
            </div>

            <div className="role-reveal-tips-box">
              <h3 className="role-reveal-tips-title">
                {language === 'EN' ? '💡 Tips for you:' : '💡 Mẹo chơi dành cho bạn:'}
              </h3>
              <ul className="role-reveal-tips-list">
                {roleGuides[language][privateState.role].tips.map((tip, index) => (
                  <li key={index} className="role-reveal-tip-item">{tip}</li>
                ))}
              </ul>
            </div>
            
            <div className="role-reveal-timer-text">
              {language === 'EN' ? 'Starting in a few seconds...' : 'Trò chơi sẽ bắt đầu trong giây lát...'}
            </div>
          </div>
        </div>
      )}
    </main>
  );
}

function useCountdown(room: PublicRoomDto): string {
  const [now, setNow] = useState(() => Date.now());
  const [serverOffset, setServerOffset] = useState(() => room.serverTimeEpochMs - Date.now());

  useEffect(() => {
    const interval = window.setInterval(() => setNow(Date.now()), 250);
    return () => window.clearInterval(interval);
  }, []);

  useEffect(() => {
    setServerOffset(room.serverTimeEpochMs - Date.now());
    setNow(Date.now());
  }, [room.serverTimeEpochMs, room.phaseDeadlineEpochMs]);

  if (!room.phaseDeadlineEpochMs) {
    return '';
  }
  const remainingMs = Math.max(0, room.phaseDeadlineEpochMs - (now + serverOffset));
  const totalSeconds = Math.ceil(remainingMs / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
}

function phaseDescription(room: PublicRoomDto, language: RoomLanguage): string {
  if (room.phase === 'WAKE_SELECTION') {
    return language === 'EN' 
      ? '4 Players room: each Yard Dog chooses 1 wake hour from 2 secret dice.' 
      : 'Ván 4 chú chó: mỗi Chó Canh Sân chọn 1 giờ thức từ 2 xúc xắc bí mật.';
  }
  if (room.phase === 'NIGHT_HOUR') {
    return room.currentHour 
      ? `${formatWakeHour(room.currentHour)}, ${language === 'EN' ? 'dogs wake up.' : 'Chó hãy thức dậy.'}` 
      : (language === 'EN' ? 'Dogs wake up.' : 'Chó hãy thức dậy.');
  }
  if (room.phase === 'PACK_SELECTION') {
    return language === 'EN' 
      ? 'A secret choice is in progress before the yard wakes up.' 
      : 'Một lựa chọn bí mật đang diễn ra trước khi cả sân mở mắt.';
  }
  if (room.phase === 'DISCUSSION') {
    return room.boneMissing 
      ? (language === 'EN' ? 'The bone is missing. Discuss before voting.' : 'Xương đã mất. Hãy thảo luận trước khi vote.') 
      : (language === 'EN' ? 'Yard discussion.' : 'Cả sân cùng thảo luận.');
  }
  if (room.phase === 'VOTING') {
    const voted = room.players.filter(player => player.hasVoted).length;
    return language === 'EN' 
      ? `${voted}/${room.players.length} players voted.` 
      : `${voted}/${room.players.length} chú chó đã vote.`;
  }
  return language === 'EN' ? 'Game running.' : 'Ván đang chạy.';
}

function formatWakeHour(hour: number): string {
  return `${hour}:00am`;
}

function phaseIcon(phase: PublicRoomDto['phase']): string {
  if (phase === 'WAKE_SELECTION') return '⏰';
  if (phase === 'NIGHT_HOUR') return '🌙';
  if (phase === 'VOTING') return '🗳️';
  return '🦴';
}
