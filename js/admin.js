const ADMIN_API = "/api/admin";

// Check if user is logged in and has ADMIN role
function checkAdminAuth() {
  const token = localStorage.getItem("token");
  if (!token) {
    alert("Please login first");
    window.location.href = "login.html";
    return false;
  }

  const user = JSON.parse(localStorage.getItem("user") || "{}");
  if (user.role !== "ADMIN") {
    alert("This page requires ADMIN role");
    window.location.href = "index.html";
    return false;
  }

  return true;
}

// Tab switching functionality
document.addEventListener("DOMContentLoaded", function () {
  const tabBtns = document.querySelectorAll(".tab-btn");
  const tabContents = document.querySelectorAll(".tab-content");

  tabBtns.forEach((btn) => {
    btn.addEventListener("click", () => {
      const targetTab = btn.dataset.tab;

      tabBtns.forEach((b) => b.classList.remove("active"));
      btn.classList.add("active");

      tabContents.forEach((content) => {
        content.classList.remove("active");
        if (content.id === `${targetTab}Tab`) {
          content.classList.add("active");
        }
      });

      if (targetTab === "medicines") loadAdminMedicines();
      else if (targetTab === "users") loadAdminUsers();
    });
  });

  if (checkAdminAuth()) {
    loadAdminMedicines();
  }
});

// Load medicines
async function loadAdminMedicines() {
  const medicinesList = document.getElementById("adminMedicinesList");
  const loading = document.getElementById("adminLoading");
  if (!medicinesList) return;

  try {
    loading.style.display = "block";
    medicinesList.innerHTML = "";

    const token = localStorage.getItem("token");
    const res = await fetch(`${ADMIN_API}/medicines`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    const medicines = await res.json();
    loading.style.display = "none";

    if (!Array.isArray(medicines) || medicines.length === 0) {
      medicinesList.innerHTML = "<p>No medicines found</p>";
      return;
    }

    medicinesList.innerHTML = medicines
      .map(
        (medicine) => `
      <div class="admin-medicine-item">
        <div class="medicine-details">
          <h4>${medicine.name}</h4>
          <p><strong>Status:</strong> ${medicine.status}</p>
          <p><strong>Donor:</strong> ${medicine.donor?.name || "N/A"}</p>
          <p><strong>Quantity:</strong> ${medicine.quantity}</p>
          <p><strong>Expiry:</strong> ${new Date(
            medicine.expiryDate
          ).toLocaleDateString()}</p>
        </div>
        <div class="medicine-actions">
          ${
            medicine.status === "CLAIMED"
              ? `
            <button class="btn green approve-btn" data-id="${medicine._id}">Approve</button>
            <button class="btn red reject-btn" data-id="${medicine._id}">Reject</button>
          `
              : `<button class="btn" disabled>No action</button>`
          }
        </div>
      </div>`
      )
      .join("");

    document.querySelectorAll(".approve-btn").forEach((btn) => {
      btn.addEventListener("click", () =>
        handleAdminAction(btn.dataset.id, "approve")
      );
    });

    document.querySelectorAll(".reject-btn").forEach((btn) => {
      btn.addEventListener("click", () =>
        handleAdminAction(btn.dataset.id, "reject")
      );
    });
  } catch {
    loading.style.display = "none";
    medicinesList.innerHTML = "<p>Failed to load medicines</p>";
  }
}

// Load users
async function loadAdminUsers() {
  const usersList = document.getElementById("adminUsersList");
  const loading = document.getElementById("adminLoading");
  if (!usersList) return;

  try {
    loading.style.display = "block";
    usersList.innerHTML = "";

    const token = localStorage.getItem("token");
    const res = await fetch(`${ADMIN_API}/users`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    const users = await res.json();
    loading.style.display = "none";

    if (!Array.isArray(users) || users.length === 0) {
      usersList.innerHTML = "<p>No users found</p>";
      return;
    }

    usersList.innerHTML = users
      .map(
        (user) => `
      <div class="admin-user-item">
        <h4>${user.name}</h4>
        <p>${user.email}</p>
        <p>${user.role}</p>
      </div>`
      )
      .join("");
  } catch {
    loading.style.display = "none";
    usersList.innerHTML = "<p>Failed to load users</p>";
  }
}

// Approve / Reject
async function handleAdminAction(medicineId, action) {
  if (!confirm(`Are you sure you want to ${action}?`)) return;

  try {
    const token = localStorage.getItem("token");
    const res = await fetch(`${ADMIN_API}/approve/${medicineId}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ action }),
    });

    if (res.ok) {
      alert(`Medicine ${action}d successfully`);
      loadAdminMedicines();
    } else {
      alert("Action failed");
    }
  } catch {
    alert("Network error");
  }
}
