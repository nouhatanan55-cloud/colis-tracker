
import { useEffect, useRef, useState } from "react";
import axios from "axios";
import { toast } from "react-toastify";

const API_COLIS = "http://localhost:8000/colis";
const API_LIVREURS = "http://localhost:8001/livreurs";
const API_LIVRAISON = "http://localhost:8002/livraison";

export default function CreerColis() {
  const expediteurRef = useRef(null);
  const clientRef = useRef(null);
  const adresseRef = useRef(null);
  const paiementRef = useRef(null);

  const [tracking, setTracking] = useState("CT-XXXXXXXX");
  const [chargement, setChargement] = useState(false);
  const [chargementParametres, setChargementParametres] =
    useState(true);

  const [parametres, setParametres] = useState({
    ville: "Casablanca",
    poids: 1,
    affectation: "manuel",
  });

  const [ville, setVille] = useState("Casablanca");
  const [poids, setPoids] = useState("1");

  useEffect(() => {
    const chargerParametres = async () => {
      try {
        const res = await axios.get(API_LIVRAISON);

        const donnees = Array.isArray(res.data)
          ? res.data[0]
          : res.data;

        if (!donnees) {
          throw new Error("Aucun paramètre de livraison trouvé.");
        }

        const config = {
          ville: donnees.ville || "Casablanca",
          poids: Number(donnees.poids ?? 1),
          affectation: donnees.affectation || "manuel",
        };

        setParametres(config);
        setVille(config.ville);
        setPoids(String(config.poids));
      } catch (error) {
        console.error("Erreur chargement livraison :", error);

        toast.error(
          "Impossible de charger les paramètres de livraison."
        );
      } finally {
        setChargementParametres(false);
      }
    };

    chargerParametres();
  }, []);

  const generateTracking = () => {
    const characters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
    let code = "";

    for (let i = 0; i < 8; i++) {
      code += characters[
        Math.floor(Math.random() * characters.length)
      ];
    }

    return `CT-${code}`;
  };

  const normaliser = (valeur) =>
    String(valeur || "").trim().toLowerCase();

  const choisirLivreur = (villeColis, livreurs, colis) => {
    const villeNormalisee = normaliser(villeColis);

    const candidats = livreurs.filter(
      (livreur) =>
        normaliser(livreur.statut) === "actif" &&
        normaliser(livreur.ville) === villeNormalisee
    );

    if (candidats.length === 0) {
      return null;
    }

    const compterColis = (livreur) =>
      colis.filter((colisExistant) => {
        const statut = normaliser(colisExistant.statut);

        if (
          [
            "delivered",
            "failed",
            "livre",
            "échec",
            "echec",
          ].includes(statut)
        ) {
          return false;
        }

        if (colisExistant.livreurId != null) {
          return (
            String(colisExistant.livreurId) ===
            String(livreur.id)
          );
        }

        return (
          normaliser(colisExistant.livreur) ===
          normaliser(livreur.nom)
        );
      }).length;

    return candidats.reduce((meilleur, actuel) =>
      compterColis(actuel) < compterColis(meilleur)
        ? actuel
        : meilleur
    );
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (chargement || chargementParametres) return;

    const expediteur = expediteurRef.current.value.trim();
    const client = clientRef.current.value.trim();
    const adresse = adresseRef.current.value.trim();
    const villeColis = ville.trim();
    const poidsColis = Number(poids);
    const paiement = paiementRef.current.value;

    if (
      !expediteur ||
      !client ||
      !adresse ||
      !villeColis ||
      !poids.trim()
    ) {
      toast.error("Veuillez remplir tous les champs.");
      return;
    }

    if (
      !Number.isFinite(poidsColis) ||
      poidsColis <= 0
    ) {
      toast.error("Le poids doit être supérieur à 0.");
      return;
    }

    try {
      setChargement(true);

      const [resColis, resLivreurs] = await Promise.all([
        axios.get(API_COLIS),
        axios.get(API_LIVREURS),
      ]);

      const colisExistants = Array.isArray(resColis.data)
        ? resColis.data
        : [];

      const livreurs = Array.isArray(resLivreurs.data)
        ? resLivreurs.data
        : [];

      let livreur = null;

      if (normaliser(parametres.affectation) !== "manuel") {
        livreur = choisirLivreur(
          villeColis,
          livreurs,
          colisExistants
        );

        if (!livreur) {
          toast.warning(
            `Aucun livreur actif disponible à ${villeColis}.`
          );
          return;
        }
      }

      let nouveauTracking;

      do {
        nouveauTracking = generateTracking();
      } while (
        colisExistants.some(
          (colisExistant) =>
            (colisExistant.tracking || colisExistant.id) ===
            nouveauTracking
        )
      );

      const nouveauColis = {
        tracking: nouveauTracking,
        client,
        expediteur,
        adresse,
        ville: villeColis,
        poids: poidsColis,
        paiement,
        statut: livreur ? "affecte" : "created",
        livreur: livreur ? livreur.nom : "",
        livreurId: livreur ? livreur.id : null,
        date: new Date().toLocaleDateString("fr-FR"),
      };

      const res = await axios.post(
        API_COLIS,
        nouveauColis
      );

      setTracking(res.data.tracking || nouveauTracking);

      if (livreur) {
        toast.success(
          `Colis créé et affecté à ${livreur.nom}.`
        );
      } else {
        toast.success(
          "Colis créé. Affectation manuelle nécessaire."
        );
      }

      expediteurRef.current.value = "";
      clientRef.current.value = "";
      adresseRef.current.value = "";

      setVille(parametres.ville);
      setPoids(String(parametres.poids));

      paiementRef.current.value =
        "Paiement à la livraison";
    } catch (error) {
      console.error("Erreur création colis :", error);

      toast.error(
        "Erreur lors de la création du colis. Vérifiez les serveurs."
      );
    } finally {
      setChargement(false);
    }
  };

  return (
    <div
      className="grid"
      style={{ gridTemplateColumns: "1.6fr 1fr" }}
    >
      <div className="card">
        <h2 style={{ marginTop: 0 }}>Créer un colis</h2>

        <div
          style={{
            padding: "12px",
            marginBottom: "20px",
            borderRadius: "8px",
            background: "var(--bg, #F5F6F8)",
            fontSize: "14px",
          }}
        >
          <div>
            <strong>Affectation :</strong>{" "}
            {normaliser(parametres.affectation) === "manuel"
              ? "Manuelle"
              : "Automatique"}
          </div>

          {chargementParametres && (
            <div style={{ marginTop: "6px" }}>
              Chargement des paramètres...
            </div>
          )}
        </div>

        <form className="form2" onSubmit={handleSubmit}>
          <div>
            <label>Nom de l'expéditeur</label>
            <input
              ref={expediteurRef}
              placeholder="Ahmed Tazi"
              required
            />
          </div>

          <div>
            <label>Nom du destinataire</label>
            <input
              ref={clientRef}
              placeholder="Salma El Fassi"
              required
            />
          </div>

          <div>
            <label>Adresse de livraison</label>
            <input
              ref={adresseRef}
              placeholder="12 Rue des Orangers, Rabat"
              required
            />
          </div>

          <div>
            <label>Ville</label>
            <input
              value={ville}
              onChange={(e) => setVille(e.target.value)}
              placeholder="Casablanca"
              required
            />
          </div>

          <div>
            <label>Poids (kg)</label>
            <input
              type="number"
              min="0.1"
              step="0.1"
              value={poids}
              onChange={(e) => setPoids(e.target.value)}
              required
            />
          </div>

          <div>
            <label>Mode de paiement</label>
            <select
              ref={paiementRef}
              defaultValue="Paiement à la livraison"
            >
              <option value="Paiement à la livraison">
                Paiement à la livraison
              </option>

              <option value="Prépayé">
                Prépayé
              </option>
            </select>
          </div>

          <button
            type="submit"
            className="btn gold"
            style={{ marginTop: "18px" }}
            disabled={chargement || chargementParametres}
          >
            {chargement
              ? "Création en cours..."
              : chargementParametres
              ? "Chargement des paramètres..."
              : "Créer le colis"}
          </button>
        </form>
      </div>

      <div className="card" style={{ textAlign: "center" }}>
        <div
          style={{
            fontSize: "12px",
            color: "var(--grey)",
            fontWeight: 600,
            marginBottom: "8px",
          }}
        >
          Numéro de suivi généré
        </div>

        <div className="tknum">{tracking}</div>

        <div
          className="qr"
          style={{ margin: "16px auto" }}
        ></div>

        <div
          style={{
            fontSize: "12px",
            color: "var(--grey)",
          }}
        >
          Ce code sera imprimé sur l'étiquette du colis.
        </div>
      </div>
    </div>
  );
}