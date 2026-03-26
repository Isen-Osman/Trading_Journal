import sqlite3

def init_db(db_path: str):
    conn = sqlite3.connect(db_path)
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
            image     TEXT,
            created   TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    ''')
    conn.commit()
    conn.close()
