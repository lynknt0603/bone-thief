import { FormEvent, useEffect, useState } from 'react';
import type { RoomLanguage } from '../types';

const NICKNAME_KEY = 'boneThief.nickname';

interface HomePageProps {
  loading: boolean;
  language: RoomLanguage;
  onCreate: (nickname: string, maxPlayers: number, password: string) => void;
  onJoin: (roomCode: string, nickname: string, password: string) => void;
}

export function HomePage({ loading, language, onCreate, onJoin }: HomePageProps) {
  const [createName, setCreateName] = useState(() => localStorage.getItem(NICKNAME_KEY) ?? '');
  const [joinName, setJoinName] = useState(() => localStorage.getItem(NICKNAME_KEY) ?? '');
  const [roomCode, setRoomCode] = useState('');
  const [createPassword, setCreatePassword] = useState('');
  const [joinPassword, setJoinPassword] = useState('');
  const [maxPlayers, setMaxPlayers] = useState(5);

  const submitCreate = (event: FormEvent) => {
    event.preventDefault();
    if (createName.trim()) {
      localStorage.setItem(NICKNAME_KEY, createName.trim());
    }
    onCreate(createName, maxPlayers, createPassword);
  };

  const submitJoin = (event: FormEvent) => {
    event.preventDefault();
    if (joinName.trim()) {
      localStorage.setItem(NICKNAME_KEY, joinName.trim());
    }
    onJoin(roomCode, joinName, joinPassword);
  };

  useEffect(() => {
    const syncSavedNickname = () => {
      const nextName = localStorage.getItem(NICKNAME_KEY) ?? '';
      setCreateName(nextName);
      setJoinName(nextName);
    };
    const handleStorage = (event: StorageEvent) => {
      if (event.key !== NICKNAME_KEY) return;
      syncSavedNickname();
    };
    window.addEventListener('storage', handleStorage);
    window.addEventListener('boneThief.preferencesChanged', syncSavedNickname);
    return () => {
      window.removeEventListener('storage', handleStorage);
      window.removeEventListener('boneThief.preferencesChanged', syncSavedNickname);
    };
  }, []);

  return (
    <main className="home-shell">
      <section className="home-copy">
        <div className="brand-row">
          <span className="brand-mark">🦴</span>
          <div>
            <p className="eyebrow">{language === 'EN' ? 'Who took the bone?' : 'Ai Lấy Xương?'}</p>
            <h1>Bone Thief</h1>
          </div>
        </div>
        <p className="lead">
          {language === 'EN' 
            ? 'Enter the yard, keep Kennel secret, and find the thief together.' 
            : 'Vào sân, giữ bí mật trong chuồng riêng, rồi cùng cả bầy tìm người chơi đã lấy xương.'}
        </p>
        <div className="home-stacked-cards">
          <img src="/bone-thief.png" className="stacked-card card-1" alt="Thẻ bài trộm" />
          <img src="/yard-dog-1.png" className="stacked-card card-2" alt="Thẻ bài canh" />
          <img src="/yard-dog-2.png" className="stacked-card card-3" alt="Thẻ bài canh" />
        </div>
      </section>

      <section className="home-actions" aria-label={language === 'EN' ? 'Create or join room' : 'Tạo hoặc vào phòng'}>
        <form className="panel" onSubmit={submitCreate}>
          <div className="panel-heading">
            <span>🏡</span>
            <h2>{language === 'EN' ? 'Create new yard' : 'Tạo sân mới'}</h2>
          </div>
          <label>
            Nickname
            <input
              value={createName}
              onChange={event => {
                setCreateName(event.target.value);
                localStorage.setItem(NICKNAME_KEY, event.target.value);
              }}
              placeholder={language === 'EN' ? 'Your name' : 'Tên của bạn'}
              maxLength={24}
            />
          </label>
          <label>
            {language === 'EN' ? 'Players' : 'Số chú chó'}
            <select value={maxPlayers} onChange={event => setMaxPlayers(Number(event.target.value))}>
              {[4, 5, 6, 7, 8].map(count => (
                <option value={count} key={count}>
                  {count} {language === 'EN' ? 'Players' : 'Chó'}
                </option>
              ))}
            </select>
          </label>
          <label>
            {language === 'EN' ? 'Room password' : 'Password phòng'}
            <input
              value={createPassword}
              onChange={event => setCreatePassword(event.target.value)}
              placeholder={language === 'EN' ? 'Optional' : 'Có thể để trống'}
              maxLength={40}
              type="password"
            />
          </label>
          <button className="primary-button" disabled={loading}>
            {language === 'EN' ? 'Create room' : 'Tạo phòng'}
          </button>
        </form>

        <form className="panel" onSubmit={submitJoin}>
          <div className="panel-heading">
            <span>🐶</span>
            <h2>{language === 'EN' ? 'Join existing yard' : 'Vào sân có sẵn'}</h2>
          </div>
          <label>
            {language === 'EN' ? 'Room code' : 'Mã phòng'}
            <input
              value={roomCode}
              onChange={event => setRoomCode(event.target.value.toUpperCase())}
              placeholder={language === 'EN' ? 'e.g. BONE7' : 'VD: BONE7'}
              maxLength={8}
            />
          </label>
          <label>
            Nickname
            <input
              value={joinName}
              onChange={event => {
                setJoinName(event.target.value);
                localStorage.setItem(NICKNAME_KEY, event.target.value);
              }}
              placeholder={language === 'EN' ? 'Your name' : 'Tên của bạn'}
              maxLength={24}
            />
          </label>
          <label>
            {language === 'EN' ? 'Room password' : 'Password phòng'}
            <input
              value={joinPassword}
              onChange={event => setJoinPassword(event.target.value)}
              placeholder={language === 'EN' ? 'Enter if room is locked' : 'Nhập nếu phòng có khóa'}
              maxLength={40}
              type="password"
            />
          </label>
          <button className="secondary-button" disabled={loading || roomCode.trim().length === 0}>
            {language === 'EN' ? 'Join' : 'Tham gia'}
          </button>
        </form>
      </section>
    </main>
  );
}
