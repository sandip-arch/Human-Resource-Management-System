import User from "../models/user.model.js";

const generateEmployeeId = async (name) => {
  // Split full name
  const parts = name.trim().split(" ");

  const firstName = parts[0] || "";
  const lastName = parts.length > 1 ? parts[parts.length - 1] : "";

  // First 2 letters of first name
  const firstTwo = firstName.substring(0, 2).toUpperCase();

  // Last 2 letters of last name
  const lastTwo =
    lastName.length >= 2
      ? lastName.substring(lastName.length - 2).toUpperCase()
      : "XX";

  const prefix = firstTwo + lastTwo;

  // Count existing employees with same prefix
  const count = await User.countDocuments({
    employeeId: { $regex: `^${prefix}` },
  });

  const number = String(count + 1).padStart(4, "0");

  return `${prefix}${number}`;
};

export default generateEmployeeId;