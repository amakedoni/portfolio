import * as THREE from '../vendor/three/three.module.js';
import { Parts,contactShadow } from './geometry.js';

export const ROVER_WHEEL_RADIUS=0.55;

export function createRover({body='orange',top='orangeLight',shade='orangeShade',wheelColor='orange',groundShadow=true}={}) {
  const parts=new Parts('rover'),root=parts.group;root.userData.noBatch=true;
  // A compact expedition robot: a low rounded hull and a separate binocular head.
  parts.add('graphite',[0,0.65,-0.02],[1.55,0.4,2.05],[0,0,0],'roundBox');
  parts.add(body,[0,0.96,0.04],[1.65,0.62,1.87],[0,0,0],'roundBox');
  parts.add(top,[0,1.21,-0.12],[1.44,0.2,1.25],[0,0,0],'roundBox');
  parts.add('cream',[0,0.94,0.96],[1.48,0.36,0.18],[0,0,0],'roundBox');
  parts.add('dark',[0,0.65,1.05],[1.7,0.2,0.23],[0,0,0],'roundBox');
  parts.box('metal',0,0.62,-1.05,1.58,0.14,0.14);
  for(const side of [-1,1]) {
    parts.add(top,[side*0.79,1.02,0.02],[0.32,0.2,1.92],[0,0,0],'roundBox');
    parts.box(shade,side*0.73,0.77,0.07,0.12,0.2,1.24);
    parts.box('cream',side*0.78,1.18,-0.36,0.06,0.12,0.53);
    parts.add('metal',[side*0.52,0.7,1.19],[0.22,0.18,0.12],[Math.PI/2,0,0],'cylinder12');
    parts.add('dark',[side*0.52,0.7,1.26],[0.1,0.02,0.1],[Math.PI/2,0,0],'cylinder12');
    // Suspension stays visible between the fenders and wide tyres.
    for(const z of [-0.77,0.77]) {
      parts.box('metal',side*0.73,0.56,z,0.15,0.5,0.14,[0,0,-side*0.27]);
      for(let i=0;i<5;i++)parts.add('orangeLight',[side*(0.72+i*0.015),0.38+i*0.065,z],[0.18,0.035,0.18],[0,0,-side*0.27],'cylinder8');
    }
    for(const z of [-0.47,0.43])parts.add('metalLight',[side*0.84,0.93,z],[0.085,0.025,0.085],[0,0,Math.PI/2],'cylinder8');
  }
  for(let i=0;i<5;i++)parts.box('dark',-0.27+i*0.135,1.32,-0.37,0.055,0.018,0.42);
  parts.add('graphite',[0,1.35,0.15],[0.54,0.19,0.55],[0,0,0],'cylinder12');
  parts.box('metal',0,1.48,0.15,0.2,0.27,0.22);
  const headParts=new Parts('rover-camera-head'),head=headParts.group;
  head.position.set(0,1.57,0.14);root.add(head);root.userData.head=head;
  headParts.add(top,[0,0.18,0],[1.22,0.66,0.64],[0,0,0],'roundBox');
  headParts.add('cream',[0,0.19,0.19],[1.14,0.57,0.36],[0,0,0],'roundBox');
  headParts.add('dark',[0,0.2,0.36],[0.99,0.4,0.1],[0,0,0],'roundBox');
  headParts.box(body,0,0.54,-0.06,0.84,0.08,0.47);
  for(const side of [-1,1]) {
    headParts.add('metal',[side*0.62,0.18,-0.03],[0.28,0.08,0.28],[0,0,Math.PI/2],'cylinder12');
    headParts.add('blue',[side*0.245,0.21,0.42],[0.29,0.05,0.29],[Math.PI/2,0,0],'cylinder16');
    const eye=new THREE.Mesh(new THREE.CircleGeometry(0.081,16),new THREE.MeshBasicMaterial({color:new THREE.Color('#8be5e1').multiplyScalar(2),toneMapped:false}));
    eye.position.set(side*0.245,0.21,0.453);eye.userData.motion='eye';head.add(eye);
    headParts.box('cream',side*0.245-0.04,0.265,0.458,0.04,0.04,0.01);
  }
  headParts.finish();
  // Aerial and rear power pack make the silhouette asymmetric.
  parts.add(shade,[0.43,1.31,-0.69],[0.46,0.24,0.41],[0,0,0],'roundBox');
  parts.box('graphite',0.48,1.73,-0.72,0.055,0.78,0.055,[0,0,-0.09]);
  parts.add('cream',[0.515,2.15,-0.72],[0.13,0.15,0.13],[0,0,0],'icosahedron');
  parts.add('graphite',[-0.48,1.33,-0.71],[0.35,0.25,0.4],[0,0,0],'roundBox');
  root.userData.wheels=[];root.userData.wheelRadius=ROVER_WHEEL_RADIUS;
  for(const side of [-1,1])for(const z of [-0.77,0.77]) {
    const wheelParts=new Parts('wheel');
    wheelParts.add('dark',[0,0,0],[1.02,0.39,1.02],[0,0,Math.PI/2],'cylinder16');
    wheelParts.add('graphite',[side*0.2,0,0],[0.8,0.035,0.8],[0,0,Math.PI/2],'cylinder16');
    wheelParts.add(wheelColor,[side*0.225,0,0],[0.58,0.05,0.58],[0,0,Math.PI/2],'cylinder12');
    wheelParts.add('cream',[side*0.26,0,0],[0.24,0.04,0.24],[0,0,Math.PI/2],'cylinder12');
    for(let i=0;i<16;i++) {
      const a=i/16*Math.PI*2;
      wheelParts.box('graphite',0,Math.sin(a)*0.51,Math.cos(a)*0.51,0.43,0.11,0.17,[-a,0,0]);
      if(i%4===0)wheelParts.add('metal',[side*0.26,Math.sin(a)*0.21,Math.cos(a)*0.21],[0.055,0.025,0.055],[0,0,Math.PI/2],'cylinder8');
    }
    const wheel=wheelParts.finish();wheel.position.set(side*0.94,0.58,z);root.add(wheel);root.userData.wheels.push(wheel);
  }
  parts.finish();root.rotation.y=0.24;
  for(const x of [-0.56,0.56]) {
    const lamp=new THREE.Mesh(new THREE.CircleGeometry(0.085,12),new THREE.MeshBasicMaterial({color:new THREE.Color('#ffe2a4').multiplyScalar(2.7),toneMapped:false}));
    lamp.position.set(x,0.95,1.057);root.add(lamp);
  }
  if(groundShadow)contactShadow(root,0,0,3.7,4.0,0.28);
  return root;
}

