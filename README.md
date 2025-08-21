Got it 🚀 — here’s the **fully updated README.md** file including **Option B (Docker Dev mode with nodemon/ts-node-dev inside container)** so teammates can run without installing Node locally.

---

```markdown
# Curvvtech Backend Developer Assignment

A backend platform for managing smart devices, logs, and usage analytics.  
Built with **Node.js (TypeScript)**, **Express**, **MongoDB**, and **Redis**, with JWT-based authentication.

---

## 🚀 Features

* User authentication (`/auth/signup`, `/auth/login`)
* Device management (`/devices`)
  * Register, list, update, delete
  * Heartbeat (track last active time)
* Logs (`/devices/:id/logs`)
  * Store device logs (e.g., energy units consumed)
  * Fetch last N logs
* Analytics (`/devices/:id/usage?range=24h`)
  * Aggregates units consumed in the last 24 hours
* Security
  * JWT auth
  * Role-based access (`user`, `admin`)
  * Helmet, CORS
* Rate limiting
  * 100 requests/minute per user (Redis-backed)
* Background job
  * Auto-deactivate devices idle for >24h
* Tests (Jest + Supertest)
* Dockerized setup (MongoDB, Redis, API)
* Postman collection included

---

## 📂 Project Structure

```

src/
config/         # DB, Redis setup
controllers/    # Route handlers
jobs/           # Cron jobs
middleware/     # Auth, rate-limit, error handling
models/         # Mongoose models
routes/         # Express routers
validations/    # Zod validation schemas
index.ts        # App bootstrap
tests/            # Jest + Supertest integration tests
Dockerfile
docker-compose.yml
README.md

````

---

## ⚙️ Setup

### 1. Clone & Install

```bash
git clone <repo-url>
cd curvvtech-backend
npm install
````

### 2. Environment

Copy `.env.example` → `.env` and edit if needed:

```ini
PORT=4000
MONGODB_URI=mongodb://localhost:27017/curvvtech
REDIS_URL=redis://localhost:6379
JWT_ACCESS_SECRET=super-access-secret
JWT_REFRESH_SECRET=super-refresh-secret
ACCESS_TTL_MIN=15
REFRESH_TTL_DAYS=7
NODE_ENV=development
```

---

## ▶️ Running the Project

### **Option A: Local Dev (preferred)**

Run Mongo & Redis in Docker, keep Node locally with hot reload:

```bash
# Start DBs only
docker compose up -d mongo redis

# Run API with hot reload
npm run dev
```

* API → [http://localhost:4000](http://localhost:4000)
* MongoDB → `localhost:27017`
* Redis → `localhost:6379`

---

### **Option B: Docker Dev Mode (no Node locally)**

Run everything inside Docker (with `ts-node-dev` hot reload):

```bash
# Start in dev profile
docker compose --profile dev up --build
```

This runs:

* `mongo` → database
* `redis` → cache
* `api-dev` → backend with hot reload

Code changes are mounted via volumes, so you still get instant reloads.

---

### **Production Mode**

Run API + Mongo + Redis inside Docker, no hot reload:

```bash
docker compose --profile prod up --build -d
```

API will be available at [http://localhost:4000](http://localhost:4000).

---

## 🧑‍💻 API Endpoints

### Auth

* `POST /auth/signup`
* `POST /auth/login`

### Devices

* `POST /devices`
* `GET /devices?type=&status=&page=&limit=`
* `PATCH /devices/:id`
* `DELETE /devices/:id`
* `POST /devices/:id/heartbeat`

### Logs & Analytics

* `POST /devices/:id/logs`
* `GET /devices/:id/logs?limit=10`
* `GET /devices/:id/usage?range=24h`

---

## 🧪 Testing

Run integration tests:

```bash
npm test
```

---

## 📦 Postman Collection

A ready-to-import Postman collection is provided:
👉 [Curvvtech.postman\_collection.json](./Curvvtech.postman_collection.json)

It includes:

* Auth requests (signup/login)
* Device CRUD
* Heartbeat
* Logs & Analytics

Auto-saves `{{token}}` and `{{deviceId}}` between requests.

---

## ⚡ Performance Benchmarks

We tested performance with **Autocannon**:

```bash
npx autocannon -c 1000 -d 20 \
  -H "Authorization: Bearer <accessToken>" \
  "http://localhost:4000/devices?status=active"
```

### Warm Cache Results (Redis)

![Warm Cache Benchmark](./3a3ef021-01d0-43c5-9da3-1f7424fb7533.png)

* **Latency (avg):** \~644 ms
* **Requests/sec (avg):** \~247
* **Total requests (20s):** \~7k

---

## 🔒 Notes

* Rate limit: max **100 req/min** per user (per IP for unauthenticated).
* Devices auto-deactivate if no heartbeat for >24h.
* Admins can access **all devices**; users can only access their own.

---

## 🛠️ Tech Stack

* **Node.js + Express** (API)
* **TypeScript**
* **MongoDB** (data persistence)
* **Redis** (caching + rate limiting)
* **Docker Compose** (multi-service orchestration)
* **Jest + Supertest** (testing)

```

---

👉 Do you want me to also add a **simple ASCII architecture diagram** (API ↔ Redis ↔ Mongo ↔ Clients) into the README so it looks more like a system design?
```
