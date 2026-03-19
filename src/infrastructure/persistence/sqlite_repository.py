import sqlite3
from typing import List
from src.domain.entities import Trade
from src.domain.repositories import TradeRepository

class SQLiteTradeRepository(TradeRepository):
    def __init__(self, db_path: str):
        self.db_path = db_path

    def _get_connection(self):
        conn = sqlite3.connect(self.db_path)
        conn.row_factory = sqlite3.Row
        return conn

    def get_all(self) -> List[Trade]:
        with self._get_connection() as conn:
            rows = conn.execute('SELECT * FROM trades ORDER BY created DESC').fetchall()
            return [Trade(**dict(row)) for row in rows]

    def add(self, trade: Trade) -> Trade:
        data = trade.to_dict()
        # Remove ID and created as they are handled by DB
        data.pop('id', None)
        data.pop('created', None)
        
        columns = ', '.join(data.keys())
        placeholders = ', '.join(['?' for _ in data])
        query = f'INSERT INTO trades ({columns}) VALUES ({placeholders})'
        
        with self._get_connection() as conn:
            cursor = conn.execute(query, tuple(data.values()))
            new_id = cursor.lastrowid
            row = conn.execute('SELECT * FROM trades WHERE id = ?', (new_id,)).fetchone()
            return Trade(**dict(row))

    def delete(self, trade_id: int) -> bool:
        with self._get_connection() as conn:
            cursor = conn.execute('DELETE FROM trades WHERE id = ?', (trade_id,))
            return cursor.rowcount > 0

    def clear_all(self) -> bool:
        with self._get_connection() as conn:
            conn.execute('DELETE FROM trades')
            return True
