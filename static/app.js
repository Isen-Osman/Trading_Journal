// ─── API CALLS (SQLite via Python server) ────────────
const API = '/api/trades';

let selectedDirection = '';
let selectedEmotion   = '';
let profitChart       = null;

// Set current date/time on load
const now = new Date();
document.getElementById('currentDate').textContent = now.toLocaleDateString('en-GB', {
  weekday: 'long', day: '2-digit', month: 'long', year: 'numeric'
});
document.getElementById('tradeDate').value = now.toISOString().split('T')[0];
document.getElementById('tradeTime').value = now.toTimeString().slice(0, 5);

// ─── LOAD TRADES ON START ────────────────────────────
async function loadTrades() {
  try {
    const res    = await fetch(API);
    const trades = await res.json();
    renderTrades(trades);
    updateStats(trades);
    updateChart(trades);
  } catch (e) {
    showToast('⚠️ Cannot connect to server. Is server.py running?');
  }
}

// ─── DIRECTION ───────────────────────────────────────
function setDirection(dir) {
  selectedDirection = dir;
  document.querySelectorAll('.dir-btn').forEach(b => b.classList.remove('active'));
  document.querySelector('.dir-btn.' + dir).classList.add('active');
}

// ─── EMOTION ─────────────────────────────────────────
function setEmotion(emo) {
  selectedEmotion = emo;
  document.querySelectorAll('.emo-btn').forEach(b => b.classList.remove('active'));
  event.target.classList.add('active');
}

// ─── R:R CALCULATOR ──────────────────────────────────
function calcRR() {
  const entry   = parseFloat(document.getElementById('entryPrice').value);
  const sl      = parseFloat(document.getElementById('stopLoss').value);
  const tp      = parseFloat(document.getElementById('takeProfit').value);
  const display = document.getElementById('rrDisplay');

  if (entry && sl && tp) {
    const risk   = Math.abs(entry - sl);
    const reward = Math.abs(tp - entry);
    if (risk > 0) {
      const rr    = (reward / risk).toFixed(2);
      const color = rr >= 2 ? '#22c55e' : rr >= 1 ? '#f0b429' : '#ef4444';
      const icon  = rr >= 2 ? '✅' : rr >= 1 ? '⚠️' : '❌';
      display.innerHTML = `R:R = <span class="rr-val" style="color:${color}">1 : ${rr}</span> ${icon}`;
    }
  } else {
    display.innerHTML = 'Enter Entry, SL & TP to calculate';
  }
}

// ─── ADD TRADE ───────────────────────────────────────
async function addTrade() {
  const date     = document.getElementById('tradeDate').value;
  const time     = document.getElementById('tradeTime').value;
  const pair     = document.getElementById('tradePair').value;
  const session  = document.getElementById('tradeSession').value;
  const entry    = document.getElementById('entryPrice').value;
  const sl       = document.getElementById('stopLoss').value;
  const tp       = document.getElementById('takeProfit').value;
  const exit     = document.getElementById('exitPrice').value;
  const pnl      = document.getElementById('pnlAmount').value;
  const result   = document.getElementById('tradeResult').value;
  const strategy = document.getElementById('tradeStrategy').value;
  const reason   = document.getElementById('entryReason').value;
  const notes    = document.getElementById('tradeNotes').value;
  const lot      = document.getElementById('lotSize').value;

  if (!date || !entry || !sl || !selectedDirection) {
    showToast('⚠️ Fill in: Date, Direction, Entry, SL');
    return;
  }

  let rr = '-';
  if (entry && sl && tp) {
    const risk   = Math.abs(parseFloat(entry) - parseFloat(sl));
    const reward = Math.abs(parseFloat(tp)    - parseFloat(entry));
    if (risk > 0) rr = '1:' + (reward / risk).toFixed(1);
  }

  const trade = {
    date, time, pair, session,
    direction: selectedDirection.toUpperCase(),
    entry: parseFloat(entry),
    sl:    parseFloat(sl),
    tp:    parseFloat(tp)   || null,
    exit:  parseFloat(exit) || null,
    pnl:   parseFloat(pnl)  || null,
    result, strategy,
    emotion: selectedEmotion || 'N/A',
    reason, notes,
    lot: parseFloat(lot) || null,
    rr
  };

  try {
    const res = await fetch(API, {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify(trade)
    });
    if (res.ok) {
      showToast('✅ Trade saved to database!');
      resetForm();
      loadTrades();
    }
  } catch (e) {
    showToast('⚠️ Error saving trade.');
  }
}

