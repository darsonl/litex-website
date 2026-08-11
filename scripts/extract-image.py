"""
Decode one embedded PDF image to an RGB JPEG. Driven by scripts/extract-images.mjs.

    python scripts/extract-image.py <pdf> <xref> <out.jpg> [w h x y]

Why decode rather than copy the stored bytes out:

  * Three of these catalog images are JPEG 2000 (`jpx`). sharp reports
    `jp2 input: false`, so Astro cannot read them and the build fails.
  * All six are DeviceCMYK. A CMYK JPEG handed straight to a browser renders
    with inverted colours; MuPDF applies the PDF's own Decode array.
  * Four carry a soft mask. Those masks turn out to be page-layout gutters
    over an already-white background, so they are deliberately not applied —
    dropping them changes nothing visible, and keeping alpha would only add
    weight. Verified 2026-08-11 by rendering each mask.

The optional w/h/x/y crop exists for the RFID sheet, which is a whole-page
image layer: roughly half of it is empty page, and only the top band is a
photograph.
"""

import sys

import fitz

pdf, xref, out = sys.argv[1], int(sys.argv[2]), sys.argv[3]

pix = fitz.Pixmap(fitz.open(pdf), xref)
if pix.colorspace is None or pix.colorspace.name != "DeviceRGB":
    pix = fitz.Pixmap(fitz.csRGB, pix)

if len(sys.argv) > 4:
    w, h, x, y = (int(v) for v in sys.argv[4:8])
    box = fitz.IRect(x, y, x + w, y + h)
    cropped = fitz.Pixmap(fitz.csRGB, fitz.IRect(0, 0, w, h), False)
    cropped.copy(pix, box)
    pix = cropped

with open(out, "wb") as f:
    f.write(pix.tobytes("jpg", jpg_quality=90))

print(f"{pix.width}x{pix.height}")
