import { useState } from 'react'
import { impulse_response_url } from './Constants'
import { useDispatch } from 'react-redux'
import { addFile } from './fileSlice.js'
import { decode_sbv2, decode_vagp , decode_sblk } from './AudioHandler'

{/*spoofing data*/}
const testfile = {
    name:"Track 1",
    tempo: 150,
    ticks: 480
}

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

  // take in the binary data
  let infile_array = new Uint8Array(await new Response(infile).arrayBuffer());
  let dv = new DataView(infile_array.buffer);

  // create a utf decoder
  let decoder = new TextDecoder('utf-8');
  
  // check 0x20 for four bytes "SBv2"
  let sbv2_slice = infile_array.slice(0x20, 0x24);
  let sbv2_string = decoder.decode(sbv2_slice);
  let sbv2_flag = (sbv2_string == "SBv2");
  //console.log("sbv2?:",sbv2_flag);

  // if we find them, decode the file and return
  if (sbv2_flag) {

    // decode object with all metadata structured
    let sbv2 = decode_sbv2(infile_array);

    // add the generic details
    sbv2.name = filename;
    sbv2.string = fileString;
    sbv2.extension = fileExt;
    sbv2.selected = true;

    //const dispatch = useDispatch()

    //dispatch(addFile(sbv2))
    //console.log(sbv2)

    // add the struct to the filelist after return
    return(sbv2)
  }
  

  // check 0x0 for four bytes "VAGp" or "pGAV"
  let vagp_slice = infile_array.slice(0x0, 0x4);
  let vagp_string = decoder.decode(vagp_slice);
  let vagp_flag = (vagp_string == "VAGp");
  let pgav_flag = (vagp_string == "pGAV");
  //console.log("vagp?:",vagp_flag);
  //console.log("pgav?:",pgav_flag);

  // if we find them, decode the file and return
  if (vagp_flag || pgav_flag) {

    // decode object with all metadata structured
    console.log("vagp decode")
    let vagp = decode_vagp(infile_array,pgav_flag) // second flag for little endianess

    //endianness = pgav_flag

    // add the generic details
    vagp.name = filename;
    vagp.string = fileString;
    vagp.extension = fileExt;

    // add the struct to the filelist after return
    console.log(vagp);
    return(vagp);
  }

  // is this a jak 1 sbk?
  let isJakOne = false;
  

  // check 0x18 for four bytes "SBlk"
  let sblk_slice = infile_array.slice(0x18, 0x1C);
  let sblk_string = decoder.decode(sblk_slice);
  let sblk_flag = (sblk_string == "SBlk");
  //console.log("sblk?:",sblk_flag);

  // if we don't find them, we might have a jak 1 sbk so
  if (!sblk_flag) {

    // read the number of sounds in the file from 0x14
    let num_sounds = dv.getUint32(0x14, true);
    //console.log("number of sblk1 sounds:",num_sounds);

    // starting at 0x18, skip forward by 20 for each one
    let indx = 0x18+(20*num_sounds);

    // then skip the padding of zeroes
    while (infile_array[indx] === 0) {indx++;}

    // skip ahead by 0x18 to find sblk
    indx += 0x18;

    // and check again
    let sblk_slice = infile_array.slice(indx, indx+4);
    let sblk_string = decoder.decode(sblk_slice);
    sblk_flag = (sblk_string == "SBlk");
    isJakOne = sblk_flag;
    //console.log("sblk?:",sblk_string);
    //console.log("sblk?:",sblk_flag);
    //console.log("jak1 sblk?:",true);
  }

  // if we find them, decode the file and return
  if (sblk_flag) {
    // decode object with all metadata structured
    console.log("sblk decode")
    let sblk = decode_sblk(infile_array, isJakOne)

    // add the generic details
    sblk.name = filename;
    sblk.string = fileString;
    sblk.extension = fileExt;

    // add the struct to the filelist after return
    console.log(sblk);
    return(sblk);
  }

  // read it out
  //console.log(toHexString(infile_array));

  //check some binary details

  // mus
  // - only used in jak 1 and 2
  // - header 0x0 to 0x63
  // - find "SBv2" at 0x20
  // - version number?
  // sbk
  // - for jak 1, find "03 00 00 00 02 00 00 00 18 00 00 00" to skip past sound names
  // - otherwise, find "SBlk" at 0x18
  // - version number?
  // vagwad
  // - header 0x0 to 0x2F
  // - blank 0x30 to 0x3F
  // - find "VAGp" (at 0x0) for jak 1
  // - find "pGAV" little endian (at 0x0) otherwise
  // - version number?
  // jak1, jak2, jak iii, jak x?

  // if 0x20 is SBv2 then MUS
      // use header values to decide if it's jak 1 or 2

  // if 0x0 is VAGp then jak 1 VAGWAD
  // elif 0x0 is pGAV then sequel VAGWAD

  // if 0x18 is SBlk then sequel SBK
  // else find the offset and hunt down SBlk there

  // otherwise return unknown file error

  // hand off to the correct handler

  // set_sbv2 (MUS)

  // set_vagp (SBK/VAGWAD)

  // file details, arrays: tracks, instruments, notes

  // pass metadata to json for react to see/interact with
}