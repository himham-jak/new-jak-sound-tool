import { impulse_response_url, adsr_rates } from './Constants'
import { useState } from 'react'

let stop_playing = null;

export let audio_context = new AudioContext({sampleRate: 48000}); // the PS2 SPU runs at 48 kHz


{/*spoofing data*/}
const testfile = {
    name:"Track 1",
    tempo: 150,
    ticks: 480
}


export class MidiPlayer {
  constructor(sbv2, track, ctx) {
    // audio setup
    //audio_context predefined at top level
    let convolver_buffer
    let convolver_node = audio_context.createConvolver();
    convolver_node.connect(audio_context.destination);
    fetch(impulse_response_url).then(async (response) => {
      convolver_buffer = await audio_context.decodeAudioData(await response.arrayBuffer())
      convolver_node.buffer = convolver_buffer;
    });

    this.sbv2 = sbv2;
    this.track = track;
    this.ctx = ctx;
    if(ctx instanceof OfflineAudioContext) {
      this.convolver_node = this.ctx.createConvolver();
      this.convolver_node.connect(ctx.destination);
      this.convolver_node.buffer = convolver_buffer;
      this.loops_left = 1;
    } else {
      this.convolver_node = convolver_node;
      this.loops_left = Infinity;
    }
    this.curr_timeout = null;
    this.channels = [];
    for(let i = 0; i < 16; i++) {
      this.channels[i] = [];
    }
    this.channel_programs = new Array(16);
    this.channel_programs.fill(undefined);
    this.channel_gains = new Array(16);
    this.channel_gains_reverb = new Array(16);
    this.channel_pans = new Array(16);
    this.channel_pans_reverb = new Array(16);
    this.channel_pan_controls = [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0];
    this.channel_pitch_shift = [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0];
    for(let i = 0; i < 16; i++) {
      let pan = this.channel_pans[i] = this.ctx.createStereoPanner();
      pan.connect(this.ctx.destination);
      let pan_reverb = this.channel_pans_reverb[i] = this.ctx.createStereoPanner();
      pan_reverb.connect(this.convolver_node);

      let gain = this.channel_gains[i] = this.ctx.createGain();
      gain.connect(pan);
      let gain_reverb = this.channel_gains_reverb[i] = this.ctx.createGain();
      gain_reverb.connect(pan_reverb);
    }
    this.current_time = this.ctx.currentTime;
    this.event_index = 0;
    this.channel_mask = 0xFFFF;
    this.reverb_enabled = true;
  }
  
  stop() {
    if(this.curr_timeout != null) clearTimeout(this.curr_timeout);
    this.curr_timeout = null;
    for(let i = 0; i < this.channels.length; i++) {
      for(let j = 0; j < this.channels[i].length; j++) {
        if(this.channels[i][j] instanceof Object) {
          this.channels[i][j].source_node.stop();
          this.channels[i][j] = null;
        }
      }
    }
  };
  
  play() {
    if(!this.curr_timeout) {
      this.process_midi();
    }
  }
  
  stop_note(channel, note_num) {
    let playing_note = this.channels[channel][note_num];
    if(playing_note) {
      this.channels[channel][note_num] = null;
      if(typeof playing_note == "object") {
        let curr_percent = 1;//playing_note.gain_node.gain.value / playing_note.base_gain;
        let time_to_silence = 0;
        let release_rate = playing_note.region.adsr2 & 0x1F;
        let release_mode = (playing_note.region.adsr2 >> 5) & 0x1;
        playing_note.release_gain_node.gain.setValueAtTime(1, this.current_time);
        if(release_mode) {
          let time_constant = 0x7FFFFFFF / adsr_rates[((release_rate^0x1f)*4)-0xC+32] / 48000;
          playing_note.release_gain_node.gain.setTargetAtTime(0, this.current_time, time_constant);
          time_to_silence = time_constant * 4;
        } else {
          time_to_silence = curr_percent * 0x7FFFFFFF / (1 << (0x1f - release_rate)) / 48000;
          playing_note.release_gain_node.gain.linearRampToValueAtTime(0, this.current_time + time_to_silence);
        }
        playing_note.source_node.stop(this.current_time + time_to_silence);
      }
    }
  };

  update_pan(channel) {
    let program = this.channel_programs[channel];
    let instrument = this.sbv2.instruments[program];
    let pan = (instrument ? instrument.pan : 0) * Math.PI / 180;
    pan += Math.asin(this.channel_pan_controls[channel]);
    this.channel_pans[channel].pan.setValueAtTime(Math.sin(pan), this.current_time);
    this.channel_pans_reverb[channel].pan.setValueAtTime(Math.sin(pan), this.current_time);
  }

  update_pitch(channel) {
    let channel_arr = this.channels[channel];
    if(!channel_arr) return;
    for(let i = 0; i < channel_arr.length; i++) {
      let note = channel_arr[i];
      if(note) {
        note.source_node.playbackRate.setValueAtTime(note.base_pitch * (1.122462 ** this.channel_pitch_shift[channel]), this.current_time);
      }
    }
  }

