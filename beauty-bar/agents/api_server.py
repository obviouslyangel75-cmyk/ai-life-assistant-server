"""
Beauty Bar Flask API - Integrates AI Agents with Web Interface
"""

from flask import Flask, request, jsonify
from flask_cors import CORS
from datetime import datetime
import json
from beauty_bar_agents import BeautyBarMultiAgentSystem

app = Flask(__name__)
CORS(app)

# Initialize the multi-agent system
agent_system = BeautyBarMultiAgentSystem()


@app.route("/api/health", methods=["GET"])
def health_check():
    """Check system health and agent status"""
    status = agent_system.get_system_status()
    return jsonify(status), 200


@app.route("/api/booking/create", methods=["POST"])
def create_booking():
    """Create a new booking through Luna"""
    try:
        data = request.json
        required_fields = ["name", "email", "phone", "service", "date", "time"]
        if not all(field in data for field in required_fields):
            return jsonify({"error": "Missing required fields"}), 400

        result = agent_system.process_booking(data)
        return jsonify(result), 201

    except Exception as e:
        return jsonify({"error": str(e)}), 500


@app.route("/api/customer/inquiry", methods=["POST"])
def customer_inquiry():
    """Send a customer inquiry to Amara"""
    try:
        data = request.json
        message = data.get("message")

        if not message:
            return jsonify({"error": "message is required"}), 400

        result = agent_system.answer_customer_inquiry(message)
        return jsonify(result), 200

    except Exception as e:
        return jsonify({"error": str(e)}), 500


@app.route("/api/marketing/campaign", methods=["POST"])
def create_marketing_campaign():
    """Create a marketing campaign through Zainab"""
    try:
        data = request.json
        campaign_type = data.get("campaign_type")

        if not campaign_type:
            return jsonify({"error": "campaign_type is required"}), 400

        target_audience = data.get("target_audience", "")
        budget = data.get("budget", "")

        result = agent_system.create_marketing_strategy(campaign_type, target_audience, budget)
        return jsonify(result), 201

    except Exception as e:
        return jsonify({"error": str(e)}), 500


@app.route("/api/growth/quarterly-plan", methods=["POST"])
def create_quarterly_plan():
    """Create quarterly growth plan through Kwame"""
    try:
        data = request.json
        current_metrics = data.get("current_metrics")
        goals = data.get("goals")

        if not current_metrics or not goals:
            return jsonify({"error": "current_metrics and goals are required"}), 400

        result = agent_system.generate_growth_plan(current_metrics, goals)
        return jsonify(result), 201

    except Exception as e:
        return jsonify({"error": str(e)}), 500


@app.route("/api/agents/info", methods=["GET"])
def get_agents_info():
    """Get detailed information about all agents"""
    agents_info = {
        "Luna": {
            "name": "Luna - Booking Specialist",
            "role": "Booking Management & Reservations",
            "capabilities": [
                "Process appointment bookings",
                "Handle cancellations and rescheduling",
                "Provide booking confirmations",
            ],
            "availability": "24/7",
        },
        "Amara": {
            "name": "Amara - Customer Care Specialist",
            "role": "Customer Service & Support",
            "capabilities": [
                "Answer service inquiries",
                "Provide styling recommendations",
                "Handle complaints empathetically",
            ],
            "availability": "24/7",
        },
        "Zainab": {
            "name": "Zainab - Marketing & Brand Growth Specialist",
            "role": "Marketing & Brand Management",
            "capabilities": [
                "Create marketing campaigns",
                "Generate social media content",
                "Develop engagement strategies",
            ],
            "availability": "Business hours",
        },
        "Kwame": {
            "name": "Kwame - Strategic Growth & Business Development",
            "role": "Business Strategy & Growth Planning",
            "capabilities": [
                "Create quarterly growth plans",
                "Analyze business metrics",
                "Develop staff training programs",
            ],
            "availability": "Business hours",
        },
    }
    return jsonify(agents_info), 200


if __name__ == "__main__":
    print("\n" + "=" * 80)
    print("BEAUTY BAR - MULTI-AGENT API SERVER")
    print("=" * 80)
    print("\n🤖 Agents Active:")
    print("  • Luna - Booking Specialist")
    print("  • Amara - Customer Care Specialist")
    print("  • Zainab - Marketing & Brand Growth Specialist")
    print("  • Kwame - Strategic Growth & Business Development")
    print("\n📍 Starting server on http://localhost:5000")
    print("=" * 80 + "\n")
    app.run(debug=True, port=5000)
