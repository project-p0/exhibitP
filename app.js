let PRODUCTS = [];
let ORDER = { brands: [], strength: {} }; // from order.json (optional)
let ALT_PRODUCTS = [];
let altLoaded = false;
let showingAlt = false;
let activeCategory = "All";
let activeVariant = null; // e.g. "6mg" -> show every available item with that strength
let filterMode = "brand"; // "brand" (default on every load) or "strength"
const FILTER_ICON = `<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 5h16l-6 7.2V19l-4 2v-8.8L4 5z"/></svg>`;

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
  try {
    const r = await fetch("order.json", { cache: "no-store" });
    if (r.ok) ORDER = Object.assign({ brands: [], strength: {} }, await r.json());
  } catch (err) { /* order.json is optional */ }
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
  activeVariant = null;
  filterMode = "brand";
  searchInput.value = "";
  renderCategoryNav();
  render();
}

// Strength groups shown in "strength" mode. Each chip lists every available
// item that has an mg variant inside the group; a group with nothing
// available gets no chip, so a chip never opens an empty list.
const STRENGTH_GROUPS = [
  { label: "6mg",         test: mg => mg === 6 },
  { label: "9mg - 12mg",  test: mg => mg >= 9 && mg <= 12 },
  { label: "14mg - 17mg", test: mg => mg >= 14 && mg <= 17 },
  { label: ">20mg",       test: mg => mg >= 20 } // includes 20mg itself
];

function parseMg(variant) {
  const m = /^(\d+(?:\.\d+)?)\s*mg$/i.exec(String(variant).trim());
  return m ? parseFloat(m[1]) : null;
}

// Stable sort by a brand list (order.json). Brands not listed keep their
// original relative order and go after the listed ones.
function sortByBrandList(items, list) {
  if (!list || !list.length) return items;
  const rank = c => { const i = list.indexOf(c); return i === -1 ? list.length : i; };
  return items.map((p, i) => ({ p, i })).sort((a, b) => rank(a.p.category) - rank(b.p.category) || a.i - b.i).map(x => x.p);
}

function isAvailable(p) {
  return p.stock !== "out";
}

// A chip label is either one of the mg groups above or an exact variant such as "5%".
function matchesStrength(p, label) {
  const group = STRENGTH_GROUPS.find(g => g.label === label);
  return (p.variants || []).some(v => {
    if (!group) return String(v).trim() === label;
    const mg = parseMg(v);
    return mg !== null && group.test(mg);
  });
}

const PERCENT_RE = /^\d+(\.\d+)?\s*%$/;

function strengthOptions() {
  const live = activeProducts().filter(p => !p.isDivider && isAvailable(p));
  const groups = STRENGTH_GROUPS.filter(g => live.some(p => matchesStrength(p, g.label))).map(g => g.label);
  const percents = new Set();
  live.forEach(p => (p.variants || []).forEach(v => {
    const s = String(v).trim();
    if (PERCENT_RE.test(s)) percents.add(s);
  }));
  return [...groups, ...[...percents].sort((x, y) => parseFloat(x) - parseFloat(y))];
}

function renderCategoryNav() {
  const strengths = strengthOptions();
  if (!strengths.length) filterMode = "brand";
  const brands = sortByBrandList(
    [...new Set(activeProducts().filter(p => !p.isDivider).map(p => p.category))].map(category => ({ category })),
    showingAlt ? [] : ORDER.brands
  ).map(p => p.category);

  const chip = (attr, value, pressed) =>
    `<button class="chip" ${attr}="${escapeHtml(value)}" aria-pressed="${pressed}">${escapeHtml(value)}</button>`;

  let html = chip("data-cat", "All", !activeVariant && activeCategory === "All");
  if (strengths.length) {
    html += `<button class="chip filter-btn" type="button" id="filter-btn" aria-label="Filter by strength" aria-pressed="${filterMode === "strength"}">${FILTER_ICON}</button>`;
  }
  html += filterMode === "strength"
    ? strengths.map(s => chip("data-variant", s, s === activeVariant)).join("")
    : brands.map(cat => chip("data-cat", cat, !activeVariant && cat === activeCategory)).join("");
  nav.innerHTML = html;

  const selectable = nav.querySelectorAll(".chip[data-cat], .chip[data-variant]");
  selectable.forEach(btn => {
    btn.addEventListener("click", () => {
      if (btn.dataset.variant) {
        activeVariant = btn.dataset.variant;
        activeCategory = "All";
      } else {
        activeVariant = null;
        activeCategory = btn.dataset.cat;
      }
      selectable.forEach(b => b.setAttribute("aria-pressed", b === btn));
      render();
      btn.scrollIntoView({ behavior: "smooth", inline: "center", block: "nearest" });
    });
  });

  const filterBtn = document.getElementById("filter-btn");
  if (filterBtn) filterBtn.addEventListener("click", toggleFilterMode);
}

// Funnel button: grey = browse by brand (default), yellow = browse by strength.
function toggleFilterMode() {
  filterMode = filterMode === "strength" ? "brand" : "strength";
  activeCategory = "All";
  activeVariant = null;
  renderCategoryNav();
  render();
}

function render() {
  const query = searchInput.value.trim().toLowerCase();
  const source = activeProducts();
  const realProducts = source.filter(p => !p.isDivider);

  let displayItems = source.filter(p => {
    if (p.isDivider) {
      // only show a divider when its category is actually on screen,
      // and hide it while searching (a floating gap mid-search looks broken)
      return !query && !activeVariant && (activeCategory === "All" || activeCategory === p.category);
    }
    const inCategory = activeCategory === "All" || p.category === activeCategory;
    const matchesQuery = !query ||
      p.name.toLowerCase().includes(query) ||
      p.sku.toLowerCase().includes(query);
    // strength view: available items only, kept in the same order as the main listing
    const matchesVariant = !activeVariant ||
      (isAvailable(p) && matchesStrength(p, activeVariant));
    return inCategory && matchesQuery && matchesVariant;
  });

  if (activeVariant && !showingAlt) {
    displayItems = sortByBrandList(displayItems, (ORDER.strength && ORDER.strength[activeVariant]) || ORDER.brands);
  }

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
      <span class="sku-tag">${activeVariant ? escapeHtml(p.category) + " · " : ""}${escapeHtml(p.sku)}</span>
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