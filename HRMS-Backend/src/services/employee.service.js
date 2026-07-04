import bcrypt from "bcryptjs";
import User from "../models/user.model.js";
import generateEmployeeId from "../utils/generateEmployeeId.js";

export const createEmployee = async (employeeData) => {
  const { name, email, password } = employeeData;

  // Check if email already exists
  const existingUser = await User.findOne({ email });

  if (existingUser) {
    throw new Error("Employee already exists with this email.");
  }

  // Generate Employee ID
  const employeeId = await generateEmployeeId(name);

  // Hash Password
  const hashedPassword = await bcrypt.hash(password, 10);

  // Create Employee
  const employee = await User.create({
    employeeId,
    name,
    email,
    password: hashedPassword,
    role: "employee",
  });

  return employee;
};