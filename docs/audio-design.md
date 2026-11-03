# SHOT — Projeto de som / Build 03

O áudio da versão web é inteiramente sintetizado com Web Audio, sem samples externos. É uma direção sonora de ação e combate, não uma reprodução acústica fiel de armamentos reais.

## Mixagem

Quatro controles no menu: geral (65%), armas (80%), passos/equipamento (55%) e ambiente (35%). A tecla M silencia o geral. Um compressor limita picos antes da saída. Ao pausar, perder foco ou encerrar a partida, o áudio entra em silêncio com uma transição curta. Sons só começam após interação do usuário. Fones estéreo são recomendados.

| Camada | Tratamento implementado |
| --- | --- |
| M4A1 | Transiente de ruído mais agudo, corpo tonal curto e mecanismo metálico após o disparo |
| AK-47 | Corpo mais grave, envelope mais longo e cadência mais lenta |
| Ambiente espacial | Disparos e passos dos bots têm posição 3D, orientação do ouvinte e atenuação por distância; tiros com cobertura até o jogador recebem filtro mais fechado |
| Pátio | Eco curto nos tiros locais, vento contínuo filtrado, explosões distantes cinematográficas espaçadas |
| Equipamento | Quatro eventos de recarga sincronizados com cada arma; salto, aterrissagem e atrito do deslize |
| Passos | Acionados pela distância percorrida; corrida mais forte e agachamento mais silencioso |
| Retorno de combate | Som curto de acerto e impacto recebido, separado dos disparos |

## Implementação e evolução

`src/audio.js` contém o mixer e os sintetizadores. O jogo atualiza posição e direção do ouvinte a cada quadro ativo. Os sons de recarga agendados são cancelados ao morrer, pausar ou reiniciar. Fontes curtas desconectam seus nós ao terminar. O vento é reutilizado como fonte contínua; não depende de requisições de rede.

A camada cinematográfica pode ser reduzida a zero para ouvir apenas o combate real da partida. Ainda não há música, voz, áudio gravado de armas, reverberação baseada na geometria ou simulação acústica física. Para áudio de produção, o próximo passo é substituir os geradores por bancos de gravações licenciados, mantendo o mixer e os eventos existentes.
