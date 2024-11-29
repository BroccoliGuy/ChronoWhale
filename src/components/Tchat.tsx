import React, { useState, useEffect, useRef } from "react";
import { socket } from "../utils/socket";
import "../styles/Tchat.css";

const Tchat: React.FC<{ roomCode: string; nickname: string; isInTeam: boolean }> = ({ roomCode, nickname, isInTeam }) => {
  const [messages, setMessages] = useState<{ sender: string; content: string; scope: string; team?: number }[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [messageScope, setMessageScope] = useState<"global" | "team">("global");
  
  // Référence pour la dernière div de message
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const storedMessages = localStorage.getItem(`messages-${roomCode}`);
    if (storedMessages) {
      setMessages(JSON.parse(storedMessages));
    }

    const handleReceiveMessage = (message: { sender: string; content: string; scope: string; team?: number }) => {
      setMessages((prevMessages) => {
        const updatedMessages = [...prevMessages, message];
        localStorage.setItem(`messages-${roomCode}`, JSON.stringify(updatedMessages));
        return updatedMessages;
      });
    };

    socket.on("receive-message", handleReceiveMessage);

    return () => {
      socket.off("receive-message", handleReceiveMessage);
    };
  }, [roomCode]);

  useEffect(() => {
    // Lorsque les messages changent, on fait défiler vers le bas
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]); // Dépendance sur messages pour activer le défilement

  const handleSendMessage = () => {
    if (newMessage.trim()) {
      const message = { sender: nickname, content: newMessage, scope: messageScope };
      socket.emit("send-message", { roomCode, message });
      setNewMessage("");
    }
  };

  const getPlayerColor = (team?: number) => {
    if (team === 1) return "blue";  // Équipe 1 : bleu
    if (team === 2) return "orange"; // Équipe 2 : orange
    return "white"; // Pas d'équipe : blanc
  };

  return (
    <div className="tchat-container">
      <div className="messages">
        {messages.map((msg, index) => (
          <div key={index} className={`message ${msg.sender === nickname ? "own" : ""}`}>
            <strong style={{ color: getPlayerColor(msg.team) }}>{msg.sender}:</strong> {msg.content} 
            {msg.scope === "team" && <span className="tag">(Team)</span>}
          </div>
        ))}
        {/* Cette div permet de défiler automatiquement */}
        <div ref={messagesEndRef} />
      </div>
      <div className="input-container">
        <select
          value={messageScope}
          onChange={(e) => setMessageScope(e.target.value as "global" | "team")}
          className="scope-select"
          disabled={!isInTeam}
        >
          <option value="global">Global</option>
          <option value="team" disabled={!isInTeam}>Team</option>
        </select>
        <input
          type="text"
          value={newMessage}
          placeholder="Type your message..."
          onChange={(e) => setNewMessage(e.target.value)}
          onKeyPress={(e) => e.key === "Enter" && handleSendMessage()}
        />
        <button onClick={handleSendMessage}>Send</button>
      </div>
    </div>
  );
};

export default Tchat;
