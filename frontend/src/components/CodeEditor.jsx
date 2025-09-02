import React, { useEffect, useRef, useState, version } from 'react'
import Editor from '@monaco-editor/react'
import LanguageSelect from './LanguageSelector'
import { boilerplates } from './boilerplate'
import io from "socket.io-client"
import socket from '../socket'
import { runtimeVersions } from './languages'
import "./editor.css"

// const socket=io("http://localhost:5001")
const CodeEditor = ({roomId,userName}) => {
    const editorRef=useRef()
    const [value , setValue]=useState(boilerplates.javascript)
    const [language,setLanguage]=useState('javascript')
    const [output,setOutput]=useState("")
    const [input,setUserInput]=useState("")
    const [toggle,setToggle]=useState(true)

    
    useEffect(()=>{
      socket.on("codeUpdate",(code)=>{
        setValue(code)
      })

      socket.on("languageUpdate",(language)=>{
        setLanguage(language)
      })

      socket.on("codeResponse",(data)=>{
        setOutput(data.run.output)
      })

      return ()=> {
        socket.off("codeUpdate")
        socket.off("languageUpdate")
        socket.off("codeResponse")
      }
    },[])
    function onMount(editor){
        editorRef.current=editor;
        editor.focus();
    }

    function handleLanguageChange(lang){
        setLanguage(lang)
        setValue(boilerplates[lang] || " ")
        socket.emit("languageChange",{
          roomId,
          language:lang
        })
    }

    function handleChange(newCode){
        setValue(newCode)

        socket.emit("code-change",{
          roomId,
          code:newCode
        })
        socket.emit("typing",{
          roomId,
          userName
        })
    }

    function runCode(){
      socket.emit("compileCode",{
        code:value,
        roomId,
        language,
        version:runtimeVersions[language],
        input 
      })
    }
    

    return (
        <>
        <div className="header">
          <LanguageSelect language={language} setLanguage={handleLanguageChange}/>
          <button className='button' onClick={runCode} >
            Run Code
          </button>
        </div>
        
        
        <div className="editor-wrapper">
      <Editor
        height="100%"
        width="100%"
        theme="vs-dark"
        language={language}
        //defaultLanguage="javascript"
        defaultValue="// Welcome... Start typing..."
        value={value}
        onChange={handleChange}
        onMount={onMount}
      />
        </div>
        <div className="parent">

          <button className='toggle-button' onClick={()=>setToggle(!toggle)}>{toggle ? "Custom Input" : "Output"}</button>
    
          {toggle ? 
            <div className="output-section">
            <h3>Output:</h3>
            <pre>{output || "Run your code to see output..."}</pre>
          </div> :

            <div className="input-section">
            <h3>Custom Input:</h3>
            <textarea
              value={input}
              className='custom-input'
              onChange={(e) => setUserInput(e.target.value)}
              placeholder="Enter custom input for your code here..."
            />
          </div>

          }
          
        </div>
      
    
    </>
    
    )
}

export default CodeEditor



