import * as THREE from '../vendor/three/three.module.js';
import { Parts,material } from './geometry.js';
import { insideIsland,insideLab,insidePond,insideStream,drivingCircuit,coursePose,DRIVE,seededRandom } from './config.js';
import { APPROACHES,distanceToPath } from './archipelago-config.js';

export const MEADOWS={
  main:[[-8,-10.6,7.1,2.0],[-6.1,-7,3.8,2],[8.3,-9.8,4.1,1.7],[-18,-3.8,1.7,2.4],[-17.8,6.2,1.8,1.5],[10.7,9.1,2.6,1.1],[4.5,2.1,2,2]],
  lab:[[47.6,-9.5,2.2,2.2],[47.2,4.3,2.3,1.4]],
};
const circuit=drivingCircuit(48);
const labCircuit=Array.from({length:192},(_,i)=>coursePose(i/192));
function distanceToRoute(x,z,route) {
  let distance=Infinity;
  for(let i=0;i<route.length;i++) {
    const a=route[i],b=route[(i+1)%route.length],dx=b.x-a.x,dz=b.z-a.z;
    const t=Math.max(0,Math.min(1,((x-a.x)*dx+(z-a.z)*dz)/(dx*dx+dz*dz)));
    distance=Math.min(distance,Math.hypot(x-a.x-t*dx,z-a.z-t*dz));
  }
  return distance;
}
export function meadowAllowed(x,z,region) {
  if(region==='lab')return insideLab(x,z,0.65) && distanceToRoute(x,z,labCircuit)>2.2;
  if(!insideIsland(x,z,0.7) || insidePond(x,z) || insideStream(x,z))return false;
  if(distanceToPath(x,z,APPROACHES.main)<2.3)return false;
  return distanceToRoute(x,z,circuit)>DRIVE.width/2+0.4;
}

export function createMeadows(region='main') {
  const parts=new Parts(`${region}-meadows`),random=seededRandom(region==='main'?342:875);
  for(const [cx,cz,rx,rz] of MEADOWS[region]) {
    const positions=[],uvs=[],indices=[];
    // Small clipped ground triangles let the grass follow shoreline and lane clearances.
    const step=0.35;
    const within=(x,z)=>((x-cx)/rx)**2+((z-cz)/rz)**2<1+Math.sin(x*2.1+z*0.8)*0.06 && meadowAllowed(x,z,region);
    for(let x=cx-rx;x<cx+rx;x+=step)for(let z=cz-rz;z<cz+rz;z+=step) {
      const square=[[x,z],[x,z+step],[x+step,z],[x+step,z+step]];
      if(!square.every(([px,pz])=>within(px,pz)))continue;
      const start=positions.length/3;
      for(const [px,pz] of square){positions.push(px,0.018,pz);uvs.push(px,pz);}
      indices.push(start,start+1,start+2,start+2,start+1,start+3);
    }
    const geometry=new THREE.BufferGeometry();geometry.setAttribute('position',new THREE.Float32BufferAttribute(positions,3));
    geometry.setAttribute('uv',new THREE.Float32BufferAttribute(uvs,2));geometry.setIndex(indices);geometry.computeVertexNormals();
    const ground=new THREE.Mesh(geometry,material('moss'));ground.receiveShadow=true;parts.group.add(ground);
    const count=Math.ceil(rx*rz*55);
    for(let i=0;i<count;i++) {
      const x=cx+(random()-0.5)*rx*2,z=cz+(random()-0.5)*rz*2;
      if(!within(x,z))continue;
      const height=0.13+random()*0.35;
      parts.add(i%4===0?'leafLight':i%3===0?'leaf':'grass',[x,height/2,z],[0.16+random()*0.1,height,0.14],
        [(random()-0.5)*0.45,random()*Math.PI,(random()-0.5)*0.4],'cone3');
      if(i%27===0) {
        parts.box('cream',x,height+0.02,z,0.11,0.045,0.11);
        parts.box('yellow',x,height+0.055,z,0.04,0.03,0.04);
      }
    }
  }
  if(region==='main') {
    // A small rock garden gives the open centre a second, low focal point.
    for(const [x,z,w,h,d] of [[4.5,1.2,0.95,0.65,0.8],[5.2,1.6,0.6,0.4,0.6],[4.1,1.8,0.5,0.28,0.45]])
      parts.add('stoneLight',[x,h/2,z],[w,h,d],[0,random()*Math.PI,0],'icosahedron');
  }
  return parts.finish();
}
