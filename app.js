let PRODUCTS = [];
let activeCategory = "All";

const grid = document.getElementById("product-grid");
const nav = document.getElementById("category-nav");
const searchInput = document.getElementById("search-input");
const resultCount = document.getElementById("result-count");
const emptyState = document.getElementById("empty-state");
const totalCount = document.getElementById("total-count");


const normalViewBtn = document.getElementById("normal-view");
const compactViewBtn = document.getElementById("compact-view");

let activeView = localStorage.getItem("catalogueView") || "normal";


init();

async function init() {
  try {
    const res = await fetch("products.json");
    PRODUCTS = await res.json();
  } catch (err) {
    grid.innerHTML = `<p class="empty-state">Couldn't load products.json — check the file is in the same folder.</p>`;
    return;
  }
  totalCount.textContent = PRODUCTS.length;
  renderCategoryNav();
  render();
  searchInput.addEventListener("input", render);
  
  applyView();

  normalViewBtn.addEventListener("click", () => {
    activeView = "normal";
    localStorage.setItem("catalogueView", activeView);
    applyView();
  });

  compactViewBtn.addEventListener("click", () => {
    activeView = "compact";
    localStorage.setItem("catalogueView", activeView);
    applyView();
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
}



function renderCard(p) {
  const stockLabel = { in: "In stock", low: "Low stock", out: "Out of stock" }[p.stock] || "";
  return `
    <article class="card stock-${p.stock}">
      ${p.stock === "out"? `<div class="out-overlay">OUT OF STOCK</div>` : ""}
      <div class="swatch">${escapeHtml(p.category)}</div>
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


function applyView() {
  grid.classList.toggle("compact-view", activeView === "compact");

  normalViewBtn.setAttribute("aria-pressed", activeView === "normal");
  compactViewBtn.setAttribute("aria-pressed", activeView === "compact");
}


function escapeHtml(str) {
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
