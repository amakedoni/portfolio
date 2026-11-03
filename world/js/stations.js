import * as THREE from '../vendor/three/three.module.js';
import { Parts, planeTexture, contactShadow, material } from './geometry.js';
import { STATIONS } from './config.js';
import { sign, screenTexture, solarTexture, textTexture } from './textures.js';
import { rod,createDish } from './model-parts.js';

function workstationBase(parts, width = 4.4) {
  // A freestanding maker's bench, with air visible below and behind it.
  parts.add('cream',[0,2.38,-0.81],[width+0.24,2.2,0.27],[0,0,0],'roundBox');
  parts.add('blue',[0,2.38,-0.655],[width-0.08,1.94,0.08],[0,0,0],'roundBox');
  for(const x of [-width/2,width/2]) {
    parts.add('orangeShade',[x,1.72,-0.79],[0.18,3.44,0.21],[0,0,0],'roundBox');
    parts.add('cream',[x,3.51,-0.79],[0.32,0.14,0.32],[0,0,0],'roundBox');
  }
  parts.add('woodDark',[0,1.12,0.08],[width+0.14,0.25,1.51],[0,0,0],'roundBox');
  for(let i=0;i<3;i++)parts.add('woodLight',[0,1.25,-0.43+i*0.5],[width+0.2,0.13,0.48],[0,0,0],'roundBox');
  for(const side of [-1,1]) {
    const x=side*(width/2-0.3);
    parts.add('cream',[x,0.62,0.03],[0.36,1.05,1.16],[0,0,0],'roundBox');
    parts.add('graphite',[x,0.11,0.03],[0.55,0.18,1.35],[0,0,0],'roundBox');
    rod(parts,[x,0.3,0.45],[x-side*0.52,1.08,-0.2],'metal',0.11);
    parts.box('orange',x,1.05,0.78,0.26,0.2,0.06);
  }
  parts.box('metal',0,0.32,-0.4,width-0.45,0.12,0.11);
  parts.add('blueLight',[width/2-0.83,0.87,0.1],[0.92,0.4,1.04],[0,0,0],'roundBox');
  parts.add('cream',[width/2-0.83,0.88,0.65],[0.76,0.28,0.08],[0,0,0],'roundBox');
  parts.box('graphite',width/2-0.83,0.9,0.71,0.26,0.055,0.07);
}

function monitor(parent, parts, x, y, z, width, height, kind) {
  parts.add('cream',[x,y,z],[width+0.2,height+0.2,0.2],[0,0,0],'roundBox');
  parts.add('graphite',[x,y,z+0.08],[width+0.08,height+0.08,0.06],[0,0,0],'roundBox');
  parts.box('dark', x, y - height / 2 - 0.15, z, 0.2, 0.4, 0.14);
  parts.box('metal', x, y - height / 2 - 0.36, z + 0.08, width * 0.45, 0.09, 0.45);
  const screen=planeTexture(screenTexture(kind), width, height, parent, [x, y, z + 0.117]);
  screen.userData.screen={width,height};
}

function cup(parts, x, y, z) {
  parts.add('cream', [x, y, z], [0.2, 0.25, 0.2], [0, 0, 0], 'cylinder8');
  parts.add('woodDark', [x, y + 0.13, z], [0.14, 0.014, 0.14], [0, 0, 0], 'cylinder8');
}

function chair(parts, x, z) {
  parts.add('cream',[x,0.71,z],[1.02,0.2,0.94],[0,0,0],'roundBox');
  parts.add('blueLight',[x,0.83,z],[0.93,0.18,0.87],[0,0,0],'roundBox');
  parts.add('cream',[x,1.3,z+0.38],[0.96,0.94,0.22],[-0.12,0,0],'roundBox');
  parts.add('blue',[x,1.34,z+0.25],[0.79,0.71,0.12],[-0.12,0,0],'roundBox');
  parts.add('metal',[x,0.42,z],[0.14,0.55,0.14],[0,0,0],'cylinder12');
  for(const side of [-1,1]) {
    rod(parts,[x+side*0.48,0.7,z],[x+side*0.48,1.12,z],'metal',0.07);
    parts.add('graphite',[x+side*0.49,1.12,z],[0.13,0.1,0.55],[0,0,0],'roundBox');
  }
  for(let i=0;i<5;i++) {
    const a=i*Math.PI*2/5,dx=Math.sin(a)*0.5,dz=Math.cos(a)*0.5;
    rod(parts,[x,0.24,z],[x+dx,0.16,z+dz],'metal',0.1);
    parts.add('dark',[x+dx,0.11,z+dz],[0.19,0.12,0.19],[0,a,Math.PI/2],'cylinder12');
  }
}

