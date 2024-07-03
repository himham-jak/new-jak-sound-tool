# new-jak-sound-tool

An audio tool build in React and Express.js for editing PS2 music and sound files in browser.

This rewrite will (eventually) support all* audio files from the main Jak and Daxter series.

|                | MUS (SBv2)       | SBK (SBlk)       | VAGWAD (VAGp)    |
| -------------  | ------------- |  ------------- | ------------- |
| [Jak 1](https://ia804703.us.archive.org/view_archive.php?archive=/33/items/jak-and-daxter-the-precursor-legacy-usa-en-fr-de-es-it/Jak%20and%20Daxter%20-%20The%20Precursor%20Legacy%20%28USA%29%20%28En%2CFr%2CDe%2CEs%2CIt%29.iso) |           ✔️  |           ✔️  |           ✔️  |
| Jak II  |           ✔️  |           ✔️  |           ✔️  |
| [Jak 3](https://ia903409.us.archive.org/view_archive.php?archive=/25/items/jak-3-europe-australia-en-fr-de-es-it-pt-ru/Jak%203%20%28Europe%2C%20Australia%29%20%28En%2CFr%2CDe%2CEs%2CIt%2CPt%2CRu%29.iso) |           N/A  |           ✔️  |           ✔️  |
| [Jak X](https://ia903402.us.archive.org/view_archive.php?archive=/23/items/jak-x-combat-racing-usa-v-2.00/Jak%20X%20-%20Combat%20Racing%20%28USA%29%20%28v2.00%29.iso)   |           N/A  |           ✔️  |           ✔️  |

## MUS

[MUS Files](https://jadtech.miraheze.org/wiki/MUS_Files) are [midi](https://faydoc.tripod.com/formats/mid.htm) sequenced music tracks in [SBv2](https://forum.xen-tax.com/viewtopic.php@t=12966.html) format. They're used extensively in the first two Jak games, but 3 and X each only contain `TWEAKVAL.MUS`, which is made up of volume adjustments and has no header. I haven't noted any other differences between MUS files in the games. MUS files consist of a standard sized header followed by a series of instruments and tracks.

### Header

| Offset  | 0x00 | 0x01 | 0x02 | 0x03 | 0x04 | 0x05 | 0x06 | 0x07 | 0x08 | 0x09 | 0x0A | 0x0B | 0x0C | 0x0D | 0x0E | 0x0F |
| :------ | :--: | :--: | :--: | :--: | :--: | :--: | :--: | :--: | :--: | :--: | :--: | :--: | :--: | :--: | :--: | :--: |
| Value   |  01  |  00  |  00  |  00  |  03  |  00  |  00  |  00  |  20  |  00  |  00  |  00  |   ?  |   ?  |   ?  |   ?  |
| Type    | uint32< |    |    |    | uint32< |    |    |    |  uint32<  |    |    |    |    |    |    |    |
| Desc    | 1? |  |  |  | version | 3 |  |  | 32? |  |  |  |  |  |  |  |

| Offset  | 0x10 | 0x11 | 0x12 | 0x13 | 0x14 | 0x15 | 0x16 | 0x17 | 0x18 | 0x19 | 0x1A | 0x1B | 0x1C | 0x1D | 0x1E | 0x1F |
| :------ | :--: | :--: | :--: | :--: | :--: | :--: | :--: | :--: | :--: | :--: | :--: | :--: | :--: | :--: | :--: | :--: |
| Value   |  AA  |  AA  |  AA  |  AA  |  BB  |  BB  |  BB  |  BB  |  CC  |  CC  |  CC  |  CC  |   ?  |   ?  |   ?  |   ?  |
| Type    | uint32< |    |    |    | uint32< |    |    |    |  uint32<  |    |    |    |    |    |    |    |
| Desc    | sound_start | address |  |  | sound_length | offset |  |  | mmid_start | address |  |  |  |  |

| Offset  | 0x20 | 0x21 | 0x22 | 0x23 | 0x24 | 0x25 | 0x26 | 0x27 | 0x28 | 0x29 | 0x2A | 0x2B | 0x2C | 0x2D | 0x2E | 0x2F |
| :------ | :--: | :--: | :--: | :--: | :--: | :--: | :--: | :--: | :--: | :--: | :--: | :--: | :--: | :--: | :--: | :--: |
| Value   |  53  |  42  |  76  |  32  |  02  |  00  |  00  |  00  |   ?  |   ?  |   ?  |   ?  |  XX  |  XX  |  XX  |  XX  |
| Type    | utf32> |  |  |  | uint32< |    |    |    |    |    |    |    |  utf32>  |    |    |    |
| Desc    | S | B | v | 2 | 2? |  |  |  |  |  |  |  | name |  |  |  |

| Offset  | 0x30 | 0x31 | 0x32 | 0x33 | 0x34 | 0x35 | 0x36 | 0x37 | 0x38 | 0x39 | 0x3A | 0x3B | 0x3C | 0x3D | 0x3E | 0x3F |
| :------ | :--: | :--: | :--: | :--: | :--: | :--: | :--: | :--: | :--: | :--: | :--: | :--: | :--: | :--: | :--: | :--: |
| Value   |  0A  |  00  |  00  |  00  |  01  |  00  |  CC  |  CC  |  ?  |  ?  |  ?  |  ?  |  34  |  00  |  00  |  00  |
| Type    | uint32< |    |    |    | uint16< |    |  uint16<  |    |    |    |    |    | uint32< |    |    |    |
| Desc    | 10? |  |  |  | 1? |  | num_instruments |  |  |  |  |  | 52? |  |  |  |

| Offset  | 0x40 | 0x41 | 0x42 | 0x43 | 0x44 | 0x45 | 0x46 | 0x47 | 0x48 | 0x49 | 0x4A | 0x4B | 0x4C | 0x4D | 0x4E | 0x4F |
| :------ | :--: | :--: | :--: | :--: | :--: | :--: | :--: | :--: | :--: | :--: | :--: | :--: | :--: | :--: | :--: | :--: |
| Value   |  50  |  00  |  00  |  00  |   ?  |   ?  |   ?  |   ?  |  ?  |  ?  |  ?  |  ?  |   ?  |   ?  |   ?  |   ?  |
| Type    | uint32< |    |    |    |  |    |    |    |    |    |    |    |  |    |    |    |
| Desc    | instruments_offset | 80 |  |  | 1? |  |  |  |  |  |  |  |  |  |  |  |

- `instruments_start = 0x20 + instruments_offset`

| Offset  | 0x50 | 0x51 | 0x52 | 0x53 | 0x54 | 0x55 | 0x56 | 0x57 | 0x58 | 0x59 | 0x5A | 0x5B | 0x5C | 0x5D | 0x5E | 0x5F |
| :------ | :--: | :--: | :--: | :--: | :--: | :--: | :--: | :--: | :--: | :--: | :--: | :--: | :--: | :--: | :--: | :--: |
| Value   |  00  |  00  |  00  |  00  |  05  |  00  |  00  |  00  |  XX  |  XX  |  XX  |  XX  |  XX  |  XX  |  XX  |  XX  |
| Type    | uint32< |    |    |    | uint32< |    |    |    | utf32> |    |    |    | utf32> |    |    |    |
| Desc    | 0? |  |  |  | 5? |  |  |  | name | again |  |  | name | again |  |  |

| Offset  | 0x60 | 0x61 | 0x62 | 0x63 | 0x64 | 0x65 | 0x66 | 0x67 | 0x68 | 0x69 | 0x6A | 0x6B | 0x6C | 0x6D | 0x6E | 0x6F |
| :------ | :--: | :--: | :--: | :--: | :--: | :--: | :--: | :--: | :--: | :--: | :--: | :--: | :--: | :--: | :--: | :--: |
| Value   |  XX  |  XX  |  XX  |  XX  |   7F  |   00  |   00  |  01  |  00  |  00  |  00  |  02  |  00  |  00  |  00  |  00  |
| Type    | utf32> |    |    |    |  |    |    |    |    |    |    |    |  |    |    |    |
| Desc    | name | again |  |  | ? | ? | ? | ? | ? | ? | ? | ? | ? | ? | ? | ? |

### Instruments

Each instrument takes up 8 bytes and points to the regions where its samples are stored.

| Offset  | 0x70* | 0x71 | 0x72 | 0x73 | 0x74 | 0x75 | 0x76 | 0x77 |
| :------ | :--: | :--: | :--: | :--: | :--: | :--: | :--: | :--: |
| Value   |  RR  |  VV  |  PP  |  PP  |  RR  |  RR  |  RR  |  RR  |
| Type    |  uint8  |  uint8  |  int16<  |    |  uint32<  |    |    |    |
| Desc    | num_regions  | volume | pan |  | region_offset2 |  |  |

- `region_offset = 0x20 + region_offset2`

- *usually `instruments_start` is at 0x70, but this may not be the case in modified files

#### Instrument Samples

The instrument sample regions begin immediately following the last instrument.

| Offset  | 0x00* | 0x01 | 0x02 | 0x03 | 0x04 | 0x05 | 0x06 | 0x07 | 0x08 | 0x09 | 0x0A | 0x0B | 0x0C | 0x0D | 0x0E | 0x0F |
| :------ | :--: | :--: | :--: | :--: | :--: | :--: | :--: | :--: | :--: | :--: | :--: | :--: | :--: | :--: | :--: | :--: |
| Value   |   ?  |  RV  |  PA  |  PB  |  00  |  00  |  NS  |  NE  |  00  |  00  |  R1  |  R1  |  R2  |  R2  |  RF  |  RF  |
| Type    |uint8 |uint8 | int8 | int8 |    |    |  uint8  |  uint8  |    |    | uint16< |    | uint16< |    | uint16< |    |
| Desc    |   ?  | region_volume | region_pitch_a | region_pitch_b | ? | ? | region_note_start | region_note_end | ? | ? | region_adsr1 |  | region_adsr2 |  | region_flags |  |

| Offset  | 0x10 | 0x11 | 0x12 | 0x13 | 0x14 | 0x15 | 0x16 | 0x17 | 0x18 | 0x19 | 0x1A | 0x1B | 0x1C | 0x1D | 0x1E | 0x1F |
| :------ | :--: | :--: | :--: | :--: | :--: | :--: | :--: | :--: | :--: | :--: | :--: | :--: | :--: | :--: | :--: | :--: |
| Value   |  SO  |  SO  |  SO  |  SO  |   ?  |   ?  |  00  |  7F  |  00  |  00  |  FF  |  80  |  D2  |  9F  |   ?  |   ?  |
| Type    |uint32|      |      |      | uint16< |      |  uint16>  |    |    |    |  |    |  |    | uint16< |    |
| Desc    | region_sample_offset |  |  |  | ? | ? | 127? |  | ? | ? | ? | ? | ? | ? | counter? |  |

- *relative to `region_offset`
  
#### Legend
- `<`: Little endian
- `>`: Big endian
- `?`: Unidentified or unused bytes.


## SBK

[SBK files](https://jadtech.miraheze.org/wiki/SBK_Files) are sound effect banks of [adpcm](https://github.com/himham-jak/adpcm) recordings in SBlk format. They're used throughout the full series, but Jak and Daxter uses an older format which contains a pre-header listing the sound names. Thus, SBK files are made up of three parts: a pre-header which greatly differs in size, a standard sized header, and a series of adpcm recordings.

## VAGWAD

[VAGWAD files](https://jadtech.miraheze.org/wiki/VAGWAD_Files) are dialogue banks of [adpcm](https://github.com/himham-jak/adpcm) recordings in VAGp format. They're used in every entry in the series (VAG format is even used in [The Lost Frontier](https://ia903409.us.archive.org/view_archive.php?archive=/11/items/jak-and-daxter-the-lost-frontier-pt-emersonlinogames/Jak%20and%20Daxter%20-%20The%20Lost%20Frontier%20PT%20emersonlinogames.iso)) but Jak and Daxter uses big-endian in some places where the later games use little-endian. VAGWAD files are made up of two parts: a standard sized header and a series of adpcm recordings.

## Related links

- A similar project in Python by [jwetzell](https://github.com/jwetzell/JakAudioTools).
- Another similar project in C# by [Luminar Light](https://github.com/LuminarLight/JakAudioTool).
- My previous [sloppy iteration](https://github.com/himham-jak/himham-jak.github.io) of this tool.
- The Neopets:TDF tool by [Monster860](https://github.com/monster860/ntdf-tools) in Javascript that I forked to make the previous version.
- A python script by [Edness](https://reshax.com/files/file/50-ps2-jak-3-jak-x-combat-racing-vagwad-extract-script/) for decrypting Jak 3 and X VAGDIR.
- A C# tool by [XyLe-GBP](https://github.com/XyLe-GBP/ATRACTool-Reloaded) for editing the PSP's at3 format used extensively in [Daxter](https://ia600306.us.archive.org/view_archive.php?archive=/20/items/0346-daxter-usa/0346%20-%20Daxter%20%28USA%29.iso).

*Jak 3 and Jak X store their music somewhere other than MUS, so presently I don't know how to edit it.
