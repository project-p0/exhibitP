# Product Catalogue — starter

A static, installable product catalogue. No build step, no framework — just HTML/CSS/JS.

## Files

- `index.html` — page structure + iOS/PWA meta tags
- `styles.css` — all styling
- `app.js` — loads `products.json`, renders cards, handles search + category filter
- `products.json` — your product data (edit this to add real products)
- `manifest.json` — app name/icon config for "Add to Home Screen"
- `icon-192.png`, `icon-512.png` — placeholder icons (swap these for your real logo, same filenames, same sizes)

## Editing products

Open `products.json` and edit/add entries in this shape:

```json
{
  "sku": "AX-1001",
  "name": "Product Name",
  "category": "Category A",
  "price": "$19.00",
  "variants": ["Small", "Medium", "Large"],
  "stock": "in"
}
```

`stock` accepts `"in"`, `"low"`, or `"out"`. `category` values automatically become the filter chips at the top — add a new category name and it'll show up on its own.

Swap in real photos by adding an `image` field with a URL and updating the `.swatch` div in `app.js` to render an `<img>` instead of the category label — happy to wire that up once you have images ready.

## Deploy to GitHub Pages (free)

1. Create a new GitHub repo, e.g. `product-catalogue`
2. Push these files to the `main` branch (root of repo, or a `/docs` folder — either works)
3. In the repo: **Settings → Pages → Source** → select `main` branch (and folder, if using `/docs`)
4. GitHub gives you a URL like `https://yourusername.github.io/product-catalogue/`
5. Wait ~1 minute for the first deploy, then visit the URL

## Add to iPhone home screen

1. Open the deployed URL in **Safari** (must be Safari, not Chrome, for this to work on iOS)
2. Tap the **Share** icon → **Add to Home Screen**
3. It'll launch full-screen using `icon-192.png`/`icon-512.png` and the name from `manifest.json` — no Safari address bar, just like a native app

## Updating the live site later

Any time you edit `products.json` (or anything else) and push to GitHub, Pages automatically redeploys within a minute or two. No rebuild step needed.
