import { useEffect, useState } from "react";
import { doc, getDoc } from "firebase/firestore";
import { db } from "../firebase/config";
import { useAuth } from "../context/AuthContext";
import { ensureUserDoc } from "../utils/ensureUserDoc";

export function useUser() {
  const { currentUser } = useAuth();

  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;

    async function loadOrCreateUser() {
      if (!currentUser?.uid) {
        if (active) {
          setUser(null);
          setLoading(false);
        }
        return;
      }

      try {
        const ref = doc(db, "users", currentUser.uid);
        const snap = await getDoc(ref);

        // ✅ USER DOC EXISTS
        if (snap.exists()) {
          if (active) {
            setUser(snap.data());
            setLoading(false);
          }
          return;
        }

        // 🧠 USER DOC DOES NOT EXIST → CREATE IT
        const result = await ensureUserDoc({
  uid: currentUser.uid,
  email: currentUser.email
});

        if (active) {
          setUser(result.data);
          setLoading(false);
        }

      } catch (err) {
        console.error("useUser error:", err);
        if (active) {
          setUser(null);
          setLoading(false);
        }
      }
    }

    loadOrCreateUser();

    return () => {
      active = false;
    };
  }, [currentUser?.uid]);

  return { user, loading };
}
