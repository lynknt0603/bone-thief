import { Client, type IMessage } from '@stomp/stompjs';
import { WS_BASE_URL } from '../config';
import type { ActionPayload, ChatMessageDto, PrivateStateDto, PublicRoomDto } from '../types';

interface RoomSocketOptions {
  roomCode: string;
  playerId: string;
  onRoom: (room: PublicRoomDto) => void;
  onPrivateState: (state: PrivateStateDto) => void;
  onChat: (message: ChatMessageDto) => void;
  onError: (message: string) => void;
  onConnectionChange: (connected: boolean) => void;
}

export interface RoomSocket {
  sendReady: (ready: boolean) => void;
  sendStart: () => void;
  sendAction: (payload: ActionPayload) => void;
  sendChat: (message: string) => void;
  disconnect: () => void;
}

export function createRoomSocket(options: RoomSocketOptions): RoomSocket {
  const client = new Client({
    brokerURL: `${WS_BASE_URL}?playerId=${encodeURIComponent(options.playerId)}`,
    reconnectDelay: 1500,
    debug: () => undefined,
    onConnect: () => {
      options.onConnectionChange(true);
      client.subscribe(`/topic/rooms/${options.roomCode}`, (message: IMessage) => {
        options.onRoom(JSON.parse(message.body) as PublicRoomDto);
      });
      client.subscribe('/user/queue/private-state', (message: IMessage) => {
        options.onPrivateState(JSON.parse(message.body) as PrivateStateDto);
      });
      client.subscribe(`/topic/rooms/${options.roomCode}/chat`, (message: IMessage) => {
        options.onChat(JSON.parse(message.body) as ChatMessageDto);
      });
      client.subscribe('/user/queue/errors', (message: IMessage) => {
        const body = JSON.parse(message.body) as { message?: string };
        options.onError(body.message ?? 'Hành động không hợp lệ.');
      });
    },
    onWebSocketClose: () => {
      options.onConnectionChange(false);
    },
    onStompError: frame => {
      options.onError(frame.headers.message ?? 'Kết nối realtime gặp lỗi.');
    },
  });

  client.activate();

  const publish = (destination: string, body: unknown) => {
    if (!client.connected) {
      options.onError('Realtime chưa kết nối. Đợi vài giây rồi thử lại.');
      return;
    }
    client.publish({ destination, body: JSON.stringify(body) });
  };

  return {
    sendReady(ready: boolean) {
      publish(`/app/rooms/${options.roomCode}/ready`, { playerId: options.playerId, ready });
    },
    sendStart() {
      publish(`/app/rooms/${options.roomCode}/start`, { playerId: options.playerId });
    },
    sendAction(payload: ActionPayload) {
      publish(`/app/rooms/${options.roomCode}/action`, { playerId: options.playerId, ...payload });
    },
    sendChat(message: string) {
      publish(`/app/rooms/${options.roomCode}/chat`, { playerId: options.playerId, message });
    },
    disconnect() {
      void client.deactivate();
    },
  };
}
