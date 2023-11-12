import { Request, Response } from "express";
import { BaseEntity, EntityTarget, FindOneOptions, Repository } from "typeorm";

import { getExpressAppInstance } from "../appInstance";

import { ValidationErrorItem } from "joi";

export default abstract class BaseController<MODEL extends BaseEntity> {
  protected entityRepository: Repository<MODEL>;
  protected entity: MODEL;
  private dbManager;

  constructor(entity: MODEL) {
    this.entity = entity;
  }

  protected getRepository() {
    if (!this.dbManager) {
      this.dbManager = getExpressAppInstance()?.dbManager;
    }

    if (!this.entityRepository) {
      this.entityRepository = this.dbManager
        .getDataSource()
        .getRepository(this.entity.constructor as EntityTarget<MODEL>);
    }
    return this.entityRepository;
  }

  public async create(req: Request, res: Response, entity: MODEL) {
    try {
      await this.getRepository().save(entity);
      res.status(201).json({
        status: "ok",
        message: "created",
        data: entity,
      });
    } catch (error) {
      BaseController.sendISE(res, error);
    }
  }

  public async createWithValidator(
    req: Request,
    res: Response,
    validateFunction: () => Promise<void>,
    entity: MODEL
  ) {
    try {
      await validateFunction();
      return this.create(req, res, entity);
    } catch (error) {
      if (error.name === "ValidationError") {
        return BaseController.sendValidationError(res, error.details);
      } else {
        return BaseController.sendISE(res, error);
      }
    }
  }

  public async getSingle(
    req: Request,
    res: Response,
    options: FindOneOptions<MODEL>
  ) {
    try {
      const entity = await this.getRepository().findOne(options);
      res.status(200).json({
        status: "ok",
        message: "retrieved",
        data: entity,
      });
    } catch (error) {
      BaseController.sendISE(res, error);
    }
  }

  public async getAll(
    req: Request,
    res: Response,
    options: FindOneOptions<MODEL>
  ) {
    let page: number = Number(req.query.page) || 1;
    let itemPerPage: number = Number(req.query.itemPerPage) || 10;

    try {
      const [entities, totalCount] = await this.getRepository().findAndCount({
        ...options,
        skip: (page - 1) * itemPerPage,
        take: itemPerPage,
      });

      res.status(200).json({
        status: "ok",
        message: "retrieved",
        data: entities,
        paging: {
          page: page,
          itemPerPage: itemPerPage,
          itemCount: totalCount,
          lastPage: Math.ceil(totalCount / itemPerPage),
        },
      });
    } catch (error) {
      BaseController.sendISE(res, error);
    }
  }

  public async delete(
    req: Request,
    res: Response,
    options: FindOneOptions<MODEL>
  ) {
    try {
      const entity = await this.getRepository().findOne(options);
      if (!entity) {
        res.status(404).json({
          status: "not_found",
          message: "Entity not found",
        });
        return;
      }
      await entity.remove();
      res.status(200).json({
        status: "ok",
        message: "deleted",
        data: entity,
      });
    } catch (error) {
      BaseController.sendISE(res, error);
    }
  }

  public async update(
    req: Request,
    res: Response,
    options: FindOneOptions<MODEL>
  ) {
    try {
      const entity = await this.getRepository().findOne(options);
      if (!entity) {
        res.status(404).json({
          status: "not_found",
          message: "Entity not found",
        });
        return;
      }
      Object.assign(entity, req.body);
      await entity.save();

      res.status(200).json({
        status: "ok",
        message: "updated",
        data: entity,
      });
    } catch (error) {
      BaseController.sendISE(res, error);
    }
  }

  private static formatValidationErrors(errors: ValidationErrorItem[]): {
    [field: string]: string[];
  } {
    const something: { field: string; message: string }[] = errors.map(
      (error) => ({
        field: error.context?.label || error.path.join("."),
        message: error.message.replace(/["]/g, ""),
      })
    );

    const groupedErrors: {
      [field: string]: string[];
    } = something.reduce((acc, error) => {
      const { field, message } = error;
      if (!acc[field]) {
        acc[field] = [message];
      } else {
        acc[field].push(message);
      }
      return acc;
    }, {});

    return groupedErrors;
  }

  public static sendValidationError(
    res: Response,
    errors: ValidationErrorItem[] | { [x: string]: string[] }
  ): void {
    const status = 400;
    const validationErrors: { [x: string]: string[] } = Array.isArray(errors)
      ? this.formatValidationErrors(errors)
      : errors;
    res.status(status).json({
      status,
      error: validationErrors,
      message: "Validation failed",
    });
  }

  public static sendISE(res: Response, error: any) {
    console.error("Error happened:", error);
    res.status(500).json({
      status: "failed",
      message: "internal_server_error",
      errors: error,
    });
  }

  public static sendResponseOk(res: Response, data: any): void {
    res.status(200).json({
      message: "success",
      data,
    });
  }
}
