import { roleLabel, winningPackLabel, parseNickname } from '../labels';
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
            <p className="result-eyebrow">
              {result.winningPack === 'WHITE_DOG'
                ? '🤍 WHITE DOG WINS'
                : result.winningPack === 'YARD_PACK'
                  ? '🏡 YARD DOGS WINS'
                  : '🦴 THIEF BONE WINS'}
            </p>
            <div className="result-title-row">
              <h1>{language === 'EN' ? 'Winner: ' : 'Phe thắng: '}{winningPackLabel(result.winningPack, language)}</h1>
              <span className="room-badge">#{room.roomCode}</span>
            </div>
            <p className="thief-reveal-text">
              {language === 'EN' ? 'Bone Thief is ' : 'Chó Trộm Xương là '}<strong>{parseNickname(result.boneThief.nickname).nickname}</strong>.
            </p>
            {result.packmates && result.packmates.length > 0 && (
              <p className="thief-reveal-text" style={{ marginTop: '4px' }}>
                {language === 'EN' ? 'Thief packmates: ' : 'Đồng bọn trộm xương: '}<strong>{result.packmates.map(p => parseNickname(p.nickname).nickname).join(', ')}</strong>
              </p>
            )}
          </header>

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
                  <span className="target-name">{parseNickname(vote.targetNickname).nickname}</span>
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

function getCardImageUrl(role: string, publicPlayerId: string) {
  const baseUrl = import.meta.env.BASE_URL;
  if (role === 'BONE_THIEF') {
    return `${baseUrl}bone-thief.png`;
  }
  if (role === 'WHITE_DOG') {
    return `${baseUrl}white-dog.png`;
  }
  // Băm publicPlayerId để lấy chỉ số ổn định từ 1 đến 8 (các ảnh yard-dog-1.png -> yard-dog-8.png)
  const charSum = Array.from(publicPlayerId).reduce((acc, char) => acc + char.charCodeAt(0), 0);
  const cardIndex = 1 + (charSum % 8); // 1 đến 8
  return `${baseUrl}yard-dog-${cardIndex}.png`;
}
