from flask import Blueprint, request, jsonify, send_from_directory
from src.application.services import TradeService

def create_trade_blueprint(trade_service: TradeService):
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

    return api
