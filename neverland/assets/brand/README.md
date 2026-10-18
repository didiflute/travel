# Dreamland header assets

Approved 2026-10-18: midnight navy reference; warm ivory Chinese Songti;
small muted blue-gray Garamond capitals; one W; exactly five flying figures
(Michael, John, Wendy, Peter Pan, fairy) and a sparse star trail.

`flying-five.svg` is a static vector transcription of the approved generated
reference “Wendy’s Dreamland: Midnight Flight.png”. It is inlined in both HTML
entries, with `currentColor` so daylight/dusk/night all retain contrast. No
bitmap rectangle, additional animation loop, WebGL mesh, or external request.
The five semantic character groups are retained in the SVG. Some character
silhouettes have separate feather/wing contours; these are not extra figures.

`eb-garamond-medium-latin.woff`: EB Garamond, weight 500, subset to the Latin
characters used in this header. Source: Google Fonts, ofl/ebgaramond.
License: OFL-EB-Garamond.txt. The CSS uses font-display:swap and local fallbacks.
This is real live type, not lettering baked into an image. Chinese fonts are
the original system Songti stack; no large Chinese webfont was added.

The original built-in image-generation design brief: retain the navy Chinese-
first title, ivory W, muted blue-gray Garamond English subtitle, and place five
flying storybook silhouettes to its right with a restrained curved star trail.
The later transparent-cutout attempt was blocked by the image tool; the
website uses SVG contours transcribed from the already-approved reference.

All font URLs resolve from brand.css, so both /neverland/ and the homepage
loading ./neverland/brand.css work. Do not replace these with root-relative URLs.