  handle_event(event) {
    if(event.type == "program_change") {
      this.channel_programs[event.channel] = event.program;
      this.update_pan(event.channel);
    } else if(event.type == "note_on") { // note on event
      let note_num = event.note;
      let velocity = event.velocity;
      this.stop_note(event.channel, note_num);
      let playing_note = {gain_node: this.ctx.createGain(), release_gain_node: this.ctx.createGain(), source_node: this.ctx.createBufferSource()};
      let program = this.channel_programs[event.channel] || 0;
      let region = null;
      for(let r of this.sbv2.instruments[program].regions) {
        if(note_num >= r.note_start && note_num <= r.note_end) {
          region = r; // technically regions can overlap and both will play but meh I really don't feel like doing that and I'm pretty sure it wasn't used since it would sound like shit.
          break;
        }
      }
      if(region && ((1 << event.channel) & this.channel_mask)) {
        playing_note.velocity = velocity;
        playing_note.base_gain = (this.sbv2.instruments[program].volume * region.volume * velocity) ** 2 * (665 / 2048)
        playing_note.gain_node.gain.setValueAtTime(0, this.current_time);
        if(!(region.flags & 0x10))
          playing_note.gain_node.connect(this.channel_gains[event.channel]);
        if((region.flags & 0x01) && this.reverb_enabled)
          playing_note.gain_node.connect(this.channel_gains_reverb[event.channel]);
        playing_note.release_gain_node.connect(playing_note.gain_node);
        playing_note.source_node.buffer = region.sound.buffer;
        playing_note.source_node.connect(playing_note.release_gain_node);
        playing_note.source_node.loop = region.sound.loop;
        playing_note.source_node.loopStart = region.sound.loop_start;
        playing_note.source_node.loopEnd = region.sound.loop_end;
        playing_note.base_pitch = handle_midi_pitch(region.pitch_a, region.pitch_b, note_num) / 4096;
        playing_note.source_node.playbackRate.value = playing_note.base_pitch * (1.122462 ** this.channel_pitch_shift[event.channel]);
        playing_note.pitch_a = region.pitch_a;
        playing_note.pitch_b = region.pitch_b;
        playing_note.source_node.start(this.current_time);
        playing_note.region = region;
        playing_note.instrument = this.sbv2.instruments[program];
        // do ADSR. Or at least some of it.
        let attack_rate = (region.adsr1 >> 8) & 0x7F;
        let attack_mode = region.adsr1 >> 15;
        let curr_adsr_time = 0;
        if(attack_mode) {
          if(adsr_rates[(attack_rate ^ 0x7F) - 0x18 + 32] > 0) {
            let time_a = this.current_time + (0x60000000 / adsr_rates[(attack_rate ^ 0x7F) - 0x18 + 32]) / 48000;
            playing_note.gain_node.gain.linearRampToValueAtTime(playing_note.base_gain * 0.75, time_a);
            curr_adsr_time = time_a + (0x1FFFFFFF / adsr_rates[(attack_rate ^ 0x7F) - 0x10 + 32]) / 48000;
            playing_note.gain_node.gain.linearRampToValueAtTime(playing_note.base_gain, curr_adsr_time);
          }
        } else {
          if(adsr_rates[(attack_rate ^ 0x7F) - 0x10 + 32] > 0) {
            curr_adsr_time = this.current_time + (0x7FFFFFFF / adsr_rates[(attack_rate ^ 0x7F) - 0x10 + 32]) / 48000;
            playing_note.gain_node.gain.linearRampToValueAtTime(playing_note.base_gain, curr_adsr_time);
          }
        }
        let curr_adsr_percent = 1;
        
        let decay_rate = (region.adsr1 >> 4) & 0xF;
        let sustain_level = region.adsr1 & 0xF;
        let sustain_fraction = ((1/16)*(sustain_level + 1));
        let decay_time_constant = 0x7FFFFFFF / adsr_rates[((decay_rate^0x1f)*4)-0xC+32] / 48000;
        curr_adsr_time += decay_time_constant * Math.log(1 / sustain_fraction);
        curr_adsr_percent *= sustain_fraction;
        playing_note.gain_node.gain.exponentialRampToValueAtTime((curr_adsr_percent * playing_note.base_gain == 0 ? 0.01 : curr_adsr_percent * playing_note.base_gain), curr_adsr_time);
        
        let sustain_mode = region.adsr2 >> 14;
        let sustain_rate = (region.adsr2 >> 6) & 0x7F;
        if(sustain_mode & 0x2) { // decreasing
          if(sustain_mode & 0x4) { // exponential
            let sustain_time_constant = 0x7FFFFFFF / adsr_rates[(sustain_rate^0x7F)-0xF + 32] / 48000;
            playing_note.gain_node.gain.setTargetAtTime(0, curr_adsr_time, sustain_time_constant);
          } else {
            if(adsr_rates[(sustain_rate ^ 0x7F)-0xF + 32] > 0) {
              curr_adsr_time += (0x7FFFFFFF * curr_adsr_percent / adsr_rates[(sustain_rate ^ 0x7F)-0xF + 32]) / 48000;
              playing_note.gain_node.gain.linearRampToValueAtTime(0, curr_adsr_time);
            }
          }
        } else if(curr_adsr_percent < 1) {
          // okay I could emulate increasing sustain level..... buuuuuuuut
          // the only time this game uses increasing sustain is when the sustain level is 1... which means it doesn't actually increase.
          // so yeah
          console.warn("Increasing sustain unimplemented");
        }
        
        this.channels[event.channel][note_num] = playing_note;
      } else if(!region) {
        console.warn("No region! (Channel " + (event.channel) + ", program " + program + ", note " + note_num + ")");
      } else {
        this.channels[event.channel][note_num] = true;
      }
      
    } else if(event.type == "note_off") { // note off event (this does not follow the midi standard... **GOD DAMN IT SONY WHY CANT YOU FOLLOW STANDARDS** (this music format is a sony thing not an idol minds thing))
      this.stop_note(event.channel, event.note);
    } else if(event.type == "control_change") { // Control mode change
      let control_function = event.control_function;
      let parameter = event.parameter;
      if(control_function == 0x7) {
        this.channel_gains[event.channel].gain.setValueAtTime((parameter / 127) ** 2, this.current_time);
        this.channel_gains_reverb[event.channel].gain.setValueAtTime((parameter / 127) ** 2, this.current_time);
      } else if(control_function == 0xa) {
        this.channel_pan_controls[event.channel] = (parameter / 64) - 1;
        this.update_pan(event.channel);
      } else if(control_function == 0x78) {
        for(let j = 0; j < this.channels[event.channel].length; j++) {
          if(this.channels[event.channel][j] instanceof Object) {
            this.channels[event.channel][j].source_node.stop();
            this.channels[event.channel][j] = null;
          }
        }
      } else if(control_function == 0x7B) {
        for(let i = 0; i < 128; i++) this.stop_note(event.channel, i);
      } else {
        console.warn(`Unrecognized control mode change: 0x${control_function.toString(16)}(${parameter})`);
      }
    } else if(event.type == "pitch_bend") { // Pitch bend
      //do_log(`Pitch shift channel ${event.channel} bend ${event.bend}`);
      this.channel_pitch_shift[event.channel] = event.bend;
      this.update_pitch(event.channel);
    } else if(event.type == "end") { // Meta event
      this.loops_left--;
      this.event_index = 0;
      return true;
    }
  }
  
