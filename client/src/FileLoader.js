import {impulse_response_url} from './Constants'

export async function load_gamefile(infile) {
  let filename = infile.name

  // grab the binary data
  let infile_array = new Uint8Array(await new Response(infile).arrayBuffer());

  //processing go here

  // audio setup
  let audio_context = new AudioContext({sampleRate: 48000}); // the PS2 SPU runs at 48 kHz
  let convolver_node = audio_context.createConvolver();
  convolver_node.connect(audio_context.destination);
  fetch(impulse_response_url).then(async (response) => {
    let convolver_buffer = await audio_context.decodeAudioData(await response.arrayBuffer())
    convolver_node.buffer = convolver_buffer;
  });

  // file reading loop

  // set_sbv2 (MUS)

  // set_vagp (SBK/VAGWAD)
}