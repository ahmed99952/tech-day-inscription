const SUPABASE_URL = "https://jmibielzxlwemfiodiny.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable_Mues8yxgDoVS3k-QEgR_mQ_y-wkIp4R";
const STORAGE_KEY = "techday-sidi-bouzid-2026-registrations";

const supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

const form = document.getElementById("registrationForm");
const successMessage = document.getElementById("successMessage");
const successName = document.getElementById("successName");
const successSummary = document.getElementById("successSummary");
const newRegistrationBtn = document.getElementById("newRegistration");
const exportBtn = document.getElementById("exportCsv");
const clearBtn = document.getElementById("clearRegistrations");
const countEl = document.getElementById("registrationCount");
const hackathonFields = document.getElementById("hackathonFields");
const menuToggle = document.getElementById("menuToggle");
const navLinks = document.getElementById("navLinks");
const submitBtn = document.getElementById("submitBtn");

function getRegistrations() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY)) || [];
  } catch {
    return [];
  }
}

function saveRegistrations(items) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
}

function updateCount() {
  countEl.textContent = String(getRegistrations().length);
}

function setError(name, message) {
  const el = document.querySelector(`[data-error-for="${name}"]`);
  if (el) el.textContent = message || "";
  const field = form.elements[name];
  if (field && field.length === undefined && field.type !== "radio" && field.type !== "checkbox") {
    field.classList.toggle("invalid", !!message);
  }
}

function clearErrors() {
  document.querySelectorAll(".error").forEach((el) => (el.textContent = ""));
  form.querySelectorAll(".invalid").forEach((el) => el.classList.remove("invalid"));
}

function validate(data) {
  clearErrors();
  let ok = true;
  const email = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  const phone = /^[0-9+()\s.-]{8,}$/;

  if (!data.firstName.trim()) { setError("firstName", "Le prénom est requis."); ok = false; }
  if (!data.lastName.trim()) { setError("lastName", "Le nom est requis."); ok = false; }
  if (!data.email.trim()) { setError("email", "L'email est requis."); ok = false; }
  else if (!email.test(data.email.trim())) { setError("email", "Veuillez entrer un email valide."); ok = false; }
  if (!data.phone.trim()) { setError("phone", "Le téléphone est requis."); ok = false; }
  else if (!phone.test(data.phone.trim())) { setError("phone", "Veuillez entrer un numéro valide."); ok = false; }
  if (!data.participation) { setError("participation", "Veuillez choisir un type de participation."); ok = false; }
  if (!data.consent) { setError("consent", "Vous devez accepter pour continuer."); ok = false; }

  return ok;
}

function getFormData() {
  const fd = new FormData(form);
  return {
    firstName: String(fd.get("firstName") || ""),
    lastName: String(fd.get("lastName") || ""),
    email: String(fd.get("email") || ""),
    phone: String(fd.get("phone") || ""),
    organization: String(fd.get("organization") || ""),
    role: String(fd.get("role") || ""),
    participation: String(fd.get("participation") || ""),
    teamName: String(fd.get("teamName") || ""),
    teamSize: String(fd.get("teamSize") || ""),
    challenge: String(fd.get("challenge") || ""),
    notes: String(fd.get("notes") || ""),
    consent: fd.get("consent") === "on",
  };
}

function showSuccess(entry) {
  form.classList.add("hidden");
  successMessage.classList.remove("hidden");
  successName.textContent = entry.firstName;
  const rows = [
    ["Nom", `${entry.firstName} ${entry.lastName}`],
    ["Email", entry.email],
    ["Participation", entry.participation === "hackathon" ? "Conférences + Hackathon" : "Conférences uniquement"],
  ];
  if (entry.participation === "hackathon" && entry.challenge) rows.push(["Défi", entry.challenge]);
  successSummary.innerHTML = rows.map(([k, v]) => `<div class="summary-row"><span>${k}</span><strong>${escapeHtml(v)}</strong></div>`).join("");
  successMessage.scrollIntoView({ behavior: "smooth", block: "nearest" });
}

function escapeHtml(str) {
  return String(str).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
}

function resetView() {
  form.reset();
  clearErrors();
  toggleHackathonFields();
  successMessage.classList.add("hidden");
  form.classList.remove("hidden");
}

function toggleHackathonFields() {
  const isHackathon = form.querySelector('input[name="participation"]:checked')?.value === "hackathon";
  hackathonFields.classList.toggle("hidden", !isHackathon);
  hackathonFields.setAttribute("aria-hidden", String(!isHackathon));
}

form.addEventListener("change", (e) => {
  if (e.target.name === "participation") toggleHackathonFields();
});

form.addEventListener("submit", async (e) => {
  e.preventDefault();
  const data = getFormData();
  if (!validate(data)) return;

  submitBtn.disabled = true;
  submitBtn.textContent = "Envoi en cours...";

  const payload = {
    first_name: data.firstName.trim(),
    last_name: data.lastName.trim(),
    email: data.email.trim(),
    phone: data.phone.trim(),
    organization: data.organization.trim() || null,
    role: data.role.trim() || null,
    participation: data.participation,
    team_name: data.teamName.trim() || null,
    team_size: data.teamSize || null,
    challenge: data.challenge || null,
    notes: data.notes.trim() || null,
    consent: data.consent,
  };

  try {
    const { error } = await supabaseClient.from("registrations").insert([payload]);
    if (error) {
      if (error.code === "23505") {
        setError("email", "Cet email est déjà inscrit.");
      } else {
        alert("Erreur lors de l'inscription : " + (error.message || "Veuillez réessayer."));
      }
      return;
    }

    const entry = {
      id: crypto.randomUUID ? crypto.randomUUID() : String(Date.now()),
      ...data,
      firstName: data.firstName.trim(),
      lastName: data.lastName.trim(),
      email: data.email.trim(),
      phone: data.phone.trim(),
      createdAt: new Date().toISOString(),
    };
    const registrations = getRegistrations();
    registrations.push(entry);
    saveRegistrations(registrations);
    updateCount();
    showSuccess(entry);
  } catch (err) {
    alert("Erreur réseau. Vérifiez votre connexion et réessayez.");
  } finally {
    submitBtn.disabled = false;
    submitBtn.textContent = "Confirmer l'inscription";
  }
});

newRegistrationBtn.addEventListener("click", resetView);

exportBtn.addEventListener("click", () => {
  const rows = getRegistrations();
  if (!rows.length) { alert("Aucune inscription locale à exporter."); return; }
  const headers = ["createdAt","firstName","lastName","email","phone","organization","role","participation","teamName","teamSize","challenge","notes"];
  const csv = [headers.join(","), ...rows.map((r) => headers.map((h) => `"${String(r[h] ?? "").replace(/"/g, '""')}"`).join(","))].join("\n");
  const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "inscriptions-tech-day-sidi-bouzid-2026.csv";
  a.click();
  URL.revokeObjectURL(url);
});

clearBtn.addEventListener("click", () => {
  if (!getRegistrations().length) return;
  if (confirm("Supprimer les inscriptions enregistrées localement sur ce navigateur ?")) {
    localStorage.removeItem(STORAGE_KEY);
    updateCount();
  }
});

menuToggle.addEventListener("click", () => {
  const open = navLinks.classList.toggle("open");
  menuToggle.setAttribute("aria-expanded", String(open));
});

navLinks.querySelectorAll("a").forEach((a) => {
  a.addEventListener("click", () => {
    navLinks.classList.remove("open");
    menuToggle.setAttribute("aria-expanded", "false");
  });
});

updateCount();
toggleHackathonFields();