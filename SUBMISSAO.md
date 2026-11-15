# Space Apps 2026 — submission texts (English, ready to paste)

> Each section below matches one field of the Space Apps project page (Project Submission Guide 2026).
> Copy the text under each heading into the field with the same name.

---

## Project Name

Mars Outpost Trainer

## Team Name / Members

Team Mars Outpost Trainer · Rogenrique Melo

## Challenge

Build a Junior Astronaut Mission Trainer

## High-Level Project Summary

Mars Outpost Trainer is a free browser game for students aged 10–14. Players pick a real rover's neighbourhood, Curiosity in Gale Crater or Perseverance in Jezero Crater, and run a small outpost for 30 sols, keeping a simulated crew fed, breathing and protected while balancing power, food, oxygen and radiation. The ground is real Mars terrain, and each sol is one real day from 21 April to 20 May 2024: the solar storms are the 14 coronal mass ejections that NASA's WSA-Enlil model (DONKI database) predicted would reach Mars in that window, ending with the 20 May 2024 storm that Curiosity measured. Students learn the habit every crew needs: plan before the danger arrives. Each mission has three goals tied to what the real rover did, and the debrief compares the player's run with the real NASA data, with sources, in English or Portuguese.

## Link to Project Demo

https://mars-outpost-trainer.vercel.app/demo/

