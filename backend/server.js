const express = require("express");
const cors = require("cors");
const fs = require("fs");

const app = express();

app.use(cors());
app.use(express.json());

// Routes
app.get("/", (req, res) => {
  res.send("Backend is running!");
});

app.get("/health", (req, res) => {
  res.json({ status: "Backend is running!" });
});

app.post("/submit", (req, res) => {
  const { name, email, message } = req.body;

  // Validation
  if (!name || !email || !message) {
    return res.status(400).send("All fields are required");
  }

  console.log("Received:", { name, email, message });

  const logMessage = `${new Date().toISOString()} | ${name} | ${email} | ${message}\n`;

  //  SAFE FILE WRITE (no crash)
  fs.appendFile("messages.txt", logMessage, (err) => {
    if (err) {
      console.error("FILE WRITE ERROR:", err);

      //  Still respond success so frontend doesn't fail
      return res.send("Message received (temporary storage issue)");
    }

    res.send("Message received successfully!");
  });
});

// Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});