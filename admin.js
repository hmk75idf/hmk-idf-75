// admin.js - version sécurisée avec login via /api/login

document.addEventListener("DOMContentLoaded", () => {
  const loginForm = document.getElementById("admin-login-form");
  const passwordInput = document.getElementById("admin-password");
  const loginMessage = document.getElementById("admin-login-message");
  const loginSection = document.getElementById("admin-login-section");
  const adminPanel = document.getElementById("admin-panel");
  const infoMsg = document.getElementById("admin-info-message");

  const tableBody = document.getElementById("maillots-table-body");

  const form = document.getElementById("maillot-form");
  const formTitle = document.getElementById("form-title");
  const idInput = document.getElementById("maillot-id");
  const nomInput = document.getElementById("maillot-nom");
  const clubInput = document.getElementById("maillot-club");
  const catInput = document.getElementById("maillot-cat");
  const prixInput = document.getElementById("maillot-prix");
  const taillesInput = document.getElementById("maillot-tailles");
  const imageInput = document.getElementById("maillot-image");
  const stockInput = document.getElementById("maillot-stock");

  const resetFormBtn = document.getElementById("reset-form-btn");
  const saveAllBtn = document.getElementById("save-all-btn");

  let maillots = [];

  // 🔍 Vérifier si l'utilisateur est déjà connecté (session)
  checkAuth();

  function checkAuth() {
    fetch("/api/me")
      .then((res) => res.json())
      .then((data) => {
        if (data.isAdmin) {
          // déjà connecté
          loginSection.style.display = "none";
          adminPanel.style.display = "block";
          chargerMaillots();
        } else {
          // pas connecté
          loginSection.style.display = "block";
          adminPanel.style.display = "none";
        }
      })
      .catch(() => {
        loginSection.style.display = "block";
        adminPanel.style.display = "none";
      });
  }

  // 🔐 LOGIN via serveur
  loginForm.addEventListener("submit", (e) => {
    e.preventDefault();
    loginMessage.textContent = "";

    const pwd = passwordInput.value.trim();
    if (!pwd) {
      loginMessage.textContent = "Mot de passe requis.";
      return;
    }

    fetch("/api/login", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ password: pwd }),
    })
      .then((res) => {
        if (res.ok) return res.json();
        if (res.status === 401) {
          throw new Error("bad-password");
        }
        throw new Error("server-error");
      })
      .then(() => {
        // login réussi
        passwordInput.value = "";
        loginMessage.textContent = "";
        loginSection.style.display = "none";
        adminPanel.style.display = "block";
        chargerMaillots();
      })
      .catch((err) => {
        if (err.message === "bad-password") {
          loginMessage.textContent = "Mot de passe incorrect.";
        } else {
          loginMessage.textContent =
            "Erreur de connexion. Réessaie plus tard.";
        }
      });
  });

  // 🔄 Charger les maillots
  function chargerMaillots() {
    infoMsg.textContent = "Chargement des maillots...";
    fetch("/api/maillots")
      .then((res) => {
        if (!res.ok) throw new Error("Erreur HTTP");
        return res.json();
      })
      .then((data) => {
        maillots = (Array.isArray(data) ? data : []).map((m, index) => {
          const idNum = Number(m.id);
          const stockNum = m.stock != null ? Number(m.stock) : 0;
          return {
            ...m,
            id: Number.isNaN(idNum) ? index + 1 : idNum,
            stock: Number.isNaN(stockNum) ? 0 : stockNum,
          };
        });
        renderTable();
        infoMsg.textContent = "Maillots chargés.";
      })
      .catch((err) => {
        console.error("Erreur chargement /api/maillots", err);
        infoMsg.textContent = "Erreur : impossible de charger les maillots.";
      });
  }

  // 🎨 TABLE D’AFFICHAGE
  function renderTable() {
    tableBody.innerHTML = "";

    if (maillots.length === 0) {
      const tr = document.createElement("tr");
      const td = document.createElement("td");
      td.colSpan = 9;
      td.textContent = "Aucun maillot.";
      td.style.padding = "6px";
      tr.appendChild(td);
      tableBody.appendChild(tr);
      return;
    }

    maillots.forEach((m) => {
      const tr = document.createElement("tr");

      const tdId = document.createElement("td");
      tdId.textContent = m.id;

      const tdNom = document.createElement("td");
      tdNom.textContent = m.nom;

      const tdClub = document.createElement("td");
      tdClub.textContent = m.club || "";

      const tdCat = document.createElement("td");
      tdCat.textContent = m.categorie || "";

      const tdPrix = document.createElement("td");
      tdPrix.textContent = (m.prix != null ? m.prix : "") + " €";

      const tdTailles = document.createElement("td");
      tdTailles.textContent = Array.isArray(m.taille)
        ? m.taille.join(" / ")
        : m.taille || "";

      const tdImage = document.createElement("td");
      tdImage.textContent = m.image || "";

      const tdStock = document.createElement("td");
      tdStock.textContent = m.stock != null ? m.stock : 0;

      const tdActions = document.createElement("td");

      const editBtn = document.createElement("button");
      editBtn.textContent = "Modifier";
      editBtn.className = "btn";
      editBtn.addEventListener("click", () => remplirFormulaire(m));

      const delBtn = document.createElement("button");
      delBtn.textContent = "Supprimer";
      delBtn.className = "btn btn-secondary";
      delBtn.style.marginLeft = "4px";
      delBtn.addEventListener("click", () => supprimerMaillot(m.id));

      tdActions.appendChild(editBtn);
      tdActions.appendChild(delBtn);

      tr.appendChild(tdId);
      tr.appendChild(tdNom);
      tr.appendChild(tdClub);
      tr.appendChild(tdCat);
      tr.appendChild(tdPrix);
      tr.appendChild(tdTailles);
      tr.appendChild(tdImage);
      tr.appendChild(tdStock);
      tr.appendChild(tdActions);

      tableBody.appendChild(tr);
    });
  }

  // ✏️ REMPLIR FORMULAIRE
  function remplirFormulaire(m) {
    formTitle.textContent = "Modifier un maillot";
    idInput.value = m.id;
    nomInput.value = m.nom || "";
    clubInput.value = m.club || "";
    catInput.value = m.categorie || "";
    prixInput.value = m.prix != null ? m.prix : "";
    taillesInput.value = Array.isArray(m.taille)
      ? m.taille.join(",")
      : m.taille || "";
    imageInput.value = m.image || "";
    stockInput.value = m.stock != null ? m.stock : 0;
  }

  // 🗑 SUPPRESSION
  function supprimerMaillot(id) {
    if (!confirm("Supprimer ce maillot ?")) return;
    maillots = maillots.filter((m) => Number(m.id) !== Number(id));
    renderTable();
    infoMsg.textContent = "Maillot supprimé (pense à sauvegarder).";
  }

  // 🧹 RESET FORM
  function resetForm() {
    formTitle.textContent = "Ajouter un maillot";
    idInput.value = "";
    nomInput.value = "";
    clubInput.value = "";
    catInput.value = "";
    prixInput.value = "";
    taillesInput.value = "";
    imageInput.value = "";
    stockInput.value = "";
  }

  resetFormBtn.addEventListener("click", (e) => {
    e.preventDefault();
    resetForm();
  });

  // 💾 AJOUT / MODIF
  form.addEventListener("submit", (e) => {
    e.preventDefault();

    const idVal = idInput.value ? Number(idInput.value) : null;
    const nomVal = nomInput.value.trim();
    const clubVal = clubInput.value.trim();
    const catVal = catInput.value.trim();
    const prixVal = prixInput.value ? Number(prixInput.value) : 20;
    const taillesVal = taillesInput.value.trim();
    const imageVal = imageInput.value.trim();
    const stockVal = stockInput.value ? Number(stockInput.value) : 0;

    if (!nomVal) {
      alert("Nom obligatoire");
      return;
    }

    const taillesArr = taillesVal
      ? taillesVal
          .split(",")
          .map((t) => t.trim())
          .filter(Boolean)
      : [];

    if (idVal != null) {
      const idx = maillots.findIndex((m) => Number(m.id) === idVal);
      if (idx !== -1) {
        maillots[idx] = {
          ...maillots[idx],
          id: idVal,
          nom: nomVal,
          club: clubVal,
          categorie: catVal,
          prix: prixVal,
          taille: taillesArr,
          image: imageVal,
          stock: stockVal,
        };
      }
    } else {
      const maxId =
        maillots.length > 0
          ? Math.max(...maillots.map((m) => Number(m.id) || 0))
          : 0;

      maillots.push({
        id: maxId + 1,
        nom: nomVal,
        club: clubVal,
        categorie: catVal,
        prix: prixVal,
        taille: taillesArr,
        image: imageVal,
        stock: stockVal,
      });
    }

    renderTable();
    resetForm();
    infoMsg.textContent = "Maillot ajouté / modifié (pense à sauvegarder).";

    document.getElementById("downloadShopBtn").addEventListener("click", () => {
  fetch("/api/maillots")
    .then(response => response.json())
    .then(data => {
      const jsonString = JSON.stringify(data, null, 2);

      // Création du fichier JSON en mémoire
      const blob = new Blob([jsonString], { type: "application/json" });
      const url = URL.createObjectURL(blob);

      // Création d'un lien de téléchargement temporaire
      const a = document.createElement("a");
      a.href = url;
      a.download = "shop_backup.json"; // 👈 NOM OBLIGATOIRE
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);

      URL.revokeObjectURL(url);
    })
    .catch(err => {
      console.error("Erreur lors du téléchargement du shop :", err);
      alert("Impossible de télécharger le shop.");
    });
});
  });
});
