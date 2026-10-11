import statuts from "../data/statuts.json";

export default function Badge({ statut }) {
  const statutInfo = statuts[statut] || {
    label: statut || "Inconnu",
    badge: "b-default",
  };

  return (
    <span className={`badge ${statutInfo.badge}`}>
      {statutInfo.label}
    </span>
  );
}