function pot(parts, x, y, z) {
  parts.box('cream', x, y + 0.16, z, 0.33, 0.32, 0.33);
  for (let i = -2; i <= 2; i++) parts.box(i % 2 ? 'leafDark' : 'leaf', x + i * 0.07, y + 0.52 - Math.abs(i) * 0.06, z, 0.09, 0.48, 0.12, [0, 0, -i * 0.3]);
}

export function createProjects() {
  const parts = new Parts('projects-station'), group = parts.group;
  workstationBase(parts);
  monitor(group, parts, -0.05, 2.25, -0.39, 3.05, 1.55, 'finly');
  parts.box('graphite', -0.2, 1.34, 0.4, 1.15, 0.08, 0.42);
  for (let i = 0; i < 10; i++) parts.box('metal', -0.67 + i * 0.1, 1.388, 0.43, 0.065, 0.015, 0.24);
  parts.box('metal', 0.8, 1.35, 0.38, 0.19, 0.08, 0.29);
  const mini = new THREE.Group(); mini.position.set(-0.95,1.6,0.15); mini.rotation.x=-0.18;
  const frame=new Parts(); frame.box('graphite',0,0,0,0.99,0.6,0.06); mini.add(frame.finish());
  planeTexture(screenTexture('finly'),0.9,0.51,mini,[0,0,0.035]); group.add(mini);
  parts.box('metal',-0.95,1.33,0.36,1.02,0.045,0.65);
  pot(parts, -1.77, 1.31, -0.05); cup(parts, 1.65, 1.46, 0.3);
  chair(parts, 0.2, 1.31);
  // A small left-hand information totem is part of the workstation.
  parts.box('graphite', -2.57, 1.35, 0.48, 0.66, 2.7, 0.45);
  for (let i = 0; i < 3; i++) parts.box('orange', -2.58 + i * 0.15, 2.02 + i * 0.09, 0.72, 0.09, 0.28 + i * 0.18, 0.035);
  planeTexture(textTexture(['Finly'], { fontSize: 150, background: '#3d424a', color: '#fff0cb' }), 0.59, 0.37, group, [-2.57, 1.27, 0.72]);
  const label = sign(group, 'Проекты', 2.9, 0.72, [0, 3.97, -0.81], { href: STATIONS.projects.href, name: 'projects-sign' });
  for (const x of [-1.25, 1.25]) parts.box('wood', x, 3.55, -0.89, 0.13, 0.8, 0.15);
  parts.finish(); group.position.set(STATIONS.projects.x, 0, STATIONS.projects.z);
  contactShadow(group, 0, 0.2, 6.4, 4.4); return { group, label };
}

