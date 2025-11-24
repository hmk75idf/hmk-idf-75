// server.js
const express = require("express");
const fs = require("fs");
const path = require("path");
const app = express();
const PORT = process.env.PORT || 3000;

// Middleware pour JSON + fichiers statiques
app.use(express.json());
app.use(express.static(path.join(__dirname)));

// Chemin du fichier JSON
const DATA_FILE = path.join(__dirname, "maillots.json");

// GET : récupérer la liste des maillots
app.get("/api/maillots", (req, res) => {
  fs.readFile(DATA_FILE, "utf8", (err, data) => {
    if (err) {
      console.error("Erreur lecture maillots.json", err);
      return res.status(500).json({ error: "Erreur lecture fichier" });
    }
    try {
      const json = JSON.parse(data || "[]");
      res.json(json);
    } catch (e) {
      res.status(500).json({ error: "JSON invalide" });
    }
  });
});

// POST : écraser maillots.json avec le nouveau contenu
app.post("/api/maillots", (req, res) => {
  const body = req.body;

  if (!Array.isArray(body)) {
    return res.status(400).json({ error: "Le corps doit être un tableau" });
  }

  fs.writeFile(DATA_FILE, JSON.stringify(body, null, 2), "utf8", (err) => {
    if (err) {
      console.error("Erreur écriture maillots.json", err);
      return res.status(500).json({ error: "Erreur écriture fichier" });
    }
    res.json({ ok: true });
  });
});
// ---------------------------------------------
// CONFIG UPLOAD IMAGES
// ---------------------------------------------
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads/"); // dossier où les images seront stockées
  },
  filename: (req, file, cb) => {
    // nom unique basé sur la date
    const ext = path.extname(file.originalname);
    const basename = path.basename(file.originalname, ext).replace(/\s+/g, "_");
    cb(null, basename + "_" + Date.now() + ext);
  },
});

const upload = multer({ storage });

// route API pour uploader une image
app.post("/api/upload", upload.single("image"), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: "Aucun fichier reçu." });
  }

  const fileUrl = `/uploads/${req.file.filename}`; // URL accessible depuis le site
  res.json({ url: fileUrl });
});


// Lancer le serveur
app.listen(PORT, () => {
  console.log(`Serveur démarré sur http://localhost:${PORT}`);
});
