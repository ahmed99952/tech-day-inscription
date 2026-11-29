const SUPABASE_URL = "https://jmibielzxlwemfiodiny.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable_Mues8yxgDoVS3k-QEgR_mQ_y-wkIp4R";

const supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

const form = document.getElementById("hackathonForm");
const successMessage = document.getElementById("successMessage");
const successName = document.getElementById("successName");
const successTeam = document.getElementById("successTeam");
const successSummary = document.getElementById("successSummary");
const newRegistrationBtn = document.getElementById("newRegistration");
const submitBtn = document.getElementById("submitBtn");
const menuToggle = document.getElementById("menuToggle");
const navLinks = document.getElementById("navLinks");

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
function escapeHtml(str) {
  return String(str).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
}

function getFormData() {
  const fd = new FormData(form);
  return {
    teamName: String(fd.get("teamName") || "").trim(),
    leaderFirstName: String(fd.get("leaderFirstName") || "").trim(),
    leaderLastName: String(fd.get("leaderLastName") || "").trim(),
    leaderEmail: String(fd.get("leaderEmail") || "").trim(),
    leaderPhone: String(fd.get("leaderPhone") || "").trim(),
    leaderPhone2: String(fd.get("leaderPhone2") || "").trim(),
    member1: String(fd.get("member1") || "").trim(),
    member2: String(fd.get("member2") || "").trim(),
    consent: fd.get("consent") === "on",
  };
}

function validate(data) {
  clearErrors();
  let ok = true;
  const lettersOnly = /^[\p{L}\s'-]+$/u;
  const gmail = /^[^\s@]+@gmail\.com$/i;
  const phone8 = /^\d{8}$/;

  if (!data.teamName) { setError("teamName", "Le nom de l'équipe est requis."); ok = false; }
  else if (!lettersOnly.test(data.teamName)) { setError("teamName", "Le nom de l'équipe doit contenir uniquement des lettres."); ok = false; }

  if (!data.leaderFirstName) { setError("leaderFirstName", "Le prénom du leader est requis."); ok = false; }
  else if (!lettersOnly.test(data.leaderFirstName)) { setError("leaderFirstName", "Le prénom doit contenir uniquement des lettres."); ok = false; }

  if (!data.leaderLastName) { setError("leaderLastName", "Le nom du leader est requis."); ok = false; }
  else if (!lettersOnly.test(data.leaderLastName)) { setError("leaderLastName", "Le nom doit contenir uniquement des lettres."); ok = false; }

  if (!data.leaderEmail) { setError("leaderEmail", "L'email est requis."); ok = false; }
  else if (!gmail.test(data.leaderEmail)) { setError("leaderEmail", "L'email doit être une adresse @gmail.com."); ok = false; }

  if (!data.leaderPhone) { setError("leaderPhone", "Le numéro téléphone est requis."); ok = false; }
  else if (!phone8.test(data.leaderPhone.replace(/\s+/g, ""))) { setError("leaderPhone", "Le téléphone doit contenir 8 chiffres."); ok = false; }

  if (!data.leaderPhone2) { setError("leaderPhone2", "Le numéro téléphone de réserve est requis."); ok = false; }
  else if (!phone8.test(data.leaderPhone2.replace(/\s+/g, ""))) { setError("leaderPhone2", "Le téléphone doit contenir 8 chiffres."); ok = false; }

  if (!data.member1) { setError("member1", "Le membre 1 est requis."); ok = false; }
  else if (!lettersOnly.test(data.member1)) { setError("member1", "Le nom doit contenir uniquement des lettres."); ok = false; }

  if (!data.member2) { setError("member2", "Le membre 2 est requis."); ok = false; }
  else if (!lettersOnly.test(data.member2)) { setError("member2", "Le nom doit contenir uniquement des lettres."); ok = false; }

  if (!data.consent) { setError("consent", "Vous devez confirmer pour continuer."); ok = false; }
  return ok;
}

function showSuccess(data) {
  form.classList.add("hidden");
  successMessage.classList.remove("hidden");
  successName.textContent = data.leaderFirstName;
  successTeam.textContent = data.teamName;
  const rows = [
    ["Équipe", data.teamName],
    ["Leader", `${data.leaderFirstName} ${data.leaderLastName}`],
    ["Email", data.leaderEmail],
    ["Téléphone", data.leaderPhone],
    ["Tél. réserve", data.leaderPhone2],
    ["Membres", `${data.member1}, ${data.member2}`],
  ];
  successSummary.innerHTML = rows.map(([k, v]) => `<div class="summary-row"><span>${k}</span><strong>${escapeHtml(v)}</strong></div>`).join("");
  successMessage.scrollIntoView({ behavior: "smooth", block: "nearest" });
}

form.addEventListener("submit", async (e) => {
  e.preventDefault();
  const data = getFormData();
  if (!validate(data)) return;

  submitBtn.disabled = true;
  submitBtn.textContent = "Envoi en cours...";

  const notes = `Tél réserve: ${data.leaderPhone2} | Membres: ${data.member1}, ${data.member2}`;
  const basePayload = {
    first_name: data.leaderFirstName,
    last_name: data.leaderLastName,
    email: data.leaderEmail,
    phone: data.leaderPhone.replace(/\s+/g, ""),
    organization: null,
    role: "Leader",
    participation: "hackathon",
    team_name: data.teamName,
    team_size: "3",
    challenge: null,
    notes,
    consent: data.consent,
  };
  const payloadWithMembers = { ...basePayload, member1: data.member1, member2: data.member2, member3: null };

  try {
    let { error } = await supabaseClient.from("registrations").insert([payloadWithMembers]);
    if (error && /member1|member2|member3|column/i.test(error.message || "")) {
      ({ error } = await supabaseClient.from("registrations").insert([basePayload]));
    }
    if (error) {
      if (error.code === "23505") setError("leaderEmail", "Cet email est déjà inscrit.");
      else throw error;
      return;
    }
    showSuccess(data);
  } catch (err) {
    alert("Erreur lors de l'inscription : " + (err.message || "Veuillez réessayer."));
  } finally {
    submitBtn.disabled = false;
    submitBtn.textContent = "Confirmer l'inscription hackathon";
  }
});

newRegistrationBtn.addEventListener("click", () => {
  form.reset();
  clearErrors();
  successMessage.classList.add("hidden");
  form.classList.remove("hidden");
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