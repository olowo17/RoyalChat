import {NextFunction, Request, Response} from "express";
import  jwt, {Secret} from "jsonwebtoken";
import User from "model/User";


// Define the `user` property and its type

declare module 'express-serve-static-core' {
    interface Request {
        user?: any; 
    }
}

const authGuard = async(
    req: Request,
    res: Response,
    next: NextFunction
) =>{
    let token:string = " ";

    if (req.headers.authorization && req.headers.authorization.startsWith("Bearer")) {
        try {
           token= req.headers.authorization.split(" ")[1]; 

           const decoded: any = jwt.verify(token, process.env.JWT_SECRET);

           req.user = (await User.findById(decoded.id)).isSelected("-password");
           next()
        } catch (error) {
            res.status(401).json({message:"Token failed, you are not authorized"})
        }
    }

    if(!token){
        res.status(401).json({message:"Token failed, no token provided"})
    }
};

export {authGuard};