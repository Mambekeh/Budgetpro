import React, { createContext, useContext, useState, useEffect } from "react";
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  updateProfile
} from "firebase/auth";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { auth, db } from "../firebase/config";

const AuthContext = createContext();

/* =================================================
   HOOK
================================================= */
export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}

/* =================================================
   PROVIDER
================================================= */
export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);

  /* =================================================
     AUTH STATE LISTENER
     Firestore is the ONLY source of truth
  ================================================= */
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        setCurrentUser(null);
        setLoading(false);
        return;
      }

      try {
        const userRef = doc(db, "users", user.uid);
        const snap = await getDoc(userRef);

        if (snap.exists()) {
          const data = snap.data();

          const hydratedUser = {
            uid: user.uid,
            email: user.email,

            // ✅ NAME — FIRESTORE ONLY
            name: data.signupName || data.name || "User",

            // ✅ COUNTRY & CURRENCY — FIRESTORE FIRST
            signupCountry: data.signupCountry || "",
            displayCountry: data.displayCountry || data.signupCountry || "",
            displayCurrency: data.displayCurrency || "",

            plan: data.plan || "free",
            accountType: data.accountType || "personal",
            createdAt: data.createdAt || null
          };

          setCurrentUser(hydratedUser);

          // 🔄 HYDRATE LOCAL STORAGE FROM FIRESTORE (CACHE ONLY)
          if (hydratedUser.displayCountry) {
            localStorage.setItem("bp_country", hydratedUser.displayCountry);
          }
          if (hydratedUser.displayCurrency) {
            localStorage.setItem("bp_currency", hydratedUser.displayCurrency);
          }
          if (hydratedUser.name) {
            localStorage.setItem("bp_name", hydratedUser.name);
          }
          if (hydratedUser.plan) {
            localStorage.setItem("budgetPro_plan", hydratedUser.plan);
          }
        } else {
          // ❌ Fail closed — do NOT infer missing profile data
          setCurrentUser({
            uid: user.uid,
            email: user.email,
            name: "User",
            plan: "free",
            accountType: "personal"
          });
        }
      } catch (error) {
        console.error("AuthContext load error:", error);

        // ❌ Fail closed — never trust partial data
        setCurrentUser({
          uid: user.uid,
          email: user.email,
          name: "User",
          plan: "free",
          accountType: "personal"
        });
      }

      setLoading(false);
    });

    return unsubscribe;
  }, []);

  /* =================================================
     SIGNUP (AUTH ONLY)
  ================================================= */
  const signup = async (email, password, name) => {
    try {
      const cred = await createUserWithEmailAndPassword(
        auth,
        email,
        password
      );

      await updateProfile(cred.user, { displayName: name });

      return { success: true, user: cred.user };
    } catch (error) {
      return { success: false, error: error.message };
    }
  };

  /* =================================================
     LOGIN
  ================================================= */
  const login = async (email, password) => {
    try {
      await signInWithEmailAndPassword(auth, email, password);
      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  };

  /* =================================================
     LOGOUT (CLEAR ALL USER CACHE)
  ================================================= */
  const logout = async () => {
    await signOut(auth);

    // 🧹 CLEAR USER-SCOPED CACHE
    localStorage.removeItem("bp_country");
    localStorage.removeItem("bp_currency");
    localStorage.removeItem("bp_name");
    localStorage.removeItem("budgetPro_plan");
    localStorage.removeItem("accountType");

    setCurrentUser(null);
  };

  /* =================================================
     UPDATE PROFILE (SAFE FIELDS ONLY)
  ================================================= */
  const updateUserProfile = async (data) => {
    if (!currentUser?.uid) return { success: false };

    // 🔐 BLOCK PRIVILEGE ESCALATION
    if ("plan" in data) {
      return { success: false, error: "Unauthorized field update" };
    }

    const updateData = {};

    if (data.name) {
      updateData.signupName = data.name;
      await updateProfile(auth.currentUser, { displayName: data.name });
      localStorage.setItem("bp_name", data.name);
    }

    if (data.displayCountry) {
      updateData.displayCountry = data.displayCountry;
      localStorage.setItem("bp_country", data.displayCountry);
    }

    if (data.displayCurrency) {
      updateData.displayCurrency = data.displayCurrency;
      localStorage.setItem("bp_currency", data.displayCurrency);
    }

    if (data.accountType) {
      updateData.accountType = data.accountType;
    }

    await updateDoc(doc(db, "users", currentUser.uid), updateData);

    setCurrentUser((prev) => ({
      ...prev,
      ...updateData
    }));

    return { success: true };
  };

  /* =================================================
     HELPERS
  ================================================= */
  const getAccountType = () =>
    currentUser?.accountType || "personal";

  const switchAccountType = async (newType) =>
    await updateUserProfile({ accountType: newType });

  /* =================================================
     CONTEXT VALUE
  ================================================= */
  const value = {
    currentUser,
    signup,
    login,
    logout,
    updateUserProfile,
    getAccountType,
    switchAccountType
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
}
