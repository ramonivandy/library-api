const { Pool } = require("pg");

const pool = new Pool({
  user: process.env.PGUSER || root,
  password: process.env.PGPASSWORD || "",
  host: process.env.PGHOST || "localhost",
  port: process.env.PGPORT || 5432,
  database: process.env.PGDATABASE || "db",
});

const connectDatabase = async () => {
  try {
    const client = await pool.connect(); // Attempt to connect
    console.log("Database connection established successfully!");
    client.release(); // Release the client back to the pool
  } catch (error) {
    console.error("Error connecting to the database:", error.message);
  }
};

const query = (text, params, callback) => {
  return pool.query(text, params, callback);
};

module.exports = {
  connectDatabase,
  query,
};
