import bcrypt from "bcryptjs";
import User from "../models/user.model.js";
import generateToken from "../utils/generateToken.js";


export const loginUser = async (email, password) => {
  // Find User
  const user = await User.findOne({ email }).select("+password");

  if (!user) {
    throw new Error("Invalid email or password");
  }

  // Compare Password
  const isMatch = await bcrypt.compare(password, user.password);

  if (!isMatch) {
    throw new Error("Invalid email or password");
  }

  // Generate Token
  const token = generateToken(user._id, user.role);

  // Remove password before sending
  user.password = undefined;

  return {
    token,
    user,
  };
};