# 📋 Recruiting Agents (RA) Outreach CRM

A fully functional, client-side CRM application for managing, searching, and conducting outreach to recruiting agents across India. Built for speed, productivity, and seamless deployment on **GitHub Pages** with persistent database storage (**IndexedDB** + **SQLite WASM**).

![CRM Preview](https://img.shields.io/badge/Deployment-GitHub%20Pages%20Ready-success)
![Database](https://img.shields.io/badge/Database-IndexedDB%20%2B%20SQLite%20WASM-blue)
![Records](https://img.shields.io/badge/Records-1%2C988%20Agents-orange)

---

## ✨ Features

### 🗄️ Database & Storage
- **Browser-Persistent Database**: Powered by `IndexedDB` with full transactional integrity. Your changes (additions, edits, status updates, notes, deletions) survive browser refreshes and device restarts.
- **SQLite `.db` Compatibility**: Generates and exports binary SQLite `.db` files directly in the browser via `sql.js` (WebAssembly).
- **Import / Export**:
  - Export filtered or entire dataset to **CSV**
  - Export full **JSON Backup**
  - Download binary **SQLite (`recruiting_agents.db`)**
  - Import external **CSV** or **JSON** (Merge or Replace mode)
  - One-click **Reset Database** back to the initial 1,988 records

### 🛠️ Complete CRUD Operations
1. **Create (Add Agent)**:
   - "+ Add Agent" button with auto-generated unique RAID.
   - Comprehensive form for company name, signatory, state, district, RC number, contact info, website, addresses, status, and notes.
2. **Read (Search, Filter, Sort & Inspect)**:
   - Real-time search across names, RAID, signatory, locations, emails, phone numbers, and notes.
   - Multi-status pipeline filters with live counter badges (⚪ New, 🔵 Selected, 🟡 Contacted, 🟢 Agreed, 🔴 Deal Done, ⚫ Not Interested).
   - Dynamic location filters (State + dynamically populated Districts).
   - Contact filters (Has website, No website, Has email, Has phone).
   - Interactive Stats Strip (Total, With website, With email, States covered, Deals won).
   - Side Drawer for deep-dive inspection with instant click-to-call, email, WhatsApp, and copy address actions.
3. **Update (Edit & Inline Status)**:
   - Full "Edit Agent" modal to modify any field.
   - Quick inline status switcher directly from the table or drawer.
   - Auto-saving outreach notes with debounce and visual confirmation.
   - Quick note template chips (e.g. *"Called - No answer"*, *"Sent proposal"*, *"Follow up next week"*).
4. **Delete (Single & Bulk Remove)**:
   - Single agent deletion with confirmation safeguard.
   - Bulk selection checkboxes for batch status updates, bulk CSV export, and bulk deletion.

---

## 🚀 Deploying to GitHub Pages (1-Click Setup)

Since the entire application is client-side with zero backend dependencies, it can be hosted directly on **GitHub Pages** for free:

1. **Push this repository to GitHub**:
   ```bash
   git init
   git add .
   git commit -m "Initial commit: Fully functional Recruiting Agents CRM"
   git remote add origin https://github.com/<your-username>/<repo-name>.git
   git branch -M main
   git push -u origin main
   ```

2. **Enable GitHub Pages**:
   - Go to your repository on GitHub.
   - Click on **Settings** ⚙️ &rarr; **Pages** (in the left sidebar under *Code and automation*).
   - Under **Build and deployment** &rarr; **Source**, select **Deploy from a branch**.
   - Under **Branch**, select `main` and folder `/ (root)`.
   - Click **Save**.

3. **Open your live CRM**:
   - Your application will be live at `https://<your-username>.github.io/<repo-name>/`.

---

## 📁 Project Structure

```text
.
├── index.html                           # Main entry point (GitHub Pages root)
├── css/
│   └── app.css                          # Complete modern styling & dark mode
├── js/
│   ├── data.js                          # Initial database seed (1,988 records)
│   ├── db.js                            # IndexedDB CRUD engine & SQLite export
│   └── app.js                           # Main application controller & UI wiring
├── recruiting_agents.db                 # Original SQLite database
├── no-website-emails.csv                # Filtered leads (emails without website)
├── no-website-phones.csv                # Filtered leads (phones without website)
└── README.md                            # Documentation & deployment guide
```

---

## ⌨️ Keyboard Shortcuts
- <kbd>/</kbd> : Focus global search bar
- <kbd>N</kbd> : Open "Add New Agent" modal
- <kbd>Esc</kbd> : Close active drawer or modal

---

## 🔒 Privacy & Data Sovereignty
All database operations and notes are stored exclusively in your browser's local sandbox (`IndexedDB`). No data is sent to external servers unless you choose to export it.
