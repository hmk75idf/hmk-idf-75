// server.js - version avec PostgreSQL

const express = require("express");
const session = require("express-session");
const path = require("path");
const { Pool } = require("pg");

const app = express();
const PORT = process.env.PORT || 3000;

// Render HTTPS proxy
app.set("trust proxy", 1);

// ENV
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "hmk2025";
const SESSION_SECRET = process.env.SESSION_SECRET || "dev-secret";
const DATABASE_URL = process.env.DATABASE_URL;

// Connexion PostgreSQL
const pool = new Pool({
  connectionString: DATABASE_URL,
  ssl: {
    rejectUnauthorized: false,
  },
});


async function initDB() {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS maillots (
        id        INTEGER PRIMARY KEY,
        nom       TEXT NOT NULL,
        club      TEXT,
        categorie TEXT,
        prix      NUMERIC(10,2),
        taille    TEXT,
        image     TEXT,
        stock     INTEGER
      );
    `);
    console.log("Table maillots OK");
  } catch (err) {
    console.error("Erreur création table:", err);
  }
}
initDB();


// Middlewares
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Sessions
app.use(
  session({
    secret: SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      secure: true,
      sameSite: "none",
      maxAge: 7 * 24 * 60 * 60 * 1000,
    },
  })
);

// Fichiers statiques
app.use(express.static(__dirname));

// ---- ADMIN ----
function requireAdmin(req, res, next) {
  if (req.session && req.session.isAdmin) return next();
  return res.status(401).json({ error: "Non autorisé" });
}

app.get("/api/me", (req, res) => {
  res.json({ isAdmin: !!req.session.isAdmin });
});

app.post("/api/login", (req, res) => {
  if (req.body.password === ADMIN_PASSWORD) {
    req.session.isAdmin = true;
    return res.json({ success: true });
  }
  return res.status(401).json({ error: "Mot de passe incorrect" });
});

app.post("/api/logout", (req, res) => {
  req.session.destroy(() => res.json({ success: true }));
});

// ---- DB FUNCTIONS ----
async function getMaillots() {
  const r = await pool.query(
    "SELECT id, nom, club, categorie, prix, taille, image, stock FROM maillots ORDER BY id ASC"
  );
  return r.rows.map((m) => ({
    ...m,
    prix: Number(m.prix),
    stock: Number(m.stock),
    taille: m.taille ? m.taille.split(",").map((t) => t.trim()) : [],
  }));
}

async function saveMaillots(list) {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    await client.query("DELETE FROM maillots");

    for (const m of list) {
      await client.query(
        `
        INSERT INTO maillots (id, nom, club, categorie, prix, taille, image, stock)
        VALUES ($1,$2,$3,$4,$5,$6,$7,$8)
      `,
        [
          Number(m.id),
          m.nom,
          m.club || "",
          m.categorie || "",
          Number(m.prix),
          Array.isArray(m.taille) ? m.taille.join(",") : "",
          m.image || "",
          Number(m.stock),
        ]
      );
    }

    await client.query("COMMIT");
  } catch (e) {
    await client.query("ROLLBACK");
    throw e;
  } finally {
    client.release();
  }
}

// ---- API MAILLOTS ----
app.get("/api/maillots", async (req, res) => {
  try {
    const maillots = await getMaillots();
    res.json(maillots);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Erreur chargement maillots" });
  }
});

app.post("/api/maillots", requireAdmin, async (req, res) => {
  if (!Array.isArray(req.body))
    return res.status(400).json({ error: "Format invalide" });

  try {
    await saveMaillots(req.body);
    res.json({ success: true });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Erreur sauvegarde maillots" });
  }
});

// ---- ROOT ----
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "index.html"));
});

app.listen(PORT, () => console.log(`Serveur lancé sur ${PORT}`));
