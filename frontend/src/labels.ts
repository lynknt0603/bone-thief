import type { GamePhase, PlayerActionType, Role, RoomLanguage, WinningPack } from './types';

const phaseLabels: Record<RoomLanguage, Record<GamePhase, string>> = {
  VI: {
    LOBBY: 'Sân chờ',
    WAKE_SELECTION: 'Chọn giờ thức',
    NIGHT_HOUR: 'Đêm trong chuồng',
    PACK_SELECTION: 'Chọn đồng bọn',
    DISCUSSION: 'Cả sân suy luận',
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
