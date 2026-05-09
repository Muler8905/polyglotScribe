import UserToken from "../models/UserToken.js";
import SubscriptionPlan from "../models/SubscriptionPlan.js";
import SubscriptionPayment from "../models/SubscriptionPayment.js";
import Profile from "../models/Profile.js";
import UserRole from "../models/UserRole.js";

const defaultPlans = [
  {
    slug: "starter",
    name: "Starter",
    description: "Good for light use",
    priceEtb: 299,
    credits: 100,
    highlight: false,
    sortOrder: 1,
    active: true,
  },
  {
    slug: "pro",
    name: "Pro",
    description: "Best value for teams",
    priceEtb: 999,
    credits: 400,
    highlight: true,
    sortOrder: 2,
    active: true,
  },
  {
    slug: "business",
    name: "Business",
    description: "High-volume power users",
    priceEtb: 2499,
    credits: 1200,
    highlight: false,
    sortOrder: 3,
    active: true,
  },
];

export const ensureDefaultPlans = async () => {
  for (const plan of defaultPlans) {
    await SubscriptionPlan.updateOne({ slug: plan.slug }, { $setOnInsert: plan }, { upsert: true });
  }
};

export const listPlans = async (req, res, next) => {
  try {
    const plans = await SubscriptionPlan.find({ active: true }).sort({ sortOrder: 1 }).lean();
    res.json({ success: true, data: { plans } });
  } catch (error) {
    next(error);
  }
};

export const listMyPayments = async (req, res, next) => {
  try {
    const items = await SubscriptionPayment.find({ userId: req.user._id })
      .sort({ createdAt: -1 })
      .limit(10)
      .populate("planId")
      .lean();
    res.json({ success: true, data: { items } });
  } catch (error) {
    next(error);
  }
};

export const initiatePayment = async (req, res, next) => {
  try {
    const { planSlug } = req.body;
    const plan = await SubscriptionPlan.findOne({ slug: planSlug, active: true });
    if (!plan) return res.status(404).json({ success: false, message: "Plan not found" });
    const txRef = `ps-${String(req.user._id).slice(0, 8)}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    await SubscriptionPayment.create({
      userId: req.user._id,
      planId: plan._id,
      txRef,
      amountEtb: plan.priceEtb,
      status: "pending",
    });

    const CHAPA_SECRET = process.env.CHAPA_SECRET_KEY;
    if (!CHAPA_SECRET) return res.status(500).json({ success: false, message: "CHAPA_SECRET_KEY missing" });

    const profile = await Profile.findOne({ userId: req.user._id });
    const fullName = (profile?.displayName ?? req.user.displayName ?? req.user.email.split("@")[0]).trim();
    const [firstName, ...rest] = fullName.split(/\s+/);
    const lastName = rest.join(" ") || "User";
    const origin = req.headers.origin || process.env.PUBLIC_APP_URL || process.env.FRONTEND_URL;
    const callbackUrl = `${origin}/api/public/chapa-webhook`;
    const returnUrl = `${origin}/payment/success?tx_ref=${encodeURIComponent(txRef)}`;

    const chapaRes = await fetch("https://api.chapa.co/v1/transaction/initialize", {
      method: "POST",
      headers: { Authorization: `Bearer ${CHAPA_SECRET}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        amount: String(plan.priceEtb),
        currency: "ETB",
        email: req.user.email,
        first_name: firstName || "User",
        last_name: lastName,
        tx_ref: txRef,
        callback_url: callbackUrl,
        return_url: returnUrl,
        customization: {
          title: `${plan.name} plan`.slice(0, 16),
          description: `${plan.credits} credits`.slice(0, 50),
        },
      }),
    });
    const chapa = await chapaRes.json();
    const checkoutUrl = chapa?.data?.checkout_url;
    if (!chapaRes.ok || chapa?.status !== "success" || !checkoutUrl) {
      await SubscriptionPayment.updateOne({ txRef }, { status: "failed" });
      return res.status(400).json({ success: false, message: chapa?.message || "Chapa init failed" });
    }
    await SubscriptionPayment.updateOne({ txRef }, { checkoutUrl });
    res.json({ success: true, data: { txRef, checkoutUrl } });
  } catch (error) {
    next(error);
  }
};

export const verifyPayment = async (req, res, next) => {
  try {
    const { txRef } = req.body;
    const payment = await SubscriptionPayment.findOne({ txRef }).populate("planId");
    if (!payment || String(payment.userId) !== String(req.user._id)) {
      return res.status(404).json({ success: false, message: "Payment not found" });
    }
    if (payment.status === "success") {
      return res.json({ success: true, data: { status: "success", creditsAwarded: payment.creditsAwarded } });
    }
    const CHAPA_SECRET = process.env.CHAPA_SECRET_KEY;
    if (!CHAPA_SECRET) return res.status(500).json({ success: false, message: "CHAPA_SECRET_KEY missing" });
    const verifyRes = await fetch(
      `https://api.chapa.co/v1/transaction/verify/${encodeURIComponent(txRef)}`,
      { headers: { Authorization: `Bearer ${CHAPA_SECRET}` } },
    );
    const verify = await verifyRes.json();
    if (verify?.status === "success" && verify?.data?.status === "success") {
      const credits = payment.planId.credits;
      const fresh = await SubscriptionPayment.findOne({ txRef });
      if (fresh && fresh.status !== "success") {
        await UserToken.updateOne(
          { userId: req.user._id },
          { $inc: { credits }, $set: { suspended: false } },
          { upsert: true },
        );
        fresh.status = "success";
        fresh.creditsAwarded = credits;
        fresh.chapaRef = verify?.data?.reference || null;
        await fresh.save();
      }
      return res.json({ success: true, data: { status: "success", creditsAwarded: credits } });
    }
    if (verify?.data?.status === "failed") {
      await SubscriptionPayment.updateOne({ txRef }, { status: "failed" });
      return res.json({ success: true, data: { status: "failed", creditsAwarded: 0 } });
    }
    return res.json({ success: true, data: { status: "pending", creditsAwarded: 0 } });
  } catch (error) {
    next(error);
  }
};

export const processWebhookByTxRef = async (txRef) => {
  const payment = await SubscriptionPayment.findOne({ txRef }).populate("planId");
  if (!payment || payment.status === "success") return;
  const CHAPA_SECRET = process.env.CHAPA_SECRET_KEY;
  if (!CHAPA_SECRET) return;
  const verifyRes = await fetch(
    `https://api.chapa.co/v1/transaction/verify/${encodeURIComponent(txRef)}`,
    { headers: { Authorization: `Bearer ${CHAPA_SECRET}` } },
  );
  const verify = await verifyRes.json();
  if (verify?.status === "success" && verify?.data?.status === "success") {
    const credits = payment.planId.credits;
    const fresh = await SubscriptionPayment.findOne({ txRef });
    if (!fresh || fresh.status === "success") return;
    await UserToken.updateOne(
      { userId: payment.userId },
      { $inc: { credits }, $set: { suspended: false } },
      { upsert: true },
    );
    fresh.status = "success";
    fresh.creditsAwarded = credits;
    fresh.chapaRef = verify?.data?.reference || null;
    await fresh.save();
  }
};

export const assertAdmin = async (userId) => {
  const isAdmin = await UserRole.findOne({ userId, role: "admin" });
  return !!isAdmin;
};
