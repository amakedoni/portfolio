import * as THREE from '../vendor/three/three.module.js';
import { Parts,material,planeTexture } from './geometry.js';
import { createLandmass,createPlants,createTree,createLamp,createCrate } from './island.js';
import { sign,textTexture,solarTexture,starChartTexture } from './textures.js';
import { DISTRICTS,ROUTES,APPROACHES,districtPortal,distanceToPath } from './archipelago-config.js';
import { seededRandom,insidePolygon } from './config.js';
import { rod } from './model-parts.js';
import { createBowlingState } from './activity-state.js';

function actionSign(parent,title,action,position,width=3.1) {
  const label=sign(parent,title,width,0.66,position,{textureWidth:width<1?256:1024});label.userData.action=action;
  const posts=new Parts();for(const side of [-1,1])posts.box('wood',position[0]+side*(width/2-0.2),position[1]/2,position[2]-0.08,0.13,position[1],0.13);
  parent.add(posts.finish());return label;
}

function wayfinder(parent,region,position) {
  const group=new THREE.Group();group.position.set(...position);parent.add(group);
  const items=[[DISTRICTS[region].title,'focus-'+region],['Вся карта','focus-map']];
  const parts=new Parts();parts.box('woodDark',0,1.8,0,0.2,3.6,0.22);parts.box('stoneLight',0,0.15,0,0.6,0.3,0.6);
  items.forEach(([title,action],i)=>{const label=sign(group,title,3.2,0.6,[0,3.1-i*0.86,0.1]);label.userData.action=action;});group.add(parts.finish());
}

function landscape(region) {
  const spec=DISTRICTS[region],group=new THREE.Group();group.name=region+'-district';
  const clear=(x,z)=>districtPortal(region,x,z) || distanceToPath(x,z,APPROACHES[region])<2.4;
  group.add(createLandmass(spec.outline,{seed:spec.seed,name:region+'-terrain',portal:clear}));
  group.add(createPlants({outline:spec.outline,seed:spec.seed+1,portal:clear,patches:[]}));
  const parts=new Parts(region+'-landmarks'),random=seededRandom(spec.seed+5);
  // Route inlays are traversable; everything taller stays outside the approaches.
  const path=APPROACHES[region];
  for(let i=1;i<path.length;i++) {
    const [ax,az]=path[i-1],[bx,bz]=path[i],length=Math.hypot(bx-ax,bz-az),yaw=Math.atan2(bx-ax,bz-az);
    for(let j=0;j<length;j+=1.6) {
      const t=j/length,x=ax+(bx-ax)*t,z=az+(bz-az)*t;
      for(const side of [-1,1])parts.box('pavingLight',x+Math.cos(yaw)*side*1.8,0.014,z-Math.sin(yaw)*side*1.8,0.16,0.018,0.5,[0,yaw,0]);
    }
  }
  const flowers=region==='observatory'?[[-23,-34],[-18,-42],[-4,-39]]:region==='playground'?[[17.8,-43],[33.7,-42],[34.8,-29.7]]:[[56.9,-28],[68.5,-28],[67,-16.3]];
  for(const [cx,cz] of flowers)for(let i=0;i<44;i++) {
    const x=cx+(random()-0.5)*3.2,z=cz+(random()-0.5)*2.3,h=0.2+random()*0.35;
    if(clear(x,z) || !insidePolygon(x,z,spec.outline,0.8))continue;
    parts.add(i%3?'grass':'leafLight',[x,h/2,z],[0.22,h,0.19],[0,random()*Math.PI,0],'cone3');
    if(i%5===0)parts.add(region==='observatory'?'blueLight':'cream',[x,h,z],[0.18,0.08,0.18],[0,random(),0],'icosahedron');
  }
  group.add(parts.finish());return group;
}

