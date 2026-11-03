import { test } from 'node:test';
import assert from 'node:assert/strict';
import { insideIsland, seededRandom, STATIONS, DRIVE, drivingCircuit, LAB, BRIDGE, bridgePose, coursePose, insideLab, POND, insidePond, STREAM, insideStream } from '../js/config.js';
import { perspectiveDistance,balancedPerspectiveFrame } from '../js/art-direction.js';
import { meadowAllowed,createMeadows } from '../js/meadows.js';
import { TERRACES } from '../js/courtyard.js';
import { Parts, batchStaticParts } from '../js/geometry.js';
import { createIsland, createLandmass } from '../js/island.js';
import { createRover } from '../js/rover.js';
import { Matrix4,Box3,Group,Vector3,PerspectiveCamera } from '../vendor/three/three.module.js';

test('perspective overview keeps the nearest and furthest corners in frame at each aspect ratio', () => {
  const points=[];
  for(const x of [-40,40])for(const y of [-15,15])for(const z of [-20,20])points.push(new Vector3(x,y,z));
  for (const [width, height] of [[390, 844], [844, 390], [1280, 720], [1586, 992], [1920, 1080]]) {
    const camera=new PerspectiveCamera(32,width/height,0.1,1000);
    camera.position.z=perspectiveDistance(points,32,width/height,1.05);camera.updateMatrixWorld();
    for(const corner of points) {
      const projected=corner.clone().project(camera);
      assert.ok(Math.abs(projected.x)<1 && Math.abs(projected.y)<1,'perspective corner escaped the frame');
      assert.ok(projected.z>-1 && projected.z<1,'corner was depth-clipped');
    }
  }
});

test('planting excludes the full width of straight roads, corners and the lab circuit',()=>{
  const route=drivingCircuit(24);
  for(let i=0;i<route.length;i++) {
    const a=route[i],b=route[(i+1)%route.length];
    for(let j=0;j<=12;j++)for(let k=0;k<8;k++) {
      const x=a.x+(b.x-a.x)*j/12,z=a.z+(b.z-a.z)*j/12,angle=k*Math.PI/4;
      assert.equal(meadowAllowed(x+Math.cos(angle)*DRIVE.width/2,z+Math.sin(angle)*DRIVE.width/2,'main'),false);
    }
  }
  for(let i=0;i<360;i++)for(let j=0;j<8;j++) {
    const p=coursePose(i/360),a=j*Math.PI/4;
    assert.equal(meadowAllowed(p.x+Math.cos(a)*1.8,p.z+Math.sin(a)*1.8,'lab'),false);
  }
  assert.equal(meadowAllowed(4.5,2.1,'main'),true,'inner garden is still allowed');
  for(const [x,z] of [[-13,-1],[-13,5],[-14.4,10],[25,-2]])assert.equal(meadowAllowed(x,z,'main'),false);
});

test('the map is visually centred despite different near and far island depths',()=>{
  const points=[new Vector3(-40,25,-30),new Vector3(-25,-25,20),new Vector3(40,-20,30),new Vector3(20,35,-20)];
  for(const aspect of [390/844,1280/720]) {
    const frame=balancedPerspectiveFrame(points,32,aspect),camera=new PerspectiveCamera(32,aspect,0.1,1000);
    camera.position.set(frame.x,frame.y,frame.distance);camera.updateMatrixWorld();
    const projected=points.map(point=>point.clone().project(camera));
    for(const axis of ['x','y']) {
      const values=projected.map(point=>point[axis]),min=Math.min(...values),max=Math.max(...values);
      assert.ok(min>-1 && max<1);assert.ok(Math.abs(min+max)<0.04,'projected margins should be balanced');
    }
  }
});

test('generated meadow ground and plants stay on dry land',()=>{
  const matrix=new Matrix4();let count=0;
  for(const region of ['main','lab']) {
    const group=createMeadows(region),contains=region==='main'?insideIsland:insideLab;
    group.traverse(mesh=>{
      if(!mesh.isMesh)return;
      const points=[];
      if(mesh.isInstancedMesh)for(let i=0;i<mesh.count;i++) {mesh.getMatrixAt(i,matrix);points.push(new Vector3().setFromMatrixPosition(matrix));}
      else {
        const attribute=mesh.geometry.attributes.position;
        for(let i=0;i<attribute.count;i++)points.push(new Vector3().fromBufferAttribute(attribute,i));
      }
      for(const p of points) {
        assert.ok(contains(p.x,p.z,0.6));
        if(region==='main'){assert.equal(insidePond(p.x,p.z),false);assert.equal(insideStream(p.x,p.z),false);}
        count++;
      }
    });
  }
  assert.ok(count>1000,'the checks must cover actual generated garden geometry');
});

