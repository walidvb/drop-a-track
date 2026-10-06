import { describe, expect, it } from "vitest";
import { checkAudioFile, MAX_AUDIO_BYTES, namesFromFile, uploadPathname } from "./audio-file";

const file = (name: string, type: string, size = 1000) => ({ name, type, size });

describe("audio files", () => {
  it("take formats every browser plays, stored under one type each", () => {
    expect(checkAudioFile(file("track.mp3", "audio/mpeg"))).toEqual({ ok: true, extension: "mp3", contentType: "audio/mpeg" });
    expect(checkAudioFile(file("track.WAV", "audio/x-wav"))).toEqual({ ok: true, extension: "wav", contentType: "audio/wav" });
    expect(checkAudioFile(file("take.m4a", "audio/x-m4a"))).toMatchObject({ ok: true, contentType: "audio/mp4" });
    // A recording: the recorder's type comes with codecs.
    expect(checkAudioFile(file("recording.webm", "audio/webm;codecs=opus"))).toMatchObject({ ok: true, contentType: "audio/webm" });
  });

  it("fall back to the reported type when the name has no usable extension", () => {
    expect(checkAudioFile(file("track", "audio/flac"))).toMatchObject({ ok: true, extension: "flac" });
    // Windows often reports no type for FLAC: the extension alone is enough.
    expect(checkAudioFile(file("track.flac", ""))).toMatchObject({ ok: true, extension: "flac" });
  });

  it("turn away what won't play everywhere, and what's too big", () => {
    expect(checkAudioFile(file("track.aiff", "audio/aiff"))).toMatchObject({ ok: false, error: expect.stringMatching(/AIFF/) });
    expect(checkAudioFile(file("track.aif", ""))).toMatchObject({ ok: false });
    expect(checkAudioFile(file("track.ogg", "audio/ogg"))).toMatchObject({ ok: false, error: expect.stringMatching(/format/) });
    expect(checkAudioFile(file("cover.jpg", "image/jpeg"))).toEqual({ ok: false, error: "Audio files only." });
    expect(checkAudioFile(file("long.wav", "audio/wav", MAX_AUDIO_BYTES + 1))).toEqual({ ok: false, error: "Too big. 50 MB max." });
  });

  it("are stored under their bag, with a readable name", () => {
    expect(uploadPathname(7, "Naïve Song (Final mix).WAV", "wav")).toBe("drops/7/naive-song-final-mix.wav");
    expect(uploadPathname(7, "???.mp3", "mp3")).toBe("drops/7/track.mp3");
  });

  it("suggest a title and artist from the name", () => {
    expect(namesFromFile("Mira K - Walk Home.mp3")).toEqual({ artist: "Mira K", title: "Walk Home" });
    expect(namesFromFile("walk_home_v2.wav")).toEqual({ title: "walk home v2", artist: "" });
  });
});
