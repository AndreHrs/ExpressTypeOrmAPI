import {
  BaseEntity,
  BeforeInsert,
  BeforeUpdate,
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from "typeorm";

import Expense from "../expense/expense.model";

import jwt from "jsonwebtoken";

import bcrypt from "bcrypt";

export interface IUser {
  id?: number;
  name: string;
  email: string;
  password: string;
  created_at?: Date;
  updated_at?: Date;
  deletedAt?: Date;
  expense?: Expense[];
}

@Entity()
export default class User extends BaseEntity implements IUser {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  name: string;

  @Column({ unique: true })
  email: string;

  @Column()
  password: string;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;

  @DeleteDateColumn({ type: "timestamp", default: null, nullable: true })
  deletedAt: Date;

  @OneToMany(() => Expense, (expense) => expense.user)
  expense: Expense[];

  @BeforeInsert()
  @BeforeUpdate()
  async hashPassword() {
    if (this.password) {
      const saltRounds = 10;
      this.password = await bcrypt.hash(this.password, saltRounds);
    }
  }

  async validatePassword(password: string): Promise<boolean> {
    return bcrypt.compare(password, this.password);
  }

  async generateToken(): Promise<string> {
    const user: User = this;
    const token = jwt.sign({ userId: user.id }, process.env.JWT_SECRET_KEY);
    return token;
  }

  toJson(): User {
    delete this.created_at;
    delete this.deletedAt;
    delete this.updated_at;
    delete this.password;
    return this;
  }
}
