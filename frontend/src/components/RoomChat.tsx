import { type FormEvent, useEffect, useRef, useState } from 'react';
import type { ChatMessageDto, RoomLanguage } from '../types';
import { parseNickname } from '../labels';

interface RoomChatProps {
  messages: ChatMessageDto[];
  myPublicId: string;
  language: RoomLanguage;
  disabled: boolean;
  disabledReason: string;
  onSend: (message: string) => void;
}

export function RoomChat({ messages, myPublicId, language, disabled, disabledReason, onSend }: RoomChatProps) {
  const [draft, setDraft] = useState('');
  const listRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const node = listRef.current;
    if (node) {
      node.scrollTop = node.scrollHeight;
    }
  }, [messages.length]);

  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const clean = draft.trim();
    if (!clean || disabled) return;
    onSend(clean);
    setDraft('');
  };

  return (
    <section className="panel chat-panel">
      <div className="panel-heading">
        <span>💬</span>
        <h2>{language === 'EN' ? 'Pack Chat' : 'Chat trong phòng'}</h2>
      </div>

      <div className="chat-list" ref={listRef}>
        {messages.length === 0 ? (
          <p className="chat-empty">
            {language === 'EN' ? 'No messages yet.' : 'Chưa có tin nhắn nào.'}
          </p>
        ) : (
          messages.map(message => {
            const mine = message.senderPlayerId === myPublicId;
            const myIcon = localStorage.getItem('boneThief.icon') ?? '🐶';
            const { icon, nickname } = parseNickname(message.senderNickname);
            return (
              <article className="chat-message" data-mine={mine ? 'true' : 'false'} key={message.id}>
                <span className="chat-avatar">{mine ? myIcon : icon}</span>
                <div className="chat-content-wrapper">
                  <div className="chat-message-meta">
                    <strong>{mine ? (language === 'EN' ? 'You' : 'Bạn') : nickname}</strong>
                    <span className="chat-time">{formatChatTime(message.sentAtEpochMs, language)}</span>
                  </div>
                  <p>{message.message}</p>
                </div>
              </article>
            );
          })
        )}
      </div>

      <form className="chat-form" onSubmit={submit}>
        <input
          value={draft}
          onChange={event => setDraft(event.target.value)}
          maxLength={240}
          disabled={disabled}
          placeholder={language === 'EN' ? 'Type a message...' : 'Nhập tin nhắn...'}
        />
        <button className="primary-button" type="submit" disabled={disabled || !draft.trim()}>
          {language === 'EN' ? 'Send' : 'Gửi'}
        </button>
      </form>

      {disabled && <p className="chat-disabled">{disabledReason}</p>}
    </section>
  );
}

function formatChatTime(value: number, language: RoomLanguage): string {
  return new Date(value).toLocaleTimeString(language === 'EN' ? 'en-US' : 'vi-VN', {
    hour: '2-digit',
    minute: '2-digit',
  });
}
