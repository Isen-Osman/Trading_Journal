from typing import List
from src.domain.entities import Trade
from src.domain.repositories import TradeRepository

class TradeService:
    def __init__(self, repository: TradeRepository):
        self.repository = repository

    def get_all_trades(self) -> List[Trade]:
        return self.repository.get_all()

    def add_trade(self, trade_data: dict) -> Trade:
        # Business logic could go here (e.g. validating data)
        trade = Trade(**trade_data)
        return self.repository.add(trade)

    def delete_trade(self, trade_id: int) -> bool:
        return self.repository.delete(trade_id)

    def clear_all_trades(self) -> bool:
        return self.repository.clear_all()
