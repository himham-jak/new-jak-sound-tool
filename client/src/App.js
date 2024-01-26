import React, { useRef, useState } from 'react'
import { load_gamefile } from './FileLoader'
import { filelist } from './AudioHandler'
import './App.css'


const fileHandOff = (event) => {
  // Access the selected files from the event object
  const files = event.target.files
  alert("Number of files selected: " + files.length)

  // Call load_gamefile for each file selected
  for (let i=0; i < files.length; i++) {
    let filee = load_gamefile(files[i])
    console.log("allduh ",filee)
  }
}


function NavHeader() {

  // Initialize the state with an empty array
  const [fileList, setFileList] = useState([]);

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
      <WorkButton icon="fa fa-play" />
      <WorkButton icon="fa fa-step-forward" />
      <WorkButton icon="fa fa-stop" />
      <WorkButton icon="fa fa-download" />
      <WorkButton icon="fa fa-microphone" />
    </div>
  )
}


function ChannelController() {
  // Initialize the checked state for each channel toggle
  const [channelToggles, setChannelToggles] = useState(new Array(16).fill(true));
  const [reverbToggle, setReverbToggle] = useState(true);

  // Calculate the channel mask
  const calcChannelMask = () => {
    let mask = 0;
    for (let i = 0; i < 16; i++) {
      if (channelToggles[i]) mask |= (1 << i);
    }
    return mask;
  };

  // Handle toggle change
  const handleToggleChange = (index) => {
    const updatedToggles = [...channelToggles];
    updatedToggles[index] = !updatedToggles[index];
    setChannelToggles(updatedToggles);
  };

  // Handle double click to toggle all checkboxes
  const handleDoubleClick = () => {
    const amtOn = channelToggles.filter(t => t).length;
    const amtOff = channelToggles.length - amtOn;
    setChannelToggles(channelToggles.map(() => amtOff > amtOn));
  };
  return (
    <div className="channel-controller">
      <table>
        <tbody>
          <tr>{channelToggles.map((_, index) => <td key={index}>{index.toString(16).toUpperCase()}</td>)}</tr>
          <tr>
            {channelToggles.map((checked, index) => (
              <td key={index}>
                <input
                  type="checkbox"
                  checked={checked}
                  onChange={() => handleToggleChange(index)}
                  onDoubleClick={handleDoubleClick}
                />
              </td>
            ))}
          </tr>
        </tbody>
      </table>
      <input
        type="checkbox"
        checked={reverbToggle}
        onChange={() => setReverbToggle(!reverbToggle)}
      />
      <label>Reverb</label>
    </div>
    )
}


function Track(props) {
  return (
    <div className="row">

      {/* info bar */}
      <TrackInfo name={props.name} tempo={props.tempo} ticks={props.ticks} />

      {/* control bar*/}
      <ChannelController />

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
            {filelist.map((file) => {
              return(
                <NavTab name={file.name}/>
                )
            })}
          </div>
        </div>

        {/* right column */}
        <div className="work-column">

          {/*for each track, create a work row*/}
          {filelist.map((file) => {
            return(
              <Track name={file.name} tempo={file.tempo} ticks={file.ticks}/>
            )})}

        </div>

      </div>
    </div>
  )
}


export default App
