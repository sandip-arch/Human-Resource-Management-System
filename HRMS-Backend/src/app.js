import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import cookieParser from "cookie-parser";

import authRoutes from "./routes/auth.routes.js";

const app = express();

/* ----------------------------- Middlewares ----------------------------- */

app.use(cors());

app.use(helmet());

app.use(morgan("dev"));

app.use(express.json());

app.use(express.urlencoded({ extended: true }));

app.use(cookieParser());

/* ------------------------------- Health ------------------------------- */

app.get("/", (req, res) => {
    res.status(200).json({
        success: true,
        message: "HRMS Backend API is Running 🚀",
    });
});

/* -------------------------------- Routes ------------------------------- */

const API_PREFIX = "/api/v1";

app.use(`${API_PREFIX}/auth`, authRoutes);

/* -------------------------- 404 Route Handler -------------------------- */

app.use((req, res) => {
    res.status(404).json({
        success: false,
        message: "Route Not Found",
    });
});

export default app;