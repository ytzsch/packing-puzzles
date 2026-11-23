# Packing puzzles

Wooden packing puzzles cut on the laser, with a website to play them.

Site: https://ytzsch.github.io/packing-puzzles/

- **Home page** lists every puzzle in `puzzles/`.
- **Player**: `?set=<id>` opens one puzzle with its challenges, hints and solutions. Add `&c=T5` to open a challenge. This is what the QR codes point to.
- **Maker**: `?maker` designs trays, generates pieces (one solution, or many for a challenge set), makes graded challenges, prints the booklet and exports DXF/SVG for the laser.

## Adding a puzzle

1. In the maker, name the puzzle and press **Download for the website**.
2. On GitHub, open the `puzzles` folder, then **Add file > Upload files**, and upload the `.json` file.
3. The site rebuilds itself (Actions tab) and the puzzle appears on the home page a minute or two later.

Keep a puzzle's name once its booklet or box is printed: the name makes the web address in the QR codes.

## Files

- `index.html`, `app.css`, `app.js`: the page (home, player and maker)
- `core.js`: shapes, the exact solver, the generators and challenge maker; `worker.js` runs them in the background
- `qrcode.js`: QR code generator (Kazuhiko Arase, MIT licence)
- `tools/build-index.js`: builds `puzzles/index.json` on each deploy
- `.github/workflows/pages.yml`: deploys to GitHub Pages on every push to main
