import { createSlice } from '@reduxjs/toolkit'

{/*spoofing data*/}
const testfile = {
    name:"Track 1",
    tempo: 150,
    ticks: 480
}

const initialState = {

  filelist: []
}

export const fileSlice = createSlice({
  name: 'file',
  initialState,
  reducers: {
    addFile: (state, action) => {
    // action.payload is the json object to be pushed to the filelist array
      state.filelist = [...state.filelist, action.payload]
    },
    removeFile: (state, action) => {
      // action.payload is the index of the file to remove
      state.filelist = state.filelist.filter((item, index) => index !== action.payload);
    },
    selectFile: (state, action) => {
      // action.payload is the index of the file to select
      const object = state.filelist[action.payload]
      object.selected = !object.selected;
      object.selected = true;
    },
    deselectFile: (state, action) => {
      // action.payload is the index of the file to deselect
      const object = state.filelist[action.payload]
      object.selected = false;
    },
    toggleSelectFile: (state, action) => {
      // action.payload is the index of the file to deselect
      const object = state.filelist[action.payload]
      object.selected = !object.selected;
    },
  }
})

export const { addFile, removeFile, selectFile, deselectFile } = fileSlice.actions

export default fileSlice.reducer