  process_midi() {
    while(true) {
      let comparison = this.track.events[this.event_index].seconds;
      let force_skip = false;
      while(this.event_index < this.track.events.length && this.track.events[this.event_index].seconds <= comparison && !force_skip) {
        let event = this.track.events[this.event_index];
        this.event_index++;
        let ended = this.handle_event(event);
        if(ended) {
          force_skip = true;
          comparison -= event.seconds;
        }
      }
      this.current_time += this.track.events[this.event_index].seconds - comparison;
      if(this.ctx instanceof OfflineAudioContext) {
        if(this.ctx.length <= (this.current_time * this.ctx.sampleRate) || this.loops_left <= 0) {
          for(let i = 0; i < this.channels.length; i++) {
            for(let j = 0; j < this.channels[i].length; j++) {
              if(this.channels[i][j]) {
                this.stop_note(i, j);
              }
            }
          }
          return;
        }
      } else {
        if(this.loops_left) {
          let wait = (this.current_time - this.ctx.currentTime) * 1000;
          if(wait < -250) {
            this.curr_timeout = null;
            this.process_midi();
          } else {
            this.curr_timeout = setTimeout(this.process_midi.bind(this), wait);
          }
        }
        return;
      }
    }
  }
}


export class SBv2Decoder {
  constructor(file) {
    let dv = new DataView(file.buffer);
  
    let sound_start = dv.getUint32(16, true);
    let sound_length = dv.getUint32(20, true);
    let mmid_start = dv.getUint32(24, true);
    
    let sbv2_start = 0x20;
    let instruments_start = dv.getUint32(sbv2_start + 0x20, true) + sbv2_start;
    let num_instruments = dv.getUint16(sbv2_start + 0x16, true);
    
    this.num_instruments = num_instruments;
    this.instruments = [];
    this.min_note = 127;
    this.max_note = 0;
    
    this.tag = [...file.slice(44,48)].map((cc)=>{return String.fromCharCode(cc);}).join("");
    
    for(let i = 0; i < num_instruments; i++) {
      let instrument_volume = file[instruments_start + (i*0x8) + 0x1];
      let instrument_pan = dv.getInt16(instruments_start + (i*0x8) + 0x2, true);
      let num_regions = file[instruments_start + (i*0x8)];
      let region_offset = dv.getUint32(instruments_start + (i*0x8) + 0x4, true) + sbv2_start;
      
      let instrument_obj = {
        volume: instrument_volume / 127,
        pan: instrument_pan,
        regions: []
      };
      this.instruments.push(instrument_obj);
      
      for(let j = 0; j < num_regions; j++) {
        let region_volume = file[region_offset + j*0x18 + 0x1];
        let region_pitch_a = dv.getInt8(region_offset + j*0x18 + 0x2, false);
        let region_pitch_b = dv.getInt8(region_offset + j*0x18 + 0x3, false);
        let region_note_start = file[region_offset + j*0x18 + 0x6];
        let region_note_end = file[region_offset + j*0x18 + 0x7];
        let region_sample_offset = dv.getUint32(region_offset + j*0x18 + 0x10, true);
        let region_adsr1 = dv.getUint16(region_offset + j*0x18 + 0xA, true);
        let region_adsr2 = dv.getUint16(region_offset + j*0x18 + 0xC, true);
        let region_flags = dv.getUint16(region_offset + j*0x18 + 0xE, true);
        
        let region_obj = {
          volume: region_volume / 127,
          note_start: region_note_start,
          note_end: region_note_end,
          pitch_a: region_pitch_a,
          pitch_b: region_pitch_b,
          adsr1: region_adsr1,
          adsr2: region_adsr2,
          flags: region_flags,
          sound: decode_adpcm(file, sound_start+region_sample_offset, sound_start+sound_length, 48000),
          bytes: file.subarray(region_offset + j*0x18, region_offset + j*0x18+0x18)
        };
        instrument_obj.regions.push(region_obj)
      }
    }
    
    let is_single_track = (file[mmid_start + 0x11] == 0x49);
    
    this.tracks = [];
    let num_midis = is_single_track ? 1 : file[mmid_start+0x17];
    let version = is_single_track ? 1 : file[mmid_start + 0x14];
    for(let i = 0; i < num_midis; i++) {
      let midi_struct_offset = is_single_track ? (mmid_start + 0x10) : (dv.getUint32(mmid_start+0x20+i*4, true) + 0x10 + mmid_start);
      let midi_substruct_offset = midi_struct_offset + (version == 0x1 ? 0x1C : 0x28);
      //console.log(midi_substruct_offset + 0x48);
      
      let tempo = 100 / dv.getUint32(is_single_track ? midi_struct_offset+0x20 : midi_substruct_offset+0x48, true) * 600000;
      //console.log(tempo);
      let ticks_per_qnote = dv.getUint32(is_single_track ? (midi_struct_offset+0x24) : (midi_substruct_offset+0x54), true);
      let data_offset = dv.getUint32(is_single_track ? midi_struct_offset+0x18 : midi_substruct_offset+0x38, true) + midi_struct_offset;
      let data_end = data_offset;
      let track = {
        tempo,
        ticks_per_qnote,
        events: [],
        data_offset,
        data_end
      };
      this.tracks.push(track);
      
      let ticks = 0;
      let seconds = 0;
      let current_midi_pointer = data_offset;
      //console.log(current_midi_pointer);
      let event_type;
      let is_on_wait_byte = true;
      
      while(current_midi_pointer < file.length) {
        if(is_on_wait_byte) {
          is_on_wait_byte = false;
          let wait = 0;
          let wait_byte = file[current_midi_pointer++];
          while(wait_byte & 0x80) {
            wait += wait_byte & 0x7F;
            wait <<= 7;
            wait_byte = file[current_midi_pointer++];
          }
          wait += wait_byte;
          seconds += (wait / ticks_per_qnote) * 60 / tempo;
          ticks += wait;
        } else {
          is_on_wait_byte = true;
          if(file[current_midi_pointer] & 0x80) {
            event_type = file[current_midi_pointer++];
          }
          if((event_type & 0xF0) == 0xC0) { // program change event
            track.events.push({
              type:"program_change",
              channel: event_type & 0xF,
              program: file[current_midi_pointer++],
              seconds,
              ticks
            });
          } else if((event_type & 0xF0) == 0x90) { // note on event
            let note = file[current_midi_pointer++];
            let velocity = file[current_midi_pointer++]/127;
            if(velocity == 0) {
              let off_event;
              track.events.push(off_event = {
                type:"note_off",
                channel: event_type & 0xF,
                note,
                velocity: 0.5,
                seconds,
                ticks
              });
              for(let i = track.events.length-1; i >= 0; i--) {
                let other_event = track.events[i];
                if(other_event.type == "note_on" && other_event.channel == off_event.channel && other_event.note == off_event.note && !other_event.note_off) {
                  other_event.note_off = off_event;
                  break;
                }
              }
            } else {
              if(note < this.min_note) this.min_note = note;
              if(note > this.max_note) this.max_note = note;
              track.events.push({
                type:"note_on",
                channel: event_type & 0xF,
                note,
                velocity,
                seconds,
                ticks,
                note_off: null
              });
            }
          } else if((event_type & 0xF0) == 0xD0) { // note off event (this does not follow the midi standard... **GOD DAMN IT SONY WHY CANT YOU FOLLOW STANDARDS** (this music format is a sony thing not an idol minds thing))
            let off_event;
            track.events.push(off_event = {
              type:"note_off",
              channel: event_type & 0xF,
              note: file[current_midi_pointer++],
              velocity: 0.5,
              seconds,
              ticks
            });
            for(let i = track.events.length-1; i >= 0; i--) {
              let other_event = track.events[i];
              if(other_event.type == "note_on" && other_event.channel == off_event.channel && other_event.note == off_event.note && !other_event.note_off) {
                other_event.note_off = off_event;
                break;
              }
            }
          } else if((event_type & 0xF0) == 0xB0) { // Control mode change
            track.events.push({
              type:"control_change",
              channel: event_type & 0xF,
              control_function: file[current_midi_pointer++],
              parameter: file[current_midi_pointer++],
              seconds,
              ticks
            });
          } else if((event_type & 0xF0) == 0xE0) { // Pitch bend
            let pitch_lsb = file[current_midi_pointer++];
            let pitch_msb = file[current_midi_pointer++];
            track.events.push({
              type:"pitch_bend",
              channel: event_type & 0xF,
              bend: (pitch_msb * 128 + pitch_lsb) / 8192 - 1,
              seconds,
              ticks
            });
          } else if(event_type == 0xFF) { // Meta event
            let meta_type = file[current_midi_pointer++];
            let meta_length = 0;
            let length_byte = file[current_midi_pointer++];
            while(length_byte & 0x80) {
              meta_length += length_byte & 0x7F;
              meta_length <<= 7;
              length_byte = file[current_midi_pointer++];
            }
            meta_length += length_byte;
            
            let meta_data = file.slice(current_midi_pointer, current_midi_pointer + meta_length);
            
            if(meta_type == 0x2F) {
              track.events.push({
                type:"end",
                seconds,
                ticks
              });
              track.data_end = current_midi_pointer;
              console.log("Meta Event: End");
              break;
            } else if(meta_type == 0x00) {
              console.log("Meta Event: Set Sequence Number");
            } else if(meta_type == 0x01) {
              console.log("Meta Event: Text");
            } else if(meta_type == 0x02) {
              console.log("Meta Event: Copyright");
            } else if(meta_type == 0x03) {
              console.log("Meta Event: Track Name");
            } else if(meta_type == 0x04) {
              console.log("Meta Event: Instrument Name");
            } else if(meta_type == 0x05) {
              console.log("Meta Event: Lyric");
            } else if(meta_type == 0x06) {
              console.log("Meta Event: Marker");
            } else if(meta_type == 0x07) {
              console.log("Meta Event: Cue Point");
            } else if(meta_type == 0x08) {
              console.log("Meta Event: Set Program Name");
            } else if(meta_type == 0x09) {
              console.log("Meta Event: Set Device Name");
            } else if(meta_type == 0x20) {
              console.log("Meta Event: Set Channel Prefix");
            } else if(meta_type == 0x21) {
              console.log("Meta Event: Set MIDI Port");
            } else if(meta_type == 0x51) {
              console.log("Meta Event: Set Tempo");
            } else if(meta_type == 0x54) {
              console.log("Meta Event: Set SMPTE Offset");
            } else if(meta_type == 0x58) {
              console.log("Meta Event: Set Time Signature");
            } else if(meta_type == 0x59) {
              console.log("Meta Event: Set Key");
            } else if(meta_type == 0x7f) {
              console.log("Meta Event: Sequencer Info");
            } else {
              console.warn(`Unrecognized meta event 0x${meta_type.toString(16)}`);
            }
          } else if(event_type == 0xF0) {
            // Sysex event. What's it do? I have no idea! now let's skip it.
            // maybe one day I'll look at the disassembly a bit closer and see
            console.log("Sysex Event, not implemented");
            while(file[current_midi_pointer++] != 0xF7 && current_midi_pointer < file.length);
          } else if(event_type == 0xF3) {
            console.log("Song Select Event");
            current_midi_pointer++;
          } else {
            console.warn(new Error('Unrecognized MIDI event ' + (event_type ? event_type.toString(16) : event_type) + ' at 0x' + current_midi_pointer.toString(16) + ' (' + current_midi_pointer + ')'));
            break;
          }
        }
      }
      track.ticks = ticks;
      track.seconds = seconds;
    }
    this.num_tracks = this.tracks.length
  }
}


