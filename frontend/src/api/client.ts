import { API_BASE_URL } from '../config';
import type { JoinRoomResponse, PrivateStateDto, PublicRoomDto, RoomLanguage } from '../types';

function playerTokenHeaders(playerToken?: string): HeadersInit {
  return playerToken ? { 'X-Player-Token': playerToken } : {};
}

async function request<T>(path: string, init?: RequestInit, playerToken?: string): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      ...playerTokenHeaders(playerToken),
      ...(init?.headers ?? {}),
    },
  });

  if (!response.ok) {
    let message = 'Có lỗi xảy ra.';
    try {
      const body = (await response.json()) as { message?: string };
      message = body.message ?? message;
    } catch {
      message = response.statusText || message;
    }
    throw new Error(message);
  }

  if (response.status === 204) {
    return undefined as T;
  }

  const text = await response.text();
  return text ? (JSON.parse(text) as T) : (undefined as T);
}

export const api = {
  createRoom(nickname: string, maxPlayers: number, password?: string, language?: RoomLanguage): Promise<JoinRoomResponse> {
    return request<JoinRoomResponse>('/api/rooms', {
      method: 'POST',
      body: JSON.stringify({ nickname, maxPlayers, password, language }),
    });
  },

  joinRoom(roomCode: string, nickname: string, password?: string): Promise<JoinRoomResponse> {
    return request<JoinRoomResponse>(`/api/rooms/${roomCode.trim().toUpperCase()}/join`, {
      method: 'POST',
      body: JSON.stringify({ nickname, password }),
    });
  },

  getRoom(roomCode: string): Promise<PublicRoomDto> {
    return request<PublicRoomDto>(`/api/rooms/${roomCode.trim().toUpperCase()}`);
  },

  getPrivateState(roomCode: string, playerId: string, playerToken: string): Promise<PrivateStateDto> {
    return request<PrivateStateDto>(`/api/rooms/${roomCode.trim().toUpperCase()}/players/${playerId}/private-state`, undefined, playerToken);
  },

  updateSettings(
    roomCode: string,
    playerId: string,
    settings: {
      maxPlayers?: number;
      nightSeconds?: number;
      packSelectionSeconds?: number;
      language?: RoomLanguage;
      password?: string;
      whiteDogEnabled?: boolean;
    },
    playerToken: string,
  ): Promise<PublicRoomDto> {
    return request<PublicRoomDto>(`/api/rooms/${roomCode}/settings`, {
      method: 'POST',
      body: JSON.stringify({ playerId, ...settings }),
    }, playerToken);
  },

  updateDisplayName(roomCode: string, playerId: string, nickname: string, playerToken: string): Promise<PublicRoomDto> {
    return request<PublicRoomDto>(`/api/rooms/${roomCode}/display-name`, {
      method: 'POST',
      body: JSON.stringify({ playerId, nickname }),
    }, playerToken);
  },

  leaveRoom(roomCode: string, playerId: string, playerToken: string): Promise<void> {
    return request<void>(`/api/rooms/${roomCode}/leave`, {
      method: 'POST',
      body: JSON.stringify({ playerId }),
    }, playerToken);
  },

  kickPlayer(roomCode: string, playerId: string, targetPlayerId: string, playerToken: string): Promise<PublicRoomDto> {
    return request<PublicRoomDto>(`/api/rooms/${roomCode}/kick`, {
      method: 'POST',
      body: JSON.stringify({ playerId, targetPlayerId }),
    }, playerToken);
  },

  startGame(roomCode: string, playerId: string, playerToken: string): Promise<PublicRoomDto> {
    return request<PublicRoomDto>(`/api/rooms/${roomCode}/start`, {
      method: 'POST',
      body: JSON.stringify({ playerId }),
    }, playerToken);
  },

  restartGame(roomCode: string, playerId: string, playerToken: string): Promise<PublicRoomDto> {
    return request<PublicRoomDto>(`/api/rooms/${roomCode}/restart`, {
      method: 'POST',
      body: JSON.stringify({ playerId }),
    }, playerToken);
  },
};
