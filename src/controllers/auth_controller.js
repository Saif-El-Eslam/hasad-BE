import { saveWithImage, clearImage } from "../services/image_service.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import bcrypt from "bcrypt";
import usersService from "../services/users_service.js";
import { validationResult } from "express-validator";
import jwt from "jsonwebtoken";
import { config } from "../config/index.js";
import {
  issueChallenge,
  consumeChallenge,
  cancelChallenge,
} from "../services/otp_service.js";
import { escapeHtml } from "../utils/html.js";
import sendTransactionalEmail from "../config/mailer.js";

const register = async (req, res) => {
  const validation_result = validationResult(req);
  if (!validation_result.isEmpty()) {
    return res.status(400).json({
      errors: validation_result
        .array()
        .map(({ value: _value, ...error }) => error),
    });
  }

  const { first_name, last_name, email, password } = req.body;

  const existingUser = await usersService.getUserByEmail(email);
  if (existingUser) {
    return res.status(422).json({ message: "Email already exists" });
  }

  const password_hash = await bcrypt.hash(password, 10);

  const user = await usersService.createUser({
    first_name,
    last_name,
    email,
    password_hash,
  });
  return res.status(201).json(user);
};

const uploadProfilePicture = async (req, res) => {
  const validation_result = validationResult(req);
  if (!validation_result.isEmpty()) {
    return res.status(400).json({
      errors: validation_result
        .array()
        .map(({ value: _value, ...error }) => error),
    });
  }

  const userId = req.user_id;
  const user = await usersService.getUserById(userId);
  if (!user) {
    return res.status(404).json({ message: "User not found" });
  }

  await saveWithImage(user, req.file, "profiles");
  const imageUrl = user.img_url;

  // Respond with the updated profile picture URL
  return res.status(200).json({
    message: "Profile picture uploaded successfully",
    profilePicture: imageUrl,
  });
};

const deleteProfilePicture = async (req, res) => {
  const validation_result = validationResult(req);
  if (!validation_result.isEmpty()) {
    return res.status(400).json({
      errors: validation_result
        .array()
        .map(({ value: _value, ...error }) => error),
    });
  }
  try {
    const userId = req.user_id;
    const user = await usersService.getUserById(userId);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    if (!user.img_url) {
      return res.status(400).json({ message: "No profile picture to delete" });
    }

    await clearImage(user);

    // Send success response
    return res
      .status(200)
      .json({ message: "Profile picture deleted successfully" });
  } catch (error) {
    return res.status(500).json({
      message: "An error occurred while deleting the profile picture",
    });
  }
};

const verifyUserRequest = async (req, res) => {
  const validation_result = validationResult(req);
  if (!validation_result.isEmpty()) {
    return res.status(400).json({
      errors: validation_result
        .array()
        .map(({ value: _value, ...error }) => error),
    });
  }
  const { user_id } = req;

  const user = await usersService.getUserById(user_id);
  if (!user) {
    return res.status(404).json({ message: "User not found" });
  }
  if (user.verified) {
    return res.status(400).json({ message: "User already verified" });
  }

  const otp = await issueChallenge(user._id, "verify");
  const subject = "Verify your email";
  const htmlContent = `<!DOCTYPE html>
          <html>
            <body style="width:80%; background-color:#f5f5f5; padding:50px; border-radius:20px; margin:auto; font-family:Arial, sans-serif;">
              <h1 style="text-align:center; color:#2B6EE9;">Welcome to Hasad!</h1>
              <div style="width:60%; margin:auto; font-size:18px;">
                <p style="margin-top:50px;">
                  Hi ${escapeHtml(user.first_name)} ${escapeHtml(user.last_name)}, <br/><br/>
                  Thank you for signing up with <strong>Hasad</strong>! <br/>
                  We're excited to have you join our community.
                  <br/><br/>
                  To complete your registration, please verify your email address by using the OTP below.
                </p>
                <div style="width:fit-content; margin:50px auto;">
                  <div style="padding:10px; width:150px; background-color:#f5f5f5; color:#2B6EE9; border:solid 2px #2B6EE9; border-radius:5px; font-weight:bold; text-align:center;">
                    ${otp}
                  </div>
                </div>
                <p>
                  If you did not sign up for a Hasad account, please ignore this email or contact our support team for assistance.
                  <br/><br/>
                  Best regards, <br/>
                  Hasad Support Team
                </p>
              </div>
            </body>
          </html>
        `;
  try {
    await sendTransactionalEmail({ user, subject, htmlContent });
  } catch (error) {
    await cancelChallenge(user._id, "verify", otp);
    throw error;
  }

  return res.status(200).json({ message: "Verification email sent" });
};

