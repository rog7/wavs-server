import express from "express";
import cors from "cors";
import compression from "compression";
import { attachSupabase } from "./middleware/supabase";
import initializeRoutes from "./startup/routes";
import helmet from "helmet";

const app = express();

app.use(helmet())

app.use(
  cors({
    exposedHeaders: ["Authorization", "Refresh-Token"],
  })
);

app.use(compression());

// Attach the supabase instance to all routes
app.use(attachSupabase);
initializeRoutes(app, express);

const port = process.env.PORT || 9000;

app.listen(port, () => {
  console.log(`Listening on port ${port}...`);
});
