import * as T from 'three';
import './style.css';
import { createWorld, MAPS } from './world.js';
import { applyDamage, isEnemy, teamScores, lineClear } from './combat.js';
import { createBots, assignTeams, tickBots, respawnActor, TEAMS } from './bots.js';
import { createLoadout, buildWeapon, disposeWeapon } from './weapons.js';
import { Movement } from './movement.js';
import { BattleAudio } from './audio.js';

const $=id=>document.getElementById(id);
const renderer=new T.WebGLRenderer({canvas:$('game'),antialias:true});
renderer.setPixelRatio(Math.min(devicePixelRatio,2));renderer.setSize(innerWidth,innerHeight);
renderer.shadowMap.enabled=true;renderer.shadowMap.type=T.PCFSoftShadowMap;
renderer.toneMapping=T.ACESFilmicToneMapping;renderer.toneMappingExposure=1.1;
const scene=new T.Scene();
const camera=new T.PerspectiveCamera(75,innerWidth/innerHeight,.04,180);
camera.rotation.order='YXZ';camera.position.set(0,1.7,26);scene.add(camera);
const {colliders,solids}=createWorld(scene);
const movement=new Movement(camera.position,colliders);
const player={name:'VOCÊ',team:'dae',position:camera.position,health:100,kills:0,deaths:0,alive:true,invulnerable:3,respawn:0};
const bots=createBots(scene),actors=[player,...bots];
assignTeams(bots,player.team);
const weapons=createLoadout(),gun=new T.Group();camera.add(gun);
let wi=0,weaponModel;
function equip(index){if(weaponModel){gun.remove(weaponModel);disposeWeapon(weaponModel)}wi=index;weaponModel=buildWeapon(weapons[wi].id);gun.add(weaponModel)}
equip(0);gun.position.set(.24,-.24,-.45);
const flash=new T.PointLight(0xffbb62,0,5);camera.add(flash);flash.position.set(.2,-.18,-1.1);
const muzzle=new T.Mesh(new T.ConeGeometry(.04,.14,5),new T.MeshBasicMaterial({color:0xffe0a0,transparent:true,opacity:0,depthWrite:false,blending:T.AdditiveBlending}));muzzle.rotation.x=-Math.PI/2;muzzle.position.set(0,.022,-.8);gun.add(muzzle);
const ray=new T.Raycaster(),effects=[];
let locked=false,keys={},mouse=false,aim=false,reloading=0,lastShot=-1,yaw=0,pitch=0,elapsed=0,stepDistance=0,recoil=0,hitTime=0;
let audio,muted=false,matchTime=300,finished=false,winner='',damageFlash=0,hudClock=0;
const LIMIT=30;
const volumeSettings={master:.65,weapons:.8,foley:.55,ambience:.35};

