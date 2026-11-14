# A ideia do jogo (autoria: Rogenrique)

> As regras do Space Apps exigem que a ideia da solução seja do participante.
> Este arquivo é o registro disso. Preencha com as suas palavras; o Claude implementa.

## Já decidido por você
- Desafio: **Build a Junior Astronaut Mission Trainer** (NASA Space Apps 2026, tema "The Next Frontier").
- Foco: **jogabilidade e facilidade de uso**, gráficos **realistas e simples**.
- Visual: **3D low-poly** com câmera fixa girando em volta da base.
- Local: **Marte**.

## Falta você decidir
1. **Público:** que idade tem o aluno que vai jogar?
2. **Momento de tensão:** o que faz o coração acelerar? (tempestade solar real, pane de energia, colheita que falha, poeira nos painéis…)
3. **Aprendizado:** o que o aluno tem que entender depois de 5 minutos jogando?
4. **Vitória e derrota:** como se ganha? (sobreviver N sols, receber a próxima tripulação, completar um experimento…)
5. **Módulos:** os 4 do esqueleto (Habitat, Solar panel, Greenhouse, Shield) servem? Falta algum?
6. **Nome do jogo.**

## O que já está no esqueleto (técnico, provisório)
- Terreno 3D gerado (provisório) — trocar por recorte real do **Mars Trek**.
- 4 barras: Power, Food, Oxygen, Radiation.
- Construir clicando no chão; "Next sol" avança um dia.
- **Cada sol = um dia real do registro de explosões solares da NASA (DONKI).**
- Todos os números estão em `src/regras.js`, marcados como provisórios.
