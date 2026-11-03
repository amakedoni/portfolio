import * as THREE from '../vendor/three/three.module.js';
import { Parts, contactShadow, material, addLanternGlow } from './geometry.js';
import { seededRandom, ISLAND, DRIVE, POND, STREAM, insideStream, polygonBounds, insidePolygon } from './config.js';
import { sign, textTexture } from './textures.js';
import { APPROACHES,distanceToPath } from './archipelago-config.js';

export const mainPortal=(x,z)=>(x>10 && Math.abs(z+1.2)<3.2) || (Math.abs(x)<3.2 && z>9) || insideStream(x,z) || (Math.abs(x+14.4)<1 && z>9.4) || distanceToPath(x,z,APPROACHES.main)<2.5;

export function createLandmass(outline,{seed=1723,name='island-terrain',portal=()=>false,depressions=[]}={}) {
  const random = seededRandom(seed), bounds=polygonBounds(outline);
  const contains=(x,z,margin=0)=>insidePolygon(x,z,outline,margin);
  const center=new THREE.Vector2((bounds.minX+bounds.maxX)/2,(bounds.minZ+bounds.maxZ)/2);
  const parts = new Parts(name);
  const floor = new Parts('paving');
  const stones = ['stone', 'stoneLight', 'stoneShade', 'stoneDeep'];
  const tiles = ['paving', 'paving', 'paving', 'pavingLight', 'pavingWarm'];
  const step = ISLAND.tile;
  const cells=new Set();
  const xStart=Math.floor(bounds.minX/step),xEnd=Math.ceil(bounds.maxX/step);
  const zStart=Math.floor(bounds.minZ/step),zEnd=Math.ceil(bounds.maxZ/step);
  const key=(ix,iz)=>`${ix},${iz}`;
  for(let ix=xStart;ix<=xEnd;ix++)for(let iz=zStart;iz<=zEnd;iz++)if(contains(ix*step,iz*step))cells.add(key(ix,iz));
  const depressionAt=(ix,iz)=>depressions.find(basin=>insidePolygon(ix*step,iz*step,basin.outline));
  const dryCells=new Set([...cells].filter(cell=>!depressionAt(...cell.split(',').map(Number))));

  for(let ix=xStart;ix<=xEnd;ix++)for(let iz=zStart;iz<=zEnd;iz++) {
    const x = ix * step, z = iz * step;
    if(!cells.has(key(ix,iz)))continue;
    // Compare grid cells, not re-rounded world coordinates: 10.8 + 1.2 may
    // otherwise classify an absent border tile as present and flatten the cliff.
    const edge=!cells.has(key(ix-1,iz)) || !cells.has(key(ix+1,iz)) || !cells.has(key(ix,iz-1)) || !cells.has(key(ix,iz+1));
    const distance=Math.hypot((x-center.x)/(bounds.maxX-bounds.minX)*2,(z-center.y)/(bounds.maxZ-bounds.minZ)*2);
    const height = edge ? 3.15 + random() * 1.25 : 3.8+Math.max(0,1-distance)*1.5;
    const surface=depressionAt(ix,iz)?.bottom || 0,columnHeight=height+surface;
    parts.box(stones[Math.floor(random()*3)],x,surface-columnHeight/2-0.18,z,step+0.025,columnHeight,step+0.025);
    if (edge) {
      // Smaller broken layers give the cliff depth instead of long flat columns.
      for (let layer = 0; layer < 5; layer++) {
        const outward = new THREE.Vector2(x,z).sub(center).normalize().multiplyScalar(0.12 + random() * 0.25);
        const y = Math.min(-0.5,surface-0.6) - layer * 0.68;
        parts.box(stones[Math.floor(random() * 4)], x + outward.x, y, z + outward.y, 0.9 + random() * 0.5, 0.57 + random() * 0.25, 0.9 + random() * 0.45, [0, (random() - 0.5) * 0.16, 0]);
        if (random() > 0.6) parts.add('stoneLight', [x + outward.x * 2, y, z + outward.y * 2], [0.8, 0.65, 0.75], [0, random(), 0], 'icosahedron');
      }
    }
    // Running-bond 2:1 slabs give the courtyard the calm, broad pattern of the
    // concept. The edge keeps single blocks where a full slab would overhang.
    const pairStart = (ix+iz)%2 === 0;
    const mergedByPrevious=!pairStart && dryCells.has(key(ix-1,iz));
    if(dryCells.has(key(ix,iz)) && !mergedByPrevious) {
      const slabWidth=pairStart && dryCells.has(key(ix+1,iz)) ? step*2 : step;
      const centerX = x+(slabWidth-step)/2;
      const patch=Math.sin(x*0.21+z*0.13)+Math.cos(z*0.27-x*0.09);
      const tone=patch>0.85?'pavingLight':patch<-0.9?'pavingWarm':tiles[Math.floor(random()*3)];
      floor.add(tone,[centerX,-0.13,z],[slabWidth-0.018,0.26,step-0.018],[0,0,0],'slab');
      if (random() < 0.3) floor.box(random()>0.5?'pavingFleck':'pavingLight',centerX+(random()-0.5)*slabWidth*0.7,0.003,z+(random()-0.5)*0.8,0.12+random()*0.14,0.006,0.12);
    }
    if (edge && !portal(x,z) && random() > 0.4) {
      parts.box('stoneLight', x, 0.22, z, 0.95, 0.44, 0.93);
      if (random() > 0.45) parts.box('stone', x - 0.15, 0.61, z, 0.65, 0.34, 0.66);
    }
  }

  const terrain = parts.finish();
  const paving = floor.finish();
  terrain.add(paving);
  return terrain;
}

