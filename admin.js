// ADMIN.JS - Version propre et stable

/*************************************************
 * 1. Vérification du login admin
 *************************************************/
const loginSection = document.getElementById("admin-login-section");
const panelSection = document.getElementById("admin-panel");
const loginForm = document.getElementById("admin-login-form");
const loginMessage = document.getElementById("admin-login-message");
const adminInfoMsg = document.getElementById("admin-info-message");

async function checkAuth() {
  const res = await fetch("/api/me");
  const data = await res.json();

  if (data.isAdmin) {
    loginSection.style.display = "none";
    panelSection.style.display = "block";
    loadMaillots();
  }
}
checkAuth();

loginForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  const password = document.getElementById("admin-password").value;

  const res = await fetch("/api/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ password }),
  });

  if (res.status === 200) {
    loginSection.style.display = "none";
    panelSection.style.display = "block";
    loadMaillots();
  } else {
    loginMessage.textContent = "Mot de passe incorrect";
  }
});

/*************************************************
 * 2. Chargement des maillots
 *************************************************/
const tableBody = document.getElementById("maillots-table-body");
let maillots = [];

async function loadMaillots() {
  adminInfoMsg.textContent = "Chargement...";

  const res = await fetch("/api/maillots");
  maillots = await res.json();

  renderTable();
  adminInfoMsg.textContent = "Maillots chargés";
}

function renderTable() {
  tableBody.innerHTML = "";

  maillots.forEach((m) => {
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${m.id}</td>
      <td>${m.nom}</td>
      <td>${m.club}</td>
      <td>${m.categorie}</td>
      <td>${m.prix} €</td>
      <td>${m.tailles.join(", ")}</td>
      <td>${m.image}</td>
      <td>${m.stock}</td>
      <td><button class="btn-small edit-btn" data-id="${m.id}">Modifier</button></td>
    `;
    tableBody.appendChild(tr);
  });

  document.querySelectorAll(".edit-btn").forEach((btn) => {
    btn.addEventListener("click", () => editMaillot(btn.dataset.id));
  });
}

/*************************************************
 * 3. Formulaire ajouter / modifier
 *************************************************/
const form = document.getElementById("maillot-form");
const resetBtn = document.getElementById("reset-form-btn");
const saveAllBtn = document.getElementById("save-all-btn");

function editMaillot(id) {
  const m = maillots.find((x) => x.id == id);

  document.getElementById("form-title").textContent = "Modifier un maillot";
  document.getElementById("maillot-id").value = m.id;
  document.getElementById("maillot-nom").value = m.nom;
  document.getElementById("maillot-club").value = m.club;
  document.getElementById("maillot-cat").value = m.categorie;
  document.getElementById("maillot-prix").value = m.prix;
  document.getElementById("maillot-tailles").value = m.tailles.join(",");
  document.getElementById("maillot-stock").value = m.stock;
  document.getElementById("maillot-image").value = m.image;
}

form.addEventListener("submit", (e) => {
  e.preventDefault();

  const id = document.getElementById("maillot-id").value;
  const newObj = {
    id: id ? Number(id) : Date.now(),
    nom: document.getElementById("maillot-nom").value,
    club: document.getElementById("maillot-club").value,
    categorie: document.getElementById("maillot-cat").value,
    prix: Number(document.getElementById("maillot-prix").value),
    tailles: document.getElementById("maillot-tailles").value.split(","),
    stock: Number(document.getElementById("maillot-stock").value),
    image: document.getElementById("maillot-image").value,
  };

  const index = maillots.findIndex((x) => x.id == id);

  if (index >= 0) maillots[index] = newObj;
  else maillots.push(newObj);

  renderTable();
  form.reset();
  document.getElementById("form-title").textContent = "Ajouter un maillot";
});

resetBtn.addEventListener("click", () => {
  form.reset();
  document.getElementById("form-title").textContent = "Ajouter un maillot";
});

/*************************************************
 * 4. Sauvegarder dans maillots.json
 *************************************************/
saveAllBtn.addEventListener("click", async () => {
  adminInfoMsg.textContent = "Sauvegarde...";

  const res = await fetch("/api/maillots", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(maillots),
  });

  if (res.status === 200) adminInfoMsg.textContent = "Sauvegardé ✔";
  else adminInfoMsg.textContent = "Erreur lors de la sauvegarde";
});

/*************************************************
 * 5. Télécharger le shop
 *************************************************/
document.getElementById("downloadShopLink").addEventListener("click", async () => {
  try {
    const res = await fetch("/api/maillots");
    const data = await res.json();

    const blob = new Blob([JSON.stringify(data, null, 2)], {
      type: "application/json"
    });

    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "shop_backup.json";
    a.click();
    URL.revokeObjectURL(url);
  } catch (err) {
    alert("Impossible de télécharger le shop.");
  }
});
