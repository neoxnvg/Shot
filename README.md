# SHOT

FPS 3D para PC, feito com Three.js e Vite. Mapa 1/5: Pátio de Ferro, um cenário industrial procedural com contêineres, depósitos, torre d’água, guindaste, piso desgastado, sombras e colisões. M4A1 e M1911 estilizadas, recarga e áudio sintetizado pela Web Audio API. Não depende de serviços externos ou chaves.

Mata-mata com cinco bots que navegam por obstáculos e atacam o jogador e uns aos outros. Vence quem alcançar 15 eliminações ou liderar ao fim de cinco minutos; empates usam menos mortes e então a ordem do placar. Morte causa reaparecimento em três segundos, com dois segundos de proteção e reposição de munição. Esc pausa toda a simulação. Os mapas 2–5 ainda não estão disponíveis.

## Executar

Requer Node.js 22.12+ (validado com 24) e navegador desktop com WebGL2.

```sh
npm ci
npm run dev
```

Clique em **Iniciar operação** para ativar áudio e capturar o mouse. WASD move, mouse mira, botão esquerdo atira, botão direito aproxima a mira, Shift corre, Espaço pula, R recarrega, 1/2 troca de arma e Esc pausa.

```sh
npm test
npm run build
npm run preview
```

O projeto é um protótipo local com bots, sem multiplayer. Armas e ambiente são geometrias procedurais estilizadas: não são modelos licenciados ou visuais ultrarrealistas. Áudio também é procedural, não gravação de armas reais. Qualidade de produção exige assets, animações e trabalho de iluminação e otimização adicionais.

## Automatic updates on an existing Ubuntu server

`.github/workflows/publish-web.yml` builds every push to `main` and publishes compiled files to `web`. GitHub Actions must be enabled and allowed to write repository contents. No SSH secret is needed: the server pulls updates using its existing Git read access. A failed build leaves the previous web version installed.

On the server, with the existing clean `~/shot-web` checkout on branch `web`:

```sh
git -C ~/shot-web fetch origin main
git -C ~/shot-web show FETCH_HEAD:scripts/install-server.sh > /tmp/shot-install.sh
bash /tmp/shot-install.sh
```

The installer requires Python 3, Git, flock, timeout and a working user crontab. It preserves unrelated cron entries, installs helpers under `~/.local/share/shot`, and serves the game on **127.0.0.1:8001**. It checks for updates and restarts a stopped server every minute; `@reboot` starts it after boot if the system cron service is enabled. Check the installer's HTTP readiness result, then verify after closing SSH and after a server reboot. Restricted cron policies require administrator help. No Nginx configuration is modified.

On your Windows computer, keep this tunnel open while playing:

```sh
ssh -N -L 8001:127.0.0.1:8001 nelson@45.79.9.248
```

Open `http://localhost:8001` on that computer. This is private access through SSH, not a public website. Pointer lock and audio work on localhost. Logs: `~/.local/share/shot/server.log` and `cron.log`. Updates refuse local checkout changes or diverging history. For private repositories the server needs noninteractive read-only Git authentication; do not store a password in scripts.

To disable automatic updates and restarts, run `crontab -e` and remove only the two lines ending in `# SHOT-MANAGED`. This does not stop an already running server.
