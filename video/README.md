# Drop a track: the promo video

A 26-second vertical video (1080×1920, 30fps) of the scan, told as one night out: a
shirt in a club queue, a phone scans it, a link pasted, "Dropped.", the wearer's walk home
with the bag playing, then the poster with a QR code that opens the site.

Made with [Remotion](https://remotion.dev) (React rendered to video). It uses the app's
fonts, design tokens and moiré textures straight from the repo, and redraws the app's
screens at phone size.

```console
npm i
npm run dev                                              # Remotion Studio: scrub, preview
npx remotion render DropATrack out/drop-a-track.mp4      # the MP4
```

- `src/data.ts`: the story's content. The handle, the theme, the people and tracks
  (made up), and the domain the QR codes open.
- `src/DropATrack.tsx`: the shots and their lengths.
- `src/scenes/`: each shot. `src/ui/`: the app's screens. `src/components/`: the shirt,
  the phone, the club.

**Music:** every shot is a whole number of beats at 120 BPM (15 frames), so a 120 BPM
track cuts on the beat. Put the file in `public/` and add
`<Audio src={staticFile("track.mp3")} />` to `DropATrack.tsx`.

Remotion is free for teams of up to 3.
