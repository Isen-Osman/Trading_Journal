# 📊 OSMAN Trading Journal — Pro Edition

A professional trading journal built with **Onion Architecture** (Python/Flask backend) and **SQLite** persistence. Designed for XAU/USD scalping with built-in **Gemini AI** analysis.

---

## 🚀 Getting Started

1. **Install dependencies:**
   ```bash
   pip install -r requirements.txt
   ```
2. **Setup environment:**
   Create a `.env` file and add your `GEMINI_API_KEY`.
3. **Run the server:**
   ```bash
   python server.py
   ```
4. **Open in browser:**
   Go to `http://localhost:8085`

---

## 🆕 New Features (Added Today)

### 📸 AI Screenshot Auto-Fill (MetaTrader)
- **OCR Integration:** Upload a screenshot of your MetaTrader trade (from your phone or desktop).
- **Automated Extraction:** Gemini AI automatically extracts:
  - **Pair** (e.g., USD/JPY, XAU/USD)
  - **Direction** (BUY/SELL)
  - **Lot Size** (e.g., 0.01)
  - **Entry & Exit Prices**
  - **Stop Loss & Take Profit**
  - **P&L** (with automatic WIN/LOSS detection)
  - **Date & Time** of the trade
- **Verification Dialog:** Review and confirm extracted data before it auto-fills the entry form.

### 🛠️ Logging & Stability Fixes
- **Database Migration:** Added `image` column to the `trades` table for future screenshot storage.
- **Improved API Error Handling:** Better server-side validation and visible error alerts for trade logging.
- **Field Consistency:** Updated frontend and backend to ensure all trade metadata (R:R, Notes, Reason) is correctly synced.

---

## ⚙️ Core Features

### 📝 AI-Powered Trade Entry
- **Manual or Auto-Fill:** Log trades manually or via AI screenshot extraction.
- **Automatic R:R Calculator:** Calculated in real-time based on your Entry, SL, and TP.
- **Emotion Tracking:** Log your psychological state (Calm, FOMO, Confident, etc.).
- **Session Intelligence:** Track performance across Asian, London, and New York sessions.

### ✨ AI Analysis (Gemini 2.5)
- **Performance Coaching:** AI analyzes your trade history and gives strict, professional advice in Macedonian.
- **Chart Analysis:** Upload any chart screenshot for a "Sniper Trader" second opinion on your setup.
- **Pre-Trade Check:** Get a discipline check based on your custom rules before entering a position.

### 📈 Statistics & Charts
- **Equity Curve:** Live tracking of your account growth.
- **Advanced Metrics:** Win Rate, Profit Factor, and Net P&L.
- **Visual Analytics:** Performance by Pair, Emotion, Session, and Direction.

### 🔥 Quantum News Feed
- **Live Forex News:** Real-time sentiment analysis for USD and XAU.
- **Panic Mode:** Visual alerts for high-impact news events.
- **Weekly Calendar:** Integrated economic calendar view.

---

## 📁 Project Structure (Onion Architecture)

```
/src
  ├── api/             # Flask Routes (API Layer)
  ├── application/     # Business Logic & AI Services
  ├── domain/          # Entities & Repository Interfaces
  └── infrastructure/  # SQLite Persistence & News Clients
/static                # Frontend Assets (CSS/JS)
/templates             # HTML Components
```

---

## 🎯 Built For

- **Pair:** XAU/USD (Gold) & Major FX
- **Style:** Scalping / Day Trading
- **Account Goal:** Prop Firm Funding (FTMO, Topstep)
- **Stack:** Python, Flask, SQLite, Gemini AI, Chart.js, Socket.io

---

## ⚠️ Disclaimer

This tool is for personal trade tracking only. It does not provide financial advice. Always use proper risk management.