// ─── DELETE TRADE ────────────────────────────────────
async function deleteTrade(id) {
  try {
    await fetch(`${API}/${id}`, { method: 'DELETE' });
    loadTrades();
  } catch (e) {
    showToast('⚠️ Error deleting trade.');
  }
}

// ─── CLEAR ALL ───────────────────────────────────────
async function clearAll() {
  if (confirm('Clear ALL trades from database?')) {
    try {
      await fetch(API, { method: 'DELETE' });
      loadTrades();
    } catch (e) {
      showToast('⚠️ Error clearing trades.');
    }
  }
}

// ─── RENDER TABLE ────────────────────────────────────
function renderTrades(trades) {
  const tbody = document.getElementById('tradesBody');
  const empty = document.getElementById('emptyState');

  if (!trades || trades.length === 0) {
    tbody.innerHTML = '';
    empty.style.display = 'block';
    return;
  }

  empty.style.display = 'none';

  tbody.innerHTML = trades.map(t => `
    <tr>
      <td>${t.date}<br><span style="color:var(--text-dim);font-size:10px">${t.time}</span></td>
      <td style="color:var(--gold);font-weight:700">${t.pair}</td>
      <td><span class="badge ${t.direction.toLowerCase()}">${t.direction}</span></td>
      <td>${t.entry}</td>
      <td style="color:var(--red)">${t.sl || '-'}</td>
      <td style="color:var(--green)">${t.tp || '-'}</td>
      <td style="color:var(--accent)">${t.rr}</td>
      <td><span class="badge ${t.result.toLowerCase()}">${t.result}</span></td>
      <td class="${(t.pnl || 0) >= 0 ? 'pnl-positive' : 'pnl-negative'}">
        ${t.pnl != null ? ((t.pnl >= 0 ? '+' : '') + '$' + parseFloat(t.pnl).toFixed(2)) : '-'}
      </td>
      <td style="font-size:11px;color:var(--text-dim)">${t.emotion}</td>
      <td><button class="delete-btn" onclick="deleteTrade(${t.id})">✕</button></td>
    </tr>
  `).join('');
}

// ─── UPDATE STATS ────────────────────────────────────
function updateStats(trades) {
  if (!trades) return;

  const total    = trades.length;
  const wins     = trades.filter(t => t.result === 'WIN').length;
  const winRate  = total > 0 ? Math.round((wins / total) * 100) : 0;
  const totalPnL = trades.reduce((sum, t) => sum + (parseFloat(t.pnl) || 0), 0);

  document.getElementById('statTotal').textContent   = total;
  document.getElementById('statWinRate').textContent = winRate + '%';

  const pnlEl = document.getElementById('statPnL');
  pnlEl.textContent = (totalPnL >= 0 ? '+' : '') + '$' + totalPnL.toFixed(2);
  pnlEl.className   = 'stat-value ' + (totalPnL > 0 ? 'positive' : totalPnL < 0 ? 'negative' : 'neutral');

  const rrTrades = trades.filter(t => t.rr && t.rr !== '-');
  if (rrTrades.length > 0) {
    const avgRR = rrTrades.reduce((sum, t) => {
      const val = parseFloat((t.rr || '0').split(':')[1]) || 0;
      return sum + val;
    }, 0) / rrTrades.length;
    document.getElementById('statRR').textContent = '1:' + avgRR.toFixed(1);
  }
}

