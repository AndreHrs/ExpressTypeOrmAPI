import { Request, Response } from "express";
import { FindOneOptions } from "typeorm";
import BaseController from "../baseController";
import Expense from "./expense.model";
import { createExpenseValidator } from "./expense.validator";
import User from "../user/user.model";

export default class ExpenseController extends BaseController<Expense> {
  constructor() {
    super(new Expense());
  }

  public async createExpense(req: Request, res: Response) {
    const user: User = req.user as User;
    const validationFunction = async (): Promise<void> => {
      return createExpenseValidator.validateAsync(
        { ...req.body, userId: user.id },
        {
          abortEarly: false,
        }
      );
    };

    const expense: Expense = new Expense();
    expense.amount = req.body.amount;
    expense.note = req.body.note;
    expense.type = req.body.type;
    expense.user = user;
    return this.createWithValidator(req, res, validationFunction, expense);
  }

  public async getSingleExpense(req: Request, res: Response) {
    const user: User = req.user as User;
    const options: FindOneOptions<Expense> = {
      where: { id: req.params.id },
    };
    try {
      const entity = await this.getRepository().findOne(options);
      if (this.haveAccess(res, entity, user)) {
        res.status(200).json({
          status: "ok",
          message: "retrieved",
          data: entity,
        });
      }
    } catch (error) {
      BaseController.sendISE(res, error);
    }
  }

  public async getAllExpense(req: Request, res: Response) {
    const user: User = req.user as User;
    const options: FindOneOptions<Expense> = {
      where: {
        user: { id: user.id },
      },
      order: {
        created_at: "DESC",
      },
    };
    return this.getAll(req, res, options);
  }

  public async deleteExpense(req: Request, res: Response) {
    const user: User = req.user as User;

    const options: FindOneOptions<Expense> = {
      where: { id: req.params.id },
    };

    try {
      const entity = await this.getRepository().findOne(options);
      if (this.haveAccess(res, entity, user)) {
        await entity.remove();
        res.status(200).json({
          status: "ok",
          message: "deleted",
          data: entity,
        });
      }
    } catch (error) {
      BaseController.sendISE(res, error);
    }
  }

  public async updateExpense(req: Request, res: Response) {
    const user: User = req.user as User;
    const options: FindOneOptions<Expense> = {
      where: { id: req.params.id },
    };

    try {
      const entity = await this.getRepository().findOne(options);
      if (this.haveAccess(res, entity, user)) {
        delete req.body.userId;
        Object.assign(entity, req.body);
        await entity.save();

        res.status(200).json({
          status: "ok",
          message: "updated",
          data: entity,
        });
      }
    } catch (error) {
      BaseController.sendISE(res, error);
    }
  }

  private haveAccess(res: Response, expense: Expense, user: User): boolean {
    if (!expense) {
      res.status(404).json({
        status: "not_found",
        message: "Entity not found",
      });
      return false;
    }

    if (expense.userId != user.id) {
      res.status(403).json({
        status: "ok",
        message: "forbidden",
      });
      return false;
    }
    return true;
  }
}
