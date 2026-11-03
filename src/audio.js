// All sounds are synthesized locally: no downloads, recordings or unlicensed samples.
export class BattleAudio {
  constructor(context=new AudioContext()){
    this.context=context;this.active=false;this.reloadSources=[];this.nextBattle=8;
    this.master=context.createGain();this.master.gain.value=.65;
    this.gate=context.createGain();this.gate.gain.value=0;
    this.compressor=context.createDynamicsCompressor();this.compressor.threshold.value=-18;this.compressor.knee.value=20;this.compressor.ratio.value=5;this.compressor.attack.value=.003;this.compressor.release.value=.2;
    this.compressor.connect(this.gate);this.gate.connect(this.master);this.master.connect(context.destination);
    this.buses={};for(const [name,volume] of Object.entries({weapons:.8,foley:.55,ambience:.35,ui:.4})){const gain=context.createGain();gain.gain.value=volume;gain.connect(this.compressor);this.buses[name]=gain}
    const echo=context.createDelay(.5),echoGain=context.createGain(),low=context.createBiquadFilter();echo.delayTime.value=.14;echoGain.gain.value=.14;low.type='lowpass';low.frequency.value=1400;echo.connect(low);low.connect(echoGain);echoGain.connect(this.buses.weapons);this.echo=echo;
    this.white=context.createBuffer(1,context.sampleRate*3,context.sampleRate);const samples=this.white.getChannelData(0);for(let i=0;i<samples.length;i++)samples[i]=Math.random()*2-1;
    const wind=context.createBufferSource(),filter=context.createBiquadFilter(),gain=context.createGain();wind.buffer=this.white;wind.loop=true;filter.type='lowpass';filter.frequency.value=240;gain.gain.value=.085;wind.connect(filter);filter.connect(gain);gain.connect(this.buses.ambience);wind.start();this.wind=wind;
  }
  setVolume(bus,value){const target=bus==='master'?this.master:this.buses[bus];target?.gain.setTargetAtTime(Math.max(0,Math.min(1,value)),this.context.currentTime,.04)}
  setActive(active){this.active=active;this.gate.gain.setTargetAtTime(active?1:0,this.context.currentTime,.045);if(!active)this.cancelReload()}
  async resume(){await this.context.resume();this.setActive(true)}
  listen(position,yaw){const l=this.context.listener,now=this.context.currentTime;if(l.positionX){l.positionX.setValueAtTime(position.x,now);l.positionY.setValueAtTime(position.y,now);l.positionZ.setValueAtTime(position.z,now);l.forwardX.setValueAtTime(-Math.sin(yaw),now);l.forwardY.setValueAtTime(0,now);l.forwardZ.setValueAtTime(-Math.cos(yaw),now);l.upX.setValueAtTime(0,now);l.upY.setValueAtTime(1,now);l.upZ.setValueAtTime(0,now)}}
  destination(bus,position){if(!position)return this.buses[bus];const p=this.context.createPanner();p.panningModel='equalpower';p.distanceModel='inverse';p.refDistance=4;p.maxDistance=90;p.rolloffFactor=1.1;p.positionX.value=position.x;p.positionY.value=position.y;p.positionZ.value=position.z;p.connect(this.buses[bus]);return p}
  noise({duration=.1,frequency=1500,volume=.2,bus='weapons',position,at=0,type='lowpass',echo=false}={}){
    const c=this.context,t=c.currentTime+at,src=c.createBufferSource(),filter=c.createBiquadFilter(),gain=c.createGain(),out=this.destination(bus,position);src.buffer=this.white;filter.type=type;filter.frequency.value=frequency;gain.gain.setValueAtTime(Math.max(.0001,volume),t);gain.gain.exponentialRampToValueAtTime(.0001,t+duration);src.connect(filter);filter.connect(gain);gain.connect(out);if(echo)gain.connect(this.echo);src.start(t,Math.random()*.5,duration);src.onended=()=>{src.disconnect();filter.disconnect();gain.disconnect();if(position)out.disconnect()};return src;
  }
  tone(frequency,end,duration,volume,bus='weapons',position,at=0){const c=this.context,t=c.currentTime+at,osc=c.createOscillator(),gain=c.createGain(),out=this.destination(bus,position);osc.frequency.setValueAtTime(frequency,t);osc.frequency.exponentialRampToValueAtTime(end,t+duration);gain.gain.setValueAtTime(volume,t);gain.gain.exponentialRampToValueAtTime(.0001,t+duration);osc.connect(gain);gain.connect(out);osc.start(t);osc.stop(t+duration);osc.onended=()=>{osc.disconnect();gain.disconnect();if(position)out.disconnect()};return osc}
  shot(id,position,occluded=false){if(!this.active)return;const ak=id==='ak';const volume=occluded?.12:position?.45:.7;this.noise({duration:ak?.28:.19,frequency:occluded?700:ak?2500:4200,volume,position,echo:!position});this.tone(ak?130:190,45,ak?.18:.12,volume*.6,'weapons',position);this.noise({duration:.06,frequency:5000,volume:volume*.19,position,at:.055,type:'highpass'})}
  reload(id){this.cancelReload();if(!this.active)return;const ak=id==='ak',events=[[0,900,.14],[.35,2100,.18],[ak?1.35:1.1,1300,.21],[ak?2.15:1.85,3800,.2]];for(const [at,frequency,volume] of events)this.reloadSources.push(this.noise({at,frequency,volume,duration:.12,bus:'foley'}))}
  cancelReload(){for(const src of this.reloadSources){try{src.stop()}catch{ /* Already ended. */ }}this.reloadSources=[]}
  step(running=false,crouched=false,position){if(!this.active)return;this.noise({duration:running?.12:.09,frequency:running?650:900,volume:crouched?.07:running?.3:.19,bus:'foley',position});this.tone(95,45,.07,crouched?.025:.07,'foley',position)}
  slide(){if(this.active)this.noise({duration:.8,frequency:1600,volume:.38,bus:'foley'})}
  impact(){if(this.active)this.noise({duration:.14,frequency:700,volume:.3,bus:'foley'})}
  hit(){if(this.active)this.tone(1600,850,.065,.1,'ui')}
  cue(victory=false){if(!this.active)return;for(let i=0;i<3;i++)this.tone(victory?440+i*160:300, victory?440+i*160:180,.13,.12,'ui',undefined,i*.16)}
  tick(dt){if(!this.active)return;this.nextBattle-=dt;if(this.nextBattle<=0){this.nextBattle=10+Math.random()*12;const p={x:(Math.random()-.5)*140,y:5,z:-75};this.noise({duration:1.8,frequency:450,volume:.35,bus:'ambience',position:p});this.tone(65,24,1.2,.25,'ambience',p)}}
}