export function createIsland() {
  const terrain=createLandmass(ISLAND.outline,{portal:mainPortal,depressions:[POND,STREAM]});

  const entrance = new Parts('entrance');
  for (let i = 0; i < 5; i++) {
    const y = -0.17 - i * 0.24, z = ISLAND.entranceZ + i * 0.5;
    entrance.box(i % 2 ? 'stoneLight' : 'paving', 0, y - 0.13, z, 4.8, 0.29, 0.54);
    for (const x of [-2.6, 2.6]) entrance.box('stoneLight', x, y - 0.26, z, 0.43, 0.9, 0.54);
  }
  for (let x = -2; x <= 2; x += 1) for (let z = 14.2; z < 16; z += 1) entrance.box('paving', x, -1.41, z, 0.99, 0.34, 0.99);
  terrain.add(entrance.finish());

  const marks = new Parts('path-inlays');
  function roundedPath(path,offset) {
    const l=DRIVE.left-offset, r=DRIVE.right+offset, b=DRIVE.back-offset, f=DRIVE.front+offset, c=DRIVE.corner+offset;
    path.moveTo(l+c,b); path.lineTo(r-c,b); path.quadraticCurveTo(r,b,r,b+c);
    path.lineTo(r,f-c); path.quadraticCurveTo(r,f,r-c,f); path.lineTo(l+c,f);
    path.quadraticCurveTo(l,f,l,f-c); path.lineTo(l,b+c); path.quadraticCurveTo(l,b,l+c,b);
  }
  // Continuous sandstone inlay: no gaps where straight paths meet the corners.
  const outline = new THREE.Shape(); roundedPath(outline,DRIVE.width/2+0.07);
  const hole = new THREE.Path(); roundedPath(hole,DRIVE.width/2-0.07); outline.holes.push(hole);
  const kerb = new THREE.Mesh(new THREE.ShapeGeometry(outline,16),material('#c5a474',{side:THREE.DoubleSide}));
  kerb.rotation.x=Math.PI/2; kerb.position.y=0.016; terrain.add(kerb);
  for(const x of [12.2,14.2,16.2])for(const side of [-1,1])marks.box('orangeLight',x,0.014,-1.2+side*0.26,0.12,0.015,0.75,[0,side*Math.PI/4,0]);
  terrain.add(marks.finish());
  return terrain;
}

