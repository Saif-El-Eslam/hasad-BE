import bcrypt from "bcrypt";
import userService from "../services/user_service.js";
import { validationResult } from "express-validator";
import jwt from "jsonwebtoken";
import { config } from "../config/index.js";

const register = async (req, res) => {
  const validation_result = validationResult(req);
  if (!validation_result.isEmpty()) {
    return res.status(400).json({ errors: validation_result.errors });
  }

  const { first_name, last_name, email, password, verify_password } = req.body;

  const existingUser = await userService.getUserByEmail(email);
  if (existingUser) {
    return res.status(422).json({ message: "Email already exists" });
  }

  const password_hash = await bcrypt.hash(password, 10);

  userService
    .createUser({
      first_name,
      last_name,
      email,
      password_hash,
    })
    .then((user) => {
      res.status(201).json(user);
    })
    .catch((error) => {
      res.send(error.message).status(500);
    });
};

const login = async (req, res) => {
  const validation_result = validationResult(req);
  if (!validation_result.isEmpty()) {
    return res.status(400).json({ errors: validation_result.errors });
  }

  const { email, password } = req.body;

  const user = await userService.getUserByEmail(email);
  if (!user) {
    return res.status(401).json({ message: "Invalid email or password" });
  }
  if (user.token) {
    return res.status(400).json({ message: "User already logged in" });
  }

  const password_match = await bcrypt.compare(password, user.password_hash);
  if (!password_match) {
    return res.status(401).json({ message: "Invalid email or password" });
  }

  const token = jwt.sign({ user_id: user._id, email }, config.jwtSecret, {
    expiresIn: "12h",
  });

  await userService.updateUser(user._id, { token });

  res.status(200).json({ message: "User logged in" });
};

const logout = async (req, res) => {
  const { user_id } = req;

  const user = await userService.getUserById(user_id);
  if (!user) {
    return res.status(404).json({ message: "User not found" });
  }
  if (!user.token) {
    return res.status(400).json({ message: "User already logged out" });
  }

  userService
    .updateUser(user_id, { token: null })
    .then(() => {
      res.status(204).send();
    })
    .catch((error) => {
      res.status(500).send(error.message);
    });
};

export default {
  register,
  login,
  logout,
};
