import jwt, {Secret} from "jsonwebtoken";

export const generateAccessToken = (id: string)=>{
    return jwt.sign({id}, process.env.JWT_SECRET as Secret, {
        expiresIn:'30m',
    });
};

export const generateRefreshToken = (id:string)=>{
    return jwt.sign({id}, process.env.JWT_REFRESH as Secret,{
        expiresIn:'7d'
    } );
};