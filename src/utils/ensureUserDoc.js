import { doc, getDoc, setDoc, serverTimestamp } from "firebase/firestore";
import { db } from "../firebase/config";
import { getCurrencyFromCountry } from "./currencyUtils";

export async function ensureUserDoc({
  uid,
  email,
  signupName,
  signupCountry,
}) {
  if (!uid) throw new Error("ensureUserDoc: uid is required");

  const userRef = doc(db, "users", uid);
  const snap = await getDoc(userRef);

  // If user doc already exists, do nothing
  if (snap.exists()) return { created: false, data: snap.data() };

  const displayCountry = signupCountry || "";
  const displayCurrency = displayCountry
    ? getCurrencyFromCountry(displayCountry)
    : "";

  const payload = {
    uid,
    email: email || "",
    signupName: signupName || "",
    plan: "free",
    signupCountry: signupCountry || "",
    displayCountry: displayCountry,
    displayCurrency: displayCurrency,
    transactionCount: 0,        // ⭐ CRITICAL: New users start with 0 transactions
    hasUpgradedBefore: false,   // ⭐ CRITICAL: New users have never upgraded
    createdAt: serverTimestamp(),
  };

  await setDoc(userRef, payload, { merge: false });

  return { created: true, data: payload };
}