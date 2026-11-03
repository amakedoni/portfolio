import { test } from 'node:test';
import assert from 'node:assert/strict';
import { ROUTES,DISTRICTS,APPROACHES,distanceToPath } from '../js/archipelago-config.js';
import { insidePolygon } from '../js/config.js';
import { createBowlingState } from '../js/activity-state.js';
import { createIsland,createLandmass } from '../js/island.js';
import { Matrix4 } from '../vendor/three/three.module.js';

test('every bridge joins real ground across its entire rover-width deck',()=>{
  for(const route of ROUTES) {
    assert.ok(route.width>=4.2);
    const dx=route.to.x-route.from.x,dz=route.to.z-route.from.z,length=Math.hypot(dx,dz);
    for(const [i,point] of [[0,route.from],[1,route.to]])for(const side of [-1,-0.5,0,0.5,1]) {
      const x=point.x+dz/length*route.width/2*side,z=point.z-dx/length*route.width/2*side;
      assert.ok(insidePolygon(x,z,DISTRICTS[route.regions[i]].outline),route.id+' has a disconnected landing');
    }
  }
});

test('the archipelago is connected and has alternate return routes',()=>{
  const seen=new Set(['main']),queue=['main'];
  while(queue.length) {
    const id=queue.shift();
    for(const r of ROUTES)if(r.regions.includes(id))for(const other of r.regions)if(!seen.has(other)){seen.add(other);queue.push(other);}
  }
  assert.equal(seen.size,Object.keys(DISTRICTS).length);
  assert.equal(seen.size,5);
  assert.ok(ROUTES.length>=seen.size,'there should be a cycle, not just one dead-end chain');
});

test('the added ground is substantial while the home island grows modestly',()=>{
  const matrix=new Matrix4();
  function area(terrain) {
    let sum=0;
    for(const mesh of terrain.getObjectByName('paving').children)for(let i=0;i<mesh.count;i++) {
      mesh.getMatrixAt(i,matrix);const e=matrix.elements;
      if(e[0]>1 && e[10]>1)sum+=(e[0]+0.018)*(e[10]+0.018);
    }
    return sum;
  }
  const main=area(createIsland());assert.ok(main>881*1.04 && main<881*1.2);
  const areas=Object.fromEntries(Object.entries(DISTRICTS).map(([id,spec])=>[id,id==='main'?main:area(createLandmass(spec.outline))]));
  assert.ok(Object.values(areas).reduce((sum,value)=>sum+value,0)>1259*1.6);
  assert.ok(areas.energy<areas.playground && areas.playground<areas.main);
});

test('reserved approaches keep a full rover corridor on land or the joined bridge',()=>{
  function onBridge(x,z) {
    return ROUTES.some(r=>{
      const dx=r.to.x-r.from.x,dz=r.to.z-r.from.z,length=Math.hypot(dx,dz);
      const along=((x-r.from.x)*dx+(z-r.from.z)*dz)/length,across=((x-r.from.x)*dz-(z-r.from.z)*dx)/length;
      return along>=0 && along<=length && Math.abs(across)<=r.width/2;
    });
  }
  for(const [region,points] of Object.entries(APPROACHES))for(let i=1;i<points.length;i++) {
    const a=points[i-1],b=points[i];
    for(let j=0;j<=20;j++)for(let k=0;k<12;k++) {
      const x=a[0]+(b[0]-a[0])*j/20,z=a[1]+(b[1]-a[1])*j/20,angle=k*Math.PI/6;
      const px=x+Math.cos(angle)*1.6,pz=z+Math.sin(angle)*1.6;
      assert.ok(insidePolygon(px,pz,DISTRICTS[region].outline) || onBridge(px,pz),region+' approach leaves the traversable ground');
    }
  }
  assert.ok(distanceToPath(-6,-12,APPROACHES.main)<0.2);
});

test('bowling scores actual impacts, supports aiming and resets all pins',()=>{
  const center=createBowlingState();center.activate();
  assert.equal(center.state,'rolling');center.update(0.4);assert.equal(center.score,0);
  for(let i=0;i<130;i++){center.update(1/30);assert.ok(center.ball.z>=-3.95 && center.ball.z<=3.5,'ball must stay inside its backstop');}
  assert.equal(center.state,'complete');assert.equal(center.score,6);
  center.activate();assert.equal(center.state,'ready');assert.equal(center.score,0);
  assert.ok(center.pins.every(pin=>pin.fall===0 && pin.x===pin.startX && pin.z===pin.startZ));
  center.aimBy(1);center.aimBy(1);center.activate(true);
  assert.equal(center.state,'complete');assert.ok(center.score>0 && center.score<6,'edge aim should change the result');
  for(const pin of center.pins){
    const reach=Math.sin(pin.fall*Math.PI/2)*1.2;
    const tipX=pin.x+Math.sin(pin.angle)*reach,tipZ=pin.z+Math.cos(pin.angle)*reach;
    assert.ok(Math.abs(pin.x)<=1.8 && Math.abs(tipX)<=1.8+1e-9,'fallen pins stay within the side rails');
    assert.ok(Math.abs(pin.z)<=4 && Math.abs(tipZ)<=4+1e-9,'fallen pins stay within the end stops');
  }
});

test('bowling result is independent of rendering frame rate and motion preference',()=>{
  const results=[];
  for(const fps of [20,30,60,120]) {
    const game=createBowlingState();game.activate();
    for(let i=0;i<fps*5;i++)game.update(1/fps);
    results.push(game.pins.map(pin=>[pin.hit,pin.x,pin.z,pin.fall]));
  }
  const reduced=createBowlingState();reduced.activate(true);
  results.push(reduced.pins.map(pin=>[pin.hit,pin.x,pin.z,pin.fall]));
  for(const result of results)assert.deepEqual(result,results[0]);
});
