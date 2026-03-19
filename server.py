"""
ISEN Trading Journal — Local Server (Onion Architecture)
Run: python server.py
Open: http://localhost:8080
"""

from flask import Flask, send_from_directory
from src.infrastructure.database import init_db
from src.infrastructure.persistence.sqlite_repository import SQLiteTradeRepository
from src.application.services import TradeService
from src.api.routes import create_trade_blueprint
import os

DB_PATH = 'trades.db'
STATIC_FOLDER = 'static'

# 1. Initialize Infrastructure
init_db(DB_PATH)
repository = SQLiteTradeRepository(DB_PATH)

# 2. Initialize Application Layer
trade_service = TradeService(repository)

# 3. Setup Flask API Layer
app = Flask(__name__, static_folder=STATIC_FOLDER)

# Register API routes
api_blueprint = create_trade_blueprint(trade_service)
app.register_blueprint(api_blueprint, url_prefix='/api')

# Serve Frontend
@app.route('/')
def index():
    return send_from_directory(STATIC_FOLDER, 'index.html')

@app.route('/<path:filename>')
def static_files(filename):
    return send_from_directory(STATIC_FOLDER, filename)

if __name__ == '__main__':
    print("\n✅ Amir Trading Journal running with Onion Architecture!")
    print("📊 Open: http://localhost:8085\n")
    app.run(host='0.0.0.0', debug=False, port=8085)