export function createSkills() {
  const parts = new Parts('skills-station'), group = parts.group;
  workstationBase(parts, 4.3);
  const indicators=new THREE.InstancedMesh(new THREE.BoxGeometry(0.18,0.065,0.026),new THREE.MeshBasicMaterial({color:0xffffff,toneMapped:false}),14);
  indicators.userData={motion:'server-lights',noBatch:true};
  const indicatorTransform=new THREE.Matrix4();let indicatorIndex=0;
  // Equipment racks are assembled from simple readable modules.
  for (const x of [-1.6, -0.52]) {
    parts.add('cream',[x,1.72,0.03],[0.98,3.2,1.03],[0,0,0],'roundBox');
    parts.add('orangeLight',[x,3.34,0.03],[1.06,0.16,1.1],[0,0,0],'roundBox');
    parts.add('graphite',[x,1.72,0.57],[0.77,2.94,0.07],[0,0,0],'roundBox');
    parts.box('metal',x,0.14,0.03,0.78,0.2,0.82);
    for (let i = 0; i < 7; i++) {
      const y=0.53+i*0.39;
      parts.add(i%2?'metal':'blue',[x,y,0.63],[0.65,0.31,0.08],[0,0,0],'roundBox');
      indicators.setMatrixAt(indicatorIndex,indicatorTransform.makeTranslation(x-0.16,y+0.035,0.681));
      indicators.setColorAt(indicatorIndex,new THREE.Color(i%3===0?'#68dce0':i%3===1?'#eebc4d':'#529bd2'));indicatorIndex++;
      for(let j=0;j<3;j++)parts.box('dark',x+0.1+j*0.07,y,0.681,0.035,0.15,0.015);
      parts.box('metalLight',x-0.14,y-0.075,0.692,0.22,0.025,0.025);
    }
  }
  indicators.computeBoundingSphere();group.add(indicators);
  // A compact laptop leaves room for tools and a tangible resume folder.
  parts.box('graphite', 1.05, 1.35, 0.25, 1.23, 0.1, 0.76);
  const laptop = new THREE.Group(); laptop.position.set(1.05, 1.83, -0.02); laptop.rotation.x = -0.12;
  const laptopParts = new Parts(); laptopParts.box('graphite', 0, 0, 0, 1.29, 0.87, 0.09); laptop.add(laptopParts.finish());
  planeTexture(screenTexture('code'), 1.16, 0.73, laptop, [0, 0, 0.05]); group.add(laptop);
  for (let i = 0; i < 5; i++) {
    const x = 0.1 + i * 0.42;
    parts.box('metal', x, 2.87, -0.4, 0.06, 0.54 + i % 2 * 0.13, 0.07);
    parts.box('orange', x, 2.46, -0.4, 0.14, 0.3, 0.14);
  }
  parts.box('orange', 2.14, 1.46, 0.2, 0.54, 0.38, 0.38);
  for (let i = 0; i < 4; i++) parts.box('cream', 2.13, 1.75 + i * 0.06, 0.13 - i * 0.04, 0.43, 0.28, 0.045, [-0.15, 0, 0]);
  sign(group, 'Резюме', 1.5, 0.52, [2.08, 2.45, 0.15], { href: '../resume.pdf', fontSize: 110, name: 'resume-sign' });
  const label = sign(group, 'Навыки', 2.9, 0.72, [0.9, 4.5, 0.6], { href: STATIONS.skills.href, name: 'skills-sign' });
  for (const x of [-0.35, 2.14]) {
    parts.box('wood', x, 2.82, -0.9, 0.14, 3.35, 0.14);
    parts.box('wood', x, 4.25, -0.15, 0.14, 0.14, 1.5);
  }
  pot(parts, 2.04, 0, 0.9);
  parts.finish(); group.position.set(STATIONS.skills.x, 0, STATIONS.skills.z);
  contactShadow(group, 0, 0.2, 6.7, 4.8); return { group, label };
}

