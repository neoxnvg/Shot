import * as T from 'three';

export const MAPS = [
  { id: '01', name: 'Pátio de Ferro', available: true },
  { id: '02', name: 'Em breve', available: false },
  { id: '03', name: 'Em breve', available: false },
  { id: '04', name: 'Em breve', available: false },
  { id: '05', name: 'Em breve', available: false },
];
export const SPAWNS = [[0,24],[-25,23],[25,23],[-25,-48],[25,-48],[0,-49],[-25,-13],[25,-13]];
export function createWorld(scene) {
  let seed = 87;
  const random = () => ((seed = (seed * 1664525 + 1013904223) >>> 0) / 4294967296);
  function surface(color, type='concrete') {
    const c=document.createElement('canvas');c.width=c.height=512;
    const ctx=c.getContext('2d');ctx.fillStyle=color;ctx.fillRect(0,0,512,512);
    for(let i=0;i<32000;i++){const v=random()>.5?255:0;ctx.fillStyle=`rgba(${v},${v},${v},${random()*.13})`;ctx.fillRect(random()*512,random()*512,1+random()*5,1+random()*3)}
    if(type==='concrete')for(let i=0;i<18;i++){ctx.strokeStyle='#262a2633';ctx.lineWidth=.5+random();ctx.beginPath();let x=random()*512,y=random()*512;ctx.moveTo(x,y);for(let j=0;j<6;j++){x+=random()*25-12;y+=random()*35;ctx.lineTo(x,y)}ctx.stroke()}
    if(type==='metal')for(let x=0;x<512;x+=32){ctx.fillStyle='#ffffff10';ctx.fillRect(x,0,3,512);ctx.fillStyle='#00000022';ctx.fillRect(x+3,0,3,512)}
    const t=new T.CanvasTexture(c);t.colorSpace=T.SRGBColorSpace;t.wrapS=t.wrapT=T.RepeatWrapping;t.anisotropy=4;return t;
  }
  const material=(color,type='concrete',options={})=>new T.MeshStandardMaterial({map:surface(color,type),roughness:.87,...options});
  const concrete=material('#8c8980'), asphalt=material('#454944'), steel=material('#414a47','metal',{metalness:.55,roughness:.6}), rust=material('#925839','metal');
  const paint=new T.MeshStandardMaterial({color:0xc5a85b,roughness:.92});
  const colliders=[],solids=[];
  function box(w,h,d,x,y,z,mat=concrete,solid=true){const m=new T.Mesh(new T.BoxGeometry(w,h,d),mat);m.position.set(x,y,z);m.castShadow=h>.15;m.receiveShadow=true;scene.add(m);if(solid){colliders.push(new T.Box3().setFromObject(m));solids.push(m)}return m}
  function cylinder(r,h,x,y,z,mat=steel){const m=new T.Mesh(new T.CylinderGeometry(r,r,h,12),mat);m.position.set(x,y,z);m.castShadow=true;m.receiveShadow=true;scene.add(m);return m}
  scene.background=new T.Color(0xa9b6bd);scene.fog=new T.Fog(0xa9b6bd,55,165);
  scene.add(new T.HemisphereLight(0xd5e5f4,0x444333,1.25));
  const sun=new T.DirectionalLight(0xffdfab,2.4);sun.position.set(-35,45,-25);sun.castShadow=true;sun.shadow.mapSize.set(2048,2048);Object.assign(sun.shadow.camera,{left:-55,right:55,top:65,bottom:-65,near:1,far:150});sun.shadow.normalBias=.025;sun.shadow.bias=-.00015;scene.add(sun);
  const floor=box(150,.3,170,0,-.15,-15,asphalt,false);floor.material.map.repeat.set(22,25);
  box(1,4.5,88,-30,2.25,-12);box(1,4.5,88,30,2.25,-12);box(60,4.5,1,0,2.25,-56);box(60,4.5,1,0,2.25,32);
  for(const x of [-29.35,29.35])for(let z=-54;z<32;z+=6){box(.24,5,.4,x,2.5,z,steel,false);box(.06,.08,6,x,4.6,z+3,rust,false)}
  for(const x of [-9,9])for(let z=-51;z<30;z+=7)box(.12,.015,3,x,.012,z,paint,false);
  for(let z=-52;z<29;z+=12)box(58,.02,.1,0,.016,z,paint,false);
  for(let i=0;i<18;i++){const x=(random()-.5)*54,z=random()*78-51;const stain=new T.Mesh(new T.CircleGeometry(.6+random()*1.5,16),new T.MeshStandardMaterial({color:0x252f2d,roughness:.23,metalness:.3,transparent:true,opacity:.55,depthWrite:false}));stain.rotation.x=-Math.PI/2;stain.scale.x=2;stain.position.set(x,.025,z);scene.add(stain)}
  function sign(text,x,y,z,w=4){const c=document.createElement('canvas');c.width=512;c.height=128;const ctx=c.getContext('2d');ctx.fillStyle='#28322e';ctx.fillRect(0,0,512,128);ctx.strokeStyle='#d6b66f';ctx.lineWidth=8;ctx.strokeRect(8,8,496,112);ctx.fillStyle='#e7d8ad';ctx.font='bold 46px monospace';ctx.textAlign='center';ctx.fillText(text,256,80);const tex=new T.CanvasTexture(c);tex.colorSpace=T.SRGBColorSpace;const m=new T.Mesh(new T.PlaneGeometry(w,w/4),new T.MeshStandardMaterial({map:tex,roughness:.85}));m.position.set(x,y,z);scene.add(m)}
  function container(x,z,color,index){const mat=material(color,'metal',{metalness:.45});box(5,3.2,10,x,1.6,z,mat);box(5.1,.13,10.1,x,3.24,z,steel,false);for(const side of [-1,1]){for(let i=0;i<18;i++)box(.08,2.95,.09,x+side*2.54,1.6,z-4.7+i*.54,mat,false);box(4.7,2.8,.07,x,1.6,z+side*5.05,mat,false);for(const dx of [-1.1,1.1])box(.055,2.7,.1,x+dx,1.6,z+side*5.12,steel,false)}sign(`CARGO ${index}`,x,2.2,z+5.17,2.8)}
  container(-14,1,'#4b625e','07');container(14,-13,'#8d654d','12');container(-14,-30,'#526474','04');container(14,17,'#596653','09');
  for(const [x,z] of [[-4,5],[5,-11],[-4,-28],[5,-43]]){box(3.6,1.05,1.2,x,.525,z);box(4,.16,1.5,x,1.1,z);for(let i=0;i<7;i++){const m=box(.22,.2,.025,x-1.6+i*.5,.8,z+.62,paint,false);m.rotation.z=.45}}
  const timber=material('#807052');
  for(const [x,z] of [[-24,8],[24,-29],[-24,-40],[23,4]]){box(3,1.7,2.5,x,.85,z,timber);for(const dx of [-1.2,1.2])box(.15,1.8,2.6,x+dx,.9,z,steel,false);for(let i=0;i<3;i++)box(3.1,.1,.12,x,.4+i*.6,z+1.27,steel,false)}
  for(const [x,z] of [[-23,-21],[23,-43],[-7,23],[7,-50]]){box(2,1.3,1.6,x,.65,z);for(let i=0;i<2;i++){const m=cylinder(.32,.8,x-.45+i*.9,1.7,z,rust);m.rotation.z=.03}}
  for(const x of [-40,40]){const warehouse=material(x<0?'#686d69':'#6e675c','metal');box(17,13,62,x,6.5,-24,warehouse,false);box(18,.4,64,x,13.2,-24,steel,false);for(let z=-50;z<7;z+=7){box(.3,12.8,.3,x+(x<0?8.6:-8.6),6.4,z,steel,false);box(.12,2,4,x+(x<0?8.7:-8.7),9,z,new T.MeshStandardMaterial({color:0x7b929a,metalness:.6,roughness:.3}),false)}}
  // Water tower, stacks and gantry establish a skyline beyond the combat boundary.
  for(let i=0;i<3;i++){cylinder(1.1,26,-18+i*7,13,-72,rust);cylinder(1.2,.6,-18+i*7,26,-72,steel)}
  cylinder(4,7,38,21,-62,steel);for(const dx of [-2.5,2.5])for(const dz of [-2.5,2.5])box(.3,18,.3,38+dx,9,-62+dz,steel,false);
  for(const x of [-27,27])box(.6,14,.7,x,7,-45,rust,false);box(55,.7,1,0,14,-45,rust,false);for(let x=-25;x<25;x+=4){const brace=box(4.5,.12,.12,x,13,-45,steel,false);brace.rotation.z=.45}box(.1,7,.1,5,10,-45,steel,false);
  for(const x of [-27,27])for(let z=-47;z<30;z+=24){cylinder(.1,7,x,3.5,z);box(1.4,.13,.45,x+(x<0?.6:-.6),7,z,steel,false)}
  sign('PATIO DE FERRO',0,3.15,-55.43,9);sign('SETOR 01',-14,3.3,31.43,5);
  // Broken aggregate is instanced to keep draw calls low.
  const rubble=new T.InstancedMesh(new T.DodecahedronGeometry(1,0),concrete,160);const transform=new T.Object3D();for(let i=0;i<160;i++){transform.position.set((random()>.5?1:-1)*(27+random()*2),.04,random()*82-53);transform.scale.set(.05+random()*.16,.04+random()*.07,.08+random()*.18);transform.rotation.set(random()*3,random()*3,random()*3);transform.updateMatrix();rubble.setMatrixAt(i,transform.matrix)}scene.add(rubble);
  return {colliders,solids};
}
