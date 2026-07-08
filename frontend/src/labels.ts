import type { GamePhase, PlayerActionType, Role, RoomLanguage, WinningPack } from './types';

const phaseLabels: Record<RoomLanguage, Record<GamePhase, string>> = {
  VI: {
    LOBBY: 'Sân chờ',
    WAKE_SELECTION: 'Chọn giờ thức',
    NIGHT_HOUR: 'Đêm trong chuồng',
    PACK_SELECTION: 'Chọn đồng bọn',
    DISCUSSION: 'Cả sân cùng thảo luận',
    VOTING: 'Bỏ phiếu',
    RESULT: 'Kết quả',
  },
  EN: {
    LOBBY: 'Lobby',
    WAKE_SELECTION: 'Wake choice',
    NIGHT_HOUR: 'Kennel night',
    PACK_SELECTION: 'Pack selection',
    DISCUSSION: 'Yard discussion',
    VOTING: 'Voting',
    RESULT: 'Result',
  },
};

const roleLabels: Record<RoomLanguage, Record<Role, string>> = {
  VI: {
    BONE_THIEF: 'Chó Trộm Xương',
    YARD_DOG: 'Chó Canh Sân',
    WHITE_DOG: 'Chó Trắng',
    PACKMATE: 'Đồng Bọn Trộm Xương',
  },
  EN: {
    BONE_THIEF: 'Bone Thief',
    YARD_DOG: 'Yard Dog',
    WHITE_DOG: 'White Dog',
    PACKMATE: 'Secret Packmate',
  },
};

const actionLabels: Record<RoomLanguage, Record<PlayerActionType, string>> = {
  VI: {
    SELECT_WAKE_TIME: 'Chọn giờ thức',
    TAKE_BONE: 'Lấy xương',
    PEEK_WAKE_TIME: 'Xem dấu vết',
    WAIT: 'Đợi',
    SELECT_PACKMATE: 'Chọn đồng bọn',
    START_VOTE: 'Bắt đầu vote',
    VOTE: 'Vote',
  },
  EN: {
    SELECT_WAKE_TIME: 'Choose wake time',
    TAKE_BONE: 'Take bone',
    PEEK_WAKE_TIME: 'Peek clue',
    WAIT: 'Wait',
    SELECT_PACKMATE: 'Choose packmate',
    START_VOTE: 'Start vote',
    VOTE: 'Vote',
  },
};

const winningPackLabels: Record<RoomLanguage, Record<WinningPack, string>> = {
  VI: {
    YARD_PACK: 'Phe Canh Sân',
    THIEF_PACK: 'Phe Trộm Xương',
    WHITE_DOG: 'Chó Trắng',
  },
  EN: {
    YARD_PACK: 'Yard Dogs',
    THIEF_PACK: 'Thief Bone',
    WHITE_DOG: 'White Dog',
  },
};

export function phaseLabel(phase: GamePhase, language: RoomLanguage): string {
  return phaseLabels[language][phase];
}

export function roleLabel(role: Role, language: RoomLanguage): string {
  return roleLabels[language][role];
}

export function actionLabel(action: PlayerActionType, language: RoomLanguage): string {
  return actionLabels[language][action];
}

export function winningPackLabel(pack: WinningPack, language: RoomLanguage): string {
  return winningPackLabels[language][pack];
}

export function roleEmoji(role: Role | null): string {
  if (role === 'BONE_THIEF') return '🕵️';
  if (role === 'PACKMATE') return '🐾';
  if (role === 'WHITE_DOG') return '🤍';
  if (role === 'YARD_DOG') return '🐶';
  return '🏡';
}

export const dogIcons = ["🐶", "🐕", "🦮", "🦁", "🐩", "🦊", "🐺", "🐾", "🦴"];

export function parseNickname(fullName: string) {
  const trimmed = fullName.trim();
  for (const icon of dogIcons) {
    if (trimmed.startsWith(icon)) {
      const nickname = trimmed.substring(icon.length).trim();
      return { icon, nickname };
    }
  }
  return { icon: "🐶", nickname: trimmed };
}

export interface RoleGuideDetail {
  alignment: string;
  winCondition: string;
  tips: string[];
}

