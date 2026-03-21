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
      (tabId === 'vault' && text.includes('vault')) ||
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

  // 3. Refresh data
  loadTrades();
}

// ─── SOCKET.IO (Quantum News) ────────────────────────
const socket = io();
let weeklyCalendarData = null;

socket.on('new_forex_news', (data) => {
  const newsList = document.getElementById('newsList');
  const panicBox = document.getElementById('panicBox');
  if (newsList && newsList.querySelector('.empty-state')) newsList.innerHTML = '';

  if (newsList) {
    const newsEl = document.createElement('div');
    const usdClass = data.usd_sentiment ? data.usd_sentiment.toLowerCase() : 'neutral';
    const isPanic = data.panic_mode;
    newsEl.className = `news-item ${usdClass} ${isPanic ? 'panic' : ''}`;
    newsEl.innerHTML = `
      <div class="news-header">
        <span>${data.published}</span>
        <div>USD: <span class="sentiment-badge ${usdClass}">${data.usd_sentiment}</span></div>
      </div>
      <div class="news-title">${data.title}</div>
      <div class="news-explanation">${data.explanation}</div>
    `;
    newsList.prepend(newsEl);
  }
  if (isPanic && panicBox) {
    panicBox.innerHTML = "⚠️ CRITICAL NEWS: PANIC!";
    panicBox.classList.add('panic-active');
    showToast('🔥 CRITICAL NEWS DETECTED!');
  }
});

// ─── API CALLS ───────────────────────────────────────
const API = '/api/trades';
let selectedDirection = '';
let selectedEmotion   = '';
let profitChart       = null;
let charts = {};

// Initial Load
document.addEventListener('DOMContentLoaded', () => {
  const now = new Date();
  if (document.getElementById('currentDate')) {
    document.getElementById('currentDate').textContent = now.toLocaleDateString('en-GB', {
      weekday: 'long', day: '2-digit', month: 'long', year: 'numeric'
    });
  }
  if (document.getElementById('tradeDate')) document.getElementById('tradeDate').value = now.toISOString().split('T')[0];
  if (document.getElementById('tradeTime')) document.getElementById('tradeTime').value = now.toTimeString().slice(0, 5);
  
  const savedTheme = localStorage.getItem('theme');
  if (savedTheme === 'light') document.body.classList.add('light-mode');
  loadTrades();
});

async function loadTrades() {
  try {
    const res    = await fetch(API);
    const trades = await res.json();
    renderTrades(trades);
    renderVault(trades);
    updateStats(trades);
    updateChart(trades);
  } catch (e) {
    console.error('Error loading trades:', e);
  }
}

// ─── TRADE ACTIONS ───────────────────────────────────
function setDirection(dir) {
  selectedDirection = dir;
  document.querySelectorAll('.dir-btn').forEach(b => b.classList.remove('active'));
  const btn = document.querySelector('.dir-btn.' + dir);
  if (btn) btn.classList.add('active');
}

function setEmotion(emo) {
  selectedEmotion = emo;
  document.querySelectorAll('.emo-btn').forEach(b => b.classList.remove('active'));
  if (event && event.target) event.target.classList.add('active');
}

async function addTrade() {
  const fields = ['tradeDate', 'tradeTime', 'tradePair', 'tradeSession', 'entryPrice', 'stopLoss', 'takeProfit', 'exitPrice', 'pnlAmount', 'tradeResult', 'tradeStrategy', 'lotSize'];
  const data = {};
  fields.forEach(f => data[f] = document.getElementById(f).value);
  const imageInput = document.getElementById('tradeImage');

  if (!data.tradeDate || !data.entryPrice || !data.stopLoss || !selectedDirection) {
    showToast('⚠️ Fill in basic fields!');
    return;
  }

  let base64Image = null;
  if (imageInput && imageInput.files[0]) {
    base64Image = await new Promise(r => {
      const reader = new FileReader();
      reader.onload = (e) => r(e.target.result);
      reader.readAsDataURL(imageInput.files[0]);
    });
  }

  let rrVal = '-';
  if (data.entryPrice && data.stopLoss && data.takeProfit) {
    const risk = Math.abs(data.entryPrice - data.stopLoss);
    const reward = Math.abs(data.takeProfit - data.entryPrice);
    if (risk > 0) rrVal = '1:' + (reward / risk).toFixed(1);
  }

  const trade = {
    date: data.tradeDate, time: data.tradeTime, pair: data.tradePair, session: data.tradeSession,
    direction: selectedDirection.toUpperCase(), entry: parseFloat(data.entryPrice),
    sl: parseFloat(data.stopLoss), tp: parseFloat(data.takeProfit) || null,
    exit: parseFloat(data.exitPrice) || null, pnl: parseFloat(data.pnlAmount) || null,
    result: data.tradeResult, strategy: data.tradeStrategy, emotion: selectedEmotion || 'N/A',
    lot: parseFloat(data.lotSize) || null, rr: rrVal, image: base64Image
  };

  try {
    const res = await fetch(API, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(trade)
    });
    if (res.ok) {
      showToast('✅ Trade logged!');
      resetForm();
      loadTrades();
    }
  } catch (e) { showToast('⚠️ Error saving.'); }
}

