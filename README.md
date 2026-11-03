# SHOT

Protótipo de campo de tiro 3D para PC, feito com Three.js e Vite. Cenário industrial procedural, sombras, colisões, alvos móveis, M4A1 e M1911 estilizadas, recarga e áudio sintetizado pela Web Audio API. Não depende de serviços externos ou chaves.

## Executar

Requer Node.js 22.12+ (validado com 24) e navegador desktop com WebGL2.

```sh
npm ci
npm run dev
```

Clique em **Iniciar operação** para ativar áudio e capturar o mouse. WASD move, mouse mira, botão esquerdo atira, botão direito aproxima a mira, Shift corre, Espaço pula, R recarrega, 1/2 troca de arma e Esc pausa.

```sh
npm run build
npm run preview
```

O projeto é um protótipo de treinamento local, sem inimigos, multiplayer ou dano ao jogador. Armas e ambiente são geometrias procedurais estilizadas: não são modelos licenciados ou visuais ultrarrealistas. Áudio também é procedural, não gravação de armas reais. Qualidade de produção exige assets, animações e trabalho de iluminação e otimização adicionais.
