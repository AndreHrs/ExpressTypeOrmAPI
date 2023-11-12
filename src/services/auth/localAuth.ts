import { RequestHandler } from "express";
import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import User from "../../modules/user/user.model";

passport.use(
  new LocalStrategy(
    {
      usernameField: "email",
    },
    async (email: string, password: string, done: any) => {
      try {
        const user: User = await User.findOneBy({ email: email });

        if (!user) {
          return done(null, false);
        }

        const isValidPassword = await user.validatePassword(password);

        if (isValidPassword) {
          return done(null, user);
        } else {
          return done(null, false);
        }
      } catch (error) {
        return done(error);
      }
    }
  )
);

// Middleware to authenticate requests
export const authenticate: RequestHandler = (req, res, next) => {
  passport.authenticate("local", { session: false })(req, res, next);
};
