import admin from "firebase-admin";
import fetch from "node-fetch";

/* =====================================================
   FIREBASE ADMIN INIT — FIXED (USES SERVICE ACCOUNT JSON)
===================================================== */
if (!admin.apps.length) {
  if (!process.env.FIREBASE_SERVICE_ACCOUNT) {
    throw new Error("FIREBASE_SERVICE_ACCOUNT not set");
  }

  admin.initializeApp({
    credential: admin.credential.cert(
      JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT)
    ),
  });
}

const db = admin.firestore();

/* =====================================================
   ZAR CHARGE MAP (LOCKED)
===================================================== */
const ZAR_CHARGE_MAP = {
  "South Africa": { basic: 4900, pro: 8900, lifetime: 199900 },
  "Nigeria": { basic: 4900, pro: 8900, lifetime: 199900 },
  "Kenya": { basic: 4900, pro: 8900, lifetime: 199900 },
  "Ghana": { basic: 4900, pro: 8900, lifetime: 199900 },
  "Botswana": { basic: 4900, pro: 8900, lifetime: 199900 },

  "United States": { basic: 7500, pro: 11500, lifetime: 279900 },
  "Canada": { basic: 7500, pro: 11500, lifetime: 279900 },
  "United Kingdom": { basic: 7500, pro: 11500, lifetime: 279900 },
  "Germany": { basic: 7500, pro: 11500, lifetime: 279900 },
  "France": { basic: 7500, pro: 11500, lifetime: 279900 },
  "Italy": { basic: 7500, pro: 11500, lifetime: 279900 },
  "Spain": { basic: 7500, pro: 11500, lifetime: 279900 },
  "Netherlands": { basic: 7500, pro: 11500, lifetime: 279900 },
  "Belgium": { basic: 7500, pro: 11500, lifetime: 279900 },

  "Zimbabwe": { basic: 3800, pro: 7500, lifetime: 99000 },
  "Tanzania": { basic: 3800, pro: 7500, lifetime: 99000 },
  "Uganda": { basic: 3800, pro: 7500, lifetime: 99000 },
  "Zambia": { basic: 3800, pro: 7500, lifetime: 99000 },
  "Mozambique": { basic: 3800, pro: 7500, lifetime: 99000 },

  DEFAULT: { basic: 4900, pro: 8900, lifetime: 199900 }
};

const getExpectedAmount = (country, plan) => {
  const map = ZAR_CHARGE_MAP[country] || ZAR_CHARGE_MAP.DEFAULT;
  return map[plan] || ZAR_CHARGE_MAP.DEFAULT[plan];
};

/* =====================================================
   NETLIFY FUNCTION HANDLER
===================================================== */
export const handler = async (event) => {
  const headers = {
    "Content-Type": "application/json",
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "Content-Type",
    "Access-Control-Allow-Methods": "POST, OPTIONS"
  };

  if (event.httpMethod === "OPTIONS") {
    return { statusCode: 200, headers, body: "" };
  }

  if (event.httpMethod !== "POST") {
    return { statusCode: 405, headers, body: JSON.stringify({ error: "Method Not Allowed" }) };
  }

  try {
    const { reference } = JSON.parse(event.body || "{}");

    if (!reference) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: "Payment reference required" })
      };
    }

    /* === VERIFY WITH PAYSTACK === */
    const verifyRes = await fetch(
      `https://api.paystack.co/transaction/verify/${reference}`,
      {
        headers: {
          Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
          "Content-Type": "application/json"
        }
      }
    );

    const verifyData = await verifyRes.json();

    if (!verifyData.status || verifyData.data.status !== "success") {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: "Payment not successful" })
      };
    }

    const tx = verifyData.data;

    if (tx.currency !== "ZAR") {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: "Invalid currency" })
      };
    }

    const { userId, plan, userCountry } = tx.metadata || {};

    if (!userId || !plan) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: "Missing metadata" })
      };
    }

    const expectedAmount = getExpectedAmount(userCountry, plan);

    if (tx.amount !== expectedAmount) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: "Amount mismatch" })
      };
    }

    /* === UPDATE FIRESTORE === */
    const userRef = db.collection("users").doc(userId);
    const userSnap = await userRef.get();

    if (!userSnap.exists) {
      return {
        statusCode: 404,
        headers,
        body: JSON.stringify({ error: "User not found" })
      };
    }

    if (userSnap.data().lastPaymentRef === reference) {
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({ ok: true, plan, alreadyActivated: true })
      };
    }

    await userRef.update({
      plan,
      subscriptionStatus: "active",
      lastPaymentRef: reference,
      lastPaymentAmount: tx.amount / 100,
      lastPaymentCurrency: "ZAR",
      planUpdatedAt: admin.firestore.FieldValue.serverTimestamp()
    });

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        ok: true,
        plan,
        amountPaid: tx.amount / 100,
        currency: "ZAR"
      })
    };

  } catch (err) {
    console.error("🔥 paystack-verify error:", err);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: "Server error" })
    };
  }
};
