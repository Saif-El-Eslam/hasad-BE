import { body } from "express-validator";

const email = () =>
  body("email").isString().bail().isEmail().withMessage("Email is invalid");
export const recoveryRequest = [email()];
export const recoveryConfirm = [
  email(),
  body("otp")
    .isString()
    .bail()
    .matches(/^\d{6}$/)
    .withMessage("Invalid OTP"),
  body("password")
    .isString()
    .bail()
    .isLength({ min: 8 })
    .withMessage("Password must be at least 8 characters")
    .custom((value) => Buffer.byteLength(value, "utf8") <= 72)
    .withMessage("Password must not exceed 72 UTF-8 bytes"),
  body("verify_password")
    .custom(
      (value, { req }) =>
        typeof value === "string" && value === req.body.password,
    )
    .withMessage("Passwords do not match"),
];
