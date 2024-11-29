import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaChevronLeft, FaChevronRight } from 'react-icons/fa'; // Import des icônes
import { useLanguage } from '../utils/LanguageContext';
import translations from '../store/translations';
import avatars from '../assets/avatars/avatar';
import '../styles/Home.css';


const Home: React.FC = () => {
  const [nickname, setNickname] = useState<string>('');
  const [roomCode, setRoomCode] = useState<string>('');
  const [roomCodeFromLink, setRoomCodeFromLink] = useState<string | null>(null);
  const [avatarKeys, setAvatarKeys] = useState<string[]>([]);
  const [avatarIndex, setAvatarIndex] = useState<number>(0);
  const { language, setLanguage } = useLanguage();
  const navigate = useNavigate();

  const t = translations[language];

  // Fonction pour mélanger un tableau
  const shuffleArray = (array: string[]) => {
    return array
      .map((value) => ({ value, sort: Math.random() }))
      .sort((a, b) => a.sort - b.sort)
      .map(({ value }) => value);
  };

  useEffect(() => {
    // Mélanger les avatars une seule fois au chargement de la page
    setAvatarKeys(shuffleArray(Object.keys(avatars)));

    const queryParams = new URLSearchParams(window.location.search);
    const roomCode = queryParams.get('room');
    if (roomCode) {
      setRoomCodeFromLink(roomCode);
    }
  }, []);

  const handleJoinRoom = () => {
    const codeToJoin = roomCodeFromLink || roomCode;
    if (nickname.trim() && codeToJoin.trim()) {
      navigate('/lobby', { state: { nickname, roomCode: codeToJoin, avatar: avatars[avatarKeys[avatarIndex]] } });
    }
  };

  const handleCreateRoom = () => {
    if (nickname.trim()) {
      const newRoomCode = generateRoomCode();
      navigate('/lobby', { state: { nickname, roomCode: newRoomCode, avatar: avatars[avatarKeys[avatarIndex]], isHost: true } });
    }
  };

  const generateRoomCode = () => Math.random().toString(36).substring(2, 8).toUpperCase();

  const handleNextAvatar = () =>
    setAvatarIndex((prev) => (prev + 1) % avatarKeys.length);

  const handlePreviousAvatar = () =>
    setAvatarIndex((prev) => (prev - 1 + avatarKeys.length) % avatarKeys.length);

  return (
    <div className="home-container">
      <h1>{t.title}</h1>

      <select
        value={language}
        onChange={(e) => setLanguage(e.target.value as 'fr' | 'en')}
      >
        <option value="fr">Français</option>
        <option value="en">English</option>
      </select>

      <input
        type="text"
        placeholder={t.enterNickname}
        value={nickname}
        onChange={(e) => setNickname(e.target.value)}
      />

      <div className="avatar-selector">
        <button onClick={handlePreviousAvatar} className="avatar-button">
          <FaChevronLeft />
        </button>
        <img
          src={avatars[avatarKeys[avatarIndex]]}
          alt="Avatar"
          className="avatar-image"
        />
        <button onClick={handleNextAvatar} className="avatar-button">
          <FaChevronRight />
        </button>
      </div>

      {!roomCodeFromLink && (
        <input
          type="text"
          placeholder={t.enterRoomCode}
          value={roomCode}
          onChange={(e) => setRoomCode(e.target.value)}
        />
      )}

      {(roomCodeFromLink || roomCode) && (
        <button
          onClick={handleJoinRoom}
          disabled={!nickname || !(roomCodeFromLink || roomCode)}
        >
          {t.joinRoom}
        </button>
      )}

      {!roomCodeFromLink && !roomCode && (
        <button onClick={handleCreateRoom} disabled={!nickname}>
          {t.createRoom}
        </button>
      )}
      <p>Avatars by <a href="https://www.freepik.com" target="_blank" rel="noopener noreferrer">Freepik</a></p>
    </div>
  );
};

export default Home;