$('maps').innerHTML=MAPS.map(m=>`<button class="map ${m.available?'selected':''}" ${m.available?'':'disabled'}><span>MAPA ${m.id}</span><b>${m.name}</b><small>${m.available?'EQUIPES · 3 × 3':'EM BREVE'}</small></button>`).join('');
function menuDescription(){
  $('menu-title').innerHTML='PÁTIO DE<br>FERRO.';
  $('intro').textContent='Cartel de Medellín × DAE. Escolha seu time. 3 contra 3, com cinco bots. 30 eliminações ou 5 minutos.';
}
for(const button of document.querySelectorAll('[data-team]'))button.onclick=()=>{
  if(player.team===button.dataset.team)return;
  player.team=button.dataset.team;assignTeams(bots,player.team);resetMatch();equip(player.team==='dae'?0:1);hud();menuDescription();$('play').textContent='INICIAR NOVA PARTIDA ↗';
  for(const b of document.querySelectorAll('[data-team]')){b.classList.toggle('selected',b===button);b.setAttribute('aria-pressed',String(b===button))}
};
for(const input of document.querySelectorAll('[data-volume]'))input.oninput=()=>{
  const bus=input.dataset.volume;volumeSettings[bus]=Number(input.value)/100;
  audio?.setVolume(bus,bus==='master'&&muted?0:volumeSettings[bus]);
  input.nextElementSibling.textContent=`${input.value}%`;
};
function mute(){muted=!muted;audio?.setVolume('master',muted?0:volumeSettings.master);$('mute').textContent=muted?'ATIVAR SOM':'SILENCIAR';$('audio-state').textContent=muted?'SOM DESLIGADO [M]':'SOM ATIVO [M]'}
$('mute').onclick=mute;
function hud(){
  const w=weapons[wi],scores=teamScores(actors);
  $('weapon').textContent=w.name;$('ammo').textContent=w.ammo;$('reserve').textContent=w.reserve;
  $('score').textContent=String(player.kills).padStart(2,'0');$('deaths').textContent=player.deaths;
  $('health').innerHTML=`${player.health} <small>HP</small>`;$('healthbar').style.width=`${player.health}%`;
  $('mode').textContent=reloading?'RECARREGANDO':'AUTOMÁTICO';
  $('timer').textContent=`${Math.floor(matchTime/60)}:${String(Math.floor(matchTime%60)).padStart(2,'0')}`;
  $('dae-score').textContent=scores.dae;$('cartel-score').textContent=scores.cartel;
  $('yourteam').textContent=TEAMS[player.team].name;$('yourteam').dataset.team=player.team;
  $('posture').textContent=movement.posture;$('stamina').style.width=`${movement.stamina}%`;
  $('board').replaceChildren(...[...actors].sort((a,b)=>b.kills-a.kills||a.deaths-b.deaths).map(a=>{
    const row=document.createElement('div');row.className=`${a.team} ${a===player?'you':''}`;
    row.textContent=`${a.team==='dae'?'DAE':'CDM'} · ${a.name}   ${a.kills} / ${a.deaths}`;return row;
  }));
}
function damage(victim,amount,killer){
  if(!victim.alive||victim.invulnerable>0||!isEnemy(victim,killer))return;
  if(victim===player){damageFlash=.6;audio?.impact()}
  const died=applyDamage(victim,amount,killer);
  if(died){
    if(victim.group)victim.group.visible=false;
    else{mouse=false;aim=false;reloading=0;movement.sliding=0;audio?.cancelReload()}
    const item=document.createElement('div');item.textContent=`${killer.name} → ${victim.name}`;item.className=killer.team;
    $('feed').prepend(item);while($('feed').children.length>4)$('feed').lastChild.remove();setTimeout(()=>item.remove(),4500);
  }
  hud();
}
function tracer(from,to,bot){
  if(bot)audio?.shot(bot.weaponId,from,!lineClear(colliders,from,camera.position));
  const line=new T.Line(new T.BufferGeometry().setFromPoints([from,to]),new T.LineBasicMaterial({color:bot?.team==='dae'?0xc9e5ff:0xffc78b,transparent:true,opacity:.6}));
  scene.add(line);effects.push({mesh:line,ttl:.07});
}
function refill(){for(const w of weapons){w.ammo=w.capacity;w.reserve=120}}
function resetMatch(){
  matchTime=300;finished=false;winner='';damageFlash=0;hitTime=0;reloading=0;lastShot=-1;
  for(const actor of actors){actor.kills=actor.deaths=0;actor.alive=false}
  for(const actor of actors)respawnActor(actor,actors);
  for(const bot of bots){bot.cooldown=1+bot.index*.2;bot.footstep=0}
  refill();movement.reset();audio?.cancelReload();yaw=player.team==='dae'?0:Math.PI;pitch=0;mouse=false;aim=false;keys={};stepDistance=0;
  $('feed').replaceChildren();hud();
}
function finishMatch(){
  if(finished)return;finished=true;const scores=teamScores(actors);
  winner=scores.dae===scores.cartel?'EMPATE':TEAMS[scores.dae>scores.cartel?'dae':'cartel'].name;
  mouse=false;audio?.cancelReload();document.exitPointerLock();
  $('menu-title').innerHTML='FIM DE<br>PARTIDA.';
  $('intro').textContent=`${winner==='EMPATE'?'Empate':`${winner} venceu`}. DAE ${scores.dae} × ${scores.cartel} Cartel. Você: ${player.kills} eliminações / ${player.deaths} mortes.`;
  $('play').textContent='JOGAR NOVAMENTE ↗';hud();
}
function ejectCase(){
  const casing=new T.Mesh(new T.CylinderGeometry(.006,.006,.025,6),new T.MeshStandardMaterial({color:0xb09a53,metalness:.7,roughness:.35}));
  casing.position.set(.3,-.2,-.6).applyMatrix4(camera.matrixWorld);scene.add(casing);
  const velocity=new T.Vector3(1.5,1,.5).applyAxisAngle(new T.Vector3(0,1,0),yaw);
  effects.push({mesh:casing,ttl:.6,velocity});
}
function shoot(){
  const w=weapons[wi];if(!locked||!player.alive||finished||reloading||elapsed-lastShot<w.delay)return;
  if(!w.ammo){reload();return}w.ammo--;lastShot=elapsed;recoil+=w.recoil;flash.intensity=6;muzzle.material.opacity=.9;audio?.shot(w.id);
  const spread=movement.sliding?.022:movement.running?.015:aim?.0015:.005;
  camera.updateMatrixWorld();ray.setFromCamera(new T.Vector2((Math.random()-.5)*spread,(Math.random()-.5)*spread),camera);
  // Friendly bodies stop the ray, but never take damage.
  const hit=ray.intersectObjects([...solids,...bots.filter(b=>b.alive).map(b=>b.group)],true).find(h=>h.distance>.1&&!h.object.userData.marker);
  if(hit){const victim=hit.object.userData.actor;
    if(victim&&isEnemy(victim,player)&&victim.invulnerable<=0){damage(victim,hit.object.userData.head?100:w.damage,player);hitTime=.16;audio?.hit()}
    const dot=new T.Mesh(new T.SphereGeometry(.025,5,5),new T.MeshBasicMaterial({color:0xffcc77}));dot.position.copy(hit.point);scene.add(dot);effects.push({mesh:dot,ttl:.13});
  }
  ejectCase();hud();
}
function reload(){const w=weapons[wi];if(!player.alive||finished||reloading||w.ammo===w.capacity||!w.reserve)return;reloading=w.reload;audio?.reload(w.id);hud()}
$('play').onclick=async()=>{
  if(finished)resetMatch();
  if(!audio){audio=new BattleAudio();for(const [bus,value] of Object.entries(volumeSettings))audio.setVolume(bus,bus==='master'&&muted?0:value)}
  try{await audio.context.resume();await renderer.domElement.requestPointerLock()}
  catch{$('menu-error').textContent='Não foi possível capturar o mouse. Permita o controle do mouse e tente novamente.'}
};
document.addEventListener('pointerlockchange',()=>{
  locked=document.pointerLockElement===renderer.domElement;document.body.classList.toggle('playing',locked);
  mouse=false;aim=false;keys={};movement.sliding=0;
  audio?.setActive(locked&&!finished);
  if(!locked&&reloading){reloading=0;audio?.cancelReload()}
  if(!locked&&!finished)$('play').innerHTML='CONTINUAR OPERAÇÃO <span>↗</span>';
});
document.addEventListener('mousemove',e=>{if(locked){yaw-=e.movementX*(aim?.001:.0018);pitch=T.MathUtils.clamp(pitch-e.movementY*(aim?.001:.0018),-1.45,1.45)}});
document.addEventListener('keydown',e=>{
  if(e.code==='Escape'&&locked){document.exitPointerLock();return}
  if(e.code==='KeyM'&&locked){mute();return}
  if(!locked||!player.alive||finished)return;
  if(['Space','KeyW','KeyA','KeyS','KeyD','ControlLeft','ControlRight','KeyC'].includes(e.code))e.preventDefault();
  keys[e.code]=true;if(e.repeat)return;
  if(e.code==='KeyR')reload();
  if(e.code==='Space'&&movement.jump())audio?.step();
  if((e.code==='KeyC'||e.code==='ControlLeft'||e.code==='ControlRight')&&movement.startSlide()){aim=false;audio?.slide()}
  if((e.code==='Digit1'||e.code==='Digit2')&&!reloading){equip(e.code==='Digit1'?0:1);lastShot=elapsed;hud()}
});
document.addEventListener('keyup',e=>keys[e.code]=false);
document.addEventListener('mousedown',e=>{if(!locked||!player.alive||finished)return;if(e.button===0){mouse=true;shoot()}if(e.button===2&&!movement.sliding)aim=true});
document.addEventListener('mouseup',e=>{if(e.button===0)mouse=false;if(e.button===2)aim=false});
document.addEventListener('contextmenu',e=>e.preventDefault());
window.addEventListener('blur',()=>{keys={};mouse=false;aim=false;if(locked)document.exitPointerLock()});
document.addEventListener('visibilitychange',()=>{if(document.hidden&&locked)document.exitPointerLock()});

