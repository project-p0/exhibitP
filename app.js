let ALL_PRODUCTS = [];
let MAIN_CATALOG = [];
let VAULT_CATALOG = [];
let PRODUCTS = [];

let activeCategory = "All";
let vaultOpen = false;

const grid = document.getElementById("product-grid");
const nav = document.getElementById("category-nav");
const searchInput = document.getElementById("search-input");
const resultCount = document.getElementById("result-count");
const emptyState = document.getElementById("empty-state");
const totalCount = document.getElementById("total-count");
const vaultToggle = document.getElementById("vault-toggle");
const brandTitle = document.querySelector(".brand-text h1");


const viewToggleBtn = document.getElementById("view-toggle");
let compactView = localStorage.getItem("compactView") === "true";




init();

async function init() {
  try {
    const res = await fetch("products.json");
    ALL_PRODUCTS = await res.json();
  } catch (err) {
    grid.innerHTML = `<p class="empty-state">Couldn't load products.json — check the file is in the same folder.</p>`;
    return;
  }
  totalCount.textContent = PRODUCTS.length;
  
  MAIN_CATALOG = ALL_PRODUCTS.filter(p => p.catalog !== "vault");
  VAULT_CATALOG = ALL_PRODUCTS.filter(p => p.catalog === "vault");

  PRODUCTS = MAIN_CATALOG;

  renderCategoryNav();
  render();
  searchInput.addEventListener("input", render);
  vaultToggle.addEventListener("click", toggleVault);

  applyViewMode();

  viewToggleBtn.addEventListener("click", () => {
    compactView = !compactView;
    localStorage.setItem("compactView", compactView);
    applyViewMode();
  });


}

function renderCategoryNav() {
  const categories = ["All", ...new Set(PRODUCTS.map(p => p.category))];
  nav.innerHTML = categories.map(cat => `
    <button class="chip" data-cat="${escapeHtml(cat)}" aria-pressed="${cat === activeCategory}">${escapeHtml(cat)}</button>
  `).join("");

  nav.querySelectorAll(".chip").forEach(btn => {
    btn.addEventListener("click", () => {
      activeCategory = btn.dataset.cat;
      nav.querySelectorAll(".chip").forEach(b => b.setAttribute("aria-pressed", b === btn));
      render();
    });
  });
}

function render() {
  const query = searchInput.value.trim().toLowerCase();

  const filtered = PRODUCTS.filter(p => {
    const inCategory = activeCategory === "All" || p.category === activeCategory;
    const matchesQuery = !query ||
      p.name.toLowerCase().includes(query) ||
      p.sku.toLowerCase().includes(query);
    return inCategory && matchesQuery;
  });

  resultCount.textContent = `${filtered.length} of ${PRODUCTS.length} items`;
  emptyState.hidden = filtered.length !== 0;
  grid.innerHTML = filtered.map(renderCard).join("");
  attachImageFallbacks();
}

function toggleVault() {
  vaultOpen = !vaultOpen;

  PRODUCTS = vaultOpen ? VAULT_CATALOG : MAIN_CATALOG;

  activeCategory = "All";

  if (brandTitle) {
    brandTitle.textContent = vaultOpen ? "Vault" : "Catalogue";
  }

  vaultToggle.setAttribute(
    "aria-label",
    vaultOpen ? "Close Vault" : "Open Vault"
  );

  vaultToggle.classList.toggle("vault-active", vaultOpen);

  renderCategoryNav();
  render();
}

// Looks for images/<SKU>.<ext> for each product, trying a few common
// extensions in turn. If none exist, the image is removed and the
// existing placeholder swatch (category label + pattern) shows through.
const IMAGE_EXTENSIONS = ["jpg", "jpeg", "png", "webp"];

function attachImageFallbacks() {
  grid.querySelectorAll(".swatch-img").forEach(img => {
    const sku = img.dataset.sku;
    let extIndex = 0;

    function tryNextExtension() {
      if (extIndex >= IMAGE_EXTENSIONS.length) {
        img.remove(); // no matching image found — fallback label shows through
        return;
      }
      img.src = `images/${sku}.${IMAGE_EXTENSIONS[extIndex]}`;
      extIndex++;
    }

    img.addEventListener("error", tryNextExtension);
    tryNextExtension();
  });
}



function renderCard(p) {
  const stockLabel = { in: "In stock", low: "Low stock", out: "Out of stock" }[p.stock] || "";
  return `
    <article class="card stock-${p.stock}">
      ${p.stock === "out"? `<div class="out-overlay">OUT OF STOCK</div>` : ""}
      <div class="swatch">
        <span class="swatch-fallback">${escapeHtml(p.category)}</span>
        <img class="swatch-img" data-sku="${escapeHtml(p.sku)}" alt="${escapeHtml(p.name)}" loading="lazy">
      </div>
      <span class="sku-tag">${escapeHtml(p.sku)}</span>
      <h2 class="card-name">${escapeHtml(p.name)}</h2>
      <div class="variants">
        ${p.variants.map(v => `<span class="variant-chip">${escapeHtml(v)}</span>`).join("")}
      </div>

      <div class="card-footer"> 
      ${
          /*
          `<span class="price">${escapeHtml(p.price)}</span>`
          
        <span class="stock ${p.stock}">${stockLabel}</span>
        */
          ""
        }
      </div>
    </article>
  `;
}



  function applyViewMode() {
    grid.classList.toggle("compact-view", compactView);

    viewToggleBtn.textContent = compactView ? "▣" : "▦";
    viewToggleBtn.setAttribute(
      "aria-label",
      compactView ? "Switch to large view" : "Switch to compact view"
    );
  }



function escapeHtml(str) {
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}