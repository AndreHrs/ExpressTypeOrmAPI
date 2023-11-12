import express from "express";

import userRoutes from "./user/user.routes";
import expenseRoutes from "./expense/expense.routes";

const router = express.Router();

router.use("/users", userRoutes);
router.use("/expenses", expenseRoutes);

export default router;