test('every station is placed within the walkable island footprint', () => {
  assert.equal(insideIsland(0, 0), true);
  assert.equal(insideIsland(28, 0), false);
  assert.equal(insideIsland(0, 20), false);
  for (const station of Object.values(STATIONS)) assert.equal(insideIsland(station.x, station.z, 0.7), true);
});

test('the main island has an asymmetric shoulder and cut-away shoreline',()=>{
  assert.equal(insideIsland(19,0),true);
  assert.equal(insideIsland(19,7),false);
  assert.equal(insideIsland(-19,0),true);
  assert.equal(insideIsland(-19,-9),false);
});

test('the bridge has rover clearance and its full deck joins both islands',()=>{
  assert.equal(insideIsland(25,-3),false);
  assert.equal(insideLab(25,-3),false);
  assert.ok(BRIDGE.width>=4.2);
  const dx=BRIDGE.to.x-BRIDGE.from.x,dz=BRIDGE.to.z-BRIDGE.from.z,length=Math.hypot(dx,dz);
  for(const [t,contains] of [[0,insideIsland],[1,insideLab]]) {
    const p=bridgePose(t);
    for(const side of [-1,0,1]) assert.ok(contains(p.x+dz/length*BRIDGE.width/2*side,p.z-dx/length*BRIDGE.width/2*side),`deck end ${t} is outside the shore`);
    assert.ok(Math.abs(p.y)<0.1);
  }
  assert.ok(bridgePose(0.5).y<bridgePose(0).y-0.7,'suspension deck should sag');
});

test('the demonstration loop stays on its island and actually crosses the ramp',()=>{
  let maximum=0;
  for(let i=0;i<=360;i++) {
    const p=coursePose(i/360);maximum=Math.max(maximum,p.y);
    assert.ok(insideLab(p.x,p.z,1.6),'rover body must fit around the whole circuit');
    assert.ok(p.y>=0 && Number.isFinite(p.heading) && Number.isFinite(p.pitch));
  }
  assert.equal(maximum,0.65);
  const start=coursePose(0),end=coursePose(1);
  assert.ok(Math.hypot(start.x-end.x,start.z-end.z)<1e-8);
  assert.ok(LAB.duration>10,'a complete test should be visible, not instantaneous');
});

test('the checkpoint frames also clear the full-size main rover and its antenna',()=>{
  const rover=createRover({groundShadow:false});rover.scale.setScalar(1.23);rover.rotation.y=0;
  const bounds=new Box3().setFromObject(rover);
  assert.ok(LAB.gateHeight-0.125>bounds.max.y+0.2,'the antenna needs headroom below the beam');
  assert.ok(LAB.gateWidth-0.3>bounds.max.x-bounds.min.x+0.4,'the full-size wheels need clearance between posts');
});

test('voxel batches preserve transforms while reducing repeated parts to one draw object', () => {
  const parts = new Parts('sample');
  parts.box('stone', 1, 2, 3, 0.5, 1, 2);
  parts.box('stone', -1, 1, -3, 1, 2, 0.5);
  parts.box('orange', 4, 0, 1, 1, 1, 1);
  const group = parts.finish();
  assert.equal(group.children.length, 2);
  assert.equal(group.children[0].count, 2);
  assert.equal(group.children[1].count, 1);
  group.children[0].computeBoundingBox();
  assert.ok(group.children[0].boundingBox.min.z < -3);
  assert.ok(group.children[0].boundingBox.max.z >= 4);
});

test('the scene generation uses repeatable local randomness', () => {
  const a = seededRandom(34), b = seededRandom(34), c = seededRandom(35);
  const sequence = Array.from({ length: 20 }, () => a());
  assert.deepEqual(sequence, Array.from({ length: 20 }, () => b()));
  assert.notDeepEqual(sequence, Array.from({ length: 20 }, () => c()));
  assert.ok(sequence.every(value => value >= 0 && value < 1));
});

