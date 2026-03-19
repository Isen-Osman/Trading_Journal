from dataclasses import dataclass, asdict
from datetime import datetime
from typing import Optional

@dataclass
class Trade:
    date: str
    time: str
    pair: str
    session: str
    direction: str
    entry: float
    sl: float
    tp: Optional[float] = None
    exit: Optional[float] = None
    pnl: Optional[float] = None
    result: str = "N/A"
    strategy: str = "N/A"
    emotion: str = "N/A"
    reason: str = ""
    notes: str = ""
    lot: Optional[float] = None
    rr: str = "-"
    id: Optional[int] = None
    created: Optional[str] = None

    def to_dict(self):
        return asdict(self)
