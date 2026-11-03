import * as THREE from '../vendor/three/three.module.js';
import { PALETTE } from './config.js';
import { surfaceMaps, installWind, foliageDepth } from './surfaces.js';
import { installArtDirection } from './art-direction.js';

const cube = new THREE.BoxGeometry(1, 1, 1);
const geometries = new Map([['box', cube]]);
const materials = new Map();
const transform = new THREE.Object3D();

export function material(color, options = {}) {
  const actual = PALETTE[color] || color;
  const key = actual + JSON.stringify(options);
  if (!materials.has(key)) {
    const foliage = /^(leaf|grass|moss)/.test(color);
    const metal = /^(metal|graphite|orange|yellow)/.test(color);
    const surface=/^wood/.test(color)?'wood':/^stone/.test(color)?'stone':/^paving/.test(color)?'paving':null;
    const painted=/^(orange|yellow|blueLight|cyan)/.test(color);
    const Material=painted?THREE.MeshPhysicalMaterial:THREE.MeshStandardMaterial;
    const result = new Material({
      color: actual, roughness: foliage ? 0.72 : metal ? 0.46 : 0.9,
      metalness: /^metal/.test(color) ? 0.3 : 0,
      ...(painted?{clearcoat:0.28,clearcoatRoughness:0.34}:{}),
      ...(surface ? surfaceMaps(surface) : {}),
      ...(foliage ? { emissive: actual, emissiveIntensity: 0.025 } : {}), ...options,
    });
    if(foliage)installWind(result);
    installArtDirection(result,{foliage});
    materials.set(key,result);
  }
  return materials.get(key);
}

export function geometry(type) {
  if (geometries.has(type)) return geometries.get(type);
  if(type.endsWith('-foliage')) {
    const result=geometry(type.replace('-foliage','')).clone();
    result.setAttribute('foliageWeight',new THREE.Float32BufferAttribute(new Float32Array(result.attributes.position.count).fill(1),1));
    geometries.set(type,result);return result;
  }
  if(type==='slab' || type==='bevelBox' || type==='roundBox') {
    const bevel=type==='slab'?0.02:type==='roundBox'?0.13:0.045,half=0.5-bevel;
    const shape=new THREE.Shape();shape.moveTo(-half,-half);shape.lineTo(half,-half);shape.lineTo(half,half);shape.lineTo(-half,half);shape.closePath();
    const result=new THREE.ExtrudeGeometry(shape,{depth:half*2,bevelEnabled:true,bevelSegments:type==='roundBox'?3:1,steps:1,bevelSize:bevel,bevelThickness:bevel});
    result.translate(0,0,-half);result.rotateX(-Math.PI/2);
    geometries.set(type,result);return result;
  }
  const count = Number(type.match(/\d+/)?.[0] || 8);
  const result = type.startsWith('cylinder') ? new THREE.CylinderGeometry(0.5, 0.5, 1, count)
    : type.startsWith('cone') ? new THREE.ConeGeometry(0.5, 1, count)
    : new THREE.IcosahedronGeometry(0.5, 0);
  geometries.set(type, result);
  return result;
}

/** Repeated voxel parts are actual instanced geometry, not thousands of draw calls. */
export class Parts {
  constructor(name = '') { this.group = new THREE.Group(); this.group.name = name; this.batches = new Map(); }
  add(color, position, size, rotation = [0, 0, 0], type = 'box') {
    if(type==='box' && !/^(leaf|grass|moss)/.test(color) && Math.min(...size)>=0.16)type='bevelBox';
    const key = `${color}:${type}`;
    if (!this.batches.has(key)) this.batches.set(key, { color, type, transforms: [] });
    this.batches.get(key).transforms.push({ position, size, rotation });
    return this;
  }
  box(color, x, y, z, w, h, d, rotation) { return this.add(color, [x, y, z], [w, h, d], rotation); }
  finish() {
    for (const batch of this.batches.values()) {
      const foliage=/^(leaf|grass|moss)/.test(batch.color);
      const mesh = new THREE.InstancedMesh(geometry(batch.type+(foliage?'-foliage':'')), material(batch.color), batch.transforms.length);
      if(foliage)mesh.customDepthMaterial=foliageDepth;
      for (let i = 0; i < batch.transforms.length; i++) {
        const item = batch.transforms[i];
        transform.position.set(...item.position); transform.scale.set(...item.size); transform.rotation.set(...item.rotation);
        transform.updateMatrix(); mesh.setMatrixAt(i, transform.matrix);
      }
      mesh.castShadow = true; mesh.receiveShadow = true; mesh.computeBoundingSphere();
      if(foliage)mesh.boundingSphere.radius+=0.2;
      this.group.add(mesh);
    }
    this.batches.clear();
    return this.group;
  }
}

