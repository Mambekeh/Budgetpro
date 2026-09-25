// src/utils/subscription.js

// ---------- GET USER PLAN ----------
export function getUserPlan() {
  return localStorage.getItem("budgetPro_plan") || "free";
}

// ---------- CHECK IF PROFESSIONAL ----------
export function isProfessional() {
  const plan = getUserPlan();
  return plan === "pro" || plan === "lifetime";
}

// ---------- PDF EXPORT ----------
export function canExportPDF() {
  const plan = getUserPlan();
  return plan === "essential" || plan === "pro" || plan === "lifetime";
}

// ---------- BUSINESS MODE ----------
export function canUseBusiness() {
  const plan = getUserPlan();
  return plan === "pro" || plan === "lifetime";
}

// ---------- DEBT / ALERTS / GOALS ----------
export function canUseProFeatures() {
  const plan = getUserPlan();
  return plan === "pro" || plan === "lifetime";
}

// ---------- COLLABORATION ----------
export function canCollaborate() {
  const plan = getUserPlan();
  return plan === "pro" || plan === "lifetime";
}

// ---------- FREE TRIAL LIMIT ----------
export function isFreeUser() {
  return getUserPlan() === "free";
}

// ---------- ESSENTIAL PLAN ----------
export function isEssentialUser() {
  return getUserPlan() === "essential";
}

// ---------- LIFETIME PLAN ----------
export function isLifetimeUser() {
  return getUserPlan() === "lifetime";
}