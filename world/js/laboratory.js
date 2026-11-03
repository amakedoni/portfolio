import * as THREE from '../vendor/three/three.module.js';
import { Parts, material, planeTexture } from './geometry.js';
import { LAB, coursePose } from './config.js';
import { createLandmass, createPlants, createTree, createCrate, createLamp } from './island.js';
import { createWayfinding } from './bridge.js';
import { createRover } from './rover.js';
import { sign, screenTexture } from './textures.js';
import { surfaceMaps } from './surfaces.js';
import { installArtDirection } from './art-direction.js';
import { districtPortal } from './archipelago-config.js';

const portal=(x,z)=>(x<33 && Math.abs(z+5.4)<2.8) || districtPortal('lab',x,z);
const gardenPassage=(x,z)=>portal(x,z) || (Math.abs(x-34.7)<2.5 && z>1.6);

function trackSurface() {
  const positions=[],uvs=[],indices=[];
  for(let i=0;i<=96;i++) {
    const a=i/96*Math.PI*2;
    for(const offset of [1.8,-1.8]) {
      const x=LAB.center.x+(LAB.radiusX+offset)*Math.cos(a),z=LAB.center.z+(LAB.radiusZ+offset)*Math.sin(a);
      positions.push(x,0.012,z);uvs.push(x*0.3,z*0.3);
    }
    if(i<96) {const j=i*2;indices.push(j,j+1,j+2,j+1,j+3,j+2);}
  }
  const geo=new THREE.BufferGeometry();geo.setAttribute('position',new THREE.Float32BufferAttribute(positions,3));geo.setAttribute('uv',new THREE.Float32BufferAttribute(uvs,2));geo.setIndex(indices);geo.computeVertexNormals();
  const trackMaterial=installArtDirection(new THREE.MeshStandardMaterial({color:'#9aa5a7',roughness:0.92,...surfaceMaps('stone'),bumpScale:0.02}));
  const mesh=new THREE.Mesh(geo,trackMaterial);mesh.receiveShadow=true;return mesh;
}

function telemetryStation() {
  const parts=new Parts('telemetry-station'),group=parts.group;
  parts.add('stoneLight',[0,0.09,0],[2.8,0.18,2.5],[0,Math.PI/8,0],'cylinder8');
  parts.add('cream',[0,0.62,0],[1.2,1.06,0.92],[0,0,0],'roundBox');
  parts.add('orangeLight',[0,1.18,0],[1.28,0.16,0.99],[0,0,0],'roundBox');
  parts.box('graphite',0,1.68,-0.25,0.13,1.05,0.13);
  parts.box('metalLight',0,2.2,-0.25,0.26,0.12,0.26);
  parts.box('screen',0,0.74,0.48,0.84,0.5,0.045);
  for(const x of [-0.5,0.5])for(const y of [0.22,1.06])parts.box('metalLight',x,y,0.48,0.055,0.055,0.035);
  for(const side of [-1,1]) {
    parts.box('metal',side*0.85,0.54,-0.12,0.6,0.08,0.09);
    parts.box('blue',side*1.02,0.65,-0.15,0.58,0.06,0.8,[0,0,side*0.18]);
    for(let i=0;i<3;i++)parts.box('metalLight',side*1.02,0.685,-0.42+i*0.27,0.58,0.015,0.02,[0,0,side*0.18]);
  }
  const rotor=new Parts('wind-anemometer');
  for(let i=0;i<3;i++) {
    const a=i*Math.PI*2/3;
    rotor.box('metal',Math.sin(a)*0.38,0,Math.cos(a)*0.38,0.055,0.055,0.76,[0,a,0]);
    rotor.add(i===0?'orangeLight':'cream',[Math.sin(a)*0.78,0.04,Math.cos(a)*0.78],[0.36,0.21,0.36],[0,a,0],'cylinder8');
    rotor.add('graphite',[Math.sin(a)*0.78,0.15,Math.cos(a)*0.78],[0.24,0.016,0.24],[0,a,0],'cylinder8');
  }
  const head=rotor.finish();head.position.set(0,2.35,-0.25);head.userData={motion:'anemometer',noBatch:true};group.add(head);
  const bars=[];
  for(let i=0;i<5;i++) {
    const height=0.09+i*0.06;
    const bar=new THREE.Mesh(new THREE.BoxGeometry(0.09,height,0.012),new THREE.MeshBasicMaterial({color:'#56757e',toneMapped:false}));
    bar.position.set(-0.28+i*0.14,0.53+height/2,0.508);group.add(bar);bars.push(bar);
  }
  parts.finish();group.position.set(LAB.center.x,0,LAB.center.z);return {group,bars};
}

