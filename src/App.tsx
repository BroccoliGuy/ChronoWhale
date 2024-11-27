import React from "react";
import { HashRouter as Router, Routes, Route } from "react-router-dom";
import Home from "./pages/Home";
import Lobby from "./pages/Lobby";
import { LanguageProvider } from "../src/utils/LanguageContext"; // Import du contexte de langue

const App: React.FC = () => {
  return (
    <LanguageProvider> {/* Enveloppe l'application avec le contexte de langue */}
      <Router>
        <Routes>
          {/* Route pour la page d'accueil */}
          <Route path="/" element={<Home />} />

          {/* Route pour le lobby */}
          <Route path="/lobby" element={<Lobby />} />

          {/* Gestion des liens d'invitation */}
          <Route
            path="/:roomCode"
            element={<Home />}
          />
        </Routes>
      </Router>
    </LanguageProvider>
  );
};

export default App;
