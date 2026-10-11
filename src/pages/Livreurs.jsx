
import { useEffect, useState } from "react";
import axios from "axios";
import { toast } from "react-toastify";
import "../styles/Livreurs.css";

const API_LIVREURS = "http://localhost:8001/livreurs";
const API_COLIS = "http://localhost:8000/colis";

export default function Livreurs() {
  const [livreurs, setLivreurs] = useState([]);
  const [colis, setColis] = useState([]);

  const [recherche, setRecherche] = useState("");
  const [villeFiltre, setVilleFiltre] = useState("");
  const [statutFiltre, setStatutFiltre] = useState("");

  const [modalOuvert, setModalOuvert] = useState(false);
  const [livreurModifie, setLivreurModifie] = useState(null);
  const [livreurASupprimer, setLivreurASupprimer] = useState(null);

  const [chargement, setChargement] = useState(true);
  const [enregistrement, setEnregistrement] = useState(false);

  const [form, setForm] = useState({
    nom: "",
    telephone: "",
    ville: "Casablanca",
    statut: "actif",
  });

  // Charger les livreurs et les colis
  const chargerDonnees = async () => {
    try {
      const [resLivreurs, resColis] = await Promise.all([
        axios.get(API_LIVREURS),
        axios.get(API_COLIS),
      ]);

      setLivreurs(resLivreurs.data);
      setColis(resColis.data);
    } catch (error) {
      console.error(error);
      toast.error("Erreur lors du chargement des données.");
    } finally {
      setChargement(false);
    }
  };

  useEffect(() => {
    chargerDonnees();
  }, []);

  // Compter les colis d'un livreur
  const compterColis = (nom) => {
    return colis.filter((c) => c.livreur === nom).length;
  };

  // Compter les colis livrés
  const compterColisLivres = (nom) => {
    return colis.filter(
      (c) =>
        c.livreur === nom &&
        String(c.statut).toLowerCase() === "delivered"
    ).length;
  };

  // Ouvrir le formulaire d'ajout
  const ouvrirAjout = () => {
    setLivreurModifie(null);
    setForm({
      nom: "",
      telephone: "",
      ville: "Casablanca",
      statut: "actif",
    });
    setModalOuvert(true);
  };

  // Ouvrir le formulaire de modification
  const ouvrirModification = (livreur) => {
    setLivreurModifie(livreur);
    setForm({
      nom: livreur.nom || "",
      telephone: livreur.telephone || "",
      ville: livreur.ville || "Casablanca",
      statut: livreur.statut || "actif",
    });
    setModalOuvert(true);
  };

  // Modifier les champs du formulaire
  const changerChamp = (e) => {
    setForm({
      ...form,
      [e.target.name]: e.target.value,
    });
  };

  // Ajouter ou modifier un livreur
  const enregistrerLivreur = async (e) => {
    e.preventDefault();

    if (!form.nom.trim() || !form.telephone.trim()) {
      toast.warning("Veuillez remplir tous les champs obligatoires.");
      return;
    }

    try {
      setEnregistrement(true);

      if (livreurModifie) {
        await axios.patch(
          `${API_LIVREURS}/${livreurModifie.id}`,
          form
        );

        toast.success("Livreur modifié avec succès.");
      } else {
        await axios.post(API_LIVREURS, form);

        toast.success("Livreur ajouté avec succès.");
      }

      setModalOuvert(false);
      await chargerDonnees();
    } catch (error) {
      console.error(error);
      toast.error("Impossible d'enregistrer le livreur.");
    } finally {
      setEnregistrement(false);
    }
  };

  // Activer ou désactiver un livreur
  const changerStatut = async (livreur) => {
    const nouveauStatut =
      livreur.statut === "actif" ? "inactif" : "actif";

    try {
      await axios.patch(`${API_LIVREURS}/${livreur.id}`, {
        statut: nouveauStatut,
      });

      setLivreurs((anciens) =>
        anciens.map((l) =>
          l.id === livreur.id
            ? { ...l, statut: nouveauStatut }
            : l
        )
      );

      toast.success(
        nouveauStatut === "actif"
          ? "Livreur activé."
          : "Livreur désactivé."
      );
    } catch (error) {
      console.error(error);
      toast.error("Impossible de modifier le statut.");
    }
  };

  // Demander confirmation avant suppression
  const demanderSuppression = (livreur) => {
    setLivreurASupprimer(livreur);
  };

  // Supprimer un livreur
  const supprimerLivreur = async () => {
    if (!livreurASupprimer) return;

    try {
      await axios.delete(
        `${API_LIVREURS}/${livreurASupprimer.id}`
      );

      setLivreurs((anciens) =>
        anciens.filter(
          (l) => l.id !== livreurASupprimer.id
        )
      );

      toast.success("Livreur supprimé avec succès.");
      setLivreurASupprimer(null);
    } catch (error) {
      console.error(error);
      toast.error("Impossible de supprimer ce livreur.");
    }
  };

  // Liste des villes disponibles
  const villes = [
    ...new Set(livreurs.map((l) => l.ville).filter(Boolean)),
  ];

  // Filtrer les livreurs
  const livreursFiltres = livreurs.filter((livreur) => {
    const texte = recherche.toLowerCase();

    const correspondRecherche =
      (livreur.nom || "").toLowerCase().includes(texte) ||
      (livreur.telephone || "").includes(texte);

    const correspondVille =
      villeFiltre === "" || livreur.ville === villeFiltre;

    const correspondStatut =
      statutFiltre === "" || livreur.statut === statutFiltre;

    return (
      correspondRecherche &&
      correspondVille &&
      correspondStatut
    );
  });

  // Statistiques
  const totalLivreurs = livreurs.length;

  const livreursActifs = livreurs.filter(
    (l) => l.statut === "actif"
  ).length;

  const livreursInactifs = livreurs.filter(
    (l) => l.statut === "inactif"
  ).length;

  return (
    <div className="liv-page">
      {/* En-tête */}
      <div className="liv-header">
        <div>
          <h1>Gestion des livreurs</h1>
          <p>Gérez votre équipe de livraison.</p>
        </div>

        <button
          type="button"
          className="liv-btn-add"
          onClick={ouvrirAjout}
        >
          + Ajouter un livreur
        </button>
      </div>

      {/* Statistiques */}
      <div className="liv-stats">
        <div className="liv-stat-card">
          <span>Total livreurs</span>
          <h2>{totalLivreurs}</h2>
        </div>

        <div className="liv-stat-card">
          <span>Livreurs actifs</span>
          <h2>{livreursActifs}</h2>
        </div>

        <div className="liv-stat-card">
          <span>Livreurs inactifs</span>
          <h2>{livreursInactifs}</h2>
        </div>
      </div>

      {/* Recherche et filtres */}
      <div className="liv-toolbar">
        <input
          type="text"
          placeholder="Rechercher un nom ou téléphone..."
          value={recherche}
          onChange={(e) => setRecherche(e.target.value)}
        />

        <select
          value={villeFiltre}
          onChange={(e) => setVilleFiltre(e.target.value)}
        >
          <option value="">Toutes les villes</option>

          {villes.map((ville) => (
            <option key={ville} value={ville}>
              {ville}
            </option>
          ))}
        </select>

        <select
          value={statutFiltre}
          onChange={(e) => setStatutFiltre(e.target.value)}
        >
          <option value="">Tous les statuts</option>
          <option value="actif">Actifs</option>
          <option value="inactif">Inactifs</option>
        </select>
      </div>

      {/* Tableau des livreurs */}
      <div className="liv-table-container">
        <table className="liv-table">
          <thead>
            <tr>
              <th>Livreur</th>
              <th>Téléphone</th>
              <th>Ville</th>
              <th>Colis</th>
              <th>Livrés</th>
              <th>Statut</th>
              <th>Actions</th>
            </tr>
          </thead>

          <tbody>
            {chargement ? (
              <tr>
                <td colSpan="7">Chargement...</td>
              </tr>
            ) : livreursFiltres.length === 0 ? (
              <tr>
                <td colSpan="7">Aucun livreur trouvé.</td>
              </tr>
            ) : (
              livreursFiltres.map((livreur) => (
                <tr key={livreur.id}>
                  <td>
                    <strong>{livreur.nom}</strong>
                  </td>

                  <td>{livreur.telephone}</td>
                  <td>{livreur.ville}</td>

                  <td>{compterColis(livreur.nom)}</td>

                  <td>{compterColisLivres(livreur.nom)}</td>

                  <td>
                    <span
                      className={
                        livreur.statut === "actif"
                          ? "liv-status liv-status-active"
                          : "liv-status liv-status-inactive"
                      }
                    >
                      {livreur.statut === "actif"
                        ? "Actif"
                        : "Inactif"}
                    </span>
                  </td>

                  <td>
                    <div className="liv-actions">
                      <button
                        type="button"
                        className="liv-btn-edit"
                        onClick={() => ouvrirModification(livreur)}
                      >
                        Modifier
                      </button>

                      <button
                        type="button"
                        className={
                          livreur.statut === "actif"
                            ? "liv-btn-toggle liv-btn-disable"
                            : "liv-btn-toggle liv-btn-enable"
                        }
                        onClick={() => changerStatut(livreur)}
                      >
                        {livreur.statut === "actif"
                          ? "Désactiver"
                          : "Activer"}
                      </button>

                      <button
                        type="button"
                        className="liv-btn-delete"
                        onClick={() =>
                          demanderSuppression(livreur)
                        }
                      >
                        Supprimer
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Fenêtre d'ajout et de modification */}
      {modalOuvert && (
        <div
          className="liv-modal-overlay"
          onClick={() => setModalOuvert(false)}
        >
          <div
            className="liv-modal"
            onClick={(e) => e.stopPropagation()}
          >
            <h2>
              {livreurModifie
                ? "Modifier le livreur"
                : "Ajouter un livreur"}
            </h2>

            <form onSubmit={enregistrerLivreur}>
              <label>Nom complet</label>
              <input
                type="text"
                name="nom"
                value={form.nom}
                onChange={changerChamp}
                placeholder="Ex. Karim L."
                required
              />

              <label>Téléphone</label>
              <input
                type="tel"
                name="telephone"
                value={form.telephone}
                onChange={changerChamp}
                placeholder="Ex. 0612345678"
                required
              />

              <label>Ville</label>
              <select
                name="ville"
                value={form.ville}
                onChange={changerChamp}
              >
                <option value="Casablanca">Casablanca</option>
                <option value="Rabat">Rabat</option>
                <option value="Marrakech">Marrakech</option>
                <option value="Tanger">Tanger</option>
                <option value="Fès">Fès</option>
                <option value="Agadir">Agadir</option>
                <option value="Autre">Autre</option>
              </select>

              <label>Statut</label>
              <select
                name="statut"
                value={form.statut}
                onChange={changerChamp}
              >
                <option value="actif">Actif</option>
                <option value="inactif">Inactif</option>
              </select>

              <div className="liv-modal-actions">
                <button
                  type="button"
                  className="liv-btn-cancel"
                  onClick={() => setModalOuvert(false)}
                  disabled={enregistrement}
                >
                  Annuler
                </button>

                <button
                  type="submit"
                  className="liv-btn-add"
                  disabled={enregistrement}
                >
                  {enregistrement
                    ? "Enregistrement..."
                    : livreurModifie
                    ? "Enregistrer"
                    : "Ajouter"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Fenêtre de confirmation de suppression */}
      {livreurASupprimer && (
        <div
          className="liv-modal-overlay"
          onClick={() => setLivreurASupprimer(null)}
        >
          <div
            className="liv-confirm-modal"
            role="dialog"
            aria-modal="true"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="liv-confirm-icon">!</div>

            <h2>Supprimer ce livreur ?</h2>

            <p>
              Voulez-vous vraiment supprimer{" "}
              <strong>{livreurASupprimer.nom}</strong> ?
              Cette action est définitive.
            </p>

            <div className="liv-confirm-actions">
              <button
                type="button"
                className="liv-btn-cancel"
                onClick={() => setLivreurASupprimer(null)}
              >
                Annuler
              </button>

              <button
                type="button"
                className="liv-confirm-delete"
                onClick={supprimerLivreur}
              >
                Oui, supprimer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}