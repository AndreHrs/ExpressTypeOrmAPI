import passport from "passport";
import { Strategy as JwtStrategy, ExtractJwt } from "passport-jwt";
import User from "../../modules/user/user.model";
import { RequestHandler } from "express";

passport.use(
  new JwtStrategy(
    {
      secretOrKey: process.env.JWT_SECRET_KEY,
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
    },
    async (payload: any, done: any) => {
      try {
        const user = await User.findOneBy({
          id: payload.userId,
        });

        if (!user) {
          return done(null, false);
        }

        return done(null, user);
      } catch (error) {
        return done(error);
      }
    }
  )
);

// Middleware to authenticate requests
export const authenticate: RequestHandler = (req, res, next) => {
  passport.authenticate("jwt", { session: false })(req, res, next);
};
