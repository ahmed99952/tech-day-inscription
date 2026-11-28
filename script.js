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
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY)) || []; } catch { return []; }
}
function saveRegistrations(items) { localStorage.setItem(STORAGE_KEY, JSON.stringify(items)); }
function updateCount() { if (countEl) countEl.textContent = String(getRegistrations().length); }

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

function getFormData() {
  const fd = new FormData(form);
  return {
    firstName: String(fd.get("firstName") || "").trim(),
    lastName: String(fd.get("lastName") || "").trim(),
    email: String(fd.get("email") || "").trim(),
    phone: String(fd.get("phone") || "").trim(),
    organization: String(fd.get("organization") || "").trim(),
    role: String(fd.get("role") || "").trim(),
    participation: String(fd.get("participation") || ""),
    teamName: String(fd.get("teamName") || "").trim(),
    member1: String(fd.get("member1") || "").trim(),
    member2: String(fd.get("member2") || "").trim(),
    member3: String(fd.get("member3") || "").trim(),
    notes: String(fd.get("notes") || "").trim(),
    consent: fd.get("consent") === "on",
  };
}

function validate(data) {
  clearErrors();
  let ok = true;
  const lettersOnly = /^[\p{L}\s'-]+$/u;
  const gmail = /^[^\s@]+@gmail\.com$/i;
  const phone8 = /^\d{8}$/;

  if (!data.firstName) { setError("firstName", "Le prénom est requis."); ok = false; }
  else if (!lettersOnly.test(data.firstName)) { setError("firstName", "Le prénom doit contenir uniquement des lettres."); ok = false; }

  if (!data.lastName) { setError("lastName", "Le nom est requis."); ok = false; }
  else if (!lettersOnly.test(data.lastName)) { setError("lastName", "Le nom doit contenir uniquement des lettres."); ok = false; }

  if (!data.email) { setError("email", "L'email est requis."); ok = false; }
  else if (!gmail.test(data.email)) { setError("email", "L'email doit être une adresse @gmail.com."); ok = false; }

  if (!data.phone) { setError("phone", "Le téléphone est requis."); ok = false; }
  else if (!phone8.test(data.phone.replace(/\s+/g, ""))) { setError("phone", "Le téléphone doit contenir 8 chiffres."); ok = false; }

  if (!data.organization) { setError("organization", "L'établissement est requis."); ok = false; }
  else if (!lettersOnly.test(data.organization)) { setError("organization", "L'établissement doit contenir uniquement des lettres."); ok = false; }

  if (!data.participation) { setError("participation", "Veuillez choisir un type de participation."); ok = false; }

  if (data.participation === "hackathon") {
    if (!data.teamName) { setError("teamName", "Le nom de l'équipe est requis."); ok = false; }
    else if (!lettersOnly.test(data.teamName)) { setError("teamName", "Le nom de l'équipe doit contenir uniquement des lettres."); ok = false; }

    if (!data.member1) { setError("member1", "Le membre 1 est requis."); ok = false; }
    else if (!lettersOnly.test(data.member1)) { setError("member1", "Le membre 1 doit contenir uniquement des lettres."); ok = false; }

    if (!data.member2) { setError("member2", "Le membre 2 est requis."); ok = false; }
    else if (!lettersOnly.test(data.member2)) { setError("member2", "Le membre 2 doit contenir uniquement des lettres."); ok = false; }

    if (!data.member3) { setError("member3", "Le membre 3 est requis."); ok = false; }
    else if (!lettersOnly.test(data.member3)) { setError("member3", "Le membre 3 doit contenir uniquement des lettres."); ok = false; }
  }

  if (!data.consent) { setError("consent", "Vous devez accepter pour continuer."); ok = false; }
  return ok;
}

function escapeHtml(str) {
  return String(str).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
}

function showSuccess(entry) {
  form.classList.add("hidden");
  successMessage.classList.remove("hidden");
  successName.textContent = entry.firstName;
  const rows = [
    ["Nom", `${entry.firstName} ${entry.lastName}`],
    ["Email", entry.email],
    ["Participation", entry.participation === "hackathon" ? "Formation + Hackathon" : "Formation uniquement"],
  ];
  if (entry.participation === "hackathon") {
    rows.push(["Équipe", entry.teamName]);
    rows.push(["Membres", [entry.member1, entry.member2, entry.member3].filter(Boolean).join(", ")]);
  }
  successSummary.innerHTML = rows.map(([k, v]) => `<div class="summary-row"><span>${k}</span><strong>${escapeHtml(v)}</strong></div>`).join("");
  successMessage.scrollIntoView({ behavior: "smooth", block: "nearest" });
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

  const members = [data.member1, data.member2, data.member3].filter(Boolean).join(", ");
  const notes = [data.notes, members ? `Membres: ${members}` : ""].filter(Boolean).join(" | ");

  // DB compatibility: old constraint may allow 'conference'/'hackathon'
  const participationForDb = data.participation === "formation" ? "conference" : "hackathon";

  const payload = {
    first_name: data.firstName,
    last_name: data.lastName,
    email: data.email,
    phone: data.phone,
    organization: data.organization || null,
    role: data.role || null,
    participation: participationForDb,
    team_name: data.teamName || null,
    team_size: data.participation === "hackathon" ? "3" : null,
    challenge: null,
    notes: notes || null,
    consent: data.consent,
  };

  try {
    const { error } = await supabaseClient.from("registrations").insert([payload]);
    if (error) {
      if (error.code === "23505") {
        setError("email", "Cet email est déjà inscrit.");
      } else if (error.code === "23514") {
        // fallback for check constraint on participation
        const retry = await supabaseClient.from("registrations").insert([{ ...payload, participation: data.participation }]);
        if (retry.error) throw retry.error;
      } else {
        throw error;
      }
      if (error && error.code !== "23514") return;
    }

    const entry = { id: crypto.randomUUID ? crypto.randomUUID() : String(Date.now()), ...data, createdAt: new Date().toISOString() };
    const registrations = getRegistrations();
    registrations.push(entry);
    saveRegistrations(registrations);
    updateCount();
    showSuccess(entry);
  } catch (err) {
    alert("Erreur lors de l'inscription : " + (err.message || "Veuillez réessayer."));
  } finally {
    submitBtn.disabled = false;
    submitBtn.textContent = "Confirmer l'inscription";
  }
});

newRegistrationBtn.addEventListener("click", resetView);

if (exportBtn) exportBtn.addEventListener("click", () => {
  const rows = getRegistrations();
  if (!rows.length) { alert("Aucune inscription locale à exporter."); return; }
  const headers = ["createdAt","firstName","lastName","email","phone","organization","role","participation","teamName","member1","member2","member3","notes"];
  const csv = [headers.join(","), ...rows.map((r) => headers.map((h) => `"${String(r[h] ?? "").replace(/"/g, '""')}"`).join(","))].join("\n");
  const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "inscriptions-tech-day-sidi-bouzid-2026.csv";
  a.click();
  URL.revokeObjectURL(url);
});

if (clearBtn) clearBtn.addEventListener("click", () => {
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