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

### Etapa 1 feita: relevo real (15/11/2026)
- **Fonte:** USGS Astrogeology, *MSL Gale Merged DEM 1 m v3*. O arquivo de 3,9 GB não é baixado inteiro: `scripts/relevo/dem_linhas.py` lê só as linhas necessárias por HTTP Range, uns 20 MB.
- **Recorte:** quadrado de 8 km × 8 km centrado em -4,6526°, 137,4413°, cerca de 3,7 km ao sul do Bradbury Landing.
  - 1 unidade do jogo = 100 m.
  - A tela inicial olha para o sul, com o Monte Sharp no horizonte.
- **Exagero vertical de 2×**, declarado na lista de fontes do jogo e no README. Em escala real a planície fica lisa demais para ler na tela.
- **Base:** praça nivelada no centro, como já era. As pedras são decorativas e diminuíram para combinar com a escala.
- **Achado para a etapa 4:** no celular em pé, a câmera fica colada na grade e o HUD cobre metade da tela. Isso já era assim na `main`.

### Etapa 2 feita: luz e solo (15/11/2026)
- **Céu:** shader próprio em `src/visual.js`. Do zênite ao horizonte o céu vai em caramelo, com halo azulado perto do Sol baixo, que é o pôr do sol fotografado pelo Curiosity em Gale (NASA/JPL PIA19400).
  - Tem uniforme `poeira` (0 = limpo, 1 = tempestade) reservado para a etapa 3.
- **Sol:** fim de tarde a oeste-sudoeste, ~22° acima do horizonte, então as sombras ficam longas.
  - Tone mapping ACES, exposição 1,3.
  - Mapa de sombra 2048 no PC e 1024 no celular.
- **Solo:** textura de regolito e normal map gerados no navegador, sem baixar imagem (poeira, cascalho e pedrinhas). A textura é de 512 px no PC e 256 px no celular.
- **Testado:** PC e celular sem erro de console; partida inteira em EN e PT.

### Etapa 3 feita: poeira e clima (15/11/2026)
- **Névoa da estação:** abril e maio de 2024 caem no verão do hemisfério sul de Marte, a estação mais empoeirada. Com a névoa, o horizonte some mais perto e o céu fica mais apagado.
  - A fonte é Lemmon et al. (2024), o registro de opacidade do Curiosity.
  - Não existe série diária pública desse mês, então o nível é fixo e **ilustrativo**, e a lista de fontes do jogo diz isso.
- **Poeira no ar:** grãos levados pelo vento perto da câmera. É tudo na placa de vídeo, sem custo de CPU: 600 grãos no PC e 220 no celular.
- **Redemoinhos (dust devils):** 3 no PC e 2 no celular, andando com o vento. Cada um vive de 25 a 45 s e depois nasce em outro lugar.
  - O Curiosity filmou um em Gale (NASA/JPL PIA24039).
  - Aqui o tamanho é de 10 a 30 m de largura e 150 a 400 m de altura, dentro da faixa vista em Marte.
- **Céu:** a emenda que aparecia no horizonte foi corrigida.
- **Fontes novas** na tela final: PIA19400, Lemmon et al. 2024, PIA24039.
- **Testado:** PC e celular sem erro; partida inteira em EN e PT. Só os títulos das fontes ficam em inglês.

## Escolha da missão: Curiosity (Gale) ou Perseverance (Jezero)

- Tela inicial com dois cartões; a escolha vai para a URL (`?missao=curiosity|perseverance`), então dá para mandar o link direto de uma missão. "Trocar de missão" no debrief volta para a tela.
- **Missão tripulada:** nenhum ser humano foi a Marte ainda. A tela diz isso e que a tripulação do jogo é **simulada** (o jogador treina para ser a primeira).
- **Perseverance / Jezero:**
  - Relevo real: USGS Mars 2020 TRN HiRISE DTM mosaic 1 m (CC0), quadrado de 8 km a ~1,7 km a oeste do pouso; o delta fica à frente da câmera. Jezero tem só ~250 m de desnível no quadrado, então o exagero vertical é **4×** (Gale continua 2×), declarado nas fontes.
  - Som real: vento gravado pelo microfone do SuperCam no sol 4 (22/02/2021), NASA/JPL-Caltech/LANL/CNES (página "Sounds from Beyond"). Trecho de 26 s, volume normalizado, em laço; OGG de 29 KB com WAV reserva para o Safari. Botão 🔊/🔇 no topo.
  - O detector RAD (que brilha nas tempestades) fica escondido: ele é do Curiosity.
  - Fato novo no debrief: MOXIE fez 122 g de oxigênio (NASA, 2023).
- **Curiosity / Gale:** sem som, e o debrief explica que o Curiosity não tem microfone.
- O clima espacial (DONKI, abr–mai 2024) é o mesmo nas duas: tempestade solar atinge Marte inteiro. A dose de referência continua sendo a do RAD do Curiosity.

