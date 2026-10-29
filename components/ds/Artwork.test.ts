import { describe, expect, it } from "vitest";
import { sizedArt } from "./Artwork";

describe("sizedArt", () => {
  const bc = "https://f4.bcbits.com/img/a3028845176_10.jpg";
  const sc = "https://i1.sndcdn.com/artworks-wBSQChsUPz7ZuSvI-jFFwjw-t500x500.jpg";

  it("asks small slots for small art", () => {
    expect(sizedArt(bc, true)).toBe("https://f4.bcbits.com/img/a3028845176_9.jpg");
    expect(sizedArt(sc, true)).toBe("https://i1.sndcdn.com/artworks-wBSQChsUPz7ZuSvI-jFFwjw-t300x300.jpg");
  });

  it("asks big slots for 700px Bandcamp art, SoundCloud's 500px as is", () => {
    expect(sizedArt(bc, false)).toBe("https://f4.bcbits.com/img/a3028845176_16.jpg");
    expect(sizedArt(sc, false)).toBe(sc);
  });

  it("crops small YouTube squares from the unletterboxed frame", () => {
    const yt = "https://i.ytimg.com/vi/O0khtrGteEs/hqdefault.jpg";
    expect(sizedArt(yt, true)).toBe("https://i.ytimg.com/vi/O0khtrGteEs/mqdefault.jpg");
    expect(sizedArt(yt, false)).toBe(yt);
  });

  it("leaves anything else alone", () => {
    const other = "https://example.com/cover.jpg";
    expect(sizedArt(other, true)).toBe(other);
  });
});
