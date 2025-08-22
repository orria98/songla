import jwt from "jsonwebtoken";

export function verifyToken(req, res, next) {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];
  if (token == null) return res.sendStatus(401);

  const jwt_secret = process.env.JWT_SECRET;
  if (!jwt_secret) {
    console.log("JWT_SECRET is not defined");
  }
  jwt.verify(token, jwt_secret, (err, user) => {
    if (err) return res.sendStatus(403);
    req.userId = user.id;
    next();
  });
}

export default verifyToken;
