import * as T from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
export function createLoadout(){return [
  {id:'m4',name:'M4A1 / 5.56 × 45',capacity:30,ammo:30,reserve:120,delay:.09,reload:2.15,damage:34,recoil:.027,auto:true},
  {id:'ak',name:'AK-47 / 7.62 × 39',capacity:30,ammo:30,reserve:120,delay:.115,reload:2.5,damage:40,recoil:.043,auto:true},
]}
export function buildWeapon(id,{hands=true}={}){
  const root=new T.Group();root.name=id;const metal=new T.MeshStandardMaterial({color:0x363c3d,metalness:.68,roughness:.36}),black=new T.MeshStandardMaterial({color:0x1e2326,metalness:.2,roughness:.7}),wood=new T.MeshStandardMaterial({color:0x89502d,roughness:.64}),brass=new T.MeshStandardMaterial({color:0xab9971,metalness:.7,roughness:.4});
  function box(w,h,d,x,y,z,mat=metal){const m=new T.Mesh(new T.BoxGeometry(w,h,d),mat);m.position.set(x,y,z);root.add(m);return m}
  function tube(r,length,x,y,z,mat=metal){const m=new T.Mesh(new T.CylinderGeometry(r,r,length,12),mat);m.rotation.x=Math.PI/2;m.position.set(x,y,z);root.add(m);return m}
  function profile(points,width,x,mat){const shape=new T.Shape();points.forEach(([z,y],i)=>i?shape.lineTo(z,y):shape.moveTo(z,y));shape.closePath();const mesh=new T.Mesh(new T.ExtrudeGeometry(shape,{depth:width,bevelEnabled:false}),mat);mesh.rotation.y=-Math.PI/2;mesh.position.x=x;root.add(mesh);return mesh}
  const ak=id==='ak';box(.095,.115,.32,0,0,-.02);tube(.053,.28,0,.048,-.02);box(.085,.08,.22,0,-.065,.02,black);
  box(.065,.18,.08,0,-.17,.105,ak?wood:black).rotation.x=-.25;
  tube(.018,.34,0,.022,-.54);tube(.028,.055,0,.022,-.73);tube(.012,.3,0,.065,-.43);
  if(ak){
    box(.095,.065,.24,0,-.018,-.3,wood);box(.08,.045,.18,0,.065,-.28,wood);
    profile([[-.08,-.07],[.06,-.07],[.09,-.2],[.04,-.34],[-.08,-.44],[-.2,-.46],[-.14,-.32],[-.08,-.18]],.063,.031,metal);
    for(const x of [-.035,.035])for(let i=0;i<4;i++)box(.009,.16,.012,x,-.19,-.04+i*.025,black).rotation.x=.25;
    profile([[.13,.045],[.43,.018],[.45,-.135],[.3,-.12],[.15,-.065]],.075,.038,wood);box(.085,.16,.025,0,-.06,.44,black);
    box(.08,.015,.09,0,.11,.025);box(.026,.067,.025,0,.09,-.63);box(.1,.025,.025,0,.055,-.61);box(.055,.018,.025,.07,.015,.05);for(const z of [-.12,.04,.1])tube(.007,.012,.054,-.025,z,brass);
  }else{
    box(.11,.11,.27,0,.015,-.3,black);for(let i=0;i<9;i++){box(.13,.012,.015,0,.08,-.18-i*.026);box(.012,.11,.014,.06,.015,-.18-i*.026)}
    box(.064,.21,.11,0,-.19,-.04).rotation.x=.12;for(let i=0;i<3;i++)box(.005,.15,.008,.035,-.19,-.065+i*.025,black);
    tube(.023,.24,0,.012,.25);profile([[.19,.04],[.4,.04],[.43,-.12],[.3,-.12],[.2,-.06]],.087,.044,black);box(.096,.17,.025,0,-.04,.42,black);
    box(.075,.016,.2,0,.09,.01);for(let i=0;i<6;i++)box(.09,.014,.01,0,.104,.09-i*.032);
    const optic=new T.Mesh(new T.TorusGeometry(.032,.009,8,20),metal);optic.position.set(0,.145,-.03);root.add(optic);box(.026,.04,.07,0,.106,-.03);box(.012,.045,.016,0,.112,-.48);
    const lens=new T.Mesh(new T.CircleGeometry(.027,20),new T.MeshBasicMaterial({color:0x9ac8be,transparent:true,opacity:.14,depthWrite:false}));lens.position.set(0,.145,-.031);root.add(lens);
  }
  // Trigger guard and pins are separate geometry so the silhouettes read from either side.
  box(.013,.018,.1,-.043,-.113,.07);box(.013,.018,.1,.043,-.113,.07);box(.085,.018,.015,0,-.113,.025);box(.012,.04,.012,0,-.095,.075,black);
  if(hands){const glove=new T.MeshStandardMaterial({color:0x5b6047,roughness:.96});box(.09,.14,.13,.055,-.17,.12,glove).rotation.x=-.18;box(.085,.085,.16,-.025,-.1,-.28,glove).rotation.z=-.2;box(.085,.095,.22,.09,-.22,.28,glove)}
  // Merge static parts by material: detailed rifles stay inexpensive on every bot.
  const batches=new Map();for(const child of root.children){child.updateMatrix();const geometry=child.geometry.index?child.geometry.toNonIndexed():child.geometry.clone();geometry.applyMatrix4(child.matrix);if(!batches.has(child.material))batches.set(child.material,[]);batches.get(child.material).push(geometry);child.geometry.dispose()}
  root.clear();for(const [material,geometries] of batches){const geometry=mergeGeometries(geometries);root.add(new T.Mesh(geometry,material));for(const g of geometries)g.dispose()}
  root.userData.muzzle=new T.Vector3(0,.022,-.77);return root;
}
export function disposeWeapon(root){root.traverse(o=>{o.geometry?.dispose();if(o.material)for(const m of Array.isArray(o.material)?o.material:[o.material])m.dispose()})}
