// server.js - version sécurisée avec login admin & sessions

const express = require("express");
const fs = require("fs");
const path = require("path");
const session = require("express-session");

const app = express();
const PORT = process.env.PORT || 3000;

// ⚠️ À définir dans Render (Settings > Environment)
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "hmk2025";
const SESSION_SECRET = process.env.SESSION_SECRET || "dev-secret-change-me";

// Middlewares
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(
  session({
    secret: SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production", // true en prod (https)
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 jours
    },
  })
);

// Fichiers statiques (HTML, CSS, JS, images…)
app.use(express.static(__dirname));

// Middleware de protection admin
function requireAdmin(req, res, next) {
  if (req.session && req.session.isAdmin) {
    return next();
  }
  return res.status(401).json({ error: "Non autorisé" });
}

// ---- AUTH ADMIN ----

// Vérifier si connecté (utilisé par admin.js)
app.get("/api/me", (req, res) => {
  res.json({ isAdmin: !!req.session.isAdmin });
});

// Login admin
app.post("/api/login", (req, res) => {
  const { password } = req.body;
  if (!password) {
    return res.status(400).json({ error: "Mot de passe requis" });
  }

  if (password === ADMIN_PASSWORD) {
    req.session.isAdmin = true;
    return res.json({ success: true });
  }

  return res.status(401).json({ error: "Mot de passe incorrect" });
});

// Logout admin (optionnel, pour plus tard)
app.post("/api/logout", (req, res) => {
  req.session.destroy(() => {
    res.json({ success: true });
  });
});

// ---- API MAILLOTS ----

// Lecture maillots (PUBLIC - vitrine & index)
app.get("/api/maillots", (req, res) => {
  const filePath = path.join(__dirname, "maillots.json");

  fs.readFile(filePath, "utf-8", (err, data) => {
    if (err) {
      console.error("Erreur lecture maillots.json:", err);
      return res
        .status(500)
        .json({ error: "Impossible de lire maillots.json" });
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

// Écriture maillots (ADMIN uniquement)
app.post("/api/maillots", requireAdmin, (req, res) => {
  const filePath = path.join(__dirname, "maillots.json");
  const payload = req.body;

  fs.writeFile(filePath, JSON.stringify(payload, null, 2), "utf-8", (err) => {
    if (err) {
      console.error("Erreur écriture maillots.json:", err);
      return res
        .status(500)
        .json({ error: "Impossible d'écrire maillots.json" });
    }
    res.json({ success: true });
  });
});

// Route racine
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "index.html"));
});

app.listen(PORT, () => {
  console.log(`Serveur HMK IDF 75 lancé sur le port ${PORT}`);
});
