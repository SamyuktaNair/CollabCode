import { useEffect, useState } from 'react'
import './App.css'
import CodeEditor from './components/CodeEditor'
import io from "socket.io-client"
import socket from './socket'
import {v4 as uuid} from "uuid"

// const socket=io("http://localhost:5001")
function App() {
  const [joined,setJoined]=useState(false)
  const [roomId,setRoomId]=useState("")
  const [userName,setUserName]=useState("")
  const [copySuccess,setCopySuccess]=useState("")
  const [users,setUsers]=useState([])
  const [typing,setTyping]=useState("")

  useEffect(()=>{
    socket.on("UserJoined",(users)=>{
      setUsers(users)
      //console.log(users)
    })

    socket.on("userTyping",(user)=>{
      setTyping(`${user} is typing`)
      setTimeout(()=>setTyping(""),5000)
    })

    
    return ()=>{
      socket.off("UserJoined")
      socket.off("userTyping")
    }
  },[])

  const createRoomId=()=>{
    const id=uuid()
    setRoomId(id)
  }
  const copyId=()=>{
    navigator.clipboard.writeText(roomId)
    setCopySuccess("Copied to clipboard!!")
    setTimeout(()=>setCopySuccess(''),5000)
  }

  const joinRoom=()=>{
    if(roomId && userName){
      socket.emit('join',{roomId,userName});
      setJoined(true)
    }
  }

  const leaveRoom=()=>{
    socket.emit("leaveRoom");
    setJoined(false)
    setRoomId("")
    setUserName("")
  }
  if(!joined){
    return(
      <div className="join-container">
        <div className="join-form">
          <h1>Join Room</h1>
          <input
            type="text"
            placeholder="Room Id"
            value={roomId}
            onChange={(e) => setRoomId(e.target.value)}
            className='input'
          />
          <button onClick={createRoomId}>Create Id</button>
          <input
            type="text"
            placeholder="Enter Name"
            value={userName}
            onChange={(e) => setUserName(e.target.value)}
          />
          <button onClick={joinRoom}>Join Room</button>
        </div>
      </div>
    )
  }
  
  return (
    <>
    <div className="sidebar">
      <div className="room-info">
        <h2>Room Id :{roomId}</h2>
        <button onClick={copyId}>Copy Id</button>
        {copySuccess && <span className='copy-success'>Copied to Clipboard !!</span>}
      </div>
      <div className="user-info">
      <h3>Users in Room:</h3>
        <ul>
          {
            users.map((user,index)=>
              <li key={index}>{user}</li>
            )
          }
        </ul>
      <p className='typing'>{typing}</p>
      </div>
      <button className='leave' onClick={leaveRoom}>Leave Room</button>
      

    </div>
    <div className='window'>
      <CodeEditor roomId={roomId} userName={userName}/>
    </div>
    
    </>
    
  )
}

export default App
App.js

