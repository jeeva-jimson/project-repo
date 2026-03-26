const form = document.getElementById("contactForm");
const msg = document.getElementById("msg");


const API_URL = "https://project-repo-32mr.onrender.com/submit";


form.addEventListener("submit", async (e) => {
  e.preventDefault();

 
  const name = document.getElementById("name").value.trim();
  const email = document.getElementById("email").value.trim();
  const message = document.getElementById("message").value.trim();

  
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

  
    msg.innerText = text;

   
    form.reset();

  } catch (error) {
    console.error(error);
    msg.innerText = "Server error. Try again later.";
  }
});