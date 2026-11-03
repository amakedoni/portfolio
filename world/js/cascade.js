import * as THREE from '../vendor/three/three.module.js';
import { Parts,material } from './geometry.js';
import { POND,STREAM,seededRandom } from './config.js';

function plane(outline) {
  const shape=new THREE.Shape();outline.forEach(([x,z],i)=>i?shape.lineTo(x,z):shape.moveTo(x,z));shape.closePath();
  const geometry=new THREE.ShapeGeometry(shape);geometry.rotateX(Math.PI/2);return geometry;
}

export function createCascade(waterMaterial,time) {
  const group=new THREE.Group();group.name='garden-creek-and-cascade';
  const parts=new Parts('creek-banks'),random=seededRandom(776);
  const outline=STREAM.outline.map(([x,z])=>[x,z===10.8?11.65:z]);
  const geometry=plane(outline);
  const bed=new THREE.Mesh(geometry,material('#618c76',{side:THREE.DoubleSide}));bed.position.y=STREAM.bottom;bed.receiveShadow=true;group.add(bed);
  const water=new THREE.Mesh(geometry,waterMaterial);water.position.y=POND.level;water.renderOrder=2;water.userData.action='sonar';group.add(water);
  for(let i=0;i<outline.length;i++) {
    const [ax,az]=outline[i],[bx,bz]=outline[(i+1)%outline.length];
    if((az===3 && bz===3) || (az===11.65 && bz===11.65))continue;
    const length=Math.hypot(bx-ax,bz-az),angle=Math.atan2(bx-ax,bz-az),nx=(bz-az)/length,nz=-(bx-ax)/length;
    parts.box('stoneShade',(ax+bx)/2,-0.48,(az+bz)/2,0.18,0.85,length,[0,angle,0]);
    const count=Math.ceil(length/0.6);
    for(let j=0;j<count;j++) {
      const t=(j+0.5)/count,x=ax+(bx-ax)*t,z=az+(bz-az)*t;
      parts.box(j%3?'stoneLight':'stone',x+nx*0.1,0.025,z+nz*0.1,0.32,0.17,length/count-0.025,[0,angle,0]);
      if(j%3===0 && z<10.2)parts.box('moss',x+nx*0.27,0.05,z+nz*0.27,0.3,0.08,0.38);
    }
  }
  // A small arched garden crossing over an actual cut in the ground.
  for(let i=0;i<10;i++) {
    const t=i/9,x=-15.1+t*3.8,y=0.17+Math.sin(t*Math.PI)*0.16;
    parts.box(i%3?'woodLight':'wood',x,y,4.7,0.39,0.15,1.6);
    for(const z of [3.91,5.49])parts.box('metal',x,y+0.086,z,0.045,0.024,0.045);
  }
  for(const x of [-14.95,-11.45])for(const z of [3.83,5.57]) {
    parts.box('woodDark',x,0.55,z,0.13,1.1,0.13);
    parts.box('woodLight',x,1.1,z,0.21,0.08,0.21);
  }
  for(const z of [3.83,5.57])parts.box('wood',-13.2,1.03,z,3.6,0.09,0.09);
  parts.box('stoneShade',-14.4,-0.49,10.8,1.55,0.24,1.7);
  for(const x of [-15.1,-13.7])parts.box('stoneLight',x,-0.2,11.16,0.2,0.55,1.17);
  for(let i=0;i<22;i++) {
    const z=3.3+random()*7.2,x=(z<6.6?-13.2:z>7.8?-14.4:-13.8)+(random()-0.5)*0.65;
    parts.box(i%3?'stoneLight':'stoneShade',x,STREAM.bottom+0.055,z,0.12+random()*0.14,0.11,0.16+random()*0.16);
  }
  group.add(parts.finish());
  const current=new THREE.InstancedMesh(new THREE.BoxGeometry(1,1,1),new THREE.MeshBasicMaterial({color:'#d2f2e2',transparent:true,opacity:0.42,depthWrite:false}),16);
  current.userData.noBatch=true;current.renderOrder=3;current.frustumCulled=false;group.add(current);
  const curtain=new THREE.Mesh(new THREE.PlaneGeometry(1.12,5.4,8,36),new THREE.ShaderMaterial({
    uniforms:{uTime:time,uBlue:{value:new THREE.Color('#3fb8c7')},uWhite:{value:new THREE.Color('#d1f5e8')}},
    transparent:true,depthWrite:false,side:THREE.DoubleSide,
    vertexShader:`uniform float uTime;varying vec2 vUv;void main(){vUv=uv;vec3 p=position;
      float drop=1.0-uv.y;p.z+=0.08+drop*drop*0.38+sin(uv.x*20.0+uTime*2.0)*0.025*drop;
      p.x*=1.0+drop*0.25;gl_Position=projectionMatrix*modelViewMatrix*vec4(p,1.0);}`,
    fragmentShader:`uniform float uTime;uniform vec3 uBlue;uniform vec3 uWhite;varying vec2 vUv;
      void main(){vec2 p=floor(vec2(vUv.x*15.0,(vUv.y+uTime*0.43)*58.0));
        float streak=sin(p.x*2.4+p.y*0.42)+sin(p.x*1.7-p.y*0.18);
        float bright=smoothstep(0.5,1.7,streak);
        float lip=smoothstep(0.9,1.0,vUv.y);
        float fade=smoothstep(0.0,0.2,vUv.y);
        gl_FragColor=vec4(mix(uBlue,uWhite,bright*0.65+lip*0.3),fade*0.88);}`,
  }));
  curtain.position.set(-14.4,POND.level-2.7,11.66);curtain.renderOrder=2;group.add(curtain);
  const foam=new THREE.InstancedMesh(new THREE.BoxGeometry(1,1,1),new THREE.MeshBasicMaterial({color:'#d6f5ea',transparent:true,opacity:0.8,depthWrite:false}),18);
  foam.userData.noBatch=true;foam.frustumCulled=false;group.add(foam);
  const seeds=Array.from({length:18},()=>({x:(random()-0.5)*1.3,phase:random(),speed:0.24+random()*0.14,size:0.035+random()*0.045}));
  const transform=new THREE.Object3D();
  function update() {
    for(let i=0;i<current.count;i++) {
      const z=3.1+((i/current.count+time.value*0.065)%1)*8.5;
      const bend=THREE.MathUtils.smoothstep(z,6.9,7.55),x=-13.2-1.2*bend+Math.sin(i*8.3)*0.27;
      transform.position.set(x,POND.level+0.014,z);transform.scale.set(0.08+(i%3)*0.05,0.006,0.14+(i%4)*0.08);
      transform.updateMatrix();current.setMatrixAt(i,transform.matrix);
    }
    current.instanceMatrix.needsUpdate=true;
    seeds.forEach((seed,i)=>{
      const p=(time.value*seed.speed+seed.phase)%1;
      transform.position.set(-14.4+seed.x*(1+p*0.45),POND.level-p*5.4,11.8+p*p*0.4);
      transform.scale.set(seed.size,seed.size*(2+p*4),seed.size);transform.updateMatrix();foam.setMatrixAt(i,transform.matrix);
    });
    foam.instanceMatrix.needsUpdate=true;
  }
  update();return {group,water,update};
}
