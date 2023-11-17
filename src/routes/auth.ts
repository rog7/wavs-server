import express from "express";
import { SupabaseClient } from "@supabase/supabase-js";
import { auth } from "../middleware/auth";
import jwt, { JwtPayload } from "jsonwebtoken";
import { userHasActiveSubscription } from "../utils/userHasActiveSubscription";

const router = express.Router();

router.post("/sign-up", async (req: any, res: any) => {
  const supabase = req.supabase as SupabaseClient;

  const email = req.body.email;
  const password = req.body.password;

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
  });

  if (data.user?.identities?.length !== 0) {
    res.send({ success: true });
  } else {
    res.status(403).send({ message: "Account already exists" });
  }
});

router.post("/sign-in", async (req: any, res: any) => {
  const supabase = req.supabase as SupabaseClient;

  const email = req.body.email;
  const password = req.body.password;

  if (email === null || password === null) return res.status(400).send({message: "Missing parameter(s)"})

  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error === null) {
    const decoded = jwt.decode(data.session.access_token) as JwtPayload;

    const isProUser = await userHasActiveSubscription(email);

    // Create a new payload with additional data
    const newPayload = {
      ...decoded, // Include existing claims
      isProUser, // Add your additional data
    };

    const newToken = jwt.sign(newPayload, "token");

    res.header("Authorization", "Bearer " + newToken);
    res.send({ success: true });
  } else {
    res.status(error.status).send({ message: error.message });
  }
});

router.post("/reset-password", async (req: any, res: any) => {
  const supabase = req.supabase as SupabaseClient;

  const email = req.body.email;

  const { data, error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: "http://localhost:3000/update-password",
  });

  if (error === null) {
    res.send({ success: true });
  } else {
    res.status(error.status).send({ message: error.message });
  }
});

router.post("/update-password", async (req: any, res: any) => {
  const supabase = req.supabase as SupabaseClient;

  const password = req.body.password;
  const refreshToken = req.body.refreshToken;

  const { error: sessionError } = await supabase.auth.refreshSession({
    refresh_token: refreshToken,
  });

  if (sessionError === null) {
    const { data, error } = await supabase.auth.updateUser({
      password,
    });

    if (error === null) {
      res.send({ success: true });
    } else {
      res.status(error.status).send({ message: error.message });
    }
  } else {
    res.status(sessionError.status).send({ message: sessionError.message });
  }
});

router.post("/change-password", auth, async (req: any, res: any) => {
  const supabase = req.supabase as SupabaseClient;

  const oldPassword = req.body.oldPassword;
  const newPassword = req.body.newPassword;

  const authHeader = req.header("Authorization");

  const token = authHeader.split(" ")[1];

  const decoded = jwt.decode(token) as JwtPayload | null;

  if (decoded === null)
    return res.status(400).send({ message: "token is required" });

  const { data: signInData, error: signInError } =
    await supabase.auth.signInWithPassword({
      email: decoded.email,
      password: oldPassword,
    });

  if (signInData.session !== null) {
    const { data, error } = await supabase.auth.updateUser({
      password: newPassword,
    });

    if (error !== null) {
      return res.status(error.status).send({ message: error.message });
    } else {
      return res.send({ success: true });
    }
  } else {
    if (signInError?.status === 400) {
      return res.status(400).send({ message: "Invalid previous password" });
    } else {
      return res
        .status(signInError?.status)
        .send({ message: signInError?.message });
    }
  }
});

export default router;
