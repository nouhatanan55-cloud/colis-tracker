
import { useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import axios from "axios";
import { toast } from "react-toastify";

const API_USERS = "http://localhost:8000/users";

export default function FormulaireRegister() {
  const navigate = useNavigate();

  const emailRef = useRef(null);
  const confirmEmailRef = useRef(null);
  const passwordRef = useRef(null);
  const confirmPasswordRef = useRef(null);

  const [loading, setLoading] = useState(false);

  const verifierEmail = (email) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  };

  const verifierPassword = (password) => {
    return (
      password.length >= 8 &&
      /[A-Z]/.test(password) &&
      /[a-z]/.test(password) &&
      /[0-9]/.test(password)
    );
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (loading) return;

    const email = emailRef.current.value.trim().toLowerCase();
    const confirmEmail = confirmEmailRef.current.value
      .trim()
      .toLowerCase();

    const password = passwordRef.current.value;
    const confirmPassword = confirmPasswordRef.current.value;

    if (!verifierEmail(email)) {
      toast.error("Veuillez saisir une adresse email valide.");
      return;
    }

    if (email !== confirmEmail) {
      toast.error("Les adresses email ne correspondent pas.");
      return;
    }

    if (!verifierPassword(password)) {
      toast.error(
        "Le mot de passe doit contenir au moins 8 caractères, une majuscule, une minuscule et un chiffre."
      );
      return;
    }

    if (password !== confirmPassword) {
      toast.error("Les mots de passe ne correspondent pas.");
      return;
    }

    try {
      setLoading(true);

      const response = await axios.get(API_USERS);

      const users = Array.isArray(response.data)
        ? response.data
        : [];

      const existe = users.some(
        (user) => user.email?.toLowerCase() === email
      );

      if (existe) {
        toast.error("Cette adresse email possède déjà un compte.");
        return;
      }

      await axios.post(API_USERS, {
        email,
        password,
        role: "admin",
        dateCreation: new Date().toISOString(),
      });

      toast.success("Compte créé avec succès !");

      e.target.reset();

      setTimeout(() => {
        navigate("/login");
      }, 800);
    } catch (error) {
      console.error("Erreur inscription :", error);

      toast.error(
        "Impossible de créer le compte. Vérifiez JSON Server."
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

          <h2>Créer un compte</h2>
          <p>Inscrivez-vous pour accéder à votre espace.</p>

          <div className="tabs2">
            <Link to="/login">Se connecter</Link>
            <span className="on">Créer un compte</span>
          </div>

          <form onSubmit={handleSubmit} noValidate>
            <label>Adresse email</label>
            <input
              type="email"
              ref={emailRef}
              placeholder="vous@societe.com"
              autoComplete="email"
              required
            />

            <label>Confirmer l'email</label>
            <input
              type="email"
              ref={confirmEmailRef}
              placeholder="Confirmer votre email"
              autoComplete="off"
              required
            />

            <label>Mot de passe</label>
            <input
              type="password"
              ref={passwordRef}
              placeholder="8 caractères minimum"
              autoComplete="new-password"
              required
            />

            <label>Confirmer le mot de passe</label>
            <input
              type="password"
              ref={confirmPasswordRef}
              placeholder="Confirmer votre mot de passe"
              autoComplete="new-password"
              required
            />

            <button
              type="submit"
              className="btn block"
              disabled={loading}
            >
              {loading ? "Création en cours..." : "Créer mon compte"}
            </button>
          </form>

          <p style={{ textAlign: "center", marginTop: "18px" }}>
            Vous avez déjà un compte ?{" "}
            <Link to="/login">Se connecter</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
