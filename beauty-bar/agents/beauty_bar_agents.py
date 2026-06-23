"""
Beauty Bar Multi-Agent System
Advanced AI agents for booking management, customer service, marketing, and growth planning

Agents:
- Luna: Booking Specialist
- Amara: Customer Care Specialist
- Zainab: Marketing & Brand Growth Specialist
- Kwame: Strategic Growth & Business Development
"""

import json
import os
from datetime import datetime, timedelta
from typing import Optional, Dict, List
try:
    import anthropic
except ImportError:
    anthropic = None

# Initialize Anthropic client if available
client = None
if anthropic:
    client = anthropic.Anthropic(api_key=os.environ.get("ANTHROPIC_API_KEY"))

# Database simulation (in production, use real database)
BOOKINGS_DB = []
CUSTOMER_MESSAGES = []
MARKETING_CAMPAIGNS = []


class BookingAgent:
    """Agent responsible for handling appointment bookings and reservations"""

    def __init__(self):
        self.name = "Luna - Booking Specialist"
        self.model = "claude-3-5-sonnet-20241022"

    def process_booking_request(self, customer_data: Dict) -> Dict:
        """Process booking requests from customers"""

        system_prompt = """You are Luna, a professional booking specialist for Beauty Bar, an African beauty salon.
        
Your responsibilities:
- Process appointment bookings with professionalism
- Confirm customer details (name, email, phone, service, date, time, special requests)
- Check availability and suggest alternative times if needed
- Provide booking confirmations with reference numbers
- Handle cancellations and rescheduling requests
- Ensure all customer information is accurate

Services offered:
- Nails ($25+)
- Hair Braiding ($50+)
- Frontal Installation ($80+)
- Lashes ($35+)
- Makeup ($40+)
- Before Rain Oil Treatment ($15+)

Business Hours:
- Mon-Fri: 09:00 AM - 07:00 PM
- Sat: 10:00 AM - 08:00 PM
- Sun: 11:00 AM - 06:00 PM

Location: 74 Road Before Rain Oil
Always be warm, professional, and help customers find the perfect appointment time."""

        booking_info = f"""
Customer Details:
- Name: {customer_data.get('name', 'N/A')}
- Email: {customer_data.get('email', 'N/A')}
- Phone: {customer_data.get('phone', 'N/A')}
- Service: {customer_data.get('service', 'N/A')}
- Preferred Date: {customer_data.get('date', 'N/A')}
- Preferred Time: {customer_data.get('time', 'N/A')}
- Special Requests: {customer_data.get('notes', 'None')}
"""

        if client:
            message = client.messages.create(
                model=self.model,
                max_tokens=1024,
                system=system_prompt,
                messages=[
                    {
                        "role": "user",
                        "content": f"Please process this booking request: {booking_info}",
                    }
                ],
            )
            response_text = message.content[0].text
        else:
            response_text = f"Booking processed for {customer_data.get('name')} on {customer_data.get('date')} at {customer_data.get('time')}"

        # Generate booking confirmation
        booking_id = f"BB-{datetime.now().strftime('%Y%m%d%H%M%S')}"
        booking = {
            "booking_id": booking_id,
            "customer_data": customer_data,
            "confirmation_message": response_text,
            "created_at": datetime.now().isoformat(),
            "status": "confirmed",
        }

        BOOKINGS_DB.append(booking)

        return {
            "agent": self.name,
            "booking_id": booking_id,
            "status": "confirmed",
            "message": response_text,
            "customer_email": customer_data.get("email"),
        }


class CustomerServiceAgent:
    """Agent for handling customer calls, messages, and inquiries"""

    def __init__(self):
        self.name = "Amara - Customer Care Specialist"
        self.model = "claude-3-5-sonnet-20241022"

    def respond_to_inquiry(self, customer_message: str, context: Optional[str] = None) -> Dict:
        """Respond to customer inquiries about services and salon"""

        system_prompt = """You are Amara, a warm and knowledgeable customer service specialist for Beauty Bar.

Your personality: Friendly, professional, African-inspired hospitality, empowering, and helpful.

Key information about Beauty Bar:
- Premium African beauty salon
- Services: Nails, Hair Braiding, Frontal Installation, Lashes, Makeup, Before Rain Oil
- Location: 74 Road Before Rain Oil
- Hours: Mon-Fri 9AM-7PM, Sat 10AM-8PM, Sun 11AM-6PM

Always be helpful and celebrate African beauty culture."""

        if client:
            message = client.messages.create(
                model=self.model,
                max_tokens=1024,
                system=system_prompt,
                messages=[{"role": "user", "content": customer_message}],
            )
            response_text = message.content[0].text
        else:
            response_text = f"Thank you for your inquiry! At Beauty Bar, we specialize in African beauty services. How can we help you today?"

        # Log the interaction
        interaction = {
            "timestamp": datetime.now().isoformat(),
            "customer_message": customer_message,
            "agent_response": response_text,
            "context": context,
        }
        CUSTOMER_MESSAGES.append(interaction)

        return {
            "agent": self.name,
            "customer_message": customer_message,
            "response": response_text,
            "timestamp": datetime.now().isoformat(),
        }


