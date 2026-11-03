import * as THREE from '../vendor/three/three.module.js';
import { Parts } from './geometry.js';
import { windTime } from './surfaces.js';

function butterfly(x,y,z,color) {
  const root=new THREE.Group();root.position.set(x,y,z);root.userData.noBatch=true;
  const body=new Parts();body.box('graphite',0,0,0,0.045,0.04,0.23);root.add(body.finish());
  const wings=[];
  for(const side of [-1,1]) {
    const parts=new Parts();parts.box(color,side*0.13,0,0,0.24,0.025,0.25);
    parts.box('cream',side*0.12,0.017,0.035,0.08,0.012,0.09);
    const wing=parts.finish();root.add(wing);wings.push(wing);
  }
  root.traverse(object=>{if(object.isMesh)object.castShadow=false;});
  return {root,wings,origin:root.position.clone()};
}

export function createAmbience(world,rover,{reducedMotion=false}={}) {
  const moving=[],eyes=[],screens=[];
  world.traverse(object=>{
    if(object.userData.motion==='eye')eyes.push(object);
    else if(object.userData.motion)moving.push({object,kind:object.userData.motion,base:object.rotation.clone()});
    if(object.userData.screen)screens.push(object);
  });
  // One gentle scan line per large screen, no canvas uploads each frame.
  const scans=screens.map(screen=>{
    const {width,height}=screen.userData.screen;
    const line=new THREE.Mesh(new THREE.PlaneGeometry(width*0.97,height*0.025),new THREE.MeshBasicMaterial({color:'#75d8e9',transparent:true,opacity:0.1,depthWrite:false,toneMapped:false}));
    line.position.z=0.003;screen.add(line);return {line,height};
  });
  const butterflies=[butterfly(-14.5,1.35,-1.7,'orangeLight'),butterfly(-17,1.1,5.8,'blueLight'),butterfly(45.1,1.2,3.4,'orangeLight')];
  world.add(...butterflies.map(item=>item.root));
  const flagRest=new Map(moving.filter(item=>item.kind==='flag').map(({object})=>[object,object.geometry.attributes.position.array.slice()]));
  const hoverStates=[];
  world.traverse(object=>{
    if(!object.userData.sign || !(object.userData.href || object.userData.action))return;
    const width=object.userData.face.geometry.parameters.width,height=object.userData.face.geometry.parameters.height;
    const parts=new Parts('hover-corners');
    for(const x of [-1,1])for(const y of [-1,1]) {
      parts.box('orangeLight',x*(width/2+0.16),y*(height/2+0.15),0.1,0.26,0.045,0.045);
      parts.box('orangeLight',x*(width/2+0.26),y*(height/2+0.07),0.1,0.045,0.2,0.045);
    }
    const corners=parts.finish();corners.visible=false;object.add(corners);
    hoverStates.push({object,corners,value:0});
  });
  let time=0,hovered=null;
  const statusColor=new THREE.Color();
  function update(dt) {
    if(!reducedMotion)time+=dt;
    windTime.value=time;
    for(const {object,kind,base} of moving) {
      if(kind==='dish')object.rotation.y=base.y+Math.sin(time*0.32)*0.13;
      if(kind==='solar')object.rotation.x=base.x+Math.sin(time*0.22)*0.045;
      if(kind==='anemometer')object.rotation.y=base.y+time*1.6+Math.sin(time*0.37)*0.35;
      if(kind==='server-lights') {
        for(let i=0;i<object.count;i++) {
          statusColor.set(i%3===0?'#68dce0':i%3===1?'#eebc4d':'#529bd2');
          statusColor.multiplyScalar(0.62+0.38*(0.5+0.5*Math.sin(time*2.2+i*2.3)));
          object.setColorAt(i,statusColor);
        }
        object.instanceColor.needsUpdate=true;
      }
      if(kind==='flag') {
        const position=object.geometry.attributes.position,rest=flagRest.get(object);
        for(let i=0;i<position.count;i++) {
          const x=rest[i*3],y=rest[i*3+1],strength=(x+0.735)/1.47;
          position.setXYZ(i,x,y+Math.sin(time*2.4+x*3)*strength*0.025,
            (Math.sin(x*4-time*2.6)+0.32*Math.sin(y*4+x*5-time*3.1))*strength*0.13);
        }
        position.needsUpdate=true;object.geometry.computeVertexNormals();
      }
    }
    rover.userData.head.rotation.y=Math.sin(time*0.43)*0.17;
    for(const eye of eyes) {
      const blink=time%7.8;eye.scale.y=!reducedMotion && blink>7.55?0.2:1;
    }
    scans.forEach(({line,height},i)=>line.position.y=(0.5-((time*0.12+i*0.31)%1))*height*0.92);
    butterflies.forEach(({root,wings,origin},i)=>{
      const t=time*(0.7+i*0.08)+i*2;
      root.position.set(origin.x+Math.cos(t)*0.7,origin.y+Math.sin(t*1.6)*0.2,origin.z+Math.sin(t)*0.45);
      root.rotation.y=-t;
      wings.forEach((wing,j)=>wing.rotation.z=(j?1:-1)*(0.3+Math.sin(time*12+i)*0.65));
    });
    for(const entry of hoverStates) {
      const target=hovered===entry.object?1:0;
      entry.value=reducedMotion?target:THREE.MathUtils.lerp(entry.value,target,1-Math.exp(-dt*16));
      entry.object.scale.setScalar(1+entry.value*0.045);
      entry.corners.visible=entry.value>0.12;
    }
  }
  update(0);
  return {
    update,get time(){return time;},get active(){return !reducedMotion || hoverStates.some(entry=>Math.abs(entry.value-(hovered===entry.object?1:0))>0.001);},
    hover(object){hovered=object;},
    setReducedMotion(value){reducedMotion=value;update(0);},
  };
}
