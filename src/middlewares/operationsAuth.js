import { timingSafeEqual } from "node:crypto";

export const operationsAuth = (secret) => (req, res, next) => {
  if (!secret) return res.status(404).json({ message: "Not found" });
  const expected = Buffer.from(`Bearer ${secret}`);
  const received = Buffer.from(req.headers.authorization || "");
  if (
    received.length !== expected.length ||
    !timingSafeEqual(received, expected)
  )
    return res.status(401).json({ message: "Unauthorized" });
  res.setHeader("Cache-Control", "no-store");
  next();
};
