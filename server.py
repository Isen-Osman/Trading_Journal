"""
ISEN Trading Journal — Local Server
Run: python server.py
Open: http://localhost:5000
"""

from flask import Flask, request, jsonify, send_from_directory
import sqlite3
import os

app = Flask(__name__, static_folder='.')
DB = 'trades.db'

# ─── DATABASE SETUP ──────────────────────────────────
def init_db():
    conn = sqlite3.connect(DB)
    conn.execute('''
        CREATE TABLE IF NOT EXISTS trades (
            id        INTEGER PRIMARY KEY AUTOINCREMENT,
            date      TEXT,
            time      TEXT,
            pair      TEXT,
            session   TEXT,
            direction TEXT,
            entry     REAL,
            sl        REAL,
            tp        REAL,
            exit      REAL,
            pnl       REAL,
            result    TEXT,
            strategy  TEXT,
            emotion   TEXT,
            reason    TEXT,
            notes     TEXT,
            lot       REAL,
            rr        TEXT,
            created   TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    ''')
    conn.commit()
    conn.close()

def get_db():
    conn = sqlite3.connect(DB)
    conn.row_factory = sqlite3.Row
    return conn

# ─── ROUTES ──────────────────────────────────────────
@app.route('/')
def index():
    return send_from_directory('.', 'index.html')

@app.route('/<path:filename>')
def static_files(filename):
    return send_from_directory('.', filename)

# GET all trades
@app.route('/api/trades', methods=['GET'])
def get_trades():
    conn = get_db()
    trades = conn.execute('SELECT * FROM trades ORDER BY created DESC').fetchall()
    conn.close()
    return jsonify([dict(t) for t in trades])

# POST new trade
@app.route('/api/trades', methods=['POST'])
def add_trade():
    data = request.json
    conn = get_db()
    conn.execute('''
        INSERT INTO trades (date, time, pair, session, direction, entry, sl, tp,
                            exit, pnl, result, strategy, emotion, reason, notes, lot, rr)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    ''', (
        data.get('date'), data.get('time'), data.get('pair'), data.get('session'),
        data.get('direction'), data.get('entry'), data.get('sl'), data.get('tp'),
        data.get('exit'), data.get('pnl'), data.get('result'), data.get('strategy'),
        data.get('emotion'), data.get('reason'), data.get('notes'),
        data.get('lot'), data.get('rr')
    ))
    conn.commit()
    new_id = conn.execute('SELECT last_insert_rowid()').fetchone()[0]
    trade  = conn.execute('SELECT * FROM trades WHERE id = ?', (new_id,)).fetchone()
    conn.close()
    return jsonify(dict(trade)), 201

# DELETE trade
@app.route('/api/trades/<int:trade_id>', methods=['DELETE'])
def delete_trade(trade_id):
    conn = get_db()
    conn.execute('DELETE FROM trades WHERE id = ?', (trade_id,))
    conn.commit()
    conn.close()
    return jsonify({'deleted': trade_id})

# DELETE all trades
@app.route('/api/trades', methods=['DELETE'])
def clear_trades():
    conn = get_db()
    conn.execute('DELETE FROM trades')
    conn.commit()
    conn.close()
    return jsonify({'cleared': True})

# ─── START ───────────────────────────────────────────
if __name__ == '__main__':
    init_db()
    print("\n✅ ISEN Trading Journal running!")
    print("📊 Open: http://localhost:5000\n")
    app.run(debug=False, port=5000)