import React, { useRef, useState } from 'react'
import { load_gamefile } from './FileLoader'
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


const fileHandOff = (event) => {
  // Access the selected files from the event object
  const files = event.target.files
  alert("Number of files selected: " + files.length)

  // Call load_gamefile for each file selected
  for (let i=0; i < files.length; i++) {
    load_gamefile(files[i])
  }
}


function NavHeader() {
  return (
    <span className="nav-btns">
      <i className="fa fa-list"></i>
      Jak Audio Editor
      <input type="file" id="fileinput" name="file" onChange={fileHandOff} multiple="multiple"/>
      <label for="fileinput">
        <i className="fa fa-plus" onClick={()=>{}}></i>
      </label>
    </span>
  )
}


function NavTab(props) {
  return (
    <span className="filename">
      <h4>{props.name}</h4>
    </span>
  )
}


function WorkButton(props) {
  return (
    <div className="btn">
      <span>
        <i className={props.icon}></i>
      </span>
    </div>
  )
}


function Slider() {

  // State to store the value of the slider
  const [sliderValue, setSliderValue] = useState(50); // Assuming 50 is the default value

  // Event handler for when the slider value changes
  const handleSliderChange = (event) => {
    const newValue = event.target.value;
    setSliderValue(newValue); // Update the state with the new value
  };

  return (
    <div className="sliderDiv">
      <span className="label">{sliderValue}</span> 
      <input type="range" min="0" max="100" value={sliderValue} onChange={handleSliderChange} className="slider"/>
    </div>
  )
}


function TrackInfo(track) {
  return (
    <div className="name">
      <h2>{track.name}</h2>
      <span className="author">
        Tempo: {track.tempo}bpm 
        Ticks/Q: {track.ticks}
      </span>
    </div>
  )
}


function Controller() {
  return (
    <div className="controls">
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
    <div className="row">

      {/* info bar */}
      <TrackInfo name={props.name} tempo={props.tempo} ticks={props.ticks} />

      {/* slider bar */}
      <Slider />

      {/* control bar*/}
      <Controller />

    </div>
  )
}

function App() {

  return (
    <div className="box">
      <div className="columns">
        {/* file column */}
        <div className="file-column">
          {/* nav buttons */}
          <NavHeader />

          {/* file list */}
          <div className="file-list">
            {/* nav tab per file*/}
            {files.map((file) => {
              return(
                <NavTab name={file.name}/>
                )
            })}
          </div>
        </div>

        {/* right column */}
        <div className="work-column">

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
