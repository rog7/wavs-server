import jwt from "jsonwebtoken";

export const auth = (req: any, res: any, next: any) => {
  const authHeader = req.header("Authorization");
  if (!authHeader)
    return res.status(401).send("Access denied. No token provided.");

  const token = authHeader.split(" ")[1];

  try {
    const decoded = jwt.decode(token);
    req.user = decoded;
    next();
  } catch (error) {
    res.status(400).send({ message: "Invalid token" });
  }
};