// ─── UPDATE CHART ────────────────────────────────────
function updateChart(trades) {
  if (!trades || trades.length === 0) {
    if (profitChart) {
      profitChart.destroy();
      profitChart = null;
    }
    return;
  }

  // Sort trades by date & time
  const sorted = [...trades].sort((a, b) => {
    return (a.date + a.time).localeCompare(b.date + b.time);
  });

  let cumulative = 0;
  const data = sorted.map(t => {
    cumulative += (parseFloat(t.pnl) || 0);
    return cumulative;
  });

  const labels = sorted.map((t, idx) => `Trade #${idx + 1}`);

  const canvas = document.getElementById('profitChart');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');

  if (profitChart) {
    profitChart.destroy();
  }

  profitChart = new Chart(ctx, {
    type: 'line',
    data: {
      labels: labels,
      datasets: [{
        label: 'Cumulative Profit ($)',
        data: data,
        borderColor: '#7c6fff',
        backgroundColor: 'rgba(124, 111, 255, 0.1)',
        borderWidth: 2,
        fill: true,
        tension: 0.3,
        pointBackgroundColor: '#7c6fff',
        pointRadius: 4
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      scales: {
        y: {
          grid: { color: 'rgba(255,255,255,0.05)' },
          ticks: { color: '#7070a0', font: { family: 'Space Mono' } }
        },
        x: {
          grid: { display: false },
          ticks: { color: '#7070a0', font: { family: 'Space Mono' } }
        }
      },
      plugins: {
        legend: { display: false }
      }
    }
  });
}

// ─── RESET FORM ──────────────────────────────────────
function resetForm() {
  ['entryPrice','stopLoss','takeProfit','exitPrice','pnlAmount','entryReason','tradeNotes','lotSize']
    .forEach(id => document.getElementById(id).value = '');

  document.getElementById('rrDisplay').innerHTML = 'Enter Entry, SL & TP to calculate';
  selectedDirection = '';
  selectedEmotion   = '';
  document.querySelectorAll('.dir-btn').forEach(b => b.classList.remove('active'));
  document.querySelectorAll('.emo-btn').forEach(b => b.classList.remove('active'));
  document.getElementById('tradeTime').value = new Date().toTimeString().slice(0, 5);
}

// ─── TOAST ───────────────────────────────────────────
function showToast(msg) {
  const toast = document.getElementById('toast');
  toast.textContent = msg;
  toast.classList.add('show');
  setTimeout(() => toast.classList.remove('show'), 3000);
}

// ─── AI ANALYSIS ──────────────────────────────────────
async function analyzeTrades() {
  const btn = document.getElementById('aiAnalyzeBtn');
  const responseDiv = document.getElementById('aiResponse');
  const btnIcon = btn.querySelector('.btn-icon');

  // Loading state
  btn.disabled = true;
  btnIcon.textContent = '⏳';
  btnIcon.classList.add('loading');
  responseDiv.style.display = 'block';
  responseDiv.innerHTML = '<p style="color:var(--text-dim)">Вашите шеми на тргување се анализираат... 🧠</p>';

  try {
    const res = await fetch('/api/ai/analyze', { method: 'POST' });
    const data = await res.json();

    if (data.analysis) {
      // Simple markdown-ish to HTML conversion
      let html = data.analysis
        .replace(/\n\n/g, '</p><p>')
        .replace(/\n/g, '<br>')
        .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
        .replace(/^\* (.*)/gm, '<li>$1</li>');

      if (html.includes('<li>')) {
        html = html.replace(/(<li>.*<\/li>)/s, '<ul>$1</ul>');
      }

      responseDiv.innerHTML = `<p>${html}</p>`;
    } else {
      responseDiv.innerHTML = '<p>АИ не можеше да генерира анализа. Обидете се да додадете повеќе трејдови.</p>';
    }
  } catch (e) {
    showToast('⚠️ Грешка во АИ сервисот.');
    responseDiv.innerHTML = '<p style="color:var(--red)">Грешка при поврзување со АИ сервисот.</p>';
  } finally {

    btn.disabled = false;
    btnIcon.textContent = '✨';
    btnIcon.classList.remove('loading');
  }
}

// ─── INIT ────────────────────────────────────────────
loadTrades();