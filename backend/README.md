# Ka-Eco Urban Wetlands Backend

A comprehensive FastAPI-based backend system for monitoring urban wetlands, featuring multi-role user management, real-time sensor integration, and environmental data analytics.

## 🚀 Features

- **Multi-Role User Management**: Support for Admin, Researcher, Government Official, and Community Member roles
- **Wetland Monitoring**: Complete CRUD operations for wetland sites with geographical data
- **Field Observations**: Record and manage environmental observations with timestamps
- **Sensor Integration**: Real-time sensor data ingestion and management with heartbeat monitoring
- **Dashboard Analytics**: Environmental data visualization and reporting capabilities
- **JWT Authentication**: Secure token-based authentication with role-based access control
- **RESTful API**: Well-documented API endpoints with automatic OpenAPI documentation
- **Database Flexibility**: Support for both MySQL and SQLite databases

## 📋 Prerequisites

### System Requirements
- **Python**: 3.8 or higher
- **Database**: MySQL 5.7+ or SQLite 3.0+
- **Git**: For version control
- **Node.js**: 16+ (for frontend development, optional for backend-only)

### Operating System Support

#### Windows
- Windows 10/11
- PowerShell or Command Prompt
- Windows Subsystem for Linux (WSL) recommended for better compatibility

#### macOS
- macOS 10.15 (Catalina) or later
- Xcode Command Line Tools

#### Linux
- Ubuntu 18.04+, CentOS 7+, or equivalent
- Most distributions supported

## 🛠️ Installation & Setup

### 1. Clone the Repository

```bash
git clone <repository-url>
cd ka-eco-urban-wetlands/backend
```

### 2. Create Virtual Environment

#### Windows (Command Prompt)
```cmd
python -m venv venv
venv\Scripts\activate
```

#### Windows (PowerShell)
```powershell
python -m venv venv
venv\Scripts\Activate.ps1
```

#### macOS/Linux
```bash
python3 -m venv venv
source venv/bin/activate
```

### 3. Install Dependencies

```bash
pip install -r requirements.txt
```

**Note**: If you encounter permission errors on macOS/Linux, use:
```bash
pip install --user -r requirements.txt
```

### 4. Database Setup

Choose one of the following database options:

#### Option A: MySQL (Recommended for Production)

##### Windows (XAMPP)
1. Download and install XAMPP from https://www.apachefriends.org/
2. Start XAMPP Control Panel and start MySQL
3. Open phpMyAdmin at `http://localhost/phpmyadmin`
4. Create a new database named `ka-eco`
5. Import the SQL schema:
   - Go to Import tab in phpMyAdmin
   - Select `../database_schema.sql`
   - Click Go

##### macOS (Homebrew)
```bash
brew install mysql
brew services start mysql
mysql -u root -p
CREATE DATABASE `ka-eco`;
USE `ka-eco`;
SOURCE database_schema.sql;
```

##### Linux (Ubuntu/Debian)
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

##### Linux (CentOS/RHEL)
```bash
sudo yum install mysql-server
sudo systemctl start mysqld
sudo mysql_secure_installation
mysql -u root -p
CREATE DATABASE `ka-eco`;
USE `ka-eco`;
SOURCE database_schema.sql;
```

#### Option B: SQLite (Recommended for Development)

SQLite is included with Python and requires no additional setup:

```bash
# The database file will be created automatically
python seed.py
```

### 5. Environment Configuration

Create a `.env` file in the backend directory:

```env
# Database Configuration
DATABASE_URL=mysql+pymysql://user:password@ka-eco-ka-eco.d.aivencloud.com:13837/ka-eco
# For SQLite, use:
# DATABASE_URL=sqlite:///./wetlands.db

# Security
SECRET_KEY=your-super-secret-key-change-this-in-production-make-it-long-and-random

# Optional: CORS settings
CORS_ORIGINS=http://localhost:3000,http://localhost:5173

# Optional: Server settings
HOST=0.0.0.0
PORT=8000
```

**Security Note**: Never commit the `.env` file to version control. Add it to `.gitignore`.

### 6. Initialize Database

```bash
python seed.py
```

This will create initial data including:
- Default admin user (admin@example.com / admin123)
- Sample wetland sites
- Test sensor data

### 7. Start the Development Server

```bash
python main.py
```

The API will be available at:
- **API Base URL**: `http://localhost:8000`
- **API Documentation**: `http://localhost:8000/docs` (Swagger UI)
- **Alternative Docs**: `http://localhost:8000/redoc` (ReDoc)

## 🔧 Configuration Options

### Database URLs

| Database | URL Format | Example |
|----------|------------|---------|
| MySQL | `mysql+pymysql://user:password@host/db` | `mysql+pymysql://user:password@ka-eco-ka-eco.d.aivencloud.com:13837/ka-eco` |
| SQLite | `sqlite:///./filename.db` | `sqlite:///./wetlands.db` |

### Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `DATABASE_URL` | Database connection string | Required |
| `SECRET_KEY` | JWT signing key | Required |
| `CORS_ORIGINS` | Allowed CORS origins | `http://localhost:3000` |
| `HOST` | Server host | `0.0.0.0` |
| `PORT` | Server port | `8000` |

## 📚 API Documentation

### Authentication Endpoints
- `POST /auth/register` - User registration
- `POST /auth/token` - User login (returns JWT token)
- `GET /auth/users/me` - Get current user profile
- `PUT /auth/users/me` - Update user profile
- `GET /auth/users` - List all users (Admin only)
- `PUT /auth/users/{user_id}` - Update user (Admin only)
- `DELETE /auth/users/{user_id}` - Delete user (Admin only)

