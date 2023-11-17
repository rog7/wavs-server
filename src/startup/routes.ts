import auth from "../routes/auth";
import chords from "../routes/chords";
import users from "../routes/users";

export default function initializeRoutes(app: any, express: any) {
  app.use(express.json());
  app.use("/api/auth", auth);
  app.use("/api/users", users);
  app.use("/api/chords", chords);
}
