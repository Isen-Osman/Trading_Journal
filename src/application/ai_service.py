import os
import google.generativeai as genai
from typing import List, Dict
from src.domain.entities import Trade
from dotenv import load_dotenv

load_dotenv()

class AIService:
    def __init__(self, api_key: str = None):
        key = api_key or os.getenv("GEMINI_API_KEY")
        if not key:
            print("⚠️ Warning: GEMINI_API_KEY not found in environment variables.")
        genai.configure(api_key=key)
        # Using Gemini 2.5 models as identified in your environment
        self.model_flash = genai.GenerativeModel('models/gemini-2.5-flash')
        self.model_pro = genai.GenerativeModel('models/gemini-2.5-pro')

    def analyze_performance(self, trades: List[Trade]) -> str:
        """Анализа на перформансите со задолжителен превод на македонски."""
        if not trades:
            return "Не се пронајдени трејдови за анализа. Започнете со внесување за да добиете AI анализи!"

        trade_list = [t.to_dict() for t in trades]
        
        prompt = f"""
        Ти си експерт за тргување и твојата единствена задача е да дадеш анализа на МАКЕДОНСКИ ЈАЗИК.
        
        Еве ги податоците за тргување:
        {trade_list}

        ИНСТРУКЦИИ ЗА ОДГОВОР:
        1. СИТЕ термини како 'WIN', 'LOSS', 'BUY', 'SELL' преведи ги како 'ДОБИВКА', 'ЗАГУБА', 'КУПУВАЊЕ', 'ПРОДАЖБА'.
        2. Анализирај ги емоциите (FOMO, Revenge, Anxious...) и преведи ги соодветно на македонски.
        3. Идентификувај ги психолошките шеми и дај совет за подобрување.
        
        ПРАВИЛО: НЕ СМЕЕШ да користиш англиски зборови во одговорот.
        Биди директен, строг и професионален. Одговорот нека биде под 300 зборови.
        """
        
        try:
            # Поставуваме системска инструкција за јазикот
            response = self.model_flash.generate_content(prompt)
            return response.text
        except Exception as e:
            print(f"❌ AI Error: {e}")
            return f"Грешка: АИ сервисот не може да одговори на македонски во моментов."

    def pre_trade_check(self, current_setup: Dict) -> str:
        """Проверка пред трејд на македонски јазик."""
        rules = [
            "Максимален ризик 1% по трејд ($2 за $200 сметка)",
            "Никогаш не тргувај без SL (Stop Loss)",
            "Минимален R:R сооднос 1:2",
            "Без FOMO - не ја бркај цената",
            "Максимум 3 трејдови дневно",
            "Стоп после 2 загуби",
            "Преглед на журналот секој петок"
        ]

        prompt = f"""
        Ти си тренер за дисциплина во тргувањето. Трејдерот ја разгледува следнава позиција:
        {current_setup}

        Оцени ја позицијата според овие 7 основни правила:
        {rules}

        ВАЖНО: Твојот одговор МОРА да биде целосно на МАКЕДОНСКИ ЈАЗИК.
        Дали треба да го земат овој трејд? Биди строг но охрабрувачки. Посочи ако некое правило е прекршено.
        """
        
        try:
            response = self.model_flash.generate_content(prompt)
            return response.text
        except Exception as e:
            print(f"❌ AI Error: {e}")
            return "Грешка при проверка на трејдот."
