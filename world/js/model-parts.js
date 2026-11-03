import * as THREE from '../vendor/three/three.module.js';
import { Parts,material } from './geometry.js';

export function rod(parts,a,b,color='metal',radius=0.06) {
  const start=new THREE.Vector3(...a),end=new THREE.Vector3(...b),delta=end.clone().sub(start);
  const rotation=new THREE.Euler().setFromQuaternion(new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0,1,0),delta.clone().normalize()));
  parts.add(color,start.add(end).multiplyScalar(0.5).toArray(),[radius,delta.length(),radius],[rotation.x,rotation.y,rotation.z],'cylinder8');
}

export function createDish() {
  const parts=new Parts('parabolic-antenna'),group=parts.group;
  const profile=[[0,0],[0.25,0.025],[0.5,0.1],[0.75,0.225],[1,0.4],[1,0.45],[0.75,0.28],[0.5,0.155],[0.25,0.08],[0,0.055]].map(p=>new THREE.Vector2(...p));
  const bowl=new THREE.Mesh(new THREE.LatheGeometry(profile,24),material('cream'));
  bowl.castShadow=true;bowl.receiveShadow=true;group.add(bowl);
  const rim=new THREE.Mesh(new THREE.TorusGeometry(0.99,0.045,6,24),material('orangeLight'));
  rim.rotation.x=Math.PI/2;rim.position.y=0.44;rim.castShadow=true;group.add(rim);
  for(let i=0;i<3;i++) {
    const a=i*Math.PI*2/3;
    rod(parts,[Math.cos(a)*0.85,0.34,Math.sin(a)*0.85],[0,1.02,0],'graphite',0.045);
    rod(parts,[0,-0.05,0],[Math.cos(a)*0.85,0.27,Math.sin(a)*0.85],'orangeShade',0.09);
  }
  parts.add('orange',[0,0.98,0],[0.2,0.27,0.2],[0,0,0],'roundBox');
  parts.add('dark',[0,1.13,0],[0.13,0.035,0.13],[0,0,0],'cylinder12');
  return parts.finish();
}
