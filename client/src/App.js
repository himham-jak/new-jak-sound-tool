import React, { useEffect, useState } from 'react'
import logo from './logo.svg'
import './App.css'

{/*spoofing data*/}
const files = [
    {
      name:"Track 1",
      tempo: 150,
      ticks: 480
    },
    {
      name:"Filename.SBK",
      tempo: 123
    },
    {
      name:"Filename.MUS"
    }
  ]
function NavHeader() {
  return (
    <span class="nav-btns">
      <i class="fa fa-list"></i>
      Jak Audio Editor
      <i class="fa fa-plus"></i>
    </span>
  )
}

function NavTab(props) {
  return (
    <span class="filename">
      <h4>{props.name}</h4>
    </span>
  )
}

function WorkButton(props) {
  return (
    <div class="btn">
      <span>
        <i class={props.icon}></i>
      </span>
    </div>
  )
}

function Progress() {
  return (
    <div class="progress">
      <div class="progress-bar">
        <div class="current">
        </div>
      </div>
    </div>
  )
}

function TrackInfo(track) {
  return (
    <div class="name">
      <h2>{track.name}</h2>
      <span class="author">
        Tempo: {track.tempo}bpm 
        Ticks/Q: {track.ticks}
      </span>
    </div>
  )
}

function Controller() {
  return (
    <div class="controls">
      <WorkButton icon="fa fa-volume-up" />
      <WorkButton icon="fa fa-step-backward" />
      <WorkButton icon="fa fa-pause" />
      <WorkButton icon="fa fa-step-forward" />
      <WorkButton icon="fa fa-stop" />
      <WorkButton icon="fa fa-download" />
      <WorkButton icon="fa fa-microphone" />
    </div>
  )
}

function Track(props) {
  return (
    <div class="row">

      {/* info bar */}
      <TrackInfo name={props.name} tempo={props.tempo} ticks={props.ticks} />

      {/* progress bar */}
      <Progress />

      {/* control bar*/}
      <Controller />

    </div>
  )
}



function App() {

  return (
  <div class="box">
    <div class="columns">
      {/* file column */}
      <div class="file-column">
        {/* nav buttons */}
        <NavHeader />

        {/* file list */}
        <div class="file-list">
          {/* nav tab per file*/}
          {files.map((file) => {
            return(
              <NavTab name={file.name}/>
              )
          })}
        </div>
      </div>

      {/* right column */}
      <div class="work-column">

        {/*for each track, create a work row*/}
        {files.map((file) => {
          return(
            <Track name={file.name} tempo={file.tempo} ticks={file.ticks}/>
          )})}

      </div>

    </div>
  </div>
  )
}

export default App