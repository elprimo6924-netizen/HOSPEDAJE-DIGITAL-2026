const jwt = require("jsonwebtoken");

const verifyToken = (req, res, next) => {
  const token = req.headers["authorization"];

  if (!token) {
    return res.status(403).json({ message: "No se proporcionó un token." });
  }

  try {
    const pureToken = token.replace("Bearer ", "").split(" ").pop();

    if (!process.env.JWT_SECRET) {
      throw new Error("JWT_SECRET no está definido");
    }

    const decoded = jwt.verify(pureToken, process.env.JWT_SECRET);

    req.user = decoded;
    req.usuario = decoded;
    next();
  } catch (error) {
    return res.status(401).json({ message: "Token inválido o expirado." });
  }
};

module.exports = verifyToken;
module.exports.verifyToken = verifyToken;
