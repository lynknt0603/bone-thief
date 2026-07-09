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

const privateMessageTranslations: Record<RoomLanguage, Record<string, string>> = {
  VI: {
    "Wait for the pack to gather. The host will start the game.": "Đợi đủ Dog rồi host sẽ bắt đầu ván.",
    "Choose 1 of your 2 secret wake times. You only act on the chosen hour.": "Chọn 1 trong 2 giờ thức bí mật. Bạn chỉ hành động ở giờ đã chọn.",
    "Wait for the Yard Dogs to choose their secret wake time.": "Đợi các Dog Canh Sân chọn giờ thức bí mật.",
    "You are asleep in your kennel. Keep your secret and wait.": "Bạn đang ngủ trong chuồng. Giữ bí mật và chờ giờ của mình.",
    "You are done for this hour. Wait for the next wake call.": "Bạn đã xong lượt ở canh giờ này. Chờ tiếng gọi giờ tiếp theo.",
    "You are awake. Take the bone quietly.": "Bạn đang thức. Hãy lấy xương thật gọn.",
    "You are awake alone. You may peek at another Dog's wake time.": "Bạn thức một mình. Có thể xem dấu vết giờ thức của một Dog khác.",
    "You are awake. There is no private clue to peek at this hour.": "Bạn đang thức. Không có dấu vết riêng để xem ở giờ này.",
    "You were seen. Choose 1 witness to join your side.": "Bạn vừa bị nhìn thấy. Chọn 1 nhân chứng sẽ đứng về phía mình.",
    "Choose the Dog who will join your side.": "Chọn Dog sẽ đứng về phía bạn.",
    "You saw the bone being taken. Wait for a secret choice to finish, then this hour will continue.": "Bạn vừa thấy xương bị lấy. Đợi một nhịp để xử lý lựa chọn bí mật, sau đó bạn sẽ tiếp tục canh giờ này.",
    "Wait for the secret choice to finish.": "Đợi lựa chọn bí mật hoàn tất.",
    "Try to avoid being detected and accused by the pack.": "Hãy cố gắng tránh bị đàn chó phát hiện và buộc tội.",
    "You are the White Dog recruited into the thief pack. You still win alone if voted out, or win with the thief pack if the Bone Thief escapes.": "Bạn là Chó Trắng đã vào bầy trộm. Bạn vẫn thắng một mình nếu bị vote treo cổ, hoặc thắng chung nếu Chó Trộm Xương không bị phát hiện.",
    "Protect the bone thief from being detected.": "Hãy bảo vệ cho chó trộm xương không bị phát hiện.",
    "You are the White Dog. If the pack votes you out, you win alone.": "Bạn là Chó Trắng. Nếu bị cả đàn vote treo cổ, bạn thắng một mình.",
    "Join the pack in searching for the bone thief.": "Hãy cùng đàn chó truy tìm kẻ trộm xương.",
    "You have voted. Wait for the other Dogs.": "Bạn đã vote. Chờ các Dog còn lại.",
    "Choose the Dog you suspect took the bone.": "Chọn Dog bạn nghi đã lấy xương.",
    "The game has ended.": "Ván đã có kết quả.",
    "Blank vote": "Phiếu trống"
  },
  EN: {
    "Đợi đủ Dog rồi host sẽ bắt đầu ván.": "Wait for the pack to gather. The host will start the game.",
    "Chọn 1 trong 2 giờ thức bí mật. Bạn chỉ hành động ở giờ đã chọn.": "Choose 1 of your 2 secret wake times. You only act on the chosen hour.",
    "Đợi các Dog Canh Sân chọn giờ thức bí mật.": "Wait for the Yard Dogs to choose their secret wake time.",
    "Bạn đang ngủ trong chuồng. Giữ bí mật và chờ giờ của mình.": "You are asleep in your kennel. Keep your secret and wait.",
    "Bạn đã xong lượt ở canh giờ này. Chờ tiếng gọi giờ tiếp theo.": "You are done for this hour. Wait for the next wake call.",
    "Bạn đang thức. Hãy lấy xương thật gọn.": "You are awake. Take the bone quietly.",
    "Bạn thức một mình. Có thể xem dấu vết giờ thức của một Dog khác.": "You are awake alone. You may peek at another Dog's wake time.",
    "Bạn đang thức. Không có dấu vết riêng để xem ở giờ này.": "You are awake. There is no private clue to peek at this hour.",
    "Bạn vừa bị nhìn thấy. Chọn 1 nhân chứng sẽ đứng về phía mình.": "You were seen. Choose 1 witness to join your side.",
    "Chọn Dog sẽ đứng về phía bạn.": "Choose the Dog who will join your side.",
    "Bạn vừa thấy xương bị lấy. Đợi một nhịp để xử lý lựa chọn bí mật, sau đó bạn sẽ tiếp tục canh giờ này.": "You saw the bone being taken. Wait for a secret choice to finish, then this hour will continue.",
    "Đợi lựa chọn bí mật hoàn tất.": "Wait for the secret choice to finish.",
    "Hãy cố gắng tránh bị đàn chó phát hiện và buộc tội.": "Try to avoid being detected and accused by the pack.",
    "Bạn là Chó Trắng đã vào bầy trộm. Bạn vẫn thắng một mình nếu bị vote treo cổ, hoặc thắng chung nếu Chó Trộm Xương không bị phát hiện.": "You are the White Dog recruited into the thief pack. You still win alone if voted out, or win with the thief pack if the Bone Thief escapes.",
    "Hãy bảo vệ cho chó trộm xương không bị phát hiện.": "Protect the bone thief from being detected.",
    "Bạn là Chó Trắng. Nếu bị cả đàn vote treo cổ, bạn thắng một mình.": "You are the White Dog. If the pack votes you out, you win alone.",
    "Hãy cùng đàn chó truy tìm kẻ trộm xương.": "Join the pack in searching for the bone thief.",
    "Bạn đã vote. Chờ các Dog còn lại.": "You have voted. Wait for the other Dogs.",
    "Chọn Dog bạn nghi đã lấy xương.": "Choose the Dog you suspect took the bone.",
    "Ván đã có kết quả.": "The game has ended.",
    "Phiếu trống": "Blank vote"
  }
};

export function translateText(text: string | null | undefined, language: RoomLanguage): string {
  if (!text) return '';
  const trimmed = text.trim();
  const dict = privateMessageTranslations[language];
  if (dict && dict[trimmed]) {
    return dict[trimmed];
  }
  return text;
}
