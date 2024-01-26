import { useState } from 'react'
import { impulse_response_url } from './Constants'
import { useDispatch } from 'react-redux'
import { addFile } from './fileSlice.js'
import { decode_sbv2 } from './AudioHandler'

function toHexString(byteArray) {
  return Array.from(byteArray, byte => {
    // Convert byte to a two-character hexadecimal string
    return ('0' + (byte & 0xFF).toString(16)).slice(-2);
  }).join(' ');
}

export async function load_gamefile(infile) {

  // filestring.extension
  let filename = infile.name

  // filestring, extension
  let [fileString, fileExt] = infile.name.split(".")

  // binary data
  let infile_array = new Uint8Array(await new Response(infile).arrayBuffer());

  // read it out
  //console.log(toHexString(infile_array));

  //check some binary details
  //hand off to the correct handler

  // return object with all metadata structured
  let sbv2 = decode_sbv2(infile_array)

  // add the generic details
  sbv2.name = filename
  sbv2.string = fileString
  sbv2.extension = fileExt
  sbv2.selected = true

  //const dispatch = useDispatch()

  //dispatch(addFile(sbv2))
  //console.log(sbv2)

  // add the struct to the filelist after return
  return(sbv2)

  // set_sbv2 (MUS)

  // set_vagp (SBK/VAGWAD)

  // file details, arrays: tracks, instruments, notes

  // pass metadata to json for react to see/interact with
}