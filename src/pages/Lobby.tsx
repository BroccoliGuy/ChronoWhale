import React, { useCallback, useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { socket, connectSocket } from "../utils/socket";
import { useLanguage } from '../utils/LanguageContext';
import translations from "../store/translations";
import Tchat from "../components/Tchat";
import '../styles/Lobby.css';

const Lobby: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { nickname, roomCode, isHost, avatar } = location.state || { nickname: "", roomCode: "", isHost: false, avatar: "" };
  const { language, setLanguage } = useLanguage();
  const t = translations[language];

  const [players, setPlayers] = useState<{ name: string; isHost: boolean; avatar: string; team?: number }[]>([]);
  const [inviteLink, setInviteLink] = useState<string>("");
  const [isLoading, setIsLoading] = useState(true);  // Ajout de l'état de chargement

  // Utilisation de useCallback pour éviter les dépendances inutiles
  const handleJoinTeam = useCallback((team?: number) => {
    // Sauvegarder l'équipe dans localStorage
    if (team !== undefined) {
      localStorage.setItem(`${nickname}-team`, team.toString());
    } else {
      localStorage.removeItem(`${nickname}-team`);
    }

    socket.emit("join-team", { roomCode, nickname, team });
  }, [nickname, roomCode]);

  useEffect(() => {
    connectSocket();

    if (nickname && roomCode) {
      socket.emit("join-room", { roomCode, nickname, isHost, avatar });

      // Récupérer l'équipe de l'utilisateur depuis localStorage
      const storedTeam = localStorage.getItem(`${nickname}-team`);
      if (storedTeam) {
        const team = parseInt(storedTeam, 10);
        handleJoinTeam(team);  // Attribuer immédiatement l'équipe
      }

      // Mettre à jour la liste des joueurs
      socket.on("update-players", (players: { name: string; isHost: boolean; avatar: string; team?: number }[]) => {
        setPlayers(players);
        setIsLoading(false);  // Indiquer que les informations sont prêtes
      });
    }

    const handleUnload = () => {
      socket.emit("leave-room", { roomCode, nickname });
    };

    window.addEventListener("beforeunload", handleUnload);
    return () => {
      socket.off("update-players");
      socket.disconnect();
      window.removeEventListener("beforeunload", handleUnload);
    };
  }, [nickname, roomCode, isHost, avatar, handleJoinTeam]);

  const generateInviteLink = () => {
    const baseUrl = window.location.origin + '/ChronoWhale';
    const link = `${baseUrl}/?room=${roomCode}`;
    setInviteLink(link);
    navigator.clipboard.writeText(link);
    alert(t.inviteLinkCopied);
  };

  const assignTeamsRandomly = () => {
    socket.emit("assign-teams-randomly", { roomCode });
  };

  const handleLeaveRoom = () => {
    socket.emit("leave-room", { roomCode, nickname });
    navigate("/");
  };

  const team1 = players.filter((player) => player.team === 1);
  const team2 = players.filter((player) => player.team === 2);
  const noTeam = players.filter((player) => player.team === undefined);

  const isTeam1Full = team1.length >= 2;
  const isTeam2Full = team2.length >= 2;

  const team1ButtonText = isTeam1Full ? t.teamFull : `${t.joinTeam}: ${team1.length}/2`;
  const team2ButtonText = isTeam2Full ? t.teamFull : `${t.joinTeam}: ${team2.length}/2`;

  // Vérifier si l'utilisateur est dans une équipe
  const isInTeam = players.some(player => player.name === nickname && player.team !== undefined);

  if (isLoading) {
    // Afficher un écran de chargement ou un placeholder pendant la récupération des données
    return <div>Loading...</div>;
  }

  return (
    <div className="lobby-container">
      <h1>{t.lobbyTitle} {roomCode}</h1>
      <p>{t.welcome}, {nickname}!</p>

      <select
        value={language}
        onChange={(e) => setLanguage(e.target.value as 'fr' | 'en')}
      >
        <option value="fr">Français</option>
        <option value="en">English</option>
      </select>

      <div className="teams-container">
        <div className="team no-team">
          <h2>{t.noTeam}</h2>
          <ul>
            {noTeam.map((player, index) => (
              <li key={index}>
                <img src={player.avatar} alt={`${player.name}'s avatar`} className="player-avatar" />
                {player.name} {player.isHost && <span>({t.host})</span>}
              </li>
            ))}
          </ul>
        </div>
        <div className="team">
          <h2>{t.team1}</h2>
          <ul>
            {team1.map((player, index) => (
              <li key={index}>
                <img src={player.avatar} alt={`${player.name}'s avatar`} className="player-avatar" />
                {player.name} {player.isHost && <span>({t.host})</span>}
              </li>
            ))}
          </ul>
        </div>
        <div className="team">
          <h2>{t.team2}</h2>
          <ul>
            {team2.map((player, index) => (
              <li key={index}>
                <img src={player.avatar} alt={`${player.name}'s avatar`} className="player-avatar" />
                {player.name} {player.isHost && <span>({t.host})</span>}
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div className="buttons">
        <button onClick={() => handleJoinTeam(undefined)}>{t.leaveTeam}</button>
        <button onClick={() => handleJoinTeam(1)} disabled={isTeam1Full}>
          {team1ButtonText}
        </button>
        <button onClick={() => handleJoinTeam(2)} disabled={isTeam2Full}>
          {team2ButtonText}
        </button>
        {isHost && (
          <button onClick={assignTeamsRandomly}>{t.assignTeams}</button>
        )}
      </div>

      <div>
        <button onClick={generateInviteLink}>{t.copyInviteLink}</button>
        {inviteLink && <p>{t.inviteLink}: <a href={inviteLink}>{inviteLink}</a></p>}
      </div>
      <button onClick={() => console.log("Commencer le jeu")}>{t.startGame}</button>
      <button onClick={handleLeaveRoom}>{t.leaveLobby}</button>

      {/* Passer isInTeam à Tchat */}
      <Tchat roomCode={roomCode} nickname={nickname} isInTeam={isInTeam} />
    </div>
  );
};

export default Lobby;