/** Consolidate static props per district while preserving interactive/moving groups. */
export function batchStaticParts(root) {
  root.updateMatrixWorld(true);
  const buckets=new Map(),inverse=new THREE.Matrix4().copy(root.matrixWorld).invert();
  root.traverse(mesh=>{
    if(!mesh.isInstancedMesh)return;
    for(let parent=mesh;parent && parent!==root;parent=parent.parent)if(parent.userData.noBatch || parent.userData.sign || parent.userData.action)return;
    const key=`${mesh.geometry.uuid}:${mesh.material.uuid}:${mesh.castShadow}:${mesh.receiveShadow}`;
    if(!buckets.has(key))buckets.set(key,[]);buckets.get(key).push(mesh);
  });
  let removed=0;
  for(const meshes of buckets.values()) {
    if(meshes.length<2)continue;
    const first=meshes[0],count=meshes.reduce((sum,mesh)=>sum+mesh.count,0);
    const combined=new THREE.InstancedMesh(first.geometry,first.material,count);
    combined.name='static-'+first.material.color.getHexString();
    combined.castShadow=first.castShadow;combined.receiveShadow=first.receiveShadow;combined.customDepthMaterial=first.customDepthMaterial;
    const matrix=new THREE.Matrix4(),local=new THREE.Matrix4();let index=0;
    for(const mesh of meshes) {
      local.multiplyMatrices(inverse,mesh.matrixWorld);
      for(let i=0;i<mesh.count;i++){mesh.getMatrixAt(i,matrix);combined.setMatrixAt(index++,matrix.premultiply(local));}
      mesh.removeFromParent();mesh.dispose();
    }
    combined.computeBoundingSphere();if(combined.customDepthMaterial===foliageDepth)combined.boundingSphere.radius+=0.2;
    root.add(combined);removed+=meshes.length-1;
  }
  return removed;
}

export function meshBox(color, size, position = [0, 0, 0], parent) {
  const mesh = new THREE.Mesh(cube, material(color));
  mesh.scale.set(...size); mesh.position.set(...position); mesh.castShadow = true; mesh.receiveShadow = true;
  parent?.add(mesh); return mesh;
}

export function planeTexture(texture, width, height, parent, position = [0, 0, 0]) {
  const mesh = new THREE.Mesh(new THREE.PlaneGeometry(width, height), new THREE.MeshBasicMaterial({ map: texture, transparent: true, side: THREE.DoubleSide, toneMapped: false }));
  mesh.position.set(...position); parent.add(mesh); return mesh;
}

export function contactShadow(parent, x, z, width, depth, opacity = 0.16) {
  const canvas = document.createElement('canvas'); canvas.width = canvas.height = 64;
  const ctx = canvas.getContext('2d'); const gradient = ctx.createRadialGradient(32, 32, 0, 32, 32, 32);
  gradient.addColorStop(0, `rgba(74,52,34,${opacity})`); gradient.addColorStop(0.65, `rgba(74,52,34,${opacity * 0.45})`); gradient.addColorStop(1, 'rgba(74,52,34,0)');
  ctx.fillStyle = gradient; ctx.fillRect(0, 0, 64, 64);
  const texture = new THREE.CanvasTexture(canvas);
  const shadow = new THREE.Mesh(new THREE.PlaneGeometry(width, depth), new THREE.MeshBasicMaterial({ map: texture, transparent: true, depthWrite: false }));
  shadow.rotation.x = -Math.PI / 2; shadow.position.set(x, 0.035, z); parent.add(shadow); return shadow;
}

let lanternGlow;
export function addLanternGlow(parent) {
  if(!lanternGlow) {
    const size=64,data=new Uint8Array(size*size*4);
    for(let y=0;y<size;y++)for(let x=0;x<size;x++) {
      const distance=Math.hypot((x+0.5-size/2)/(size/2),(y+0.5-size/2)/(size/2));
      data.set([255,255,255,Math.round(Math.max(0,1-distance)**3*255)],(y*size+x)*4);
    }
    lanternGlow=new THREE.DataTexture(data,size,size);lanternGlow.needsUpdate=true;
    lanternGlow.magFilter=lanternGlow.minFilter=THREE.LinearFilter;
  }
  const glow=new THREE.Sprite(new THREE.SpriteMaterial({map:lanternGlow,color:'#ffb945',transparent:true,opacity:0.38,blending:THREE.AdditiveBlending,depthWrite:false,toneMapped:false}));
  glow.position.y=1.2;glow.scale.set(1.1,1.5,1);parent.add(glow);
}