function leafCluster(parts, x, y, z, radius, random, crown=false) {
  const size = crown?0.23:0.19;
  const n = Math.ceil(radius / size);
  parts.add('leaf',[x,y,z],[radius*1.55,radius*(crown?0.92:1.35),radius*1.4],[0,random()*Math.PI,0],'icosahedron');
  for (let ix = -n; ix <= n; ix++) for (let iy = -n; iy <= n; iy++) for (let iz = -n; iz <= n; iz++) {
    const r=crown
      ? (ix*size/radius)**2+(iy*size/(radius*0.72))**2+(iz*size/(radius*0.88))**2
      : ((ix*size)**2+(iy*size*1.1)**2+(iz*size)**2)/radius**2;
    const inner=Math.max(0,1-size*1.4/radius)**2;
    if(r>1 || r<inner)continue;
    if (random() < 0.035) continue;
    const patch=Math.sin(Math.floor(ix/2)*2.7+Math.floor(iy/2)*1.4+Math.floor(iz/2)*3.1)*0.13;
    const sun = iy/n*0.48-ix/n*0.16+iz/n*0.12+patch+0.22+random()*0.08;
    const color = sun > 0.59 ? 'leafSun' : sun > 0.27 ? 'leafLight' : sun > -0.08 ? 'leaf' : 'leafDark';
    const leafSize=size*(1.3+random()*0.65);
    parts.add(color,[x+ix*size+(random()-0.5)*size*0.5,y+iy*size+(random()-0.5)*size*0.5,z+iz*size+(random()-0.5)*size*0.5],
      [leafSize,leafSize*0.36,leafSize*0.78],[(random()-0.5)*1.5,random()*Math.PI,(random()-0.5)*1.6],'icosahedron');
  }
}

export function createTree(x, z, scale = 1, seed = 71) {
  const random = seededRandom(seed), parts = new Parts('voxel-tree');
  parts.box('wood', 0, 1.65, 0, 0.63, 3.3, 0.65);
  parts.box('woodLight', -0.29, 1.55, 0.03, 0.1, 3, 0.6);
  parts.box('woodDark', 0.25, 1.1, -0.3, 0.15, 2.2, 0.08);
  for (const direction of [-1, 1]) {
    parts.box('wood', direction * 0.8, 2.65, 0, 0.48, 2.4, 0.48, [0, 0, -direction * 0.63]);
    parts.box('woodDark', direction * 0.3, 0.22, 0.2, 1.1, 0.38, 0.67);
  }
  parts.box('woodLight',0.08,2.75,-0.55,0.35,2.1,0.36,[-0.58,0.25,0]);
  for(let i=0;i<7;i++) {
    parts.box(i%2?'woodDark':'woodLight',-0.315,0.35+i*0.39,(i%3-1)*0.16,0.025,0.23+random()*0.18,0.08);
  }
  const lobes = [[-1.5,3.55,0.2,1.32],[1.35,3.45,0.55,1.3],[0.25,4.55,-0.65,1.42],[-0.9,4.6,0.35,1.22],[-1.8,4.0,-0.7,1.03],[1.65,4.2,-0.45,1.12]];
  for (const [lx, ly, lz, radius] of lobes) leafCluster(parts, lx, ly, lz, radius, random,true);
  const tree = parts.finish(); tree.position.set(x, 0.05, z); tree.scale.setScalar(scale);
  contactShadow(tree, 0, 0, 5.2, 4.0, 0.22); return tree;
}

