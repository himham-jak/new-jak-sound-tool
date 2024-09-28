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

#### Per-Instrument Information

The per-instrument information regions begin immediately following the last instrument and are 24 bytes.

| Offset  | 0x00* | 0x01 | 0x02 | 0x03 | 0x04 | 0x05 | 0x06 | 0x07 | 0x08 | 0x09 | 0x0A | 0x0B | 0x0C | 0x0D | 0x0E | 0x0F |
| :------ | :--: | :--: | :--: | :--: | :--: | :--: | :--: | :--: | :--: | :--: | :--: | :--: | :--: | :--: | :--: | :--: |
| Value   |   ?  |  RV  |  PA  |  PB  |  00  |  00  |  NS  |  NE  |  00  |  00  |  R1  |  R1  |  R2  |  R2  |  RF  |  RF  |
| Type    |uint8 |uint8 | int8 | int8 |    |    |  uint8  |  uint8  |    |    | uint16< |    | uint16< |    | uint16< |    |
| Desc    |   ?  | region_volume | region_pitch_a | region_pitch_b | ? | ? | region_note_start | region_note_end | ? | ? | region_adsr1 |  | region_adsr2 |  | region_flags |  |

| Offset  | 0x10 | 0x11 | 0x12 | 0x13 | 0x14 | 0x15 | 0x16 | 0x17 |
| :------ | :--: | :--: | :--: | :--: | :--: | :--: | :--: | :--: |
| Value   |  SO  |  SO  |  SO  |  SO  |   ?  |   ?  |  00  |  7F  |
| Type    | uint32< |      |      |      | uint16< |      |  uint16>  |    |
| Desc    | region_sample_offset |  |  |  | ? | ? | 127? |  |

- *relative to `region_offset`
  
- Followed by 16 bytes of 00

#### Instrument Samples

- *relative to `mmid_start`

#### MIDD Header

24 bytes?

#### MID Header

148 bytes prior to each sample

#### MID Samples

Binary data of some kind
  
#### Legend
- `<`: Little endian
- `>`: Big endian
- `?`: Unidentified or unused bytes.

## SBK

