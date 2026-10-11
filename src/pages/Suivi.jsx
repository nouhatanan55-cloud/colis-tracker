import { useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import colis from "../data/colis.json";
import historique from "../data/historique.json";
import Badge from "../components/Badge";

// Texte de la carte "Livraison estimée" selon le statut
const ETA = {
  created: {
    titre: "En attente de ramassage",
    sous: "Le livreur passera bientôt chez l'expéditeur",
  },
  transit: {
    titre: "Aujourd'hui, avant 18h",
    sous: "Estimation basée sur le trafic actuel et l'historique des livraisons dans ce quartier",
  },
  delivered: {
    titre: "Colis livré",
    sous: "Votre colis a été remis avec succès",
  },
  failed: {
    titre: "Livraison échouée",
    sous: "Une nouvelle tentative sera planifiée",
  },
};

export default function Suivi() {
  const { numero } = useParams(); // ex: "CT-88214" (undefined sur /suivi)
  const navigate = useNavigate();
  const inputRef = useRef(null);

  // Chercher le colis correspondant au numéro de l'URL
  const numeroNettoye = numero ? numero.trim().toUpperCase() : "";
  const colisTrouve = colis.find((c) => c.id === numeroNettoye);

  // Quand on valide : on change l'URL vers /suivi/CT-xxxxx
  const handleSubmit = (e) => {
    e.preventDefault();
    const valeur = inputRef.current.value.trim().toUpperCase();
    if (valeur === "") return;
    navigate(`/suivi/${valeur}`);
  };

  const enTransit = colisTrouve && colisTrouve.statut === "transit";

  return (
    <div>
      {/* ── Bandeau navy avec recherche ── */}
      <div className="trk-hero">
        <div style={{ fontSize: "12px", letterSpacing: ".4px", opacity: 0.8 }}>
          SUIVI DE COLIS
        </div>
        <h2 style={{ margin: "6px 0 0", color: "#fff" }}>Où est mon colis ?</h2>

        <form onSubmit={handleSubmit}>
          <input
            ref={inputRef}
            defaultValue={numeroNettoye}
            placeholder="Entrez votre numéro de suivi (ex: CT-88214)"
          />
        </form>
      </div>

      {/* ── Cas 1 : pas encore de numéro ── */}
      {!numero && (
        <p style={{ textAlign: "center", color: "var(--grey)", marginTop: "30px" }}>
          Saisissez votre numéro de suivi puis appuyez sur Entrée.
        </p>
      )}

      {/* ── Cas 2 : numéro introuvable ── */}
      {numero && !colisTrouve && (
        <div className="card" style={{ maxWidth: "520px", margin: "30px auto", textAlign: "center" }}>
          <strong>Aucun colis trouvé</strong>
          <p style={{ color: "var(--grey)", marginBottom: 0 }}>
            Le numéro « {numeroNettoye} » n'existe pas. Vérifiez-le et réessayez.
          </p>
        </div>
      )}

      {/* ── Cas 3 : colis trouvé ── */}
      {colisTrouve && (
        <>
          {/* Carte livraison estimée */}
          <div className="eta">
            <div style={{ fontSize: "12px", color: "var(--grey)" }}>
              {colisTrouve.id} <Badge statut={colisTrouve.statut} />
            </div>
            <div className="n">{ETA[colisTrouve.statut].titre}</div>
            <div style={{ fontSize: "11px", color: "var(--grey)", marginTop: "2px" }}>
              {ETA[colisTrouve.statut].sous}
            </div>
          </div>

          <div
            className="trk-layout"
            style={enTransit ? undefined : { gridTemplateColumns: "1fr", maxWidth: "520px" }}
          >
            {/* Carte : seulement si le colis est en transit */}
            {enTransit && (
              <div>
                <div className="mapcard">
                  <div className="maphead">
                    <span className="t">Position du livreur</span>
                    <span className="live">● LIVE</span>
                  </div>

                  <div className="mapbox">
                    <svg width="100%" height="100%" style={{ position: "absolute", top: 0, left: 0 }}>
                      <path className="route" d="M 40 190 Q 120 120 190 130 T 300 60" />
                    </svg>

                    {/* Camion */}
                    <svg className="pin truck" style={{ left: "190px", top: "132px" }} viewBox="0 0 24 24" fill="currentColor">
                      <circle cx="12" cy="12" r="11" stroke="#fff" strokeWidth="2" />
                      <path d="M7 9h6v5H7z" fill="#fff" />
                      <circle cx="9" cy="16" r="1.4" fill="#fff" />
                      <circle cx="14" cy="16" r="1.4" fill="#fff" />
                    </svg>
                    <div className="pin-label" style={{ left: "190px", top: "150px" }}>
                      {colisTrouve.livreur ?? "Livreur"}
                    </div>

                    {/* Destination */}
                    <svg className="pin dest" style={{ left: "300px", top: "62px" }} viewBox="0 0 24 24" fill="currentColor">
                      <path d="M12 2C7.6 2 4 5.6 4 10c0 6 8 12 8 12s8-6 8-12c0-4.4-3.6-8-8-8z" />
                      <circle cx="12" cy="10" r="3" fill="#fff" />
                    </svg>
                    <div className="pin-label" style={{ left: "300px", top: "78px" }}>Vous</div>
                  </div>

                  <div className="mapfoot">
                    <span>Distance restante : <b>3.2 km</b></span>
                    <span>Arrivée estimée : <b>17:45</b></span>
                  </div>
                </div>
              </div>
            )}

            {/* Timeline : une ligne par étape de l'historique */}
            <div className="timeline" style={{ maxWidth: "none", padding: 0 }}>
              {historique[colisTrouve.id].map((etape, i) => (
                <div className="tl-item" key={i}>
                  <div className="tl-dot"></div>
                  <div>
                    <div className="tl-t">{etape.titre}</div>
                    <div className="tl-s">{etape.detail}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}