function ramp() {
  const profile=new THREE.Shape();profile.moveTo(-2.2,0);profile.lineTo(-0.8,0.65);profile.lineTo(0.8,0.65);profile.lineTo(2.2,0);profile.closePath();
  const body=new THREE.Mesh(new THREE.ExtrudeGeometry(profile,{depth:3.4,bevelEnabled:false}),material('graphite'));
  body.rotation.y=-Math.PI/2;body.position.set(47.4,0.02,-4);body.castShadow=true;body.receiveShadow=true;
  const parts=new Parts('ramp-edge-stripes');
  for(const x of [44.08,47.32]) {
    parts.box('orangeLight',x,0.69,-4,0.12,0.025,1.6);
    for(const side of [-1,1]) parts.box('orangeLight',x,0.35,-4+side*1.5,0.12,0.025,1.55,[side*Math.atan(0.65/1.4),0,0]);
  }
  const group=parts.finish();group.add(body);return group;
}

function cone(parts,x,z) {
  parts.box('graphite',x,0.06,z,0.55,0.12,0.55);
  parts.add('orange',[x,0.4,z],[0.44,0.7,0.44],[0,0,0],'cone8');
  parts.add('cream',[x,0.42,z],[0.28,0.12,0.28],[0,0,0],'cylinder8');
}

