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
const HEARTBEAT_INTERVAL = 30000;
const USER_TTL = 60;


const io = new Server(httpserver, {
    cors: {
        origin: '*',
        methods: ['GET', 'POST', 'UPDATE', 'DELETE'],
        credentials: true
    }
});

io.adapter(createAdapter(pub, sub));

setInterval(async () => {
    try {
        const users = await pub.hkeys("online_users");
        const pipeline = pub.pipeline();
        
        for (const userId of users) {
            const exists = await pub.exists(`user_heartbeat:${userId}`);
            if (!exists) {
                pipeline.hdel("online_users", userId);
            }
        }
        
        await pipeline.exec();
        
        const activeUsers = await pub.hkeys("online_users");
        io.emit('getonlineusers', activeUsers);
    } catch (err) {
        console.error("Error in cleanup:", err);
    }
}, HEARTBEAT_INTERVAL);


io.on('connection', (socket: Socket) => {
    console.log("user connected", socket.id);
    let heartbeatInterval: NodeJS.Timeout;
    socket.on('addUser', async (userId) => {
        try {
            if (!userId || typeof userId !== 'string' || userId.trim() === '') {
                console.warn(`Invalid userId received:`, userId);
                return;
            }
            console.log(`Adding user: ${userId} with socket: ${socket.id}`);
            await pub.hset("online_users", userId, socket.id);
            await pub.setex(`user_heartbeat:${userId}`, USER_TTL, socket.id);
            heartbeatInterval = setInterval(async () => {
                try {
                    await pub.setex(`user_heartbeat:${userId}`, USER_TTL, socket.id);
                } catch (err) {
                    console.error("Heartbeat error:", err);
                }
            }, HEARTBEAT_INTERVAL);

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
        //clear heartbeat.
        if(heartbeatInterval){
            clearInterval(heartbeatInterval);
        }

        
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