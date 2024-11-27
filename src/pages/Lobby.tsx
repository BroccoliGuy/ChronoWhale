import React, { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { socket, connectSocket } from "../utils/socket";
import { useLanguage } from '../utils/LanguageContext'; // Import du hook de langue
import translations from "../store/translations"; // Import des traductions
import '../styles/Lobby.css';

const Lobby: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { nickname, roomCode, isHost, avatar } = location.state || { nickname: "", roomCode: "", isHost: false, avatar: "" }; // Avatar ajouté
  const { language, setLanguage } = useLanguage(); // Utilisation du hook de langue
  const t = translations[language]; // Accès aux traductions

  const [players, setPlayers] = useState<{ name: string; isHost: boolean; avatar: string; team?: number }[]>([
    { name: nickname, isHost, avatar, team: undefined }, // Ajouter l'avatar
  ]);
  const [inviteLink, setInviteLink] = useState<string>("");

  useEffect(() => {
    connectSocket();

    if (nickname && roomCode) {
      socket.emit("join-room", { roomCode, nickname, isHost, avatar }); // Transmettre l'avatar lors de la connexion
    }

    socket.on("update-players", (players: { name: string; isHost: boolean; avatar: string; team?: number }[]) => {
      setPlayers(players);
    });

    const handleUnload = () => {
      socket.emit("leave-room", { roomCode, nickname });
    };

    window.addEventListener("beforeunload", handleUnload);
    return () => {
      socket.off("update-players");
      socket.disconnect();
      window.removeEventListener("beforeunload", handleUnload);
    };
  }, [nickname, roomCode, isHost, avatar]);

  const generateInviteLink = () => {
    const baseUrl = window.location.origin;
    const link = `${baseUrl}#/?room=${roomCode}`;
    setInviteLink(link);
    navigator.clipboard.writeText(link);
    alert(t.inviteLinkCopied); // Traduction du message d'alerte
  };

  const handleJoinTeam = (team?: number) => {
    socket.emit("join-team", { roomCode, nickname, team });
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

  return (
    <div className="lobby-container">
      <h1>{t.lobbyTitle} {roomCode}</h1>
      <p>{t.welcome}, {nickname}!</p>

      {/* Sélecteur de langue */}
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
    </div>
  );
};

export default Lobby;