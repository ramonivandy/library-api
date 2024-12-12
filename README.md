# Library API

A RESTful API built with Node.js and Express.js.

---

## Prerequisites

Ensure the following are installed before running the application:

- **Node.js** (v14 or higher)
- **PostgreSQL**
- **npm** (Node Package Manager)

---

## Installation

1. **Clone the Repository**
   ```bash
   git clone <repository-url>
   cd library-api
   ```

2. **Install Dependencies**
   ```bash
   npm install
   ```

---

## Environment Setup

1. **Create a `.env` File** in the root directory based on **`env.example` File**.
2. **Add the following environment variables:**

   **Server Configuration:**
   ```env
   PORT=3001 (recommended)
   ```

   **Database Configuration:**
   ```env
   DB_HOST=localhost
   DB_PORT=5432
   DB_NAME=your_database_name
   DB_USER=your_database_user
   DB_PASSWORD=your_database_password
   ```

---

## Database Setup

1. **Create a PostgreSQL Database**
2. **Run DDL Script:**
   - Navigate to the `databases` folder.
   - Execute the `DDL.sql` file to create the required tables.

---

## Running the Application

To run the application in development mode with hot-reload:

```bash
npm run dev
```

The API will be available at:

- `http://localhost:3001`

---

## Project Dependencies

### Main Dependencies

- **Express.js** - Web framework
- **pg** - PostgreSQL client
- **joi** - Data validation
- **cors** - Cross-Origin Resource Sharing

### Development Dependencies

- **nodemon** - Development server with hot-reload

---

## Error Handling

The API uses standard HTTP response codes:

- **200:** Success
- **400:** Bad Request
- **404:** Not Found
- **500:** Internal Server Error