export const roleGuides: Record<RoomLanguage, Record<Role, RoleGuideDetail>> = {
  VI: {
    BONE_THIEF: {
      alignment: 'Phe Trộm Xương 🕵️',
      winCondition: 'Lấy trộm khúc xương vào ban đêm và thuyết phục cả bầy không bỏ phiếu treo cổ mình ở cuối ván.',
      tips: [
        'Chọn đồng bọn khéo léo để phối hợp kéo phiếu và che mắt bầy chó.',
        'Thảo luận chủ động để hướng sự nghi ngờ sang Chó Canh Sân hoặc Đồng Bọn Trộm Xương.'
      ]
    },
    PACKMATE: {
      alignment: 'Phe Trộm Xương 🐾',
      winCondition: 'Bảo vệ thành công Chó Trộm Xương không bị cả bầy vote treo cổ ở cuối ván.',
      tips: [
        'Hệ thống sẽ hiển thị vai trò và tên thật của Chó Trộm Xương cho bạn.',
        'Hãy bào chữa và lái dư luận sang người khác khi thảo luận nhóm.',
        'Vote trùng mục tiêu với Chó Trộm Xương để tăng cơ hội cứu nguy.'
      ]
    },
    YARD_DOG: {
      alignment: 'Phe Bảo Vệ Xương 🐶',
      winCondition: 'Tìm ra Chó Trộm Xương và bỏ phiếu treo cổ hắn thành công ở cuối ván.',
      tips: [
        'Chia sẻ thông tin dấu vết trung thực với đồng đội để cùng phân tích.'
      ]
    },
    WHITE_DOG: {
      alignment: 'Phe Độc Lập 🤍',
      winCondition: 'Dụ cả bầy vote treo cổ chính mình khi khúc xương bị mất để giành chiến thắng.',
      tips: [
        'Hãy tỏ ra đáng nghi một cách tinh tế (nhưng không quá lộ liễu).',
        'Lập luận mâu thuẫn hoặc nhận vơ mình là Chó Trộm Xương khi bị nghi ngờ.'
      ]
    }
  },
  EN: {
    BONE_THIEF: {
      alignment: 'Thief Pack 🕵️',
      winCondition: 'Successfully steal the bone at night and convince the yard not to vote you out in the Result phase.',
      tips: [
        'Select reliable packmates to defend you during discussions.',
        'Deflect suspicion towards Yard Dogs or Secret Packmates.'
      ]
    },
    PACKMATE: {
      alignment: 'Thief Pack 🐾',
      winCondition: 'Protect the Bone Thief from being voted out by the pack at the end of the game.',
      tips: [
        'Identify the Bone Thief (revealed to you in your private state).',
        'Actively defend the Thief and redirect focus during debates.',
        'Coordinate your vote with the Bone Thief to secure their safety.'
      ]
    },
    YARD_DOG: {
      alignment: 'Bone Protection Pack 🐶',
      winCondition: 'Identify the Bone Thief and successfully vote them out in the final phase.',
      tips: [
        'Share your clues honestly with teammates to analyze together.'
      ]
    },
    WHITE_DOG: {
      alignment: 'Independent 🤍',
      winCondition: 'Trick the pack into voting you out when the bone is taken to win alone.',
      tips: [
        'Act suspiciously in a subtle, convincing manner.',
        'Give contradictory clues or pretend to be the Bone Thief if pressured.'
      ]
    }
  }
};

export function getCardImageUrl(role: string, publicPlayerId: string): string {
  const baseUrl = import.meta.env.BASE_URL;
  if (role === 'BONE_THIEF') {
    return `${baseUrl}bone-thief.png`;
  }
  if (role === 'WHITE_DOG') {
    return `${baseUrl}white-dog.png`;
  }
  // Hash publicPlayerId to get a stable index from 1 to 8 (for yard-dog-1.png to yard-dog-8.png)
  const charSum = Array.from(publicPlayerId).reduce((acc, char) => acc + char.charCodeAt(0), 0);
  const cardIndex = 1 + (charSum % 8); // 1 to 8
  return `${baseUrl}yard-dog-${cardIndex}.png`;
}

export const STORAGE_KEYS = {
  ROOM_CODE: 'boneThief.roomCode',
  PLAYER_ID: 'boneThief.playerId',
  NICKNAME: 'boneThief.nickname',
  LANGUAGE: 'boneThief.language',
  AUTO_READY: 'boneThief.autoReady',
  ICON: 'boneThief.icon',
} as const;
