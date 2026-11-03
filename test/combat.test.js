import { test } from 'node:test';
import assert from 'node:assert/strict';
import * as T from 'three';
import { applyDamage, blockedAt, lineClear, findPath, safeSpawn } from '../src/combat.js';
const wall=new T.Box3(new T.Vector3(-1,0,-7),new T.Vector3(1,3,7));
test('solid cover blocks bullets and navigation routes around it',()=>{const a=new T.Vector3(-6,1.3,0),b=new T.Vector3(6,1.3,0);assert.equal(lineClear([wall],a,b),false);assert.equal(lineClear([wall],new T.Vector3(-6,1.3,10),new T.Vector3(6,1.3,10)),true);const route=findPath([wall],a,b);assert.ok(route.length>6);for(const p of route)assert.equal(blockedAt([wall],p.x,p.z,.6),false);for(let i=1;i<route.length;i++)assert.ok(route[i].distanceTo(route[i-1])<=2.01)});
test('damage, spawn protection, death and kill attribution',()=>{const victim={alive:true,invulnerable:2,health:100,deaths:0},killer={kills:0};assert.equal(applyDamage(victim,100,killer),false);assert.equal(victim.health,100);victim.invulnerable=0;assert.equal(applyDamage(victim,34,killer),false);assert.equal(victim.health,66);assert.equal(applyDamage(victim,100,killer),true);assert.equal(victim.health,0);assert.equal(victim.deaths,1);assert.equal(killer.kills,1);applyDamage(victim,100,killer);assert.equal(killer.kills,1)});
test('spawn selects a point far from living opponents',()=>{const point=safeSpawn([[0,0],[20,20]],[{alive:true,position:new T.Vector3(1,0,1)}]);assert.deepEqual(point,[20,20])});

test('teams reject friendly damage and score only enemy eliminations',async()=>{
  const {isEnemy,teamScores}=await import('../src/combat.js');
  const a={team:'dae',kills:0},ally={team:'dae',health:100,alive:true,invulnerable:0,deaths:0,kills:0},enemy={team:'cartel',health:100,alive:true,invulnerable:0,deaths:0,kills:0};
  assert.equal(isEnemy(a,ally),false);assert.equal(applyDamage(ally,100,a),false);assert.equal(ally.health,100);
  assert.equal(applyDamage(enemy,100,a),true);assert.deepEqual(teamScores([a,ally,enemy]),{dae:1,cartel:0});
});
test('bots form balanced teams and never select allies as targets',async()=>{
  const {createBots,assignTeams,tickBots,respawnActor}=await import('../src/bots.js');
  const scene=new T.Scene(),bots=createBots(scene);assignTeams(bots,'dae');
  const player={name:'player',team:'dae',alive:true,position:new T.Vector3(0,1.7,-2),health:100,kills:0,deaths:0,invulnerable:0};
  const actors=[player,...bots];assert.equal(actors.filter(a=>a.team==='dae').length,3);assert.equal(actors.filter(a=>a.team==='cartel').length,3);
  for(const b of bots){b.alive=false;b.respawn=100}
  const shooter=bots[0],enemy=bots[2];shooter.alive=enemy.alive=true;shooter.position.set(0,0,0);enemy.position.set(4,0,-6);shooter.invulnerable=enemy.invulnerable=0;shooter.cooldown=0;enemy.cooldown=100;
  const traces=[];tickBots(bots,player,[],.1,1,()=>{},(from,to,bot)=>traces.push({to,bot}));
  assert.equal(traces[0].bot,shooter);assert.equal(traces[0].to.x,enemy.position.x);
  assignTeams(bots,'cartel');assert.equal(bots[0].team,'cartel');assert.equal(bots[2].team,'dae');
  respawnActor(bots[0],actors);assert.ok(bots[0].position.z<-40);respawnActor(bots[2],actors);assert.ok(bots[2].position.z>20);
});
