// ─── THEME MANAGEMENT ──────────────────────────────────
function toggleTheme() {
  document.body.classList.toggle('light-mode');
  const isLight = document.body.classList.contains('light-mode');
  localStorage.setItem('theme', isLight ? 'light' : 'dark');
}

// ─── NAVIGATION ────────────────────────────────────────
function switchTab(tabId) {
  console.log('Switching to tab:', tabId);
  
  // 1. Update nav links active state
  document.querySelectorAll('.nav-item').forEach(item => {
    item.classList.remove('active');
    const text = item.textContent.toLowerCase();
    if (
      (tabId === 'stats' && text.includes('statistics')) ||
      (tabId === 'ai' && text.includes('analysis')) ||
      (tabId === 'news' && text.includes('news')) ||
      (tabId === 'journal' && text.includes('journal'))
    ) {
      item.classList.add('active');
    }
  });

  // 2. Switch visible content
  document.querySelectorAll('.tab-content').forEach(tab => {
    tab.classList.remove('active');
  });
  
  const activeTab = document.getElementById(`${tabId}-tab`);
  if (activeTab) {
    activeTab.classList.add('active');
  }

  // 3. Special handling for stats (refresh chart)
  if (tabId === 'stats') {
    loadTrades(); 
  }
}

// ─── SOCKET.IO (Quantum News) ────────────────────────
const socket = io();

socket.on('new_forex_news', (data) => {
  const newsList = document.getElementById('newsList');
  const panicBox = document.getElementById('panicBox');

  if (newsList && newsList.querySelector('.empty-state')) {
    newsList.innerHTML = '';
  }

  if (newsList) {
    const newsEl = document.createElement('div');
    const usdClass = data.usd_sentiment ? data.usd_sentiment.toLowerCase() : 'neutral';
    const isPanic = data.panic_mode;

    newsEl.className = `news-item ${usdClass} ${isPanic ? 'panic' : ''}`;
    newsEl.innerHTML = `
      <div class="news-header">
        <span>${data.published}</span>
        <div>
          USD: <span class="sentiment-badge ${usdClass}">${data.usd_sentiment}</span>
          XAU: <span class="sentiment-badge ${data.xau_sentiment ? data.xau_sentiment.toLowerCase() : 'neutral'}">${data.xau_sentiment}</span>
        </div>
      </div>
      <div class="news-title">${data.title}</div>
      <div class="news-explanation">${data.explanation}</div>
    `;
    newsList.prepend(newsEl);
  }

  // Handle Panic Mode
  if (isPanic && panicBox) {
    panicBox.innerHTML = "⚠️ CRITICAL NEWS: PANIC!";
    panicBox.classList.add('panic-active');
    showToast('🔥 CRITICAL NEWS DETECTED!');
  }
});

// ─── API CALLS (SQLite via Python server) ────────────
const API = '/api/trades';

let selectedDirection = '';
let selectedEmotion   = '';
let profitChart       = null;

// Set current date/time on load
const now = new Date();
if (document.getElementById('currentDate')) {
    document.getElementById('currentDate').textContent = now.toLocaleDateString('en-GB', {
      weekday: 'long', day: '2-digit', month: 'long', year: 'numeric'
    });
}
if (document.getElementById('tradeDate')) document.getElementById('tradeDate').value = now.toISOString().split('T')[0];
if (document.getElementById('tradeTime')) document.getElementById('tradeTime').value = now.toTimeString().slice(0, 5);

// ─── LOAD TRADES ON START ────────────────────────────
async function loadTrades() {
  try {
    const res    = await fetch(API);
    const trades = await res.json();
    renderTrades(trades);
    updateStats(trades);
    updateChart(trades);
  } catch (e) {
    console.error('Error loading trades:', e);
  }
}

