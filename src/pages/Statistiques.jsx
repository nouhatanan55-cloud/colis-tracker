// Importation des hooks React nécessaires
import { useEffect, useMemo, useState } from "react";

// Importation d'Axios pour communiquer avec l'API
import axios from "axios";

// Importation du fichier CSS de la page Statistiques
import "../styles/Statistiques.css";

// URL de l'API JSON Server qui contient les colis
const API_COLIS = "http://localhost:8000/colis";

// =====================================================
// FONCTIONS UTILITAIRES
// =====================================================

// Récupère le statut du colis et normalise sa valeur
function getStatut(colis) {
  return String(colis.statut || "")
    .trim()
    .toLowerCase();
}

// Récupère la ville du colis
// Si la ville n'est pas renseignée, retourne un texte par défaut
function getVille(colis) {
  return String(colis.ville || "").trim() || "Non renseignée";
}

// Récupère le nom du livreur
// Si aucun livreur n'est attribué, retourne "Non attribué"
function getLivreur(colis) {
  return String(colis.livreur || "").trim() || "Non attribué";
}

// Convertit une date ISO ou au format JJ/MM/AAAA en objet Date
function parseDate(value) {
  // Vérifie si une date existe
  if (!value) return null;

  const text = String(value).trim();
  let date;

  // Vérifie si la date est au format français JJ/MM/AAAA
  const fr = text.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);

  if (fr) {
    // Crée une date à partir du jour, du mois et de l'année
    // En JavaScript, les mois commencent à 0
    date = new Date(Number(fr[3]), Number(fr[2]) - 1, Number(fr[1]));
  } else {
    // Essaie de convertir les autres formats de date
    date = new Date(text);
  }

  // Retourne null si la date est invalide
  if (Number.isNaN(date.getTime())) return null;

  // Met l'heure à zéro pour comparer uniquement les dates
  date.setHours(0, 0, 0, 0);

  return date;
}

// Formate une date au format français JJ/MM/AAAA
function formatDate(date) {
  return date.toLocaleDateString("fr-FR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

// Crée une clé unique pour identifier un mois
// Exemple : 2026-10
function getMonthKey(date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(
    2,
    "0",
  )}`;
}

// Convertit une clé de mois en libellé lisible
// Exemple : 2026-10 devient oct. 26
function getMonthLabel(key) {
  const [year, month] = key.split("-").map(Number);

  return new Date(year, month - 1, 1).toLocaleDateString("fr-FR", {
    month: "short",
    year: "2-digit",
  });
}

// =====================================================
// FONCTION D'EXPORTATION CSV
// =====================================================

// Transforme les données en fichier CSV puis lance le téléchargement
function downloadCSV(rows, filename) {
  // Transforme chaque ligne en texte CSV
  const content = rows
    .map((row) =>
      row
        .map(
          (value) =>
            // Protège les guillemets dans les valeurs
            `"${String(value ?? "").replace(/"/g, '""')}"`,
        )
        .join(";"),
    )
    .join("\r\n");

  // Crée le contenu du fichier CSV
  // BOM UTF-8 pour améliorer l'affichage des accents dans Excel
  const blob = new Blob(["\uFEFF" + content], {
    type: "text/csv;charset=utf-8;",
  });

  // Crée une URL temporaire pour le fichier
  const url = URL.createObjectURL(blob);

  // Crée un lien de téléchargement
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;

  // Ajoute le lien à la page et déclenche le téléchargement
  document.body.appendChild(link);
  link.click();

  // Supprime le lien après le téléchargement
  link.remove();

  // Libère l'URL temporaire
  URL.revokeObjectURL(url);
}

// =====================================================
// COMPOSANT PRINCIPAL : STATISTIQUES
// =====================================================

