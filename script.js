document.addEventListener("DOMContentLoaded", () => {
  const grid = document.querySelector("[data-maillots-grid]");
  if (!grid) return;

  const filtersBar = document.querySelector("[data-filters]");
  const limit = parseInt(grid.dataset.limit || "0", 10); // 0 = pas de limite

  // Popup / modal
  const modal = document.getElementById("maillot-modal");
  const modalBody = document.getElementById("maillot-modal-body");
  const modalCloseEls = document.querySelectorAll("[data-modal-close]");

  let allMaillots = [];
  let filteredMaillots = [];

  // 🔁 Charger les maillots (via API Node)
  fetch("/api/maillots")
    .then((res) => res.json())
    .then((maillots) => {
      allMaillots = Array.isArray(maillots)
        ? maillots.map((m) => ({
            ...m,
            stock: m.stock != null ? Number(m.stock) : 0,
          }))
        : [];
      filteredMaillots = allMaillots;

      if (filtersBar) {
        setupFilters(allMaillots);
      }

      renderMaillots();
      setupCardClicks(); // ← important !
    })
    .catch((err) => {
      console.error("Erreur chargement maillots", err);
      grid.innerHTML =
        '<p style="color:#f87171;">Impossible de charger la liste des maillots.</p>';
    });

  // 🎨 Affiche les maillots dans la grille
  function renderMaillots() {
    grid.innerHTML = "";

    let list = filteredMaillots;
    if (limit > 0) {
      list = list.slice(0, limit);
    }

    if (list.length === 0) {
      grid.innerHTML = "<p>Aucun maillot ne correspond aux filtres.</p>";
      return;
    }

    list.forEach((m) => {
      const card = document.createElement("article");
      card.className = "card";
      card.dataset.id = m.id;

      const nom = m.nom || "Maillot";
      const club = m.club || "";
      const cat = m.categorie || "";
      const prix = m.prix != null ? Number(m.prix) : 20;
      const tailles = Array.isArray(m.taille)
        ? m.taille.join(" / ")
        : (m.taille || "S / M / L");
      const img =
        m.image || "https://via.placeholder.com/300x300?text=Maillot";

      const stock = m.stock != null ? Number(m.stock) : 0;
      const inStock = stock > 0;

      if (!inStock) {
        card.classList.add("card-out");
      }

      card.innerHTML = `
        <div class="card-image-wrapper">
          <img src="${img}" alt="${nom}">
        </div>
        <div class="card-body">
          <div class="card-title-row">
            <div class="card-title">${nom}</div>
            <span class="stock-badge ${inStock ? "in" : "out"}">
              ${inStock ? "En stock" : "Rupture"}
            </span>
          </div>
          <div class="card-meta">${club}${cat ? " • " + cat : ""}</div>
          <div class="card-price">${prix.toFixed(2)} €</div>
          <div class="card-sizes">Tailles : ${tailles}</div>
          ${
            inStock
              ? `<div class="card-stock-info">Quantité restante : ${stock}</div>`
              : ""
          }
        </div>
      `;

      grid.appendChild(card);
    });
  }
  // 🧠 Installe les filtres (vitrine seulement)
  function setupFilters(maillots) {
    const searchInput = document.getElementById("filter-search");
    const catSelect = document.getElementById("filter-categorie");
    const tailleSelect = document.getElementById("filter-taille");
    const stockSelect = document.getElementById("filter-stock");

    const categories = new Set();
    const taillesSet = new Set();

    maillots.forEach((m) => {
      if (m.categorie) categories.add(m.categorie);

      if (Array.isArray(m.taille)) {
        m.taille.forEach((t) => taillesSet.add(t));
      } else if (m.taille) {
        taillesSet.add(m.taille);
      }
    });

    categories.forEach((cat) => {
      const opt = document.createElement("option");
      opt.value = cat;
      opt.textContent = cat;
      catSelect.appendChild(opt);
    });

    Array.from(taillesSet)
      .sort()
      .forEach((t) => {
        const opt = document.createElement("option");
        opt.value = t;
        opt.textContent = t;
        tailleSelect.appendChild(opt);
      });

    searchInput.addEventListener("input", applyFilters);
    catSelect.addEventListener("change", applyFilters);
    tailleSelect.addEventListener("change", applyFilters);
    stockSelect.addEventListener("change", applyFilters);

    applyFilters();

    function applyFilters() {
      const term = searchInput.value.toLowerCase().trim();
      const catVal = catSelect.value;
      const tailleVal = tailleSelect.value;
      const stockVal = stockSelect.value; // "", "in", "out"

      filteredMaillots = allMaillots.filter((m) => {
        const haystack = `${m.nom || ""} ${m.club || ""} ${
          m.categorie || ""
        }`.toLowerCase();

        if (term && !haystack.includes(term)) return false;
        if (catVal && m.categorie !== catVal) return false;

        if (tailleVal) {
          if (Array.isArray(m.taille)) {
            if (!m.taille.includes(tailleVal)) return false;
          } else if (m.taille !== tailleVal) return false;
        }

        const stock = m.stock != null ? Number(m.stock) : 0;
        const inStock = stock > 0;

        if (stockVal === "in" && !inStock) return false;
        if (stockVal === "out" && inStock) return false;

        return true;
      });

      renderMaillots();
      setupCardClicks(); // ← réactive les clics après filtrage
    }
  }

  // 🖱️ Gestion des clics sur les cartes
  function setupCardClicks() {
    if (!modal || !modalBody) return;

    grid.querySelectorAll(".card").forEach((card) => {
      card.addEventListener("click", () => {
        const id = card.dataset.id;
        const maillot = allMaillots.find(
          (m) => String(m.id) === String(id)
        );
        if (!maillot) return;
        openModal(maillot);
      });
    });

    modalCloseEls.forEach((el) => el.addEventListener("click", closeModal));
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape") closeModal();
    });
  }
  // 🪟 Ouvrir la popup
  function openModal(m) {
    const nom = m.nom || "Maillot";
    const club = m.club || "";
    const cat = m.categorie || "";
    const prix = m.prix != null ? Number(m.prix) : 20;
    const tailles = Array.isArray(m.taille)
      ? m.taille.join(" / ")
      : (m.taille || "S / M / L");
    const img =
      m.image || "https://via.placeholder.com/400x400?text=Maillot";

    const stock = m.stock != null ? Number(m.stock) : 0;
    const inStock = stock > 0;

    const msgSnap = `Salut, je suis intéressé par le maillot "${nom}" (${club}${cat ? " - " + cat : ""}). Taille à préciser.`;

    modalBody.innerHTML = `
      <div class="modal-layout">
        <div class="modal-image">
          <img src="${img}" alt="${nom}">
        </div>
        <div class="modal-details">
          <h2>${nom}</h2>
          <p class="modal-club">${club}${cat ? " • " + cat : ""}</p>
          <p class="modal-price">${prix.toFixed(2)} €</p>
          <p class="modal-sizes"><strong>Tailles dispo :</strong> ${tailles}</p>
          <p class="modal-stock">
            <span class="stock-badge ${inStock ? "in" : "out"}">
              ${inStock ? "En stock" : "Rupture"}
            </span>
            ${
              inStock
                ? `<span class="modal-stock-text">Quantité restante : ${stock}</span>`
                : `<span class="modal-stock-text">Contacte-nous pour la prochaine dispo.</span>`
            }
          </p>
          <div class="modal-actions">
            <button class="btn" id="copy-snap-btn">Copier le message Snap</button>
            <p class="modal-hint">Colle le message dans Snap et envoie à <strong>hmk.idf</strong>.</p>
          </div>
          <textarea id="snap-message" style="opacity:0; position:absolute; left:-9999px;">${msgSnap}</textarea>
        </div>
      </div>
    `;

    const copyBtn = modalBody.querySelector("#copy-snap-btn");
    const hiddenTextarea = modalBody.querySelector("#snap-message");

    if (copyBtn && hiddenTextarea) {
      copyBtn.addEventListener("click", () => {
        const text = hiddenTextarea.value;
        navigator.clipboard
          .writeText(text)
          .then(() => {
            copyBtn.textContent = "Message copié ✅";
            setTimeout(() => {
              copyBtn.textContent = "Copier le message Snap";
            }, 2000);
          })
          .catch(() => {
            fallbackCopyText(hiddenTextarea, copyBtn);
          });
      });
    }

    modal.classList.add("open");
  }

  // 🔙 Copie fallback si navigateur ancien
  function fallbackCopyText(textarea, button) {
    textarea.select();
    textarea.setSelectionRange(0, 99999);
    const ok = document.execCommand("copy");
    if (ok) {
      button.textContent = "Message copié ✅";
      setTimeout(() => {
        button.textContent = "Copier le message Snap";
      }, 2000);
    } else {
      alert("Copie impossible, fais un copier/coller manuel.");
    }
  }

  // ❌ Fermer la popup
  function closeModal() {
    modal.classList.remove("open");
  }
});