export function decode_adpcm(data, start_offset, end_offset, sample_rate = 22050) {
  const ADPCM_COEFFICIENTS = [
    [0,0],
    [60,0],
    [115,-52],
    [98,-55],
    [122,-60]
  ];
  let loop_start = 0;
  let loop = false;
  // first let's figure out where the end point is.
  for(let i = start_offset; i < end_offset; i += 16) {
    if((data[i+1]) & 2) {
      loop = true;
      if((data[i+1]) & 4) {
        loop_start = ((i - start_offset) / 16 * 28) / sample_rate;
      }
    }
    if((data[i+1] & 1) || !((data[i+16] >> 4) <= 4)) {
      end_offset = i + 16;
      break;
    }
  }
  // yeeted from here https://bitbucket.org/rerwarwar/gamestuff/src/default/JAD/vag.c
  let buffer = new AudioBuffer({length: (end_offset-start_offset) * 28 / 16, numberOfChannels: 1, sampleRate: sample_rate});
  let float_buffer = buffer.getChannelData(0);
  let p0 = 0;
  let p1 = 0;
  for(let i = start_offset; i < end_offset; i += 16) {
    let shift = data[i] & 0xf;
    let index = data[i] >> 4;
    let flags = data[i+1];
    let c0 = ADPCM_COEFFICIENTS[index][0];
    let c1 = ADPCM_COEFFICIENTS[index][1];
    for(let j = 0; j < 28; j++) {
      let b = (j & 1) ? (data[i+2+(j>>1)] >> 4) : (data[i+2+(j>>1)] & 0xF);
      if(b > 7) b -= 16; // sign-extend the nibble
      let error = (b << 18) >> shift;
      let predicted = p0 * c0 + p1 * c1;
      p1 = p0;
      p0 = (error + predicted) >> 6
      float_buffer[((i-start_offset) >> 4) * 28 + j] = p0 / 32768;
    }
  }
  return {
    buffer,
    loop,
    loop_start,
    loop_end: buffer.duration
  };
}

