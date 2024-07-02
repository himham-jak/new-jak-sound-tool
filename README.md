# new-jak-sound-tool
An audio tool build in React and Express.js for editing PS2 music and sound files in browser.

This rewrite will (eventually) support all* audio files from the main Jak and Daxter series.

|                | MUS (SBv2)       | SBK (SBlk)       | VAGWAD (VAGp)    |
| -------------  | ------------- |  ------------- | ------------- |
| Jak 1   |           ✔️  |           ✔️  |           ✔️  |
| Jak II  |           ✔️  |           ✔️  |           ✔️  |
| [Jak 3 |           N/A  |           ✔️  |           ✔️  |
| [Jak X](https://ia903402.us.archive.org/view_archive.php?archive=/23/items/jak-x-combat-racing-usa-v-2.00/Jak%20X%20-%20Combat%20Racing%20%28USA%29%20%28v2.00%29.iso)   |           N/A  |           ✔️  |           ✔️  |

MUS
---

[MUS Files](https://jadtech.miraheze.org/wiki/MUS_Files) are [midi](https://faydoc.tripod.com/formats/mid.htm) sequenced music tracks in SBv2 format. They're used extensively in the first two Jak games, but 3 and X each only contain `TWEAKVAL.MUS`. I haven't noted any differences between MUS files in the different games. MUS files consist of a standard sized header followed by a series of instruments and tracks.

SBK
---
[SBK files](https://jadtech.miraheze.org/wiki/SBK_Files) are sound effect banks of [adpcm](https://github.com/himham-jak/adpcm) recordings in SBlk format. They're used throughout the full series, but Jak and Daxter uses an older format which contains a pre-header listing the sound names. Thus, SBK files are made up of three parts: a pre-header which greatly differs in size, a standard sized header, and a series of adpcm recordings.

VAGWAD
---
[VAGWAD files](https://jadtech.miraheze.org/wiki/VAGWAD_Files) are dialogue banks of [adpcm](https://github.com/himham-jak/adpcm) recordings in VAGp format. They're used in every entry in the series, but Jak and Daxter uses big-endian in some places where the later games use little-endian. VAGWAD files are made up of two parts: a standard sized header and a series of adpcm recordings.

Related links
---
- A similar project in Python by [jwetzell](https://github.com/jwetzell/JakAudioTools).
- Another similar project in C# by [Luminar Light](https://github.com/LuminarLight/JakAudioTool).
- My previous [sloppy iteration](https://github.com/himham-jak/himham-jak.github.io) of this tool.
- The Neopets:TDF tool by [Monster860](https://github.com/monster860/ntdf-tools) in Javascript that I forked to make the previous version.
- A python script by [Edness](https://reshax.com/files/file/50-ps2-jak-3-jak-x-combat-racing-vagwad-extract-script/) for decrypting Jak 3 and X VAGDIR.

*Jak 3 and Jak X have no MUS, so I'm not actually sure where their music is stored. I'll look into it.