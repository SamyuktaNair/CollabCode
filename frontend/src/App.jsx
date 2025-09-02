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
    <div className='app-layout'>
    <div className="sidebar">
      <div className="sidebar-section room-info">
        <h2 className="sidebar-title">Room ID</h2>
        <p className="room-id">{roomId}</p>
        <button className="copy-btn" onClick={copyId}>Copy ID</button>
        {copySuccess && <span className="copy-success">{copySuccess}</span>}
      </div>

      <div className="sidebar-section user-info">
        <h3 className="sidebar-title">Users in Room</h3>
        <ul className="user-list">
          {users.map((user,index)=>
            <li key={index} className="user-item">{user}</li>
          )}
        </ul>
        <p className="typing">{typing}</p>
  </div>

  <div className="sidebar-section">
    <button className="leave-btn" onClick={leaveRoom}>Leave Room</button>
  </div>
  </div>
    <div className='window'>
      <CodeEditor roomId={roomId} userName={userName}/>
    </div>
    </div>

    
    
    </>
    
  )
}

export default App
App.js

