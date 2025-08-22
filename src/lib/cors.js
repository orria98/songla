export function cors(req, res, next) {
  const allowedOrigins = [process.env.ALLOWED_ORIGIN];

  console.log("Incoming Origin: ", req.headers.origin);

  if (allowedOrigins.includes(req.headers.origin)) {
    res.header("Access-Control-Allow-Origin", req.headers.origin);
    console.log("CORS headers set for allowed origin.");
  } else {
    console.log("Origin not allowed: ", req.headers.origin);
  }

  res.header("Access-Control-Allow-Credentials", "true");
  res.header("Access-Control-Allow-Methods", "GET, POST, PATCH, DELETE");
  res.header(
    "Access-Control-Allow-Headers",
    "Origin, X-Requested-With, Content-Type, Accept, Authorization"
  );

  if (req.method === "OPTIONS") {
    res.header("Access-Control-Allow-Methods", "PUT, POST, PATCH, DELETE, GET");
    return res.status(200).json({});
  }

  next();
}
