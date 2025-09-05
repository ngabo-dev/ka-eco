# Ka-Eco Urban Wetlands Monitoring System

A comprehensive full-stack application for monitoring and managing urban wetlands, combining real-time sensor data, field observations, and community engagement. Built with React (frontend) and FastAPI (backend) for a modern, scalable solution.

## 🌟 Overview

This system provides:
- **Real-time Environmental Monitoring**: Sensor integration for water quality, temperature, and ecological indicators
- **Multi-role User Management**: Support for researchers, government officials, and community members
- **Interactive Dashboard**: Data visualization with charts, maps, and analytics
- **Field Observation Tools**: Mobile-friendly forms for on-site data collection
- **Community Engagement**: Public access to environmental data and educational content

## 🏗️ Architecture

- **Frontend**: React 18 with TypeScript, Vite build tool, Tailwind CSS, Radix UI components
- **Backend**: FastAPI with Python, SQLAlchemy ORM, JWT authentication
- **Database**: MySQL (production) or SQLite (development)
- **Deployment**: Container-ready with Docker support

## 📋 Prerequisites

### System Requirements
- **Node.js**: 16.0 or higher
- **Python**: 3.8 or higher
- **Git**: For version control
- **Database**: MySQL 5.7+ or SQLite 3.0+

### Operating System Support

#### Windows
- Windows 10/11
- PowerShell or Command Prompt
- Windows Subsystem for Linux (WSL) recommended

#### macOS
- macOS 10.15 (Catalina) or later
- Xcode Command Line Tools

#### Linux
- Ubuntu 18.04+, CentOS 7+, or equivalent

## 🚀 Quick Start

### 1. Clone the Repository

```bash
git clone <https://github.com/ngabo-dev/ka-eco.git>
cd ka-eco-urban-wetlands
```

### 2. Backend Setup

#### Windows/macOS/Linux
```bash
cd backend
python3 -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate
pip install -r requirements.txt
```

#### Database Setup (Choose one)

**MySQL (Production):**
```bash
# Install MySQL and create database
mysql -u root -p
CREATE DATABASE `ka-eco`;
USE `ka-eco`;
SOURCE database_schema.sql;
```

**SQLite (Development):**
```bash
# Database created automatically
python seed.py
```

#### Configure Environment
```bash
# Create .env file in backend directory
cp .env.example .env
# Edit .env with your database credentials
```

#### Start Backend
```bash
python main.py
```
Backend will run at: `http://localhost:8000`

### 3. Frontend Setup

#### Windows/macOS/Linux
```bash
# From project root
npm install
npm run dev
```
Frontend will run at: `http://localhost:5173`

### 4. Access the Application

- **Frontend**: http://localhost:5173
- **Backend API**: http://localhost:8000
- **API Documentation**: http://localhost:8000/docs

## 📦 Detailed Installation

### Backend Installation

#### Python Environment Setup

**Windows:**
```cmd
cd backend
python -m venv venv
venv\Scripts\activate
pip install -r requirements.txt
```

**macOS:**
```bash
cd backend
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
```

**Linux:**
```bash
cd backend
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
```

#### Database Configuration

**MySQL Setup:**

*Windows (XAMPP):*
1. Download XAMPP: https://www.apachefriends.org/
2. Start MySQL service
3. Open phpMyAdmin: http://localhost/phpmyadmin
4. Create database `ka-eco`
5. Import `database_schema.sql`

*macOS (Homebrew):*
```bash
brew install mysql
brew services start mysql
mysql -u root -p
CREATE DATABASE `ka-eco`;
USE `ka-eco`;
SOURCE database_schema.sql;
```

*Linux (Ubuntu):*
```bash
sudo apt update
sudo apt install mysql-server
sudo systemctl start mysql
sudo mysql_secure_installation
mysql -u root -p
CREATE DATABASE `ka-eco`;
USE `ka-eco`;
SOURCE database_schema.sql;
```

**SQLite Setup (Simpler):**
```bash
cd backend
python seed.py  # Creates wetlands.db automatically
```

#### Environment Variables

Create `backend/.env`:
```env
DATABASE_URL=mysql+pymysql://user:password@ka-eco-ka-eco.d.aivencloud.com:13837/ka-eco
# Or for SQLite:
# DATABASE_URL=sqlite:///./wetlands.db

SECRET_KEY=your-super-secret-key-change-this-in-production
CORS_ORIGINS=http://localhost:5173
```

### Frontend Installation

#### Node.js Setup

**Windows:**
```cmd
# Download from https://nodejs.org/
# Or using Chocolatey: choco install nodejs
npm install
```

**macOS:**
```bash
# Using Homebrew
brew install node
npm install
```

**Linux (Ubuntu):**
```bash
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs
npm install
```

#### Build Tools
```bash
npm install  # Installs all dependencies from package.json
```

## 🏃‍♂️ Running the Application

### Development Mode

**Start Backend:**
```bash
cd backend
source venv/bin/activate  # Windows: venv\Scripts\activate
python main.py
```

**Start Frontend:**
```bash
npm run dev
```

**Access Points:**
- Frontend: http://localhost:5173
- Backend API: http://localhost:8000
- API Docs: http://localhost:8000/docs

### Production Mode

**Build Frontend:**
```bash
npm run build
```

