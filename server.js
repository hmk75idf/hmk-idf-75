// server.js - version simple sans upload, compatible Render

const express = require("express");
const fs = require("fs");
const path = require("path");

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware pour JSON
app.use(express.json());

// Servir les fichiers statiques (HTML, CSS, JS, images, etc.)
app.use(express.static(__dirname));

// API pour récupérer les maillots
app.get("/api/maillots", (req, res) => {
  const filePath = path.join(__dirname, "maillots.json");

  fs.readFile(filePath, "utf-8", (err, data) => {
    if (err) {
      console.error("Erreur lecture maillots.json:", err);
      return res.status(500).json({ error: "Impossible de lire maillots.json" });
    }

    try {
      const parsed = JSON.parse(data);
      res.json(parsed);
    } catch (e) {
      console.error("Erreur parse maillots.json:", e);
      res.status(500).json({ error: "JSON invalide dans maillots.json" });
    }
  });
});

// API pour sauvegarder les maillots (admin)
app.post("/api/maillots", (req, res) => {
  const filePath = path.join(__dirname, "maillots.json");
  const payload = req.body;

  fs.writeFile(filePath, JSON.stringify(payload, null, 2), "utf-8", (err) => {
    if (err) {
      console.error("Erreur écriture maillots.json:", err);
      return res.status(500).json({ error: "Impossible d'écrire maillots.json" });
    }
    res.json({ success: true });
  });
});

// Fallback: renvoyer index.html pour la racine
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "index.html"));
});

app.listen(PORT, () => {
  console.log(`Serveur HMK IDF 75 lancé sur le port ${PORT}`);
});
