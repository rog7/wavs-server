import express from "express";
import cors from "cors";
import compression from "compression";
import { attachSupabase } from "./middleware/supabase";
import initializeRoutes from "./startup/routes";

const app = express();
app.use(
  cors({
    origin: "https://usewavs.com",
    exposedHeaders: ["Authorization", "Refresh-Token"],
  })
);

// Attach the supabase instance to all routes
app.use(attachSupabase);
app.use(compression());
initializeRoutes(app, express);

const port = process.env.PORT || 9000;

app.listen(port, () => {
  console.log(`Listening on port ${port}...`);
});
