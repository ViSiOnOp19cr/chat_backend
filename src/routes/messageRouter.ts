import express from "express";
import {
    sendMessage,
    getMessagesBetweenUsers,
    getAllMessagesForUser
} from "../controllers/messageController";

const router = express.Router();

router.post("/send", sendMessage); // send a message
router.get("/:userId", getAllMessagesForUser); // get all messages for a user
router.get("/:userId/:otherUserId", getMessagesBetweenUsers); // chat between 2 users

export { router as messageRouter };
