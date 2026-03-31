<div align="center">

# 🏍️ Safety Riding Management System

**Modern web application for managing safety riding education programs, events, schools, budgets, and market analytics**

[![Go Version](https://img.shields.io/badge/Go-1.25-00ADD8?style=for-the-badge&logo=go)](https://go.dev/)
[![React Version](https://img.shields.io/badge/React-19.1.1-61DAFB?style=for-the-badge&logo=react)](https://react.dev/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-13+-336791?style=for-the-badge&logo=postgresql)](https://postgresql.org/)
[![License](https://img.shields.io/badge/License-MIT-green.svg?style=for-the-badge)](LICENSE)

[Features](#-features) • [Tech Stack](#-tech-stack) • [Installation](#-installation) • [API Docs](#-api-documentation) • [Contributing](#-contributing)

</div>

---

## 📋 Table of Contents

- [Overview](#-overview)
- [Features](#-features)
- [Tech Stack](#-tech-stack)
- [Architecture](#-architecture)
- [Installation](#-installation)
- [Configuration](#-configuration)
- [API Documentation](#-api-documentation)
- [Project Structure](#-project-structure)
- [Contributing](#-contributing)
- [License](#-license)

---

## 🎯 Overview

Safety Riding Management System is a comprehensive full-stack web application designed to manage safety riding education programs. The system provides tools for organizing events, tracking school partnerships, managing budgets, analyzing market share, and monitoring user activities with role-based access control.

### Key Highlights

- 🎨 **Modern UI/UX** - Gradient designs, smooth animations, glassmorphism effects
- 🔐 **Secure Authentication** - JWT-based auth with advanced password validation
- 🗺️ **Interactive Maps** - Location picking with Leaflet integration
- 📊 **Analytics Dashboard** - Real-time charts and market share visualization
- 📄 **Submitted Forms Sync** - Google Sheets intake data synced into PostgreSQL
- 📱 **Responsive Design** - Mobile-first approach with Bootstrap 5
- 🚀 **High Performance** - Built with Go and React for optimal speed

---

## ✨ Features

### 🔐 Authentication & Authorization
- **User Registration** with email verification
- **Secure Login** with JWT token management
- **Password Requirements**: 8+ characters, uppercase, lowercase, number, symbol
- **Password Visibility Toggle** on all forms
- **Role-Based Access Control** (Admin, Manager, User)
- **Profile Management** with avatar support

### 🎓 School Management
- **CRUD Operations** for school records
- **Interactive Map Integration** for location selection
- **Auto-fill Address Data** from map coordinates
- **Location Hierarchy** (Province → City → District)
- **School Statistics** (students, teachers, majors, visits)
- **Visit History Tracking**
- **Education Status Monitoring**

### 📅 Event Management
- **Comprehensive Event Planning**
  - Event types (Seminar, Workshop, Training, Custom)
  - Date, time, and duration tracking
  - Target vs actual attendees with achievement badges
  - Status tracking (Planned, Ongoing, Completed, Cancelled)
- **Instructor Management** with contact information
- **Photo Gallery** with captions and ordering
- **Achievement Tracking** with color-coded performance indicators
- **Event Finalization** controls with admin override
- **Target Audience** specification

### 💰 Budget Management
- **Budget Planning & Tracking**
- **Category-based Organization**
- **Budget vs Actual Spent Comparison**
- **Status Workflow** (Planned → Approved → In Progress → Completed/Cancelled)
- **Event Linkage** for budget allocation
- **Financial Reporting**

### 📊 Market Share Analytics
- **Monthly & Yearly Sales Tracking**
- **Unit Sales** (not currency) with clear indicators
- **Competitor Analysis**
- **Market Share Percentage** calculation
- **Location-based Analytics** (Province/City/District)
- **Historical Trend Analysis**
- **Visual Data Representation**

### 📄 Submitted Forms
- **Google Sheets Sync** for submitted form rows and approval rows
- **PostgreSQL Persistence** so filtering and detail views do not depend on live sheet reads
- **Latest Status Mapping** from approval workflow data
- **Dedicated Detail Page** for submitter information, training request data, approval history, and recipients
- **Manual Sync** with stale-check protection to reduce unnecessary fetches

### ⚙️ Configurations
- **Database-Driven Runtime Configs** editable without backend restart
- **Google Sheets URL Management** from the UI
- **Modal-Based Editing** for safer value updates
- **Confirmation Modal** before enabling or disabling a config

### 👥 User Management
- **User CRUD Operations**
- **Role Assignment** and permissions
- **Activity Monitoring**
- **Bulk User Operations**
- **User Profile Customization**
- **Password Change** functionality

### 🎨 UI/UX Features
- **Modern Gradient Backgrounds**
- **Smooth Animations & Transitions**
- **Floating Shapes** for visual appeal
- **Glassmorphism Cards**
- **Auto-select on Focus** for number inputs
- **Negative Number Prevention** validation
- **Helpful Placeholders & Tooltips**
- **Responsive Tables** with pagination
- **Toast Notifications** for user feedback
- **Breadcrumb Navigation**
- **Loading States** and skeleton screens

---

## 🛠️ Tech Stack

### Backend
| Technology | Version | Purpose |
|-----------|---------|---------|
| **Go** | 1.25 | Core backend language |
| **Gin** | 1.11.0 | Web framework & routing |
| **GORM** | 1.31.0 | ORM for database operations |
| **PostgreSQL** | 13+ | Primary database |
| **Redis** | 9.16.0 | Caching & session management |
| **JWT** | 5.3.0 | Authentication tokens |
| **Swagger** | 1.16.6 | API documentation |
| **golang-migrate** | 4.19.0 | Database migrations |
| **Viper** | 1.21.0 | Configuration management |
| **MinIO** | 7.0.95 | Object storage for images |

### Frontend
| Technology | Version | Purpose |
|-----------|---------|---------|
| **React** | 19.1.1 | UI library |
| **Vite** | 7.1.6 | Build tool & dev server |
| **React Router** | 7.9.4 | Client-side routing |
| **Bootstrap** | 5.3.8 | UI framework |
| **React-Bootstrap** | 2.10.10 | Bootstrap components for React |
| **Axios** | 1.12.2 | HTTP client |
| **Leaflet** | 1.9.4 | Interactive maps |
| **Chart.js** | 4.5.1 | Data visualization |
| **React Toastify** | 11.0.5 | Notifications |
| **Bootstrap Icons** | 1.13.1 | Icon library |

### DevOps & Tools
- **Docker** - Containerization
- **Git** - Version control
- **ESLint** - Code linting
- **Swagger UI** - Interactive API docs

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────┐
│                   Frontend (React)                      │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐   │
│  │   Pages     │  │ Components  │  │  Services   │   │
│  │  (Views)    │  │  (Reusable) │  │   (API)     │   │
│  └─────────────┘  └─────────────┘  └─────────────┘   │
└─────────────────────────────────────────────────────────┘
                          ↓ HTTP/HTTPS
┌─────────────────────────────────────────────────────────┐
│                Backend (Go + Gin)                       │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐   │
│  │  Handlers   │  │  Services   │  │    Utils    │   │
│  │ (Controllers)│  │  (Business) │  │  (Helpers)  │   │
│  └─────────────┘  └─────────────┘  └─────────────┘   │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐   │
│  │ Middlewares │  │    DTOs     │  │   Domain    │   │
│  │ (Auth, CORS)│  │(Data Transfer)│ │  (Entities) │   │
│  └─────────────┘  └─────────────┘  └─────────────┘   │
└─────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────┐
│              Data Layer                                 │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐ │
│  │  PostgreSQL  │  │    Redis     │  │    MinIO     │ │
│  │  (Database)  │  │   (Cache)    │  │  (Storage)   │ │
│  └──────────────┘  └──────────────┘  └──────────────┘ │
└─────────────────────────────────────────────────────────┘
```

---

## 📦 Installation

### Prerequisites

Before you begin, ensure you have the following installed:

- **Go** 1.25 or higher - [Download](https://go.dev/dl/)
- **Node.js** 18+ and npm - [Download](https://nodejs.org/)
- **PostgreSQL** 13+ - [Download](https://www.postgresql.org/download/)
- **Redis** (Optional) - [Download](https://redis.io/download/)
- **Git** - [Download](https://git-scm.com/downloads)

### Quick Start

#### 1. Clone the Repository

```bash
git clone https://github.com/zazhedho/safety-riding.git
cd safety-riding
```

#### 2. Backend Setup

```bash
# Install Go dependencies
go mod download

# Copy environment file
cp .env.example .env

# Edit .env with your database credentials
nano .env

# Run database migrations
go run main.go migrate up

# Start the backend server
go run main.go
# Server will start on http://localhost:8080
```

#### 3. Frontend Setup

```bash
# Navigate to frontend directory
cd frontend

# Install Node dependencies
npm install

# Start development server
npm run dev
# Frontend will start on http://localhost:5173
```

#### 4. Access the Application

- **Frontend**: http://localhost:5173
- **Backend API**: http://localhost:8080
- **API Documentation**: http://localhost:8080/swagger/index.html

### 🐳 Docker Installation

Run the entire stack with Docker Compose:

```bash
# Build and start all services
docker-compose up -d

# View logs
docker-compose logs -f

# Stop all services
docker-compose down
```

---

## ⚙️ Configuration

### Environment Variables

Create a `.env` file in the root directory with the following variables:

```env
# Application Configuration
APP_NAME=Safety Riding API
APP_ENV=development
PORT=8080

# Database Configuration
DB_HOST=localhost
DB_PORT=5432
DB_USERNAME=postgres
DB_PASS=your_password
DB_NAME=safety_riding
DB_SSLMODE=disable
# Alternative: Use DATABASE_URL instead of individual DB_* variables
# DATABASE_URL=postgres://username:password@localhost:5432/safety_riding?sslmode=disable

# JWT Configuration
JWT_KEY=your-super-secret-jwt-key-change-this-in-production
JWT_EXP=24

# MinIO Configuration (for file/image uploads)
MINIO_ENDPOINT=localhost:9000
MINIO_ACCESS_KEY=minioadmin
MINIO_SECRET_KEY=minioadmin
MINIO_BUCKET_NAME=safety-riding
MINIO_USE_SSL=false
MINIO_BASE_URL=http://localhost:9000

# Database Migration Configuration
PATH_MIGRATE=file://migrations

# Cache Configuration
TTL_CACHE_CONFIG_APP=86400

# Location Data Configuration
PROVINCE_YEAR=2025

# Application Config ID (Optional)
CONFIG_ID=

# Redis Configuration (for session management)
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=
REDIS_DB=0
```

### Environment Variables Explanation

| Variable | Description | Default | Required |
|----------|-------------|---------|----------|
| `APP_NAME` | Application name | Safety Riding API | No |
| `APP_ENV` | Environment mode | development | No |
| `PORT` | Server port | 8080 | No |
| `DB_HOST` | PostgreSQL host | localhost | Yes |
| `DB_PORT` | PostgreSQL port | 5432 | Yes |
| `DB_USERNAME` | Database username | postgres | Yes |
| `DB_PASS` | Database password | - | Yes |
| `DB_NAME` | Database name | safety_riding | Yes |
| `DB_SSLMODE` | SSL mode | disable | No |
| `DATABASE_URL` | Alternative connection string | - | No* |
| `JWT_KEY` | Secret key for JWT signing | - | Yes |
| `JWT_EXP` | JWT expiration in hours | 24 | No |
| `MINIO_ENDPOINT` | MinIO server endpoint | localhost:9000 | Yes** |
| `MINIO_ACCESS_KEY` | MinIO access key | minioadmin | Yes** |
| `MINIO_SECRET_KEY` | MinIO secret key | minioadmin | Yes** |
| `MINIO_BUCKET_NAME` | MinIO bucket name | safety-riding | Yes** |
| `MINIO_USE_SSL` | Use SSL for MinIO | false | No |
| `MINIO_BASE_URL` | Base URL for file access | http://localhost:9000 | Yes** |
| `PATH_MIGRATE` | Migration files path | file://migrations | No |
| `TTL_CACHE_CONFIG_APP` | Cache TTL in seconds | 86400 | No |
| `PROVINCE_YEAR` | Province data year | 2025 | No |
| `CONFIG_ID` | Application config ID | - | No |
| `REDIS_HOST` | Redis server host | localhost | Yes*** |
| `REDIS_PORT` | Redis server port | 6379 | Yes*** |
| `REDIS_PASSWORD` | Redis password | - | No |
| `REDIS_DB` | Redis database number | 0 | No |

\* Use either `DATABASE_URL` OR individual `DB_*` variables, not both.

\** Required only if using file upload features.

\*** Required for session management. Sessions will not work without Redis.

### Frontend Configuration

Edit `frontend/src/config.js` or create `.env` in frontend directory:

```env
VITE_API_BASE_URL=http://localhost:8080/api
VITE_APP_NAME=Safety Riding System
```

### Runtime Configurations

Some settings are stored in the `app_configs` table and can be updated from the `Configurations` module without restarting the backend.

Relevant keys for the submitted forms flow:

| Config Key | Purpose |
|-----------|---------|
| `approval_records.sheet_url` | Google Sheets URL for approval rows |
| `approval_records.submitted_forms_sheet_url` | Google Sheets URL for submitted form rows |

---

## 📚 API Documentation

The API is fully documented using Swagger/OpenAPI. Once the backend is running, access the interactive documentation at:

**http://localhost:8080/swagger/index.html**

### Main API Endpoints

#### Authentication
```
POST   /api/user/register          Register new user
POST   /api/user/login             Login user
POST   /api/user/logout            Logout user
PUT    /api/user/change/password   Change password
```

#### Schools
```
GET    /api/schools                List all schools
POST   /api/school                 Create school
GET    /api/school/:id             Get school by ID
PUT    /api/school/:id             Update school
DELETE /api/school/:id             Delete school
```

#### Events
```
GET    /api/events                 List all events
POST   /api/event                  Create event
GET    /api/event/:id              Get event by ID
PUT    /api/event/:id              Update event
DELETE /api/event/:id              Delete event
POST   /api/event/:id/photos       Upload event photos
DELETE /api/event/photo/:id        Delete event photo
```

#### Budgets
```
GET    /api/budgets                List all budgets
POST   /api/budget                 Create budget
GET    /api/budget/:id             Get budget by ID
PUT    /api/budget/:id             Update budget
DELETE /api/budget/:id             Delete budget
```

#### Market Share
```
GET    /api/marketshares           List all market shares
POST   /api/marketshare            Create market share
GET    /api/marketshare/:id        Get market share by ID
PUT    /api/marketshare/:id        Update market share
DELETE /api/marketshare/:id        Delete market share
```

#### Submitted Forms
```
GET    /api/approval-records        List submitted forms
GET    /api/approval-records/config Get sync source configuration
GET    /api/approval-records/:id    Get submitted form detail
POST   /api/approval-records/sync   Sync submitted forms and approval rows from Google Sheets
```

#### Configurations
```
GET    /api/configs                 List application configurations
PUT    /api/config/:id              Update configuration value or active status
```

#### Locations
```
GET    /api/locations/provinces    Get all provinces
GET    /api/locations/cities/:id   Get cities by province
GET    /api/locations/districts/:prov/:city  Get districts
```

---

## 📁 Project Structure

```
safety-riding/
├── cmd/                          # Application entry points
│   └── api/
├── config/                       # Configuration files
├── internal/                     # Private application code
│   ├── domain/                   # Domain models (entities)
│   │   ├── user/
│   │   ├── event/
│   │   ├── school/
│   │   ├── budget/
│   │   ├── marketshare/
│   │   ├── approvalrecord/
│   │   ├── appconfig/
│   │   └── submittedform/
│   ├── dto/                      # Data Transfer Objects
│   ├── handlers/                 # HTTP handlers (controllers)
│   ├── repositories/             # Data access layer
│   └── services/                 # Business logic
├── middlewares/                  # HTTP middlewares
│   ├── auth.go
│   ├── cors.go
│   └── logger.go
├── migrations/                   # Database migrations
│   ├── 000001_create_users_table.up.sql
│   ├── 000001_create_users_table.down.sql
│   └── ...
├── pkg/                          # Public packages
│   └── utils/
├── frontend/                     # React frontend
│   ├── public/
│   ├── src/
│   │   ├── components/           # Reusable components
│   │   │   ├── common/
│   │   │   └── maps/
│   │   ├── contexts/             # React contexts
│   │   ├── pages/                # Page components
│   │   │   ├── auth/
│   │   │   ├── events/
│   │   │   ├── schools/
│   │   │   ├── budgets/
│   │   │   ├── marketshare/
│   │   │   ├── approvalrecords/
│   │   │   ├── configs/
│   │   │   └── users/
│   │   ├── services/             # API services
│   │   ├── styles/               # CSS files
│   │   ├── App.jsx
│   │   └── main.jsx
│   ├── package.json
│   └── vite.config.js
├── .env                          # Environment variables
├── .gitignore
├── docker-compose.yml
├── Dockerfile
├── go.mod
├── go.sum
├── main.go                       # Application entry point
└── README.md
```

---

## 🧪 Testing

### Backend Tests

```bash
# Run all tests
go test ./...

# Run tests with coverage
go test -cover ./...

# Run specific package tests
go test ./internal/services/user/...
```

### Frontend Tests

```bash
cd frontend

# Run tests
npm test

# Run tests with coverage
npm run test:coverage
```

---

## 🚀 Deployment

### Production Build

#### Backend
```bash
# Build binary
go build -o safety-riding main.go

# Run binary
./safety-riding
```

#### Frontend
```bash
cd frontend

# Build for production
npm run build

# Output will be in frontend/dist/
```

### Docker Deployment

```bash
# Build production image
docker build -t safety-riding:latest .

# Run container
docker run -p 8080:8080 --env-file .env safety-riding:latest
```

---

## 🤝 Contributing

We welcome contributions! Please follow these steps:

1. **Fork the repository**
2. **Create a feature branch**
   ```bash
   git checkout -b feature/amazing-feature
   ```
3. **Commit your changes**
   ```bash
   git commit -m 'Add some amazing feature'
   ```
4. **Push to the branch**
   ```bash
   git push origin feature/amazing-feature
   ```
5. **Open a Pull Request**

### Coding Standards

- **Go**: Follow [Effective Go](https://go.dev/doc/effective_go) guidelines
- **React**: Use functional components with hooks
- **Commit Messages**: Use [Conventional Commits](https://www.conventionalcommits.org/)
- **Code Style**: Run linters before committing
  ```bash
  # Go
  go fmt ./...
  go vet ./...

  # React
  npm run lint
  ```

---

## 🐛 Bug Reports & Feature Requests

Found a bug or have a feature request? Please create an issue on GitHub:

[Create Issue](https://github.com/zazhedho/safety-riding/issues/new)

---

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## 👨‍💻 Authors & Contributors

- **Initial Development** - [zazhedho](https://github.com/zazhedho)

See also the list of [contributors](https://github.com/zazhedho/safety-riding/contributors) who participated in this project.

---

## 📞 Support

Need help? Reach out to us:

- 📧 Email: support@safetyriding.com
- 💬 Discord: [Join our community](https://discord.gg/safetyriding)
- 📖 Documentation: [Wiki](https://github.com/zazhedho/safety-riding/wiki)

---

## 🙏 Acknowledgments

- [Gin Web Framework](https://gin-gonic.com/)
- [React](https://react.dev/)
- [Bootstrap](https://getbootstrap.com/)
- [Leaflet](https://leafletjs.com/)
- [GORM](https://gorm.io/)
- All open-source contributors

---

<div align="center">

**⭐ Star this repository if you find it helpful! ⭐**

Made with ❤️ by the Safety Riding Team

</div>