function createObservatory() {
  const group=landscape('observatory'),parts=new Parts('observatory-equipment');
  group.add(createTree(-22,-38,1.05,813),createTree(-6,-42,0.85,715));
  for(const [x,z] of [[-20,-29],[-5,-32],[-24,-35]])group.add(createLamp(x,z));
  wayfinder(group,'observatory',[-17.7,0,-27.6]);
  const base=new THREE.Group();base.position.set(-15,0,-36);group.add(base);
  const platform=new Parts('telescope-platform');
  platform.add('stoneLight',[0,0.16,0],[7,0.32,6.5],[0,Math.PI/12,0],'cylinder12');
  platform.add('blue',[0,0.35,0],[6.5,0.09,6],[0,Math.PI/12,0],'cylinder12');
  for(let i=0;i<12;i++) {
    const a=i*Math.PI/6;platform.box('cream',Math.sin(a)*2.8,0.41,Math.cos(a)*2.65,0.09,0.025,0.3,[0,a,0]);
  }
  for(let i=0;i<3;i++) {
    const a=i*Math.PI*2/3;rod(platform,[0,2.7,0],[Math.sin(a)*1.8,0.46,Math.cos(a)*1.8],'cream',0.27);
    platform.add('graphite',[Math.sin(a)*1.8,0.48,Math.cos(a)*1.8],[0.55,0.14,0.55],[0,0,0],'roundBox');
  }
  platform.add('orange',[0,2.7,0],[1.1,0.55,1.1],[0,0,Math.PI/2],'cylinder16');base.add(platform.finish());
  const scopeParts=new Parts('telescope'),scope=scopeParts.group;scope.position.y=2.9;scope.rotation.x=0.65;scope.rotation.z=-0.25;scope.userData.noBatch=true;base.add(scope);
  scopeParts.add('cream',[0,0.2,0],[1.36,3.0,1.36],[0,0,0],'cylinder16');
  for(const y of [-1.1,1.8])scopeParts.add('graphite',[0,y,0],[1.5,0.2,1.5],[0,0,0],'cylinder16');
  scopeParts.add('blue',[0,1.92,0],[1.29,0.06,1.29],[0,0,0],'cylinder16');
  scopeParts.add('cyan',[-0.22,1.96,0.22],[0.42,0.025,0.42],[0,0,0],'cylinder12');
  scopeParts.add('orangeLight',[0,0.15,0],[1.47,0.24,1.47],[0,0,0],'cylinder16');
  scopeParts.box('graphite',0,-1.47,0,0.35,0.6,0.35);scopeParts.add('orange',[0,-1.7,0.3],[0.3,0.36,0.8],[Math.PI/2,0,0],'cylinder12');
  scopeParts.add('blue',[0.8,0.8,0],[0.3,1.2,0.3],[0,0,0],'cylinder12');
  rod(scopeParts,[0.5,0.4,0],[0.8,0.4,0],'metal',0.08);scopeParts.finish();
  // A miniature orrery illustrates the observation instead of a screen popup.
  const orrery=new THREE.Group();orrery.position.set(-6.7,1.1,-37.8);orrery.userData.noBatch=true;group.add(orrery);
  parts.add('stoneLight',[-6.7,0.2,-37.8],[4.6,0.4,4.6],[0,0,0],'cylinder12');
  parts.add('graphite',[-6.7,0.75,-37.8],[0.45,1.1,0.45],[0,0,0],'cylinder12');
  const planets=[];
  for(let i=0;i<3;i++) {
    const radius=0.75+i*0.53,ring=new THREE.Mesh(new THREE.TorusGeometry(radius,0.025,5,48),material('metalLight'));
    ring.rotation.x=Math.PI/2;orrery.add(ring);
    const planet=new THREE.Mesh(new THREE.IcosahedronGeometry(0.16+i*0.035,1),material(['orange','cyan','blueLight'][i]));planet.castShadow=true;orrery.add(planet);planets.push({planet,radius});
  }
  const star=new THREE.Mesh(new THREE.IcosahedronGeometry(0.34,1),new THREE.MeshBasicMaterial({color:new THREE.Color('#ffd082').multiplyScalar(2),toneMapped:false}));orrery.add(star);
  actionSign(group,'Наблюдать','activity-observatory',[-15,1.25,-31.4],3.1);
  const chart=new THREE.Group();chart.position.set(-21,1.35,-32.2);chart.rotation.x=-0.65;group.add(chart);
  const chartParts=new Parts();chartParts.add('woodLight',[0,0,0],[2.6,1.65,0.17],[0,0,0],'roundBox');chart.add(chartParts.finish());
  planeTexture(starChartTexture(),2.35,1.4,chart,[0,0,0.092]);
  for(const x of [-21.8,-20.2])parts.box('cream',x,0.56,-32.5,0.17,1.12,0.2);
  for(let i=0;i<3;i++)parts.add('woodLight',[-23,0.63,-29.4+i*0.22],[2.7,0.13,0.2],[0,0,0],'roundBox');
  for(const x of [-24,-22])parts.box('graphite',x,0.3,-29.15,0.16,0.6,0.7);
  group.add(parts.finish());let active=false,time=0;
  function place(){scope.rotation.y=Math.sin(time*0.42)*0.22;scope.rotation.x=0.65+Math.sin(time*0.28)*0.15;planets.forEach(({planet,radius},i)=>planet.position.set(Math.cos(time*(0.8-i*0.19)+i*2)*radius,0,Math.sin(time*(0.8-i*0.19)+i*2)*radius));orrery.rotation.z=0.22;}
  place();
  return {group,get state(){return active?'watching':'ready';},get active(){return active;},activate(reduced){active=!active;if(reduced && active){time+=1;place();}},update(dt,reduced){if(active && !reduced){time+=dt;place();}},reduce(){place();},status(en){return en?(active?'Orrery in motion':'Observatory ready'):(active?'Телескоп наблюдает, планеты движутся':'Обсерватория готова');}};
}