## Tela que se adapta e tutorial guiado (15/11/2026)
Pedido: "a escala do jogo na tela não está adaptada e as funcionalidades não estão claras".
- **Escala:** o HUD inteiro é medido em rem, e a fonte base cresce com a tela (12 a 15 px; 11 px em tela baixa). Celular em pé: barras em 2×2, módulos em 4 colunas só com o custo (⚡), "Próximo sol" na largura toda. Celular deitado e notebook: módulos compactos.
- **Zoom bloqueado:** pinça, Ctrl+roda e gestos do Safari não ampliam mais a página (era o que cortava o HUD no print). Ctrl+0 desfaz zoom que o Chrome já tenha guardado.
- **Diário recolhível:** botão "📜 Diário da missão" com contador de mensagens novas; começa fechado em tela pequena.
- **Dica de ação:** uma linha acima dos módulos diz o que fazer agora (escolher módulo, onde clicar, ou que falta energia).
- **Tutorial de 8 passos:** objetivo, barras, módulos, radiação/abrigo, próximo sol, tempestades, diário, botão "?". Abre sozinho na primeira partida (lembrado no navegador), volta pelo "?", e aceita ←/→/Esc. Destaca cada parte da tela e os números vêm de regras.js, para o tutorial nunca contar uma regra diferente da do jogo. Avisa que os números do jogo são simplificados, não medidas reais.
- Testado em 1366, 1920, celular em pé (390×844) e deitado (844×390), sem erro no console.

## Publicação (15/11/2026)
Com o OK do Rogenrique, a versão realista entrou na `main` (fast-forward até e4d378c) e foi publicada na Vercel pela linha de comando (`vercel deploy --prod`; a Vercel não publica sozinha a partir do GitHub). Conferido no ar no PC e no celular, sem erro no console. O vídeo de 30 s e os slides em /demo/ ainda mostram a versão anterior.

## 1º sol como tutorial jogado + botão Início (15/11/2026)
Pedidos: "a primeira lua deve servir de tutorial guiado, guiando o jogador e apresentando a jogabilidade" (entendido como o 1º sol) e "um botão de reiniciar o jogo e ida para a tela inicial onde escolhemos a missão".
- **Tutorial jogado (10 passos):** boas-vindas → barras → *o jogador escolhe o Painel solar* → *constrói no chão* → "construído!" com custo e energia que sobrou → *passa o sol* → "Sol 2: veja o que mudou" (habitat = O₂, estufa = comida, painel = energia) → tempestades → diário → "agora é com você".
- Nos passos de ação o balão não tem "Próximo": ele espera o jogador agir (aviso piscando "👉 toque..."). O jogo fica clicável e só o balão segura o clique; no passo de construir o escurecido some para o chão ficar à vista.
- Não dá para voltar de um passo de ação (não se desfaz uma jogada). Se o jogador passar o sol antes da hora, o tutorial pula para "veja o que mudou". Reaberto pelo "?" sem energia, pula a parte de construir. Aceita qualquer módulo, mas sugere o painel solar.
- **Botão ⌂ no topo:** reinicia e volta para a escolha da missão. No meio da partida pede um 2º toque ("Reiniciar? Toque de novo", 3 s) para ninguém perder a missão sem querer; no começo da partida vai direto.

## Metas por missão e "Missão real × sua partida" (15/11/2026)

Pedido do Rogenrique: deixar claro o objetivo de cada missão e o que é a partida perfeita.

- Cada missão tem 3 metas (`MISSOES[...].metas` em `src/missoes.js`; avaliação em `avaliarMetas`, `src/regras.js`):
  - **Curiosity (RAD, radiação):** sobreviver 30 sols · estar no abrigo quando chegar a tempestade de partículas de 20/05/2024 (sol 30) · terminar com radiação abaixo de 50.
  - **Perseverance (MOXIE, oxigênio):** sobreviver 30 sols · produzir 150 de O₂ (habitats + estufas) · estar no abrigo na tempestade de 20/05/2024.
- As metas aparecem no passo 1 do tutorial, numa linha recolhível "🎯 Metas n/3" no topo (com progresso) e na tela de escolha ("Desafio").
- O debrief abre com "Missão real × sua partida": para cada meta, o resultado do jogador marcado **Você (simulação)** e o dado da NASA marcado **NASA (real)**. Cumprir todas = "Partida perfeita".
- Limites (50 de radiação, 150 de O₂) são de jogo, em `METAS`. Com abrigo nas tempestades e 3 escudos dá para cumprir tudo. Sem abrigo, a radiação termina perto de 94 e a meta falha.
- Dados reais usados (todos já com fonte no debrief): 8.100 µGy em 20/05/2024 (NASA 2024), cerca de 0,21 mGy/dia (Hassler et al. 2014), MOXIE 122 g de O₂ em 2021–2023 (NASA 2023), pousos em ago/2012 e fev/2021.
- Sem dado real carregado (calendário simulado), a meta da tempestade fica "sem dado real" e sai da contagem.

## Textura real do chão de Jezero (19/11/2026)

- Decisão: o chão da missão Perseverance usa o ortomosaico HiRISE da USGS (Mars 2020 TRN, 25 cm/px), recortado na janela de 8 km do relevo e reduzido a 2048 px (cerca de 4 m/px). A imagem é cinza e normalizada, e a cor vem da paleta da missão, pela cor do vértice.
- Quebra a regra antiga "nenhuma imagem externa": ela vale só para o solo gerado. A Curiosity continua com o solo gerado.
- Fonte e licença: a página de dados da USGS marca CC0; a página do produto pede citar os autores. Crédito incluído na lista de fontes.
- Script: `scripts/relevo/ortho_recorte.py` (lê só a janela por HTTP Range; o arquivo completo tem 6,9 GB).
- Limite: de perto, o detalhe ainda é o grão gerado, porque a imagem tem 4 m por pixel.
