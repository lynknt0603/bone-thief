export type GamePhase = 'LOBBY' | 'WAKE_SELECTION' | 'NIGHT_HOUR' | 'PACK_SELECTION' | 'DISCUSSION' | 'VOTING' | 'RESULT';

export type Role = 'BONE_THIEF' | 'YARD_DOG' | 'WHITE_DOG' | 'PACKMATE';

export type PlayerActionType =
  | 'SELECT_WAKE_TIME'
  | 'TAKE_BONE'
  | 'PEEK_WAKE_TIME'
  | 'WAIT'
  | 'SELECT_PACKMATE'
  | 'START_VOTE'
  | 'VOTE';

export type WinningPack = 'YARD_PACK' | 'THIEF_PACK' | 'WHITE_DOG';
export type RoomLanguage = 'VI' | 'EN';

export interface RoomSettingsDto {
  maxPlayers: number;
  nightSeconds: number;
  packSelectionSeconds: number;
  discussionSeconds: number;
  votingSeconds: number;
  language: RoomLanguage;
  passwordProtected: boolean;
  whiteDogEnabled: boolean;
}

export interface PublicPlayerDto {
  id: string;
  nickname: string;
  host: boolean;
  ready: boolean;
  hasVoted: boolean;
}

export interface ChatMessageDto {
  id: string;
  senderPlayerId: string;
  senderNickname: string;
  message: string;
  sentAtEpochMs: number;
}

export interface PrivatePlayerHintDto {
  id: string;
  nickname: string;
}

export interface PeekResultDto {
  targetPlayerId: string;
  targetNickname: string;
  wakeTimes: number[];
}

export interface CoAwakeRecordDto {
  hour: number;
  players: PrivatePlayerHintDto[];
}

export interface WitnessedBoneTheftDto {
  hour: number;
  thief: PrivatePlayerHintDto;
}

export interface PrivateStateDto {
  playerId: string;
  publicPlayerId: string;
  role: Role | null;
  wakeTimes: number[];
  diceRolls: number[];
  awake: boolean;
  awakePlayers: PrivatePlayerHintDto[];
  allowedActions: PlayerActionType[];
  peekResults: PeekResultDto[];
  coAwakeRecords: CoAwakeRecordDto[];
  witnessedBoneTakenHours: number[];
  witnessedBoneThefts: WitnessedBoneTheftDto[];
  observedBonePresentHours: number[];
  observedBoneMissingHours: number[];
  knownPackmates: PrivatePlayerHintDto[];
  knownBoneThief: PrivatePlayerHintDto | null;
  selectablePlayers: PrivatePlayerHintDto[];
  requiredSelectionCount: number;
  message: string;
}

export interface PlayerRoleDto {
  playerId: string;
  nickname: string;
  role: Role;
}

export interface VoteResultDto {
  voterId: string;
  voterNickname: string;
  targetId: string | null;
  targetNickname: string;
}

export interface GameResultDto {
  winningPack: WinningPack;
  revealedPlayers: PlayerRoleDto[];
  boneThief: PlayerRoleDto;
  packmates: PlayerRoleDto[];
  votes: VoteResultDto[];
  finalRoles: PlayerRoleDto[];
}

export interface PublicRoomDto {
  roomCode: string;
  phase: GamePhase;
  currentHour: number | null;
  boneMissing: boolean;
  hostPlayerId: string | null;
  settings: RoomSettingsDto;
  players: PublicPlayerDto[];
  roundNumber: number;
  requiredPackmateCount: number;
  result: GameResultDto | null;
  serverTimeEpochMs: number;
  phaseDeadlineEpochMs: number | null;
  chatMessages: ChatMessageDto[];
}

export interface JoinRoomResponse {
  playerId: string;
  room: PublicRoomDto;
  privateState: PrivateStateDto;
}

export interface ActionPayload {
  type: PlayerActionType;
  targetPlayerId?: string;
  targetPlayerIds?: string[];
  selectedWakeTime?: number;
}
