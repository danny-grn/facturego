import { rgb } from "pdf-lib";

function hex(h: string) {
  const n = h.replace("#", "");
  const r = parseInt(n.slice(0, 2), 16) / 255;
  const g = parseInt(n.slice(2, 4), 16) / 255;
  const b = parseInt(n.slice(4, 6), 16) / 255;
  return rgb(r, g, b);
}

export const PDF_COLORS = {
  ink900: hex("#1b1b18"),
  ink700: hex("#4a4944"),
  ink500: hex("#78766c"),
  line: hex("#e3ddc9"),
  paperDim: hex("#f3efe4"),
  accent600: hex("#6e2430"),
  success600: hex("#285c40"),
  white: rgb(1, 1, 1),
};
