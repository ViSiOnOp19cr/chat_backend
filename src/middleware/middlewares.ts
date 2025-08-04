import { Request, Response, NextFunction } from "express";
import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';
dotenv.config();
interface CustomRequest extends Request {
    userId?: string;
}
export const authmiddleware = (req:CustomRequest, res:Response, next:NextFunction)=>{

    const token = req.headers.authorization as string;
    if(!token){
        res.status(401).send({
            message:'unauthorized'
        });
        return;
    }
    const decoded = jwt.verify(token, process.env.JWT_SECRET as any);
    if(decoded){
        if (typeof decoded === "string") {
            res.status(403).json({
                message: "You are not logged in"
            })
            return;    
        }
        req.userId = decoded.id;
        console.log(decoded);
        next()
    }
    else{
        res.status(401).send({
            message:'unauthorized'
        });
    }
}