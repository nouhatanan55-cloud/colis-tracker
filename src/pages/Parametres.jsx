
import { useEffect, useRef, useState } from "react";
import axios from "axios";
import { toast } from "react-toastify";
import "../styles/Parametres.css";

const API = "http://localhost:8002";
const API_USERS = "http://localhost:8000/users";

const ENDPOINTS = {
  profil: `${API}/profil`,
  livraison: `${API}/livraison`,
  entreprise: `${API}/entreprise`,
  notifications: `${API}/notifications`,
  preferences: `${API}/preferences`,
  abonnement: `${API}/abonnement`,
};

const defaults = {
  profil: {
    nom: "Administrateur",
    email: "admin@colistracker.ma",
    telephone: "",
    poste: "Administrateur",
  },
  livraison: {
    ville: "Casablanca",
    devise: "MAD",
    poids: 1,
    affectation: "manuel",
  },
  entreprise: {
    nom: "Colis Tracker",
    adresse: "Casablanca, Maroc",
    email: "",
    telephone: "",
    ice: "",
    if: "",
  },
  notifications: {
    nouveauColis: true,
    affectationLivreur: true,
    livraisonReussie: true,
    echecLivraison: true,
    email: false,
    application: true,
  },
  preferences: {
    theme: "clair",
    langue: "fr",
    taillePage: 10,
    formatDate: "DD/MM/YYYY",
  },
  abonnement: {
    offre: "Starter",
    debut: "",
    fin: "",
  },
};

const sections = [
  ["profil", "Profil administrateur"],
  ["securite", "Sécurité"],
  ["notifications", "Notifications"],
  ["livraison", "Livraison"],
  ["entreprise", "Entreprise"],
  ["preferences", "Préférences"],
  ["abonnement", "Abonnement"],
  ["maintenance", "Système et maintenance"],
];

function extraireObjet(responseData) {
  if (Array.isArray(responseData)) {
    return responseData[0] || null;
  }

  return responseData || null;
}

