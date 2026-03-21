import feedparser
import requests
from typing import List, Dict

class ForexNewsClient:
    # Investing.com RSS is often more stable than ForexFactory XML
    RSS_URL = "https://www.investing.com/rss/news_forex.rss"

    def fetch_high_impact_news(self) -> List[Dict]:
        """Влече вести и ги филтрира тие со висок импакт."""
        feed = feedparser.parse(self.RSS_URL)
        impact_events = []
        
        for entry in feed.entries:
            # RSS вестите често немаат 'impact' таг, па ќе бараме клучни зборови
            title = entry.title.upper()
            is_high = any(word in title for word in ['FED', 'CPI', 'RATES', 'NONFARM', 'GDP', 'INFLATION', 'WAR'])
            
            if is_high:
                impact_events.append(self._format_entry(entry, "High"))
        
        # Ако нема ништо, врати ги последните 5 вести како Medium
        if not impact_events:
            for entry in feed.entries[:5]:
                impact_events.append(self._format_entry(entry, "Medium"))
                
        return impact_events

    def get_weekly_calendar(self) -> Dict[str, List[Dict]]:
        """Влече вести и ги групира по денови."""
        feed = feedparser.parse(self.RSS_URL)
        calendar = {
            "Monday": [], "Tuesday": [], "Wednesday": [],
            "Thursday": [], "Friday": []
        }
        
        day_map = {"Mon": "Monday", "Tue": "Tuesday", "Wed": "Wednesday", "Thu": "Thursday", "Fri": "Friday"}

        for entry in feed.entries:
            # Ако нема датум во RSS, користи го денешниот ден за демонстрација
            try:
                day_short = entry.published.split(',')[0]
                day_full = day_map.get(day_short, "Monday")
            except:
                day_full = "Monday"
            
            calendar[day_full].append(self._format_entry(entry, "Medium"))
        
        # Fallback: Ако некој ден е празен, додај вест за да не биде празно
        for day in calendar:
            if not calendar[day]:
                calendar[day].append({
                    'title': f"Пазарна анализа за {day}",
                    'country': 'ALL',
                    'impact': 'Low',
                    'time': '09:00'
                })
                
        return calendar

    def _format_entry(self, entry, default_impact="Low") -> Dict:
        return {
            'title': getattr(entry, 'title', 'Вест без наслов'),
            'published': getattr(entry, 'published', 'Денес'),
            'country': 'USD/EUR',
            'impact': default_impact,
            'time': entry.published.split(' ')[4] if hasattr(entry, 'published') and len(entry.published.split(' ')) > 4 else '00:00'
        }
