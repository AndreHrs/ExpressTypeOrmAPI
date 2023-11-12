import express from "express";
import Controller from "./user.controller";

import { authenticate as localAuth } from "../../services/auth/localAuth";
import { authenticate as jwtAuth } from "../../services/auth/jwtAuth";

const router = express.Router();
const UserController = new Controller();

router.post("/register", UserController.register.bind(UserController));

router.post("/login", localAuth, UserController.login.bind(UserController));

router.get("/", jwtAuth, UserController.getSingleUser.bind(UserController));

router.put("/", jwtAuth, UserController.updateUser.bind(UserController));

export default router;
