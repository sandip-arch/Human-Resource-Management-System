import bcrypt from "bcryptjs";
import User from "../models/user.model.js";

const seedAdmin = async () => {
  try {
    // Check if an admin already exists
    const adminExists = await User.findOne({ role: "admin" });

    if (adminExists) {
      console.log("✅ Admin already exists.");
      return;
    }

    // Hash the default password
    const hashedPassword = await bcrypt.hash("admin123", 10);

    // Create the default admin
    await User.create({
      employeeId: "ADMIN001",
      name: "System Administrator",
      email: "admin@hrms.com",
      password: hashedPassword,
      role: "admin",
    });

    console.log("🎉 Default Admin Created Successfully!");
    console.log("==================================");
    console.log("Email    : admin@hrms.com");
    console.log("Password : admin123");
    console.log("==================================");

  } catch (error) {
    console.error("❌ Failed to seed admin:", error.message);
  }
};

export default seedAdmin;