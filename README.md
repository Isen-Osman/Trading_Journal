# 📊 ISEN Trading Journal

A personal trading journal built for XAU/USD scalping. Designed for disciplined trade logging, performance analysis, and psychology tracking.

---

## 🚀 Getting Started

1. Download the `trading-journal.html` file
2. Open it in **Chrome** (recommended) or Firefox
3. Done — no server, installation, or internet connection required

> All data is saved locally in your browser's **localStorage**.

---

## ⚙️ Features

### 📝 Trade Entry Form
- Date and time of the trade
- Pair (XAU/USD, EUR/USD, GBP/USD, BTC/USD)
- Session (London 08-11, New York 17-20)
- Direction — BUY / SELL
- Entry, Stop Loss, Take Profit, Exit price
- Lot Size
- **Automatic R:R Calculator** — calculated in real time
- Result (WIN / LOSS / BREAKEVEN)
- Strategy used
- **Emotion before trade** (Calm, FOMO, Confident, Revenge, Anxious)
- Reason for entry
- Notes and lessons learned

### 📈 Statistics Dashboard
| Stat | Description |
|------|-------------|
| Total Trades | Total number of logged trades |
| Win Rate | Percentage of winning trades |
| Total P&L | Total profit/loss in $ |
| Avg R:R | Average Risk:Reward ratio |

### 📋 Trade History
- Full table of all logged trades
- Delete individual trades
- Clear All option

### 📏 Sidebar Tools
- **7 trading rules** for XAU/USD scalping
- **Psychology Checklist** — questions to answer before every trade
- **Risk Calculator** for a $200 account

---

## 🧠 Trading Rules (Built-in)

1. **Max 1% risk** per trade — with $200 account = $2 risk
2. **Never trade without SL** — every trade must have a stop loss
3. **Min R:R 1:2** — if the setup doesn't meet this, skip it
4. **No FOMO** — if you missed it, the next setup will come
5. **Max 3 trades** per day — more trades = more mistakes
6. **After 2 losses** — stop for the day, no exceptions
7. **Review your journal** every Friday — learn from mistakes

---

## 💾 Data Storage

- All trades are stored in **localStorage** (browser memory)
- Data persists between sessions on the same browser
- Clearing browser data will erase all trades
- **Recommendation:** Export or screenshot your journal weekly

---

## 📁 File Structure

```
trading-journal.html    ← Single file, everything included
```

No dependencies, no frameworks, no backend. Pure HTML + CSS + JavaScript.

---

## 🎯 Built For

- **Pair:** XAU/USD (Gold)
- **Style:** Scalping
- **Sessions:** London (08:00–11:00) / New York (17:00–20:00)
- **Account:** $200 starting capital
- **Goal:** Prop firm funded account (FTMO, MyForexFunds)

---

## ⚠️ Disclaimer

This tool is for personal trade tracking only. It does not provide financial advice. Always use proper risk management and never risk more than you can afford to lose.