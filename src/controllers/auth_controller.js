import bcrypt from "bcrypt";
import usersService from "../services/users_service.js";
import { validationResult } from "express-validator";
import jwt from "jsonwebtoken";
import { config } from "../config/index.js";

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

  return res.status(200).json({ message: "User logged in" });
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
  login,
  logout,
};
