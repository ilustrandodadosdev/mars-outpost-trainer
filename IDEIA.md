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
  - Simplificação científica: a luz da explosão chega na hora; as partículas chegam depois (no jogo: classe X = 1 sol, classe M = 2 sols).

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
- **Cada sol = um dia real do registro de explosões solares da NASA (DONKI).**
- Todos os números estão em `src/regras.js`, marcados como provisórios.
