# Vehicle Rental Management Backend API

A robust RESTful API built with **Node.js**, **TypeScript**, **Express**, **Knex.js**, and **PostgreSQL** (or MySQL) for managing staff authentication, vehicle fleet inventory, customer rentals with date overlap validation, and monthly revenue analytics reporting.

---

## 🌐 Live Deployment Links

- 🔗 **Live Production API**: [https://vehicle-rental-backend-tj9u.onrender.com](https://vehicle-rental-backend-tj9u.onrender.com)
- 📑 **Interactive Swagger API Documentation**: [https://vehicle-rental-backend-tj9u.onrender.com/api-docs](https://vehicle-rental-backend-tj9u.onrender.com/api-docs)

---

## 🚀 Key Features & Highlights

- **Object-Oriented Architecture**: Clean separation of concerns following `Controller -> Service -> Repository` layers with dependency injection.
- **Date Overlap Prevention**: Robust date range check `(StartA <= EndB AND EndA >= StartB)` ensuring no vehicle can be booked twice for overlapping dates.
- **Atomic Transactions**: Concurrency control wrapping availability checks and rental insertions inside database transactions (`trx`).
- **Boundary-Aware Monthly Reports**: `GET /reports/rentals?month=YYYY-MM` calculates days rented and revenue contributed strictly within the target month (e.g., a July 29 – Aug 3 rental contributes exactly 3 days to August).
- **Security & Rate Limiting**: Password hashing with `bcrypt`, JWT authentication middleware for protected routes, and rate-limiting on `/auth/login`.
- **Media Uploads**: Local photo storage for vehicles using `Multer` with automatic cleanup of old images upon replacement.
- **Soft Deletes**: Soft deletion of vehicle records preserving historical rental integrity.

---

## 🛠️ Technology Stack

- **Runtime & Language**: Node.js & TypeScript
- **Web Framework**: Express.js
- **Query Builder**: Knex.js
- **Database Engine**: PostgreSQL (preferred) / MySQL
- **Validation**: Joi
- **Auth & Security**: JSON Web Tokens (`jsonwebtoken`), `bcrypt`, `express-rate-limit`
- **File Uploads**: Multer
- **Code Quality**: ESLint & Prettier
- **Documentation**: Swagger UI (`/api-docs`)

---

## ⚙️ Environment & Prerequisites

### 1. Prerequisites
- Node.js (v18+ recommended)
- PostgreSQL or MySQL server running locally or via Docker

### 2. Environment Variables Setup
Copy the `.env.example` file to create your `.env` file:

```bash
cp .env.example .env
```

Configure your `.env` variables:

```env
PORT=5000
NODE_ENV=development

# Database Settings
DB_HOST=127.0.0.1
DB_PORT=5432
DB_USER=postgres
DB_PASSWORD=postgres
DB_NAME=vehicle_rental_db

# Security & Uploads
JWT_SECRET=super_secret_jwt_key_vehicle_rental_2026
JWT_EXPIRES_IN=1d
UPLOAD_PATH=uploads
```

---

## 🗄️ Database Setup & Seeding

Run Knex database migrations to create the required tables (`staff`, `vehicles`, `rentals`):

```bash
# Run database migrations
npm run migrate:latest

# Run seeds (Seeds default admin staff and month-spanning test rentals)
npm run seed:run
```

> **Default Admin Credentials (Seeded)**:
> - **Email**: `admin@vehiclerental.com`
> - **Password**: `admin123`

---

## 🏃 Running the Application

### Option A: Local Node.js Development
```bash
# Development mode with hot-reload
npm run dev

# Build TypeScript to JavaScript
npm run build

# Start production server
npm start
```

### Option B: Docker Compose (Recommended)
Run the complete application stack (Node.js API + PostgreSQL Database) in an isolated containerized environment without installing PostgreSQL locally:

```bash
# Build and launch Node.js API & PostgreSQL database
docker-compose up -d --build

# Run Knex database migrations inside Docker
docker-compose exec app npm run migrate:latest

# Run database seeds inside Docker
docker-compose exec app npm run seed:run

# Stop containers
docker-compose down
```

API interactive documentation is accessible at:  
👉 **Live Server**: [https://vehicle-rental-backend-tj9u.onrender.com/api-docs](https://vehicle-rental-backend-tj9u.onrender.com/api-docs)  
👉 **Local Development**: `http://localhost:5000/api-docs`

---

## 📑 API Endpoints Summary

### 🔐 Auth
| Method | Endpoint | Description | Auth Required |
| :--- | :--- | :--- | :---: |
| `POST` | `/auth/login` | Staff login with email & password (Rate limited: 5 attempts / 15m) | ❌ |

### 🚗 Vehicles
| Method | Endpoint | Description | Auth Required |
| :--- | :--- | :--- | :---: |
| `GET` | `/vehicles` | List vehicles (Query: `page`, `limit`, `category`, `search`) | 🔒 |
| `GET` | `/vehicles/:id` | Get vehicle details by ID | 🔒 |
| `POST` | `/vehicles` | Create new vehicle (Multipart form with `photo`) | 🔒 |
| `PUT` | `/vehicles/:id` | Update vehicle details or photo | 🔒 |
| `DELETE` | `/vehicles/:id` | Soft delete vehicle (`deleted_at`) | 🔒 |

### 🔑 Rentals
| Method | Endpoint | Description | Auth Required |
| :--- | :--- | :--- | :---: |
| `GET` | `/rentals` | List rentals (Query: `vehicle_id`, `status`, `start_date`, `end_date`) | 🔒 |
| `GET` | `/rentals/:id` | Get rental details by ID | 🔒 |
| `POST` | `/rentals` | Create booking (Calculates `total_amount`, checks date overlap, atomic `trx`) | 🔒 |
| `PUT` | `/rentals/:id` | Update booking (Re-triggers date overlap check on date change) | 🔒 |
| `DELETE` | `/rentals/:id` | Delete booking record | 🔒 |

### 📊 Reports
| Method | Endpoint | Description | Auth Required |
| :--- | :--- | :--- | :---: |
| `GET` | `/reports/rentals?month=YYYY-MM` | Monthly rental activity per vehicle & highest revenue vehicle (Optional `&vehicle_id=`) | 🔒 |

---

## 🔍 Technical Deep Dive & Review Guide

### 1. Date Overlap Validation Algorithm
Two date ranges **A** (`StartA` to `EndA`) and **B** (`StartB` to `EndB`) conflict if and only if:
$$\text{StartA} \le \text{EndB} \quad \text{AND} \quad \text{EndA} \ge \text{StartB}$$

In application code (`RentalRepository.ts`), active rentals (`status != 'cancelled'`) are checked:

```typescript
const isOverlapping = await knex('rentals')
  .where({ vehicle_id: vehicleId })
  .whereNot('status', 'cancelled')
  .where('start_date', '<=', requestedEndDate)
  .where('end_date', '>=', requestedStartDate)
  .first();
```

- **Concurrency Safety**: The overlap check and insertion are executed inside an explicit database transaction (`knex.transaction`), preventing two simultaneous booking requests for the same vehicle from succeeding concurrently.

### 2. Monthly Revenue & Rental Activity Calculation
When generating reports for a target month (e.g., `2026-08`), rentals extending across month boundaries (e.g., `2026-07-29` to `2026-08-03`) are clamped to the month's boundary dates:

1. **Clamped Start Date**: $\max(\text{Rental Start Date}, \text{Month Start Date})$
2. **Clamped End Date**: $\min(\text{Rental End Date}, \text{Month End Date})$
3. **Days Counted**: $(\text{Clamped End Date} - \text{Clamped Start Date}) + 1$
4. **Proportional Revenue**: $\text{Days Counted} \times \text{Daily Rate}$

This guarantees that a rental running July 29–Aug 3 contributes exactly 3 days (Aug 1, Aug 2, Aug 3) to the August report.

---

## 🧪 Testing & Code Quality

```bash
# Run tests
npm test

# Run ESLint check
npx eslint src/

# Format code with Prettier
npx prettier --write "src/**/*.ts"
```
