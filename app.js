let PRODUCTS = [];
let ALT_PRODUCTS = [];
let altLoaded = false;
let showingAlt = false;
let activeCategory = "All";

const grid = document.getElementById("product-grid");
const nav = document.getElementById("category-nav");
const searchInput = document.getElementById("search-input");
const resultCount = document.getElementById("result-count");
const emptyState = document.getElementById("empty-state");
const brandMark = document.querySelector(".brand-mark");



const viewToggleBtn = document.getElementById("view-toggle");
let compactView = localStorage.getItem("compactView") === "true";



init();

async function init() {
  try {
    const res = await fetch("products.json");
    PRODUCTS = await res.json();
  } catch (err) {
    grid.innerHTML = `<p class="empty-state">Couldn't load products.json — check the file is in the same folder.</p>`;
    return;
  }
  renderCategoryNav();
  render();
  searchInput.addEventListener("input", render);
  

  applyViewMode();

  viewToggleBtn.addEventListener("click", () => {
    compactView = !compactView;
    localStorage.setItem("compactView", compactView);
    applyViewMode();
  });

  if (brandMark) {
    brandMark.style.cursor = "pointer";
    brandMark.setAttribute("role", "button");
    brandMark.setAttribute("tabindex", "0");
    brandMark.addEventListener("click", toggleCollection);
    brandMark.addEventListener("keydown", (e) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        toggleCollection();
      }
    });
  }

}

function activeProducts() {
  return showingAlt ? ALT_PRODUCTS : PRODUCTS;
}

async function toggleCollection() {
  if (!showingAlt && !altLoaded) {
    try {
      const res = await fetch("products-alt.json");
      ALT_PRODUCTS = await res.json();
      altLoaded = true;
    } catch (err) {
      console.warn("Could not load the alternate collection:", err);
      return;
    }
  }

  showingAlt = !showingAlt;
  activeCategory = "All";
  searchInput.value = "";
  renderCategoryNav();
  render();
}

function renderCategoryNav() {
  const categories = ["All", ...new Set(activeProducts().filter(p => !p.isDivider).map(p => p.category))];
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
  const source = activeProducts();
  const realProducts = source.filter(p => !p.isDivider);

  const displayItems = source.filter(p => {
    if (p.isDivider) {
      // only show a divider when its category is actually on screen,
      // and hide it while searching (a floating gap mid-search looks broken)
      return !query && (activeCategory === "All" || activeCategory === p.category);
    }
    const inCategory = activeCategory === "All" || p.category === activeCategory;
    const matchesQuery = !query ||
      p.name.toLowerCase().includes(query) ||
      p.sku.toLowerCase().includes(query);
    return inCategory && matchesQuery;
  });

  const shownCount = displayItems.filter(p => !p.isDivider).length;
  resultCount.textContent = `${shownCount} of ${realProducts.length} items`;
  emptyState.hidden = shownCount !== 0;

  let forceRowStart = false;
  const cardsHtml = [];
  for (const p of displayItems) {
    if (p.isDivider) {
      forceRowStart = true;
      continue; // renders nothing itself — just flags the next real card
    }
    cardsHtml.push(renderCard(p, forceRowStart));
    forceRowStart = false;
  }
  grid.innerHTML = cardsHtml.join("");
  attachImageFallbacks();
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



function renderCard(p, forceRowStart = false) {
  const stockLabel = { in: "In stock", low: "Low stock", out: "Out of stock" }[p.stock] || "";
  return `
    <article class="card stock-${p.stock}${forceRowStart ? " row-start" : ""}">
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