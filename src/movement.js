import * as T from 'three';
const STAND=1.7,CROUCH=1.05,SLIDE=.72,RADIUS=.32;
export class Movement {
  constructor(position,colliders){this.position=position;this.colliders=colliders;this.reset()}
  reset(){this.feet=0;this.velocityY=0;this.eye=STAND;this.grounded=true;this.sliding=0;this.cooldown=0;this.stamina=100;this.posture='EM PÉ';this.running=false;this.slideDirection=new T.Vector3();this.position.y=STAND}
  overlaps(x,z,feet,height){return this.colliders.some(b=>feet+.04<b.max.y&&feet+height>b.min.y&&x>b.min.x-RADIUS&&x<b.max.x+RADIUS&&z>b.min.z-RADIUS&&z<b.max.z+RADIUS)}
  jump(){if(this.grounded&&!this.sliding&&this.posture==='EM PÉ'){this.velocityY=5.6;this.grounded=false;return true}return false}
  startSlide(){if(!this.running||!this.grounded||this.cooldown>0||this.stamina<15)return false;this.sliding=.85;this.cooldown=1.6;this.stamina-=15;this.running=false;return true}
  update(dt,keys,yaw,aim){
    this.cooldown=Math.max(0,this.cooldown-dt);
    const crouch=keys.KeyC||keys.ControlLeft||keys.ControlRight;
    const standingBlocked=this.overlaps(this.position.x,this.position.z,this.feet,STAND+.12);
    let dx=(!!keys.KeyD)-(!!keys.KeyA),dz=(!!keys.KeyS)-(!!keys.KeyW);const length=Math.hypot(dx,dz);if(length){dx/=length;dz/=length}
    const direction=new T.Vector3(dx*Math.cos(yaw)+dz*Math.sin(yaw),0,-dx*Math.sin(yaw)+dz*Math.cos(yaw));
    this.running=!!(length&&(keys.ShiftLeft||keys.ShiftRight)&&keys.KeyW&&!crouch&&!aim&&!this.sliding&&!standingBlocked&&this.stamina>1);
    let targetEye=standingBlocked||crouch?CROUCH:STAND;
    let speed=targetEye===CROUCH?2.1:aim?2.4:this.running?7.5:4.3;
    if(this.sliding>0){this.sliding=Math.max(0,this.sliding-dt);targetEye=SLIDE;speed=3.5+6*(this.sliding/.85);direction.copy(this.slideDirection);this.posture='DESLIZANDO'}else{this.posture=targetEye===CROUCH?'AGACHADO':this.running?'CORRENDO':'EM PÉ';if(length)this.slideDirection.copy(direction)}
    this.stamina=T.MathUtils.clamp(this.stamina+(this.running?-17:12)*dt,0,100);
    // Lower the collision capsule immediately; raise it only after checking headroom.
    this.eye=T.MathUtils.damp(this.eye,targetEye,18,dt);const height=targetEye+.12;
    const start=this.position.clone(),step=direction.multiplyScalar(speed*dt);const steps=Math.max(1,Math.ceil(step.length()/.12));step.divideScalar(steps);
    for(let i=0;i<steps;i++){if(!this.overlaps(this.position.x+step.x,this.position.z,this.feet,height))this.position.x+=step.x;if(!this.overlaps(this.position.x,this.position.z+step.z,this.feet,height))this.position.z+=step.z}
    const traveled=Math.hypot(this.position.x-start.x,this.position.z-start.z);if(this.sliding&&traveled<.005)this.sliding=0;
    const oldFeet=this.feet;this.velocityY-=17*dt;let nextFeet=this.feet+this.velocityY*dt;this.grounded=false;
    for(const b of this.colliders){if(this.position.x<=b.min.x-RADIUS||this.position.x>=b.max.x+RADIUS||this.position.z<=b.min.z-RADIUS||this.position.z>=b.max.z+RADIUS)continue;
      if(this.velocityY<=0&&oldFeet>=b.max.y-.02&&nextFeet<=b.max.y){nextFeet=Math.max(nextFeet,b.max.y);this.velocityY=0;this.grounded=true}
      else if(this.velocityY>0&&oldFeet+height<=b.min.y&&nextFeet+height>=b.min.y){nextFeet=b.min.y-height;this.velocityY=0}
    }
    if(nextFeet<=0){nextFeet=0;this.velocityY=0;this.grounded=true}
    this.feet=nextFeet;this.position.y=this.feet+this.eye;return {traveled,running:this.running,crouching:targetEye===CROUCH,sliding:targetEye===SLIDE};
  }
}
