# Mars Outpost Trainer

Play in **English or Portuguese** (button next to the title). The end-of-mission debrief explains the real science, with sources.

NASA Space Apps Challenge 2026 — challenge **Build a Junior Astronaut Mission Trainer**.

A browser game where students run a Martian outpost, balancing power, food, oxygen and radiation.
Every sol in the game is one real day, from 21 April to 20 May 2024: the solar storms the player faces are the ones NASA's models predicted would reach Mars in that window, and the final storm is the one Curiosity measured on 20 May 2024.

## Play
**Online:** https://mars-outpost-trainer.vercel.app

Or locally, open `index.html` through any static web server (no install, no build step):

```bash
python -m http.server 8765
```

Then open http://localhost:8765.

## Demo
- 30-second video and 7 slides: https://mars-outpost-trainer.vercel.app/demo/
- Submission texts: `SUBMISSAO.md`.
- The demo was captured from the real game with Playwright (`?demo` in the URL exposes the camera to the capture script; it changes nothing in play).

## NASA data
- **DONKI — Space Weather Database Of Notifications, Knowledge, Information** (https://api.nasa.gov): the **WSA-Enlil** simulations list each coronal mass ejection (CME) predicted to reach Mars, with arrival time, speed and whether it is a direct hit or a glancing blow. The game warns the player on the day the CME left the Sun and hits the outpost on the predicted arrival day.
- **Curiosity RAD / NASA (2024)**: the 20 May 2024 solar particle event (8.1 mGy on the surface of Mars) is the mission finale.
- `scripts/montar_dados.py` turns the raw DONKI files into `dados/marte-2024.json` (run with `--baixar` and your own api.nasa.gov key in `NASA_API_KEY` to download again). The radiation doses in the game are balanced for play, not real measurements.
- **Mars Trek** (planned: real terrain for the outpost site). https://trek.nasa.gov/mars/

## Other resources
- [three.js](https://threejs.org) (MIT) — 3D rendering.

## Use of AI
This project was built with the help of **Claude (Anthropic)**, used as a coding assistant.
The game idea, rules and educational goals are the participant's own (see `IDEIA.md`).
AI-assisted parts: game engine code (`src/`), page layout, documentation and submission drafts, and the scripts that captured and edited the demo. Video frames and slides are real game screenshots and carry a visible AI-assistance note.
