
import { useState, useRef, useEffect } from "react";
import axios from "axios";
import "../styles/ChatBox.css";

// Icônes SVG inline (même style que le reste de l'application)
const CHAT_ICONS = {
  bot: (
    <>
      <path d="M12 8V4H8" />
      <rect width="16" height="12" x="4" y="8" rx="2" />
      <path d="M2 14h2" />
      <path d="M20 14h2" />
      <path d="M15 13v2" />
      <path d="M9 13v2" />
    </>
  ),
  close: (
    <>
      <path d="M18 6 6 18" />
      <path d="m6 6 12 12" />
    </>
  ),
  send: (
    <>
      <path d="M14.536 21.686a.5.5 0 0 0 .937-.024l6.5-19a.496.496 0 0 0-.635-.635l-19 6.5a.5.5 0 0 0-.024.937l7.93 3.18a2 2 0 0 1 1.112 1.11z" />
      <path d="m21.854 2.147-10.94 10.939" />
    </>
  ),
  chat: <path d="M7.9 20A9 9 0 1 0 4 16.1L2 22Z" />,
};

function ChatIcon({ name }) {
  return (
    <svg
      className="chat-icon"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {CHAT_ICONS[name]}
    </svg>
  );
}

export default function ChatBox() {
  const [isOpen, setIsOpen] = useState(false);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const [messages, setMessages] = useState([
    {
      role: "assistant",
      text: "Bonjour ! Comment puis-je vous aider avec votre colis ?",
    },
  ]);

  const messagesEndRef = useRef(null);

  // Descendre automatiquement vers le dernier message
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({
      behavior: "smooth",
    });
  }, [messages, loading]);

  // Envoyer un message au backend
  const handleSend = async (e) => {
    e.preventDefault();

    const userMessage = message.trim();

    if (!userMessage || loading) return;

    setMessages((prev) => [
      ...prev,
      { role: "user", text: userMessage },
    ]);

    setMessage("");
    setLoading(true);

    try {
      const response = await axios.post(
        "http://localhost:3001/chat",
        { message: userMessage },
        { timeout: 30000 }
      );

      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          text:
            response.data.reply ||
            response.data.error ||
            "Aucune réponse reçue.",
        },
      ]);
    } catch (error) {
      console.error(
        "Erreur Chatbot :",
        error.response?.data || error.message
      );

      const errorMessage = error.response?.data?.error
        ? error.response.data.error
        : "Impossible de contacter le serveur. Vérifiez que le backend fonctionne sur le port 3001.";

      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          text: errorMessage,
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="floating-chat">
      {isOpen && (
        <div className="chat-window">
          {/* En-tête */}
          <div className="chat-header">
            <div className="chat-avatar">
              <ChatIcon name="bot" />
            </div>

            <div className="chat-header-info">
              <h3>Colis Assistant</h3>

              <span>
                <span className="online-dot"></span>
                Assistant disponible
              </span>
            </div>

            <button
              type="button"
              className="chat-close"
              onClick={() => setIsOpen(false)}
              aria-label="Fermer le chat"
            >
              <ChatIcon name="close" />
            </button>
          </div>

          {/* Messages */}
          <div className="chat-messages">
            {messages.map((msg, index) => (
              <div
                key={index}
                className={`chat-message ${msg.role}`}
              >
                <div className="chat-bubble">
                  {msg.text}
                </div>
              </div>
            ))}

            {loading && (
              <div className="chat-message assistant">
                <div className="chat-bubble typing">
                  L'assistant écrit...
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Zone de saisie */}
          <form
            className="chat-input-area"
            onSubmit={handleSend}
          >
            <input
              type="text"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Écrivez votre message..."
              disabled={loading}
              aria-label="Votre message"
            />

            <button
              type="submit"
              disabled={loading || !message.trim()}
              aria-label="Envoyer le message"
            >
              {loading ? "…" : <ChatIcon name="send" />}
            </button>
          </form>
        </div>
      )}

      {/* Bouton flottant */}
      <button
        type="button"
        className={`chat-toggle ${
          isOpen ? "chat-toggle-open" : ""
        }`}
        onClick={() => setIsOpen((prev) => !prev)}
        aria-label={isOpen ? "Fermer le chat" : "Ouvrir le chat"}
      >
        <ChatIcon name={isOpen ? "close" : "chat"} />

        {!isOpen && (
          <span className="chat-notification"></span>
        )}
      </button>
    </div>
  );
}