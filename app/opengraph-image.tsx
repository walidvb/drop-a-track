import { homeImage } from "@/lib/og";

export { size } from "@/lib/og";
export const alt = "drop-a-track: a participatory project for music lovers, ever changing, ever evolving.";
export const contentType = "image/png";

/** The poster, for / and every page without a share image of its own. */
export default function Image() {
  return homeImage();
}
