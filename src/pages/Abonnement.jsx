
import { useState } from "react";

const abonnements = [
  {
    nom: "Starter",
    description: "Pour commencer",
    prixMensuel: 0,
    prixAnnuel: 0,
    avantages: [
      "Gestion des colis",
      "Suivi des livraisons",
      "Tableau de bord",
      "Gestion de base",
    ],
  },
  {
    nom: "Pro",
    description: "Pour les professionnels",
    prixMensuel: 199,
    prixAnnuel: 1990,
    avantages: [
      "Toutes les fonctions Starter",
      "Gestion des livreurs",
      "Statistiques avancées",
      "Résumé intelligent par IA",
      "Assistance prioritaire",
    ],
  },
  {
    nom: "Entreprise",
    description: "Pour les grandes équipes",
    prixMensuel: 499,
    prixAnnuel: 4990,
    avantages: [
      "Toutes les fonctions Pro",
      "Gestion avancée des équipes",
      "Rapports détaillés",
      "Suivi des performances",
      "Support dédié",
    ],
  },
];

export default function Abonnement() {
  const [periode, setPeriode] = useState("mensuel");
  const [abonnementActuel, setAbonnementActuel] =
    useState("Starter");

  const choisirAbonnement = (nom) => {
    setAbonnementActuel(nom);
  };

  return (
    <div className="abonnement-page">
      <div className="abonnement-header">
        <div>
          <h1>Nos abonnements</h1>
          <p>
            Choisissez la formule adaptée à votre activité.
          </p>
        </div>

        <div className="abonnement-toggle">
          <button
            type="button"
            className={periode === "mensuel" ? "active" : ""}
            onClick={() => setPeriode("mensuel")}
          >
            Mensuel
          </button>

          <button
            type="button"
            className={periode === "annuel" ? "active" : ""}
            onClick={() => setPeriode("annuel")}
          >
            Annuel
          </button>
        </div>
      </div>

      <div className="abonnement-grid">
        {abonnements.map((offre) => {
          const prix =
            periode === "mensuel"
              ? offre.prixMensuel
              : offre.prixAnnuel;

          const selectionne =
            abonnementActuel === offre.nom;

          return (
            <div
              className={`abonnement-card ${
                offre.nom === "Pro" ? "abonnement-pro" : ""
              }`}
              key={offre.nom}
            >
              {offre.nom === "Pro" && (
                <span className="abonnement-populaire">
                  Le plus populaire
                </span>
              )}

              <h2>{offre.nom}</h2>
              <p className="abonnement-description">
                {offre.description}
              </p>

              <div className="abonnement-prix">
                <strong>{prix} DH</strong>
                <span>
                  / {periode === "mensuel" ? "mois" : "an"}
                </span>
              </div>

              {periode === "annuel" && prix > 0 && (
                <p className="abonnement-economie">
                  Équivalent à{" "}
                  {Math.round(prix / 12)} DH par mois
                </p>
              )}

              <div className="abonnement-separateur" />

              <ul className="abonnement-avantages">
                {offre.avantages.map((avantage) => (
                  <li key={avantage}>
                    <span className="avantage-check">✓</span>
                    {avantage}
                  </li>
                ))}
              </ul>

              <button
                type="button"
                className={`abonnement-button ${
                  selectionne ? "abonnement-button-active" : ""
                }`}
                onClick={() => choisirAbonnement(offre.nom)}
              >
                {selectionne
                  ? "Formule sélectionnée"
                  : `Choisir ${offre.nom}`}
              </button>
            </div>
          );
        })}
      </div>

      <div className="abonnement-note">
        <h3>Votre abonnement actuel</h3>
        <p>
          Formule sélectionnée : <strong>{abonnementActuel}</strong>
        </p>
        <p>
          La sélection est actuellement locale. Aucun paiement
          réel n'est effectué.
        </p>
      </div>
    </div>
  );
}