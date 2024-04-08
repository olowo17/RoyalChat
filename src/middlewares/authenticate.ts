import { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken";
import User from "../model/User";
import ErrorResponse from "../utils/errorResponse";

// Define the custom JWT payload interface
interface MyJwtPayload extends jwt.JwtPayload {
  _id: string;
}

// Extend the Request interface to include the user property
declare global {
  namespace Express {
    interface Request {
      user?: any;
    }
  }
}

const authGuard = async (req: Request, res: Response, next: NextFunction) => {
  let token;

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith("Bearer")
  ) {
    // Set token from Bearer token in header
    token = req.headers.authorization.split(" ")[1];
    // Set token from cookie, could use either the header or cookie option
  }
  // else if (req.cookies.token) {
  //   token = req.cookies.token;
  // }

  // Make sure token exists
  if (!token) {
    return next(new ErrorResponse("Not authorized to access this route", 401));
  }

  try {
    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET) as MyJwtPayload;
    console.log("decoded", decoded);

    // Find the loggedIn user who now has a token and save it into a variable called user in the request object
    // so routes that are using the protected middleware can have access to this
    // This actually originated from the User scehma. a method was attached to it
    console.log("id", decoded.id);
    req.user = await User.findById(decoded.id);

    next();
  } catch (err) {
    return next(new ErrorResponse("Not authorized to access this route", 401));
  }
};

export { authGuard };