// ─── DIRECTION ───────────────────────────────────────
function setDirection(dir) {
  selectedDirection = dir;
  document.querySelectorAll('.dir-btn').forEach(b => b.classList.remove('active'));
  const btn = document.querySelector('.dir-btn.' + dir);
  if (btn) btn.classList.add('active');
}

// ─── EMOTION ─────────────────────────────────────────
function setEmotion(emo) {
  selectedEmotion = emo;
  document.querySelectorAll('.emo-btn').forEach(b => b.classList.remove('active'));
  if (event && event.target) event.target.classList.add('active');
}

// ─── R:R CALCULATOR ──────────────────────────────────
function calcRR() {
  const pairEl = document.getElementById('tradePair');
  if (!pairEl) return;
  
  const pair    = pairEl.value;
  const entry   = parseFloat(document.getElementById('entryPrice').value);
  const sl      = parseFloat(document.getElementById('stopLoss').value);
  const tp      = parseFloat(document.getElementById('takeProfit').value);
  const display = document.getElementById('rrDisplay');
  const lotInput = document.getElementById('lotSize');

  if (entry && sl) {
    const riskAmount = 2.00; // 1% of $200
    const distance   = Math.abs(entry - sl);
    
    let recommendedLot = 0;

    if (pair.includes('XAU')) {
      recommendedLot = (riskAmount / (distance * 100)).toFixed(2);
    } else if (pair.includes('JPY')) {
      recommendedLot = (riskAmount / (distance * 100)).toFixed(2);
    } else if (pair.includes('BTC')) {
      recommendedLot = (riskAmount / distance).toFixed(3);
    } else {
      recommendedLot = (riskAmount / (distance * 100000 / 10)).toFixed(2);
    }
    
    if (distance > 0) {
      if (lotInput && !lotInput.value) lotInput.placeholder = recommendedLot;
      
      if (tp) {
        const reward = Math.abs(tp - entry);
        const rr     = (reward / distance).toFixed(2);
        const color  = rr >= 2 ? '#22c55e' : rr >= 1 ? '#f0b429' : '#ef4444';
        display.innerHTML = `R:R = <span class="rr-val" style="color:${color}">1 : ${rr}</span> | Lot for ${pair}: <strong style="color:var(--gold)">${recommendedLot}</strong>`;
      } else {
        display.innerHTML = `Recommended Lot for ${pair} ($2 risk): <strong style="color:var(--gold)">${recommendedLot}</strong>`;
      }
    }
  } else {
    display.innerHTML = 'Enter Entry and SL for calculation';
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

  if (!date || !entry || !sl || !selectedDirection) {
    showToast('⚠️ Fill in basic fields!');
    return;
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
    lot: parseFloat(document.getElementById('lotSize').value) || null
  };

  try {
    const res = await fetch(API, {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify(trade)
    });
    if (res.ok) {
      showToast('✅ Trade saved!');
      resetForm();
      loadTrades();
    }
  } catch (e) {
    showToast('⚠️ Error saving trade.');
  }
}

// ─── DELETE TRADE ────────────────────────────────────
async function deleteTrade(id) {
  if (!confirm('Delete this trade?')) return;
  try {
    await fetch(`${API}/${id}`, { method: 'DELETE' });
    loadTrades();
  } catch (e) {
    showToast('⚠️ Error deleting.');
  }
}

// ─── CLEAR ALL ───────────────────────────────────────
async function clearAll() {
  if (confirm('Delete ALL trades?')) {
    try {
      await fetch(API, { method: 'DELETE' });
      loadTrades();
    } catch (e) {
      showToast('⚠️ Error deleting.');
    }
  }
}

// ─── RENDER TABLE ────────────────────────────────────
function renderTrades(trades) {
  const tradesSection = document.querySelector('.trades-section');
  const empty = document.getElementById('emptyState');
  if (!tradesSection) return;

  if (!trades || trades.length === 0) {
    if (empty) empty.style.display = 'block';
    document.querySelectorAll('.date-group-header, .trades-table').forEach(el => el.remove());
    return;
  }

  if (empty) empty.style.display = 'none';

  // Group by date
  const groups = {};
  trades.forEach(t => {
    if (!groups[t.date]) groups[t.date] = [];
    groups[t.date].push(t);
  });

  const sortedDates = Object.keys(groups).sort((a, b) => b.localeCompare(a));
  
  // Clear only groups, keep header
  const header = tradesSection.querySelector('.trades-header');
  tradesSection.innerHTML = '';
  tradesSection.appendChild(header);

  sortedDates.forEach(dateStr => {
    const dayTrades = groups[dateStr];
    // Create Date Header
    const dateObj = new Date(dateStr);
    const formattedDate = dateObj.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
    const dayName = dateObj.toLocaleDateString('en-US', { weekday: 'long' });

    const headerDiv = document.createElement('div');
    headerDiv.className = 'date-group-header';
    headerDiv.innerHTML = `
      <div class="date-info">
        <span class="date-main">${formattedDate}</span>
        <span class="date-sub">${dayName}</span>
      </div>
      <div class="date-stats">
        <span class="trade-count">${dayTrades.length} trades</span>
      </div>
    `;
    tradesSection.appendChild(headerDiv);

    const tableWrapper = document.createElement('div');
    tableWrapper.className = 'trades-table';
    tableWrapper.innerHTML = `
      <table>
        <thead>
          <tr>
            <th style="width:100px">Time</th>
            <th style="width:140px">Pair</th>
            <th style="width:100px">Dir.</th>
            <th>Entry</th>
            <th>SL / TP</th>
            <th>R:R</th>
            <th>Result</th>
            <th>P&L</th>
            <th style="width:60px"></th>
          </tr>
        </thead>
        <tbody>
          ${dayTrades.map(t => `
            <tr>
              <td class="time-val">${t.time}</td>
              <td class="pair-val">${t.pair}</td>
              <td><span class="badge ${t.direction.toLowerCase()}">${t.direction}</span></td>
              <td style="font-weight:700"># ${t.entry}</td>
              <td style="font-family:'Roboto Mono'; font-size:12px;">
                <span style="color:var(--red)">${t.sl || '-'}</span> <br>
                <span style="color:var(--green)">${t.tp || '-'}</span>
              </td>
              <td style="color:var(--accent); font-weight:700">${t.rr || '-'}</td>
              <td><span class="badge ${t.result.toLowerCase()}">${t.result}</span></td>
              <td class="${(t.pnl || 0) >= 0 ? 'pnl-positive' : 'pnl-negative'}" style="font-size:16px; font-weight:900">
                ${t.pnl != null ? ((t.pnl >= 0 ? '+' : '') + '$' + parseFloat(t.pnl).toFixed(2)) : '-'}
              </td>
              <td><button class="delete-btn" onclick="deleteTrade(${t.id})">✕</button></td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    `;
    tradesSection.appendChild(tableWrapper);
  });
}

// ─── UPDATE STATS ────────────────────────────────────
function updateStats(trades) {
  if (!trades || !document.getElementById('statTotal')) return;

  const total    = trades.length;
  const wins     = trades.filter(t => t.result === 'WIN').length;
  const losses   = trades.filter(t => t.result === 'LOSS').length;
  const winRate  = total > 0 ? Math.round((wins / total) * 100) : 0;
  
  const grossProfit = trades.reduce((sum, t) => sum + (parseFloat(t.pnl) > 0 ? parseFloat(t.pnl) : 0), 0);
  const grossLoss   = Math.abs(trades.reduce((sum, t) => sum + (parseFloat(t.pnl) < 0 ? parseFloat(t.pnl) : 0), 0));
  const netPnL      = grossProfit - grossLoss;
  const profitFactor = grossLoss > 0 ? (grossProfit / grossLoss).toFixed(2) : grossProfit > 0 ? "∞" : "0.00";

  document.getElementById('statTotal').textContent   = total;
  document.getElementById('statWinRate').textContent = winRate + '%';
  document.getElementById('statPF').textContent      = profitFactor;

  const pnlEl = document.getElementById('statPnL');
  if (pnlEl) {
    pnlEl.textContent = (netPnL >= 0 ? '+' : '') + '$' + netPnL.toFixed(2);
    pnlEl.className   = 'stat-value ' + (netPnL > 0 ? 'positive' : netPnL < 0 ? 'negative' : 'neutral');
  }
  
  // Update Advanced Charts
  updatePairChart(trades);
  updateEmotionChart(trades);
  updateSessionChart(trades);
  updateDirectionChart(trades);
}

// ─── CHART HELPERS ───────────────────────────────────
let charts = {};

function createChart(canvasId, type, data, options) {
  const canvas = document.getElementById(canvasId);
  if (!canvas) return;
  
  if (charts[canvasId]) charts[canvasId].destroy();
  
  charts[canvasId] = new Chart(canvas.getContext('2d'), {
    type: type,
    data: data,
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: { legend: { labels: { color: '#7070a0', font: { family: 'Plus Jakarta Sans' } } } },
      scales: options.scales || {},
      ...options
    }
  });
}

// ─── UPDATE MAIN EQUITY CURVE ────────────────────────
function updateChart(trades) {
  if (!trades || trades.length === 0) {
    if (charts['profitChart']) charts['profitChart'].destroy();
    return;
  }

  const sorted = [...trades].sort((a, b) => (a.date + a.time).localeCompare(b.date + b.time));
  let cumulative = 0;
  const data = sorted.map(t => { cumulative += (parseFloat(t.pnl) || 0); return cumulative; });
  const labels = sorted.map((t, idx) => `T${idx + 1}`);

  createChart('profitChart', 'line', {
    labels: labels,
    datasets: [{
      label: 'Equity ($)',
      data: data,
      borderColor: '#f0b429',
      backgroundColor: 'rgba(240, 180, 41, 0.1)',
      borderWidth: 3,
      tension: 0.4,
      pointRadius: 0,
      pointHoverRadius: 6
    }]
  }, {
    scales: {
      y: { grid: { color: 'rgba(255,255,255,0.05)' }, ticks: { color: '#7070a0' } },
      x: { display: false }
    }
  });
}

// ─── 1. PAIR PERFORMANCE (Horizontal Bar) ────────────
function updatePairChart(trades) {
  const pairs = {};
  trades.forEach(t => {
    if (!pairs[t.pair]) pairs[t.pair] = 0;
    pairs[t.pair] += (parseFloat(t.pnl) || 0);
  });

  const labels = Object.keys(pairs);
  const data = Object.values(pairs);
  const colors = data.map(v => v >= 0 ? '#22c55e' : '#ef4444');

  createChart('pairChart', 'bar', {
    labels: labels,
    datasets: [{ label: 'Net P&L', data: data, backgroundColor: colors, borderRadius: 4 }]
  }, {
    indexAxis: 'y',
    scales: { x: { grid: { color: 'rgba(255,255,255,0.05)' }, ticks: { color: '#7070a0' } } }
  });
}

// ─── 2. EMOTION WHEEL (Doughnut) ─────────────────────
function updateEmotionChart(trades) {
  const emotions = {};
  trades.forEach(t => {
    const emo = t.emotion || 'N/A';
    if (!emotions[emo]) emotions[emo] = { win: 0, loss: 0 };
    if (t.result === 'WIN') emotions[emo].win++;
    else emotions[emo].loss++;
  });

  const labels = Object.keys(emotions);
  const winData = labels.map(e => emotions[e].win);
  const lossData = labels.map(e => emotions[e].loss);

  createChart('emotionChart', 'doughnut', {
    labels: labels,
    datasets: [
      { label: 'Wins', data: winData, backgroundColor: '#22c55e', borderWidth: 0 },
      { label: 'Losses', data: lossData, backgroundColor: '#ef4444', borderWidth: 0 }
    ]
  }, { cutout: '60%' });
}

// ─── 3. SESSION EFFICIENCY (Radar) ───────────────────
function updateSessionChart(trades) {
  const sessions = {};
  trades.forEach(t => {
    const sess = t.session || 'Other';
    if (!sessions[sess]) sessions[sess] = 0;
    sessions[sess] += (parseFloat(t.pnl) || 0);
  });

  createChart('sessionChart', 'bar', {
    labels: Object.keys(sessions),
    datasets: [{
      label: 'P&L per Session',
      data: Object.values(sessions),
      backgroundColor: '#7c6fff',
      borderRadius: 4
    }]
  }, { scales: { y: { grid: { color: 'rgba(255,255,255,0.05)' }, ticks: { color: '#7070a0' } } } });
}

// ─── 4. DIRECTION BIAS (Pie) ─────────────────────────
function updateDirectionChart(trades) {
  let buy = 0, sell = 0;
  trades.forEach(t => t.direction === 'BUY' ? buy++ : sell++);

  createChart('directionChart', 'pie', {
    labels: ['BUY', 'SELL'],
    datasets: [{
      data: [buy, sell],
      backgroundColor: ['#22c55e', '#ef4444'],
      borderWidth: 0
    }]
  }, {});
}

// ─── RESET FORM ──────────────────────────────────────
function resetForm() {
  ['entryPrice','stopLoss','takeProfit','exitPrice','pnlAmount','lotSize']
    .forEach(id => {
        const el = document.getElementById(id);
        if (el) el.value = '';
    });

  const rrDisp = document.getElementById('rrDisplay');
  if (rrDisp) rrDisp.innerHTML = 'Enter Entry and SL for calculation';
  
  selectedDirection = '';
  selectedEmotion   = '';
  document.querySelectorAll('.dir-btn').forEach(b => b.classList.remove('active'));
  document.querySelectorAll('.emo-btn').forEach(b => b.classList.remove('active'));
}

// ─── TOAST ───────────────────────────────────────────
function showToast(msg) {
  const toast = document.getElementById('toast');
  if (!toast) return;
  toast.textContent = msg;
  toast.classList.add('show');
  setTimeout(() => toast.classList.remove('show'), 3000);
}

// ─── AI ANALYSIS ──────────────────────────────────────
async function analyzeTrades() {
  const btn = document.getElementById('aiAnalyzeBtn');
  const responseDiv = document.getElementById('aiResponse');
  if (!btn || !responseDiv) return;

  btn.disabled = true;
  responseDiv.style.display = 'block';
  responseDiv.innerHTML = '<p>Analyzing...</p>';

  try {
    const res = await fetch('/api/ai/analyze', { method: 'POST' });
    const data = await res.json();
    responseDiv.innerHTML = `<p>${data.analysis.replace(/\n/g, '<br>')}</p>`;
  } catch (e) {
    showToast('⚠️ AI Error.');
  } finally {
    btn.disabled = false;
  }
}

// ─── AI VISION ───────────────────────────────────────
function previewImage(event) {
  const file = event.target.files[0];
  if (file) {
    const reader = new FileReader();
    reader.onload = (e) => {
      document.getElementById('uploadPreview').innerHTML = `<img src="${e.target.result}">`;
    };
    reader.readAsDataURL(file);
  }
}

async function analyzeChart() {
  const fileInput = document.getElementById('chartUpload');
  const responseDiv = document.getElementById('aiVisionResponse');
  const section = document.querySelector('.ai-vision-section');
  
  if (!fileInput || !fileInput.files[0]) {
    showToast('⚠️ Upload a screenshot!');
    return;
  }

  // 1. SHOW LOADING STATE
  responseDiv.style.display = 'block';
  responseDiv.innerHTML = `
    <div class="ai-loading-overlay">
      <div class="spinner-ring"></div>
      <div class="loading-msg" id="aiLoadMsg">Analyzing chart...</div>
    </div>
  `;
  if (section) section.classList.add('analyzing');

  const formData = new FormData();
  formData.append('file', fileInput.files[0]);

  try {
    const res = await fetch('/api/ai/chart-analysis', { method: 'POST', body: formData });
    const data = await res.json();

    if (data.analysis) {
      const raw = data.analysis;
      let decision = "WAIT";
      let dClass = "decision-wait";
      if (raw.includes("BUY")) { decision = "BUY 🟢"; dClass = "decision-buy"; }
      else if (raw.includes("SELL")) { decision = "SELL 🔴"; dClass = "decision-sell"; }

      let confidence = raw.match(/(\d+)%/);
      confidence = confidence ? confidence[0] : "75%";

      responseDiv.innerHTML = `
        <div class="result-card">
          <div class="result-header">
            <div class="decision-badge ${dClass}">${decision}</div>
            <div class="confidence-meter">CONFIDENCE: ${confidence}</div>
          </div>
          <div class="analysis-text">
            ${raw.replace(/\n/g, '<br>')}
          </div>
        </div>
      `;
    }
  } catch (e) {
    showToast('⚠️ Vision Error.');
  } finally {
    if (section) section.classList.remove('analyzing');
  }
}

// ─── WEEKLY NEWS ─────────────────────────────────────
let weeklyCalendarData = null;

function toggleNewsMode(mode) {
  document.querySelectorAll('.mode-btn').forEach(b => b.classList.remove('active'));
  event.target.classList.add('active');

  if (mode === 'live') {
    document.getElementById('liveNewsView').style.display = 'block';
    document.getElementById('weeklyNewsView').style.display = 'none';
  } else {
    document.getElementById('liveNewsView').style.display = 'none';
    document.getElementById('weeklyNewsView').style.display = 'block';
    loadWeeklyNews();
  }
}

async function loadWeeklyNews() {
  const list = document.getElementById('weeklyNewsList');
  list.innerHTML = '<div class="empty-state">Loading calendar... 📅</div>';
  
  try {
    const res = await fetch('/api/news/weekly');
    weeklyCalendarData = await res.json();
    const days = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
    let today = days[new Date().getDay()];
    if (today === "Saturday" || today === "Sunday") today = "Monday";
    filterWeeklyDay(today);
  } catch (e) {
    list.innerHTML = '<div class="empty-state">Error loading.</div>';
  }
}

function filterWeeklyDay(day) {
  document.querySelectorAll('.day-btn').forEach(b => {
    b.classList.remove('active');
    if (b.textContent.includes(day.substring(0,3).toUpperCase())) b.classList.add('active');
  });

  const list = document.getElementById('weeklyNewsList');
  const dayData = weeklyCalendarData ? weeklyCalendarData[day] : [];

  if (!dayData || dayData.length === 0) {
    list.innerHTML = `<div class="empty-state">No news for ${day}.</div>`;
    return;
  }

  list.innerHTML = dayData.map(item => `
    <div class="weekly-item">
      <div style="display:flex; align-items:center;">
        <span class="impact-dot impact-${item.impact}"></span>
        <div>
          <div style="font-size:13px; font-weight:700;">${item.title}</div>
          <div style="font-size:10px; color:var(--text-dim);">${item.country} • ${item.impact} Impact</div>
        </div>
      </div>
      <div style="font-family:'Roboto Mono'; font-size:12px; color:var(--gold);">${item.time}</div>
    </div>
  `).join('');
}

// ─── INIT ────────────────────────────────────────────
(function init() {
  const savedTheme = localStorage.getItem('theme');
  if (savedTheme === 'light') document.body.classList.add('light-mode');
  loadTrades();
})();