export function createLaboratory({reducedMotion=false}={}) {
  const group=new THREE.Group();group.name='rover-laboratory';
  group.add(createLandmass(LAB.outline,{seed:627,name:'laboratory-terrain',portal}));
  group.add(createPlants({outline:LAB.outline,seed:619,portal:gardenPassage,patches:[[31.2,0.9],[35.2,3.7],[44.8,4.8],[49.1,-1],[46.8,-10.4],[34.4,-11.6]]}));
  group.add(createTree(47.5,-9.6,0.95,739),createTree(47,3.8,0.7,129));
  group.add(createWayfinding('lab'),trackSurface(),ramp());
  const telemetry=telemetryStation();group.add(telemetry.group);
  const parts=new Parts('test-course-details');
  // Lane markings and cones sit outside the moving rover's swept path.
  for(let i=0;i<48;i++) {
    const p=coursePose(i/48);
    parts.box('cream',p.x,0.024,p.z,0.08,0.018,0.28,[0,p.heading,0]);
    if(i%4===0) {
      const a=i/48*Math.PI*2-Math.PI/2;
      const x=LAB.center.x+(LAB.radiusX+2.15)*Math.cos(a),z=LAB.center.z+(LAB.radiusZ+2.15)*Math.sin(a);
      if(!portal(x,z))cone(parts,x,z);
    }
  }
  // Two open checkpoint gantries; all the clearance is real geometry.
  const checkpointLights=[];
  for(const progress of [0,0.5]) {
    const p=coursePose(progress);
    for(const side of [-1,1]) {
      parts.box('graphite',p.x,LAB.gateHeight/2,p.z+side*LAB.gateWidth/2,0.22,LAB.gateHeight,0.22);
      parts.box('orange',p.x,0.62,p.z+side*LAB.gateWidth/2,0.3,0.5,0.3);
    }
    parts.box('graphite',p.x,LAB.gateHeight,p.z,0.24,0.25,LAB.gateWidth+0.3);
    const light=new THREE.Mesh(new THREE.BoxGeometry(0.27,0.1,2.5),new THREE.MeshBasicMaterial({color:'#4e5d69'}));
    light.position.set(p.x,LAB.gateHeight+0.03,p.z);group.add(light);checkpointLights.push(light);
    for(let i=0;i<7;i++) for(let j=0;j<2;j++) parts.box((i+j)%2?'graphite':'cream',p.x+(j-0.5)*0.23,0.028,p.z+(i-3)*0.47,0.22,0.018,0.46);
  }
  // Service canopy with a charging bay, spare wheels and an instrument screen.
  for(const x of [35.9,41.1]) for(const z of [-13.1,-11.4]) parts.box('graphite',x,1.5,z,0.18,3,0.18);
  for(let i=0;i<7;i++) parts.box(i%2?'cream':'orangeLight',36.0+i*0.85,3.13,-12.5,0.86,0.18,2.8,[0.08,0,0]);
  parts.add('blue',[38.5,0.58,-12.4],[3.7,0.9,0.9],[0,0,0],'roundBox');
  parts.add('woodLight',[38.5,1.1,-12.4],[4,0.2,1.15],[0,0,0],'roundBox');
  for(const x of [37.2,38.5,39.8]) {
    parts.add('cream',[x,0.6,-11.91],[1.1,0.68,0.08],[0,0,0],'roundBox');
    parts.box('graphite',x,0.72,-11.85,0.32,0.06,0.07);
    parts.box('graphite',x,0.12,-12.4,0.22,0.24,0.7);
  }
  parts.add('cream',[38.2,1.72,-12.5],[1.65,1.05,0.12],[0,0,0],'roundBox');
  planeTexture(screenTexture('signal'),1.48,0.9,group,[38.2,1.72,-12.42]);
  parts.box('orange',40,1.44,-12.2,0.55,0.6,0.6);
  for(let i=0;i<3;i++) parts.add('dark',[35.7,0.25+i*0.34,-10.9],[0.9,0.32,0.9],[0,0,0],'cylinder12');
  sign(group,'Полигон',4.5,0.85,[38.5,3.9,-11.9]);
  for(const x of [36.7,40.3])parts.box('wood',x,3.55,-12,0.14,1.0,0.14);
  const control=new THREE.Group();control.name='test-control';control.position.set(34.7,0,3.2);
  const controlParts=new Parts();controlParts.box('graphite',0,0.85,0,2.7,1.7,0.75);
  controlParts.box('metal',0,1.77,0,2.9,0.15,0.9);controlParts.box('orange',-0.95,0.85,0.42,0.25,1.25,0.08);
  control.add(controlParts.finish());
  sign(control,'Тест ровера',3.3,0.65,[0,2.7,0]);
  const button=sign(control,'Пуск / Стоп',2.25,0.64,[0,1.23,0.51]);button.userData.action='demo';
  const indicators=[];
  for(let i=0;i<3;i++) {
    const light=new THREE.Mesh(new THREE.BoxGeometry(0.42,0.21,0.07),new THREE.MeshBasicMaterial({color:'#49616b'}));
    light.position.set(-0.65+i*0.65,0.57,0.42);control.add(light);indicators.push(light);
  }
  group.add(control,parts.finish());
  for(const [x,z,scale] of [[42.4,-12,0.9],[49.1,1.2,0.75]]) group.add(createCrate(x,z,scale));
  for(const [x,z] of [[31,-1.3],[44.4,3.6],[50,-1.5]]) group.add(createLamp(x,z));
  const rover=createRover({body:'blueLight',top:'cyan',shade:'blue',wheelColor:'orange'});
  rover.name='demonstration-rover';rover.scale.setScalar(0.92);
  // The sun depth is refreshed during motion, so its actual shadow follows the ramp.
  rover.userData.noBatch=true;group.add(rover);
  let elapsed=0,state='idle',previous=coursePose(0);
  function place() {
    const progress=Math.min(elapsed/LAB.duration,1),p=coursePose(progress);
    rover.position.set(p.x,0.06+p.y,p.z);rover.rotation.set(p.pitch,p.heading,0,'YXZ');
    const distance=Math.hypot(p.x-previous.x,p.y-previous.y,p.z-previous.z);
    for(const wheel of rover.userData.wheels) wheel.rotation.x+=distance/(rover.userData.wheelRadius*0.92);
    previous=p;
    indicators.forEach((light,i)=>light.material.color.set(progress>i/3?'#9ce64c':'#49616b'));
    checkpointLights.forEach((light,i)=>light.material.color.set(state!=='idle' && progress>=i*0.5?'#9ce64c':'#4e5d69'));
    telemetry.bars.forEach((bar,i)=>bar.material.color.set(state!=='idle' && progress>=(i+1)/5?'#97e7d1':'#56757e'));
  }
  place();
  return {
    group,
    get active(){return state==='running';},
    get state(){return state;},
    get progress(){return elapsed/LAB.duration;},
    toggle(){
      elapsed=0;state=state==='running'?'idle':'running';previous=coursePose(0);
      if(reducedMotion && state==='running'){elapsed=LAB.duration;state='complete';}
      place();
    },
    update(dt){
      if(state!=='running')return;
      elapsed=Math.min(LAB.duration,elapsed+dt);
      if(elapsed===LAB.duration)state='complete';
      place();
    },
    setReducedMotion(value){reducedMotion=value;if(value && state==='running'){elapsed=LAB.duration;state='complete';place();}},
  };
}
