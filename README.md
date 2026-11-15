# Mars Outpost Trainer

Play in **English or Portuguese** (button next to the title). The end-of-mission debrief explains the real science, with sources.

NASA Space Apps Challenge 2026 — challenge **Build a Junior Astronaut Mission Trainer**.

A browser game where students run a Martian outpost, balancing power, food, oxygen and radiation.
Every sol in the game is one real day, from 21 April to 20 May 2024: the solar storms the player faces are the ones NASA's models predicted would reach Mars in that window, and the final storm is the one Curiosity measured on 20 May 2024.

Two missions, chosen on the first screen (or with `?missao=curiosity|perseverance` in the URL):
- **Curiosity in Gale Crater** — radiation (RAD). Goals: survive 30 sols, be in the shelter on 20 May 2024, finish with radiation below the game limit.
- **Perseverance in Jezero Crater** — oxygen (MOXIE). Goals: survive 30 sols, produce enough oxygen, be in the shelter on 20 May 2024.

The crew is simulated (no human has been to Mars yet). The first sol is a played tutorial, and the debrief compares "You (simulation)" with "NASA (real)" for each goal.

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
- The demo was captured from the real game with Playwright (`?demo` in the URL exposes the camera to the capture script; it changes nothing in play). The music is original, synthesized by `scripts/demo/musica.py` (no third-party music).

## NASA data
- **DONKI — Space Weather Database Of Notifications, Knowledge, Information** (https://api.nasa.gov): the **WSA-Enlil** simulations list each coronal mass ejection (CME) predicted to reach Mars, with arrival time, speed and whether it is a direct hit or a glancing blow. The game warns the player on the day the CME left the Sun and hits the outpost on the predicted arrival day.
- **Curiosity RAD / NASA (2024)**: the 20 May 2024 solar particle event (8.1 mGy on the surface of Mars) is the mission finale.
- `scripts/montar_dados.py` turns the raw DONKI files into `dados/marte-2024.json` (run with `--baixar` and your own api.nasa.gov key in `NASA_API_KEY` to download again). The radiation doses in the game are balanced for play, not real measurements.
- **Gale Crater terrain**: the ground around the outpost is real. It is an 8 km × 8 km cut, about 3.7 km south of Curiosity's landing site, from the USGS Astrogeology *MSL Gale Merged DEM 1 m* (built from NASA MRO HiRISE and CTX and ESA Mars Express HRSC stereo, tied to NASA MGS MOLA). Mount Sharp (Aeolis Mons) rises on the horizon. Relief is shown with a 2× vertical exaggeration so it reads on screen, and the outpost sits on a levelled pad. https://astrogeology.usgs.gov/search/map/mars_msl_gale_merged_dem_1m (scripts in `scripts/relevo/`).
- **Jezero Crater terrain**: an 8 km × 8 km cut about 1.7 km west of Perseverance's landing site, from the USGS Astrogeology *Mars 2020 Terrain Relative Navigation HiRISE DTM Mosaic 1 m* (CC0, built from NASA MRO HiRISE stereo). Shown with 4× vertical exaggeration, because Jezero is flatter. https://astrogeology.usgs.gov/search/map/mars_2020_terrain_relative_navigation_hirise_dtm_mosaic
- **Perseverance wind sound**: real SuperCam microphone recording, sol 4 (22 February 2021), NASA/JPL-Caltech/LANL/CNES, from "Sounds from Beyond" (26-second excerpt, volume normalized, looped). https://www.nasa.gov/sounds-from-beyond/
- **MOXIE**: NASA (2023), 122 g of oxygen made on Mars. https://www.nasa.gov/missions/mars-2020-perseverance/perseverance-rover/nasas-oxygen-generating-experiment-moxie-completes-mars-mission/
- **Sky and dust references**: NASA/JPL PIA19400 (sunset in Gale) https://photojournal.jpl.nasa.gov/catalog/PIA19400 and PIA24039 (dust devil in Gale) https://photojournal.jpl.nasa.gov/catalog/PIA24039.

## Space agency partner data
- **ESA Mars Express HRSC** stereo is one of the inputs of the USGS Gale elevation model.
- **CNES** is co-credited on the SuperCam wind recording.

## Other resources
- [three.js](https://threejs.org) (MIT) — 3D rendering.
- Lemmon et al. (2024), the Curiosity optical depth record, for the dusty season; the haze level in the game is illustrative. https://arxiv.org/abs/2309.07378

## Use of AI
This project was built with the help of **Claude (Anthropic)**, used as a coding assistant.
The game idea, rules and educational goals are the participant's own (see `IDEIA.md`).
AI-assisted parts: game engine code (`src/`), page layout, the Python data and terrain scripts, documentation and submission drafts, and the scripts that captured and edited the demo.
- Every source file starts with the comment "Code written with AI assistance (Claude, Anthropic) and reviewed by the team."
- Video frames and slides are real game screenshots, and each carries a visible AI-assistance note. The MP4 and PDF also state it in their metadata.
- No AI image, video or music generator was used.
