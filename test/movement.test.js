import { test } from 'node:test';
import assert from 'node:assert/strict';
import * as T from 'three';
import { Movement } from '../src/movement.js';
function advance(m,seconds,keys={}){for(let t=0;t<seconds;t+=.016)m.update(.016,keys,0,false)}
test('crouching changes eye height and prevents standing without headroom',()=>{
  const roof=new T.Box3(new T.Vector3(-2,1.3,-2),new T.Vector3(2,1.5,2));
  const m=new Movement(new T.Vector3(),[roof]);advance(m,1,{KeyC:true});assert.ok(Math.abs(m.position.y-1.05)<.01);advance(m,.3);assert.equal(m.posture,'AGACHADO');assert.ok(m.position.y<1.1);
  advance(m,1.5,{KeyD:true});advance(m,1);assert.equal(m.posture,'EM PÉ');assert.ok(m.position.y>1.69);
});
test('slide requires sprinting, consumes stamina, moves and respects walls',()=>{
  const wall=new T.Box3(new T.Vector3(-3,0,-4),new T.Vector3(3,3,-3.8));const m=new Movement(new T.Vector3(),[wall]);assert.equal(m.startSlide(),false);
  advance(m,.15,{KeyW:true,ShiftLeft:true});assert.equal(m.startSlide(),true);assert.ok(m.stamina<85);assert.equal(m.jump(),false);
  advance(m,1,{KeyC:true});assert.ok(m.position.z>=-3.48-.001);assert.ok(m.position.z<-1);assert.equal(m.startSlide(),false);assert.equal(m.posture,'AGACHADO');assert.ok(m.position.y<1.1);
});
test('jump returns to ground and reset clears slide and restores standing height',()=>{
  const m=new Movement(new T.Vector3(),[]);assert.equal(m.jump(),true);advance(m,.2);assert.ok(m.position.y>1.7);advance(m,1);assert.equal(m.grounded,true);assert.ok(Math.abs(m.position.y-1.7)<.001);
  advance(m,.1,{KeyW:true,ShiftLeft:true});m.startSlide();m.reset();assert.equal(m.sliding,0);assert.equal(m.stamina,100);assert.equal(m.position.y,1.7);
});
