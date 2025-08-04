import { Request, Response } from 'express';
import { userModel } from '../models/userModel';
import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';
import bcrypt from 'bcrypt';
import cloudinary from '../lib/cloudinary';
dotenv.config();

const JWT_SECRET = process.env.JWT_SECRET as string;
type user = {
    email: string;
    password: string;
    fullName: string;
}
interface CustomRequest extends Request {
    userId?: string;
}
export const signup = async (req: Request, res: Response) => {
    try {
        const { email, password, fullName }: user = req.body;
        if (!email || !password) {
            return res.status(400).json({ message: "Email and password required" });
        }
        const userExists = await userModel.findOne({ email });
        if (userExists) {
            return res.status(400).json({ message: "User already exists" });
        }
        const hashedpassword = await bcrypt.hash(password, 10);
        const user = new userModel({
            email: email.toLowerCase(),
            password: hashedpassword,
            fullName
        });
        await user.save();
        return res.status(201).json({ message: "User created successfully" });

    } catch (err) {
        console.log(err);
        return res.status(500).json({ message: "Internal server error" });
    }
}
export const login = async (req: Request, res: Response) => {
    const { email, password }: user = req.body;
    try {
        if (!email || !password) {
            return res.status(400).json({ message: "Email and password required" });
        }
        const user = await userModel.findOne({ email });
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }
        const isPasswordcorrect = await bcrypt.compare(password, user.password);
        if (!isPasswordcorrect) {
            return res.status(400).json({ message: "Invalid password" });
        }
        const token = jwt.sign({
            id: user._id
        }, JWT_SECRET);
        return res.status(200).json({ message: "Login successful", token, userId: user._id });
    } catch (err) {
        console.log(err);
        return res.status(500).json({ message: "Internal server error" });
    }
}
export const updateProfile = async (req: CustomRequest, res: Response) => {

    try {
        const { profilePic } = req.body;
        const userId = req.userId;
        if (!profilePic) {
            return res.status(400).json({ message: "Profile picture required" });
        }
        const user = await userModel.findById(userId);
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }
        const uploadResponse = await cloudinary.uploader.upload(profilePic);
        user.profilePic = uploadResponse.secure_url;
        await user.save();
        return res.status(200).json({ message: "Profile picture updated successfully" });
    } catch (err) {
        console.log(err);
        return res.status(500).json({ message: "Internal server error" });
    }
}
export const checkAuth = (req: Request, res: Response) => {
    try {
        return res.status(200).json({ message: "User is authenticated" });
    } catch (err) {
        console.log(err);
        return res.status(500).json({ message: "Internal server error" });
    }
}
export const getProfile = async (req: CustomRequest, res: Response) => {
    try {
        const userId = req.userId;
        const user = await userModel.findById(userId).select('-password'); // Exclude password from response

        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        return res.status(200).json({ user });
    } catch (err) {
        console.log(err);
        return res.status(500).json({ message: "Internal server error" });
    }
}



