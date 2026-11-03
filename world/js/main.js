import * as THREE from '../vendor/three/three.module.js';
import { OrbitControls } from '../vendor/three/OrbitControls.js';
import { EffectComposer } from '../vendor/three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from '../vendor/three/addons/postprocessing/RenderPass.js';
import { GTAOPass } from '../vendor/three/addons/postprocessing/GTAOPass.js';
import { OutputPass } from '../vendor/three/addons/postprocessing/OutputPass.js';
import { createIsland, createTree, createPlants, createCrate, createLamp, createRailings, createEntranceSigns, createLookout } from './island.js';
import { createBridge, createWayfinding } from './bridge.js';
import { createLaboratory } from './laboratory.js';
import { createPond } from './pond.js';
import { createProjects, createSkills, createSatellite, createContact, createFlag } from './stations.js';
import { createRover } from './rover.js';
import { textTexture } from './textures.js';
import { batchStaticParts } from './geometry.js';
import { installWind,createSkyEnvironment } from './surfaces.js';
import { createAmbience } from './ambience.js';
import { createGardenDetails, addWorkshopDetails } from './details.js';
import { createCourtyard, TERRACES } from './courtyard.js';
import { artLight,balancedPerspectiveFrame,installArtDirection } from './art-direction.js';
import { CinematicPass } from './cinematic-pass.js';
import { createMeadows } from './meadows.js';
import { createArchipelago,createRouteSigns } from './archipelago.js';
import { DISTRICTS,EXTRA_BRIDGES } from './archipelago-config.js';

const canvas = document.querySelector('#island-canvas');
const root = document.querySelector('#world');
root.setAttribute('aria-busy', 'true');

