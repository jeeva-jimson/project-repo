const express = require("express");
const cors = require("cors");
const fs = require("fs");

const app = express();

app.use(cors());
app.use(express.json());


app.get("/", (req, res) => {
  res.send("Backend is running!");
});

app.get("/health", (req, res) => {
  res.json({ status: "Backend is running!" });
});

app.post("/submit", (req, res) => {
  const { name, email, message } = req.body;

 
  if (!name || !email || !message) {
    return res.status(400).send("All fields are required");
  }

  console.log("Received:", { name, email, message });

  const logMessage = `${new Date().toISOString()} | ${name} | ${email} | ${message}\n`;

  
  fs.appendFile("messages.txt", logMessage, (err) => {
    if (err) {
      console.error("FILE WRITE ERROR:", err);

     
      return res.send("Message received (temporary storage issue)");
    }

    res.send("Message received successfully!");
  });
});


const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});