import * as THREE from '../vendor/three/three.module.js';
import { Parts, material } from './geometry.js';
import { seededRandom } from './config.js';

export function createGardenDetails(region='main') {
  const parts=new Parts(`${region}-garden-details`),random=seededRandom(region==='main'?711:976);
  const patches=region==='main'
    ? [[-13,-9.4],[-17.6,5.6],[-11.4,9.4],[8.1,10.2],[15.6,6.5],[5.8,-10.8],[-18.3,-5.2]]
    : [[31.2,0.6],[35.5,3.7],[45.4,4.4],[49.3,-6.8],[44.6,-12.9]];
  for(const [x,z] of patches) {
    // Small meadow clusters stay on the margins; the courtyard remains open.
    for(let i=0;i<9;i++) {
      const px=x+(random()-0.5)*1.6,pz=z+(random()-0.5)*1.1,h=0.25+random()*0.35;
      parts.box('leafDark',px,h/2,pz,0.045,h,0.045);
      const color=i%4===0?'blueLight':i%3===0?'orangeLight':'cream';
      for(const [dx,dz] of [[-0.085,0],[0.085,0],[0,-0.085],[0,0.085]])parts.box(color,px+dx,h,pz+dz,0.12,0.07,0.12);
      parts.box('yellow',px,h+0.04,pz,0.08,0.07,0.08);
    }
    // A low fern: paired, stepped fronds rather than another round bush.
    for(let side=-1;side<=1;side+=2)for(let j=0;j<4;j++) {
      const px=x+0.22*j*side,py=0.46-j*0.075;
      parts.box(j%2?'leafLight':'leaf',px,py,z-0.64,0.32,0.08,0.15,[0,side*0.3,-side*0.25]);
      parts.box('leafDark',px,py-0.04,z-0.64,0.26,0.05,0.055,[0,0,-side*0.25]);
    }
  }
  return parts.finish();
}

function cable(parent,points) {
  const curve=new THREE.CatmullRomCurve3(points.map(p=>new THREE.Vector3(...p)));
  const mesh=new THREE.Mesh(new THREE.TubeGeometry(curve,20,0.035,5,false),material('dark'));
  mesh.castShadow=true;parent.add(mesh);
}

export function addWorkshopDetails(projects,skills,contact,lab) {
  for(const [station,side] of [[projects,-1],[skills,1]]) {
    const parts=new Parts('workbench-small-parts');
    for(let i=0;i<3;i++) {
      parts.box(i%2?'blue':'cream',side*1.5,1.33+i*0.055,0.39,0.46,0.045,0.48,[0,0.1-i*0.08,0]);
      parts.box('pavingLight',side*1.5,1.34+i*0.055,0.64,0.39,0.025,0.025);
    }
    for(const x of [-1.9,1.9])for(const y of [0.1,1.03])parts.add('metalLight',[x,y,0.72],[0.065,0.025,0.065],[Math.PI/2,0,0],'cylinder8');
    for(let i=0;i<5;i++)parts.box('dark',side*1.88,0.54+i*0.07,0.7,0.25,0.025,0.025);
    station.add(parts.finish());
    cable(station,[[side*0.5,1.32,0.2],[side*1.6,1.31,-0.1],[side*1.8,0.7,-0.3],[side*1.7,0.14,-0.3],[side*0.9,0.08,-0.3]]);
  }
  cable(contact,[[-0.7,1.36,0.5],[-1.2,1.35,0.65],[-1.65,1.36,0.35],[-1.58,1.7,-0.15]]);
  const parts=new Parts('lab-workshop-details');
  // Charging connector, hanging cable, grilles and calibrated ramp edge ticks.
  parts.box('metal',40,1.4,-11.88,0.22,0.16,0.08);
  for(let i=0;i<5;i++)parts.box('dark',37.6+i*0.24,0.65,-11.93,0.13,0.32,0.04);
  for(const x of [44.18,47.22])for(let j=0;j<6;j++)parts.box('cream',x,0.705,-4.7+j*0.27,0.16,0.01,0.06);
  lab.add(parts.finish());
  cable(lab,[[40,1.4,-11.82],[40.5,0.6,-11.7],[40,0.22,-11.6],[39.6,0.65,-11.7],[39.75,1.3,-11.8]]);
}
