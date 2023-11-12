import express from "express";
import Controller from "./expense.controller";

import { authenticate as jwtAuth } from "../../services/auth/jwtAuth";

const router = express.Router();
const ExpenseController = new Controller();

router.post(
  "/",
  jwtAuth,
  ExpenseController.createExpense.bind(ExpenseController)
);

router.get(
  "/",
  jwtAuth,
  ExpenseController.getAllExpense.bind(ExpenseController)
);

router.get(
  "/:id",
  jwtAuth,
  ExpenseController.getSingleExpense.bind(ExpenseController)
);

router.put(
  "/:id",
  jwtAuth,
  ExpenseController.updateExpense.bind(ExpenseController)
);

router.delete(
  "/:id",
  jwtAuth,
  ExpenseController.deleteExpense.bind(ExpenseController)
);

export default router;