export default function Statistiques() {
  // Liste complète des colis récupérés depuis l'API
  const [colis, setColis] = useState([]);

  // Indique si les données sont en cours de chargement
  const [loading, setLoading] = useState(true);

  // Stocke un éventuel message d'erreur
  const [error, setError] = useState("");

  // Valeurs des filtres sélectionnés par l'utilisateur
  const [periode, setPeriode] = useState("all");
  const [ville, setVille] = useState("all");
  const [livreur, setLivreur] = useState("all");

  // Dates utilisées pour une période personnalisée
  const [dateDebut, setDateDebut] = useState("");
  const [dateFin, setDateFin] = useState("");

  // =====================================================
  // CHARGEMENT DES DONNÉES DEPUIS JSON SERVER
  // =====================================================

  // Exécute la requête une seule fois au chargement du composant
  useEffect(() => {
    axios
      .get(API_COLIS)
      .then((response) => {
        // Vérifie que la réponse contient bien une liste
        if (!Array.isArray(response.data)) {
          throw new Error("Les données reçues ne sont pas une liste.");
        }

        // Enregistre les colis dans le state
        setColis(response.data);

        // Efface le message d'erreur si le chargement réussit
        setError("");
      })
      .catch((err) => {
        // Affiche les détails de l'erreur dans la console
        console.error("Erreur chargement statistiques :", err);

        // Affiche un message destiné à l'utilisateur
        setError("Impossible de charger les données. Vérifiez JSON Server.");
      })
      .finally(() => {
        // Arrête le chargement, que la requête réussisse ou échoue
        setLoading(false);
      });
  }, []);

  // =====================================================
  // PRÉPARATION DES LISTES POUR LES FILTRES
  // =====================================================

  // Récupère les villes sans doublons et les trie par ordre alphabétique
  const villes = useMemo(
    () => [...new Set(colis.map(getVille))].sort(),
    [colis],
  );

  // Récupère les livreurs sans doublons
  // Exclut les colis qui n'ont aucun livreur attribué
  const livreurs = useMemo(
    () =>
      [...new Set(colis.map(getLivreur))]
        .filter((nom) => nom !== "Non attribué")
        .sort(),
    [colis],
  );

  // =====================================================
  // FILTRAGE DES COLIS
  // =====================================================

  // Filtre les colis selon la période, la ville et le livreur
  const filteredColis = useMemo(() => {
    const now = new Date();

    // Ignore les heures pour travailler uniquement avec les dates
    now.setHours(0, 0, 0, 0);

    let debut = null;
    let fin = null;

    // Filtre les colis des 7 derniers jours, aujourd'hui inclus
    if (periode === "7days") {
      debut = new Date(now);
      debut.setDate(debut.getDate() - 6);
      fin = now;
    }

    // Filtre les colis du mois actuel
    else if (periode === "month") {
      debut = new Date(now.getFullYear(), now.getMonth(), 1);
      fin = now;
    }

    // Utilise les dates choisies par l'utilisateur
    else if (periode === "custom") {
      debut = dateDebut ? parseDate(dateDebut) : null;
      fin = dateFin ? parseDate(dateFin) : null;
    }

    // Conserve uniquement les colis qui respectent les filtres
    return colis.filter((item) => {
      // Vérifie le filtre par ville
      if (ville !== "all" && getVille(item) !== ville) {
        return false;
      }

      // Vérifie le filtre par livreur
      if (livreur !== "all" && getLivreur(item) !== livreur) {
        return false;
      }

      // Vérifie le filtre par période
      if (periode !== "all") {
        const dateColis = parseDate(item.date);

        // Exclut les colis sans date valide pour une période limitée
        if (!dateColis) return false;

        // Exclut les colis antérieurs à la date de début
        if (debut && dateColis < debut) return false;

        // Exclut les colis postérieurs à la date de fin
        if (fin && dateColis > fin) return false;
      }

      // Le colis respecte tous les filtres
      return true;
    });
  }, [colis, periode, ville, livreur, dateDebut, dateFin]);

  // =====================================================
  // CALCUL DES STATISTIQUES GÉNÉRALES
  // =====================================================

  const stats = useMemo(() => {
    // Nombre total de colis après application des filtres
    const total = filteredColis.length;

    // Nombre de colis livrés
    const livres = filteredColis.filter(
      (c) => getStatut(c) === "delivered",
    ).length;

    // Nombre de colis en échec
    const echecs = filteredColis.filter(
      (c) => getStatut(c) === "failed",
    ).length;

    // Nombre de colis en cours de transport
    const transit = filteredColis.filter(
      (c) => getStatut(c) === "transit",
    ).length;

    // Nombre de colis créés
    const crees = filteredColis.filter(
      (c) => getStatut(c) === "created",
    ).length;

    // Nombre de colis dont le traitement est terminé
    const traites = livres + echecs;

    return {
      total,
      livres,
      echecs,
      transit,
      crees,

      // Calcule le taux de réussite en pourcentage
      // Retourne 0 si aucun colis n'a été traité
      tauxReussite: traites > 0 ? Math.round((livres / traites) * 100) : 0,

      // Nombre de villes différentes dans les résultats filtrés
      nbVilles: new Set(filteredColis.map(getVille)).size,

      // Nombre de livreurs différents ayant au moins un colis attribué
      nbLivreurs: new Set(
        filteredColis.map(getLivreur).filter((nom) => nom !== "Non attribué"),
      ).size,
    };
  }, [filteredColis]);

  // =====================================================
  // ÉVOLUTION MENSUELLE SUR LES 6 DERNIERS MOIS
  // =====================================================

  const evolution = useMemo(() => {
    const now = new Date();
    const months = [];

    // Prépare les 6 derniers mois calendaires
    for (let i = 5; i >= 0; i--) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1);

      const key = getMonthKey(date);

      // Initialise les compteurs de chaque mois
      months.push({
        key,
        label: getMonthLabel(key),
        total: 0,
        livres: 0,
        echecs: 0,
      });
    }

    // Crée un index permettant de retrouver rapidement chaque mois
    const index = new Map(months.map((m) => [m.key, m]));

    // Répartit les colis dans leurs mois respectifs
    filteredColis.forEach((item) => {
      const date = parseDate(item.date);

      // Ignore les colis sans date valide
      if (!date) return;

      const month = index.get(getMonthKey(date));

      // Ignore les colis qui ne font pas partie des 6 mois affichés
      if (!month) return;

      // Incrémente le nombre total de colis du mois
      month.total += 1;

      // Incrémente les livraisons réussies
      if (getStatut(item) === "delivered") {
        month.livres += 1;
      }

      // Incrémente les échecs de livraison
      if (getStatut(item) === "failed") {
        month.echecs += 1;
      }
    });

    return months;
  }, [filteredColis]);

  // Détermine le maximum pour calculer la hauteur des barres
  // La valeur minimale de 1 évite une division par zéro
  const maxEvolution = Math.max(...evolution.map((item) => item.total), 1);

  // =====================================================
  // STATISTIQUES PAR VILLE
  // =====================================================

  const villesStats = useMemo(() => {
    const map = new Map();

    // Regroupe les colis par ville
    filteredColis.forEach((item) => {
      const name = getVille(item);

      // Initialise les compteurs de la ville si nécessaire
      if (!map.has(name)) {
        map.set(name, {
          ville: name,
          total: 0,
          livres: 0,
          echecs: 0,
        });
      }

      const row = map.get(name);

      // Compte le nombre total de colis de cette ville
      row.total += 1;

      // Compte les colis livrés et les échecs
      if (getStatut(item) === "delivered") row.livres += 1;
      if (getStatut(item) === "failed") row.echecs += 1;
    });

    // Convertit les résultats en tableau et trie par volume décroissant
    return [...map.values()].sort((a, b) => b.total - a.total);
  }, [filteredColis]);

  // =====================================================
  // STATISTIQUES PAR LIVREUR
  // =====================================================

  const livreursStats = useMemo(() => {
    const map = new Map();

    // Regroupe les colis par livreur
    filteredColis.forEach((item) => {
      const name = getLivreur(item);

      // Ignore les colis sans livreur attribué
      if (name === "Non attribué") return;

      // Initialise les compteurs du livreur
      if (!map.has(name)) {
        map.set(name, {
          livreur: name,
          total: 0,
          livres: 0,
          echecs: 0,
        });
      }

      const row = map.get(name);

      // Compte les colis attribués à ce livreur
      row.total += 1;

      // Compte les livraisons réussies et les échecs
      if (getStatut(item) === "delivered") row.livres += 1;
      if (getStatut(item) === "failed") row.echecs += 1;
    });

    // Classe les livreurs selon le nombre de colis livrés
    return [...map.values()].sort((a, b) => b.livres - a.livres);
  }, [filteredColis]);

  // =====================================================
  // CRÉATION ET EXPORTATION DU RAPPORT
  // =====================================================

  function exporterRapport() {
    // Prépare les données générales du rapport
    const rows = [
      ["Rapport statistiques Colis Tracker"],
      ["Date export", formatDate(new Date())],
      ["Nombre de colis analysés", stats.total],
      ["Livrés", stats.livres],
      ["Échecs", stats.echecs],
      ["En transit", stats.transit],
      ["Créés", stats.crees],
      ["Taux de réussite des colis traités", `${stats.tauxReussite}%`],

      // Tableau de l'évolution mensuelle
      [],
      ["Évolution mensuelle", "Total", "Livrés", "Échecs"],
      ...evolution.map((m) => [m.label, m.total, m.livres, m.echecs]),

      // Tableau des statistiques par ville
      [],
      ["Ville", "Total", "Livrés", "Échecs"],
      ...villesStats.map((v) => [v.ville, v.total, v.livres, v.echecs]),

      // Tableau des statistiques par livreur
      [],
      ["Livreur", "Colis attribués", "Livrés", "Échecs"],
      ...livreursStats.map((l) => [l.livreur, l.total, l.livres, l.echecs]),
    ];

    // Génère et télécharge le rapport au format CSV
    downloadCSV(rows, "statistiques-colis-tracker.csv");
  }

  // =====================================================
  // AFFICHAGE PENDANT LE CHARGEMENT
  // =====================================================

  // Affiche un message tant que les données ne sont pas chargées
  if (loading) {
    return (
      <div className="stats-page">
        <p className="stats-message">Chargement des statistiques...</p>
      </div>
    );
  }

  // =====================================================
  // AFFICHAGE PRINCIPAL DE LA PAGE
  // =====================================================

  return (
    <div className="stats-page">
      {/* En-tête de la page avec titre et bouton d'exportation */}
      <header className="stats-header">
        <div>
          <h1>Statistiques</h1>
          <p>
            Analysez l'évolution des livraisons, les villes et les performances
            des livreurs.
          </p>
        </div>

        {/* Désactive l'exportation si aucun colis ne correspond aux filtres */}
        <button
          className="stats-export"
          onClick={exporterRapport}
          disabled={filteredColis.length === 0}
        >
          Exporter le rapport CSV
        </button>
      </header>

      {/* Affiche le message d'erreur si le chargement a échoué */}
      {error && <p className="stats-error">{error}</p>}

      {/* =================================================
          FILTRES DE RECHERCHE
      ================================================= */}

      <section className="stats-filters">
        {/* Filtre par période */}
        <div className="stats-filter">
          <label htmlFor="periode">Période</label>

          <select
            id="periode"
            value={periode}
            onChange={(e) => setPeriode(e.target.value)}
          >
            <option value="all">Toutes les dates</option>
            <option value="7days">7 derniers jours</option>
            <option value="month">Ce mois-ci</option>
            <option value="custom">Période personnalisée</option>
          </select>
        </div>

        {/* Filtre par ville */}
        <div className="stats-filter">
          <label htmlFor="ville">Ville</label>

          <select
            id="ville"
            value={ville}
            onChange={(e) => setVille(e.target.value)}
          >
            <option value="all">Toutes les villes</option>

            {villes.map((item) => (
              <option key={item} value={item}>
                {item}
              </option>
            ))}
          </select>
        </div>

        {/* Filtre par livreur */}
        <div className="stats-filter">
          <label htmlFor="livreur">Livreur</label>

          <select
            id="livreur"
            value={livreur}
            onChange={(e) => setLivreur(e.target.value)}
          >
            <option value="all">Tous les livreurs</option>

            {livreurs.map((item) => (
              <option key={item} value={item}>
                {item}
              </option>
            ))}
          </select>
        </div>

        {/* Affiche les champs de date si une période personnalisée est choisie */}
        {periode === "custom" && (
          <>
            <div className="stats-filter">
              <label htmlFor="dateDebut">Du</label>

              <input
                id="dateDebut"
                type="date"
                value={dateDebut}
                onChange={(e) => setDateDebut(e.target.value)}
              />
            </div>

            <div className="stats-filter">
              <label htmlFor="dateFin">Au</label>

              <input
                id="dateFin"
                type="date"
                min={dateDebut || undefined}
                value={dateFin}
                onChange={(e) => setDateFin(e.target.value)}
              />
            </div>
          </>
        )}

        {/* Réinitialise tous les filtres */}
        <button
          className="stats-reset"
          onClick={() => {
            setPeriode("all");
            setVille("all");
            setLivreur("all");
            setDateDebut("");
            setDateFin("");
          }}
        >
          Réinitialiser
        </button>
      </section>

      {/* Affiche le nombre de colis correspondant aux filtres */}
      <p className="stats-result-count">
        {filteredColis.length} colis correspondent aux filtres sélectionnés.
      </p>

      {/* =================================================
          CARTES DES INDICATEURS PRINCIPAUX
      ================================================= */}

      <section className="stats-kpis">
        {/* Nombre total de colis filtrés */}
        <article className="stats-kpi">
          <span>Colis analysés</span>
          <strong>{stats.total}</strong>
          <small>Sur la sélection actuelle</small>
        </article>

        {/* Pourcentage de réussite des colis traités */}
        <article className="stats-kpi">
          <span>Taux de réussite</span>
          <strong>{stats.tauxReussite}%</strong>
          <small>Livrés / (livrés + échecs)</small>
        </article>

        {/* Nombre de villes concernées */}
        <article className="stats-kpi">
          <span>Villes concernées</span>
          <strong>{stats.nbVilles}</strong>
          <small>Dans les données filtrées</small>
        </article>

        {/* Nombre de livreurs ayant des colis attribués */}
        <article className="stats-kpi">
          <span>Livreurs attribués</span>
          <strong>{stats.nbLivreurs}</strong>
          <small>Avec au moins un colis</small>
        </article>
      </section>

      {/* =================================================
          GRAPHIQUE D'ÉVOLUTION MENSUELLE
      ================================================= */}

      <section className="stats-panel">
        <div className="stats-panel-heading">
          <div>
            <h2>Évolution mensuelle</h2>
            <p>Nombre de colis enregistrés sur les 6 derniers mois.</p>
          </div>
        </div>

        {/* Chaque colonne représente un mois */}
        <div className="stats-evolution">
          {evolution.map((month) => (
            <div className="stats-month" key={month.key}>
              <strong>{month.total}</strong>

              <div className="stats-month-track">
                {/* La hauteur de la barre dépend du nombre de colis */}
                <div
                  className="stats-month-bar"
                  style={{
                    height: `${(month.total / maxEvolution) * 100}%`,
                  }}
                  title={`${month.total} colis`}
                />
              </div>

              <span>{month.label}</span>
            </div>
          ))}
        </div>

        {/* Légende du graphique */}
        <div className="stats-legend">
          <span className="stats-legend-mark" />
          Nombre de colis enregistrés
        </div>
      </section>

      {/* =================================================
          TABLEAU DES PERFORMANCES PAR VILLE
      ================================================= */}

      <section className="stats-panel">
        <div className="stats-panel-heading">
          <div>
            <h2>Performance par ville</h2>
            <p>Comparaison du volume, des livraisons et des échecs.</p>
          </div>
        </div>

        {/* Message affiché si aucune ville ne correspond aux filtres */}
        {villesStats.length === 0 ? (
          <p className="stats-message">Aucune donnée disponible.</p>
        ) : (
          <div className="stats-table-wrap">
            <table className="stats-table">
              <thead>
                <tr>
                  <th>Ville</th>
                  <th>Total colis</th>
                  <th>Livrés</th>
                  <th>Échecs</th>
                  <th>Taux de réussite</th>
                </tr>
              </thead>

              <tbody>
                {/* Génère une ligne pour chaque ville */}
                {villesStats.map((item) => {
                  const traites = item.livres + item.echecs;

                  // Calcule le taux de réussite de la ville
                  const taux = traites
                    ? Math.round((item.livres / traites) * 100)
                    : 0;

                  return (
                    <tr key={item.ville}>
                      <td>{item.ville}</td>
                      <td>{item.total}</td>
                      <td>{item.livres}</td>
                      <td>{item.echecs}</td>

                      {/* Affiche le pourcentage et sa barre visuelle */}
                      <td>
                        <div className="stats-rate">
                          <span>{taux}%</span>

                          <div className="stats-rate-track">
                            <div
                              className="stats-rate-bar"
                              style={{ width: `${taux}%` }}
                            />
                          </div>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* =================================================
          TABLEAU DES PERFORMANCES DES LIVREURS
      ================================================= */}

      <section className="stats-panel">
        <div className="stats-panel-heading">
          <div>
            <h2>Performance des livreurs</h2>
            <p>
              Classement selon le nombre de colis livrés. Les colis sans livreur
              sont exclus.
            </p>
          </div>
        </div>

        {/* Message affiché si aucun colis n'est attribué à un livreur */}
        {livreursStats.length === 0 ? (
          <p className="stats-message">
            Aucun colis attribué à un livreur dans cette sélection.
          </p>
        ) : (
          <div className="stats-table-wrap">
            <table className="stats-table">
              <thead>
                <tr>
                  <th>Livreur</th>
                  <th>Colis attribués</th>
                  <th>Livrés</th>
                  <th>Échecs</th>
                  <th>Taux de réussite</th>
                </tr>
              </thead>

              <tbody>
                {/* Génère une ligne pour chaque livreur */}
                {livreursStats.map((item) => {
                  const traites = item.livres + item.echecs;

                  // Calcule le taux de réussite du livreur
                  const taux = traites
                    ? Math.round((item.livres / traites) * 100)
                    : 0;

                  return (
                    <tr key={item.livreur}>
                      <td>{item.livreur}</td>
                      <td>{item.total}</td>
                      <td>{item.livres}</td>
                      <td>{item.echecs}</td>

                      {/* Affiche le taux sous forme de pourcentage et de barre */}
                      <td>
                        <div className="stats-rate">
                          <span>{taux}%</span>

                          <div className="stats-rate-track">
                            <div
                              className="stats-rate-bar"
                              style={{ width: `${taux}%` }}
                            />
                          </div>
                        </div>
                      </td>
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
