const API_BASE_URL = "https://medshare-b5zb.onrender.com";
const AUTH_API = `${API_BASE_URL}/api/auth`;

// Handle Register
const registerForm = document.getElementById("registerForm");
if (registerForm) {
  registerForm.addEventListener("submit", async (e) => {
    e.preventDefault();

    const name = document.getElementById("name").value;
    const email = document.getElementById("email").value;
    const password = document.getElementById("password").value;
    const role = document.getElementById("role").value;

    const res = await fetch(`${AUTH_API}/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, email, password, role })
    });

    const data = await res.json();
    if (!res.ok) {
      alert(data.message || "Registration failed");
      return;
    }

    alert("Registration successful!");
    window.location.href = "login.html";
  });
}

// Handle Login
const loginForm = document.getElementById("loginForm");
if (loginForm) {
  loginForm.addEventListener("submit", async (e) => {
    e.preventDefault();

    const email = document.getElementById("loginEmail").value;
    const password = document.getElementById("loginPassword").value;

    const res = await fetch(`${AUTH_API}/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password })
    });

    const data = await res.json();
    if (!res.ok) {
      alert(data.message || "Login failed");
      return;
    }

    localStorage.setItem("token", data.token);
    localStorage.setItem("user", JSON.stringify(data.user));

    alert("Login successful!");

    const role = (data.user?.role || "").toUpperCase();
    if (role === "DONOR") window.location.href = "donor-dashboard.html";
    else if (role === "RECIPIENT") window.location.href = "recipient-dashboard.html";
    else if (role === "ADMIN") window.location.href = "admin.html";
    else window.location.href = "index.html";
  });
}

// Handle Who Am I
const whoAmIButton = document.getElementById("whoAmI");
if (whoAmIButton) {
  whoAmIButton.addEventListener("click", async () => {
    const token = localStorage.getItem("token");
    if (!token) {
      alert("Not logged in");
      return;
    }

    try {
      const res = await fetch(`${AUTH_API}/me`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      const data = await res.json();
      if (!res.ok) {
        alert(data.message || "Failed to fetch user");
        return;
      }

      alert(`You are ${data.name} (${data.email}) [${data.role}]`);
    } catch (e) {
      alert("Network error");
    }
  });
}