// this is basically a JS translation of some assembly code.
// a0/a1: bytes 2/3 of region, a2: note number, a3: pitch shift
function handle_midi_pitch(a0, a1, a2, a3 = 0) {
  let v0, v1, t0, t1, t2, s0;
  // some look up tables
  // if you really want to graph them go ahead but they're probably lookups for exponents and shizz.
  const table1 = [0x8000, 0x879C, 0x8FAC, 0x9837, 0xA145, 0xAADC, 0xB504, 0xBFC8, 0xCB2F, 0xD744, 0xE411, 0xF1A1];
  const table2 = [0x8000, 0x800E, 0x801D, 0x802C, 0x803B, 0x804A, 0x8058, 0x8067, 0x8076, 0x8085, 0x8094, 0x80A3, 0x80B1, 0x80C0, 0x80CF, 0x80DE, 0x80ED, 0x80FC, 0x810B, 0x811A, 0x8129, 0x8138, 0x8146, 0x8155, 0x8164, 0x8173, 0x8182, 0x8191, 0x81A0, 0x81AF, 0x81BE, 0x81CD, 0x81DC, 0x81EB, 0x81FA, 0x8209, 0x8218, 0x8227, 0x8236, 0x8245, 0x8254, 0x8263, 0x8272, 0x8282, 0x8291, 0x82A0, 0x82AF, 0x82BE, 0x82CD, 0x82DC, 0x82EB, 0x82FA, 0x830A, 0x8319, 0x8328, 0x8337, 0x8346, 0x8355, 0x8364, 0x8374, 0x8383, 0x8392, 0x83A1, 0x83B0, 0x83C0, 0x83CF, 0x83DE, 0x83ED, 0x83FD, 0x840C, 0x841B, 0x842A, 0x843A, 0x8449, 0x8458, 0x8468, 0x8477, 0x8486, 0x8495, 0x84A5, 0x84B4, 0x84C3, 0x84D3, 0x84E2, 0x84F1, 0x8501, 0x8510, 0x8520, 0x852F, 0x853E, 0x854E, 0x855D, 0x856D, 0x857C, 0x858B, 0x859B, 0x85AA, 0x85BA, 0x85C9, 0x85D9, 0x85E8, 0x85F8, 0x8607, 0x8617, 0x8626, 0x8636, 0x8645, 0x8655, 0x8664, 0x8674, 0x8683, 0x8693, 0x86A2, 0x86B2, 0x86C1, 0x86D1, 0x86E0, 0x86F0, 0x8700, 0x870F, 0x871F, 0x872E, 0x873E, 0x874E, 0x875D, 0x876D, 0x877D];
  
  a0 <<= 0x18;
  v0 = a0 >> 0x18;
  a1 <<= 0x18;
  a1 >>= 0x18;
  a2 &= 0xFFFF;
  a3 <<= 0x10;
  a3 >>= 0x10;
  if(v0 < 0) {
    s0 = 0;
    v0 = -v0;
    v0 <<= 0x18;
    v0 >>= 0x18;
  } else {
    s0 = 0x1;
  }
  a0 = v0 & 0xFFFF;
  a1 &= 0xFFFF;
  
  // START OF SOME FUNCTION (which I'm inlining here)
  t0 = a0;
  a3 = a3 << 0x10;
  a3 = a3 >> 0x10;
  a1 &= 0xFFFF;
  a3 += a1;
  if(a3 < 0) {
    v1 = a3 + 0x7F;
  } else {
    v1 = a3;
  }
  a0 = 0x2AAAAAAB;
  v1 >>= 0x7;
  v0 = a2 + v1;
  v0 -= t0;
  v0 <<= 0x10;
  a1 = v0 >> 0x10;
  t1 = Math.floor(a1 * (a0/0x100000000)); // not exactly but meh
  a2 = v1;
  v1 = a2 << 0x7;
  a3 -= v1;
  v0 >>= 0x1F;
  v1 = t1 >> 0x1
  v1 -= v0;
  t0 = v1 - 0x2;
  v0 = v1 << 0x1;
  v0 += v1;
  v0 <<= 0x2;
  a1 -= v0;
  v0 = a1 << 0x10;
  v0 >>= 0x10;
  a0 = a1;
  if(v0 < 0) {
    a0 = a1 + 0xC;
    t0 = v1 - 0x3;
    v0 = a0 << 0x10;
    
  } else if(v0 != 0) {
    v0 = a0 << 0x10;
  } else {
    v0 = a0 << 0x10;
    if(a3 < 0) {
      a0 = a1 + 0xC;
      t0 = v1 - 0x3;
      v0 = a0 << 0x10;
    }
  }
  if(a3 < 0) {
    v0 = a0 - 0x1;
    a0 = v0 + a2;
    v0 = a2 + 0x1;
    v0 <<= 0x7;
    a3 += v0;
    v0 = a0 << 0x10;
  }
  v0 >>= 0xF;
  v1 = a3 << 0x1;
  a0 = table1[v0 >> 0x1];
  v0 = table2[v1 >> 0x1];
  t1 = (a0 * v0) & 0xFFFFFFFF;
  v0 = t0 << 0x10;
  v0 >>= 0x10;
  a1 = t1 >> 0x10;
  if(v0 < 0) {
    a0 = -v0;
    v1 = a0 - 0x1;
    v0 = 0x1;
    v0 <<= v1;
    a1 += v0;
    a1 >>>= a0; // this one's a logical shift so three >'s
  }
  v0 = a1 & 0xFFFF;
  // END OF SOME FUNCTION
  if(s0 != 0) {
    a0 = 0x57619F1;
    v1 = v0 << 0x1;
    v1 += v0;
    v1 <<= 0x2;
    v1 -= v0;
    v1 <<= 0x4;
    v1 -= v0;
    v0 = v1 << 0x6;
    v0 += v1;
    v0 <<= 0x2;
    v0 = Math.floor(v0 * (a0/0x100000000));
    v0 >>>= 0xA;
  }
  v0 &= 0xFFFF;
  return v0;
}

