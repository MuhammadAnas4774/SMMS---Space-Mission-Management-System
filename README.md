# Space Mission Management System (SMMS) 🚀

Welcome to the Space Mission Management System (SMMS)! This is a comprehensive, full-stack application designed to manage complex space exploration operations. It provides a robust interface to track astronauts, spacecraft, missions, and telemetry data, alongside a powerful relational database backend.

## 🌟 Key Features

* **Mission Control & Dashboard:** Real-time overview of active space missions and ground operations.
* **Personnel Management:** Track astronauts, ground control staff, and their specific roles and assignments.
* **Spacecraft Tracking:** Manage modules, spacecraft conditions, and system telemetry.
* **Experiment Logging:** Record scientific experiments conducted during missions, including success ratings and automated validations.
* **Role-Based Access:** Distinguishes between Admin users and standard staff for secure access control.
* **Advanced Database Mechanics:** Utilizes SQL Views for complex reporting, Triggers for automated validation, and comprehensive Constraints to maintain data integrity.

## 💻 Tech Stack

* **Frontend:** React, Vite, CSS (Responsive UI with dynamic elements).
* **Backend:** Node.js, Express.js.
* **Database:** SQL (Structured Query Language) utilizing advanced schema designs.

## 📂 Project Structure

```text
├── backend/
│   ├── src/        # Node.js/Express server code
│   └── sql/        # Database initialization scripts
│       ├── 01_complete_setup.sql      # Helper script for complete DB setup
│       ├── schema.sql                 # Core tables and relationships
│       ├── seed.sql                   # Dummy data for testing
│       └── 04_auth_views_triggers.sql # Authentication, Views, and Triggers
├── frontend/
│   ├── src/        # React components, pages, context, and layouts
│   └── vite.config.js
├── docs/           # Project documentation
└── README.md       # Project details
```

## 🛠️ Database Highlights

The SMMS database is highly optimized and secured using several advanced SQL concepts:
1. **Views (`vw_*`):** Pre-compiled complex queries. For example, `vw_mission_activity` combines data from missions, spacecraft, and astronauts into one easy-to-read summary, while `vw_active_users` tracks user logins.
2. **Triggers:** Automated background rules. For instance, an active trigger ensures that any scientific experiment's "Success Rating" is strictly logged between 0 and 100.
3. **Constraints:** Enforces strict data integrity (Primary Keys, Foreign Keys, `NOT NULL`, and `CHECK` conditions like enforcing specific gender inputs or email formatting).

## 🚀 Getting Started

### Prerequisites
* Node.js installed on your local machine.
* A compatible SQL Database Server (e.g., MySQL, PostgreSQL, depending on configuration).

### 1. Database Setup
Navigate to the `backend/sql` directory and run the setup scripts in your SQL client in the following order (or use the complete setup script):
1. `schema.sql`
2. `04_auth_views_triggers.sql`
3. `seed.sql`

### 2. Backend Setup
1. Open a terminal in the `backend/` folder.
2. Install dependencies: `npm install`
3. Start the server: `npm start` (or `npm run dev`)

### 3. Frontend Setup
1. Open a terminal in the `frontend/` folder.
2. Install dependencies: `npm install`
3. Start the development server: `npm run dev`
4. The application will be accessible via your local browser (typically `http://localhost:5173`).

---
**Author:** Muhammad Anas (@MuhammadAnas4774)
**Contact:** miananns567@gmail.com
