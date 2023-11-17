import express from "express";
import { SupabaseClient } from "@supabase/supabase-js";
import { auth } from "../middleware/auth";
import jwt from "jsonwebtoken";
import { userHasActiveSubscription } from "../utils/userHasActiveSubscription";
import { priceId, stripeSecretKey } from "../utils/StripeValues";
import { convertUnixTimestamp } from "../utils/convertUnixTimestamp";

const router = express.Router();

const stripe = require("stripe")(stripeSecretKey);

/**
 * Retrieves user information
 */
router.get("/status", auth, async (req: any, res: any) => {
  const email = req.user.email;

  const isProUser = await userHasActiveSubscription(email);
  // Create a new payload with additional data
  const newPayload = {
    ...req.user, // Include existing claims
    isProUser, // Add your additional data
  };

  const newToken = jwt.sign(newPayload, "token");

  res.header("Authorization", "Bearer " + newToken);
  res.send({ success: true });
});

/**
 * Retrieves details of subscription
 */
router.get("/subscription_details", auth, async (req: any, res: any) => {
  const email = req.user.email;

  // Grab all customer ids associated with this email address
  const customers = await stripe.customers.search({
    query: `email: '${email}'`,
  });

  const customerIds = customers.data.map((data: any) => data.id);

  // Check to see if customers list is non-empty first
  let subscriptions = [];
  let billingPortalUrl = "";
  if (customerIds.length > 0) {
    const customerId = customerIds[0];
    subscriptions = await stripe.subscriptions.list({
      customer: customerId,
      price: priceId,
      status: "all",
    });

    const sessionData = await stripe.billingPortal.sessions.create({
      customer: customerId,
    });
    billingPortalUrl = sessionData.url;
  }

  // Check to see if subscriptions list is non-empty first
  if (subscriptions.data.length > 0) {
    const recentSubscription = subscriptions.data[0];

    const subscriptionId = recentSubscription.id;

    let isRenewing: boolean;

    if (recentSubscription.canceled_at === null) {
      isRenewing = true;
    } else {
      isRenewing = false;
    }

    let renewalDate = "";
    let expirationDate = "";

    if (isRenewing) {
      renewalDate = convertUnixTimestamp(recentSubscription.current_period_end);
    } else {
      expirationDate = convertUnixTimestamp(
        recentSubscription.current_period_end
      );
    }

    let currentPlan = "";

    if (recentSubscription.status === "active") {
      currentPlan = "Pro";
    } else {
      currentPlan = "Starter";
    }

    const isProUser = await userHasActiveSubscription(email);
    // Create a new payload with additional data
    const newPayload = {
      ...req.user, // Include existing claims
      isProUser, // Add your additional data
    };

    const newToken = jwt.sign(newPayload, "token");
    res.header("Authorization", "Bearer " + newToken);

    res.send({
      currentPlan,
      subscriptionId,
      renewalDate,
      expirationDate,
      billingPortalUrl,
    });
  } else {
    const isProUser = await userHasActiveSubscription(email);
    // Create a new payload with additional data
    const newPayload = {
      ...req.user, // Include existing claims
      isProUser, // Add your additional data
    };

    const newToken = jwt.sign(newPayload, "token");

    res.header("Authorization", "Bearer " + newToken);

    res.send({
      currentPlan: "Starter",
    });
  }
});

/**
 * Continue subscription
 */
router.post("/continue_subscription", auth, async (req: any, res: any) => {
  try {
    // Update the subscription to reschedule cancellation
    await stripe.subscriptions.update(req.body.subscriptionId, {
      cancel_at: null, // Set cancel_at to null to remove the scheduled cancellation
    });
  } catch (error) {
    console.error("Error:", error);
  }

  res.send({ success: true });
});

/**
 * Cancel subscription
 */
router.post("/cancel_subscription", auth, async (req: any, res: any) => {
  try {
    // Cancels the subscription
    await stripe.subscriptions.update(req.body.subscriptionId, {
      cancel_at_period_end: true,
    });
  } catch (error) {
    console.error("Error:", error);
  }

  res.send({ success: true });
});

export default router;