let to_wav = (function() {


  function audioBufferToWav (buffer, opt) {
    opt = opt || {}

    var numChannels = buffer.numberOfChannels
    var sampleRate = buffer.sampleRate
    var format = opt.float32 ? 3 : 1
    var bitDepth = format === 3 ? 32 : 16

    var result
    if (numChannels === 2) {
      result = interleave(buffer.getChannelData(0), buffer.getChannelData(1))
    } else {
      result = buffer.getChannelData(0)
    }

    return encodeWAV(result, format, sampleRate, numChannels, bitDepth)
  }

  function encodeWAV (samples, format, sampleRate, numChannels, bitDepth) {
    var bytesPerSample = bitDepth / 8
    var blockAlign = numChannels * bytesPerSample

    var buffer = new ArrayBuffer(44 + samples.length * bytesPerSample)
    var view = new DataView(buffer)

    /* RIFF identifier */
    writeString(view, 0, 'RIFF')
    /* RIFF chunk length */
    view.setUint32(4, 36 + samples.length * bytesPerSample, true)
    /* RIFF type */
    writeString(view, 8, 'WAVE')
    /* format chunk identifier */
    writeString(view, 12, 'fmt ')
    /* format chunk length */
    view.setUint32(16, 16, true)
    /* sample format (raw) */
    view.setUint16(20, format, true)
    /* channel count */
    view.setUint16(22, numChannels, true)
    /* sample rate */
    view.setUint32(24, sampleRate, true)
    /* byte rate (sample rate * block align) */
    view.setUint32(28, sampleRate * blockAlign, true)
    /* block align (channel count * bytes per sample) */
    view.setUint16(32, blockAlign, true)
    /* bits per sample */
    view.setUint16(34, bitDepth, true)
    /* data chunk identifier */
    writeString(view, 36, 'data')
    /* data chunk length */
    view.setUint32(40, samples.length * bytesPerSample, true)
    if (format === 1) { // Raw PCM
      floatTo16BitPCM(view, 44, samples)
    } else {
      writeFloat32(view, 44, samples)
    }

    return buffer
  }

  function interleave (inputL, inputR) {
    var length = inputL.length + inputR.length
    var result = new Float32Array(length)

    var index = 0
    var inputIndex = 0

    while (index < length) {
      result[index++] = inputL[inputIndex]
      result[index++] = inputR[inputIndex]
      inputIndex++
    }
    return result
  }

  function writeFloat32 (output, offset, input) {
    for (var i = 0; i < input.length; i++, offset += 4) {
      output.setFloat32(offset, input[i], true)
    }
  }

  function floatTo16BitPCM (output, offset, input) {
    for (var i = 0; i < input.length; i++, offset += 2) {
      var s = Math.max(-1, Math.min(1, input[i]))
      output.setInt16(offset, s < 0 ? s * 0x8000 : s * 0x7FFF, true)
    }
  }

  function writeString (view, offset, string) {
    for (var i = 0; i < string.length; i++) {
      view.setUint8(offset + i, string.charCodeAt(i))
    }
  }
  return audioBufferToWav;
})();