const clock=new T.Clock();
function updateGame(dt){
  elapsed+=dt;matchTime=Math.max(0,matchTime-dt);player.invulnerable=Math.max(0,player.invulnerable-dt);
  audio?.listen(camera.position,yaw);audio?.tick(dt);
  tickBots(bots,player,colliders,dt,elapsed,damage,tracer,(bot,running)=>audio?.step(running,false,bot.position));
  if(!player.alive){player.respawn-=dt;if(player.respawn<=0){respawnActor(player,actors);refill();movement.reset();stepDistance=0}}
  if(player.alive){
    const wasGrounded=movement.grounded,move=movement.update(dt,keys,yaw,aim);
    if(!wasGrounded&&movement.grounded)audio?.impact();
    if(movement.grounded&&!move.sliding){stepDistance+=move.traveled;if(stepDistance>(move.running?1.9:1.45)){audio?.step(move.running,move.crouching);stepDistance=0}}
    if(mouse)shoot();
    if(reloading){reloading-=dt;if(reloading<=0){reloading=0;const w=weapons[wi],n=Math.min(w.capacity-w.ammo,w.reserve);w.ammo+=n;w.reserve-=n;hud()}}
  }
  const scores=teamScores(actors);if(matchTime<=0||Math.max(scores.dae,scores.cartel)>=LIMIT)finishMatch();
  hudClock+=dt;if(hudClock>.2){hud();hudClock=0}
}
function frame(){
  requestAnimationFrame(frame);const dt=Math.min(clock.getDelta(),.05);
  if(locked&&!finished)updateGame(dt);
  recoil=T.MathUtils.damp(recoil,0,12,dt);camera.rotation.set(pitch+recoil,yaw,movement.sliding?-.045:0);
  camera.fov=T.MathUtils.damp(camera.fov,aim?48:movement.sliding?83:75,12,dt);camera.updateProjectionMatrix();
  const bob=locked&&player.alive&&(keys.KeyW||keys.KeyS||keys.KeyA||keys.KeyD)&&!movement.sliding?Math.sin(elapsed*(movement.running?15:10))*.009:0;
  const reloadPhase=reloading/weapons[wi].reload;
  gun.position.lerp(new T.Vector3(aim?0:.24,(aim?-(weapons[wi].id==='m4'?.145:.11):-.24)+bob-(reloading?Math.sin(reloadPhase*Math.PI)*.3:0),-.45+recoil),Math.min(1,dt*12));
  gun.rotation.set(recoil*2,0,reloading?-.4:movement.sliding?-.13:0);gun.visible=player.alive;
  flash.intensity*=Math.exp(-dt*45);muzzle.material.opacity*=Math.exp(-dt*50);muzzle.rotation.z+=dt*20;
  hitTime-=dt;$('hit').style.opacity=hitTime>0?1:0;
  for(let i=effects.length-1;i>=0;i--){const e=effects[i];e.ttl-=dt;if(e.velocity){e.velocity.y-=7*dt;e.mesh.position.addScaledVector(e.velocity,dt);e.mesh.rotation.x+=dt*15}if(e.ttl<=0){scene.remove(e.mesh);e.mesh.geometry.dispose();e.mesh.material.dispose();effects.splice(i,1)}}
  damageFlash=Math.max(0,damageFlash-dt);$('damage').style.opacity=damageFlash;
  $('notice').textContent=finished?`${winner}${winner==='EMPATE'?'':' VENCEU'}`:!player.alive?`ELIMINADO · REAPARECENDO EM ${Math.max(1,Math.ceil(player.respawn))}s`:locked&&player.invulnerable>0?'PROTEÇÃO DE REAPARECIMENTO':'';
  renderer.render(scene,camera);
}
menuDescription();resetMatch();frame();
window.addEventListener('resize',()=>{camera.aspect=innerWidth/innerHeight;camera.updateProjectionMatrix();renderer.setSize(innerWidth,innerHeight)});
export { actors, player, bots, camera, colliders, damage, resetMatch, finished, matchTime, movement, weapons, audio, updateGame, equip, teamScores };
