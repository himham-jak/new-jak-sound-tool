import React, { useEffect, useState } from 'react'
import logo from './logo.svg'
import './App.css'

function App() {
  
  const [backendData, setBackendData] = useState([{}])

  useEffect(() => {
    fetch("/api").then(
      response => response.json()
    ).then(
      data => {
        setBackendData(data)
      }
    )
  }, [])

  return (
  <div>

    {(typeof backendData.users === 'undefined') ? (
      <p>Loading</p>
      ): (
        backendData.users.map((user, i) => (
          <p key={i}>{user}'s</p>
        ))
      )}

  </div>
  )
}

function AppDev() {

  const files = [
    "Filename.SBK","ATOLL.MUS"
    ]

  return (
  <div class="box">
    <div class="columns">
      {/* file column */}
      <div class="file-column">
        {/* nav buttons */}
        <span class="nav-btns">
          <i class="fa fa-list"></i>
          Jak Audio Editor
          <i class="fa fa-plus"></i>
        </span>

        {/* file list */}
        <div class="file-list">

        {/* nav tab per file*/}
        {files.map((name) => {
          return(
            <span class="filename">
            <h4>{name}</h4>
            </span>
            )
        })}

        </div>
      </div>
      {/* right column */}
      <div class="work-column">

        {files.map((name) => {
          return(
            <div class="row">
          <div class="name">
            <h2>{name}</h2>
            <span class="author">
              Tempo: 123bpm
            </span>
          </div>
          <div class="progress">
            <div class="progress-bar">
              <div class="current">
              </div>
            </div>
          </div>
          {/* controls */}
          <div class="controls">

            <div class="btn">
              <span>
                <i class="fa fa-volume-up"></i>
              </span>
            </div>

            <div class="btn">
              <span>
                <i class="fa fa-step-backward"></i>
              </span>
            </div>

            <div class="btn">
              <span>
                <i class="fa fa-pause"></i>
              </span>
            </div>

            <div class="btn">
              <span>
                <i class="fa fa-step-forward"></i>
              </span>
            </div>

            <div class="btn">
              <span>
                <i class="fa fa-stop"></i>
              </span>
            </div>

            <div class="btn">
              <span>
                <i class="fa fa-download"></i>
              </span>
            </div>

            <div class="btn">
              <span>
            <i class="fa fa-microphone"></i>
              </span>
            </div>

          </div>
        </div>
            )
        })}

      </div>
    </div>
  </div>
  )
}

export default AppDev
