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

## Inscrição: só no Global (decidido em 15/11/2026, Rogenrique: "Nosso projeto concorrerá só no Global ok?")
- O projeto concorre apenas na premiação **global** do Space Apps 2026; não participa de julgamento de evento local.
- Toda a submissão (vídeo, slides, textos em `SUBMISSAO.md`) é em inglês, pensada para os juízes globais.

## Bilinguismo de verdade (15/11/2026)
- O registro de eventos do jogo agora muda de idioma junto com o resto da tela; antes as linhas antigas ficavam no idioma em que foram escritas.
- O botão EN/PT funciona também na tela final (antes ficava coberto pela camada escura).
- A linha da fonte dos dados e o aviso de dados simulados também foram traduzidos. Só os títulos das fontes citadas ficam no idioma original, como em qualquer referência.

## Versão realista: branch `versao-realista` (15/11/2026)

Rogenrique: "vamos criar uma nova branch e trabalhar em uma versão mais realista possivel para ser rodada direto do navegador seja de computadores ou celulares!"

**Regra da branch:** a `main` é a versão inscrita. Ela fica intacta, e a Vercel continua publicando a `main`. A realista só entra na `main` se ficar pronta e testada no PC e no celular antes do prazo (15/11/2026 23:59). Se não ficar, ela segue como evolução depois do hackathon.

Plano, por ordem de ganho visual por hora de trabalho:

1. **Terreno real da cratera Gale**
   - Trocar o relevo gerado por um recorte de DEM do Mars Trek/HiRISE da região do Curiosity. Antes de usar, confirmar a disponibilidade e a licença do recorte.
   - Converter o recorte para heightmap PNG de 16 bits em 256×256 no PC e 128×128 no celular.
   - Citar a fonte no rodapé, como já é feito com o DONKI.
2. **Luz e material físicos**
   - Usar MeshStandardMaterial com textura de solo marciano (albedo e normal map gerados por nós ou de domínio público).
   - Sol baixo com sombra suave, céu cor de caramelo de dia e azulado no pôr do sol (fato observado pelo Curiosity).
   - Névoa de poeira que engrossa durante a tempestade.
3. **Clima visível**
   - Partículas de poeira durante a tempestade.
   - Escurecimento do céu proporcional ao evento real do DONKI.
   - Painéis solares rendendo menos sob poeira, já ligados às regras.
4. **Celular de verdade**
   - Toque para construir, pinça para zoom, arrastar para girar a câmera.
   - Botões de pelo menos 44 px e HUD que se reorganiza na vertical.
   - `devicePixelRatio` limitado a 2.
5. **Desempenho**
   - Detectar aparelho fraco e reduzir sombras, partículas e malha.
   - Meta: 30 fps num celular intermediário e 60 fps no PC.
   - Carregar tudo do próprio site, sem servidor.
6. **Teste**
   - Playwright em viewport de celular (390×844, toque) e de PC.
   - Teste bilíngue repetido.
   - Partida completa sem erro no console.

O que não muda: dados reais do DONKI, regra de nunca apresentar dado simulado como real, bilinguismo e o texto do registro.
