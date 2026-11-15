# Space Apps 2026 — submission texts (English, ready to paste)

> Each section below matches one field of the Space Apps project page.
> Copy the text under each heading into the field with the same name.

---

## Project Name

Mars Outpost Trainer

## Team Name / Members

Team Mars Outpost Trainer · Rogenrique Melo

## Challenge

Build a Junior Astronaut Mission Trainer

## High-Level Project Summary

Mars Outpost Trainer is a free browser game for students aged 10–14. Players run a small outpost on Mars for 30 sols and keep the crew fed, breathing and protected while balancing power, food, oxygen and radiation. Each sol is one real day from 21 April to 20 May 2024. The solar storms players face are the 14 coronal mass ejections that NASA's WSA-Enlil model, from the DONKI space weather database, predicted would reach Mars in that window. The mission ends with the real 20 May 2024 storm that Curiosity measured. Students learn the habit every crew needs: plan before the danger arrives. A debrief then compares their choices with what the real data shows, with sources, in English or Portuguese.

## Link to Project Demo

- 30-second video (plays in the browser): https://mars-outpost-trainer.vercel.app/demo/
- 7 slides (PDF): https://mars-outpost-trainer.vercel.app/demo/slides.pdf

## Link to Final Project

- Play: https://mars-outpost-trainer.vercel.app
- Source code: https://github.com/ilustrandodadosdev/mars-outpost-trainer

## Detailed Project Description

**What it does**

Mars Outpost Trainer is a mission-planning game. The player is the commander of a small outpost in Gale Crater, next to NASA's Curiosity rover. With limited power, they place four kinds of modules on a grid:

- Habitat, which makes oxygen.
- Solar panel, which makes power.
- Greenhouse, which makes food.
- Shield, which blocks radiation.

Four bars show how the crew is doing: Power, Food, Oxygen and Radiation.

When a coronal mass ejection leaves the Sun, a warning appears with the predicted arrival day. The player then has a real trade-off to make. Moving the crew to the shelter protects them from radiation, but the greenhouse goes unattended and food runs down. Surviving 30 sols means planning ahead instead of reacting late.

**How it works**

- Every sol maps to one real day from 21 April to 20 May 2024.
- We downloaded the WSA-Enlil simulations from NASA DONKI through api.nasa.gov and kept the 14 CMEs that NASA predicted would reach Mars. A Python script, `scripts/montar_dados.py`, turns them into `dados/marte-2024.json`.
- Each storm keeps its real launch day, predicted arrival day, speed, and whether it was a direct hit or a glancing blow. The warning comes on the day the CME left the Sun, and the hit comes on the day NASA predicted.
- Each entry in the game log links to its NASA record.
- The finale is the 20 May 2024 solar particle event. It was the biggest radiation surge Curiosity's RAD detector had measured since it landed in 2012.
- When a storm hits, the RAD detector on the Curiosity model glows. Two moving lights in the sky stand for NASA's MAVEN and Mars Odyssey orbiters, which also observed that storm.
- At the end of the mission, the debrief shows the player's results (storms survived, radiation blocked, sols in shelter) next to "What the real data shows". This part uses Curiosity RAD measurements, NASA's 2024 estimate of 8,100 micrograys for an astronaut standing next to Curiosity, and what MAVEN and Odyssey saw. Every fact links to its source.
- We are honest about the simplifications. Radiation doses in the game are balanced for play and are not real measurements. The real particles on 20 May arrived within tens of minutes, but the game gives one sol of warning so players can react. The outpost itself is imaginary.

**Benefits and goals**

- It turns real space weather data into decisions a 10-year-old can make and understand.
- It teaches resource management, risk trade-offs and why prediction matters, which is the mindset of a junior astronaut.
- It needs no install and no account. It runs in any browser, including school computers, and a full mission takes about 10 minutes.
- It is bilingual: one click switches between English and Portuguese, so it works in Brazilian classrooms as well as English-speaking ones.
- Next steps:
  - real Gale Crater terrain from NASA Mars Trek;
  - more missions from other DONKI storm seasons;
  - a teacher guide and classroom playtests;
  - more languages.

**Tools and languages**

- Languages: JavaScript (ES modules), HTML and CSS for the game, and Python for data preparation.
- Libraries: three.js 0.160 for low-poly 3D rendering in the browser.
- Data: the NASA DONKI API via api.nasa.gov.
- Hosting: a static site on Vercel. There is no build step and no server code.
- Demo production: the gameplay was captured with Playwright (headless Chromium), and the frames were edited with Python and Pillow.

## Use of Artificial Intelligence (AI) / Super Intelligence

We used Claude (Anthropic) as a coding assistant. It helped write:

- the game engine code in `src/`;
- the page layout and the Python data script;
- drafts of the documentation and of these submission texts;
- the scripts that captured and edited the demo video and slides.

The game idea, rules, educational goals and design decisions are the participant's own. They are recorded with dates in `IDEIA.md` in the repository, and every AI suggestion was reviewed and accepted or changed by the participant.

All images in the video and slides are real screenshots of the game, which is rendered by code written with AI help; no AI image or video generator was used. Every frame of the video and every slide carries the visible note "code written with AI assistance (Claude)". The README also states that AI was used.

No NASA logos or branding appear in the game or the demo.

## NASA Data

- **NASA DONKI** (Space Weather Database Of Notifications, Knowledge, Information), WSA-Enlil simulations and CME analyses for 21 April – 20 May 2024, via https://api.nasa.gov. This is the source of the 14 storms, their arrival days, speeds and impact type. Database: https://kauai.ccmc.gsfc.nasa.gov/DONKI/
- **NASA (2024), "NASA Watches Mars Light Up During Epic Solar Storm"**: source of the 20 May 2024 event, the 8,100 micrograys estimate, MAVEN's auroras and Mars Odyssey's star camera. https://www.nasa.gov/missions/maven/nasa-watches-mars-light-up-during-epic-solar-storm/
- **Curiosity RAD**, from Hassler et al., *Science* 343 (2014), "Mars' Surface Radiation Environment Measured with the Mars Science Laboratory's Curiosity Rover": source of the normal daily surface dose (about 0.21 mGy/day). https://doi.org/10.1126/science.1244797
- **NASA Curiosity rover mission (MSL)**, for the setting in Gale Crater since 2012. https://science.nasa.gov/mission/msl-curiosity/

## Space Agency Partner Data

None used directly. All mission data comes from NASA sources.

## Other References / Resources

- three.js (MIT License): https://threejs.org
- Playwright (Apache 2.0) to capture the demo, and Pillow (HPND) to edit it.
- Vercel for free static hosting.
- Claude (Anthropic) as an AI coding assistant (see the AI section above).
- Fonts in the video: Segoe UI (system font).
