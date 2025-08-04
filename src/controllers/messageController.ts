import { Request, Response } from "express";
import { Messages } from "../models/messageModel";

export const sendMessage = async (req: Request, res: Response) => {
    const { senderId, receiverId, text, image } = req.body;

    if (!senderId || !receiverId || (!text && !image)) {
        return res.status(400).json({ error: "Missing required fields" });
    }

    try {
        const message = await Messages.create({ senderId, receiverId, text, image });
        res.status(201).json(message);
    } catch (err) {
        res.status(500).json({ error: "Failed to send message" });
    }
};

export const getAllMessagesForUser = async (req: Request, res: Response) => {
    const { userId } = req.params;

    try {
        const messages = await Messages.find({
            $or: [{ senderId: userId }, { receiverId: userId }]
        }).sort({ createdAt: 1 });

        res.status(200).json(messages);
    } catch (err) {
        res.status(500).json({ error: "Failed to fetch messages" });
    }
};

export const getMessagesBetweenUsers = async (req: Request, res: Response) => {
    const { userId, otherUserId } = req.params;

    try {
        const messages = await Messages.find({
            $or: [
                { senderId: userId, receiverId: otherUserId },
                { senderId: otherUserId, receiverId: userId }
            ]
        }).sort({ createdAt: 1 });

        res.status(200).json(messages);
    } catch (err) {
        res.status(500).json({ error: "Failed to fetch chat" });
    }
};
