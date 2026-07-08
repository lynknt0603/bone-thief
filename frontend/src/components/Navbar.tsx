import { useState } from 'react';
import type { RoomLanguage } from '../types';
import { dogIcons } from '../labels';

const AUTO_READY_KEY = 'boneThief.autoReady';
const LANGUAGE_KEY = 'boneThief.language';
const NICKNAME_KEY = 'boneThief.nickname';
const ICON_KEY = 'boneThief.icon';

interface NavbarProps {
  connected: boolean;
  inRoom: boolean;
  language: RoomLanguage;
  onHome: () => void;
  onPreferencesChanged: () => void;
}

export function Navbar({ connected, inRoom, language, onHome, onPreferencesChanged }: NavbarProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [settingsLanguage, setSettingsLanguage] = useState<RoomLanguage>(() =>
    localStorage.getItem(LANGUAGE_KEY) === 'EN' ? 'EN' : 'VI',
  );
  const [settingsNickname, setSettingsNickname] = useState(() => localStorage.getItem(NICKNAME_KEY) ?? '');
  const [settingsIcon, setSettingsIcon] = useState(() => localStorage.getItem(ICON_KEY) ?? '🐶');
  const [settingsAutoReady, setSettingsAutoReady] = useState(() => localStorage.getItem(AUTO_READY_KEY) === 'true');
  const [settingsStatus, setSettingsStatus] = useState('');

  const handleHomeClick = (event: React.MouseEvent) => {
    event.preventDefault();
    if (window.confirm(language === 'EN' ? 'Are you sure you want to leave the room?' : 'Bạn có chắc chắn muốn rời phòng để về trang chủ?')) {
      onHome();
      setMenuOpen(false);
    }
  };

  const openSettings = () => {
    setSettingsLanguage(localStorage.getItem(LANGUAGE_KEY) === 'EN' ? 'EN' : 'VI');
    setSettingsNickname(localStorage.getItem(NICKNAME_KEY) ?? '');
    setSettingsIcon(localStorage.getItem(ICON_KEY) ?? '🐶');
    setSettingsAutoReady(localStorage.getItem(AUTO_READY_KEY) === 'true');
    setSettingsStatus('');
    setSettingsOpen(true);
    setMenuOpen(false);
  };

  const saveSettings = (event: React.FormEvent) => {
    event.preventDefault();
    localStorage.setItem(LANGUAGE_KEY, settingsLanguage);
    localStorage.setItem(NICKNAME_KEY, settingsNickname.trim());
    localStorage.setItem(ICON_KEY, settingsIcon);
    localStorage.setItem(AUTO_READY_KEY, String(settingsAutoReady));
    window.dispatchEvent(new Event('boneThief.preferencesChanged'));
    setSettingsStatus(language === 'EN' ? 'Settings saved.' : 'Đã lưu cài đặt.');
    onPreferencesChanged();
  };

  return (
    <>
      <nav className="game-navbar">
        <div className="navbar-left">
          <a href="#" className="nav-icon-link" onClick={handleHomeClick} title={language === 'EN' ? 'Home' : 'Trang chủ'}>
            🏠
          </a>
          <a href="https://discord.gg/QXZ24mgbs" target="_blank" rel="noopener noreferrer" className="nav-icon-link" title="Discord">
            <svg viewBox="0 0 127.14 96.36" className="nav-svg-icon">
              <path d="M107.7,8.07A105.15,105.15,0,0,0,77.26,0a77.19,77.19,0,0,0-3.3,6.83A96.67,96.67,0,0,0,53.22,6.83,77.19,77.19,0,0,0,49.88,0,105.15,105.15,0,0,0,19.44,8.07C3.66,31.58-1.86,54.65,1,77.53A105.73,105.73,0,0,0,32,96.36a77.7,77.7,0,0,0,6.63-10.85,68.43,68.43,0,0,1-10.5-5c.88-.65,1.72-1.33,2.53-2a75.46,75.46,0,0,0,73,0c.81.71,1.65,1.39,2.53,2a68.43,68.43,0,0,1-10.5,5,77.7,77.7,0,0,0,6.63,10.85,105.73,105.73,0,0,0,31.06-18.83C129.24,48.24,123.36,25.41,107.7,8.07ZM42.45,65.69C36.18,65.69,31,60,31,53S36.18,40.36,42.45,40.36,53.83,46,53.83,53,48.72,65.69,42.45,65.69Zm42.24,0C78.41,65.69,73.24,60,73.24,53S78.41,40.36,84.69,40.36,96.07,46,96.07,53,91,65.69,84.69,65.69Z" fill="currentColor" />
            </svg>
          </a>
          <a href="https://github.com/lynknt0603/bone-thief" target="_blank" rel="noopener noreferrer" className="nav-icon-link" title="GitHub">
            <svg viewBox="0 0 16 16" className="nav-svg-icon">
              <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0016 8c0-4.42-3.58-8-8-8z" fill="currentColor" />
            </svg>
          </a>

          {inRoom && (
            <div className="nav-conn-status">
              <span className={`conn-indicator ${connected ? 'online' : 'offline'}`} />
              <span className="conn-text">
                {connected
                  ? language === 'EN' ? 'Connected' : 'Đã kết nối'
                  : language === 'EN' ? 'Connecting...' : 'Đang kết nối...'}
              </span>
            </div>
          )}
        </div>

        <div className="navbar-right">
          <div className="nav-menu-container">
            <button className="nav-menu-button" onClick={() => setMenuOpen(current => !current)} type="button">
              MENU ☰
            </button>
            {menuOpen && (
              <div className="nav-dropdown-menu">
                <a href="#" onClick={handleHomeClick}>
                  {language === 'EN' ? 'Home' : 'Trang chủ'}
                </a>
                <a href={`${import.meta.env.BASE_URL}guide.html?lang=${language}`} target="_blank" rel="noopener noreferrer" onClick={() => setMenuOpen(false)}>
                  {language === 'EN' ? 'Guide' : 'Hướng dẫn'}
                </a>
                <button type="button" onClick={openSettings}>
                  {language === 'EN' ? 'Settings' : 'Cài đặt'}
                </button>
              </div>
            )}
          </div>
        </div>
      </nav>

      {settingsOpen && (
        <div className="settings-backdrop" data-open="true" onClick={() => setSettingsOpen(false)}>
          <section className="settings-panel" role="dialog" aria-modal="true" aria-labelledby="settings-title" onClick={event => event.stopPropagation()}>
            <h2 id="settings-title">{language === 'EN' ? 'Settings' : 'Cài Đặt'}</h2>
            <p>{language === 'EN' ? 'These preferences are stored in this browser.' : 'Thiết lập này được lưu trên trình duyệt và dùng lại khi bạn mở game.'}</p>
            <form onSubmit={saveSettings}>
              <label>
                {language === 'EN' ? 'Language' : 'Ngôn ngữ'}
                <select value={settingsLanguage} onChange={event => setSettingsLanguage(event.target.value as RoomLanguage)}>
                  <option value="VI">Tiếng Việt</option>
                  <option value="EN">English</option>
                </select>
              </label>
              <label>
                {language === 'EN' ? 'Default nickname' : 'Nickname mặc định'}
                <input value={settingsNickname} onChange={event => setSettingsNickname(event.target.value)} maxLength={12} placeholder={language === 'EN' ? 'Your Dog name' : 'Tên Dog của bạn'} />
              </label>
              <label>
                {language === 'EN' ? 'Dog Icon' : 'Biểu tượng Chó'}
                <div className="icon-selector-grid">
                  {dogIcons.map(icon => (
                    <button
                      key={icon}
                      type="button"
                      className={`icon-tile ${settingsIcon === icon ? 'selected' : ''}`}
                      onClick={() => setSettingsIcon(icon)}
                    >
                      {icon}
                    </button>
                  ))}
                </div>
              </label>
              <label className="settings-check">
                <input type="checkbox" checked={settingsAutoReady} onChange={event => setSettingsAutoReady(event.target.checked)} />
                <span>{language === 'EN' ? 'Auto ready in lobby' : 'Tự động sẵn sàng khi ở phòng chờ'}</span>
              </label>
              <p className="settings-status">{settingsStatus}</p>
              <div className="settings-actions">
                <button className="ghost-button" type="button" onClick={() => setSettingsOpen(false)}>
                  {language === 'EN' ? 'Close' : 'Đóng'}
                </button>
                <button className="primary-button" type="submit">
                  {language === 'EN' ? 'Save settings' : 'Lưu cài đặt'}
                </button>
              </div>
            </form>
          </section>
        </div>
      )}
    </>
  );
}