async function boot() {
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true, powerPreference: 'high-performance' });
  renderer.setClearColor(0xc4e5f3, 0);
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.LinearToneMapping;
  renderer.toneMappingExposure = 1.0;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFShadowMap;

  await Promise.all([document.fonts.load('600 48px Pixelify'), document.fonts.load('800 48px Signage')]);

  const scene = new THREE.Scene();
  const skyEnvironment=createSkyEnvironment(renderer);scene.environment=skyEnvironment.texture;scene.environmentIntensity=0.18;
  scene.add(new THREE.HemisphereLight(0xa8b6e8, 0xc58a6d, 0.6));
  const sun = new THREE.DirectionalLight(0xffd9b5, 2.1);
  sun.target.position.set(15,0,-3);sun.position.copy(sun.target.position).addScaledVector(artLight.direction.value,60);sun.castShadow=true;
  sun.shadow.mapSize.set(4096, 4096);
  Object.assign(sun.shadow.camera, {left:-45,right:45,top:45,bottom:-45,near:0.5,far:140});
  sun.shadow.bias = -0.00008; sun.shadow.normalBias = 0.035; sun.shadow.radius = 3;
  scene.add(sun); scene.add(sun.target);
  const skyFill = new THREE.DirectionalLight(0x8b8bda, 0.3);
  skyFill.position.set(12, 10, -15); scene.add(skyFill);

  const world = new THREE.Group(); world.name = 'portfolio-island'; scene.add(world);
  const mainWorld=new THREE.Group();mainWorld.name='portfolio-district';world.add(mainWorld);
  const motionPreference=matchMedia('(prefers-reduced-motion: reduce)');
  let reducedMotion=motionPreference.matches;
  const pond=createPond({reducedMotion});
  mainWorld.add(createIsland(),createCourtyard(),createMeadows(),createPlants(),createLookout(),createWayfinding('main'),pond.group);
  mainWorld.add(createTree(-8.4,-9.0,1.25,731),createTree(8.8,-10.4,1.05,931));
  mainWorld.add(createTree(-17.7,6.3,0.82,423));
  mainWorld.add(createRailings());
  const projects = createProjects(), skills = createSkills(), about = createSatellite(), contact = createContact();
  for(const terrace of TERRACES)({projects,skills}[terrace.station]).group.position.y=terrace.height;
  mainWorld.add(projects.group,skills.group,about.group,contact.group,createFlag(),createEntranceSigns());
  const rover=createRover();rover.scale.setScalar(1.23);rover.position.set(-1.2,0.14,2.1);mainWorld.add(rover);
  for(const [x,z,scale] of [[-11.7,6.6,1.1],[-17,-3.8,0.8],[14.5,-4.3,1.05],[14.2,7.4,0.9],[-8.3,-6.4,0.7]])mainWorld.add(createCrate(x,z,scale));
  for(const [x,z] of [[-3.3,10.6],[3.3,10.6],[-16.8,-2.9],[-9.1,-5.8],[11,-4.3],[15.4,6.4],[4.5,-7.5],[-13.5,-8.4],[-11.6,4.7],[9.2,9.6]])mainWorld.add(createLamp(x,z));
  const laboratory=createLaboratory({reducedMotion});
  world.add(createBridge(),laboratory.group);
  mainWorld.add(createGardenDetails());laboratory.group.add(createGardenDetails('lab'),createMeadows('lab'));
  addWorkshopDetails(projects.group,skills.group,contact.group,laboratory.group);
  const activities=createArchipelago();
  const districts={main:mainWorld,lab:laboratory.group,...Object.fromEntries(Object.entries(activities).map(([id,activity])=>[id,activity.group]))};
  world.add(...Object.values(activities).map(activity=>activity.group),...EXTRA_BRIDGES.map(bridge=>createBridge(bridge)),createRouteSigns());
  const ambience=createAmbience(world,rover,{reducedMotion});
  const removedBatches=Object.values(districts).reduce((sum,district)=>sum+batchStaticParts(district),0);
  canvas.dataset.mergedBatches=String(removedBatches);

  const camera = new THREE.PerspectiveCamera(32,innerWidth/innerHeight,0.1,320);
  camera.position.set(30,35,38);
  camera.lookAt(0, 0.2, 0.8);
  const controls = new OrbitControls(camera, canvas);
  controls.target.set(0, 0.2, 0.8);
  controls.enableDamping = !reducedMotion;controls.dampingFactor=0.12;
  controls.enablePan = true;
  controls.minZoom = 0.75; controls.maxZoom = 3;
  controls.minDistance=12;controls.maxDistance=150;
  controls.minPolarAngle = Math.PI * 0.21; controls.maxPolarAngle = Math.PI * 0.36;
  controls.minAzimuthAngle = -0.1; controls.maxAzimuthAngle = 1.05;
  controls.rotateSpeed = 0.45; controls.zoomSpeed = 0.65;
  controls.mouseButtons = { LEFT: THREE.MOUSE.ROTATE, MIDDLE: THREE.MOUSE.DOLLY, RIGHT: THREE.MOUSE.PAN };
  controls.touches = { ONE: THREE.TOUCH.ROTATE, TWO: THREE.TOUCH.DOLLY_PAN };
  controls.update();

  // Ground-truth ambient occlusion restores contact and small voxel crevices.
  // MSAA and physical resolution keep geometry sharp without pixelating the page.
  const target = new THREE.WebGLRenderTarget(1,1,{type:THREE.HalfFloatType, samples:4});
  const composer = new EffectComposer(renderer,target);
  composer.addPass(new RenderPass(scene,camera));
  const ao = new GTAOPass(scene,camera,1,1,undefined,
    {radius:0.75,distanceExponent:1.5,thickness:1.2,distanceFallOff:0.8,scale:1},
    {radius:5,lumaPhi:10,depthPhi:2,normalPhi:3});
  ao.blendIntensity = 0.48;
  installWind(ao.normalMaterial);
  const cinematic=new CinematicPass();
  composer.addPass(ao);composer.addPass(cinematic);composer.addPass(new OutputPass());

  // Fit the actual projected model, excluding the surrounding clouds.
  const corners=Object.fromEntries([...Object.keys(districts),'map'].map(id=>[id,[]]));
  const initialRegion=location.hash.slice(1);
  let cameraRegion=Object.hasOwn(corners,initialRegion)?initialRegion:'main';
  world.updateMatrixWorld(true);
  const instanceMatrix = new THREE.Matrix4();
  const worldMatrix = new THREE.Matrix4();
  world.traverse(object => {
    if (!object.isMesh || object.material.transparent) return;
    let district=object;
    while(district && !Object.values(districts).includes(district))district=district.parent;
    const region=Object.entries(districts).find(([,group])=>group===district)?.[0];
    if (!object.geometry.boundingBox) object.geometry.computeBoundingBox();
    const bounds = object.geometry.boundingBox;
    // Fit individual blocks: a whole batch's box includes empty corners outside
    // the rounded island and would unnecessarily shrink the scene.
    for (let i = 0; i < (object.isInstancedMesh ? object.count : 1); i++) {
      if (object.isInstancedMesh) { object.getMatrixAt(i, instanceMatrix); worldMatrix.multiplyMatrices(object.matrixWorld, instanceMatrix); }
      else worldMatrix.copy(object.matrixWorld);
      for (const x of [bounds.min.x, bounds.max.x]) for (const y of [bounds.min.y, bounds.max.y]) for (const z of [bounds.min.z, bounds.max.z]) {
        const point=new THREE.Vector3(x,y,z).applyMatrix4(worldMatrix);
        corners.map.push(point);if(region)corners[region].push(point);
      }
    }
  });

  function fitSunShadow() {
    const districtBounds=new THREE.Box3().setFromPoints(corners[cameraRegion]);
    sun.target.position.copy(districtBounds.getCenter(new THREE.Vector3()));
    sun.position.copy(sun.target.position).addScaledVector(artLight.direction.value,100);
    sun.updateMatrixWorld();sun.target.updateMatrixWorld();sun.shadow.updateMatrices(sun);
    const bounds=new THREE.Box3();
    for(const point of corners[cameraRegion])bounds.expandByPoint(point.clone().applyMatrix4(sun.shadow.camera.matrixWorldInverse));
    Object.assign(sun.shadow.camera,{left:bounds.min.x-2,right:bounds.max.x+2,top:bounds.max.y+2,bottom:bounds.min.y-2,far:Math.max(180,-bounds.min.z+10)});
    sun.shadow.camera.updateProjectionMatrix();renderer.shadowMap.needsUpdate=true;
  }

  let rendering=false,contextLost=false;

  function render() {
    if(rendering || document.hidden || contextLost)return;
    rendering=true;
    renderer.info.autoReset = false; renderer.info.reset();
    artLight.focus.value.copy(controls.target);
    composer.render();
    canvas.dataset.drawCalls = String(renderer.info.render.calls);
    canvas.dataset.triangles = String(renderer.info.render.triangles);
    canvas.dataset.cameraRegion=cameraRegion;
    canvas.dataset.labState=laboratory.state;
    canvas.dataset.labProgress=laboratory.progress.toFixed(3);
    canvas.dataset.waterState=pond.state;
    canvas.dataset.waterProgress=pond.progress.toFixed(3);
    canvas.dataset.ambientTime=ambience.time.toFixed(2);
    canvas.dataset.motion=reducedMotion?'reduced':'full';
    for(const [id,activity] of Object.entries(activities))canvas.dataset[id+'State']=activity.state;
    canvas.dataset.bowlingScore=String(activities.playground.score);
    canvas.dataset.bowlingAim=String(activities.playground.aimPosition);
    rendering=false;
  }

  let pixelRatio=1,qualityLimit=2,cameraTransition=null;
  function sizeRenderer(width,height) {
    pixelRatio = Math.min(Math.max(devicePixelRatio || 1, width >= 900 ? 1.5 : 1.25),qualityLimit,2);
    renderer.setPixelRatio(pixelRatio);renderer.setSize(width,height,false);
    composer.setPixelRatio(pixelRatio);composer.setSize(width,height);
    // AO does not need the extra supersampling of sharp geometry and labels.
    ao.setSize(Math.round(width*Math.min(pixelRatio,1.25)),Math.round(height*Math.min(pixelRatio,1.25)));
    canvas.dataset.pixelRatio=pixelRatio.toFixed(2);
  }
  function resize(draw=true) {
    const { width, height } = root.getBoundingClientRect();
    if (!width || !height) return;
    cameraTransition=null;
    sizeRenderer(width,height);
    camera.updateMatrixWorld();
    const inverseOrientation=camera.quaternion.clone().invert();
    const points=corners[cameraRegion].map(point=>point.clone().sub(controls.target).applyQuaternion(inverseOrientation));
    const bounds = new THREE.Box3();
    for (const point of points) bounds.expandByPoint(point);
    const center = bounds.getCenter(new THREE.Vector3());
    const right = new THREE.Vector3().setFromMatrixColumn(camera.matrixWorld, 0);
    const up = new THREE.Vector3().setFromMatrixColumn(camera.matrixWorld, 1);
    const offset = right.multiplyScalar(center.x).add(up.multiplyScalar(center.y));
    const direction=camera.position.clone().sub(controls.target).normalize();
    controls.target.add(offset);
    for(const p of points){p.x-=center.x;p.y-=center.y;}
    const padding=width<700?1.08:1.025;
    camera.aspect=width/height;
    const frame=balancedPerspectiveFrame(points,camera.fov,camera.aspect,padding);
    controls.target.addScaledVector(new THREE.Vector3().setFromMatrixColumn(camera.matrixWorld,0),frame.x);
    controls.target.addScaledVector(new THREE.Vector3().setFromMatrixColumn(camera.matrixWorld,1),frame.y);
    // The close district view reads like a place to enter; the map remains a full overview.
    const distance=frame.distance*(width>=700 && cameraRegion==='main'?0.87:1);
    camera.position.copy(controls.target).addScaledVector(direction,distance);
    controls.minDistance=distance*0.3;controls.maxDistance=distance*1.8;
    camera.far=Math.max(320,controls.maxDistance-bounds.min.z+30);
    camera.updateProjectionMatrix();fitSunShadow();controls.update();if(draw!==false)render();
  }

  const labels = [];
  world.traverse(object => { if (object.userData.sign) labels.push(object); });
  let language = 'ru';
  const translations = {
    'Проекты': 'Projects', 'Обо мне': 'About me', 'Навыки': 'Skills', 'Контакты': 'Contact',
    'Резюме': 'Resume', 'Enter — открыть': 'Enter — open', 'Обычная версия': 'Classic portfolio',
    'Полигон':'Test range','Полигон →':'Test range →','Портфолио':'Portfolio','← Портфолио':'← Portfolio',
    'Вся карта':'World map','Пуск / Стоп':'Start / Stop','Тест ровера':'Rover test',
    'Сонар':'Sonar',
    'Обсерватория':'Observatory','Игротека':'Playground','Остров энергии':'Energy island',
    'Наблюдать':'Observe','Подать энергию':'Power on / off','Бросок / Сброс':'Throw / Reset',
  };
  function setLanguage(next) {
    if (next === language) return;
    language = next; document.documentElement.lang = next;
    for (const label of labels) {
      const title = label.userData.title;
      let lines;
      if (title === 'Александр Македонский') lines = language === 'ru'
        ? ['АЛЕКСАНДР', 'МАКЕДОНСКИЙ', { text: 'Full-Stack · ML', size: 73, weight: 500 }]
        : ['ALEXANDER', 'MAKEDONSKIY', { text: 'Full-Stack · ML', size: 73, weight: 500 }];
      else lines = [language === 'en' ? translations[title] || title : title];
      const texture = textTexture(lines, { width:label.userData.textureWidth || 1024,height: lines.length > 1 ? 512 : 256, fontSize: title === 'Александр Македонский' ? 112 : 104 });
      label.userData.face.material.map.dispose(); label.userData.face.material.map = texture;
      label.userData.texture = texture;
    }
    for (const button of contact.buttons) {
      const mesh = button.children[0].children[0];
      if (!button.userData.ownsMaterial) { mesh.material = installArtDirection(mesh.material.clone()); button.userData.ownsMaterial = true; }
      mesh.material.color.set(button.userData.language === language ? '#ed7410' : '#3d424a');
    }
    syncLabState();syncPondState();syncMotionState();syncActivities();
    for(const button of document.querySelectorAll('[data-aim]'))button.textContent=language==='ru'?(button.dataset.aim==='left'?'Направить шар левее':'Направить шар правее'):(button.dataset.aim==='left'?'Aim the ball left':'Aim the ball right');
    for(const button of document.querySelectorAll('[data-region]')) {
      const titles=language==='ru'?{main:'Приблизить портфолио',lab:'Приблизить полигон',map:'Показать всю карту',observatory:'Приблизить обсерваторию',playground:'Приблизить игротеку',energy:'Приблизить остров энергии'}:{main:'Focus portfolio',lab:'Focus test range',map:'Show world map',observatory:'Focus observatory',playground:'Focus playground',energy:'Focus energy island'};
      button.textContent=titles[button.dataset.region];
    }
    render();
  }

  function selectRegion(region) {
    if(!Object.hasOwn(corners,region))return;
    ambience.hover(null);
    const from={position:camera.position.clone(),target:controls.target.clone(),zoom:camera.zoom};
    cameraRegion=region;camera.zoom=1;inFrame=true;resize(false);
    if(!reducedMotion) {
      const to={position:camera.position.clone(),target:controls.target.clone(),zoom:1};
      cameraTransition={from,to,elapsed:0};applyCameraTransition(0);scheduleAnimation();
    }
    controls.update();inFrame=false;render();
    if(location.hash!==`#${region}`)history.replaceState(null,'',`#${region}`);
  }
  function applyCameraTransition(t) {
    const {from,to}=cameraTransition,ease=t*t*(3-2*t);
    camera.position.lerpVectors(from.position,to.position,ease);controls.target.lerpVectors(from.target,to.target,ease);
    camera.zoom=THREE.MathUtils.lerp(from.zoom,to.zoom,ease);
    camera.updateProjectionMatrix();
  }
  addEventListener('hashchange',()=>selectRegion(location.hash.slice(1)));
  let animationFrame=null,lastFrame=0,inFrame=false,frameCount=0,frameSeconds=0;
  const hasAnimation=()=>ambience.active || laboratory.active || pond.active || cameraTransition || (!reducedMotion && Object.values(activities).some(activity=>activity.active));
  function syncLabState() {
    document.querySelector('#lab-toggle').setAttribute('aria-pressed',String(laboratory.active));
    document.querySelector('#lab-toggle').textContent=language==='ru'?'Запустить или остановить тест ровера':'Start or stop the rover test';
    const messages=language==='ru'
      ? {idle:'Полигон готов к тесту',running:'Ровер проходит испытательный маршрут',complete:'Тест завершён — можно запустить снова'}
      : {idle:'Test range ready',running:'Rover test in progress',complete:'Test complete — ready to run again'};
    const status=document.querySelector('#lab-status');
    if(status.textContent!==messages[laboratory.state])status.textContent=messages[laboratory.state];
  }
  function animate(now) {
    animationFrame=null;
    const elapsed=(now-lastFrame)/1000;
    if(elapsed>=1/30-0.001) {
      lastFrame=now;inFrame=true;
      const previousLab=laboratory.state,previousPond=pond.state;
      const dt=Math.min(elapsed,0.1);laboratory.update(dt);pond.update(dt);ambience.update(dt);
      for(const activity of Object.values(activities))activity.update(dt,reducedMotion);
      syncActivities();
      if(cameraTransition) {
        cameraTransition.elapsed+=dt;const progress=Math.min(cameraTransition.elapsed/1.15,1);
        applyCameraTransition(progress);if(progress===1)cameraTransition=null;
      }
      controls.update();
      renderer.shadowMap.needsUpdate=true;
      if(previousLab!==laboratory.state)syncLabState();if(previousPond!==pond.state)syncPondState();
      render();inFrame=false;
      frameCount++;frameSeconds+=elapsed;
      if(frameCount>=90) {
        const fps=frameCount/frameSeconds;canvas.dataset.fps=fps.toFixed(1);
        if(fps<23 && pixelRatio>1) {
          qualityLimit=Math.max(1,pixelRatio-0.25);
          const {width,height}=root.getBoundingClientRect();sizeRenderer(width,height);
        }
        frameCount=0;frameSeconds=0;
      }
    }
    if(hasAnimation() && !document.hidden && !contextLost)animationFrame=requestAnimationFrame(animate);
  }
  function scheduleAnimation() {
    if(hasAnimation() && !document.hidden && !contextLost && animationFrame===null){lastFrame=performance.now();animationFrame=requestAnimationFrame(animate);}
    else if((!hasAnimation() || document.hidden || contextLost) && animationFrame!==null){cancelAnimationFrame(animationFrame);animationFrame=null;}
  }
  function syncPondState() {
    const button=document.querySelector('#sonar-pulse');
    button.setAttribute('aria-pressed',String(pond.active));
    button.textContent=language==='ru'?'Послать сигнал с буя':'Send a sonar pulse';
    const messages=language==='ru'?{idle:'Буй готов к сигналу',pulsing:'Сонар посылает круги по воде',sent:'Сигнал отправлен — можно повторить'}
      :{idle:'Buoy ready',pulsing:'Sonar pulse spreading across the pond',sent:'Pulse sent — ready to repeat'};
    const status=document.querySelector('#water-status');
    if(status.textContent!==messages[pond.state])status.textContent=messages[pond.state];
  }
  function pulseWater() {
    if(cameraRegion!=='main')selectRegion('main');
    pond.pulse();syncPondState();render();scheduleAnimation();
  }
  function toggleDemo() {
    if(!laboratory.active)selectRegion('lab');
    laboratory.toggle();syncLabState();render();
    scheduleAnimation();
  }
  document.querySelector('#lab-toggle').addEventListener('click',toggleDemo);
  document.querySelector('#sonar-pulse').addEventListener('click',pulseWater);
  function syncActivities() {
    for(const [id,activity] of Object.entries(activities)) {
      const status=document.querySelector('#'+id+'-status'),message=activity.status(language==='en');
      if(status.textContent!==message)status.textContent=message;
      const button=document.querySelector('[data-activity="'+id+'"]'),title=language==='ru'?{observatory:'Начать или остановить наблюдение',energy:'Включить или выключить электростанцию',playground:'Бросить шар или сбросить кегли'}[id]:{observatory:'Start or stop observing',energy:'Toggle the power station',playground:'Throw the ball or reset pins'}[id];
      if(button.textContent!==title)button.textContent=title;
    }
  }
  function activateActivity(action) {
    if(action==='aim-left' || action==='aim-right') {
      if(cameraRegion!=='playground')selectRegion('playground');activities.playground.aim(action==='aim-left'?-1:1);
    } else if(activities[action]) {
      if(cameraRegion!==action)selectRegion(action);activities[action].activate(reducedMotion);
    }
    syncActivities();render();scheduleAnimation();
  }
  for(const button of document.querySelectorAll('[data-activity]'))button.addEventListener('click',()=>activateActivity(button.dataset.activity));
  for(const button of document.querySelectorAll('[data-aim]'))button.addEventListener('click',()=>activateActivity('aim-'+button.dataset.aim));
  for(const button of document.querySelectorAll('[data-region]'))button.addEventListener('click',()=>selectRegion(button.dataset.region));
  document.addEventListener('visibilitychange',scheduleAnimation);
  function syncMotionState() {
    const button=document.querySelector('#motion-toggle');button.setAttribute('aria-pressed',String(reducedMotion));
    button.textContent=language==='ru'?(reducedMotion?'Включить анимацию':'Уменьшить движение'):(reducedMotion?'Enable animation':'Reduce motion');
  }
  function setReducedMotion(value) {
    reducedMotion=value;controls.enableDamping=!reducedMotion;
    if(reducedMotion && cameraTransition){applyCameraTransition(1);cameraTransition=null;}
    ambience.setReducedMotion(reducedMotion);pond.setReducedMotion(reducedMotion);laboratory.setReducedMotion(reducedMotion);
    if(reducedMotion)for(const activity of Object.values(activities))activity.reduce();
    renderer.shadowMap.needsUpdate=true;syncLabState();syncPondState();syncMotionState();syncActivities();render();scheduleAnimation();
  }
  motionPreference.addEventListener('change',event=>setReducedMotion(event.matches));
  document.querySelector('#motion-toggle').addEventListener('click',()=>setReducedMotion(!reducedMotion));

  const raycaster = new THREE.Raycaster(), pointer = new THREE.Vector2();
  const hitFaces=labels.filter(label=>label.userData.href || label.userData.action).map(label=>label.userData.face);
  for (const button of contact.buttons) hitFaces.push(button.children[1]);
  hitFaces.push(...pond.hitTargets);
  let startPointer = null;
  const activePointers = new Set();
  function hitAt(event) {
    const rect = canvas.getBoundingClientRect();
    pointer.set((event.clientX - rect.left) / rect.width * 2 - 1, -(event.clientY - rect.top) / rect.height * 2 + 1);
    raycaster.setFromCamera(pointer, camera);
    const intersections = raycaster.intersectObjects(hitFaces, false);
    for (const hit of intersections) {
      let object = hit.object;
      while (object && object !== world) {
        if (object.userData.href || object.userData.action) return object;
        object = object.parent;
      }
    }
    return null;
  }
  canvas.addEventListener('pointerdown', event => {
    cameraTransition=null;
    activePointers.add(event.pointerId);
    startPointer = activePointers.size === 1 ? { id: event.pointerId, x: event.clientX, y: event.clientY } : null;
  });
  canvas.addEventListener('pointermove', event => {
    const hit=startPointer?null:hitAt(event);canvas.style.cursor=hit?'pointer':startPointer?'grabbing':'grab';
    ambience.hover(hit);if(reducedMotion){ambience.update(0);render();}scheduleAnimation();
  });
  canvas.addEventListener('pointerup', event => {
    const moved = !startPointer || startPointer.id !== event.pointerId || activePointers.size !== 1 || Math.hypot(startPointer.x - event.clientX, startPointer.y - event.clientY) > 5;
    activePointers.delete(event.pointerId);
    startPointer = null;
    if (moved || event.button !== 0) return;
    const hit = hitAt(event);
    if (hit?.userData.action === 'language') setLanguage(hit.userData.language);
    else if(hit?.userData.action==='demo')toggleDemo();
    else if(hit?.userData.action==='sonar')pulseWater();
    else if(hit?.userData.action?.startsWith('activity-'))activateActivity(hit.userData.action.slice(9));
    else if(hit?.userData.action?.startsWith('focus-'))selectRegion(hit.userData.action.slice(6));
    else if (hit?.userData.href) location.assign(new URL(hit.userData.href, location.href).href);
  });
  canvas.addEventListener('pointercancel', event => { activePointers.delete(event.pointerId); startPointer = null; });
  canvas.addEventListener('pointerleave', event => { activePointers.delete(event.pointerId); startPointer = null; canvas.style.cursor = 'grab';ambience.hover(null);if(reducedMotion){ambience.update(0);render();} });
  canvas.addEventListener('wheel',()=>{cameraTransition=null;},{passive:true});
  canvas.addEventListener('contextmenu', event => event.preventDefault());
  controls.addEventListener('change',()=>{if(!inFrame)render();});
  new ResizeObserver(resize).observe(root);
  resize();
  syncLabState();syncPondState();syncMotionState();syncActivities();
  renderer.shadowMap.autoUpdate = false;
  scheduleAnimation();
  document.documentElement.dataset.scene = 'ready';
  root.setAttribute('aria-busy', 'false');
  document.dispatchEvent(new CustomEvent('island-ready'));

  canvas.addEventListener('webglcontextlost', event => {
    event.preventDefault();contextLost=true;scheduleAnimation();document.querySelector('#fallback').hidden = false;
  });
  canvas.addEventListener('webglcontextrestored',()=>location.reload());
}

boot().catch(error => {
  console.error('Island could not start:', error);
  document.documentElement.dataset.scene = 'error';
  root.setAttribute('aria-busy', 'false');
  canvas.hidden = true; document.querySelector('#fallback').hidden = false;
});
