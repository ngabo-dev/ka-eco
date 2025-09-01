# Ka-Eco: Urban Wetlands Monitoring System

A comprehensive web-based platform for monitoring and visualizing real-time environmental data for sustainable wetland management in Rwanda.

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- npm or yarn
- Backend server running (see backend README)

### Installation

1. **Clone and navigate to frontend directory:**
   ```bash
   cd ka-eco-urban-wetlands/src
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Start development server:**
   ```bash
   npm run dev
   ```

4. **Open your browser:**
   - Frontend: `http://localhost:3000`
   - Backend API: `http://localhost:8000`
   - API Docs: `http://localhost:8000/docs`

## 🌟 Features

### Authentication & Access Control
- JWT-based authentication with secure login/signup
- Role-based access control (Admin, Researcher, Government Official, Community Member)
- User profile management and session handling

### Interactive Dashboard
- Real-time environmental data visualization
- Interactive charts for temperature, pH, dissolved oxygen, and turbidity
- System status monitoring with alert management
- Responsive design for desktop and mobile

### Wetland Management
- CRUD operations for wetland sites
- Comprehensive wetland information tracking
- Location-based mapping and coordinates
- Status monitoring and maintenance scheduling

### Field Observations
- Field observation recording system
- Multiple observation types (wildlife, vegetation, water quality, pollution, maintenance)
- Severity classification and status tracking
- Photo attachments and GPS coordinates support

### Data Visualization
- Recharts-powered interactive charts
- Real-time sensor data simulation
- Historical trend analysis
- Comparative wetland performance metrics

### Reporting & Export
- CSV data export functionality
- PDF report generation (admin/researcher roles)
- Customizable data filtering and sorting
- Print-friendly report layouts

## 🚀 Technology Stack

### Frontend
- **React 18** with TypeScript
- **Tailwind CSS v4** for styling
- **Shadcn/ui** component library
- **Recharts** for data visualization
- **Lucide React** for icons

### Backend Integration Ready
- Designed for **FastAPI** backend integration
- RESTful API endpoint structure
- JWT token management
- Mock data simulation for development

### Database Structure
- PostgreSQL/MySQL compatible design
- Sequelize ORM ready models
- Optimized for time-series sensor data
- Scalable architecture for IoT integration

## 👥 User Roles & Permissions

The system supports four user roles with different access levels:

### 🛡️ Admin
**Capabilities:**
- Full system administration
- User management (create, edit, delete users)
- System configuration and settings
- Access to all wetlands and sensor data
- Generate comprehensive reports
- Manage sensor devices and configurations

**Use Case:** System administrators, IT managers

### 🔬 Researcher
**Capabilities:**
- View and analyze environmental data
- Record field observations
- Access sensor data and trends
- Generate research reports
- Manage assigned wetland sites
- Export data for analysis

**Use Case:** Environmental scientists, researchers, field technicians

### 🏛️ Government Official
**Capabilities:**
- Access environmental monitoring data
- Review wetland compliance information
- Generate official reports and documentation
- Monitor environmental standards
- View public and restricted data
- Access regulatory information

**Use Case:** Environmental regulators, government agencies, policy makers

### 👥 Community Member
**Capabilities:**
- View public wetland information
- Submit basic observations
- Access educational content
- Participate in community initiatives
- View environmental awareness materials
- Report local environmental concerns

**Use Case:** Local community members, students, environmental enthusiasts

## 📱 Getting Started

### First Time Setup

1. **Register a new account** or use the default admin account:
   - **Username**: admin
   - **Email**: admin@ka-eco.rw
   - **Password**: admin123 (or any password for testing)

2. **Explore the dashboard** to understand the interface

3. **Add your first wetland** using the "Wetlands" tab

4. **Record observations** to start building environmental data

### Navigation Guide

- **Dashboard**: Overview of environmental data and system status
- **Wetlands**: Manage wetland monitoring sites
- **Settings**: User profile and system preferences

## 🌐 Live Features

### Real-time Simulation
- Sensor data updates every 10 seconds
- Dynamic status alerts based on environmental thresholds
- Live system status monitoring

### Interactive Components
- Clickable wetland map markers
- Sortable data tables with filtering
- Responsive chart interactions
- Modal forms for data entry

### Environmental Monitoring
- **Temperature**: 20-30°C range monitoring
- **pH Levels**: 6.5-8.5 optimal range tracking
- **Dissolved Oxygen**: Critical aquatic health indicator
- **Turbidity**: Water clarity measurement
- **Water Levels**: Flood and drought monitoring

## 🏗️ FastAPI Backend Requirements

To complete the full-stack implementation, you'll need to create a FastAPI backend with:

### Core API Endpoints
```
POST /api/auth/login - User authentication
POST /api/auth/register - User registration
GET /api/wetlands - Get all wetlands
POST /api/wetlands - Create new wetland
PUT /api/wetlands/{id} - Update wetland
DELETE /api/wetlands/{id} - Delete wetland
GET /api/observations - Get field observations
POST /api/observations - Create observation
GET /api/sensor-data - Get real-time sensor readings
```

### Database Models
- Users (authentication and roles)
- Wetlands (site information and metadata)
- SensorReadings (time-series environmental data)
- Observations (field reports and incidents)
- Sensors (device configuration and status)

### Required Dependencies
```bash
fastapi
uvicorn
sqlalchemy
psycopg2-binary  # for PostgreSQL
python-jose[cryptography]  # for JWT
passlib[bcrypt]  # for password hashing
python-multipart  # for file uploads
```

## 🔧 IoT Integration Ready

The system is designed for easy integration with:
- Arduino/Raspberry Pi sensor networks
- MQTT message brokers
- WebSocket real-time data streams
- REST API sensor endpoints
- Automated data collection workflows

## 📊 Environmental Monitoring Capabilities

### Water Quality Parameters
- pH levels with optimal range alerts
- Dissolved oxygen for aquatic ecosystem health
- Turbidity for water clarity assessment
- Temperature monitoring for seasonal analysis

### Ecosystem Health Indicators
- Wildlife observation tracking
- Vegetation health monitoring
- Pollution incident reporting
- Maintenance requirement alerts

### Data Analysis Features
- Historical trend analysis
- Comparative site performance
- Predictive analytics ready
- Export capabilities for research

## 🌍 Rwanda-Specific Features

### Kigali Wetlands Focus
- Pre-configured with major Kigali wetlands
- Local coordinate system support
- Rwanda-specific environmental standards
- Multi-language support ready (Kinyarwanda, English, French)

### Urban Wetland Management
- Flood control monitoring
- Wastewater treatment tracking
- Biodiversity conservation metrics
- Community engagement features

## 📈 Scalability & Future Enhancements

### Cloud Deployment Ready
- Containerized architecture
- Environment-specific configurations
- Scalable data storage solutions
- CDN integration for global access

### Planned Enhancements
- Mobile app development
- Advanced GIS integration
- Machine learning analytics
- Community reporting portal
- Government dashboard integration

## 🤝 Contributing

This project is designed to support Rwanda's environmental monitoring initiatives and sustainable development goals. The codebase is structured for easy extension and customization for other regions and use cases.

## 📜 License

Developed for environmental monitoring and conservation efforts in Rwanda. Contact the development team for licensing and deployment information.

---

**Ka-Eco** - Empowering sustainable wetland management through technology 🌱💧