export function decode_sbv2(infile_array) {
  let dispose_old

  if(dispose_old) {
    dispose_old();
    dispose_old = null;
  }

  // audio setup
  let audio_context = new AudioContext({sampleRate: 48000}); // the PS2 SPU runs at 48 kHz
  let convolver_node = audio_context.createConvolver();
  convolver_node.connect(audio_context.destination);
  fetch(impulse_response_url).then(async (response) => {
    let convolver_buffer = await audio_context.decodeAudioData(await response.arrayBuffer())
    convolver_node.buffer = convolver_buffer;
  });

  let dv = new DataView(infile_array.buffer);
  let sbv2 = new SBv2Decoder(infile_array)
  return(sbv2)
}


export function playTrack(sbv2, trackIndex, audio_context) {

  audio_context = audio_context || new AudioContext({sampleRate: 48000});

  if(stop_playing) { stop_playing(); stop_playing = null; }
  
  let player = new MidiPlayer(sbv2, sbv2.tracks[trackIndex], audio_context);
  //player.channel_mask = calc_channel_mask();
  //player.reverb_enabled = reverb_toggle.checked;
  player.play();
  console.log("Player: ", player);
  
  {/*let do_vis = () => {
      if(player.curr_timeout == null) return;
      for(let i = 0; i < 16; i++) {
        let channel = player.channels[i];
        let is_playing = false;
        for(let note of channel) {
          if(note) {
            is_playing = true;
            break;
          }
        }
        let vis = channel_labels[i];
        vis.style.backgroundColor = is_playing ? "#ccaacc" : "transparent";
      }
      player.channel_mask = calc_channel_mask();
      player.reverb_enabled = reverb_toggle.checked;
      setTimeout(do_vis, 50);
    };
    do_vis();*/}
  
  stop_playing = () => {
    player.stop();
    //for(let vis of channel_labels) {vis.style.backgroundColor = "transparent";}
  };
};

