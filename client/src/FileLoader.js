import { useState } from 'react'
import { impulse_response_url } from './Constants'
import { decode_sbv2 } from './AudioHandler'

function toHexString(byteArray) {
  return Array.from(byteArray, byte => {
    // Convert byte to a two-character hexadecimal string
    return ('0' + (byte & 0xFF).toString(16)).slice(-2);
  }).join(' ');
}

export async function load_gamefile(infile) {

  {/*spoofing data*/}
  const testfile = {
      name:"Track 1",
      tempo: 150,
      ticks: 480
  }

  // filestring.extension
  let filename = infile.name
  // filestring, extension
  let [fileString, fileExt] = infile.name.split(".")

  // binary data
  let infile_array = new Uint8Array(await new Response(infile).arrayBuffer());
  //console.log(toHexString(infile_array));

  //check some binary details
  //hand off to the correct handler

  // return object with all metadata structured
  let sbv2 = decode_sbv2(infile_array)
  return(sbv2)

  // set_sbv2 (MUS)

  // set_vagp (SBK/VAGWAD)

  // file details, arrays: tracks, instruments, notes

  // pass metadata to json for react to see/interact with
}