(The page plays the 30-second video. The 7-slide PDF is linked on the same page: https://mars-outpost-trainer.vercel.app/demo/slides.pdf)

## Link to Final Project

- Play: https://mars-outpost-trainer.vercel.app
- Source code: https://github.com/ilustrandodadosdev/mars-outpost-trainer

## Detailed Project Description

**What it does**

Mars Outpost Trainer is a mission-planning game. The player is the commander of a small outpost next to a real NASA rover and chooses the mission on the first screen:

- **Curiosity in Gale Crater**, focused on radiation. Curiosity's RAD detector measures radiation on the surface.
- **Perseverance in Jezero Crater**, focused on oxygen. Perseverance's MOXIE experiment made oxygen from the Martian air.

No human has been to Mars yet, so the game says clearly that the crew is simulated: the player is training to be the first.

With limited power, the player places four kinds of modules on a grid:

- Habitat, which makes oxygen.
- Solar panel, which makes power.
- Greenhouse, which makes food.
- Shield, which blocks radiation.

Four bars show how the crew is doing: Power, Food, Oxygen and Radiation.

When a coronal mass ejection leaves the Sun, a warning appears with the predicted arrival day. The player then has a real trade-off to make. Moving the crew to the shelter protects them from radiation, but the greenhouse goes unattended and food runs down. Surviving 30 sols means planning ahead instead of reacting late.

Each mission has three goals tied to what the real rover did:

- Curiosity: survive 30 sols, be in the shelter when the 20 May 2024 particle storm arrives, and finish with radiation below the game limit.
- Perseverance: survive 30 sols, produce enough oxygen, and be in the shelter on 20 May 2024.

The first sol is a played tutorial: the game guides the player through building the first module and passing the first sol, and the "?" button reopens the help at any time.

**How it works**

- Every sol maps to one real day from 21 April to 20 May 2024.
- We downloaded the WSA-Enlil simulations from NASA DONKI through api.nasa.gov and kept the 14 CMEs that NASA predicted would reach Mars. A Python script, `scripts/montar_dados.py`, turns them into `dados/marte-2024.json`.
- Each storm keeps its real launch day, predicted arrival day, speed, and whether it was a direct hit or a glancing blow. The warning comes on the day the CME left the Sun, and the hit comes on the day NASA predicted. Each entry in the game log links to its NASA record.
- The finale is the 20 May 2024 solar particle event. It was the biggest radiation surge Curiosity's RAD detector had measured since it landed in 2012.
- **Real terrain.** The ground around the outpost is an 8 km × 8 km cut of real elevation data:
  - Gale Crater, about 3.7 km south of Curiosity's landing site, from the USGS *MSL Gale Merged DEM 1 m* (built from NASA HiRISE and CTX and ESA Mars Express HRSC stereo, tied to NASA MOLA). Mount Sharp rises on the horizon. Shown with 2× vertical exaggeration.
  - Jezero Crater, about 1.7 km west of Perseverance's landing site, from the USGS *Mars 2020 TRN HiRISE DTM mosaic 1 m*. The delta is in front of the camera. Shown with 4× vertical exaggeration, because Jezero is flatter.
  - A Python script reads only the needed rows of each multi-gigabyte file over HTTP, so the game loads small height maps.
- **Sky and dust.** The sky is caramel by day with a bluish halo near the low Sun, as Curiosity photographed at sunset in Gale. Dust devils cross the plain, sized within the range seen on Mars. The dusty haze matches the season (southern summer), but its level is illustrative because there is no public daily record for that month.
- **Real sound.** In the Perseverance mission, the wind is the real recording made by the SuperCam microphone on sol 4.
- When a storm hits, Curiosity's RAD detector glows on the rover model. Two moving lights in the sky stand for NASA's MAVEN and Mars Odyssey orbiters, which also observed the 20 May storm.
- **Debrief: "Real mission × your run".** For each goal, the player's result is labelled "You (simulation)" next to the real fact labelled "NASA (real)": Curiosity RAD measurements, NASA's 2024 estimate of 8,100 micrograys for an astronaut standing next to Curiosity on 20 May, and the 122 g of oxygen MOXIE made. Meeting all three goals is a "Perfect run". Every fact links to its source.
- We are honest about the simplifications. Radiation doses and the goal limits are balanced for play and are not real measurements. The real particles on 20 May arrived within tens of minutes, but the game gives one sol of warning so players can react. The outpost and the crew are imaginary.

**Benefits and goals**

- It turns real space weather data and real Mars terrain into decisions a 10-year-old can make and understand.
- It teaches resource management, risk trade-offs and why prediction matters, which is the mindset of a junior astronaut.
- It needs no install and no account. It runs in any browser, on school computers and on phones, and a full mission takes about 10 minutes.
- It is bilingual: one click switches between English and Portuguese, so it works in Brazilian classrooms as well as English-speaking ones.
- Next steps:
  - more missions from other DONKI storm seasons;
  - a teacher guide and classroom playtests;
  - real daily dust data when it becomes public;
  - more languages.

**Tools and languages**

- Languages: JavaScript (ES modules), HTML and CSS for the game, and Python for data preparation.
- Libraries: three.js 0.160 for 3D rendering in the browser, with custom shaders for the sky and the dust.
- Data: the NASA DONKI API via api.nasa.gov, and USGS Astrogeology elevation models.
- Hosting: a static site on Vercel. There is no build step and no server code.
- Demo production: the gameplay was captured with Playwright (headless Chromium), the frames were edited with Python and Pillow, the original music was synthesized with Python and NumPy, and the video was encoded with FFmpeg.

**Use of AI**

This project was built with the help of Claude (Anthropic), an AI coding assistant. The game idea, rules, educational goals and design decisions are the participant's own and are recorded with dates in `IDEIA.md`. AI helped write the game code, the data scripts, the documentation, these texts and the scripts that produced the demo. Every source file starts with a comment stating this, the video and slide files say it in their metadata, and every video frame and slide carries a visible note. No AI image, video or music generator was used.

## Use of Super Intelligence (SI)

We used Claude (Anthropic) as a coding assistant. It helped write:

- the game engine code in `src/`;
- the page layout and the Python data scripts (DONKI data and terrain);
- drafts of the documentation and of these submission texts;
- the scripts that captured and edited the demo video and slides.

The game idea, rules, educational goals and design decisions are the participant's own. They are recorded with dates in `IDEIA.md` in the repository, and every AI suggestion was reviewed and accepted or changed by the participant.

How the use of AI is disclosed:

- **Images and video:** all images in the video and slides are real screenshots of the game, which is rendered by code written with AI help. No AI image or video generator was used. Every frame of the video and every slide carries a visible note saying that the code was written with AI assistance (Claude).
- **Audio:** the video's background music is original. It was synthesized note by note by a Python script written with AI assistance (`scripts/demo/musica.py`), with no samples or third-party recordings. The Perseverance wind in the game is a real NASA recording, not generated.
- **Code and data:** every source file starts with the comment "Code written with AI assistance (Claude, Anthropic) and reviewed by the team." The README and this page also state it.
- **Metadata:** the video (MP4) and the slides (PDF) state the use of AI in their file metadata.

No NASA logos, flags or branding appear in the game or the demo. Rover names appear only as factual credits for the real data.

## NASA Data

- **NASA DONKI** (Space Weather Database Of Notifications, Knowledge, Information), WSA-Enlil simulations and CME analyses for 21 April – 20 May 2024, via https://api.nasa.gov. This is the source of the 14 storms, their arrival days, speeds and impact type. Database: https://kauai.ccmc.gsfc.nasa.gov/DONKI/
- **NASA (2024), "NASA Watches Mars Light Up During Epic Solar Storm"**: source of the 20 May 2024 event, the 8,100 micrograys estimate, MAVEN's auroras and Mars Odyssey's star camera. https://www.nasa.gov/missions/maven/nasa-watches-mars-light-up-during-epic-solar-storm/
- **Curiosity RAD**, from Hassler et al., *Science* 343 (2014), "Mars' Surface Radiation Environment Measured with the Mars Science Laboratory's Curiosity Rover": source of the normal daily surface dose (about 0.21 mGy/day). https://doi.org/10.1126/science.1244797
- **NASA (2023), MOXIE completes its oxygen-making mission**: source of the 122 g of oxygen. https://www.nasa.gov/missions/mars-2020-perseverance/perseverance-rover/nasas-oxygen-generating-experiment-moxie-completes-mars-mission/
- **Gale Crater terrain**: USGS Astrogeology, *MSL Gale Merged DEM 1 m*, built from NASA MRO HiRISE and CTX stereo (with ESA Mars Express HRSC) and tied to NASA MGS MOLA. https://astrogeology.usgs.gov/search/map/mars_msl_gale_merged_dem_1m
- **Jezero Crater terrain**: USGS Astrogeology, *Mars 2020 Terrain Relative Navigation HiRISE DTM Mosaic 1 m* (CC0), built from NASA MRO HiRISE stereo. https://astrogeology.usgs.gov/search/map/mars_2020_terrain_relative_navigation_hirise_dtm_mosaic
- **Perseverance wind sound**: SuperCam microphone recording, sol 4 (22 February 2021), NASA/JPL-Caltech/LANL/CNES, from NASA's "Sounds from Beyond" (26-second excerpt, volume normalized, looped). https://www.nasa.gov/sounds-from-beyond/
- **NASA/JPL PIA19400, "Sunset in Gale Crater"**: reference for the sky colours. https://photojournal.jpl.nasa.gov/catalog/PIA19400
- **NASA/JPL PIA24039, Curiosity spots a dust devil in Gale**: reference for the dust devils. https://photojournal.jpl.nasa.gov/catalog/PIA24039
- **NASA Curiosity (MSL)** and **Mars 2020 Perseverance** missions, for the settings in Gale (since 2012) and Jezero (since 2021). https://science.nasa.gov/mission/msl-curiosity/ · https://science.nasa.gov/mission/mars-2020-perseverance/

## Space Agency Partner Data and Other References

Space agency partner data:

- **ESA (European Space Agency), Mars Express HRSC** stereo imagery is one of the inputs of the USGS Gale Crater elevation model used for the Gale terrain.
- **CNES (French space agency)** is co-credited on the Perseverance SuperCam wind recording (NASA/JPL-Caltech/LANL/CNES).

Other references and resources:

- Lemmon et al. (2024), the Curiosity (MSL) optical depth record, for the dusty southern summer. The haze level in the game is illustrative. https://arxiv.org/abs/2309.07378
- three.js (MIT License): https://threejs.org
- Playwright (Apache 2.0) to capture the demo, Pillow (HPND) to edit it, and FFmpeg (via imageio-ffmpeg) to encode it.
- Vercel for free static hosting.
- Claude (Anthropic) as an AI coding assistant.
- Fonts in the video: Segoe UI (system font).
- Music: original track synthesized with Python and NumPy (`scripts/demo/musica.py`); no third-party music.
