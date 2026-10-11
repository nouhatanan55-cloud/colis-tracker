
import { useEffect, useState } from "react";
import axios from "axios";
// CSS principal du projet dans global.css

const API_COLIS = "http://localhost:8000/colis";
const API_LIVREURS = "http://localhost:8001/livreurs";
const API_AI = "http://localhost:3001";

const statutInfo = {
  created: { label: "Créé", className: "created" },
  affecte: { label: "Affecté", className: "affecte" },
  transit: { label: "En transit", className: "transit" },
  delivered: { label: "Livré", className: "delivered" },
  failed: { label: "Échec", className: "failed" },
};

function getTracking(colis) {
  return colis.tracking || colis.id || "Non renseigné";
}

function getStatut(colis) {
  return String(colis.statut || "").trim().toLowerCase();
}

function getClient(colis) {
  return (
    colis.client ||
    colis.nomClient ||
    colis.destinataire ||
    "Non renseigné"
  );
}

function getLivreurColis(colis, livreur) {
  const memeId =
    colis.livreurId != null &&
    String(colis.livreurId) === String(livreur.id);

  const memeNom =
    String(colis.livreur || "").trim().toLowerCase() ===
    String(livreur.nom || "").trim().toLowerCase();

  // Priorité à l'identifiant pour éviter les doublons de noms.
  if (colis.livreurId != null) {
    return memeId;
  }

  // Compatibilité avec les anciens colis sans livreurId.
  return Boolean(colis.livreur) && memeNom;
}