function createEnergy() {
  const group=landscape('energy'),parts=new Parts('energy-station'),rotors=[];
  wayfinder(group,'energy',[55.5,0,-18.2]);
  for(const [x,z,height] of [[58.5,-28.2,3.7],[65,-28,4.9],[68.6,-21.2,3.6]]) {
    parts.add('stoneLight',[x,0.16,z],[1.65,0.32,1.65],[0,0,0],'cylinder12');
    parts.add('cream',[x,height/2,z],[0.53,height,0.53],[0,0,0],'cone12');
    parts.add('blue',[x,0.48,z],[0.55,0.66,0.55],[0,0,0],'cylinder12');
    const rotorParts=new Parts('wind-turbine'),rotor=rotorParts.group;rotor.position.set(x,height,z+0.18);rotor.userData.noBatch=true;
    rotorParts.add('orange',[0,0,0],[0.53,0.45,0.53],[Math.PI/2,0,0],'cylinder12');
    for(let i=0;i<3;i++) {
      const a=i*Math.PI*2/3;rotorParts.add('cream',[Math.sin(a)*0.89,Math.cos(a)*0.89,0],[0.29,1.7,0.13],[0,0,-a-0.12],'roundBox');
      rotorParts.box('orangeLight',Math.sin(a)*1.55,Math.cos(a)*1.55,0.075,0.3,0.2,0.04,[0,0,-a-0.12]);
    }
    rotorParts.finish();group.add(rotor);rotors.push(rotor);
  }
  parts.add('stoneLight',[63.5,0.16,-22.7],[4.2,0.32,4.2],[0,0,0],'cylinder12');
  parts.add('graphite',[63.5,0.47,-22.7],[2.65,0.35,2.65],[0,0,0],'cylinder12');
  parts.add('cream',[63.5,1.65,-22.7],[1.8,2.3,1.8],[0,0,0],'roundBox');
  parts.add('orange',[63.5,2.85,-22.7],[2,0.25,2],[0,0,0],'roundBox');
  parts.box('dark',63.5,1.7,-21.76,1.3,1.65,0.07);
  const lights=[];
  for(let i=0;i<5;i++) {
    const light=new THREE.Mesh(new THREE.BoxGeometry(1.05,0.21,0.07),new THREE.MeshBasicMaterial({color:'#355e6d',toneMapped:false}));
    light.position.set(63.5,1.07+i*0.3,-21.69);group.add(light);lights.push(light);
  }
  const solar=solarTexture();
  for(const x of [65.5,68]) {
    const panel=new THREE.Group();panel.position.set(x,0.9,-16.6);panel.rotation.x=-0.8;
    const frame=new Parts();frame.add('cream',[0,0,0],[2.2,1.5,0.12],[0,0,0],'roundBox');panel.add(frame.finish());planeTexture(solar,2.04,1.35,panel,[0,0,0.07]);group.add(panel);
    parts.box('metal',x,0.45,-16.7,0.14,0.9,0.14);
  }
  actionSign(group,'Подать энергию','activity-energy',[65,1.3,-18.8],3.7);
  group.add(parts.finish(),createLamp(69,-26),createCrate(57,-28.6,0.7));
  let active=false,level=0,time=0;
  function place(){lights.forEach((light,i)=>light.material.color.set(level>(i+0.4)/5?'#7ce8c7':'#355e6d').multiplyScalar(level>(i+0.4)/5?2:1));rotors.forEach((rotor,i)=>rotor.rotation.z=-time*(0.7+i*0.2));}
  return {group,get state(){return active?'powered':'off';},get active(){return active || level>0;},activate(reduced){active=!active;if(reduced){level=active?1:0;place();}},update(dt,reduced){if(reduced)return;level=THREE.MathUtils.clamp(level+(active?dt*0.6:-dt*0.8),0,1);time+=dt*(0.15+level*2);place();},reduce(){level=active?1:0;place();},status(en){return en?(active?'Wind turbines charging the battery':'Power station off'):(active?'Ветряки заряжают накопитель':'Электростанция выключена');}};
}