// ─── RENDERING ───────────────────────────────────────
function renderTrades(trades) {
  const tradesSection = document.querySelector('.trades-section');
  if (!tradesSection) return;
  const empty = document.getElementById('emptyState');
  
  if (!trades || trades.length === 0) {
    if (empty) empty.style.display = 'block';
    document.querySelectorAll('.date-group-header, .trades-table').forEach(el => el.remove());
    return;
  }
  if (empty) empty.style.display = 'none';

  const groups = {};
  trades.forEach(t => { if (!groups[t.date]) groups[t.date] = []; groups[t.date].push(t); });
  const sortedDates = Object.keys(groups).sort((a, b) => b.localeCompare(a));
  
  const header = tradesSection.querySelector('.trades-header');
  tradesSection.innerHTML = '';
  tradesSection.appendChild(header);

  sortedDates.forEach(dateStr => {
    const dayTrades = groups[dateStr];
    const dateObj = new Date(dateStr);
    const formattedDate = dateObj.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
    const dayName = dateObj.toLocaleDateString('en-US', { weekday: 'long' });
    
    const headerDiv = document.createElement('div');
    headerDiv.className = 'date-group-header';
    headerDiv.innerHTML = `<div class="date-info"><span class="date-main">${formattedDate}</span><span class="date-sub">${dayName}</span></div><div class="date-stats"><span class="trade-count">${dayTrades.length} trades</span></div>`;
    tradesSection.appendChild(headerDiv);

    const tableWrapper = document.createElement('div');
    tableWrapper.className = 'trades-table';
    tableWrapper.innerHTML = `<table><thead><tr><th style="width:100px">Time</th><th style="width:140px">Pair</th><th style="width:100px">Dir.</th><th>Entry</th><th>SL / TP</th><th>R:R</th><th>Result</th><th>P&L</th><th style="width:60px"></th></tr></thead><tbody>
      ${dayTrades.map(t => `<tr><td class="time-val">${t.time}</td><td class="pair-val">${t.pair}</td><td><span class="badge ${t.direction.toLowerCase()}">${t.direction}</span></td><td style="font-weight:700"># ${t.entry}</td><td style="font-family:'Roboto Mono'; font-size:12px;"><span style="color:var(--red)">${t.sl || '-'}</span> <br><span style="color:var(--green)">${t.tp || '-'}</span></td><td style="color:var(--accent); font-weight:700">${t.rr || '-'}</td><td><span class="badge ${t.result.toLowerCase()}">${t.result}</span></td><td class="${(t.pnl || 0) >= 0 ? 'pnl-positive' : 'pnl-negative'}" style="font-size:16px; font-weight:900">${t.pnl != null ? ((t.pnl >= 0 ? '+' : '') + '$' + parseFloat(t.pnl).toFixed(2)) : '-'}</td><td><button class="delete-btn" onclick="deleteTrade(${t.id})">✕</button></td></tr>`).join('')}
    </tbody></table>`;
    tradesSection.appendChild(tableWrapper);
  });
}

function renderVault(trades) {
  const grid = document.getElementById('vaultGrid');
  if (!grid) return;
  const wins = trades.filter(t => t.result === 'WIN' && t.image);
  if (wins.length === 0) {
    grid.innerHTML = '<div class="empty-state">No winning setups with images yet. Study and log more! 🏦</div>';
    return;
  }
  grid.innerHTML = wins.map(t => `
    <div class="vault-card" onclick="window.open('${t.image}')">
      <div class="vault-image-container"><img src="${t.image}"></div>
      <div class="vault-info">
        <div class="vault-meta"><span class="vault-pair">${t.pair}</span><span class="vault-pnl">+$${parseFloat(t.pnl).toFixed(2)}</span></div>
        <div class="vault-meta" style="margin-top:5px;"><span style="color:var(--text-dim)">${t.date}</span><span class="vault-strategy">${t.strategy}</span></div>
      </div>
    </div>
  `).join('');
}

// ─── ANALYTICS ───────────────────────────────────────
function updateStats(trades) {
  if (!trades || !document.getElementById('statTotal')) return;
  const wins = trades.filter(t => t.result === 'WIN').length;
  const total = trades.length;
  const grossProfit = trades.reduce((s, t) => s + (t.pnl > 0 ? t.pnl : 0), 0);
  const grossLoss = Math.abs(trades.reduce((s, t) => s + (t.pnl < 0 ? t.pnl : 0), 0));
  
  document.getElementById('statTotal').textContent = total;
  document.getElementById('statWinRate').textContent = (total > 0 ? Math.round((wins/total)*100) : 0) + '%';
  document.getElementById('statPF').textContent = grossLoss > 0 ? (grossProfit/grossLoss).toFixed(2) : grossProfit > 0 ? "∞" : "0.00";
  const pnlEl = document.getElementById('statPnL');
  const net = grossProfit - grossLoss;
  pnlEl.textContent = (net >= 0 ? '+' : '') + '$' + net.toFixed(2);
  pnlEl.className = 'stat-value ' + (net > 0 ? 'positive' : net < 0 ? 'negative' : 'neutral');

  updatePairChart(trades);
  updateEmotionChart(trades);
}

function updateChart(trades) {
  const canvas = document.getElementById('profitChart');
  if (!canvas || trades.length === 0) return;
  const sorted = [...trades].sort((a, b) => (a.date + a.time).localeCompare(b.date + b.time));
  let cum = 0;
  const data = sorted.map(t => { cum += (t.pnl || 0); return cum; });
  const labels = sorted.map((_, i) => `T${i+1}`);
  
  if (charts['profitChart']) charts['profitChart'].destroy();
  charts['profitChart'] = new Chart(canvas.getContext('2d'), {
    type: 'line', data: { labels, datasets: [{ label: 'Equity', data, borderColor: '#f0b429', backgroundColor: 'rgba(240,180,41,0.1)', borderWidth: 3, tension: 0.4, pointRadius: 0 }] },
    options: { responsive: true, maintainAspectRatio: false, scales: { y: { ticks: { color: '#7070a0' } }, x: { display: false } } }
  });
}

function updatePairChart(trades) {
  const pairs = {};
  trades.forEach(t => { pairs[t.pair] = (pairs[t.pair] || 0) + (t.pnl || 0); });
  const canvas = document.getElementById('pairChart');
  if (!canvas) return;
  if (charts['pairChart']) charts['pairChart'].destroy();
  charts['pairChart'] = new Chart(canvas.getContext('2d'), {
    type: 'bar', data: { labels: Object.keys(pairs), datasets: [{ label: 'Net P&L', data: Object.values(pairs), backgroundColor: Object.values(pairs).map(v => v >= 0 ? '#22c55e' : '#ef4444') }] },
    options: { indexAxis: 'y', responsive: true, maintainAspectRatio: false }
  });
}

function updateEmotionChart(trades) {
  const emos = {};
  trades.forEach(t => { emos[t.emotion] = (emos[t.emotion] || 0) + 1; });
  const canvas = document.getElementById('emotionChart');
  if (!canvas) return;
  if (charts['emotionChart']) charts['emotionChart'].destroy();
  charts['emotionChart'] = new Chart(canvas.getContext('2d'), {
    type: 'doughnut', data: { labels: Object.keys(emos), datasets: [{ data: Object.values(emos), backgroundColor: ['#7c6fff', '#f0b429', '#22c55e', '#ef4444', '#7070a0'] }] },
    options: { responsive: true, maintainAspectRatio: false, cutout: '70%' }
  });
}

// ─── HELPERS ─────────────────────────────────────────
function resetForm() {
  ['entryPrice','stopLoss','takeProfit','exitPrice','pnlAmount','lotSize','tradeImage'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.value = '';
  });
  selectedDirection = ''; selectedEmotion = '';
  document.querySelectorAll('.dir-btn, .emo-btn').forEach(b => b.classList.remove('active'));
}

function showToast(msg) {
  const toast = document.getElementById('toast');
  if (!toast) return;
  toast.textContent = msg;
  toast.classList.add('show');
  setTimeout(() => toast.classList.remove('show'), 3000);
}

async function deleteTrade(id) {
  if (confirm('Delete trade?')) {
    await fetch(`${API}/${id}`, { method: 'DELETE' });
    loadTrades();
  }
}

async function analyzeChart() {
  const fileInput = document.getElementById('chartUpload');
  const responseDiv = document.getElementById('aiVisionResponse');
  if (!fileInput || !fileInput.files[0]) { showToast('⚠️ Upload a screenshot!'); return; }
  const formData = new FormData();
  formData.append('file', fileInput.files[0]);
  responseDiv.style.display = 'block';
  responseDiv.innerHTML = '<div class="ai-loading-overlay"><div class="spinner-ring"></div><div class="loading-msg">Analyzing...</div></div>';
  try {
    const res = await fetch('/api/ai/chart-analysis', { method: 'POST', body: formData });
    const data = await res.json();
    responseDiv.innerHTML = `<div class="result-card"><div class="analysis-text">${data.analysis.replace(/\n/g, '<br>')}</div></div>`;
  } catch (e) { showToast('⚠️ Vision Error.'); }
}

async function analyzeTrades() {
  const responseDiv = document.getElementById('aiResponse');
  responseDiv.style.display = 'block';
  responseDiv.innerHTML = '<p>Analyzing...</p>';
  try {
    const res = await fetch('/api/ai/analyze', { method: 'POST' });
    const data = await res.json();
    responseDiv.innerHTML = `<p>${data.analysis.replace(/\n/g, '<br>')}</p>`;
  } catch (e) { showToast('⚠️ AI Error.'); }
}

function previewImage(event) {
  const file = event.target.files[0];
  if (file) {
    const reader = new FileReader();
    reader.onload = (e) => {
      document.getElementById('uploadPreview').innerHTML = `<img src="${e.target.result}" style="max-height:200px; border-radius:8px;">`;
    };
    reader.readAsDataURL(file);
  }
}
