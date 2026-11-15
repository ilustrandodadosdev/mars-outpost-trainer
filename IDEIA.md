# A ideia do jogo (autoria: Rogenrique)

> As regras do Space Apps exigem que a ideia da solução seja do participante.
> Este arquivo é o registro disso. Preencha com as suas palavras; o Claude implementa.

## Já decidido por você
- Desafio: **Build a Junior Astronaut Mission Trainer** (NASA Space Apps 2026, tema "The Next Frontier").
- Foco: **jogabilidade e facilidade de uso**, gráficos **realistas e simples**.
- Visual: **3D low-poly** com câmera fixa girando em volta da base.
- Local: **Marte**.
- Momento de tensão: **tempestade solar** (14/11/2026). Escolhido pelo Rogenrique entre opções que o Claude levantou: tempestade solar, falha de energia, colheita.
- Mecânica: **aviso de tempestade → poucos sols para ir ao abrigo**. Foi um exemplo dado pelo Claude que o Rogenrique aceitou ("então vamos"). O abrigo protege, mas a estufa fica sem cuidado: troca comida por segurança.
  - Simplificação científica: a luz da explosão chega na hora; a nuvem (CME) chega dias depois, no dia previsto pela NASA. As doses do jogo são de equilíbrio, não medidas.

## Decidido em 14/11/2026 (Rogenrique: "pode seguir conforme sua orientação")
O Claude apresentou opções; o Rogenrique aceitou o pacote abaixo, mirando a premiação global.
1. **Público:** alunos de 10 a 14 anos (fundamental II).
2. **Aprendizado:** "Para viver numa nova fronteira é preciso planejar antes do perigo chegar — e o clima espacial é um perigo real."
3. **Vitória:** manter o posto de pé até o sol 30, quando a próxima tripulação pousa. **Derrota:** comida ou oxigênio zerados, ou radiação no máximo.
4. **Módulos:** ficam os 4 (Habitat, Solar panel, Greenhouse, Shield). Profundidade antes de quantidade.
5. **Nome:** **Mars Outpost Trainer** (o Rogenrique escolheu esse nome para o repositório e para o domínio).
6. **Prioridades para o global:** dado real da NASA com profundidade (explosões, CMEs previstas para Marte, dose medida pelo Curiosity/RAD), tela final que ensina com fonte, inglês e português, teste com aluno real, vídeo com história.

## O que já está no esqueleto (técnico, provisório)
- Terreno 3D gerado (provisório) — trocar por recorte real do **Mars Trek**.
- 4 barras: Power, Food, Oxygen, Radiation.
- Construir clicando no chão; "Next sol" avança um dia.
- **Cada sol = um dia real, de 21/04 a 20/05/2024.** As tempestades são as CMEs que o modelo WSA-Enlil da NASA (DONKI) previu chegarem a Marte nesse período (14 eventos); o aviso vem no dia em que a CME saiu do Sol. O final é a tempestade de 20/05/2024 medida pelo Curiosity (8,1 mGy). Decidido em 14/11/2026: o endpoint de explosões (FLR) do DONKI estava fora do ar, e as previsões para Marte servem melhor ao jogo.
- Todos os números estão em `src/regras.js`, marcados como provisórios.

## Fidelidade aos fatos (decidido em 14/11/2026, Rogenrique: "Sim, ajusta")
- A base é imaginária; tudo em volta é real. Fica na **cratera Gale**, ao lado do **Curiosity** (confirmado em science.nasa.gov/mission/msl-curiosity).
- Só entram missões que a NASA cita na tempestade de maio de 2024: **Curiosity** (RAD mediu o maior pico desde 2012), **MAVEN** (fotografou auroras) e **Mars Odyssey** (câmera de estrelas apagou por um tempo). No jogo: Curiosity em 3D com o detector RAD piscando quando a tempestade bate; MAVEN e Odyssey como duas luzes no céu.
- Ficam de fora: Ingenuity (missão encerrada em 25/01/2024), InSight (encerrada antes), Perseverance (ativo, mas em Jezero e não citado no evento).
- Os 8.100 µGy são a conta da NASA para "um astronauta ao lado do Curiosity", não uma leitura direta — o texto diz isso.
- No evento final, as partículas chegaram em dezenas de minutos; o jogo dá 1 sol de aviso, e a tela final explica essa simplificação.
