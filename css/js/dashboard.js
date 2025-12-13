/************************************
 * Dashboard – MedShare (Production)
 * Functionality unchanged
 ************************************/

const API_BASE_URL = "https://medshare-b5zb.onrender.com";
const AUTH_API = `${API_BASE_URL}/api/auth`;
const MEDICINE_API = `${API_BASE_URL}/api/medicines`;
const REQUEST_API = `${API_BASE_URL}/api/requests`;
const ADMIN_API = `${API_BASE_URL}/api/admin`;

let currentUser = null;

/* ================================
   COMMON HELPERS
================================ */
function redirectToLogin() {
  window.location.href = "login.html";
}

function getToken() {
  return localStorage.getItem("token");
}

function handleUnauthorized() {
  localStorage.clear();
  redirectToLogin();
}

/* ================================
   LOAD DASHBOARD
================================ */
async function loadDashboard() {
  const token = getToken();
  if (!token) return redirectToLogin();

  try {
    const res = await fetch(`${AUTH_API}/me`, {
      headers: { Authorization: `Bearer ${token}` }
    });

    if (!res.ok) return handleUnauthorized();

    const user = await res.json();
    currentUser = user;

    document.getElementById("welcome").textContent = `Welcome, ${user.name}`;
    document.getElementById("roleText").textContent = `You are logged in as ${user.role}.`;

    showRoleDashboard(user.role);

    const logout = document.getElementById("logoutLink");
    if (logout) {
      logout.addEventListener("click", () => {
        localStorage.clear();
        redirectToLogin();
      });
    }
  } catch (e) {
    console.error("Dashboard load error:", e);
    redirectToLogin();
  }
}

/* ================================
   SEARCH / FILTER WIRING
================================ */
document.addEventListener("DOMContentLoaded", () => {
  const nameInput = document.getElementById("filterName");
  const catInput = document.getElementById("filterCategory");
  const expInput = document.getElementById("filterExpiry");
  const searchBtn = document.getElementById("filterSearchBtn");

  const triggerSearch = () => {
    if (currentUser && currentUser.role === "RECIPIENT") {
      loadRecipientDashboard();
    }
  };

  if (nameInput) nameInput.addEventListener("input", debounce(triggerSearch, 300));
  if (catInput) catInput.addEventListener("change", triggerSearch);
  if (expInput) expInput.addEventListener("change", triggerSearch);
  if (searchBtn) searchBtn.addEventListener("click", triggerSearch);
});

function debounce(fn, wait) {
  let t;
  return (...args) => {
    clearTimeout(t);
    t = setTimeout(() => fn.apply(null, args), wait);
  };
}

/* ================================
   ROLE BASED DASHBOARD
================================ */
function showRoleDashboard(role) {
  document.getElementById("donorDashboard").style.display = "none";
  document.getElementById("recipientDashboard").style.display = "none";
  document.getElementById("adminDashboard").style.display = "none";

  if (role === "DONOR") {
    document.getElementById("donorDashboard").style.display = "block";
    loadDonorDashboard();
  } else if (role === "RECIPIENT") {
    document.getElementById("recipientDashboard").style.display = "block";
    loadRecipientDashboard();
  } else if (role === "ADMIN") {
    document.getElementById("adminDashboard").style.display = "block";
    loadAdminDashboard();
  }
}

/* ================================
   DONOR DASHBOARD
================================ */
async function loadDonorDashboard() {
  try {
    const res = await fetch(`${MEDICINE_API}/donor/medicines`, {
      headers: { Authorization: `Bearer ${getToken()}` }
    });

    if (!res.ok) return handleUnauthorized();

    const medicines = await res.json();
    displayDonorMedicines(medicines);
  } catch (e) {
    console.error("Error loading donor medicines:", e);
    document.getElementById("donorMedicines").innerHTML =
      '<div class="empty-state">Error loading medicines</div>';
  }
}

/* ================================
   RECIPIENT DASHBOARD
================================ */
async function loadRecipientDashboard() {
  try {
    const token = getToken();

    const name = document.getElementById("filterName")?.value || "";
    const category = document.getElementById("filterCategory")?.value || "";
    const expiryBefore = document.getElementById("filterExpiry")?.value || "";

    const params = new URLSearchParams();
    if (name) params.append("name", name);
    if (category) params.append("category", category);
    if (expiryBefore) params.append("expiryBefore", expiryBefore);

    const medicinesRes = await fetch(
      `${MEDICINE_API}${params.toString() ? `?${params}` : ""}`,
      { headers: { Authorization: `Bearer ${token}` } }
    );

    if (!medicinesRes.ok) return handleUnauthorized();

    const medicines = await medicinesRes.json();
    displayAvailableMedicines(medicines);

    const reqRes = await fetch(`${REQUEST_API}/my`, {
      headers: { Authorization: `Bearer ${token}` }
    });

    if (!reqRes.ok) return handleUnauthorized();

    const requests = await reqRes.json();
    displayMyRequests(requests);
  } catch (e) {
    console.error("Error loading recipient dashboard:", e);
  }
}

/* ================================
   REQUEST MEDICINE
================================ */
async function requestMedicine(medicineId) {
  try {
    const res = await fetch(`${REQUEST_API}/${medicineId}`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${getToken()}`,
        "Content-Type": "application/json"
      }
    });

    const data = await res.json();
    if (!res.ok) return alert(data.message || "Request failed");

    alert("Medicine request submitted successfully!");
    loadRecipientDashboard();
  } catch (e) {
    console.error("Request error:", e);
  }
}

/* ================================
   ADMIN DASHBOARD
================================ */
async function loadAdminDashboard() {
  try {
    const token = getToken();
    if (!token) return redirectToLogin();
    await loadAdminOverview(token);
    showAdminTab("overview");
  } catch (e) {
    console.error("Admin dashboard error:", e);
  }
}

/* ================================
   INIT
================================ */
document.addEventListener("DOMContentLoaded", loadDashboard);