test('the built ground has almost three times the previous usable area', () => {
  const terrain = createIsland();
  const paving = terrain.getObjectByName('paving');
  // Exclude small decorative chips: measure only the actual full-size slabs.
  let area=0;
  const matrix=new Matrix4();
  for(const mesh of paving.children) for(let i=0;i<mesh.count;i++) {
    mesh.getMatrixAt(i,matrix);
    const e=matrix.elements, width=Math.hypot(e[0],e[1],e[2]), depth=Math.hypot(e[8],e[9],e[10]);
    if(width>1 && depth>1) area+=(width+0.018)*(depth+0.018);
  }
  assert.ok(area >= 750, `expected at least 750 square units, got ${area}`);
  // The previous 0.92-unit grid contained 271.7 square units of ground.
  assert.ok(area / 271.7 > 2.7, 'enlargement must be real geometry, not camera zoom');
});

test('the second island adds substantial actual ground, beyond enlarging the first',()=>{
  const terrain=createLandmass(LAB.outline),matrix=new Matrix4();let area=0;
  for(const mesh of terrain.getObjectByName('paving').children)for(let i=0;i<mesh.count;i++) {
    mesh.getMatrixAt(i,matrix);const e=matrix.elements;
    if(e[0]>1 && e[10]>1)area+=(e[0]+0.018)*(e[10]+0.018);
  }
  assert.ok(area>350,`the test range needs room for its full course: ${area}`);
});

test('a rover-width circuit stays on the island and clears all equipment', () => {
  assert.ok(DRIVE.width >= 3.6);
  for(const point of drivingCircuit(64)) {
    // The full path width fits, including its outside corners.
    for(let i=0;i<12;i++) {
      const angle=i/12*Math.PI*2;
      assert.ok(insideIsland(point.x+Math.cos(angle)*DRIVE.width/2,point.z+Math.sin(angle)*DRIVE.width/2,0.8));
    }
    for(const [name,station] of Object.entries(STATIONS)) {
      const dx=Math.max(Math.abs(point.x-station.x)-station.footprint[0],0);
      const dz=Math.max(Math.abs(point.z-station.z)-station.footprint[1],0);
      assert.ok(Math.hypot(dx,dz)>DRIVE.width/2, `${name} blocks the circuit at ${point.x}, ${point.z}`);
    }
  }
});

test('the pond and its shore fit on the main island without blocking the driving circuit',()=>{
  for(const [x,z] of POND.outline)assert.ok(insideIsland(x,z,0.7));
  for(const p of drivingCircuit(64))for(let i=0;i<16;i++) {
    const a=i/16*Math.PI*2,r=DRIVE.width/2+0.55;
    assert.equal(insidePond(p.x+Math.cos(a)*r,p.z+Math.sin(a)*r),false);
  }
  assert.ok(POND.bottom<POND.level-0.6 && POND.level<0,'water needs an actual recessed basin');
});

test('paving and upper rock columns are cut out of the pond rather than hidden under water',()=>{
  const terrain=createIsland(),matrix=new Matrix4();
  for(const mesh of terrain.getObjectByName('paving').children)for(let i=0;i<mesh.count;i++) {
    mesh.getMatrixAt(i,matrix);const e=matrix.elements;
    for(const dx of [-0.49,0,0.49])for(const dz of [-0.49,0,0.49])assert.equal(insidePond(e[12]+dx*e[0],e[14]+dz*e[10]),false);
  }
  let recessed=0;
  for(const mesh of terrain.children.filter(mesh=>mesh.isInstancedMesh))for(let i=0;i<mesh.count;i++) {
    mesh.getMatrixAt(i,matrix);const e=matrix.elements;
    if(insidePond(e[12],e[14],0.1)) {assert.ok(e[13]+e[5]/2<=POND.bottom);recessed++;}
  }
  assert.ok(recessed>=12,'the basin must replace terrain cells');
});

