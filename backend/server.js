const express = require("express");
const cors = require("cors");
const fs = require("fs");
const path = require("path");

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// File path
const filePath = path.join(__dirname, "messages.txt");

// Ensure file exists (important for Render)
try {
  if (!fs.existsSync(filePath)) {
    fs.writeFileSync(filePath, "");
    console.log("messages.txt created");
  }
} catch (err) {
  console.error("Error creating file:", err);
}

// Routes
app.get("/", (req, res) => {
  res.send("Backend is running!");
});

app.get("/health", (req, res) => {
  res.json({ status: "Backend is running!" });
});

app.post("/submit", (req, res) => {
  try {
    const { name, email, message } = req.body;

    // Validate input
    if (!name || !email || !message) {
      return res.status(400).send("All fields are required");
    }

    console.log("Received:");
    console.log("Name:", name);
    console.log("Email:", email);
    console.log("Message:", message);

    const logMessage = `${new Date().toISOString()} | ${name} | ${email} | ${message}\n`;

    fs.appendFile(filePath, logMessage, (err) => {
      if (err) {
        console.error("Error saving message:", err);
        return res.status(500).send("Error saving message");
      }

      res.send("Message received successfully!");
    });

  } catch (err) {
    console.error("Unexpected error:", err);
    res.status(500).send("Server error");
  }
});

// Start server
const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});