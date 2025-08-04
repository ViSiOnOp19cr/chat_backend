import express from 'express';
import { createServer } from 'http';
import { Server, Socket } from 'socket.io';
import dotenv from 'dotenv';
import Redis from 'ioredis';
import { createAdapter } from "@socket.io/redis-adapter";

dotenv.config();

interface MessagePayload {
    receiverId: string;
    message: string;
}

const app = express();
const httpserver = createServer(app);
const PORT = process.env.PORT;
const pub = new Redis();
const sub = new Redis();


const io = new Server(httpserver, {
    cors: {
        origin: '*',
        methods: ['GET', 'POST', 'UPDATE', 'DELETE'],
        credentials: true
    }
});

io.adapter(createAdapter(pub, sub));


io.on('connection', (socket: Socket) => {
    console.log("user connected", socket.id);
    socket.on('addUser', async (userId) => {
        try {
            if (!userId || typeof userId !== 'string' || userId.trim() === '') {
                console.warn(`Invalid userId received:`, userId);
                return;
            }
            console.log(`Adding user: ${userId} with socket: ${socket.id}`);
            await pub.hset("online_users", userId, socket.id);
            const users = await pub.hkeys("online_users");
            io.emit('getonlineusers', users);
        } catch (err) {
            console.error("Error in addUser:", err);
        }
    })

    socket.on("sendMessage", async (data: MessagePayload) => {
        const receiverId = data.receiverId;
        const message = data.message;
        if (!receiverId || !message) {
            return;
        }
        const receiverSocketId = await pub.hget("online_users", receiverId);
        if (receiverSocketId) {
            io.to(receiverSocketId).emit("getMessage", message);
        }
    });
    socket.on('disconnect', async () => {
        const keys = await pub.hkeys("online_users");
        for (const userId of keys) {
            const id = await pub.hget("online_users", userId);
            if (id === socket.id) {
                await pub.hdel("online_users", userId);
                break;
            }
        }
        const users = await pub.hkeys("online_users");
        io.emit("getonlineusers", users);
    })
});


httpserver.listen(PORT, () => {
    console.log(`server running on port ${PORT}`);
});