test('district batching preserves nested transforms and keeps all vertices inside its culling bounds',()=>{
  const root=new Group();root.position.set(3,2,-7);root.rotation.y=0.6;
  for(let i=0;i<3;i++) {
    const parts=new Parts();parts.box('stone',1,0.5,-2,0.6,1.1,0.8);
    const prop=parts.finish();prop.position.set(i*2,0,i);prop.rotation.y=i*0.4;prop.scale.setScalar(1+i*0.1);root.add(prop);
  }
  root.updateMatrixWorld(true);
  const original=[],matrix=new Matrix4();
  root.traverse(mesh=>{if(mesh.isInstancedMesh){mesh.getMatrixAt(0,matrix);original.push(matrix.clone().premultiply(mesh.matrixWorld));}});
  assert.equal(batchStaticParts(root),2);
  root.updateMatrixWorld(true);const after=new Box3().setFromObject(root);
  const batch=root.children.find(mesh=>mesh.isInstancedMesh);
  assert.equal(batch.count,3);
  for(let i=0;i<3;i++) {
    batch.getMatrixAt(i,matrix);
    matrix.premultiply(batch.matrixWorld);
    for(const x of [-0.5,0.5])for(const y of [-0.5,0.5])for(const z of [-0.5,0.5]) {
      const expected=new Vector3(x,y,z).applyMatrix4(original[i]);
      assert.ok(new Vector3(x,y,z).applyMatrix4(matrix).distanceTo(expected)<1e-5);
      assert.ok(after.clone().expandByScalar(1e-5).containsPoint(expected));
    }
  }
});

test('the creek has an open recessed bed and leaves the full driving lane clear',()=>{
  const terrain=createIsland(),matrix=new Matrix4();let recessed=0;
  for(const mesh of terrain.getObjectByName('paving').children)for(let i=0;i<mesh.count;i++) {
    mesh.getMatrixAt(i,matrix);const e=matrix.elements;
    for(const dx of [-0.49,0,0.49])for(const dz of [-0.49,0,0.49])assert.equal(insideStream(e[12]+dx*e[0],e[14]+dz*e[10]),false,'paving blocks the creek');
  }
  for(const mesh of terrain.children.filter(mesh=>mesh.isInstancedMesh))for(let i=0;i<mesh.count;i++) {
    mesh.getMatrixAt(i,matrix);const e=matrix.elements;
    if(insideStream(e[12],e[14],0.1)) {assert.ok(e[13]+e[5]/2<=STREAM.bottom+0.001,'rock protrudes into the creek');recessed++;}
  }
  assert.ok(recessed>=6,'the creek needs an actual channel through the island');
  for(const p of drivingCircuit(64))for(let i=0;i<16;i++) {
    const a=i/16*Math.PI*2,r=DRIVE.width/2+0.6;
    assert.equal(insideStream(p.x+Math.cos(a)*r,p.z+Math.sin(a)*r),false,'creek bank blocks the circuit');
  }
});

test('raised workstation terraces and their steps do not intrude on the rover circuit',()=>{
  for(const t of TERRACES) {
    const station=STATIONS[t.station];
    for(const p of drivingCircuit(64)) {
      const dx=Math.max(Math.abs(p.x-station.x)-t.width/2,0);
      const dz=Math.max(Math.abs(p.z-station.z-t.centerZ)-t.depth/2,0);
      assert.ok(Math.hypot(dx,dz)>DRIVE.width/2,'terrace blocks the lane');
      const sx=Math.max(Math.abs(p.x-station.x)-1.35,0);
      const sz=Math.max(Math.abs(p.z-station.z-t.centerZ-t.depth/2-0.36)-0.34,0);
      assert.ok(Math.hypot(sx,sz)>DRIVE.width/2,'steps block the lane');
    }
  }
});

test('batching preserves interactive signs and moving assemblies as addressable objects',()=>{
  const root=new Group(),retained=[];
  for(const data of [{sign:true},{noBatch:true},{action:'language'},{},{}]) {
    const parts=new Parts();parts.box('orange',0,0,0,1,1,1);
    const prop=parts.finish();prop.userData=data;root.add(prop);
    if(Object.keys(data).length)retained.push([prop,prop.children[0]]);
  }
  assert.equal(batchStaticParts(root),1);
  for(const [prop,mesh] of retained)assert.equal(mesh.parent,prop);
});
