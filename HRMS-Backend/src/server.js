import dotenv from "dotenv";
dotenv.config();

import app from "./app.js";
import connectDB from "./config/db.js";
import seedAdmin from "./config/seedAdmin.js";

const PORT = process.env.PORT || 5000;

const startServer = async () => {
  try {
    await connectDB();
    await seedAdmin();

    app.listen(PORT, () => {
      console.log("==================================");
      console.log(`✅ MongoDB Connected`);
      console.log(`🚀 Server running on Port ${PORT}`);
      console.log(`🌐 http://localhost:${PORT}`);
      console.log("==================================");
    });

  } catch (error) {
    console.error("Server Startup Failed");
    console.error(error);
  }
};

startServer();