export function decode_vagp(infile_array, notJakOne) {

  let vag_file = {
    name:"Jak 1 VAGWAD"
  }

  if(notJakOne) {vag_file.name="Jak 2+ VAGWAD";}

  return(vag_file);
}


export function decode_sblk(infile_array, isJakOne) {

  let sbk_file = {
    name_list:[]
  }

  // open dataview buffer from file
  let dv = new DataView(infile_array.buffer);

  // for non-jak1, SBlk header starts immediately
  let header_start = 0x0;

  // if jak1 sbk then let's grab the sound names
  if(isJakOne) {

    // read the number of sounds in the file from 0x14
    let num_sounds = dv.getUint32(0x14, true);
    //console.log("number of sblk1 sounds:",num_sounds);

    // loop over all strings
    for (let i = 0; i < num_sounds; i++) {

      // sound names start at 0x18, skip forward by 20 for each one
      let current_idx = 0x18 + (20 * i);

      // grab a slice of the bytearray
      let name_slice = new Uint8Array(dv.buffer, current_idx, 16); // do the last 4 bytes have a use?

      // filter out zero padding
      name_slice = name_slice.filter(byte => byte !== 0);

      // create a utf decoder
      let decoder = new TextDecoder('utf-8');

      // decode to string
      let name_string = decoder.decode(name_slice);

      // add to the name list
      //console.log(name_string);
      sbk_file.name_list.push(name_string);
    }

    // mark the end of the name header and start of the SBlk header
    // starting at 0x18, skip forward by 20 for each one
    header_start = 0x18+(20*num_sounds);

    // then skip the padding of zeroes
    while (infile_array[header_start] === 0) {header_start++;}
  }

  // read values from the binary array
  let header_size = dv.getUint32(header_start + 0x08, true);
  sbk_file.num_sounds = dv.getUint16(header_start + 0x16 + header_size, true);
  let soundarr_ptr = dv.getUint32(header_start + 0x1c + header_size, true) + header_size;
  let soundarr2_ptr = dv.getUint32(header_start + 0x20 + header_size, true) + header_size;
  let soundarr3_ptr = dv.getUint32(header_start + 0x34 + header_size, true) + header_size;
  let sound_start = dv.getUint32(header_start + 0x10, true);
  let sound_end = dv.getUint32(header_start + 0x14, true) + sound_start;
  let urls = [];

  for(let i = 0; i < sbk_file.num_sounds; i++) {
    try {
      console.log("Sound ",i+1);
      let sound_ptr = i * 12 + soundarr_ptr;
      let num_entries = dv.getUint8(sound_ptr + 4);
      if(num_entries == 0) {
        console.log("No entries");
      } else {
        console.log("Default Volume:",dv.getUint16(sound_ptr, true));
        console.log("Default _2:",dv.getUint16(sound_ptr+2, true));
        console.log("Number of entries:",num_entries);
        let sound_2_ptr = dv.getInt32(sound_ptr + 8, true) + soundarr2_ptr;

        // for each entry
        for(let j = 0; j < num_entries; j++) {
          let entry2 = sound_2_ptr + j*8;
          let e2_type = dv.getUint8(entry2 + 3); // Index into function table at 0x21188
          console.log("Type:",e2_type);
          if(e2_type == 0) {
            let offset = dv.getUint32(entry2, true) & 0xFFFFFF;
            console.log("Offset:",offset);
            console.log("Other:",dv.getUint32(entry2 + 4, true));
            let sound_3_ptr = offset + soundarr3_ptr;
            let this_sound_start = sound_start + dv.getUint32(sound_3_ptr + 0x10, true);
            console.log("Sound Start:",this_sound_start - sound_start)

            let sound = decode_adpcm(infile_array, this_sound_start, infile_array.length, 16000);
          }
        }
      }
    } catch(e) {
      console.log("Error:",e);
    }
  }

  return(sbk_file);
}
