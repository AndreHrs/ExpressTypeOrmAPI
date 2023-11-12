import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  BaseEntity,
  JoinColumn,
} from "typeorm";

import User from "../user/user.model";

export enum ExpenseType {
  EXPENSE = "expense",
  INCOME = "income",
}

export interface IExpense {
  id?: number;
  amount: number;
  note: string | null;
  type: ExpenseType;
  created_at?: Date;
  updated_at?: Date;
  user?: User;
  userId?: number;
}

@Entity()
export default class Expense extends BaseEntity {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column()
  amount: number;

  @Column({ nullable: true })
  note: string;

  @Column({ type: "enum", enum: ExpenseType, default: ExpenseType.EXPENSE })
  type: ExpenseType;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;

  @Column({ nullable: true })
  userId: number;

  @ManyToOne(() => User, (user) => user.expense)
  @JoinColumn({ name: "userId" })
  user: User;
}
