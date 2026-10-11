
import { useEffect, useState } from "react";
import axios from "axios";
import { toast } from "react-toastify";
import Badge from "../components/Badge";

const API_COLIS = "http://localhost:8000/colis";
const API_LIVREURS = "http://localhost:8001/livreurs";

export default function ListeColis() {
  const [colis, setColis] = useState([]);
  const [livreurs, setLivreurs] = useState([]);

  const [search, setSearch] = useState("");
  const [statut, setStatut] = useState("tous");

  const [colisChoisi, setColisChoisi] = useState(null);
  const [nouveauLivreur, setNouveauLivreur] = useState("");
  const [chargement, setChargement] = useState(false);

  // Charger les colis et les livreurs
  const chargerDonnees = async () => {
    try {
      const [resColis, resLivreurs] = await Promise.all([
        axios.get(API_COLIS),
        axios.get(API_LIVREURS),
      ]);

      setColis(resColis.data);
      setLivreurs(resLivreurs.data);
    } catch (error) {
      console.error("Erreur :", error);
      toast.error("Impossible de charger les données.");
    }
  };

  useEffect(() => {
    chargerDonnees();
  }, []);

  // Filtrer par statut
  const filtredList =
    statut === "tous" || statut === ""
      ? colis
      : colis.filter((c) => c.statut === statut);

  // Filtrer par client ou numéro de suivi
  const finaleListe = filtredList.filter((c) => {
    const recherche = search.toLowerCase();

    return (
      (c.client || "").toLowerCase().includes(recherche) ||
      String(c.tracking || c.id || "")
        .toLowerCase()
        .includes(recherche)
    );
  });

  // Ouvrir la fenêtre de réaffectation
  const ouvrirReaffectation = (c) => {
    setColisChoisi(c);
    setNouveauLivreur(c.livreurId || "");
  };

  // Réaffecter un colis manuellement
  const reaffecterColis = async (e) => {
    e.preventDefault();

    if (!colisChoisi || !nouveauLivreur) {
      toast.warning("Choisissez un livreur.");
      return;
    }

    const livreur = livreurs.find(
      (l) => String(l.id) === String(nouveauLivreur)
    );

    if (!livreur || livreur.statut !== "actif") {
      toast.warning("Choisissez un livreur actif.");
      return;
    }

    // Éviter de réaffecter à la même personne
    if (
      String(colisChoisi.livreurId || "") ===
      String(livreur.id)
    ) {
      toast.info("Ce livreur est déjà affecté à ce colis.");
      return;
    }

    try {
      setChargement(true);

      await axios.patch(`${API_COLIS}/${colisChoisi.id}`, {
        livreur: livreur.nom,
        livreurId: livreur.id,
        statut: "affecte",
      });

      setColis((anciens) =>
        anciens.map((c) =>
          c.id === colisChoisi.id
            ? {
                ...c,
                livreur: livreur.nom,
                livreurId: livreur.id,
                statut: "affecte",
              }
            : c
        )
      );

      toast.success(
        `Colis réaffecté à ${livreur.nom}.`
      );

      setColisChoisi(null);
      setNouveauLivreur("");
    } catch (error) {
      console.error(error);
      toast.error("Erreur lors de la réaffectation.");
    } finally {
      setChargement(false);
    }
  };

  return (
    <div className="card">
      <h2 style={{ marginTop: 0 }}>Liste des colis</h2>

      {/* Recherche et filtre */}
      <div className="toolbar">
        <input
          type="text"
          placeholder="Rechercher par client ou N° de suivi..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />

        <select
          value={statut}
          onChange={(e) => setStatut(e.target.value)}
        >
          <option value="tous">Tous les statuts</option>
          <option value="created">Créé</option>
          <option value="affecte">Affecté</option>
          <option value="transit">En transit</option>
          <option value="delivered">Livré</option>
          <option value="failed">Échec</option>
        </select>
      </div>

      {/* Tableau des colis */}
      <table>
        <thead>
          <tr>
            <th>N° de suivi</th>
            <th>Client</th>
            <th>Ville</th>
            <th>Statut</th>
            <th>Livreur</th>
            <th>Date</th>
            <th>Action</th>
          </tr>
        </thead>

        <tbody>
          {finaleListe.length > 0 ? (
            finaleListe.map((c) => (
              <tr key={c.id}>
                <td>{c.tracking || c.id}</td>
                <td>{c.client}</td>
                <td>{c.ville}</td>
                <td>
                  <Badge statut={c.statut} />
                </td>
                <td>{c.livreur || "Non affecté"}</td>
                <td>{c.date || c.dateCreation || "—"}</td>

                <td>
                  {c.statut !== "delivered" &&
                    c.statut !== "failed" && (
                      <button
                      className="btn-reaffecter"
                        type="button"
                        onClick={() => ouvrirReaffectation(c)}
                      >
                        Réaffecter
                      </button>
                    )}
                </td>
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan="7" style={{ textAlign: "center" }}>
                Aucun colis trouvé
              </td>
            </tr>
          )}
        </tbody>
      </table>

      {/* Fenêtre de réaffectation */}
      {colisChoisi && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.5)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 1000,
            padding: 16,
          }}
          onClick={() => {
            if (!chargement) setColisChoisi(null);
          }}
        >
          <form
            onSubmit={reaffecterColis}
            style={{
              background: "white",
              padding: 24,
              borderRadius: 12,
              width: "100%",
              maxWidth: 400,
              display: "grid",
              gap: 14,
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <h2 style={{ margin: 0 }}>Réaffecter le colis</h2>

            <p>
              Numéro de suivi :{" "}
              <strong>
                {colisChoisi.tracking || colisChoisi.id}
              </strong>
            </p>

            <label htmlFor="livreur-select">
              Choisir un livreur actif
            </label>

            <select
              id="livreur-select"
              value={nouveauLivreur}
              onChange={(e) => setNouveauLivreur(e.target.value)}
              required
            >
              <option value="">Sélectionner un livreur</option>

              {livreurs
                .filter(
                  (l) =>
                    l.statut === "actif" &&
                    l.ville?.toLowerCase() ===
                      colisChoisi.ville?.toLowerCase()
                )
                .map((l) => (
                  <option key={l.id} value={l.id}>
                    {l.nom} — {l.ville}
                  </option>
                ))}
            </select>

            <div
              style={{
                display: "flex",
                justifyContent: "flex-end",
                gap: 10,
              }}
            >
              <button
                type="button"
                disabled={chargement}
                onClick={() => setColisChoisi(null)}
              >
                Annuler
              </button>

              <button type="submit" disabled={chargement}>
                {chargement ? "En cours..." : "Confirmer"}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}