// /api/preview-auth.js — Vercel Serverless Function
// Vérifie le mot de passe du mode preview de PlanStart Idea
// COPIER dans /api/preview-auth.js à la racine du projet
//
// IMPORTANT : définir la variable d'environnement PREVIEW_PASSWORD sur Vercel
// (Settings → Environment Variables → PREVIEW_PASSWORD = ethanjulia98)
// Le mot de passe n'apparaît jamais dans le code client.

export default function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", process.env.ALLOWED_ORIGIN || "https://planstart.fr");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  const { password } = req.body || {};

  // Fallback sur la valeur en dur uniquement si la variable d'env n'est pas définie
  const expected = process.env.PREVIEW_PASSWORD || "ethanjulia98";

  if (typeof password === "string" && password === expected) {
    return res.status(200).json({ ok: true });
  }

  return res.status(401).json({ ok: false });
}
