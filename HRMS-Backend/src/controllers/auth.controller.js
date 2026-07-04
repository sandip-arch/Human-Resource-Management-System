import { validationResult } from "express-validator";
import { loginUser } from "../services/auth.service.js";


export const login = async (req, res) => {
  try {

    const errors = validationResult(req);

    if (!errors.isEmpty()) {
      return res.status(400).json({
        success:false,
        errors: errors.array(),
      });
    }

    const result = await loginUser(
      req.body.email,
      req.body.password
    );

    return res.status(200).json({
      success:true,
      message:"Login Successful",
      data:result,
    });

  } catch (error) {

    return res.status(400).json({
      success:false,
      message:error.message,
    });

  }
};