export function createSatellite() {
  const parts = new Parts('about-station'), group = parts.group;
  parts.add('stoneLight', [0, 0.17, 0], [5.1, 0.34, 4.4], [0, Math.PI / 8, 0], 'cylinder8');
  parts.add('orangeLight', [0, 0.37, 0], [4.35, 0.09, 3.67], [0, Math.PI / 8, 0], 'cylinder8');
  parts.add('graphite', [0, 0.59, 0], [3.9, 0.4, 3.25], [0, Math.PI / 8, 0], 'cylinder8');
  parts.add('stoneLight', [0, 0.84, 0], [3.94, 0.13, 3.3], [0, Math.PI / 8, 0], 'cylinder8');
  planeTexture(textTexture(['CubeSat'], { fontSize: 142, background: '#414752', color: '#fff0cb' }), 2.3, 0.37, group, [0, 0.59, 1.67]);
  const plaque=new THREE.Group(); plaque.position.set(-2.05,0.82,1.0); plaque.rotation.x=-0.32;
  const plaqueParts=new Parts(); plaqueParts.box('metalLight',0,0,0,1.12,1.45,0.12); plaqueParts.box('wood',0,-0.8,-0.1,0.15,0.65,0.2); plaque.add(plaqueParts.finish());
  planeTexture(textTexture(['МАИ','CubeSat'],{height:512,fontSize:130,background:'#414752',color:'#fff0cb',fit:false}),0.97,1.28,plaque,[0,0,0.065]); group.add(plaque);
  parts.box('graphite', 0, 1.23, 0, 0.13, 0.85, 0.13);
  for (const x of [-0.42, 0.42]) parts.box('graphite', x, 0.97, 0, 0.57, 0.15, 0.59);
  parts.add('graphite',[0,2.13,0],[1.17,1.61,1.07],[0,0,0],'roundBox');
  // Gold thermal blankets, dark instrument faces and exposed structural rails.
  for(const side of [-1,1]) {
    parts.box('yellow',side*0.59,2.13,0,0.05,1.47,0.94);
    for(let i=0;i<5;i++)parts.add(i%2?'orangeLight':'yellow',[side*0.625,1.56+i*0.28,0.05],[0.035,0.34,0.85],[0,side*0.06,(i%2?1:-1)*0.05],'icosahedron');
    parts.box('metalLight',0,side<0?1.32:2.96,0,1.35,0.12,1.25);
  }
  for(const x of [-0.59,0.59])for(const z of [-0.54,0.54]) {
    parts.add('cream',[x,2.14,z],[0.11,1.78,0.11],[0,0,0],'roundBox');
    for(const y of [1.4,2.13,2.87])parts.add('metal',[x,y,z+0.055],[0.06,0.025,0.06],[Math.PI/2,0,0],'cylinder8');
  }
  for(let i=0;i<3;i++) {
    parts.box('blue',0,1.57+i*0.55,0.55,0.98,0.45,0.045);
    for(let j=0;j<3;j++)parts.box('metal',-0.31+j*0.31,1.57+i*0.55,0.577,0.012,0.4,0.008);
  }
  parts.add('cream',[0.08,2.28,0.64],[0.5,0.15,0.5],[Math.PI/2,0,0],'cylinder12');
  parts.add('dark',[0.08,2.28,0.73],[0.35,0.09,0.35],[Math.PI/2,0,0],'cylinder16');
  parts.add('cyan',[0.08,2.28,0.79],[0.2,0.025,0.2],[Math.PI/2,0,0],'cylinder16');
  planeTexture(textTexture(['TC2'],{width:256,height:128,background:'#282f3c',color:'#ffcf47',fontSize:70}),0.35,0.17,group,[0.08,1.67,0.59]);
  parts.add('graphite',[0,3.05,0],[0.44,0.14,0.44],[0,0,0],'cylinder12');
  for(const side of [-1,1])rod(parts,[side*0.15,3.1,0],[side*0.76,3.48,-0.23],'metalLight',0.025);
  const panelTexture = solarTexture();
  for (const side of [-1, 1]) {
    parts.box('graphite', side * 1.12, 2.2, 0, 1.2, 0.13, 0.15);
    const panel = new THREE.Group(); panel.position.set(side * 2.02, 2.28, 0); panel.rotation.x = -0.65;
    panel.userData.motion='solar';panel.userData.noBatch=true;
    const frame=new Parts();frame.add('cream',[0,0,0],[2.37,1.28,0.12],[0,0,0],'roundBox');
    frame.box('graphite',0,0,0.07,0.05,1.24,0.06);
    for(const x of [-1.08,1.08])for(const y of [-0.5,0.5])frame.box('orangeLight',x,y,0.08,0.12,0.12,0.03);
    panel.add(frame.finish());
    for(const side of [-1,1])planeTexture(panelTexture,1.08,1.12,panel,[side*0.565,0,0.071]);group.add(panel);
  }
  const label = sign(group, 'Обо мне', 2.65, 0.7, [0.4, 4.12, -0.7], { href: STATIONS.about.href, name: 'about-sign' });
  for (const x of [-0.75, 1.55]) parts.box('wood', x, 3.2, -0.78, 0.13, 1.6, 0.13);
  parts.finish(); group.position.set(STATIONS.about.x, 0, STATIONS.about.z);
  contactShadow(group, 0, 0, 6.2, 3.7, 0.21); return { group, label };
}

