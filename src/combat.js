import * as T from 'three';
export function blockedAt(colliders,x,z,radius=.38){return colliders.some(b=>b.max.y>.3&&b.min.y<1.9&&x>b.min.x-radius&&x<b.max.x+radius&&z>b.min.z-radius&&z<b.max.z+radius)}
export function lineClear(colliders,a,b){const direction=b.clone().sub(a);const distance=direction.length();if(distance<.01)return true;const ray=new T.Ray(a,direction.divideScalar(distance));const hit=new T.Vector3();return !colliders.some(box=>ray.intersectBox(box,hit)&&hit.distanceTo(a)<distance-.15)}
const CELL=2,MINX=-28,MINZ=-53,COLS=29,ROWS=42;
export function findPath(colliders,start,end){
  const cell=p=>[Math.max(0,Math.min(COLS-1,Math.round((p.x-MINX)/CELL))),Math.max(0,Math.min(ROWS-1,Math.round((p.z-MINZ)/CELL)))];
  const [sx,sz]=cell(start),[ex,ez]=cell(end),key=(x,z)=>z*COLS+x;
  const begin=key(sx,sz),goal=key(ex,ez);const open=[begin],cost=new Map([[begin,0]]),parent=new Map(),closed=new Set();
  while(open.length){let best=0;for(let i=1;i<open.length;i++){const score=id=>cost.get(id)+Math.abs(id%COLS-ex)+Math.abs(Math.floor(id/COLS)-ez);if(score(open[i])<score(open[best]))best=i}const current=open.splice(best,1)[0];if(current===goal){const path=[];let n=current;while(n!==begin){path.unshift(new T.Vector3(MINX+n%COLS*CELL,0,MINZ+Math.floor(n/COLS)*CELL));n=parent.get(n)}return path}closed.add(current);const x=current%COLS,z=Math.floor(current/COLS);for(const [dx,dz] of [[1,0],[-1,0],[0,1],[0,-1]]){const nx=x+dx,nz=z+dz;if(nx<0||nz<0||nx>=COLS||nz>=ROWS)continue;const next=key(nx,nz);if(closed.has(next)||blockedAt(colliders,MINX+nx*CELL,MINZ+nz*CELL,.6))continue;const g=cost.get(current)+1;if(g<(cost.get(next)??Infinity)){cost.set(next,g);parent.set(next,current);if(!open.includes(next))open.push(next)}}}
  return [];
}
export function isEnemy(a,b){return a!==b&&(!a.team||!b.team||a.team!==b.team)}
export function teamScores(actors){return {dae:actors.filter(a=>a.team==='dae').reduce((n,a)=>n+a.kills,0),cartel:actors.filter(a=>a.team==='cartel').reduce((n,a)=>n+a.kills,0)}}
export function applyDamage(victim,amount,killer){if(!victim.alive||victim.invulnerable>0||(killer&&!isEnemy(victim,killer)))return false;victim.health=Math.max(0,victim.health-amount);if(victim.health>0)return false;victim.alive=false;victim.deaths++;victim.respawn=3;if(killer&&killer!==victim)killer.kills++;return true}
export function safeSpawn(spawns,actors){return spawns.reduce((best,p)=>{const safety=s=>Math.min(...actors.filter(a=>a.alive).map(a=>Math.hypot(s[0]-a.position.x,s[1]-a.position.z)),1000);return safety(p)>safety(best)?p:best},spawns[0])}
