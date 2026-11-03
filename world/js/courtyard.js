import * as THREE from '../vendor/three/three.module.js';
import { Parts, material } from './geometry.js';
import { STATIONS } from './config.js';

export const TERRACES=Object.freeze([
  {station:'projects',width:6.4,depth:3.8,height:0.24,centerZ:0.15},
  {station:'skills',width:6.3,depth:3.3,height:0.18,centerZ:0.1},
]);

export function createCourtyard() {
  const parts=new Parts('courtyard-terraces');
  for(const {station,width,depth,height,centerZ} of TERRACES) {
    const {x,z}=STATIONS[station],cz=z+centerZ;
    parts.box('stoneShade',x,height/2-0.03,cz,width,height+0.06,depth);
    const count=Math.ceil(width/0.8);
    for(let i=0;i<count;i++) {
      const px=x-width/2+(i+0.5)*width/count;
      parts.box('pavingLight',px,height-0.045,cz,width/count-0.012,0.09,depth-0.05);
      parts.box('stoneLight',px,height-0.055,cz+depth/2,width/count-0.018,0.12,0.12);
    }
    // Shallow steps face the courtyard; the outer road stays at grade.
    for(let i=0;i<2;i++) {
      const top=height*(2-i)/3;
      parts.box('stoneLight',x,top/2,cz+depth/2+0.2+i*0.32,2.7,top,0.34);
    }
    for(const side of [-1,1]) {
      parts.box('stone',x+side*(width/2-0.08),height+0.045,cz,0.16,0.09,depth-0.15);
      for(let i=0;i<4;i++)parts.box('moss',x+side*(width/2+0.035),0.025,cz-0.9+i*0.5,0.09,0.045,0.2);
    }
  }
  const x=-1.2,z=2.1;
  // A low inset launch pad: large quiet panels, narrow joints and brass indices.
  parts.add('stoneShade',[x,0.025,z],[5.2,0.05,5.2],[0,Math.PI/12,0],'cylinder12');
  parts.add('stoneLight',[x,0.045,z],[5.02,0.035,5.02],[0,Math.PI/12,0],'cylinder12');
  parts.add('#c6cec4',[x,0.065,z],[4.58,0.02,4.58],[0,Math.PI/12,0],'cylinder12');
  for(let i=0;i<12;i++) {
    const a=i*Math.PI/6;
    parts.box(i%3===0?'orangeLight':'metal',x+Math.sin(a)*2.39,0.071,z+Math.cos(a)*2.39,0.095,0.018,i%3===0?0.3:0.17,[0,a,0]);
  }
  for(const side of [-1,1])for(let i=0;i<7;i++) {
    parts.box('stoneShade',x+side*1.44,0.081,z-0.8+i*0.25,0.35,0.012,0.045);
  }
  const group=parts.finish();
  const ring=new THREE.Mesh(new THREE.RingGeometry(2.10,2.12,48),material('stoneShade',{side:THREE.DoubleSide}));
  ring.rotation.x=-Math.PI/2;ring.position.set(x,0.078,z);ring.receiveShadow=true;group.add(ring);
  return group;
}