### Wetland Management
- `GET /wetlands` - List wetlands (with filtering/pagination)
- `POST /wetlands` - Create new wetland
- `GET /wetlands/{wetland_id}` - Get wetland details
- `PUT /wetlands/{wetland_id}` - Update wetland
- `DELETE /wetlands/{wetland_id}` - Delete wetland

### Field Observations
- `GET /observations` - List observations
- `POST /observations` - Create observation
- `GET /observations/{observation_id}` - Get observation details
- `PUT /observations/{observation_id}` - Update observation
- `DELETE /observations/{observation_id}` - Delete observation

### Sensor Management
- `GET /sensors` - List all sensors
- `POST /sensors` - Register new sensor
- `GET /sensors/{sensor_id}` - Get sensor details
- `PUT /sensors/{sensor_id}` - Update sensor
- `DELETE /sensors/{sensor_id}` - Remove sensor
- `GET /sensors/wetland/{wetland_id}` - Get sensors by wetland
- `POST /sensors/data` - Ingest sensor data
- `POST /sensors/{sensor_id}/heartbeat` - Sensor heartbeat

### Dashboard & Analytics
- `GET /dashboard/sensor-data` - Get sensor data
- `POST /dashboard/sensor-data` - Create sensor data
- `GET /dashboard/sensor-data/{wetland_id}` - Get sensor data by wetland
- `GET /dashboard/observations-chart` - Get observation chart data
- `GET /dashboard/sensor-averages/{wetland_id}` - Get sensor averages

## 👥 User Roles & Permissions

### Admin
- Full system access and configuration
- User management (create, update, delete)
- All wetland and sensor management
- System monitoring and maintenance

### Researcher
- View and manage assigned wetlands
- Record field observations
- Access sensor data and analytics
- Generate research reports

### Government Official
- View wetland data and compliance reports
- Access environmental monitoring data
- Review regulatory information
- Generate official documentation

### Community Member
- View public wetland information
- Submit basic observations
- Access educational content
- Participate in community initiatives

## 🗄️ Database Schema

The system uses the following main tables:
- `users` - User accounts, roles, and authentication
- `wetlands` - Wetland monitoring sites with geographical data
- `sensors` - Sensor devices, metadata, and status
- `observations` - Field observations with environmental data
- `sensor_data` - Real-time sensor readings and measurements

See `database_schema.sql` or `database_schema_sqlite.sql` for complete table definitions.

## 🔐 Authentication

The API uses JWT (JSON Web Tokens) for secure authentication:

1. **Registration/Login**: Obtain an access token via `/auth/token`
2. **Authorization**: Include token in headers: `Authorization: Bearer <token>`
3. **Token Expiry**: Tokens expire after 30 minutes
4. **Refresh**: Implement token refresh for long-running sessions

## 🧪 Testing

### Running Tests
```bash
# Install test dependencies
pip install pytest pytest-asyncio httpx

# Run all tests
pytest

# Run with coverage
pytest --cov=app --cov-report=html
```

### Test Database
Tests use an in-memory SQLite database to avoid affecting development data.

## 🚀 Production Deployment

### Using Gunicorn (Recommended)
```bash
pip install gunicorn
gunicorn -w 4 -k uvicorn.workers.UvicornWorker main:app --bind 0.0.0.0:8000
```

### Using Docker
```dockerfile
FROM python:3.9-slim

WORKDIR /app
COPY requirements.txt .
RUN pip install -r requirements.txt

COPY . .
EXPOSE 8000

CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
```

### Environment Setup for Production
```env
DATABASE_URL=mysql+pymysql://user:password@ka-eco-ka-eco.d.aivencloud.com:13837/ka-eco
SECRET_KEY=very-long-random-secret-key-for-production
CORS_ORIGINS=https://yourdomain.com
HOST=0.0.0.0
PORT=8000
```

## 🔧 Troubleshooting

### Common Issues

#### Database Connection Errors
- **MySQL**: Ensure MySQL service is running and credentials are correct
- **SQLite**: Check file permissions and path
- **Solution**: Verify `DATABASE_URL` in `.env` file

#### Import Errors
- Ensure virtual environment is activated
- Reinstall dependencies: `pip install -r requirements.txt`
- Check Python version compatibility

#### Port Already in Use
- Change port in `.env` or use: `uvicorn main:app --port 8001`
- Find process using port: `lsof -i :8000` (Linux/macOS)

#### CORS Issues
- Add frontend URL to `CORS_ORIGINS` in `.env`
- For development: `CORS_ORIGINS=http://localhost:3000,http://localhost:5173`

### Logs and Debugging
- Enable debug logging: Set `LOG_LEVEL=DEBUG` in `.env`
- Check application logs in terminal
- Use `/docs` endpoint for API testing

## 📈 Performance Optimization

- **Database Indexing**: Ensure proper indexes on frequently queried columns
- **Connection Pooling**: Configure database connection pooling for production
- **Caching**: Implement Redis for session and data caching
- **Async Operations**: Use async database drivers for better performance

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/your-feature`
3. Make your changes with proper tests
4. Run tests: `pytest`
5. Format code: `black . && isort .`
6. Commit changes: `git commit -am 'Add new feature'`
7. Push to branch: `git push origin feature/your-feature`
8. Submit a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

- **Documentation**: Visit `/docs` when server is running
- **Issues**: Report bugs on GitHub Issues
- **Discussions**: Use GitHub Discussions for questions
- **Email**: Contact the development team

## 🔄 Version History

- **v1.0.0**: Initial release with core features
- **v1.1.0**: Added sensor heartbeat monitoring
- **v1.2.0**: Enhanced dashboard analytics
- **v1.3.0**: Multi-database support (MySQL/SQLite)

---

**Happy coding!** 🌱