export function createPlants({outline=ISLAND.outline,seed=818,portal=mainPortal,patches=[[-13,-8.7],[-7.8,-8.8],[-4.7,-7.5],[3.6,-8.2],[7,-9],[-18,0.6],[-17,6],[-12,8.3],[11.5,8.5],[15.4,-4.8],[14.8,-4]]}={}) {
  const random=seededRandom(seed), parts=new Parts('island-garden'), bounds=polygonBounds(outline);
  const contains=(x,z,margin=0)=>insidePolygon(x,z,outline,margin);
  const colors = ['grass', 'leaf', 'leafLight', 'leafSun', 'moss'];
  function tuft(x, z, size = 1) {
    parts.box('moss',x,0.025,z,0.68*size,0.05,0.55*size);
    for (let n = 0; n < 7; n++) {
      const h = (0.2 + random() * 0.44) * size;
      const lx = x+(random()-0.5)*0.7*size, lz = z+(random()-0.5)*0.6*size;
      parts.add(colors[Math.floor(random()*colors.length)],[lx,h/2,lz],[0.25*size,h,0.22*size],[(random()-0.5)*0.35,random()*Math.PI,(random()-0.5)*0.4],'cone3');
    }
  }
  const attempts=(bounds.maxX-bounds.minX)*(bounds.maxZ-bounds.minZ)*1.8;
  for (let i=0;i<attempts;i++) {
    const x=bounds.minX+random()*(bounds.maxX-bounds.minX),z=bounds.minZ+random()*(bounds.maxZ-bounds.minZ);
    if (!contains(x,z,0.2) || contains(x,z,1.8) || portal(x,z) || random()<0.2) continue;
    tuft(x,z,0.85+random()*0.8);
    if (random()>0.9) leafCluster(parts,x,0.65,z,0.55+random()*0.35,random);
  }
  // Hanging vines follow the actual cliff, with visible stems, paired leaves
  // and unequal lengths. Their roots sit outside the stone face, not inside it.
  for(let edge=0;edge<outline.length;edge++) {
    const [ax,az]=outline[edge],[bx,bz]=outline[(edge+1)%outline.length];
    const length=Math.hypot(bx-ax,bz-az),nx=(bz-az)/length,nz=-(bx-ax)/length;
    for(let offset=1;offset<length;offset+=1.9+random()*1.8) {
      const t=offset/length,x=ax+(bx-ax)*t,z=az+(bz-az)*t;
      if(portal(x,z) || random()<0.3) continue;
      const drop=2.4+random()*3.8, bend=random()*6;
      for(let y=0;y<drop;y+=0.2) {
        const sway=Math.sin(y*1.8+bend)*0.14;
        const lx=x+nx*(0.6+sway),lz=z+nz*(0.6+sway);
        parts.box('leafDark',lx,-0.25-y,lz,0.075,0.26,0.075);
        if(random()<0.12) continue;
        const side=Math.floor(y*5)%2?1:-1;
        const leaf=colors[Math.floor(random()*3)];
        parts.box(leaf,lx+nz*0.15*side,-0.25-y,lz-nx*0.15*side,0.3,0.12,0.24,[0,bend+side*0.4,side*0.25]);
        if(random()>0.7) parts.box('leafLight',lx,-0.35-y,lz,0.18,0.16,0.2);
      }
    }
  }
  for (const [x, z] of patches) {
    if(portal(x,z))continue;
    for (let i=0;i<16;i++) {
      const px=x+(random()-0.5)*2.3,pz=z+(random()-0.5)*1.6;
      if(!portal(px,pz))tuft(px,pz);
    }
    leafCluster(parts,x,0.7,z,0.8,random);
    parts.box('stoneLight',x-0.8,0.29,z+0.3,0.9,0.58,0.8);
    parts.box('stone',x-1.1,0.57,z+0.26,0.6,0.56,0.65);
  }
  return parts.finish();
}

export function createLookout() {
  const parts=new Parts('garden-lookout'),group=parts.group;
  // A sheltered corner on the new western terrace, away from the driving loop.
  for(let i=0;i<7;i++) parts.box(i%2?'woodLight':'wood',-17.4,0.05,1.5+i*0.4,3.9,0.1,0.38);
  for(const x of [-19,-15.8]) for(const z of [1.6,3.8]) parts.box('woodDark',x,1.8,z,0.2,3.6,0.2);
  for(let i=0;i<8;i++) parts.box('wood',-17.4,3.65,1.3+i*0.39,4.2,0.16,0.16);
  for(const z of [1.5,3.7]) parts.box('woodLight',-17.4,3.48,z,4.4,0.2,0.18);
  parts.box('woodLight',-17.6,0.67,2.9,2.6,0.18,0.7);
  parts.box('wood',-17.6,1.1,3.22,2.6,0.66,0.12);
  for(const x of [-18.5,-16.7]) parts.box('graphite',x,0.32,2.9,0.16,0.65,0.65);
  const random=seededRandom(883);
  for(const [x,z] of [[-18.6,1.7],[-16.4,3.6],[-18.8,3.8]]) leafCluster(parts,x,3.55,z,0.72,random);
  for(let i=0;i<12;i++) {
    const y=3.6-i*0.17;
    parts.box(i%3?'leaf':'leafLight',-18.9+Math.sin(i)*0.1,y,3.9,0.25,0.22,0.18);
  }
  return parts.finish();
}