const verifyUser = async (req, res) => {
  const validation_result = validationResult(req);
  if (!validation_result.isEmpty()) {
    return res.status(400).json({
      errors: validation_result
        .array()
        .map(({ value: _value, ...error }) => error),
    });
  }
  const { verify_otp } = req.body;

  const user = await usersService.getUserById(req.user_id);
  if (!user) {
    return res.status(404).json({ message: "User not found" });
  }
  if (user.verified) {
    return res.status(400).json({ message: "User already verified" });
  }

  if (!(await consumeChallenge(user._id, "verify", verify_otp))) {
    return res.status(400).json({ message: "Invalid OTP" });
  }

  user.verified = true;
  user.verify_otp = null;

  await user.save();

  return res.status(200).json({ message: "User verified successfully" });
};

const resetPasswordRequest = async (req, res) => {
  const validation_result = validationResult(req);
  if (!validation_result.isEmpty()) {
    return res.status(400).json({
      errors: validation_result
        .array()
        .map(({ value: _value, ...error }) => error),
    });
  }

  const { email } = req;

  const user = await usersService.getUserByEmail(email);
  if (!user) {
    return res.status(404).json({ message: "User not found" });
  }

  const otp = await issueChallenge(user._id, "reset");
  const subject = "Reset Your Password";
  const htmlContent = `<!DOCTYPE html>
          <html>
            <body style="width:80%; background-color:#f5f5f5; padding:50px; border-radius:20px; margin:auto; font-family:Arial, sans-serif;">
              <h1 style="text-align:center; color:#2B6EE9;">Reset Your Password</h1>
              <div style="width:60%; margin:auto; font-size:18px;">
                <p style="margin-top:50px;">
                  Hi ${escapeHtml(user.first_name)} ${escapeHtml(user.last_name)}, <br/><br/>
                  We received a request to reset your password for your <strong>Hasad</strong> account.
                  <br/><br/>
                  Please use the OTP below to reset your password:
                </p>
                <div style="width:fit-content; margin:50px auto;">
                  <div style="padding:10px; width:150px; background-color:#f5f5f5; color:#2B6EE9; border:solid 2px #2B6EE9; border-radius:5px; font-weight:bold; text-align:center;">
                    ${otp}
                  </div>
                </div>
                <p>
                  If you did not request a password reset, please ignore this email or contact our support team.
                  <br/><br/>
                  Best regards, <br/>
                  Hasad Support Team
                </p>
              </div>
            </body>
          </html>
        `;
  try {
    await sendTransactionalEmail({ user, subject, htmlContent });
  } catch (error) {
    await cancelChallenge(user._id, "reset", otp);
    throw error;
  }

  return res.status(200).json({ message: "Password reset email sent" });
};

const resetPassword = async (req, res) => {
  const validation_result = validationResult(req);
  if (!validation_result.isEmpty()) {
    return res.status(400).json({
      errors: validation_result
        .array()
        .map(({ value: _value, ...error }) => error),
    });
  }

  const { otp, password } = req.body;
  const { email } = req;

  // Check if user exists
  const user = await usersService.getUserByEmail(email);
  if (!user) {
    return res.status(404).json({ message: "User not found" });
  }

  // Validate OTP
  if (!(await consumeChallenge(user._id, "reset", otp))) {
    return res.status(400).json({ message: "Invalid OTP" });
  }

  // Hash new password
  const password_hash = await bcrypt.hash(password, 10);

  // Update user password and remove OTP
  await usersService.updateUser(user._id, {
    password_hash,
    verify_otp: null,
    token: null,
    $inc: { session_version: 1 },
  });

  return res.status(200).json({ message: "Password reset successfully" });
};

const login = async (req, res) => {
  const validation_result = validationResult(req);
  if (!validation_result.isEmpty()) {
    return res.status(400).json({
      errors: validation_result
        .array()
        .map(({ value: _value, ...error }) => error),
    });
  }

  const { email, password } = req.body;

  const user = await usersService.getUserByEmail(email, true);
  if (!user) {
    return res.status(401).json({ message: "Invalid email or password" });
  }

  const password_match = await bcrypt.compare(password, user.password_hash);
  if (!password_match) {
    return res.status(401).json({ message: "Invalid email or password" });
  }

  const token = jwt.sign(
    { user_id: user._id, email, session_version: user.session_version || 0 },
    config.jwtSecret,
    {
      expiresIn: config.jwtExpiresIn,
      algorithm: "HS256",
    },
  );

  await usersService.updateUser(user._id, { token });

  return res.status(200).json({ message: "User logged in", token });
};

const logout = async (req, res) => {
  const { user_id } = req;

  const user = await usersService.getUserById(user_id, true);
  if (!user) {
    return res.status(404).json({ message: "User not found" });
  }
  if (!user.token) {
    return res.status(400).json({ message: "User already logged out" });
  }

  await usersService.updateUser(user_id, {
    token: null,
    $inc: { session_version: 1 },
  });
  return res.status(204).send();
};

export default Object.fromEntries(
  Object.entries({
    register,
    uploadProfilePicture,
    deleteProfilePicture,
    login,
    logout,
    verifyUser,
    verifyUserRequest,
    resetPassword,
    resetPasswordRequest,
  }).map(([name, handler]) => [name, asyncHandler(handler)]),
);
