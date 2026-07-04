




# Nexus HRMS — Premium Employee & Payroll Ledger Portal
A premium, modern Human Resource Management System (HRMS) styled with a clean emerald/teal green layout. Built with React (Vite) and Express (Node.js) backed by a MySQL database with a seamless JSON mock fallback engine.
---
## 🚀 Key Features
### 1. Modern Light Theme Redesign
* **Branding & Visuals**: Styled with a clean, high-contrast light theme featuring custom emerald/teal green primary accents (`#1e8569`), light grey background surfaces (`#f4f7f6`), and crisp white card wrappers.
* **Separated Navigation Links**: Distinct routes for `/dashboard` (Overview Dashboard) and `/payroll` (Payroll Ledger) ensure sidebar active states highlight independently.
* **Header Notification Indicator**: A glowing red badge displays the count of pending registration and leave requests. It dynamically redirects the Admin to the appropriate approvals screen when clicked.
### 2. Time Tracking & Durational Filters
* **Clock Console**: Clean text contrast on check-in/out console stamps.
* **Attendance Ledger**: Displays name, date, clock-in, clock-out, and total working hours.
* **Shift Duration Filter**: Dropdown menu to filter logs dynamically by:
  - *Full Day (>= 8 hrs)*
  - *Half Day (4 - 8 hrs)*
  - *Short Hours (< 4 hrs)*
  - *Active Shift (In Progress)*
### 3. Alphanumeric Employee IDs & Dual Authentication
* **Primary Key ID Generation**: Auto-generates unique string identifiers based on company acronym + initials + join year + serial padding (e.g. `OIJAFO20260003`). Sets `emp_id` as the primary key of the `users` database table.
* **Dual Login Options**: Allows employees and administrators to sign in using either their registered **Email Address** OR their generated **Employee ID**.
### 4. Interactive Approvals & Summary Lists
* **Interactive Leave Approvals**: Lists all pending leave applications on the main Overview Dashboard with quick Approve/Reject buttons.
* **Summary Activity Grids**: Renders three data list boards at the bottom of the Employee Directory screen:
  * **Working Anniversary**: Auto-calculates active years based on joining dates.
  * **Upcoming Birthdays**: Lists birthdays and countdowns.
  * **Top Performers**: Dynamically ranks staff by performance rating.
### 5. Secure Employee Termination
* **Fire Console**: Secure deactivation panel in Settings. Purges all profile records, attendance logs, and bank details in a CASCADE delete upon verifying Admin credentials.
### 6. Database Connection JSON Fallback Engine
* **Mock Fallback Mode**: If connection to the MySQL database fails on startup, the backend automatically drops into Mock Fallback mode.
* **No-Crash Operation**: Queries (SELECT/INSERT/UPDATE) are intercepted by a proxy in `db.js` and resolved directly against [mockData.json](hrms-backend/database/mockData.json) to keep the app online.
* **Credential Bypass**: Skips bcrypt verification when in fallback mode to allow immediate access to mock accounts.
---
## 🛠️ Technology Stack
* **Frontend**: React (Vite), Lucide Icons, Vanilla CSS
* **Backend**: Node.js, Express, JWT, Bcrypt, MySQL2 (Promise pool)
* **Fallback Storage**: Local JSON File Query Parser
---
## 📦 Project Setup & Execution
### 1. Database Configuration
1. Make sure your MySQL service is running.
2. In the `hrms-backend` folder, create a `.env` file with the following variables:
   ```env
   PORT=5000
   DB_HOST=localhost
   DB_USER=root
   DB_PASSWORD=yourpassword
   DB_NAME=hrms_db
   JWT_SECRET=supersecretkey
   JWT_EXPIRE=24h
   ```
3. The backend automatically imports `database/schema.sql` on first startup if database tables are not found.
### 2. Backend Server Execution
```bash
cd hrms-backend
npm install
node server.js
```
### 3. Frontend Execution
```bash
cd front_end
npm install
npm run dev
```
Open **`http://localhost:5173/`** in your browser.
---

## for login via sql database
## 🔐 Seeded Accounts for Testing
* **Admin / HR Account**:
  * **Email**: `admin@nexus.com`
  * **Password**: `admin123` (or any password in mock fallback mode)
* **Employee Account**:
  * **Email**: `rahul.s@nexushr.io` / **Employee ID**: `EMP001`
  * **Password**: `employeepassword` (or any password in mock fallback mode)


---
## 🔐 Seeded Accounts for Testing
* **Admin / HR Account**:
  * **Email**: `admin@nexus.com` / **Employee ID**: `OIERRO20250005`
  * **Password**: `admin123` (or any password in mock fallback mode)
* **Employee Account**:
  * **Email**: `rahul.s@nexushr.io` / **Employee ID**: `EMP001`
  * **Password**: `employeepassword` (or any password in mock fallback mode)






