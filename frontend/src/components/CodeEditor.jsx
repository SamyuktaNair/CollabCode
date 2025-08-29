import React, { useEffect, useRef, useState, version } from 'react'
import Editor from '@monaco-editor/react'
import LanguageSelect from './LanguageSelector'
import { boilerplates } from './boilerplate'
import io from "socket.io-client"
import socket from '../socket'
import { runtimeVersions } from './languages'

// const socket=io("http://localhost:5001")
const CodeEditor = ({roomId,userName}) => {
    const editorRef=useRef()
    const [value , setValue]=useState(boilerplates.javascript)
    const [language,setLanguage]=useState('javascript')
    const [output,setOutput]=useState("")
    const [input,setUserInput]=useState("")

    
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
        <LanguageSelect language={language} setLanguage={handleLanguageChange}/>
        
        <div style={{ height: '90vh', width:'90vh'}}>
      <Editor
        height="100%"
        theme="vs-dark"
        language={language}
        //defaultLanguage="javascript"
        defaultValue="// Welcome... Start typing..."
        value={value}
        onChange={handleChange}
        onMount={onMount}
      />
    </div>
    <button onClick={runCode} >
          Run Code
    </button>

    <div style={{
                    height: '90vh',
                    width: '40vh',
                    background: "#1e1e1e",
                    color: "#fff",
                    padding: "10px",
                    borderRadius: "8px",
                    overflowY: "auto"
                }}>
                    <h3>Output:</h3>
                    <pre>{output || "Run your code to see output..."}</pre>
      </div>
    </>
    
    )
}

export default CodeEditor



