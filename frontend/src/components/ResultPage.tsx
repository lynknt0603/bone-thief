import { roleLabel, winningPackLabel, parseNickname, getCardImageUrl, translateText } from '../labels';
import type { PublicRoomDto, RoomLanguage } from '../types';
import { RoomChat } from './RoomChat';

interface ResultPageProps {
  room: PublicRoomDto;
  myPublicId: string;
  connected: boolean;
  language: RoomLanguage;
  onRestart: () => void;
  onLeave: () => void;
  onChat: (message: string) => void;
}

export function ResultPage({ room, myPublicId, connected, language, onRestart, onLeave, onChat }: ResultPageProps) {
  const result = room.result;
  const isHost = room.hostPlayerId === myPublicId;

  const winners = result ? result.finalRoles.filter(player => {
    if (result.winningPack === 'THIEF_PACK') {
      return player.role === 'BONE_THIEF' || player.role === 'PACKMATE';
    }
    if (result.winningPack === 'YARD_PACK') {
      return player.role === 'YARD_DOG';
    }
    if (result.winningPack === 'WHITE_DOG') {
      return player.role === 'WHITE_DOG';
    }
    return false;
  }) : [];

  return (
    <main className="result-shell">
      {!result ? (
        <>
          <header className="result-header-modern">
            <p className="result-eyebrow">GAME OVER</p>
            <div className="result-title-row">
              <h1>{language === 'EN' ? 'Game Summary' : 'Tổng kết ván đấu'}</h1>
              <span className="room-badge">#{room.roomCode}</span>
            </div>
          </header>
          <section className="panel">
            <h2>{language === 'EN' ? 'Summarizing...' : 'Đang tổng kết'}</h2>
          </section>
        </>
      ) : (
        <>
          <header className="result-header-modern">
            <div className="result-title-row">
              <h1>
                {language === 'EN' ? 'Winner: ' : 'Phe thắng: '}
                {result.winningPack === 'WHITE_DOG' ? '🤍 ' : result.winningPack === 'YARD_PACK' ? '🏡 ' : '🦴 '}
                {winningPackLabel(result.winningPack, language)}
              </h1>
              <span className="room-badge">#{room.roomCode}</span>
            </div>
          </header>

          <section className="panel winner-celebration-panel">
            <div className="winners-grid">
              {winners.map(winner => {
                const { icon, nickname } = parseNickname(winner.nickname);
                return (
                  <div key={winner.playerId} className="winner-card-detail">
                    <span className="winner-banner-badge">
                      WINNER
                    </span>
                    
                    <img
                      src={getCardImageUrl(winner.role, winner.playerId)}
                      alt={roleLabel(winner.role, language)}
                      className="winner-dog-card-img"
                    />
                    <div className="winner-name-row">
                      <span className="winner-name-icon">{icon}</span>
                      <strong className="winner-nickname-text" title={nickname}>
                        {nickname}
                      </strong>
                    </div>
                    <small className="winner-role-text">
                      {roleLabel(winner.role, language)}
                    </small>
                  </div>
                );
              })}
            </div>
          </section>

          <section className="panel">
            <div className="panel-heading">
              <span>🗳️</span>
              <h2>{language === 'EN' ? 'Vote Table' : 'Bảng vote'}</h2>
            </div>
            <div className="vote-grid-modern">
              {result.votes.map(vote => (
                <div className="vote-card-modern" key={vote.voterId}>
                  <span className="voter-name">{parseNickname(vote.voterNickname).nickname}</span>
                  <span className="vote-arrow">➔</span>
                  <span className="target-name">{parseNickname(translateText(vote.targetNickname, language)).nickname}</span>
                </div>
              ))}
            </div>
          </section>

          <section className="panel">
            <div className="panel-heading">
              <span>🐾</span>
              <h2>{language === 'EN' ? 'Final Roles' : 'Vai cuối ván'}</h2>
            </div>
            <div className="role-table">
              {result.finalRoles.map(player => (
                <div 
                  key={player.playerId}
                  className={
                    player.role === 'BONE_THIEF' || player.role === 'PACKMATE'
                      ? 'role-card-thief'
                      : player.role === 'WHITE_DOG'
                        ? 'role-card-white'
                        : 'role-card-yard'
                  }
                >
                  <img
                    className="result-dog-card"
                    src={getCardImageUrl(player.role, player.playerId)}
                    alt={roleLabel(player.role, language)}
                    title={roleLabel(player.role, language)}
                  />
                  <strong>{parseNickname(player.nickname).nickname}</strong>
                  <small>{roleLabel(player.role, language)}</small>
                  {player.wakeTimes && player.wakeTimes.length > 0 && (
                    <span className="role-card-waketimes">
                      ⏰ {player.wakeTimes.map(h => `${h}:00am`).join(', ')}
                    </span>
                  )}
                </div>
              ))}
            </div>
          </section>
        </>
      )}

      <div className="button-row">
        {isHost && (
          <button className="primary-button" onClick={onRestart}>
            {language === 'EN' ? 'Play again' : 'Chơi lại'}
          </button>
        )}
        <button className="ghost-button" onClick={onLeave}>
          {language === 'EN' ? 'Leave room' : 'Rời phòng'}
        </button>
      </div>

      <RoomChat
        messages={room.chatMessages}
        myPublicId={myPublicId}
        language={language}
        disabled={!connected}
        disabledReason={language === 'EN' ? 'Realtime is reconnecting.' : 'Realtime đang kết nối lại.'}
        onSend={onChat}
      />
    </main>
  );
}
