import express from "express";
import http from "http";
import {Server} from "socket.io"
import cors from "cors"
import axios from "axios";


const app=express();

app.use(express.json())

const server=http.createServer(app);

const io=new Server(server,{
    cors:{
        origin:"*",
    }
})

const rooms=new Map()

io.on("connection",(socket)=>{
    console.log("User connected",socket.id)

    let currentRoom=null;
    let currentUser=null;
    socket.on("join",({roomId,userName})=>{
        if(currentRoom){
            socket.leave(currentRoom);
            rooms.get(currentRoom).users.delete(currentUser)
            io.to(currentRoom).emit("UserJoined",Array.from(rooms.get(currentRoom).users))
        }

        currentRoom=roomId;
        currentUser=userName;

        socket.join(roomId)
        if(!rooms.has(roomId)){
            rooms.set(roomId,{users:new Set(),code:""})
        }
        rooms.get(roomId).users.add(userName)
        socket.emit("codeUpdate",rooms.get(roomId).code)
        io.to(roomId).emit("UserJoined", Array.from(rooms.get(currentRoom).users))
    })


    socket.on("code-change",({roomId,code})=>{
        if(rooms.has(roomId)){
            rooms.get(roomId).code=code;
        }
        socket.to(roomId).emit("codeUpdate",code)
    })

    socket.on("leaveRoom",()=>{
        if (currentRoom && currentUser){
            rooms.get(currentRoom).users.delete(currentUser);
            io.to(currentRoom).emit("UserJoined",Array.from(rooms.get(currentRoom).users));

            socket.leave(currentRoom);
            currentRoom=null;
            currentUser=null;
        }
    })

    socket.on('typing',({roomId,userName})=>{
        socket.to(roomId).emit("userTyping",userName)
    })

    socket.on("languageChange",({roomId,language})=>{
        io.to(roomId).emit('languageUpdate',language)
    })

    socket.on("compileCode",async({code,roomId,language,version,input})=>{
        if(rooms.has(roomId)){
            const room=rooms.get(roomId)
            const response= await axios.post("https://emkc.org/api/v2/piston/execute",{
                language,
                version,
                files:[
                    {
                        content:code
                    }
                ],
                stdin:input
            })

            room.output=response.data.run.output;
            io.to(roomId).emit("codeResponse",response.data)
        }
    })

    socket.on("disconnect",()=>{
        if(currentRoom && currentUser){
            rooms.get(currentRoom).users.delete(currentUser);
            io.to(currentRoom).emit("UserJoined",Array.from(rooms.get(currentRoom).users))
        }
        console.log("User Disconnected")
    })

})

const port=5001;
server.listen(port,()=>{
    console.log(`Yo, Server is listening on port ${port}`)
})