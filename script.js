const form = document.getElementById("contactForm");
const msg = document.getElementById("msg");

// 🔁 Change this to your backend URL
const API_URL = "http://localhost:5000/submit";
// Example for Render:
// const API_URL = "https://your-app.onrender.com/submit";

form.addEventListener("submit", async (e) => {
  e.preventDefault();

  // Get values
  const name = document.getElementById("name").value.trim();
  const email = document.getElementById("email").value.trim();
  const message = document.getElementById("message").value.trim();

  // Basic validation
  if (!name || !email || !message) {
    msg.innerText = "Please fill all fields!";
    return;
  }

  try {
    const response = await fetch(API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ name, email, message })
    });

    const text = await response.text();

    // Show backend response
    msg.innerText = text;

    // Clear form
    form.reset();

  } catch (error) {
    console.error(error);
    msg.innerText = "Server error. Try again later.";
  }
});