# Beauty Bar - 3D Website + Multi-Agent AI System

🌟 **Professional 3D Website + Multi-Agent AI System for Beauty Bar**

A comprehensive solution featuring a stunning 3D website and powerful AI agents for managing bookings, customer service, marketing, and growth planning.

## 🎨 Features

### 🌐 Website
- **3D Interactive Background** - Beautiful animated geometric shapes using Three.js
- **Responsive Design** - Optimized for mobile, tablet, and desktop
- **Service Showcase** - Display all beauty services with pricing
- **Easy Booking System** - Simple form for customer reservations
- **Contact Information** - Location, hours, phone, email
- **Modern UI** - Professional African beauty aesthetic

### 🤖 AI Agent System

#### **Luna - Booking Specialist** 📅
- Process appointment bookings 24/7
- Handle cancellations and rescheduling
- Provide booking confirmations
- Manage customer details
- **Availability**: Always online

#### **Amara - Customer Care Specialist** 💬
- Answer customer inquiries about services
- Provide styling recommendations
- Handle complaints with empathy
- Share salon information
- **Availability**: 24/7 support

#### **Zainab - Marketing & Brand Growth Specialist** 📢
- Create targeted marketing campaigns
- Generate social media content
- Develop engagement strategies
- Plan seasonal promotions
- **Availability**: Business hours

#### **Kwame - Strategic Growth & Business Development** 📈
- Create quarterly growth plans
- Analyze business metrics
- Develop staff training programs
- Identify revenue opportunities
- **Availability**: Strategic hours

## 📋 Services Offered

- **Nails** - Professional nail care & art ($25+)
- **Hair Braiding** - Cornrows, Box Braids, Knotless ($50+)
- **Frontal Installation** - Premium hair extensions ($80+)
- **Lashes** - Extensions & volume lashes ($35+)
- **Makeup** - Professional makeup services ($40+)
- **Before Rain Oil** - Premium hair care treatments ($15+)

## 📍 Location
**74 Road Before Rain Oil**
- **Hours**: Mon-Fri 9AM-7PM | Sat 10AM-8PM | Sun 11AM-6PM
- **Phone**: +1 (555) 123-4567
- **Email**: info@beautybar.com

## 🚀 Quick Start

### View Website
Open `index.html` in your browser to see the 3D website.

### Run API Server
```bash
pip install -r requirements.txt
export ANTHROPIC_API_KEY=your_key_here
python agents/api_server.py
```

## 📊 Example API Calls

### Create a Booking
```bash
curl -X POST http://localhost:5000/api/booking/create \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Isha Patel",
    "email": "isha@example.com",
    "phone": "+1-555-0101",
    "service": "Hair Braiding",
    "date": "2024-07-15",
    "time": "14:00"
  }'
```

### Ask Amara a Question
```bash
curl -X POST http://localhost:5000/api/customer/inquiry \
  -H "Content-Type: application/json" \
  -d '{
    "message": "How do I maintain my braids after installation?"
  }'
```

### Create Marketing Campaign
```bash
curl -X POST http://localhost:5000/api/marketing/campaign \
  -H "Content-Type: application/json" \
  -d '{
    "campaign_type": "Social Media Campaign",
    "target_audience": "African diaspora women 18-45",
    "budget": "$2,000/month"
  }'
```

### Generate Growth Plan
```bash
curl -X POST http://localhost:5000/api/growth/quarterly-plan \
  -H "Content-Type: application/json" \
  -d '{
    "current_metrics": {
      "monthly_revenue": 15000,
      "customer_satisfaction_score": 4.8
    },
    "goals": [
      "Increase revenue to $25K",
      "Improve retention by 20%"
    ]
  }'
```

## 🌍 Cultural Focus

Beauty Bar celebrates and promotes:
- 🇳🇬 Authentic African beauty traditions
- 👑 African hairstyling expertise
- 💫 Modern African beauty innovations
- 👭 Community building around diaspora culture
- ✨ Empowerment through beauty and self-care

---

**Made with ❤️ for Beauty Bar - Celebrating African Beauty & Modern Styles**