class MarketingAgent:
    """Agent for creating marketing campaigns and strategies"""

    def __init__(self):
        self.name = "Zainab - Marketing & Brand Growth Specialist"
        self.model = "claude-3-5-sonnet-20241022"

    def create_marketing_campaign(
        self, campaign_type: str, target_audience: str = "", budget: str = ""
    ) -> Dict:
        """Create targeted marketing campaigns"""

        system_prompt = """You are Zainab, an expert marketing strategist for Beauty Bar.

You specialize in:
- Social media campaigns
- Content creation
- Email marketing
- Community engagement
- Influencer partnerships

Focus on celebrating African beauty traditions while driving growth."""

        message_text = f"""Create a comprehensive marketing campaign:
- Campaign Type: {campaign_type}
- Target Audience: {target_audience}
- Budget: {budget}

Include objectives, strategies, and KPIs."""

        if client:
            message = client.messages.create(
                model=self.model,
                max_tokens=2048,
                system=system_prompt,
                messages=[{"role": "user", "content": message_text}],
            )
            strategy_text = message.content[0].text
        else:
            strategy_text = f"Marketing campaign strategy for {campaign_type} targeting {target_audience} with budget {budget}"

        campaign = {
            "campaign_id": f"CAMP-{datetime.now().strftime('%Y%m%d%H%M%S')}",
            "type": campaign_type,
            "strategy": strategy_text,
        }

        MARKETING_CAMPAIGNS.append(campaign)

        return {
            "agent": self.name,
            "campaign_id": campaign["campaign_id"],
            "strategy": strategy_text,
        }


class GrowthPlanningAgent:
    """Agent for creating strategic growth and business development plans"""

    def __init__(self):
        self.name = "Kwame - Strategic Growth & Business Development"
        self.model = "claude-3-5-sonnet-20241022"

    def create_quarterly_growth_plan(
        self, current_metrics: Dict, goals: List[str]
    ) -> Dict:
        """Create comprehensive quarterly growth plans"""

        system_prompt = """You are Kwame, a strategic business development expert.

Your expertise includes:
- Revenue growth strategies
- Customer acquisition and retention
- Operational efficiency
- Staff development
- Market expansion

Create data-driven, actionable plans."""

        metrics_str = json.dumps(current_metrics, indent=2)
        goals_str = "\n".join([f"- {goal}" for goal in goals])

        message_text = f"""Create a comprehensive quarterly growth plan:

Current Metrics:
{metrics_str}

Growth Goals:
{goals_str}

Provide strategic recommendations."""

        if client:
            message = client.messages.create(
                model=self.model,
                max_tokens=2500,
                system=system_prompt,
                messages=[{"role": "user", "content": message_text}],
            )
            plan_text = message.content[0].text
        else:
            plan_text = f"Quarterly growth plan based on metrics and goals provided"

        return {
            "agent": self.name,
            "plan_type": "quarterly_growth_plan",
            "created_at": datetime.now().isoformat(),
            "strategy": plan_text,
        }


class BeautyBarMultiAgentSystem:
    """Orchestrator for all Beauty Bar agents"""

    def __init__(self):
        self.booking_agent = BookingAgent()
        self.customer_service_agent = CustomerServiceAgent()
        self.marketing_agent = MarketingAgent()
        self.growth_agent = GrowthPlanningAgent()

    def process_booking(self, customer_data: Dict) -> Dict:
        return self.booking_agent.process_booking_request(customer_data)

    def answer_customer_inquiry(self, message: str) -> Dict:
        return self.customer_service_agent.respond_to_inquiry(message)

    def create_marketing_strategy(self, campaign_type: str, target_audience: str = "", budget: str = "") -> Dict:
        return self.marketing_agent.create_marketing_campaign(campaign_type, target_audience, budget)

    def generate_growth_plan(self, metrics: Dict, goals: List[str]) -> Dict:
        return self.growth_agent.create_quarterly_growth_plan(metrics, goals)

    def get_system_status(self) -> Dict:
        return {
            "system_status": "operational",
            "agents": [
                {"name": self.booking_agent.name, "role": "Booking Management", "status": "active"},
                {"name": self.customer_service_agent.name, "role": "Customer Service", "status": "active"},
                {"name": self.marketing_agent.name, "role": "Marketing & Growth", "status": "active"},
                {"name": self.growth_agent.name, "role": "Strategic Growth Planning", "status": "active"},
            ],
            "timestamp": datetime.now().isoformat(),
        }
