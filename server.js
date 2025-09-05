const express = require("express");
const path = require("path");
const jsonServer = require("json-server");

const app = express();
const PORT = process.env.PORT || 8080;

// Serve Angular dist
app.use(express.static(path.join(__dirname, "dist/employee-portal")));

// Setup json-server
const router = jsonServer.router("db.json");
const middlewares = jsonServer.defaults();
app.use("/api", middlewares, router);

// Fallback to Angular index.html (SPA routing)
app.get("/*", (req, res) => {
  res.sendFile(path.join(__dirname, "dist/employee-portal/index.html"));
});

app.listen(PORT, () => {
  console.log(`✅ Server running on port ${PORT}`);
});