function createPlayground() {
  const group=landscape('playground'),parts=new Parts('bowling-lane');
  group.add(createTree(18.2,-43,0.95,129),createTree(34,-42.5,0.8,231));
  for(const [x,z] of [[16,-38],[32.5,-32.8],[34,-44.5]])group.add(createLamp(x,z));
  wayfinder(group,'playground',[18,0,-30]);
  const lane=new THREE.Group();lane.position.set(27,0,-39.6);group.add(lane);
  parts.add('graphite',[0,0.07,0],[4.7,0.14,9.2],[0,0,0],'roundBox');
  for(let i=0;i<9;i++)parts.box(i%2?'woodLight':'pavingLight',-1.8+i*0.45,0.17,0,0.435,0.14,8.8);
  for(const side of [-1,1]) {
    parts.add('blue',[side*2.2,0.25,0],[0.28,0.37,9.1],[0,0,0],'roundBox');
    parts.box('orangeLight',side*2.2,0.45,0,0.13,0.05,8.8);
  }
  parts.add('graphite',[0,0.31,-4.53],[4.55,0.48,0.26],[0,0,0],'roundBox');
  for(let i=-2;i<=2;i++)parts.box('cream',i*0.55,0.247,1.9+Math.abs(i)*0.18,0.08,0.014,0.28);
  lane.add(parts.finish());
  const pinGeometry=new THREE.LatheGeometry([[0,0],[0.22,0],[0.28,0.25],[0.21,0.55],[0.1,0.76],[0.14,0.89],[0.16,1.03],[0.1,1.15],[0,1.2]].map(p=>new THREE.Vector2(...p)),16);
  const simulation=createBowlingState(),pinModels=[];
  for(const pin of simulation.pins) {
    const pivot=new THREE.Group();pivot.userData.noBatch=true;
    const mesh=new THREE.Mesh(pinGeometry,material('cream'));mesh.castShadow=true;mesh.receiveShadow=true;pivot.add(mesh);
    const stripe=new THREE.Mesh(new THREE.CylinderGeometry(0.12,0.115,0.13,16),material('orange'));stripe.position.y=0.79;stripe.castShadow=true;pivot.add(stripe);
    lane.add(pivot);pinModels.push(pivot);
  }
  const ball=new THREE.Mesh(new THREE.IcosahedronGeometry(0.43,2),material('orange'));ball.castShadow=true;ball.userData.noBatch=true;lane.add(ball);
  const control=actionSign(group,'Бросок / Сброс','activity-playground',[27,1.2,-33.7],3.4);
  const left=actionSign(group,'←','activity-aim-left',[24.5,0.8,-33.7],0.85),right=actionSign(group,'→','activity-aim-right',[29.5,0.8,-33.7],0.85);
  const score=planeTexture(textTexture(['0 / 6'],{width:512,height:256,background:'#24394c',color:'#fff0cb',fontSize:140}),2.2,0.85,group,[27,2.25,-45.085]);
  const stand=new Parts();stand.add('cream',[27,2.25,-45.2],[2.5,1.1,0.2],[0,0,0],'roundBox');stand.box('metal',27,1,-45.2,0.18,2,0.18);group.add(stand.finish());
  let lastScore=-1;
  const pinUp=new THREE.Vector3(0,1,0),pinDirection=new THREE.Vector3();
  function place(){
    ball.position.set(simulation.ball.x,0.69,simulation.ball.z);ball.rotation.x=simulation.ball.z/0.43;
    simulation.pins.forEach((pin,i)=>{
      const model=pinModels[i],angle=pin.fall*Math.PI/2;
      model.position.set(pin.x,0.25+Math.sin(angle)*0.28,pin.z);
      model.quaternion.setFromUnitVectors(pinUp,pinDirection.set(Math.sin(pin.angle)*Math.sin(angle),Math.cos(angle),Math.cos(pin.angle)*Math.sin(angle)));
    });
    if(lastScore!==simulation.score){score.material.map.dispose();score.material.map=textTexture([simulation.score+' / 6'],{width:512,height:256,background:'#24394c',color:'#fff0cb',fontSize:140});lastScore=simulation.score;}
  }
  place();
  return {group,get state(){return simulation.state;},get score(){return simulation.score;},get aimPosition(){return simulation.aim;},get active(){return simulation.state==='rolling';},activate(reduced){simulation.activate(reduced);place();},aim(direction){simulation.aimBy(direction);place();},update(dt){simulation.update(dt);place();},reduce(){simulation.finish();place();},status(en){
    const aiming=(en?['far left','left','centre','right','far right']:['левый край','левее','центр','правее','правый край'])[simulation.aim+2];
    const stage=simulation.state==='rolling'?(en?'ball rolling':'шар катится'):simulation.state==='complete'?(en?'press to reset':'нажмите для сброса'):(en?'aim: ':'направление: ')+aiming;
    return (en?'Bowling: ':'Кегли: ')+simulation.score+' / 6 — '+stage;
  }};
}

export function createArchipelago() {
  return {observatory:createObservatory(),playground:createPlayground(),energy:createEnergy()};
}

export function createRouteSigns() {
  const group=new THREE.Group();
  actionSign(group,'Обсерватория','focus-observatory',[-2.2,2.1,-12.5],3.5);
  actionSign(group,'Игротека','focus-playground',[44,2,-11.4],2.7);
  return group;
}
