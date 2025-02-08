import bcrypt from "bcrypt";
import usersService from "../services/users_service.js";
import { validationResult } from "express-validator";
import jwt from "jsonwebtoken";
import { config } from "../config/index.js";
import { totp } from "otplib";
import sendTransactionalEmail from "../config/mailer.js";
import {
  uploadSingleFileToCloudinary,
  deleteFilesFromCloudinary,
} from "../middlewares/imageUploaderMiddleware.js";

const register = async (req, res) => {
  const validation_result = validationResult(req);
  if (!validation_result.isEmpty()) {
    return res.status(400).json({ errors: validation_result.errors });
  }

  const { first_name, last_name, email, password, verify_password } = req.body;

  const existingUser = await usersService.getUserByEmail(email);
  if (existingUser) {
    return res.status(422).json({ message: "Email already exists" });
  }

  const password_hash = await bcrypt.hash(password, 10);

  usersService
    .createUser({
      first_name,
      last_name,
      email,
      password_hash,
    })
    .then((user) => {
      return res.status(201).json(user);
    })
    .catch((error) => {
      return res.send(error.message).status(500);
    });
};

const uploadProfilePicture = async (req, res) => {
  const validation_result = validationResult(req);
  if (!validation_result.isEmpty()) {
    return res.status(400).json({ errors: validation_result.errors });
  }
  try {
    const userId = req.user_id;
    const user = await usersService.getUserById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    if (user.img_url) {
      const imageUrl = user.img_url;
      await deleteFilesFromCloudinary([imageUrl]);

      user.img_url = null;
    }

    // Upload the file to Cloudinary
    const folder = "profiles";
    const imageUrl = await uploadSingleFileToCloudinary(req.file, folder);

    user.img_url = imageUrl;
    await user.save();

    // Respond with the updated profile picture URL
    return res.status(200).json({
      message: "Profile picture uploaded successfully",
      profilePicture: imageUrl,
    });
  } catch (error) {
    console.error("Error uploading profile picture:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

const deleteProfilePicture = async (req, res) => {
  const validation_result = validationResult(req);
  if (!validation_result.isEmpty()) {
    return res.status(400).json({ errors: validation_result.errors });
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

    const imageUrl = user.img_url;
    const deleteResponse = await deleteFilesFromCloudinary([imageUrl]);

    if (deleteResponse.some((result) => result.result === "Failed to delete")) {
      return res
        .status(500)
        .json({ message: "Failed to delete the image from Cloudinary" });
    }

    user.img_url = null;
    await user.save();

    // Send success response
    return res
      .status(200)
      .json({ message: "Profile picture deleted successfully" });
  } catch (error) {
    console.error("Error deleting profile picture:", error);
    return res.status(500).json({
      message: "An error occurred while deleting the profile picture",
    });
  }
};

const verifyUserRequest = async (req, res) => {
  const validation_result = validationResult(req);
  if (!validation_result.isEmpty()) {
    return res.status(400).json({ errors: validation_result.errors });
  }
  const { user_id, email } = req;

  try {
    const user = await usersService.getUserById(user_id);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    if (user.verified) {
      return res.status(400).json({ message: "User already verified" });
    }

    // create otp
    const otpSecret = process.env.OTP_SECRET;
    totp.options = { digits: 4 };
    const otp = totp.generate(otpSecret);

    // save otp to user
    await usersService.updateUser(user._id, { verify_otp: otp });

    const subject = "Verify your email";
    const htmlContent = `<!DOCTYPE html>
          <html>
            <body style="width:80%; background-color:#f5f5f5; padding:50px; border-radius:20px; margin:auto; font-family:Arial, sans-serif;">
              <h1 style="text-align:center; color:#2B6EE9;">Welcome to Hasad!</h1>
              <div style="width:60%; margin:auto; font-size:18px;">
                <p style="margin-top:50px;">
                  Hi ${user.first_name} ${user.last_name}, <br/><br/>
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
    await sendTransactionalEmail({
      user,
      subject,
      htmlContent,
    });

    return res.status(200).json({ message: "Verification email sent" });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

const verifyUser = async (req, res) => {
  const validation_result = validationResult(req);
  if (!validation_result.isEmpty()) {
    return res.status(400).json({ errors: validation_result.errors });
  }
  const { verify_otp } = req.body;

  try {
    const user = await usersService.getUserById(req.user_id);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    if (user.verified) {
      return res.status(400).json({ message: "User already verified" });
    }

    if (user.verify_otp !== verify_otp) {
      return res.status(400).json({ message: "Invalid OTP" });
    }

    user.verified = true;
    user.verify_otp = null;

    await user.save();

    return res.status(200).json({ message: "User verified successfully" });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

const resetPasswordRequest = async (req, res) => {
  const validation_result = validationResult(req);
  if (!validation_result.isEmpty()) {
    return res.status(400).json({ errors: validation_result.errors });
  }

  const { email } = req;

  try {
    const user = await usersService.getUserByEmail(email);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Create OTP for password reset
    const otpSecret = process.env.OTP_SECRET;
    totp.options = { digits: 4 };
    const otp = totp.generate(otpSecret);

    // Save OTP to user
    await usersService.updateUser(user._id, { verify_otp: otp });

    const subject = "Reset Your Password";
    const htmlContent = `<!DOCTYPE html>
          <html>
            <body style="width:80%; background-color:#f5f5f5; padding:50px; border-radius:20px; margin:auto; font-family:Arial, sans-serif;">
              <h1 style="text-align:center; color:#2B6EE9;">Reset Your Password</h1>
              <div style="width:60%; margin:auto; font-size:18px;">
                <p style="margin-top:50px;">
                  Hi ${user.first_name} ${user.last_name}, <br/><br/>
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
    await sendTransactionalEmail({
      user,
      subject,
      htmlContent,
    });

    return res.status(200).json({ message: "Password reset email sent" });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

const resetPassword = async (req, res) => {
  const validation_result = validationResult(req);
  if (!validation_result.isEmpty()) {
    return res.status(400).json({ errors: validation_result.errors });
  }

  const { otp, password, verify_password } = req.body;
  const { email } = req;

  try {
    // Check if user exists
    const user = await usersService.getUserByEmail(email);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Validate OTP
    if (user.verify_otp !== otp) {
      return res.status(400).json({ message: "Invalid OTP" });
    }

    // Hash new password
    const password_hash = await bcrypt.hash(password, 10);

    // Update user password and remove OTP
    await usersService.updateUser(user._id, {
      password_hash,
      verify_otp: null,
    });

    return res.status(200).json({ message: "Password reset successfully" });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

const login = async (req, res) => {
  const validation_result = validationResult(req);
  if (!validation_result.isEmpty()) {
    return res.status(400).json({ errors: validation_result.errors });
  }

  const { email, password } = req.body;

  const user = await usersService.getUserByEmail(email);
  if (!user) {
    return res.status(401).json({ message: "Invalid email or password" });
  }

  const password_match = await bcrypt.compare(password, user.password_hash);
  if (!password_match) {
    return res.status(401).json({ message: "Invalid email or password" });
  }

  const token = jwt.sign({ user_id: user._id, email }, config.jwtSecret, {
    // expiresIn: "12h", // uncomment to expire token
  });

  await usersService.updateUser(user._id, { token });

  return res.status(200).json({ message: "User logged in", token });
};

const logout = async (req, res) => {
  const { user_id } = req;

  const user = await usersService.getUserById(user_id);
  if (!user) {
    return res.status(404).json({ message: "User not found" });
  }
  if (!user.token) {
    return res.status(400).json({ message: "User already logged out" });
  }

  usersService
    .updateUser(user_id, { token: null })
    .then(() => {
      return res.status(204).send();
    })
    .catch((error) => {
      return res.status(500).send(error.message);
    });
};

export default {
  register,
  uploadProfilePicture,
  deleteProfilePicture,
  login,
  logout,
  verifyUser,
  verifyUserRequest,
  resetPassword,
  resetPasswordRequest,
};
