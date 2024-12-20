const express = require("express");
const cors = require("cors");
const app = express();
const config = require("./src/helper/global_config");
const port = config.get("/port") || 3001;
const { connectDatabase } = require("./src/helper/database/index");
const masterBukuRoutes = require("./src/routes/masterBukuRoutes");
const masterMahasiswaRoutes = require("./src/routes/masterMahasiswaRoutes");
const transaksiRoutes = require("./src/routes/transaksiRoutes");
const historyRoutes = require("./src/routes/historyRoutes");

app.use(cors());

app.get("/", (req, res) => {
  return res.status(200).json({
    message: "This server is running properly",
  });
});

// Database connection pool
connectDatabase();

// application/json parser
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use("/api", masterBukuRoutes);
app.use("/api", masterMahasiswaRoutes);
app.use("/api", transaksiRoutes);
app.use("/api", historyRoutes);

app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});
