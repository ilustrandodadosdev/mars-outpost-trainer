# Mars Outpost Trainer (working title)

NASA Space Apps Challenge 2026 — challenge **Build a Junior Astronaut Mission Trainer**.

A browser game where students run a Martian outpost, balancing power, food, oxygen and radiation.
Every sol in the game is one real day of NASA's space weather record: the solar flares the player faces really happened.

## Play
**Online:** https://ilustrandodadosdev.github.io/mars-outpost-trainer/

Or locally, open `index.html` through any static web server (no install, no build step):

```bash
python -m http.server 8765
```

Then open http://localhost:8765.

## NASA data
- **DONKI — Space Weather Database Of Notifications, Knowledge, Information** (solar flares → radiation events). https://api.nasa.gov
- **Mars Trek** (planned: real terrain for the outpost site). https://trek.nasa.gov/mars/

## Other resources
- [three.js](https://threejs.org) (MIT) — 3D rendering.

## Use of AI
This project was built with the help of **Claude (Anthropic)**, used as a coding assistant.
The game idea, rules and educational goals are the participant's own (see `IDEIA.md`).
AI-assisted parts: game engine code (`src/`), page layout, and documentation drafts.