export default function DashboardAdmin() {
  const [colis, setColis] = useState([]);
  const [loading, setLoading] = useState(true);
  const [colisError, setColisError] = useState("");

  const [livreurs, setLivreurs] = useState([]);
  const [livreursLoading, setLivreursLoading] = useState(true);
  const [livreursError, setLivreursError] = useState("");

  const [summary, setSummary] = useState("");
  const [summaryLoading, setSummaryLoading] = useState(true);
  const [summaryError, setSummaryError] = useState("");

  // Charger les colis et les livreurs
  const chargerDonnees = async () => {
    setLoading(true);
    setLivreursLoading(true);

    const resultats = await Promise.allSettled([
      axios.get(API_COLIS),
      axios.get(API_LIVREURS),
    ]);

    const resultColis = resultats[0];
    const resultLivreurs = resultats[1];

    if (resultColis.status === "fulfilled") {
      if (Array.isArray(resultColis.value.data)) {
        setColis(resultColis.value.data);
        setColisError("");
      } else {
        setColisError("Les données reçues ne sont pas une liste.");
      }
    } else {
      console.error("Erreur chargement colis :", resultColis.reason);
      setColisError(
        "Impossible de charger les colis. Vérifiez JSON Server sur le port 8000."
      );
    }

    if (resultLivreurs.status === "fulfilled") {
      if (Array.isArray(resultLivreurs.value.data)) {
        setLivreurs(resultLivreurs.value.data);
        setLivreursError("");
      } else {
        setLivreursError("Les données des livreurs sont invalides.");
      }
    } else {
      console.error(
        "Erreur chargement livreurs :",
        resultLivreurs.reason
      );
      setLivreursError(
        "Impossible de charger les livreurs. Vérifiez JSON Server sur le port 8001."
      );
    }

    setLoading(false);
    setLivreursLoading(false);
  };

  useEffect(() => {
    chargerDonnees();
  }, []);

  // Générer le résumé Gemini
  const chargerResumeIA = async () => {
    setSummaryLoading(true);
    setSummaryError("");

    try {
      const res = await axios.post(`${API_AI}/dashboard-summary`);
      setSummary(res.data.summary || "");
    } catch (error) {
      console.error("Erreur résumé IA :", error.response?.data || error);
      setSummaryError(
        "Impossible de générer le résumé IA. Vérifiez le backend Gemini."
      );
    } finally {
      setSummaryLoading(false);
    }
  };

  useEffect(() => {
    chargerResumeIA();
  }, []);

  // Statistiques générales des colis
  const stats = {
    total: colis.length,
    created: colis.filter((c) => getStatut(c) === "created").length,
    affecte: colis.filter((c) => getStatut(c) === "affecte").length,
    transit: colis.filter((c) => getStatut(c) === "transit").length,
    delivered: colis.filter((c) => getStatut(c) === "delivered").length,
    failed: colis.filter((c) => getStatut(c) === "failed").length,
  };

  // Statistiques par livreur
  const statistiquesLivreurs = livreurs.map((livreur) => {
    const colisAssignes = colis.filter((c) =>
      getLivreurColis(c, livreur)
    );

    const livres = colisAssignes.filter(
      (c) => getStatut(c) === "delivered"
    ).length;

    // Les colis failed ne sont pas livrés, donc restent dans ce total.
    const restants = colisAssignes.filter(
      (c) => getStatut(c) !== "delivered"
    ).length;

    const enCours = colisAssignes.filter((c) =>
      ["affecte", "transit"].includes(getStatut(c))
    ).length;

    return {
      ...livreur,
      total: colisAssignes.length,
      livres,
      restants,
      enCours,
    };
  });

  const totalLivreursActifs = livreurs.filter(
    (l) => String(l.statut || "").trim().toLowerCase() === "actif"
  ).length;

  const totalColisAssignes = statistiquesLivreurs.reduce(
    (total, l) => total + l.total,
    0
  );

  const totalColisLivres = statistiquesLivreurs.reduce(
    (total, l) => total + l.livres,
    0
  );

  const totalColisRestants = statistiquesLivreurs.reduce(
    (total, l) => total + l.restants,
    0
  );

  // Graphique des statuts
  const chartData = [
    { label: "Créés", value: stats.created, className: "created" },
    { label: "Affectés", value: stats.affecte, className: "affecte" },
    { label: "En transit", value: stats.transit, className: "transit" },
    { label: "Livrés", value: stats.delivered, className: "delivered" },
    { label: "Échecs", value: stats.failed, className: "failed" },
  ];

  const maxChartValue = Math.max(
    ...chartData.map((item) => item.value),
    1
  );

  const recentColis = [...colis].slice(-5).reverse();

  return (
    <div className="dashboard-admin">
      {/* En-tête */}
      <div className="dashboard-title">
        <div>
          <h1>Dashboard</h1>
          <p>Vue générale de votre activité de livraison.</p>
        </div>

        <button
          type="button"
          className="refresh-button"
          onClick={chargerDonnees}
          disabled={loading || livreursLoading}
        >
          ↻ Actualiser
        </button>
      </div>

      {colisError && (
        <p className="dashboard-error">{colisError}</p>
      )}

      {/* Statistiques générales */}
      <section className="stats-grid">
        <div className="stat-card">
          <p>Total des colis</p>
          <h2>{loading ? "..." : stats.total}</h2>
        </div>

        <div className="stat-card">
          <p>En attente</p>
          <h2>{loading ? "..." : stats.created}</h2>
        </div>

        <div className="stat-card">
          <p>En transit</p>
          <h2>{loading ? "..." : stats.transit}</h2>
        </div>

        <div className="stat-card">
          <p>Livrés</p>
          <h2>{loading ? "..." : stats.delivered}</h2>
        </div>

        <div className="stat-card">
          <p>Échecs</p>
          <h2>{loading ? "..." : stats.failed}</h2>
        </div>
      </section>

      {/* Résumé Gemini AI */}
      <section className="ai-card">
        <div className="ai-head">
          <span className="ai-badge">AI</span>

          <div>
            <h2>Résumé intelligent du tableau de bord</h2>
            <p>
              Analyse générée par Gemini à partir des données des colis.
            </p>
          </div>
        </div>

        {summaryLoading && (
          <p className="ai-message">
            Gemini analyse les données du tableau de bord...
          </p>
        )}

        {!summaryLoading && summaryError && (
          <div className="ai-error">
            <p>{summaryError}</p>
            <button type="button" onClick={chargerResumeIA}>
              Réessayer
            </button>
          </div>
        )}

        {!summaryLoading && !summaryError && summary && (
          <div className="ai-summary">
            {summary
              .split("\n")
              .map((line) => line.trim())
              .filter(Boolean)
              .map((line, index) => (
                <div className="ai-line" key={index}>
                  <p>
                    {line.replace(/^\s*(?:[-*•]|\d+[.)])\s*/, "")}
                  </p>
                </div>
              ))}
          </div>
        )}
      </section>

      {/* Graphique des statuts */}
      <section className="chart-card">
        <div className="section-heading">
          <h2>Répartition des colis</h2>
          <span>Selon le statut actuel</span>
        </div>

        {loading ? (
          <p>Chargement du graphique...</p>
        ) : (
          <div className="chart-list">
            {chartData.map((item) => (
              <div className="chart-row" key={item.label}>
                <div className="chart-label">
                  <span>{item.label}</span>
                  <strong>{item.value}</strong>
                </div>

                <div className="chart-track">
                  <div
                    className={`chart-bar ${item.className}`}
                    style={{
                      width: `${(item.value / maxChartValue) * 100}%`,
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Dashboard des livreurs */}
      <section className="livreurs-dashboard">
        <div className="section-heading">
          <div>
            <h2>Performance des livreurs</h2>
            <span>
              Suivi des colis assignés, livrés et restants
            </span>
          </div>
        </div>

        {livreursError && (
          <p className="dashboard-error">{livreursError}</p>
        )}

        {livreursLoading || loading ? (
          <p>Chargement des statistiques des livreurs...</p>
        ) : (
          <>
            <div className="livreurs-stats-grid">
              <div className="livreur-stat-card">
                <div>
                  <p>Livreurs actifs</p>
                  <h3>{totalLivreursActifs}</h3>
                </div>
              </div>

              <div className="livreur-stat-card">
                <div>
                  <p>Colis assignés</p>
                  <h3>{totalColisAssignes}</h3>
                </div>
              </div>

              <div className="livreur-stat-card">
                <div>
                  <p>Colis livrés</p>
                  <h3>{totalColisLivres}</h3>
                </div>
              </div>

              <div className="livreur-stat-card">
                <div>
                  <p>Colis non livrés</p>
                  <h3>{totalColisRestants}</h3>
                </div>
              </div>
            </div>

            <div className="livreurs-table-wrapper">
              <table className="livreurs-table">
                <thead>
                  <tr>
                    <th>Livreur</th>
                    <th>Ville</th>
                    <th>Statut</th>
                    <th>Assignés</th>
                    <th>Livrés</th>
                    <th>En cours</th>
                    <th>Restants</th>
                    <th>Progression</th>
                  </tr>
                </thead>

                <tbody>
                  {statistiquesLivreurs.map((livreur) => {
                    const progression =
                      livreur.total > 0
                        ? Math.round(
                            (livreur.livres / livreur.total) * 100
                          )
                        : 0;

                    const actif =
                      String(livreur.statut || "")
                        .trim()
                        .toLowerCase() === "actif";

                    return (
                      <tr key={livreur.id}>
                        <td>
                          <strong>
                            {livreur.nom || "Sans nom"}
                          </strong>
                          <small className="livreur-phone">
                            {livreur.telephone || "—"}
                          </small>
                        </td>

                        <td>{livreur.ville || "—"}</td>

                        <td>
                          <span
                            className={`livreur-status ${
                              actif
                                ? "livreur-active"
                                : "livreur-inactive"
                            }`}
                          >
                            {livreur.statut || "Inconnu"}
                          </span>
                        </td>

                        <td>
                          <strong>{livreur.total}</strong>
                        </td>

                        <td>
                          <span className="livreur-delivered">
                            {livreur.livres}
                          </span>
                        </td>

                        <td>{livreur.enCours}</td>

                        <td>
                          <span className="livreur-remaining">
                            {livreur.restants}
                          </span>
                        </td>

                        <td>
                          <div className="livreur-progress-container">
                            <div className="livreur-progress-track">
                              <div
                                className="livreur-progress-bar"
                                style={{
                                  width: `${progression}%`,
                                }}
                              />
                            </div>
                            <span>{progression}%</span>
                          </div>
                        </td>
                      </tr>
                    );
                  })}

                  {statistiquesLivreurs.length === 0 && (
                    <tr>
                      <td colSpan="8" className="livreurs-empty">
                        Aucun livreur enregistré.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </>
        )}
      </section>

      {/* Derniers colis */}
      <section className="parcels-card">
        <div className="section-heading">
          <h2>Derniers colis</h2>
          <span>{colis.length} colis au total</span>
        </div>

        {loading ? (
          <p>Chargement des colis...</p>
        ) : recentColis.length === 0 ? (
          <p>Aucun colis enregistré pour le moment.</p>
        ) : (
          <div className="table-wrapper">
            <table className="parcels-table">
              <thead>
                <tr>
                  <th>N° de suivi</th>
                  <th>Client</th>
                  <th>Ville</th>
                  <th>Statut</th>
                  <th>Date</th>
                </tr>
              </thead>

              <tbody>
                {recentColis.map((item, index) => {
                  const statut = statutInfo[getStatut(item)];

                  return (
                    <tr key={item.id || item.tracking || index}>
                      <td>{getTracking(item)}</td>
                      <td>{getClient(item)}</td>
                      <td>{item.ville || "Non renseignée"}</td>
                      <td>
                        <span
                          className={`status-badge ${
                            statut?.className || "unknown"
                          }`}
                        >
                          {statut?.label || item.statut || "Inconnu"}
                        </span>
                      </td>
                      <td>{item.date || "—"}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}