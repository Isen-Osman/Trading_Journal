from abc import ABC, abstractmethod
from typing import List, Optional
from .entities import Trade

class TradeRepository(ABC):
    @abstractmethod
    def get_all(self) -> List[Trade]:
        pass

    @abstractmethod
    def add(self, trade: Trade) -> Trade:
        pass

    @abstractmethod
    def delete(self, trade_id: int) -> bool:
        pass

    @abstractmethod
    def clear_all(self) -> bool:
        pass