export default function Parametres() {
  const [section, setSection] = useState("profil");
  const [data, setData] = useState(defaults);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [changingPassword, setChangingPassword] = useState(false);
  const [theme, setTheme] = useState("clair");
  const [journal, setJournal] = useState([]);

  const nomRef = useRef(null);
  const emailRef = useRef(null);
  const telephoneRef = useRef(null);
  const posteRef = useRef(null);

  const villeRef = useRef(null);
  const deviseRef = useRef(null);
  const poidsRef = useRef(null);
  const affectationRef = useRef(null);

  const entrepriseNomRef = useRef(null);
  const adresseRef = useRef(null);
  const entrepriseEmailRef = useRef(null);
  const entrepriseTelephoneRef = useRef(null);
  const iceRef = useRef(null);
  const ifRef = useRef(null);

  const passwordActuelRef = useRef(null);
  const passwordNouveauRef = useRef(null);
  const passwordConfirmationRef = useRef(null);

  const taillePageRef = useRef(null);
  const langueRef = useRef(null);
  const dateRef = useRef(null);

  useEffect(() => {
    charger();
  }, []);

  async function charger() {
    setLoading(true);

    try {
      const cles = Object.keys(ENDPOINTS);

      const resultats = await Promise.all(
        cles.map(async (cle) => {
          const response = await axios.get(ENDPOINTS[cle]);
          return [cle, extraireObjet(response.data) || {}];
        })
      );

      const saved = Object.fromEntries(resultats);

      const nouvellesDonnees = {
        profil: { ...defaults.profil, ...saved.profil },
        livraison: { ...defaults.livraison, ...saved.livraison },
        entreprise: { ...defaults.entreprise, ...saved.entreprise },
        notifications: {
          ...defaults.notifications,
          ...saved.notifications,
        },
        preferences: {
          ...defaults.preferences,
          ...saved.preferences,
        },
        abonnement: {
          ...defaults.abonnement,
          ...saved.abonnement,
        },
      };

      setData(nouvellesDonnees);
      setTheme(nouvellesDonnees.preferences.theme || "clair");
    } catch (error) {
      console.error(
        "Erreur de chargement :",
        error.response?.data || error.message
      );

      toast.error(
        "Impossible de charger les paramètres. Vérifiez JSON Server."
      );
    } finally {
      setLoading(false);
    }
  }

  async function enregistrer(sectionData, sectionName) {
    const endpoint = ENDPOINTS[sectionName];

    if (!endpoint) {
      toast.error("Cette section ne peut pas être enregistrée.");
      return false;
    }

    setSaving(true);

    try {
      const responseActuelle = await axios.get(endpoint);
      const existant = extraireObjet(responseActuelle.data);

      const donnees = {
        ...data[sectionName],
        ...sectionData,
      };

      let response;

      if (existant && existant.id !== undefined) {
        response = await axios.put(`${endpoint}/${existant.id}`, {
          ...donnees,
          id: existant.id,
        });
      } else if (existant) {
        response = await axios.put(endpoint, donnees);
      } else {
        response = await axios.post(endpoint, donnees);
      }

      const enregistre = extraireObjet(response.data) || donnees;

      setData((ancienneData) => ({
        ...ancienneData,
        [sectionName]: {
          ...ancienneData[sectionName],
          ...enregistre,
          ...sectionData,
        },
      }));

      if (sectionName === "preferences") {
        setTheme(sectionData.theme || theme);
      }

      setJournal((ancien) => [
        `${new Date().toLocaleString()} — Modification : ${sectionName}`,
        ...ancien,
      ]);

      toast.success("Paramètres enregistrés avec succès.");
      return true;
    } catch (error) {
      console.error(
        `Erreur sauvegarde ${sectionName} :`,
        error.response?.data || error.message
      );

      toast.error(
        `Erreur pendant l'enregistrement de ${sectionName}.`
      );

      return false;
    } finally {
      setSaving(false);
    }
  }

  function lireRefs(refs) {
    const result = {};

    for (const [key, ref] of Object.entries(refs)) {
      result[key] = ref.current?.value?.trim() ?? "";
    }

    return result;
  }

  async function sauvegarderProfil(e) {
    e.preventDefault();

    const profil = lireRefs({
      nom: nomRef,
      email: emailRef,
      telephone: telephoneRef,
      poste: posteRef,
    });

    if (!profil.nom || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(profil.email)) {
      toast.warning("Vérifiez le nom et l'adresse email.");
      return;
    }

    await enregistrer(profil, "profil");
  }

  async function sauvegarderLivraison(e) {
    e.preventDefault();

    const livraison = lireRefs({
      ville: villeRef,
      devise: deviseRef,
      poids: poidsRef,
      affectation: affectationRef,
    });

    const poids = Number(livraison.poids);

    if (!livraison.ville || !Number.isFinite(poids) || poids <= 0) {
      toast.warning("Vérifiez la ville et le poids.");
      return;
    }

    await enregistrer(
      {
        ...livraison,
        poids,
      },
      "livraison"
    );
  }

  async function sauvegarderEntreprise(e) {
    e.preventDefault();

    const entreprise = lireRefs({
      nom: entrepriseNomRef,
      adresse: adresseRef,
      email: entrepriseEmailRef,
      telephone: entrepriseTelephoneRef,
      ice: iceRef,
      if: ifRef,
    });

    if (!entreprise.nom) {
      toast.warning("Le nom de l'entreprise est obligatoire.");
      return;
    }

    await enregistrer(entreprise, "entreprise");
  }

  async function sauvegarderPreferences(e) {
    e.preventDefault();

    const preferences = {
      theme,
      langue: langueRef.current.value,
      taillePage: Number(taillePageRef.current.value),
      formatDate: dateRef.current.value,
    };

    await enregistrer(preferences, "preferences");
  }

  async function changerNotification(key, value) {
    const anciennesNotifications = data.notifications;

    const nouvellesNotifications = {
      ...anciennesNotifications,
      [key]: value,
    };

    setData((ancienneData) => ({
      ...ancienneData,
      notifications: nouvellesNotifications,
    }));

    const succes = await enregistrer(
      nouvellesNotifications,
      "notifications"
    );

    if (!succes) {
      setData((ancienneData) => ({
        ...ancienneData,
        notifications: anciennesNotifications,
      }));
    }
  }

  async function changerAbonnement(e) {
    e.preventDefault();

    const offre = e.target.elements.offre.value;

    await enregistrer({ offre }, "abonnement");
  }

  // Changement réel du mot de passe dans JSON Server
  async function sauvegarderMotDePasse(e) {
    e.preventDefault();

    if (changingPassword) return;

    const actuel = passwordActuelRef.current?.value ?? "";
    const nouveau = passwordNouveauRef.current?.value ?? "";
    const confirmation =
      passwordConfirmationRef.current?.value ?? "";

    if (!actuel || !nouveau || !confirmation) {
      toast.warning("Veuillez remplir tous les champs.");
      return;
    }

    if (nouveau.length < 8) {
      toast.warning(
        "Le nouveau mot de passe doit contenir au moins 8 caractères."
      );
      return;
    }

    if (
      !/[A-Z]/.test(nouveau) ||
      !/[a-z]/.test(nouveau) ||
      !/[0-9]/.test(nouveau)
    ) {
      toast.warning(
        "Ajoutez une majuscule, une minuscule et un chiffre."
      );
      return;
    }

    if (nouveau !== confirmation) {
      toast.error(
        "Les deux nouveaux mots de passe ne correspondent pas."
      );
      return;
    }

    if (actuel === nouveau) {
      toast.warning(
        "Le nouveau mot de passe doit être différent de l'ancien."
      );
      return;
    }

    let utilisateurConnecte;

    try {
      utilisateurConnecte = JSON.parse(
        sessionStorage.getItem("colisTrackerUser") || "null"
      );
    } catch {
      utilisateurConnecte = null;
    }

    if (
      !utilisateurConnecte ||
      utilisateurConnecte.id === undefined ||
      utilisateurConnecte.id === null
    ) {
      toast.error(
        "Session introuvable. Veuillez vous reconnecter."
      );
      return;
    }

    setChangingPassword(true);

    try {
      // Récupérer le compte de l'utilisateur connecté
      const userUrl =
        `${API_USERS}/${encodeURIComponent(utilisateurConnecte.id)}`;

      const response = await axios.get(userUrl);
      const utilisateur = response.data;

      // Vérifier le mot de passe actuel
      if (utilisateur.password !== actuel) {
        toast.error("Le mot de passe actuel est incorrect.");
        return;
      }

      // Enregistrer le nouveau mot de passe
      await axios.patch(userUrl, {
        password: nouveau,
      });

      // Vider les champs après la réussite
      passwordActuelRef.current.value = "";
      passwordNouveauRef.current.value = "";
      passwordConfirmationRef.current.value = "";

      setJournal((ancien) => [
        `${new Date().toLocaleString()} — Modification : mot de passe`,
        ...ancien,
      ]);

      toast.success(
        "Votre mot de passe a été modifié avec succès."
      );
    } catch (error) {
      console.error(
        "Erreur lors du changement du mot de passe :",
        error.response?.data || error.message
      );

      if (error.response?.status === 404) {
        toast.error(
          "Utilisateur introuvable. Veuillez vérifier votre compte."
        );
      } else {
        toast.error(
          "Impossible de modifier le mot de passe. Vérifiez JSON Server."
        );
      }
    } finally {
      setChangingPassword(false);
    }
  }

  function exporter() {
    const blob = new Blob([JSON.stringify(data, null, 2)], {
      type: "application/json",
    });

    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");

    link.href = url;
    link.download = "colis-tracker-parametres.json";
    link.click();

    URL.revokeObjectURL(url);
    toast.success("Export des paramètres effectué.");
  }

  function importer(e) {
    const file = e.target.files?.[0];

    if (!file) return;

    const reader = new FileReader();

    reader.onload = async () => {
      try {
        const imported = JSON.parse(reader.result);

        for (const cle of Object.keys(ENDPOINTS)) {
          if (
            !imported[cle] ||
            typeof imported[cle] !== "object"
          ) {
            throw new Error("Format JSON invalide.");
          }
        }

        const anciennesDonnees = data;

        const nouvellesDonnees = {
          profil: { ...defaults.profil, ...imported.profil },
          livraison: {
            ...defaults.livraison,
            ...imported.livraison,
          },
          entreprise: {
            ...defaults.entreprise,
            ...imported.entreprise,
          },
          notifications: {
            ...defaults.notifications,
            ...imported.notifications,
          },
          preferences: {
            ...defaults.preferences,
            ...imported.preferences,
          },
          abonnement: {
            ...defaults.abonnement,
            ...imported.abonnement,
          },
        };

        setData(nouvellesDonnees);
        setTheme(nouvellesDonnees.preferences.theme);

        let toutEnregistre = true;

        for (const cle of Object.keys(ENDPOINTS)) {
          const succes = await enregistrer(
            nouvellesDonnees[cle],
            cle
          );

          if (!succes) {
            toutEnregistre = false;
            break;
          }
        }

        if (toutEnregistre) {
          toast.success("Fichier importé et enregistré.");
        } else {
          setData(anciennesDonnees);
          setTheme(anciennesDonnees.preferences.theme);

          toast.error(
            "Import incomplet. Vérifiez les données et le serveur."
          );
        }
      } catch (error) {
        console.error(error);
        toast.error("Fichier JSON invalide.");
      }

      e.target.value = "";
    };

    reader.readAsText(file);
  }

  if (loading) {
    return (
      <div className="par-page">
        Chargement des paramètres...
      </div>
    );
  }

  return (
    <div className={`par-page theme-${theme}`}>
      <header className="par-header">
        <div>
          <span className="par-eyebrow">ADMINISTRATION</span>
          <h1>Paramètres</h1>
          <p>Configurez votre espace Colis Tracker.</p>
        </div>

        <button
          type="button"
          className="par-btn"
          onClick={charger}
          disabled={saving || changingPassword}
        >
          Actualiser
        </button>
      </header>

      <div className="par-layout">
        <aside className="par-nav">
          {sections.map(([key, label]) => (
            <button
              type="button"
              key={key}
              className={section === key ? "active" : ""}
              onClick={() => setSection(key)}
            >
              {label}
            </button>
          ))}
        </aside>

        <main className="par-content">
          {section === "profil" && (
            <form onSubmit={sauvegarderProfil} className="par-panel">
              <h2>Profil administrateur</h2>
              <p>Modifiez vos informations professionnelles.</p>

              <label>Nom complet</label>
              <input
                ref={nomRef}
                key={`nom-${data.profil.nom}`}
                defaultValue={data.profil.nom}
                required
              />

              <label>Email</label>
              <input
                ref={emailRef}
                key={`email-${data.profil.email}`}
                type="email"
                defaultValue={data.profil.email}
                required
              />

              <label>Téléphone</label>
              <input
                ref={telephoneRef}
                key={`telephone-${data.profil.telephone}`}
                defaultValue={data.profil.telephone}
              />

              <label>Poste</label>
              <input
                ref={posteRef}
                key={`poste-${data.profil.poste}`}
                defaultValue={data.profil.poste}
              />

              <button className="par-btn" disabled={saving}>
                {saving ? "Enregistrement..." : "Enregistrer le profil"}
              </button>
            </form>
          )}

          {section === "securite" && (
            <form
              onSubmit={sauvegarderMotDePasse}
              className="par-panel"
            >
              <h2>Sécurité et connexion</h2>
              <p>
                Modifiez le mot de passe de votre compte.
              </p>

              <label htmlFor="passwordActuel">
                Mot de passe actuel
              </label>
              <input
                id="passwordActuel"
                ref={passwordActuelRef}
                type="password"
                autoComplete="current-password"
                placeholder="Saisir le mot de passe actuel"
                required
              />

              <label htmlFor="passwordNouveau">
                Nouveau mot de passe
              </label>
              <input
                id="passwordNouveau"
                ref={passwordNouveauRef}
                type="password"
                autoComplete="new-password"
                placeholder="8 caractères minimum"
                minLength={8}
                required
              />

              <label htmlFor="passwordConfirmation">
                Confirmer le nouveau mot de passe
              </label>
              <input
                id="passwordConfirmation"
                ref={passwordConfirmationRef}
                type="password"
                autoComplete="new-password"
                placeholder="Confirmer le nouveau mot de passe"
                minLength={8}
                required
              />

              <button
                type="submit"
                className="par-btn"
                disabled={changingPassword}
              >
                {changingPassword
                  ? "Modification en cours..."
                  : "Modifier le mot de passe"}
              </button>

              <div className="par-notice">
                Le nouveau mot de passe sera enregistré après
                vérification de votre mot de passe actuel.
              </div>
            </form>
          )}

          {section === "notifications" && (
            <div className="par-panel">
              <h2>Notifications</h2>
              <p>
                Choisissez les événements pour lesquels vous souhaitez
                être averti.
              </p>

              {[
                ["nouveauColis", "Création d'un nouveau colis"],
                ["affectationLivreur", "Affectation d'un livreur"],
                ["livraisonReussie", "Livraison réussie"],
                ["echecLivraison", "Échec de livraison"],
                ["email", "Notifications par email"],
                ["application", "Notifications dans l'application"],
              ].map(([key, label]) => (
                <label className="par-switch-row" key={key}>
                  <span>{label}</span>
                  <input
                    type="checkbox"
                    checked={Boolean(data.notifications[key])}
                    disabled={saving}
                    onChange={(e) =>
                      changerNotification(key, e.target.checked)
                    }
                  />
                </label>
              ))}
            </div>
          )}

          {section === "livraison" && (
            <form onSubmit={sauvegarderLivraison} className="par-panel">
              <h2>Paramètres de livraison</h2>
              <p>
                Configurez les valeurs par défaut pour vos colis.
              </p>

              <label>Ville par défaut</label>
              <select
                ref={villeRef}
                key={`ville-${data.livraison.ville}`}
                defaultValue={data.livraison.ville}
              >
                {[
                  "Casablanca",
                  "Rabat",
                  "Marrakech",
                  "Tanger",
                  "Fès",
                  "Agadir",
                ].map((ville) => (
                  <option key={ville} value={ville}>
                    {ville}
                  </option>
                ))}
              </select>

              <label>Devise</label>
              <select
                ref={deviseRef}
                key={`devise-${data.livraison.devise}`}
                defaultValue={data.livraison.devise}
              >
                <option value="MAD">MAD (DH)</option>
                <option value="EUR">EUR (€)</option>
                <option value="USD">USD ($)</option>
              </select>

              <label>Poids par défaut (kg)</label>
              <input
                ref={poidsRef}
                key={`poids-${data.livraison.poids}`}
                type="number"
                min="0.1"
                step="0.1"
                defaultValue={data.livraison.poids}
                required
              />

              <label>Affectation des livreurs</label>
              <select
                ref={affectationRef}
                key={`affectation-${data.livraison.affectation}`}
                defaultValue={data.livraison.affectation}
              >
                <option value="manuel">Manuelle</option>
                <option value="automatique">Automatique</option>
              </select>

              <button className="par-btn" disabled={saving}>
                {saving
                  ? "Enregistrement..."
                  : "Enregistrer les paramètres"}
              </button>
            </form>
          )}

          {section === "entreprise" && (
            <form onSubmit={sauvegarderEntreprise} className="par-panel">
              <h2>Informations de l'entreprise</h2>

              <label>Nom de l'entreprise</label>
              <input
                ref={entrepriseNomRef}
                key={`entreprise-nom-${data.entreprise.nom}`}
                defaultValue={data.entreprise.nom}
                required
              />

              <label>Adresse</label>
              <input
                ref={adresseRef}
                key={`adresse-${data.entreprise.adresse}`}
                defaultValue={data.entreprise.adresse}
              />

              <label>Email professionnel</label>
              <input
                ref={entrepriseEmailRef}
                key={`entreprise-email-${data.entreprise.email}`}
                type="email"
                defaultValue={data.entreprise.email}
              />

              <label>Téléphone</label>
              <input
                ref={entrepriseTelephoneRef}
                key={`entreprise-tel-${data.entreprise.telephone}`}
                defaultValue={data.entreprise.telephone}
              />

              <label>ICE</label>
              <input
                ref={iceRef}
                key={`ice-${data.entreprise.ice}`}
                defaultValue={data.entreprise.ice}
              />

              <label>Identifiant fiscal (IF)</label>
              <input
                ref={ifRef}
                key={`if-${data.entreprise.if}`}
                defaultValue={data.entreprise.if}
              />

              <button className="par-btn" disabled={saving}>
                {saving
                  ? "Enregistrement..."
                  : "Enregistrer l'entreprise"}
              </button>
            </form>
          )}

          {section === "preferences" && (
            <form onSubmit={sauvegarderPreferences} className="par-panel">
              <h2>Préférences de l'application</h2>

              <label>Thème</label>
              <select
                value={theme}
                onChange={(e) => setTheme(e.target.value)}
              >
                <option value="clair">Clair</option>
                <option value="sombre">Sombre</option>
              </select>

              <label>Langue préférée</label>
              <select
                ref={langueRef}
                key={`langue-${data.preferences.langue}`}
                defaultValue={data.preferences.langue}
              >
                <option value="fr">Français</option>
                <option value="ar">العربية</option>
              </select>

              <label>Nombre de lignes par page</label>
              <select
                ref={taillePageRef}
                key={`taille-${data.preferences.taillePage}`}
                defaultValue={String(data.preferences.taillePage)}
              >
                <option value="10">10</option>
                <option value="25">25</option>
                <option value="50">50</option>
                <option value="100">100</option>
              </select>

              <label>Format de date</label>
              <select
                ref={dateRef}
                key={`date-${data.preferences.formatDate}`}
                defaultValue={data.preferences.formatDate}
              >
                <option value="DD/MM/YYYY">DD/MM/YYYY</option>
                <option value="YYYY-MM-DD">YYYY-MM-DD</option>
                <option value="MM/DD/YYYY">MM/DD/YYYY</option>
              </select>

              <button className="par-btn" disabled={saving}>
                {saving
                  ? "Enregistrement..."
                  : "Enregistrer les préférences"}
              </button>
            </form>
          )}

          {section === "abonnement" && (
            <form onSubmit={changerAbonnement} className="par-panel">
              <h2>Abonnement et facturation</h2>
              <p>
                Offre actuellement enregistrée :{" "}
                <strong>{data.abonnement.offre}</strong>
              </p>

              <label>Offre</label>
              <select
                name="offre"
                key={`offre-${data.abonnement.offre}`}
                defaultValue={data.abonnement.offre}
              >
                <option value="Starter">Starter</option>
                <option value="Pro">Pro</option>
                <option value="Entreprise">Entreprise</option>
              </select>

              <div className="par-notice">
                Cette modification change uniquement l'offre affichée.
                Aucun paiement réel n'est effectué.
              </div>

              <button className="par-btn" disabled={saving}>
                {saving ? "Enregistrement..." : "Enregistrer l'offre"}
              </button>
            </form>
          )}

          {section === "maintenance" && (
            <div className="par-panel">
              <h2>Système et maintenance</h2>
              <p>
                Outils de diagnostic et sauvegarde des paramètres.
              </p>

              <div className="par-status-row">
                <span>Interface React</span>
                <strong className="par-ok">Chargée</strong>
              </div>

              <div className="par-status-row">
                <span>JSON Server des paramètres</span>
                <strong>Test de connexion</strong>
              </div>

              <button
                type="button"
                className="par-btn"
                onClick={async () => {
                  try {
                    await Promise.all(
                      Object.values(ENDPOINTS).map((url) =>
                        axios.get(url)
                      )
                    );

                    toast.success(
                      "Tous les endpoints sont accessibles."
                    );
                  } catch (error) {
                    console.error(error);
                    toast.error(
                      "Un ou plusieurs endpoints sont inaccessibles."
                    );
                  }
                }}
              >
                Tester la connexion
              </button>

              <hr />

              <button
                type="button"
                className="par-btn"
                onClick={exporter}
              >
                Exporter les paramètres JSON
              </button>

              <label className="par-file-label">
                Importer une sauvegarde JSON
                <input
                  type="file"
                  accept=".json,application/json"
                  onChange={importer}
                />
              </label>

              <h3>Journal local de cette session</h3>

              {journal.length === 0 ? (
                <p>
                  Aucune opération enregistrée dans cette session.
                </p>
              ) : (
                journal.map((ligne, index) => (
                  <p key={`${ligne}-${index}`}>{ligne}</p>
                ))
              )}
            </div>
          )}
        </main>
      </div>
    </div>
  );
}