import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaChevronLeft, FaChevronRight, FaSync } from 'react-icons/fa'; // Import des icônes
import { useLanguage } from '../utils/LanguageContext';
import translations from '../store/translations';
import avatars from '../assets/avatars/avatar';
import '../styles/Home.css';
import io from 'socket.io-client';

// Connexion au serveur Socket.io
const socket = io('http://localhost:3001'); // Remplacez par votre URL de serveur si nécessaire

const Home: React.FC = () => {
  const [nickname, setNickname] = useState<string>('');
  const [roomCode, setRoomCode] = useState<string>('');
  const [roomCodeFromLink, setRoomCodeFromLink] = useState<string | null>(null);
  const [avatarKeys, setAvatarKeys] = useState<string[]>([]);
  const [avatarIndex, setAvatarIndex] = useState<number>(0);
  const [availableRooms, setAvailableRooms] = useState<{ roomCode: string; players: number; host: string }[]>([]);
  const { language, setLanguage } = useLanguage();
  const navigate = useNavigate();

  const [isLoading, setIsLoading] = useState<boolean>(false); // Ajout de l'état pour le spinner

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

    // Demander les salons disponibles au serveur au chargement de la page
    socket.emit('get-rooms');
    
    // Écouter la mise à jour des salons
    socket.on('update-rooms', (rooms) => {
      setAvailableRooms(rooms);
    });

    // Nettoyage lors du démontage
    return () => {
      socket.off('update-rooms');
    };
  }, []);

  // Fonction pour rafraîchir la liste des salons
  const refreshRooms = () => {
    setIsLoading(true); // Commencer l'animation
    socket.emit('get-rooms');
    
    // Arrêter l'animation après une courte période
    setTimeout(() => setIsLoading(false), 1000); // Stoppe le spin après 1 seconde (vous pouvez ajuster le délai)
  };

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

      {/* Affichage des salons disponibles */}
      <div className="available-rooms">
      <h2>Salons disponibles</h2>
      {availableRooms.length > 0 ? (
        <ul>
          {availableRooms.map((room) => (
            <li key={room.roomCode}>
              <span>
                {t.roomOf} {room.host} - {t.players} : {room.players} {/* Afficher l'hôte au lieu du code du salon */}
              </span>
              <button onClick={() => setRoomCode(room.roomCode)}>
                {t.join}
              </button>
            </li>
          ))}
        </ul>
      ) : (
        <p>Aucun salon disponible pour le moment.</p>
      )}
      {/* Bouton de rafraîchissement avec icône de reload */}
      <button onClick={refreshRooms} className={`reload-button ${isLoading ? 'loading' : ''}`}>
        <FaSync className={isLoading ? 'spinning' : ''} />
      </button>
    </div>
      <p>Avatars by <a href="https://www.freepik.com" target="_blank" rel="noopener noreferrer">Freepik</a></p>
    </div>
  );
};

export default Home;
