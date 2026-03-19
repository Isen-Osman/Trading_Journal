import pytest
from unittest.mock import MagicMock
from src.application.services import TradeService
from src.domain.entities import Trade
from src.domain.repositories import TradeRepository

@pytest.fixture
def mock_repo():
    return MagicMock(spec=TradeRepository)

@pytest.fixture
def trade_service(mock_repo):
    return TradeService(mock_repo)

def test_get_all_trades(trade_service, mock_repo):
    mock_repo.get_all.return_value = [
        Trade(date="2024-03-20", time="10:00", pair="XAUUSD", session="NY", direction="BUY", entry=2150.0, sl=2140.0)
    ]
    trades = trade_service.get_all_trades()
    assert len(trades) == 1
    assert trades[0].pair == "XAUUSD"
    mock_repo.get_all.assert_called_once()

def test_add_trade(trade_service, mock_repo):
    trade_data = {
        "date": "2024-03-20",
        "time": "10:00",
        "pair": "XAUUSD",
        "session": "NY",
        "direction": "BUY",
        "entry": 2150.0,
        "sl": 2140.0
    }
    mock_repo.add.return_value = Trade(**trade_data, id=1)
    
    new_trade = trade_service.add_trade(trade_data)
    
    assert new_trade.id == 1
    assert new_trade.pair == "XAUUSD"
    mock_repo.add.assert_called_once()
