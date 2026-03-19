import pytest
from flask import Flask
from src.infrastructure.database import init_db
from src.infrastructure.persistence.sqlite_repository import SQLiteTradeRepository
from src.application.services import TradeService
from src.api.routes import create_trade_blueprint
import os

@pytest.fixture
def client():
    # Use an in-memory or temporary test DB
    DB_PATH = 'test_trades.db'
    if os.path.exists(DB_PATH):
        os.remove(DB_PATH)
    
    init_db(DB_PATH)
    repository = SQLiteTradeRepository(DB_PATH)
    trade_service = TradeService(repository)
    
    app = Flask(__name__)
    api_blueprint = create_trade_blueprint(trade_service)
    app.register_blueprint(api_blueprint, url_prefix='/api')
    
    with app.test_client() as client:
        yield client
    
    # Clean up after tests
    if os.path.exists(DB_PATH):
        os.remove(DB_PATH)

def test_api_get_trades_empty(client):
    rv = client.get('/api/trades')
    assert rv.status_code == 200
    assert rv.json == []

def test_api_add_trade(client):
    trade_data = {
        "date": "2024-03-20",
        "time": "10:00",
        "pair": "XAUUSD",
        "session": "NY",
        "direction": "BUY",
        "entry": 2150.0,
        "sl": 2140.0
    }
    rv = client.post('/api/trades', json=trade_data)
    assert rv.status_code == 201
    assert rv.json['pair'] == "XAUUSD"
    assert 'id' in rv.json
