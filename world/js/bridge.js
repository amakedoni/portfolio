import * as THREE from '../vendor/three/three.module.js';
import { Parts } from './geometry.js';
import { BRIDGE, seededRandom } from './config.js';
import { sign } from './textures.js';

function rope(parts,a,b,color='woodDark',diameter=0.075) {
  const start=new THREE.Vector3(...a),end=new THREE.Vector3(...b),direction=end.clone().sub(start);
  const rotation=new THREE.Euler().setFromQuaternion(new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0,1,0),direction.clone().normalize()));
  parts.add(color,start.add(end).multiplyScalar(0.5).toArray(),[diameter,direction.length(),diameter],[rotation.x,rotation.y,rotation.z],'cylinder8');
}

export function createBridge(bridge=BRIDGE) {
  const parts=new Parts('suspension-bridge'),random=seededRandom(209);
  const length=Math.hypot(bridge.to.x-bridge.from.x,bridge.to.z-bridge.from.z);
  const count=Math.ceil(length/0.36/4)*4,step=length/count,half=bridge.width/2;
  const deck=t=>0.045-4*bridge.sag*t*(1-t);
  const cable=t=>3.5-4*1.5*t*(1-t);
  for(let i=0;i<=count;i++) {
    const t=i/count,y=deck(t),z=t*length;
    const slope=-4*bridge.sag*(1-2*t)/length;
    parts.box(['wood','woodLight','woodLight'][Math.floor(random()*3)],0,y-0.1,z,bridge.width,0.2,step-0.025,[-Math.atan(slope),0,0]);
    for(const x of [-half+0.18,half-0.18]) parts.box('metal',x,y+0.018,z,0.065,0.03,0.08);
    if(i%4===0) for(const side of [-1,1]) {
      parts.box('wood',side*(half+0.06),y+0.57,z,0.13,1.17,0.13);
      rope(parts,[side*(half+0.06),y+1.1,z],[side*(half+0.06),cable(t),z],'wood',0.055);
    }
    if(i<count) for(const side of [-1,1]) {
      const u=(i+1)/count;
      rope(parts,[side*(half+0.06),cable(t),z],[side*(half+0.06),cable(u),u*length]);
      rope(parts,[side*(half+0.06),y+1.04,z],[side*(half+0.06),deck(u)+1.04,u*length],'woodLight',0.065);
      rope(parts,[side*(half-0.1),y-0.22,z],[side*(half-0.1),deck(u)-0.22,u*length],'woodDark',0.14);
    }
  }
  for(const z of [0,length]) for(const side of [-1,1]) {
    parts.box('stoneLight',side*(half+0.22),0.16,z,0.72,0.42,0.78);
    parts.box('woodDark',side*(half+0.22),1.95,z,0.34,3.8,0.4);
    parts.box('orange',side*(half+0.22),3.8,z,0.48,0.26,0.51);
    parts.box('metal',side*(half+0.22),2.5,z,0.4,0.17,0.46);
  }
  const group=parts.finish();group.name=bridge.id || 'suspension-bridge';group.position.set(bridge.from.x,0,bridge.from.z);
  group.rotation.y=Math.atan2(bridge.to.x-bridge.from.x,bridge.to.z-bridge.from.z);
  return group;
}

export function createWayfinding(region) {
  const parts=new Parts(`${region}-wayfinding`),group=parts.group;
  const main=region==='main';
  group.position.set(main?16:31.4,0,main?-3.8:-8.0);
  parts.box('woodDark',0,1.9,0,0.2,3.8,0.22);
  parts.box('stoneLight',0,0.15,0,0.6,0.3,0.65);
  const items=main
    ? [['Полигон →','focus-lab'],['Портфолио','focus-main'],['Вся карта','focus-map']]
    : [['← Портфолио','focus-main'],['Полигон','focus-lab'],['Вся карта','focus-map']];
  items.forEach(([title,action],i)=>{
    const label=sign(group,title,3.0,0.57,[0,3.25-i*0.82,0.08]);
    label.userData.action=action;
  });
  return parts.finish();
}
