const crypto = require("crypto");
const admin = require("firebase-admin");

// Initialize Firebase Admin ONCE
if (!admin.apps.length) {
  if (!process.env.FIREBASE_SERVICE_ACCOUNT) {
    console.error("❌ FIREBASE_SERVICE_ACCOUNT not set");
    throw new Error("Missing Firebase credentials");
  }

  admin.initializeApp({
    credential: admin.credential.cert(
      JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT)
    ),
  });
}

const db = admin.firestore();

exports.handler = async (event) => {
  try {
    // Netlify health check / browser hits
    if (event.httpMethod !== "POST") {
      return { statusCode: 200, body: "OK" };
    }

    const signature =
      event.headers["x-paystack-signature"] ||
      event.headers["X-Paystack-Signature"];

    const secret = process.env.PAYSTACK_SECRET_KEY;

    if (!signature || !secret) {
      console.log("❌ Missing Paystack signature or secret");
      return { statusCode: 200, body: "Ignored" };
    }

    // Verify Paystack signature
    const computedHash = crypto
      .createHmac("sha512", secret)
      .update(event.body)
      .digest("hex");

    if (computedHash !== signature) {
      console.log("❌ Invalid Paystack signature");
      return { statusCode: 200, body: "Ignored" };
    }

    const payload = JSON.parse(event.body);

    console.log("✅ Paystack event:", payload.event);

    // Only handle successful payments
    if (payload.event === "charge.success") {
      const metadata = payload.data?.metadata ?? {};
      const userId = metadata.userId;
      const plan = metadata.plan;

      if (!userId || !plan) {
        console.log("❌ Missing userId or plan in metadata");
        return { statusCode: 200, body: "OK" };
      }

      console.log(`🔐 Updating user ${userId} → plan: ${plan}`);

      await db.collection("users").doc(userId).update({
        plan,
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      });

      console.log("✅ User plan updated successfully");
    }

    return {
      statusCode: 200,
      body: "Webhook processed",
    };
  } catch (error) {
    console.error("🔥 Webhook error:", error);
    return {
      statusCode: 200,
      body: "OK",
    };
  }
};
