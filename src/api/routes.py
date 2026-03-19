from flask import Blueprint, request, jsonify, send_from_directory
from src.application.services import TradeService
from src.application.ai_service import AIService

def create_trade_blueprint(trade_service: TradeService, ai_service: AIService):
    api = Blueprint('api', __name__)

    @api.route('/trades', methods=['GET'])
    def get_trades():
        trades = trade_service.get_all_trades()
        return jsonify([t.to_dict() for t in trades])

    @api.route('/trades', methods=['POST'])
    def add_trade():
        data = request.json
        trade = trade_service.add_trade(data)
        return jsonify(trade.to_dict()), 201

    @api.route('/trades/<int:trade_id>', methods=['DELETE'])
    def delete_trade(trade_id):
        success = trade_service.delete_trade(trade_id)
        return jsonify({'deleted': trade_id if success else None}), 200

    @api.route('/trades', methods=['DELETE'])
    def clear_trades():
        trade_service.clear_all_trades()
        return jsonify({'cleared': True})

    # --- AI ENDPOINTS ---

    @api.route('/ai/analyze', methods=['POST'])
    def analyze_performance():
        trades = trade_service.get_all_trades()
        analysis = ai_service.analyze_performance(trades)
        return jsonify({'analysis': analysis})

    @api.route('/ai/check', methods=['POST'])
    def pre_trade_check():
        data = request.json
        analysis = ai_service.pre_trade_check(data)
        return jsonify({'analysis': analysis})

    @api.route('/ai/chart-analysis', methods=['POST'])
    def chart_analysis():
        if 'file' not in request.files:
            return jsonify({'error': 'No file part'}), 400
        
        file = request.files['file']
        if file.filename == '':
            return jsonify({'error': 'No selected file'}), 400
            
        if file:
            image_data = file.read()
            mime_type = file.mimetype
            analysis = ai_service.analyze_chart(image_data, mime_type)
            return jsonify({'analysis': analysis})

    return api
