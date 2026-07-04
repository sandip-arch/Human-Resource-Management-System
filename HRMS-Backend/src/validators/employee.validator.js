import { body } from "express-validator";

export const createEmployeeValidator = [
  body("name")
    .trim()
    .notEmpty()
    .withMessage("Employee name is required"),

  body("email")
    .trim()
    .isEmail()
    .withMessage("Valid email is required"),

  body("password")
    .isLength({ min: 6 })
    .withMessage("Password must be at least 6 characters"),
];