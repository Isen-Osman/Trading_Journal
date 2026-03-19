from src.domain.entities import Trade

def test_trade_creation():
    trade = Trade(
        date="2024-03-20",
        time="10:00",
        pair="XAUUSD",
        session="NY",
        direction="BUY",
        entry=2150.0,
        sl=2140.0
    )
    assert trade.pair == "XAUUSD"
    assert trade.entry == 2150.0

def test_trade_to_dict():
    trade = Trade(
        date="2024-03-20",
        time="10:00",
        pair="XAUUSD",
        session="NY",
        direction="BUY",
        entry=2150.0,
        sl=2140.0
    )
    d = trade.to_dict()
    assert d['pair'] == "XAUUSD"
    assert d['entry'] == 2150.0
