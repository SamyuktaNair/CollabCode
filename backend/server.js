import express from "express";
import http from "http";
import {Server} from "socket.io"
import cors from "cors"
import axios from "axios";
import Redis from "ioredis";
import {createAdapter} from "@socket.io/redis-adapter"

const app=express();

app.use(express.json())

const server=http.createServer(app);

const io=new Server(server,{
    cors:{
        origin:"*",
    }
})

const pubClient=new Redis();
const subClient=pubClient.duplicate();

pubClient.on("error", (err) => console.error("Redis pubClient error:", err));
subClient.on("error", (err) => console.error("Redis subClient error:", err));

io.adapter(createAdapter(pubClient,subClient))
const redis=new Redis();

// const rooms=new Map()

async function addUserToRoom(roomId,userName){
    const roomKey=`room:${roomId}:users`;
    await redis.sadd(roomKey,userName);
}

async function removeUserFromRoom(roomId,userName){
    const roomKey=`room:${roomId}:users`;
    await redis.srem(roomKey,userName);
}

async function getUsersInRoom(roomId){
    const roomKey=`room:${roomId}:users`;
    return await redis.smembers(roomKey);
    
}

async function saveCode(roomId,code){
    await redis.hset(`room:${roomId}`, "code", code);
}

async function getCode(roomId){
    return await redis.hget(`room:${roomId}`,"code") || "";
}

async function saveOutput(roomId,output){
    await redis.hset(`room:${roomId}`,"output",output);
}

io.on("connection",(socket)=>{
    console.log("User connected",socket.id)

    let currentRoom=null;
    let currentUser=null;
    socket.on("join",async({roomId,userName})=>{
        if(currentRoom){
            socket.leave(currentRoom);
            await removeUserFromRoom(currentRoom,currentUser);
            const users=await getUsersInRoom(currentRoom);
            io.to(currentRoom).emit("UserJoined",users)
        }

        currentRoom=roomId;
        currentUser=userName;

        socket.join(roomId)
        
        await addUserToRoom(roomId,userName);
        const code=await getCode(roomId);
        socket.emit("codeUpdate",code);

        const users=await getUsersInRoom(roomId);
        io.to(roomId).emit("UserJoined",users)
    })


    socket.on("code-change",async ({roomId,code})=>{
        await saveCode(roomId,code);
        socket.to(roomId).emit("codeUpdate",code)
    })

    socket.on("leaveRoom",async ()=>{
        if (currentRoom && currentUser){
            await removeUserFromRoom(currentRoom, currentUser);
            const users = await getUsersInRoom(currentRoom);
            io.to(currentRoom).emit("UserJoined", users);

            socket.leave(currentRoom);
            currentRoom = null;
            currentUser = null;

        }
    })

    socket.on('typing',({roomId,userName})=>{
        socket.to(roomId).emit("userTyping",userName)
    })

    socket.on("languageChange",({roomId,language})=>{
        io.to(roomId).emit('languageUpdate',language)
    })

    socket.on("compileCode",async({code,roomId,language,version,input})=>{
        try{
            
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

            await saveOutput(roomId,response.data.run .output);
            io.to(roomId).emit("codeResponse",response.data)
        }
        catch(err){
            console.error("Error compiling code:",err);
            socket.emit("codeResponse", { run: { output: "Compilation failed." } });
        }
    })

    socket.on("disconnect",async ()=>{
        if(currentRoom && currentUser){
            await removeUserFromRoom(currentRoom,currentUser);
            const users=await getUsersInRoom(currentRoom);
            io.to(currentRoom).emit("UserJoined",users)
        }
        console.log("User Disconnected")
    })

})

const port=5001;
server.listen(port,()=>{
    console.log(`Yo, Server is listening on port ${port}`)
})