export function createCrate(x, z, scale = 1) {
  const parts = new Parts('equipment-crate');
  parts.add('orange',[0,0.54,0],[1.05,1.05,0.86],[0,0,0],'roundBox');
  parts.add('orangeLight',[0,1.08,0],[1.09,0.15,0.9],[0,0,0],'roundBox');
  for (const side of [-1, 1]) {
    parts.box('graphite', side * 0.31, 0.54, 0.44, 0.13, 1.08, 0.06);
    parts.box('graphite', side * 0.31, 0.54, -0.44, 0.13, 1.08, 0.06);
    parts.box('graphite', side * 0.31, 1.14, 0, 0.13, 0.04, 0.88);
  }
  parts.box('dark', 0, 0.79, 0.48, 0.21, 0.12, 0.07);
  for(const side of [-1,1])parts.add('metal',[side*0.53,0.78,0],[0.05,0.14,0.33],[0,0,0],'roundBox');
  const crate = parts.finish(); crate.position.set(x, 0, z); crate.scale.setScalar(scale); return crate;
}

export function createLamp(x, z) {
  const parts = new Parts('path-lantern');
  parts.box('woodDark', 0, 0.55, 0, 0.16, 1.1, 0.18);
  parts.box('stone', 0, 0.12, 0, 0.38, 0.24, 0.38);
  parts.box('orange', 0, 1.2, 0, 0.34, 0.67, 0.34);
  parts.box('wood', 0, 1.56, 0, 0.4, 0.12, 0.4);
  const lamp = parts.finish(); lamp.position.set(x, 0.03, z);
  const glass = new THREE.Mesh(new THREE.BoxGeometry(0.23, 0.5, 0.35), new THREE.MeshBasicMaterial({ color: new THREE.Color('#ffcf80').multiplyScalar(3.2),toneMapped:false })); glass.position.y = 1.2; lamp.add(glass);
  const sideGlass = glass.clone(); sideGlass.scale.set(1.55, 1, 0.66); lamp.add(sideGlass);
  addLanternGlow(lamp);
  return lamp;
}

export function createRailings() {
  const parts = new Parts('safety-railings');
  const sections = [[-16.7,-1,-15.9,5.6],[14.5,8.3,9.8,10.5],[-15.2,-6.7,-12.5,-9.2],[12.4,-9.1,16,-5.6]];
  for (const [x1, z1, x2, z2] of sections) {
    const length = Math.hypot(x2 - x1, z2 - z1), angle = Math.atan2(x2 - x1, z2 - z1);
    for (let i = 0; i <= 4; i++) {
      const t = i / 4; parts.box('graphite', x1 + (x2 - x1) * t, 0.63, z1 + (z2 - z1) * t, 0.13, 1.26, 0.13);
    }
    parts.box('metal', (x1 + x2) / 2, 1.17, (z1 + z2) / 2, 0.13, 0.13, length, [0, angle, 0]);
  }
  return parts.finish();
}

export function createEntranceSigns() {
  const group = new THREE.Group(); group.name = 'entrance-signs';
  const name = sign(group, 'Александр Македонский', 5.9, 2.2, [-7.1, 1.0, 12.15], {
    href: '../index.html#about', name: 'identity-sign', fontSize: 112,
    lines: ['АЛЕКСАНДР', 'МАКЕДОНСКИЙ', { text: 'Full-Stack · ML', size: 73, weight: 400 }],
  });
  name.rotation.y = 0.08;
  const instructions = sign(group, 'Enter — открыть', 3.0, 0.7, [4.5, 1.72, 12.0], { fontSize: 88 }); instructions.rotation.y = 0.12;
  const ordinary = sign(group, 'Обычная версия', 3.1, 0.7, [10.2, 1.52, 11.05], { href: '../index.html', fontSize: 88, name: 'ordinary-version' }); ordinary.rotation.y = 0.18;
  const posts = new Parts('entrance-sign-posts');
  for (const [x,z,height] of [[-9.5,11.9,2.4],[-4.7,11.9,2.4],[3.3,11.45,1.6],[5.7,11.45,1.6],[8.9,10.8,1.6],[11.5,10.8,1.6]]) posts.box('wood',x,height/2-0.3,z,0.17,height,0.2);
  group.add(posts.finish());
  const tutorial = new THREE.Mesh(new THREE.PlaneGeometry(3.4, 1.7), new THREE.MeshBasicMaterial({ map: textTexture(['    W    ', ' A  S  D '], { width: 1024, height: 512, fontSize: 155, background: null, color: '#8b725b', gap: 1.1 }), transparent: true, depthWrite: false }));
  tutorial.rotation.x = -Math.PI / 2; tutorial.position.set(0, -1.225, 14.9); group.add(tutorial);
  return group;
}