export function createContact() {
  const parts = new Parts('contact-station'), group = parts.group;
  parts.add('blue',[0,0.65,0.1],[3.8,0.95,1.35],[0,0,0],'roundBox');
  parts.add('woodLight',[0,1.2,0.1],[4.03,0.24,1.6],[0,0,0],'roundBox');
  for(const x of [-1.43,1.43])for(const z of [-0.35,0.56])parts.add('graphite',[x,0.15,z],[0.22,0.3,0.22],[0,0,0],'cylinder12');
  for(let i=0;i<3;i++)for(let j=0;j<2;j++) {
    const x=-1.22+i*1.22,y=0.48+j*0.38;
    parts.add('cream',[x,y,0.8],[1.1,0.31,0.1],[0,0,0],'roundBox');
    parts.box('graphite',x,y+0.025,0.88,0.33,0.055,0.08);
    parts.box('orangeLight',x-0.4,y,0.86,0.08,0.13,0.015);
  }
  monitor(group, parts, 0.68, 1.96, 0.14, 1.5, 0.96, 'signal');
  parts.box('graphite', 0.6, 1.35, 0.58, 1.02, 0.07, 0.32);
  parts.add('orange',[-0.62,1.59,0.28],[0.73,0.52,0.54],[0,0,0],'roundBox');
  parts.box('cream',-0.62,1.6,0.57,0.61,0.38,0.035);
  for(let i=0;i<2;i++)parts.add('graphite',[-0.79+i*0.34,1.57,0.62],[0.14,0.06,0.14],[Math.PI/2,0,0],'cylinder12');
  parts.box('blue',-0.62,1.72,0.6,0.46,0.08,0.03);
  parts.box('graphite', -0.89, 2.06, 0.05, 0.045, 0.65, 0.045);
  const dish=createDish();dish.position.set(-1.53,1.9,-0.2);dish.rotation.x=0.74;dish.scale.setScalar(0.9);
  dish.userData.motion='dish';dish.userData.noBatch=true;
  group.add(dish);
  parts.box('graphite', -1.53, 1.48, -0.2, 0.13, 0.8, 0.18);
  const label = sign(group, 'Контакты', 2.9, 0.67, [0.55, 3.05, -0.35], { href: STATIONS.contact.href, name: 'contact-sign' });
  for (const x of [-0.7, 1.8]) parts.box('wood', x, 2.2, -0.43, 0.14, 1.7, 0.14);
  const languages = new THREE.Group(); languages.position.set(2.9, 1.42, 0.15); languages.name = 'language-selector';
  const languageParts = new Parts(); languageParts.box('stoneLight', 0, 0, 0, 1.6, 1.45, 0.25); languages.add(languageParts.finish());
  planeTexture(textTexture(['RU / EN'], { fontSize: 130 }), 1.43, 0.37, languages, [0, 0.43, 0.14]);
  const buttons = [];
  for (const [i, language] of ['ru', 'en'].entries()) {
    const button = new THREE.Group(); button.position.set(-0.38 + i * 0.76, -0.24, 0.22); button.userData = { action: 'language', language };
    const b = new Parts(); b.box(i === 0 ? 'orange' : 'graphite', 0, 0, 0, 0.62, 0.58, 0.17); button.add(b.finish());
    planeTexture(textTexture([language.toUpperCase()], { width: 256, height: 256, background: null, color: '#fff0cb', fontSize: 150 }), 0.5, 0.35, button, [0, 0, 0.09]); languages.add(button); buttons.push(button);
  }
  group.add(languages); parts.finish(); group.position.set(STATIONS.contact.x, 0, STATIONS.contact.z);
  contactShadow(group, 0.4, 0.1, 6.4, 3.9); return { group, label, buttons };
}

export function createFlag() {
  const parts = new Parts('mai-flag');
  parts.box('metal', 0, 2.8, 0, 0.1, 5.6, 0.1);
  parts.box('woodLight', 0, 5.64, 0, 0.2, 0.19, 0.2);
  parts.box('stoneShade', 0, 0.12, 0, 0.45, 0.24, 0.45);
  const group = parts.finish(); group.position.set(3.3, 0, -9.7);
  const canvas = document.createElement('canvas'); canvas.width = 256; canvas.height = 384;
  const ctx = canvas.getContext('2d'); ctx.fillStyle = '#285b8f'; ctx.fillRect(0, 0, 256, 384);
  ctx.fillStyle = '#e7e9d7';
  const pixelPlane = [[0, -4], [0, -3], [0, -2], [0, -1], [0, 0], [0, 1], [0, 2], [-1, 0], [1, 0], [-2, 1], [2, 1], [-3, 1], [3, 1], [-1, 3], [1, 3]];
  for (const [x, y] of pixelPlane) ctx.fillRect(119 + x * 17, 125 + y * 17, 17, 17);
  ctx.font = '600 65px Pixelify'; ctx.textAlign = 'center'; ctx.fillText('МАИ', 128, 308);
  const texture = new THREE.CanvasTexture(canvas); texture.colorSpace = THREE.SRGBColorSpace; texture.magFilter = THREE.NearestFilter;
  const flag=planeTexture(texture, 1.47, 2.24, group, [0.79, 4.22, 0]);
  flag.geometry.dispose();flag.geometry=new THREE.PlaneGeometry(1.47,2.24,16,12);
  flag.userData.motion='flag';flag.castShadow=true;return group;
}
