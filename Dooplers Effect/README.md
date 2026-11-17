# Doppler Effect – Interactive Physics Simulation
Developed and presented by **Abdullah Ashraf**.

## Open it
Double-click `index.html` (Chrome or Edge). No install, no server needed. For a local server: `python -m http.server` then open http://localhost:8000.

## Add your pictures (all optional – placeholders appear if a file is missing)
| What | Put the file here | Placeholder |
|---|---|---|
| Logo | `assets/logo/aa-logo.svg` | built-in AA logo |
| Car (transparent PNG, side view, facing right) | `assets/car/car.png` | vector car |
| Person (transparent PNG, side view, facing right) | `assets/character/person.png` | vector person |

Logo is an `<img src=... alt=...>` in `index.html`; its alt text shows if the file is missing. Car and person paths are in `ASSETS` at the top of `script.js` (change the name there if yours differs). Car is drawn 220×100 px, person 70×130 px (edit `drawCar` / `drawPerson`).

## Change defaults
Edit `DEFAULTS` at the top of `script.js` (f = 440 Hz, v = 343 m/s, vs = 30, vL = 30). `K` is the display scale (pixels per metre) and `VIS_DIV` sets how slowly rings are drawn.

## Physics
f′ = f (v − uL)/(v − uS), where u is velocity towards the listener side. Test values: 478.5 / 401.5 / 482.2 / 404.6 Hz.
