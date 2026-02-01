# ☀️ Sunray Savvy Formula Manager

A simple web app to manage skincare formulas, track ingredient inventory, calculate costs, and generate printable batch production tickets.

## Features

- **Formula Management** - Create and edit formulas with ingredient percentages
- **Cost Calculation** - Automatic cost per pound and per unit calculations
- **Profit Margins** - See margin % based on your retail price
- **Inventory Tracking** - Track ingredient quantities and total inventory value
- **Low Stock Alerts** - Visual warning when ingredients drop below 1 lb
- **Batch Tickets** - Generate printable batch tickets with weights in lbs, oz, and grams
- **Inventory Deduction** - Mark batches complete to auto-deduct ingredients from inventory

## Screenshots

The app includes three main sections:
- **Formulas** - View all formulas with cost breakdowns
- **Ingredients** - Manage your ingredient inventory
- **Batches** - Create batches and print production tickets

## Quick Start (Local Development)

1. Make sure you have [Node.js](https://nodejs.org/) installed (v18+)

2. Clone this repository:
```bash
git clone https://github.com/YOUR_USERNAME/sunray-manager.git
cd sunray-manager
```

3. Install dependencies:
```bash
npm install
```

4. Start the development server:
```bash
npm run dev
```

5. Open http://localhost:5173 in your browser

## Deploy to GitHub Pages (Free Hosting)

### First-time setup:

1. Create a new repository on GitHub named `sunray-manager`

2. Update `vite.config.js` - make sure `base` matches your repo name:
```js
base: '/sunray-manager/'
```

3. Push your code to GitHub:
```bash
git init
git add .
git commit -m "Initial commit"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/sunray-manager.git
git push -u origin main
```

4. Build and deploy:
```bash
npm run build
npm run deploy
```

5. Enable GitHub Pages:
   - Go to your repo on GitHub
   - Settings → Pages
   - Source: "Deploy from a branch"
   - Branch: `gh-pages` / `root`
   - Save

6. Your app will be live at: `https://YOUR_USERNAME.github.io/sunray-manager/`

### Updating the live site:

After making changes:
```bash
npm run build
npm run deploy
```

## Data Storage

All data is stored in your browser's localStorage. This means:
- ✅ Data persists between sessions
- ✅ No server or database needed
- ✅ Completely private - data never leaves your computer
- ⚠️ Data is browser-specific (won't sync between devices)
- ⚠️ Clearing browser data will erase your formulas

### Backing up your data

Open browser console (F12) and run:
```javascript
// Export
copy(localStorage.getItem('sunray_ingredients'))
copy(localStorage.getItem('sunray_formulas'))
copy(localStorage.getItem('sunray_batches'))

// Import (paste your backed up JSON)
localStorage.setItem('sunray_ingredients', 'YOUR_JSON_HERE')
localStorage.setItem('sunray_formulas', 'YOUR_JSON_HERE')
localStorage.setItem('sunray_batches', 'YOUR_JSON_HERE')
```

## Batch Ticket Features

When you print a batch ticket, it includes:
- Batch number and product name
- Date created
- List of all ingredients with checkboxes
- Weight in three formats: lbs, oz, and grams
- Cost per lb and total batch cost
- Estimated units produced
- Signature lines for QC

## Customization

### Change brand colors

Edit the CSS variables in `App.jsx`:
```css
:root {
  --gold: #D4A853;
  --olive: #6B7F5E;
  --cream: #FAF8F3;
  --brown: #4A4235;
}
```

### Change default unit size

The default unit size is 0.25 lbs (4 oz). You can change this per-formula when creating or editing.

## Tech Stack

- React 18
- Vite (build tool)
- localStorage (data persistence)
- CSS-in-JS (no external dependencies)

## License

MIT - Use freely for your business!

---

Built with ☀️ for Sunray Savvy - Small Batch Skincare
