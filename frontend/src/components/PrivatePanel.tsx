import { actionLabel, roleEmoji, roleLabel, parseNickname, getCardImageUrl, translateText } from '../labels';
import type { PrivateStateDto, RoomLanguage } from '../types';

interface PrivatePanelProps {
  privateState: PrivateStateDto | null;
  language: RoomLanguage;
}

export function PrivatePanel({ privateState, language }: PrivatePanelProps) {
  if (!privateState) {
    return (
      <aside className="private-panel">
        <h2>{language === 'EN' ? 'Kennel' : 'Chuồng riêng'}</h2>
        <p>{language === 'EN' ? 'Waiting for your private information.' : 'Đang chờ thông tin bí mật của bạn.'}</p>
      </aside>
    );
  }

  const observedBonePresentHours = privateState.observedBonePresentHours ?? [];
  const observedBoneMissingHours = privateState.observedBoneMissingHours ?? [];

  return (
    <aside className="private-panel">
      <div className="panel-heading">
        <span>{roleEmoji(privateState.role)}</span>
        <h2>{language === 'EN' ? 'Kennel' : 'Chuồng riêng'}</h2>
      </div>

      <div className="secret-role">
        <span>{language === 'EN' ? 'Your role' : 'Vai của bạn'}</span>
        <strong>{privateState.role ? roleLabel(privateState.role, language) : (language === 'EN' ? 'No role assigned' : 'Chưa chia vai')}</strong>
        {privateState.role && (
          <img 
            className="dog-card" 
            src={getCardImageUrl(privateState.role, privateState.publicPlayerId)}
            alt={roleLabel(privateState.role, language)}
            title={roleLabel(privateState.role, language)}
          />
        )}
      </div>

      <p className="private-message">{translateText(privateState.message, language)}</p>

      {privateState.diceRolls.length > 1 ? (
        // Map 4 / choice mode: Show dice choices and highlight selected one in yellow
        <div className="info-block">
          <span>{language === 'EN' ? 'Secret dice' : 'Xúc xắc bí mật'}</span>
          <div className="chip-row">
            {privateState.diceRolls.map((time, index) => {
              const isSelected = privateState.wakeTimes.includes(time);
              return (
                <span 
                  className={`chip ${isSelected ? 'chip-selected' : ''}`} 
                  key={`roll-${time}-${index}`}
                >
                  {formatWakeHour(time)}
                </span>
              );
            })}
          </div>
        </div>
      ) : (
        // Other maps: Only show wake hours once, do not show duplicate dice rolls block
        privateState.wakeTimes.length > 0 && (
          <div className="info-block">
            <span>{language === 'EN' ? 'Active wake time' : 'Giờ thức hiệu lực'}</span>
            <div className="chip-row">
              {privateState.wakeTimes.map((time, index) => (
                <span className="chip" key={`${time}-${index}`}>
                  {formatWakeHour(time)}
                </span>
              ))}
            </div>
          </div>
        )
      )}

      {(privateState.witnessedBoneThefts.length > 0 ||
        observedBonePresentHours.length > 0 ||
        observedBoneMissingHours.length > 0) && (
        <div className="info-block witness-alert">
          <span>{language === 'EN' ? 'Witnessed clues' : 'Dấu vết bạn đã thấy'}</span>
          <div className="memory-list">
            {observedBonePresentHours.map(hour => (
              <p className="memory-row" key={`bone-present-${hour}`}>
                <span>{language === 'EN' ? 'Bone check' : 'Kiểm tra xương'}</span>
                <strong>{language === 'EN' ? 'Bone was still there' : 'Xương vẫn còn'}</strong>
                <span>{language === 'EN' ? `at ${formatWakeHour(hour)}` : `lúc ${formatWakeHour(hour)}`}</span>
              </p>
            ))}
            {privateState.witnessedBoneThefts.map(event => (
              <p className="memory-row" key={`${event.thief.id}-${event.hour}`}>
                <span>{language === 'EN' ? 'Bone Thief' : 'Chó Trộm Xương'}</span>
                <strong>{parseNickname(event.thief.nickname).nickname}</strong>
                <span>{language === 'EN' ? `took bone at ${formatWakeHour(event.hour)}` : `đã lấy xương lúc ${formatWakeHour(event.hour)}`}</span>
              </p>
            ))}
            {observedBoneMissingHours.map(hour => (
              <p className="memory-row" key={`bone-missing-${hour}`}>
                <span>{language === 'EN' ? 'Bone check' : 'Kiểm tra xương'}</span>
                <strong>{language === 'EN' ? 'Bone was already missing' : 'Xương đã mất'}</strong>
                <span>{language === 'EN' ? `when you woke at ${formatWakeHour(hour)}` : `khi bạn thức lúc ${formatWakeHour(hour)}`}</span>
              </p>
            ))}
          </div>
        </div>
      )}

      {privateState.awake && (
        <div className="info-block">
          <span>{language === 'EN' ? 'Awake together' : 'Dog cùng thức'}</span>
          {privateState.awakePlayers.length === 0 ? (
            <p>{language === 'EN' ? 'You are awake alone.' : 'Một mình bạn đang thức.'}</p>
          ) : (
            <div className="chip-row">
              {privateState.awakePlayers.map(player => {
                const { icon, nickname } = parseNickname(player.nickname);
                return (
                  <span className="chip" key={player.id}>
                    {icon} {nickname}
                  </span>
                );
              })}
            </div>
          )}
        </div>
      )}

      {privateState.coAwakeRecords.length > 0 && (
        <div className="info-block">
          <span>{language === 'EN' ? 'Woke up with' : 'Đã thức cùng'}</span>
          <div className="memory-list">
            {privateState.coAwakeRecords.map(record => (
              <p className="memory-row" key={record.hour}>
                <strong>{formatWakeHour(record.hour)}</strong>
                <span>{language === 'EN' ? ' with ' : ' cùng '}{record.players.map(player => parseNickname(player.nickname).nickname).join(', ')}</span>
              </p>
            ))}
          </div>
        </div>
      )}

      {privateState.knownBoneThief && (
        <div className="info-block">
          <span>{language === 'EN' ? 'Bone Thief' : 'Chó lấy xương'}</span>
          <p>
            {parseNickname(privateState.knownBoneThief.nickname).icon} {parseNickname(privateState.knownBoneThief.nickname).nickname}
          </p>
        </div>
      )}

      {privateState.knownPackmates.length > 0 && (
        <div className="info-block">
          <span>{language === 'EN' ? 'Known packmates' : 'Đồng bọn bạn biết'}</span>
          <div className="chip-row">
            {privateState.knownPackmates.map(player => {
              const { icon, nickname } = parseNickname(player.nickname);
              return (
                <span className="chip" key={player.id}>
                  {icon} {nickname}
                </span>
              );
            })}
          </div>
        </div>
      )}

      {privateState.peekResults.length > 0 && (
        <div className="info-block">
          <span>{language === 'EN' ? 'Peeked clues' : 'Dấu vết đã xem'}</span>
          <div className="memory-list">
            {privateState.peekResults.map(result => (
              <p className="memory-row" key={`${result.targetPlayerId}-${result.wakeTimes.join('-')}`}>
                <strong>{parseNickname(result.targetNickname).nickname} {language === 'EN' ? 'wake hour:' : 'giờ dậy:'}</strong>
                <span>{result.wakeTimes.map(formatWakeHour).join(', ')}</span>
              </p>
            ))}
          </div>
        </div>
      )}

      {privateState.allowedActions.length > 0 && (
        <div className="info-block">
          <span>{language === 'EN' ? 'Available actions' : 'Hành động có thể làm'}</span>
          <div className="chip-row">
            {privateState.allowedActions.map(action => (
              <span className="chip action-chip" key={action}>
                {actionLabel(action, language)}
              </span>
            ))}
          </div>
        </div>
      )}
    </aside>
  );
}

function formatWakeHour(hour: number): string {
  return `${hour}:00am`;
}