**Serve Frontend:**
```bash
npm run preview  # For testing production build
```

**Backend Production:**
```bash
cd backend
pip install gunicorn
gunicorn -w 4 -k uvicorn.workers.UvicornWorker main:app --bind 0.0.0.0:8000
```

## 🔧 Configuration

### Frontend Configuration

The frontend is configured via environment variables in `.env.local`:

```env
VITE_API_BASE_URL=http://localhost:8000
VITE_APP_TITLE=Ka-Eco Urban Wetlands
```

### Backend Configuration

Main configuration is in `backend/.env`:

```env
DATABASE_URL=mysql+pymysql://user:pass@host/db
SECRET_KEY=your-secret-key
CORS_ORIGINS=http://localhost:5173,https://yourdomain.com
HOST=0.0.0.0
PORT=8000
LOG_LEVEL=INFO
```

## 🗄️ Database Management

### Schema Management

**View Schema:**
- MySQL: `database_schema.sql`
- SQLite: `database_schema_sqlite.sql`

**Reset Database:**
```bash
cd backend
# For MySQL
mysql -u root -p -e "DROP DATABASE \`ka-eco\`; CREATE DATABASE \`ka-eco\`;"
mysql -u root -p ka-eco < database_schema.sql

# For SQLite
rm wetlands.db
python seed.py
```

### Data Seeding

```bash
cd backend
python seed.py
```

Creates:
- Default admin user: admin@example.com / admin123
- Sample wetland sites
- Test sensor data

## 👥 User Roles & Features

### Admin
- Full system management
- User administration
- System configuration

### Researcher
- Wetland monitoring
- Data collection and analysis
- Report generation

### Government Official
- Compliance monitoring
- Regulatory reporting
- Public data access

### Community Member
- Public information access
- Basic observation submission
- Educational content

## 🧪 Testing

### Backend Tests
```bash
cd backend
pip install pytest pytest-asyncio httpx
pytest
```

### Frontend Tests
```bash
npm test
```

## 🚀 Deployment

### Docker Deployment

**Build Images:**
```bash
# Backend
cd backend
docker build -t ka-eco-backend .

# Frontend
docker build -t ka-eco-frontend .
```

**Run Containers:**
```bash
docker-compose up -d
```

### Cloud Deployment

**Recommended Platforms:**
- **Frontend**: Vercel, Netlify, AWS S3 + CloudFront
- **Backend**: Heroku, DigitalOcean App Platform, AWS ECS
- **Database**: AWS RDS, Google Cloud SQL, Azure Database

## 🔧 Troubleshooting

### Common Issues

#### Frontend Issues
- **Port 5173 in use**: Change port in `vite.config.ts`
- **CORS errors**: Update `CORS_ORIGINS` in backend `.env`
- **Build failures**: Clear node_modules: `rm -rf node_modules && npm install`

#### Backend Issues
- **Database connection**: Verify DATABASE_URL in `.env`
- **Port 8000 in use**: Change PORT in `.env`
- **Import errors**: Ensure virtual environment is activated

#### Database Issues
- **MySQL connection**: Ensure MySQL service is running
- **SQLite permissions**: Check file permissions on `wetlands.db`
- **Migration errors**: Reset database and re-run seed.py

### Logs and Debugging

**Frontend Logs:**
```bash
npm run dev  # Shows build and runtime logs
```

**Backend Logs:**
```bash
cd backend
python main.py  # Shows FastAPI logs
```

**Database Logs:**
- MySQL: Check MySQL error logs
- SQLite: Enable SQL logging in application

## 📚 Documentation

### API Documentation
- **Swagger UI**: http://localhost:8000/docs
- **ReDoc**: http://localhost:8000/redoc
- **OpenAPI Schema**: http://localhost:8000/openapi.json

### Project Documentation
- **Sensor Integration**: See `SENSOR_INTEGRATION.md`
- **Database Schema**: See `database_schema.sql`
- **Frontend Guidelines**: See `src/guidelines/`

## 🤝 Contributing

1. Fork the repository
2. Create feature branch: `git checkout -b feature/your-feature`
3. Make changes with tests
4. Run tests: `npm test && cd backend && pytest`
5. Format code: `npm run format && cd backend && black .`
6. Commit: `git commit -am 'Add feature'`
7. Push: `git push origin feature/your-feature`
8. Create Pull Request

## 📄 Scripts

### Frontend Scripts
```bash
npm run dev      # Start development server
npm run build    # Build for production
npm run preview  # Preview production build
npm run format   # Format code with Prettier
npm run lint     # Run ESLint
```

### Backend Scripts
```bash
python main.py          # Start development server
python seed.py          # Seed database
pytest                  # Run tests
black .                 # Format code
isort .                 # Sort imports
```

## 🔄 Version History

- **v1.0.0**: Initial release with core monitoring features
- **v1.1.0**: Added real-time sensor integration
- **v1.2.0**: Enhanced dashboard with advanced analytics
- **v1.3.0**: Multi-role user system and community features

## 📞 Support

- **Issues**: GitHub Issues
- **Discussions**: GitHub Discussions
- **Documentation**: See `/docs` when running
- **Email**: Contact development team

## 📋 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- Built with React, FastAPI, and modern web technologies
- Community contributions and environmental monitoring initiatives

---

**Contributing to urban wetland conservation through technology!** 🌿