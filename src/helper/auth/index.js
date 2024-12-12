const jwt = require("jsonwebtoken");

const generateToken = async (payload) => {
  let token = jwt.sign(payload, "randomstringforjsonwebtoken");
  return token;
};

const getToken = (headers) => {
  if (
    headers &&
    headers.authorization &&
    headers.authorization.includes("Bearer")
  ) {
    const parted = headers.authorization.split(" ");
    if (parted.length === 2) {
      return parted[1];
    }
  }
  return undefined;
};

const verifyToken = async (req, res, next) => {
  const result = {
    err: null,
    data: null,
  };
  const token = getToken(req.headers);
  if (!token) {
    result.err = "Token tidak valid atau kedaluwarsa";
    return res.status(401).send(result);
  }

  try {
    let decodedToken = jwt.verify(token, "randomstringforjsonwebtoken");
    req.decodedToken = decodedToken;
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      result.err = "Access token expired";
      return res.status(498).send(result);
    }
    result.err = "Invalid token";
    return res.status(401).send(result);
  }
  next();
};

module.exports = {
  generateToken,
  verifyToken,
};
