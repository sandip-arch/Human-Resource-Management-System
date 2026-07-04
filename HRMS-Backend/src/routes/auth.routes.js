import express from "express";
import { login } from "../controllers/auth.controller.js";
import { loginValidator } from "../validators/auth.validator.js";

const router = express.Router();

/*
    Base URL:
    /api/v1/auth
*/

// Login
router.post("/login", loginValidator, login);

export default router;