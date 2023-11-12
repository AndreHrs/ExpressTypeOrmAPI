import { Request, Response } from "express";
import { FindOneOptions } from "typeorm";
import BaseController from "../baseController";
import User from "./user.model";
import { createUserValidator, updateUserValidator } from "./user.validator";

export default class UserController extends BaseController<User> {
  constructor() {
    super(new User());
  }

  public async getSingleUser(req: Request, res: Response) {
    const user: User = req.user as User;
    return BaseController.sendResponseOk(res, user.toJson());
  }

  public async updateUser(req: Request, res: Response) {
    try {
      const validation = updateUserValidator.validate(req.body, {
        abortEarly: false,
      });
      if (validation.error) {
        return BaseController.sendValidationError(
          res,
          validation.error.details
        );
      }

      const user: User = req.user as User;
      delete req.body.email;
      const options: FindOneOptions<User> = {
        where: { id: user.id },
      };
      return this.update(req, res, options);
    } catch (error) {
      BaseController.sendISE(res, error);
    }
  }

  public async login(req: Request, res: Response) {
    const user: User = req.user as User;
    const token: string = await user.generateToken();
    const response = { ...user.toJson(), token };
    BaseController.sendResponseOk(res, response);
  }

  public async register(req: Request, res: Response) {
    try {
      const validation = createUserValidator.validate(req.body, {
        abortEarly: false,
      });
      if (validation.error) {
        return BaseController.sendValidationError(
          res,
          validation.error.details
        );
      }
      const user: User = new User();
      user.name = req.body.name;
      user.password = req.body.password;
      user.email = req.body.email;
      return this.create(req, res, user);
    } catch (error) {
      BaseController.sendISE(res, error);
    }
  }
}
