
import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { GoogleGenAI } from "@google/genai";

dotenv.config();

const app = express();
const PORT = 3001;
const JSON_SERVER_URL = "http://localhost:8000";

app.use(cors());
app.use(express.json());

if (!process.env.GEMINI_API_KEY) {
  console.error("Erreur : GEMINI_API_KEY manquante dans le fichier .env");
}

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
});

// Vérifier que le backend fonctionne
app.get("/", (req, res) => {
  res.send("Colis Tracker AI Backend fonctionne !");
});

// Récupérer les informations d'un colis
app.post("/chat", async (req, res) => {
  try {
    const { message } = req.body;

    if (typeof message !== "string" || !message.trim()) {
      return res.status(400).json({
        error: "Veuillez écrire un message.",
      });
    }

    const texte = message.trim();
    const trackingMatch = texte.match(
      /\b[A-Z]{2}-[A-Z0-9]*\d[A-Z0-9]*\b/i
    );

    if (trackingMatch) {
      const tracking = trackingMatch[0].toUpperCase();

      const response = await fetch(`${JSON_SERVER_URL}/colis`);

      if (!response.ok) {
        throw new Error("Impossible de contacter JSON Server.");
      }

      const tousLesColis = await response.json();

      const colisTrouve = tousLesColis.find((c) => {
        return (
          String(c.id || "").toUpperCase() === tracking ||
          String(c.tracking || "").toUpperCase() === tracking
        );
      });

      if (!colisTrouve) {
        return res.json({
          reply: `Aucun colis trouvé avec le numéro ${tracking}. Vérifiez votre numéro de suivi.`,
        });
      }

      const statuts = {
        created: "Créé et enregistré",
        transit: "En cours d'acheminement",
        delivered: "Livré",
        failed: "Échec de livraison ou problème rencontré",
      };

      const statut = String(colisTrouve.statut || "").toLowerCase();

      const reply =
        `Informations de votre colis ${colisTrouve.tracking || colisTrouve.id} :\n\n` +
        `• Statut : ${statuts[statut] || "Statut non renseigné"}\n` +
        `• Ville : ${colisTrouve.ville || "Non renseignée"}\n` +
        `• Date : ${colisTrouve.date || "Non renseignée"}\n` +
        `• Livreur : ${colisTrouve.livreur || "Non attribué"}\n\n` +
        (statut === "failed"
          ? "La livraison a échoué ou rencontré un problème. La raison exacte n'est pas renseignée dans le système."
          : "Ces informations proviennent des données enregistrées dans notre système.");

      return res.json({ reply });
    }

    // Questions générales traitées par Gemini
    const aiResponse = await ai.models.generateContent({
      model: "gemini-3.5-flash-lite",
      contents: texte,
      config: {
        systemInstruction: `
Tu es l'assistant virtuel de Colis Tracker.
Réponds clairement et poliment.
Utilise le français, sauf si le client écrit en arabe ou en darija.
Aide les utilisateurs concernant les colis et les livraisons.
Ne prétends jamais avoir consulté un colis sans l'avoir réellement recherché.
N'invente aucune information sur les colis.
        `,
      },
    });

    return res.json({
      reply: aiResponse.text || "Désolé, aucune réponse n'a été générée.",
    });
  } catch (error) {
    console.error("Erreur Chatbot :", error);
    return res.status(500).json({
      error: "Erreur du chatbot. Vérifiez le backend et la clé API.",
    });
  }
});

// Générer le résumé IA du tableau de bord
app.post("/dashboard-summary", async (req, res) => {
  try {
    const response = await fetch(`${JSON_SERVER_URL}/colis`);

    if (!response.ok) {
      throw new Error("Impossible de récupérer les colis depuis JSON Server.");
    }

    const colis = await response.json();

    if (!Array.isArray(colis)) {
      throw new Error("Les données reçues ne sont pas une liste de colis.");
    }

    const normaliserStatut = (c) =>
      String(c.statut || "").trim().toLowerCase();

    const statistiques = {
      total: colis.length,
      enAttente: colis.filter(
        (c) => normaliserStatut(c) === "created"
      ).length,
      enTransit: colis.filter(
        (c) => normaliserStatut(c) === "transit"
      ).length,
      livres: colis.filter(
        (c) => normaliserStatut(c) === "delivered"
      ).length,
      echecs: colis.filter(
        (c) => normaliserStatut(c) === "failed"
      ).length,
    };

    const prompt = `
Tu es un analyste spécialisé dans la logistique de Colis Tracker.

Analyse les statistiques réelles suivantes :
${JSON.stringify(statistiques, null, 2)}

Rédige un résumé du tableau de bord en français, professionnel et facile à comprendre.

Présente exactement 3 points :
1. Volume : indique le nombre total de colis et ce qu'il représente.
2. Vigilance : identifie les statuts à surveiller, en particulier les échecs de livraison et les colis en attente.
3. Recommandation : propose une action concrète adaptée aux chiffres fournis.

Règles importantes :
- Utilise uniquement les chiffres fournis.
- N'invente ni cause, ni date, ni tendance.
- Ne dis pas qu'une situation augmente ou diminue sans données historiques.
- Si aucun échec n'est enregistré, indique-le clairement.
- Ne présente pas une hypothèse comme un fait.
- Fais des phrases courtes et utiles.
`;

    const aiResponse = await ai.models.generateContent({
      model: "gemini-3.5-flash-lite",
      contents: prompt,
    });

    const summary = aiResponse.text?.trim();

    if (!summary) {
      throw new Error("Gemini n'a pas retourné de résumé.");
    }

    console.log("Résumé IA du dashboard généré.");

    return res.json({
      statistiques,
      summary,
    });
  } catch (error) {
    console.error("Erreur résumé dashboard IA :", error);

    return res.status(500).json({
      error: "Impossible de générer le résumé IA.",
    });
  }
});

app.listen(PORT, () => {
  console.log(`AI Backend démarré sur http://localhost:${PORT}`);
});