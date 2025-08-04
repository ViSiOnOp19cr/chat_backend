
import {Server, Socket} from 'socket.io'


const io = new Server(3005,{
    cors:{
        origin:'*',
        methods:['GET','POST','UPDATE','DELETE'],
        credentials:true
    }
});


io.on('connection', (socket:Socket)=>{
    console.log("user connected", socket.id);
    socket.on("sendMessage",(message:any)=>{
        console.log("message received", message);
        io.emit('revMessage', message);
    })
});