[SBK files](https://jadtech.miraheze.org/wiki/SBK_Files) are sound effect banks of [adpcm](https://github.com/himham-jak/adpcm) recordings in SBlk format. They're used throughout the full series, but Jak and Daxter uses an older format which contains a pre-header (of seemingly indeterminate size) listing the sound names. Excluding that pre-header, SBK files are made up of two parts: a standard sized header, and a series of adpcm recordings.

### Jak 1 Pre-Header

- The first 12 bytes are reserved for the title, though the original game never uses more than 10 and the filenames only allow 8. This is followed by 8 bytes of 00.
- Then at 0x14, there is a uint32<, the number of tracknames in the preheader, `num_sounds`. This is redundant information.
- From 0x18 on, 12 bytes are reserved for each trackname. Each is followed by 4 bytes of 00, then a 4 byte `fadeoff_params`.
- The pre-header ends with 00 padding until some predefined round address.

### Header

Each SBK file has one 0x50 byte header which contains version information, the addresses of sample data, the number of sounds (redundantly in the pre-header too), and 3 pointers into a sound array.

| Offset  | 0x00 | 0x01 | 0x02 | 0x03 | 0x04 | 0x05 | 0x06 | 0x07 | 0x08 | 0x09 | 0x0A | 0x0B | 0x0C | 0x0D | 0x0E | 0x0F |
| :------ | :--: | :--: | :--: | :--: | :--: | :--: | :--: | :--: | :--: | :--: | :--: | :--: | :--: | :--: | :--: | :--: |
| Value   |  03  |  00  |  00  |  00  |  02  |  00  |  00  |  00  |  18  |  00  |  00  |  00  |   ?  |   ?  |   ?  |   ?  |
| Type    | uint32< |    |    |    | uint32< |    |    |    |  uint32<  |    |    |    |  uint32<  |    |    |    |
| Desc    | 3? |  |  |  | 2? |  |  |  | header_size | 24 |  |  | ? |  |  |  |

| Offset  | 0x10 | 0x11 | 0x12 | 0x13 | 0x14 | 0x15 | 0x16 | 0x17 | 0x18 | 0x19 | 0x1A | 0x1B | 0x1C | 0x1D | 0x1E | 0x1F |
| :------ | :--: | :--: | :--: | :--: | :--: | :--: | :--: | :--: | :--: | :--: | :--: | :--: | :--: | :--: | :--: | :--: |
| Value   |  SS  |  SS  |  SS  |  SS  |  BB  |  BB  |  BB  |  BB  |  53  |  42  |  6C  |  6B  |   ?  |   ?  |   ?  |   ?  |
| Type    | uint32< |    |    |    | uint32< |    |    |    | utf32> |    |    |    | ? |    |    |    |
| Desc    | sound_start |  |  |  | sound_length |  |  |  | S | B | l | k | ? |  |  |  |

| Offset  | 0x20 | 0x21 | 0x22 | 0x23 | 0x24 | 0x25 | 0x26 | 0x27 | 0x28 | 0x29 | 0x2A | 0x2B | 0x2C | 0x2D | 0x2E | 0x2F |
| :------ | :--: | :--: | :--: | :--: | :--: | :--: | :--: | :--: | :--: | :--: | :--: | :--: | :--: | :--: | :--: | :--: |
| Value   |   ?  |   ?  |   ?  |   ?  |  6D*  |  6D*  |  6F*  |  63*  |   ?  |   ?  |   ?  |   ?  |   ?  |   ?  |  NS  |  NS  |
| Type    | ? |  |  |  | utf32> |  |  |  |  ?  |    |    |    |    |    |  uint16<  |    |
| Desc    | ? |  |  |  | m | m | o | c | ? |  |  |  | ? |  | num_sounds |  |

- *00 in Jak 1

| Offset  | 0x30 | 0x31 | 0x32 | 0x33 | 0x34 | 0x35 | 0x36 | 0x37 | 0x38 | 0x39 | 0x3A | 0x3B | 0x3C | 0x3D | 0x3E | 0x3F |
| :------ | :--: | :--: | :--: | :--: | :--: | :--: | :--: | :--: | :--: | :--: | :--: | :--: | :--: | :--: | :--: | :--: |
| Value   |   ?  |   ?  |   ?  |   ?  |  P1  |  P1  |  P1  |  P1  |  P2  |  P2  |  P2  |  P2  |   ?  |   ?  |   ?  |   ?  |
| Type    | ? |  |  |  | uint32< |    |    |    | uint32< |    |    |    |  ?  |    |    |    |
| Desc    | ? |  |  |  | soundarr_ptr** |  |  |  | soundarr2_ptr** |  |  |  | ? |  |  |  |

| Offset  | 0x40 | 0x41 | 0x42 | 0x43 | 0x44 | 0x45 | 0x46 | 0x47 | 0x48 | 0x49 | 0x4A | 0x4B | 0x4C | 0x4D | 0x4E | 0x4F |
| :------ | :--: | :--: | :--: | :--: | :--: | :--: | :--: | :--: | :--: | :--: | :--: | :--: | :--: | :--: | :--: | :--: |
| Value   |   ?  |   ?  |   ?  |   ?  |   ?  |   ?  |   ?  |   ?  |   ?  |   ?  |   ?  |   ?  |  P3  |  P3  |  P3  |  P3  |
| Type    | ? |  |  |  | uint32< |    |    |    | uint32< |    |    |    | uint32< |    |    |    |
| Desc    | ? |  |  |  | ? |  |  |  | ? |  |  |  | soundarr3_ptr** |  |  |  |

- ** Add `header_size` to each sound_arr_ptr for the true position

### ADPCM Sound Arrays

For each entry in the sound array, we can do some arithmetic to find the position of the sample's data, `this_sound_start`.

| Offset  | 0x50*** | 0x51 | 0x52 | 0x53 | 0x54 | 0x55 | 0x56 | 0x57 | 0x58 | 0x59 | 0x5A | 0x5B | 0x5C | 0x5D | 0x5E | 0x5F |
| :------ | :--: | :--: | :--: | :--: | :--: | :--: | :--: | :--: | :--: | :--: | :--: | :--: | :--: | :--: | :--: | :--: |
| Value   |  00  |  00  |  00  |  00  |  00  |  00  |  00  |  00  |  DV  |  DV  |  D2  |  D2  |  NE  |  NE  |  NE  |  NE  |
| Type    |  ?  |    |    |    |  ?  |    |    |    | uint16< |    | uint16< |    | Uint8 |    |    |    |
| Desc    | ? |  |  |  | ? |  |  |  | default_volume |  | default_2 |  | num_entries |  |  |  |

- *** The standard starting point for the first sample

| Offset  | 0x60 | 0x61 | 0x62 | 0x63 | 0x64 | 0x65 | 0x66 | 0x67 | 0x68 | 0x69 | 0x6A | 0x6B | 0x6C | 0x6D | 0x6E | 0x6F |
| :------ | :--: | :--: | :--: | :--: | :--: | :--: | :--: | :--: | :--: | :--: | :--: | :--: | :--: | :--: | :--: | :--: |
| Value   |  SP  |  SP  |  SP  |  SP  |  00  |  00  |  00  |  00  |  XX  |  XX  |  XX  |  XX  |  XX  |  XX  |  XX  |  XX  |
| Type    | Int32< |    |    |    |    |    |    |    |  |    |  |    |  |    |    |    |
| Desc    | sound_2_ptr* |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |

- ** Add `soundarr2_ptr` to each sound_2_ptr for the true position

## VAGWAD

[VAGWAD files](https://jadtech.miraheze.org/wiki/VAGWAD_Files) are "higher quality" sound banks of [adpcm](https://github.com/himham-jak/adpcm) recordings in VAGp format. They're used in every entry in the series (VAG format is even used in [The Lost Frontier](https://ia903409.us.archive.org/view_archive.php?archive=/11/items/jak-and-daxter-the-lost-frontier-pt-emersonlinogames/Jak%20and%20Daxter%20-%20The%20Lost%20Frontier%20PT%20emersonlinogames.iso)) but Jak and Daxter uses big-endian in some places where the later games use little-endian. These files were primarily reserved for dialogue, though the music for Jak 3 and X are stored in them as well. VAGWAD files are made up of two parts: a standard sized header and a series of adpcm recordings. They're arguably the simplest format of them all, created by simply concatenating its component parts.

### Header

#### Jak and Daxter

| Offset  | 0x00 | 0x01 | 0x02 | 0x03 | 0x04 | 0x05 | 0x06 | 0x07 | 0x08 | 0x09 | 0x0A | 0x0B | 0x0C | 0x0D | 0x0E | 0x0F |
| :------ | :--: | :--: | :--: | :--: | :--: | :--: | :--: | :--: | :--: | :--: | :--: | :--: | :--: | :--: | :--: | :--: |
| Value   |  56  |  41  |  47  |  70  |  00  |  00  |  00  |  20  |  00  |  00  |  00  |  00  |  SL  |  SL  |  SL  |  SL  |
| Type    | utf32> |      |      |      | uint32> |      |      |      | uint32> |      |      |      | uint32> |      |      |      |
| Desc    | V | A | G | p | version? | 32? | | | sound_offset | 0 | | | sound_length |  | | |

| Offset  | 0x10 | 0x11 | 0x12 | 0x13 | 0x14 | 0x15 | 0x16 | 0x17 | 0x18 | 0x19 | 0x1A | 0x1B | 0x1C | 0x1D | 0x1E | 0x1F |
| :------ | :--: | :--: | :--: | :--: | :--: | :--: | :--: | :--: | :--: | :--: | :--: | :--: | :--: | :--: | :--: | :--: |
| Value   |  SR  |  SR  |  SR  |  SR  |  00  |  00  |  00  |  00  |  00  |  00  |  00  |  00  |  00  |  00  |  00  |  00  |
| Type    | uint32> |    |    |    | uint32> |    |    |    |  uint32>  |    |    |    |  uint32>  |    |    |    |
| Desc    | sample_rate |  |  |  | 0 |  |  |  | 0 |  |  | 0 |  |  |

#### Jak Sequels

| Offset  | 0x00 | 0x01 | 0x02 | 0x03 | 0x04 | 0x05 | 0x06 | 0x07 | 0x08 | 0x09 | 0x0A | 0x0B | 0x0C | 0x0D | 0x0E | 0x0F |
| :------ | :--: | :--: | :--: | :--: | :--: | :--: | :--: | :--: | :--: | :--: | :--: | :--: | :--: | :--: | :--: | :--: |
| Value   |  70  |  47  |  41  |  56  |  00  |  00  |  00  |  20*  |  00  |  00  |  00  |  00  |  SL  |  SL  |  SL  |  SL  |
| Type    | utf32< |      |      |      | uint32> |      |      |      | uint32> |      |      |      | uint32> |      |      |      |
| Desc    | p | G | A | V | version? | 32? | | | sound_offset | 0 | | | sound_length |  | | |

| Offset  | 0x10 | 0x11 | 0x12 | 0x13 | 0x14 | 0x15 | 0x16 | 0x17 | 0x18 | 0x19 | 0x1A | 0x1B | 0x1C | 0x1D | 0x1E | 0x1F |
| :------ | :--: | :--: | :--: | :--: | :--: | :--: | :--: | :--: | :--: | :--: | :--: | :--: | :--: | :--: | :--: | :--: |
| Value   |  SR  |  SR  |  SR  |  SR  |  00  |  00  |  00  |  00  |  00  |  00  |  00  |  00  |  00  |  00  |  00  |  00  |
| Type    | uint32< |    |    |    | uint32< |    |    |    |  uint32<  |    |    |    |  uint32<  |    |    |    |
| Desc    | sample_rate |  |  |  | 0 |  |  |  | 0 |  |  | 0 |  |  |

- *00 in Jak X

### ADPCM Data

### VAGDIR.AYB

[VAGDIR](https://jadtech.miraheze.org/wiki/VAGDIR.AYB) files are used as directories for the adjacent VAGWAD files.

## Related links

- A similar project in Python by [jwetzell](https://github.com/jwetzell/JakAudioTools).
- Another similar project in C# by [Luminar Light](https://github.com/LuminarLight/JakAudioTool).
- My previous [sloppy iteration](https://github.com/himham-jak/himham-jak.github.io) of this tool.
- The Neopets:TDF tool by [Monster860](https://github.com/monster860/ntdf-tools) in Javascript that I forked to make the previous version.
- A python script by [Edness](https://reshax.com/files/file/50-ps2-jak-3-jak-x-combat-racing-vagwad-extract-script/) for processing Jak 3 and X VAGWAD/VAGDIR.
- A C# tool by [XyLe-GBP](https://github.com/XyLe-GBP/ATRACTool-Reloaded) for editing the PSP's at3 format used extensively in [Daxter](https://ia600306.us.archive.org/view_archive.php?archive=/20/items/0346-daxter-usa/0346%20-%20Daxter%20%28USA%29.iso).
