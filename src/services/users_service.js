import User from "../models/user.js";

// create a new user
const createUser = async (user) => {
  const newUser = new User(user);
  const savedUser = await newUser.save();
  return savedUser;
};

// get all users
const getUsers = async () => {
  const users = await User.find();
  return users;
};

// get a single user By Id
const getUserById = async (id, includeSecrets = false) => {
  const query = User.findById(id);
  if (includeSecrets) query.select("+password_hash +token +session_version");
  const user = await query;
  return user;
};

// get a single user By Email
const getUserByEmail = async (email, includeSecrets = false) => {
  const query = User.findOne({ email });
  if (includeSecrets) query.select("+password_hash +token +session_version");
  const user = await query;
  return user;
};

// update a user
const updateUser = async (id, user) => {
  const updatedUser = await User.findByIdAndUpdate(id, user, {
    new: true,
    runValidators: true,
  });
  return updatedUser;
};

// delete a user
const deleteUser = async (id) => {
  const deletedUser = await User.findByIdAndDelete(id);
  return deletedUser;
};

export default {
  createUser,
  getUsers,
  getUserById,
  getUserByEmail,
  updateUser,
  deleteUser,
};
