# Archive of the original LiTex site

**Captured:** 2026-08-10 from https://litextextile.wordpress.com/

A complete local copy of the source material, so the redesign never has to re-fetch the
original site — and so the content survives if the WordPress.com site is changed or taken
down during migration.

## What's here

| Path | Contents |
|---|---|
| `pages/` | 23 HTML pages — every unique URL in the sitemap, raw as served |
| `catalogs/` | All 6 PDF catalogs (11 MB) + `.txt` extractions where a text layer existed |
| `images/` | All 46 images referenced by the pages (29 MB) |
| `extracted-from-images.md` | **The important file.** Spec tables, patents and feature lists transcribed out of JPGs and PDFs into plain text. |

## Page filename → original URL

| File | Original URL |
|---|---|
| `home.html` | `/` |
| `about.html` | `/about-2/` |
| `privacy-policy.html` | `/privacy-policy/` |
| `contact.html` | `/contact/` |
| `downloads.html` | `/downloads/` |
| `patents-and-awards.html` | `/patents-and-awards-2/` |
| `products-index.html` | `/products/` |
| `product-conductive-metal-yarn.html` | `/products/conductive-metal-yarn-cmy/` |
| `product-electrical-heating-textile.html` | `/products/conductive-metal-yarn-cmy/electrical-heating-textile/` |
| `product-emi-shielding-woven-tube.html` | `/products/emi-shielding-woven-tube/` |
| `product-braided-self-curling-tube.html` | `/products/braided-self-curling-tube/` |
| `product-wired-conductive-tape.html` | `/products/wired-conductive-tape/` |
| `product-silica-gel-switch-controller.html` | `/products/silica-gel-switch-controller-2/` |
| `news-2022-tokyo-wearable-expo.html` | `/2022/01/21/tokyo-wearable-expo-2022/` |
| `news-2020-new-braided-self-curling-tube.html` | `/2020/05/20/new-braided-self-curling-tube-item/` |
| `news-2018-heating-alternatives.html` | `/2018/12/06/new-electrical-heating-alternatives-to-consider/` |
| `news-2018-dusseldorf-wire-show.html` | `/2018/02/26/dusseldorf-wire-show/` |
| `news-2018-catalog-download.html` | `/2018/02/26/catalog-download/` |
| `news-2017-techtextil-blog.html` | `/2017/06/26/featured-on-techtextil-blog/` |
| `news-2017-copper-nickel-1s1z.html` | `/2017/02/23/copper-nickel-1s1z/` |
| `news-2017-techtextil-frankfurt.html` | `/2017/02/23/litex-attending-techtextil-at-frankfurt-germany/` |
| `news-2017-wearable-expo.html` | `/2017/02/23/a-rewarding-experience-at-the-wearable-expo/` |
| `news-2016-test-post.html` | `/2016/09/22/test-post-blah/` |

## Notable findings

- **`images/pexels-photo-2117937.jpeg`** is a stock photo — confirms the current homepage uses
  stock imagery rather than LiTex's own product photography.
- **Two catalogs are image-only PDFs** with no text layer: `2018-company-introduction.pdf` and
  `2018-wired-conductive-tape.pdf`. They need OCR or page-by-page vision reading.
- **The richest technical data was never in HTML at all** — steel yarn specs, the full patent
  list, and the HT001 switch specs existed only as JPGs. All now transcribed in
  `extracted-from-images.md`.

## The Google Maps API key in `pages/` is expected — do not treat it as a leak

Automated secret scanners (GitHub's included) flag a `AIzaSy…p8dwTE` string in **23 of the 23
files** in `pages/`. It is a true pattern match and a false alarm. Before raising it again, read
this section.

Every occurrence is byte-identical and sits in exactly one place — the `src` of the Google Maps
Embed iframe in WordPress.com's "Contact Info & Map" widget (`widget_contact_info-8`), which
renders LiTex's Taipei address:

```
<iframe src="https://www.google.com/maps/embed/v1/place?q=188+Bangka+Blvd...&key=AIzaSy…p8dwTE">
```

Three reasons this is not an exposure:

- **It was already public.** These files are a byte-for-byte capture of a live public website.
  Anyone who viewed source on litextextile.wordpress.com could read this key. Committing the
  capture disclosed nothing that was not already served to every visitor.
- **Maps browser keys are public by design.** They ship in client-side HTML and are secured by
  HTTP referrer restrictions, not by secrecy. Rotating one, on its own, accomplishes nothing.
- **It never reaches the built site.** `archive/` is source material, never a published asset
  directory. `tests/imagery.test.ts` asserts no archive image reaches `dist/`, and no `AIza`
  string appears anywhere in a build.

**It is most likely not LiTex's key at all.** Jetpack supplies its own Maps key for that widget
unless a site owner enters one. To confirm: look in Google Cloud Console → APIs & Services →
Credentials for a key ending `p8dwTE`. If it is not there, it belongs to Automattic and there is
nothing to do — do not attempt to revoke a third party's key. If it *is* there, the correct fix is
restriction rather than rotation: *Application restrictions* → HTTP referrers, *API restrictions* →
Maps Embed API only. The risk worth closing in that case is not Maps quota, which is free and
unmetered for Embed, but an unrestricted key being usable against any other API enabled on the
same project.

**Why it is not redacted.** `.gitattributes` pins `archive/** -text` specifically so nothing
rewrites these files; the archive's value is that it is exactly what was served. Editing the key
out would break that guarantee, would not remove it from git history, and would buy nothing given
the key was public to begin with.

## How it was captured

```bash
# PDFs
curl -sSL -O "https://litextextile.wordpress.com/wp-content/uploads/2018/02/<file>.pdf"
pdftotext -layout <file>.pdf <file>.txt

# Pages
curl -sSL -o <slug>.html "https://litextextile.wordpress.com<path>"

# Images — URLs harvested from the archived pages
grep -ohE 'https://litextextile\.[^"'"'"' ?]+\.(jpg|jpeg|png|gif)' pages/*.html | sort -u
```
