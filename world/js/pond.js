import * as THREE from '../vendor/three/three.module.js';
import { Parts,material } from './geometry.js';
import { POND,insidePond,seededRandom } from './config.js';
import { sign } from './textures.js';
import { createCascade } from './cascade.js';

function surfaceGeometry() {
  const shape=new THREE.Shape();
  POND.outline.forEach(([x,z],i)=>i?shape.lineTo(x,z):shape.moveTo(x,z));shape.closePath();
  const geometry=new THREE.ShapeGeometry(shape);geometry.rotateX(Math.PI/2);return geometry;
}

function createFish(color,phase) {
  const parts=new Parts('pond-fish');
  parts.box(color,0,0,0,0.22,0.16,0.47);
  parts.box('cream',0,0.02,-0.05,0.23,0.16,0.12);
  parts.box(color,0,0,-0.29,0.33,0.08,0.13);
  for(const x of [-0.116,0.116])parts.box('dark',x,0.04,0.15,0.025,0.04,0.05);
  const group=parts.finish();group.userData.phase=phase;
  group.traverse(mesh=>{if(mesh.isMesh)mesh.castShadow=false;});return group;
}

export function createPond({reducedMotion=false}={}) {
  const group=new THREE.Group();group.name='garden-pond';
  const parts=new Parts('pond-shore'),random=seededRandom(1493);
  const geometry=surfaceGeometry();
  const bed=new THREE.Mesh(geometry,material('#568c80',{side:THREE.DoubleSide}));
  bed.position.y=POND.bottom;bed.receiveShadow=true;group.add(bed);
  const water=new THREE.Mesh(geometry,new THREE.MeshPhysicalMaterial({
    color:'#35b9c4',emissive:'#168d99',emissiveIntensity:0.1,roughness:0.2,metalness:0.05,
    clearcoat:1,clearcoatRoughness:0.18,transparent:true,opacity:0.72,
    depthWrite:false,side:THREE.DoubleSide,
  }));
  water.position.y=POND.level;water.renderOrder=2;water.userData.action='sonar';group.add(water);
  const waterTime={value:0};
  water.material.onBeforeCompile=shader=>{
    shader.uniforms.uWaterTime=waterTime;
    shader.vertexShader='varying vec2 vPond;\n'+shader.vertexShader;
    shader.vertexShader=shader.vertexShader.replace('#include <begin_vertex>','#include <begin_vertex>\nvPond=position.xz;');
    shader.fragmentShader='uniform float uWaterTime;\nvarying vec2 vPond;\n'+shader.fragmentShader;
    shader.fragmentShader=shader.fragmentShader.replace('#include <normal_fragment_begin>',`#include <normal_fragment_begin>
      vec2 ripple=vec2(sin(vPond.x*7.0+vPond.y*3.0+uWaterTime*1.2),cos(vPond.y*6.0-vPond.x*2.0-uWaterTime*0.9));
      normal=normalize(normal+vec3(ripple.x*0.075,ripple.y*0.075,0.0));`);
  };
  water.material.customProgramCacheKey=()=> 'pond-ripples-v1';
  const cascade=createCascade(water.material,waterTime);group.add(cascade.group);
  const caustics=new THREE.Mesh(geometry,new THREE.ShaderMaterial({
    uniforms:{uTime:waterTime},transparent:true,depthWrite:false,side:THREE.DoubleSide,
    vertexShader:'varying vec2 vP;void main(){vP=position.xz;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0);}',
    fragmentShader:`uniform float uTime;varying vec2 vP;void main(){
      vec2 p=floor(vP*14.0)/14.0;
      float a=sin(p.x*4.4+sin(p.y*3.8+uTime*0.6));
      float b=cos(p.y*4.8+sin(p.x*3.1-uTime*0.4));
      float light=pow(max(0.0,1.0-abs(a+b)*2.4),5.0);
      gl_FragColor=vec4(0.72,0.96,0.76,light*0.24);}`,
  }));
  caustics.position.y=POND.bottom+0.012;group.add(caustics);
  // Retaining walls and separate capstones make a real recessed basin.
  for(let i=0;i<POND.outline.length;i++) {
    const [ax,az]=POND.outline[i],[bx,bz]=POND.outline[(i+1)%POND.outline.length];
    if(az===3 && bz===3)continue;
    const length=Math.hypot(bx-ax,bz-az),nx=(bz-az)/length,nz=-(bx-ax)/length;
    const angle=Math.atan2(bx-ax,bz-az),count=Math.round(length/0.6);
    parts.box('stoneShade',(ax+bx)/2+nx*0.08,-0.56,(az+bz)/2+nz*0.08,0.16,1.1,length,[0,angle,0]);
    for(let j=0;j<count;j++) {
      const t=(j+0.5)/count,x=ax+(bx-ax)*t,z=az+(bz-az)*t;
      parts.box(j%3?'stoneLight':'stone',x+nx*0.13,0.06+random()*0.035,z+nz*0.13,0.48,0.24,length/count-0.025,[0,angle,0]);
    }
  }
  // Pebbles on the bed remain visible through the shallow turquoise water.
  for(let i=0;i<34;i++) {
    const x=-16.2+random()*4.8,z=-3+random()*6;
    if(insidePond(x,z,0.22))parts.box(i%3?'stoneLight':'stoneShade',x,POND.bottom+0.05,z,0.17+random()*0.2,0.1,0.17+random()*0.14);
  }
  // Pixel glints belong to the water surface, not to the stone paving.
  const glints=new Parts('water-highlights');
  for(let i=0;i<30;i++) {
    const x=-16.0+random()*4.4,z=-2.8+random()*5.3;
    if(insidePond(x,z,0.4))glints.box(i%4?'#9ce2d9':'#dcf8e8',x,POND.level+0.012,z,0.22+random()*0.35,0.008,0.035);
  }
  const glintGroup=glints.finish();glintGroup.userData.noBatch=true;
  glintGroup.traverse(mesh=>{mesh.castShadow=false;if(mesh.isMesh){mesh.material=mesh.material.clone();mesh.material.transparent=true;mesh.material.depthWrite=false;}});group.add(glintGroup);
  // A short pier grows out of the existing pergola deck.
  for(let i=0;i<8;i++)parts.box(i%3?'woodLight':'wood',-16.0+i*0.4,0.12,1.35,0.38,0.16,1.22);
  for(const z of [0.88,1.82]) {
    parts.box('woodDark',-14.6,-0.02,z,3.7,0.18,0.16);
    for(const x of [-15.7,-13.4]) {
      parts.box('woodDark',x,-0.22,z,0.18,1.5,0.18);
      parts.box('woodLight',x,0.55,z,0.24,0.11,0.24);
    }
  }
  const plaque=sign(group,'Сонар',1.65,0.5,[-13.4,0.94,2.0]);plaque.userData.action='sonar';
  parts.box('wood',-13.4,0.49,1.92,0.11,0.85,0.13);
  // Reeds and lily pads give the bank its own vegetation.
  for(const [x,z] of [[-15.8,-1.2],[-14.8,-2.8],[-11.65,-0.2]])for(let i=0;i<5;i++) {
    const px=x+(random()-0.5)*0.45,pz=z+(random()-0.5)*0.4,h=0.45+random()*0.55;
    parts.box(i%2?'leaf':'grass',px,POND.level+h/2,pz,0.06,h,0.06);
    if(i%2===0)parts.box('woodDark',px,POND.level+h,pz,0.105,0.23,0.105);
  }
  for(const [x,z] of [[-15.3,-0.5],[-12,-1.9],[-12.4,1.1]]) {
    parts.add('leafDark',[x,POND.level+0.028,z],[0.65,0.045,0.6],[0,0.4,0],'cylinder8');
    parts.box('leaf',x+0.04,POND.level+0.055,z,0.3,0.012,0.34);
    for(const [dx,dz] of [[-0.09,0],[0.09,0],[0,-0.09],[0,0.09]])parts.box('cream',x+dx,POND.level+0.1,z+dz,0.12,0.07,0.12);
    parts.box('yellow',x,POND.level+0.14,z,0.08,0.07,0.08);
  }
  group.add(parts.finish());
  const buoyParts=new Parts('sonar-buoy'),buoy=buoyParts.group;
  buoyParts.add('orange',[0,0.03,0],[0.88,0.2,0.88],[0,Math.PI/8,0],'cylinder8');
  buoyParts.add('cream',[0,0.17,0],[0.61,0.12,0.61],[0,Math.PI/8,0],'cylinder8');
  buoyParts.box('graphite',0,0.43,0,0.38,0.45,0.38);
  buoyParts.box('cream',0,0.67,0,0.44,0.08,0.42);
  buoyParts.box('orange',0.18,0.83,-0.09,0.045,0.43,0.045);
  const light=new THREE.Mesh(new THREE.BoxGeometry(0.23,0.11,0.035),new THREE.MeshBasicMaterial({color:'#70e0db'}));
  light.position.set(0,0.46,0.205);buoy.add(light);buoyParts.finish();
  buoy.userData.action='sonar';buoy.position.set(POND.buoy.x,POND.level+0.02,POND.buoy.z);group.add(buoy);
  const hitTargets=[water,cascade.water];buoy.traverse(mesh=>{if(mesh.isMesh){mesh.castShadow=false;hitTargets.push(mesh);}});
  const fish=[createFish('orangeLight',0),createFish('yellow',Math.PI)];
  fish.forEach(item=>item.userData.noBatch=true);group.add(...fish);
  // The pulse shares the exact water outline, so no rings can spill onto land.
  const waveMaterial=new THREE.ShaderMaterial({
    uniforms:{uTime:{value:0},uCenter:{value:new THREE.Vector2(POND.buoy.x,POND.buoy.z)},uColor:{value:new THREE.Color('#c6ffeb')}},
    transparent:true,depthWrite:false,side:THREE.DoubleSide,
    vertexShader:`varying vec2 vWater;void main(){vec4 p=modelMatrix*vec4(position,1.0);vWater=p.xz;gl_Position=projectionMatrix*viewMatrix*p;}`,
    fragmentShader:`uniform float uTime;uniform vec2 uCenter;uniform vec3 uColor;varying vec2 vWater;
      void main(){float d=length(vWater-uCenter);float pulse=0.0;
        for(int i=0;i<3;i++){float t=uTime-float(i)*0.72;float r=t*0.95;
          float line=1.0-smoothstep(0.025,0.075,abs(d-r));
          pulse+=line*step(0.0,t)*(1.0-smoothstep(2.9,3.6,r));}
        gl_FragColor=vec4(uColor,min(pulse,1.0)*0.8);}`,
  });
  const waves=new THREE.Mesh(geometry,waveMaterial);waves.position.y=POND.level+0.024;waves.renderOrder=3;waves.visible=false;group.add(waves);
  let elapsed=0,ambient=0,state='idle';
  function place() {
    const moving=state==='pulsing';
    buoy.position.y=POND.level+0.02+Math.sin(ambient*1.7)*0.035+(moving?Math.sin(elapsed*4)*0.025*Math.min(elapsed,1):0);
    buoy.rotation.z=Math.sin(ambient*1.3)*0.025+(moving?Math.sin(elapsed*3)*0.025:0);
    light.material.color.set(moving && Math.sin(elapsed*8)>0?'#ffdc68':'#70e0db');
    fish.forEach((item,i)=>{
      const a=item.userData.phase+ambient*0.33;
      item.position.set(-13.5+Math.cos(a)*(1.0-i*0.15),-0.65-i*0.13,-0.2+Math.sin(a)*(1.15-i*0.15));
      item.rotation.y=Math.atan2(-Math.sin(a),Math.cos(a));
    });
    waveMaterial.uniforms.uTime.value=elapsed;
    waterTime.value=ambient;
    cascade.update();
    glintGroup.children.forEach((mesh,i)=>mesh.material.opacity=0.42+0.24*Math.sin(ambient*1.4+i*2));
  }
  place();
  return {
    group,hitTargets,
    get active(){return state==='pulsing';},get state(){return state;},get progress(){return elapsed/POND.duration;},
    pulse(){elapsed=reducedMotion?1.25:0;state=reducedMotion?'sent':'pulsing';waves.visible=true;place();},
    update(dt){
      if(!reducedMotion)ambient+=dt;
      if(state==='pulsing'){elapsed=Math.min(POND.duration,elapsed+dt);if(elapsed===POND.duration){state='sent';waves.visible=false;}}
      place();
    },
    setReducedMotion(value){reducedMotion=value;if(value && state==='pulsing'){state='sent';elapsed=POND.duration;waves.visible=false;}place();},
  };
}
