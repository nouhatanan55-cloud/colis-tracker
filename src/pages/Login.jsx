
import { useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import axios from "axios";
import { toast } from "react-toastify";

const API_USERS = "http://localhost:8000/users";

export default function Login() {
  const emailRef = useRef(null);
  const passwordRef = useRef(null);

  const navigate = useNavigate();

  const [erreur, setErreur] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (loading) return;

    const email = emailRef.current.value.trim().toLowerCase();
    const password = passwordRef.current.value;

    setErreur("");

    if (email === "") {
      setErreur("Veuillez saisir votre adresse email.");
      toast.error("Veuillez saisir votre adresse email.");
      return;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setErreur("L'adresse email n'est pas valide.");
      toast.error("L'adresse email n'est pas valide.");
      return;
    }

    if (password.length < 8) {
      setErreur(
        "Le mot de passe doit contenir au moins 8 caractères."
      );
      toast.error(
        "Le mot de passe doit contenir au moins 8 caractères."
      );
      return;
    }

    try {
      setLoading(true);

      const response = await axios.get(API_USERS);

      const users = Array.isArray(response.data)
        ? response.data
        : [];

      const utilisateur = users.find(
        (user) =>
          user.email?.toLowerCase() === email &&
          user.password === password
      );

      if (!utilisateur) {
        setErreur("Email ou mot de passe incorrect.");
        toast.error("Email ou mot de passe incorrect.");
        return;
      }

      sessionStorage.setItem(
        "colisTrackerUser",
        JSON.stringify({
          id: utilisateur.id,
          email: utilisateur.email,
          role: utilisateur.role || "admin",
        })
      );

      toast.success("Connexion réussie !");

      navigate("/dashboard", { replace: true });
    } catch (error) {
      console.error("Erreur de connexion :", error);

      setErreur(
        "Impossible de se connecter. Vérifiez le serveur."
      );

      toast.error(
        "Erreur de connexion. Vérifiez JSON Server."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="wrap">
      <div className="login-shell">
        <div className="login-box card">
          <div className="logo">
            <div className="mark">CT</div>

            <strong style={{ fontFamily: "Poppins" }}>
              Colis Tracker
            </strong>
          </div>

          <div className="tabs2">
            <span className="on">Se connecter</span>
            <Link to="/register">Créer un compte</Link>
          </div>

          <form onSubmit={handleSubmit} noValidate>
            <label>Adresse email</label>

            <input
              ref={emailRef}
              type="email"
              placeholder="vous@societe.com"
              autoComplete="email"
              required
            />

            <label>Mot de passe</label>

            <input
              ref={passwordRef}
              type="password"
              placeholder="Votre mot de passe"
              autoComplete="current-password"
              required
            />

            {erreur && (
              <p
                style={{
                  color: "var(--err)",
                  fontSize: "13px",
                  margin: "12px 0 0",
                }}
              >
                {erreur}
              </p>
            )}

            <button
              type="submit"
              className="btn block"
              disabled={loading}
            >
              {loading
                ? "Connexion en cours..."
                : "Se connecter"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}