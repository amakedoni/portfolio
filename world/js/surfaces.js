import * as THREE from '../vendor/three/three.module.js';
import { seededRandom } from './config.js';

const cache = new Map();

// Small, locally generated pixel textures. Colour, relief and roughness share
// the same grain; mipmaps keep it quiet when the camera is pulled back.
export function surfaceMaps(kind) {
  if (cache.has(kind)) return cache.get(kind);
  const size=128, random=seededRandom(kind==='wood'?413:kind==='stone'?827:219);
  const relief=new Float32Array(size*size).fill(0.5);
  const rect=(x,y,w,h,value)=>{
    for(let j=y;j<y+h;j++)for(let i=x;i<x+w;i++)relief[((j+size)%size)*size+(i+size)%size]=value;
  };
  if(kind==='wood') {
    for(let i=0;i<105;i++)rect(Math.floor(random()*size),Math.floor(random()*size),8+Math.floor(random()*45),1+Math.floor(random()*2),0.24+random()*0.5);
    for(let i=0;i<5;i++) {
      const x=Math.floor(random()*size),y=Math.floor(random()*size);
      rect(x,y,14,5,0.33);rect(x+3,y+1,8,3,0.55);rect(x+5,y+2,4,1,0.22);
    }
  } else {
    for(let i=0;i<(kind==='stone'?550:310);i++)rect(Math.floor(random()*size),Math.floor(random()*size),1+Math.floor(random()*4),1+Math.floor(random()*3),0.3+random()*0.4);
    if(kind==='stone')for(let i=0;i<9;i++)rect(Math.floor(random()*size),Math.floor(random()*size),4+Math.floor(random()*17),1,0.32);
  }
  const colour=new Uint8Array(size*size*4),height=new Uint8Array(size*size*4),roughness=new Uint8Array(size*size*4);
  for(let i=0;i<relief.length;i++) {
    const value=relief[i];
    const c=Math.round(255*(0.965+(value-0.5)*(kind==='wood'?0.24:0.15)));
    colour.set([c,c,c,255],i*4);
    const h=Math.round(value*255);height.set([h,h,h,255],i*4);
    const r=Math.round(239+(value-0.5)*40);roughness.set([r,r,r,255],i*4);
  }
  function texture(data) {
    const map=new THREE.DataTexture(data,size,size,THREE.RGBAFormat);
    map.wrapS=map.wrapT=THREE.RepeatWrapping;
    map.magFilter=THREE.NearestFilter;map.minFilter=THREE.LinearMipmapLinearFilter;
    map.generateMipmaps=true;map.anisotropy=8;map.needsUpdate=true;return map;
  }
  const result={map:texture(colour),bumpMap:texture(height),roughnessMap:texture(roughness),bumpScale:kind==='wood'?0.025:kind==='stone'?0.038:0.014};
  cache.set(kind,result);return result;
}

export const windTime={value:0};

// Rigid voxel motion, shared by colour, sun-depth and AO passes. Applying the
// offset in world space also keeps wind continuous across merged instances.
export function installWind(material) {
  material.defaultAttributeValues={...material.defaultAttributeValues,foliageWeight:[0]};
  material.onBeforeCompile=shader=>{
    shader.uniforms.uWindTime=windTime;
    shader.vertexShader='attribute float foliageWeight;\nuniform float uWindTime;\n'+shader.vertexShader;
    shader.vertexShader=shader.vertexShader.replace('#include <begin_vertex>',`#include <begin_vertex>
      if(foliageWeight>0.0) {
        mat4 localToWorld=modelMatrix;
        #ifdef USE_INSTANCING
          localToWorld=modelMatrix*instanceMatrix;
        #endif
        vec3 anchor=(localToWorld*vec4(0.0,0.0,0.0,1.0)).xyz;
        float height=max(anchor.y-0.15,0.0);
        float hanging=max(-anchor.y-0.2,0.0);
        float strength=min(height*0.018+hanging*0.024,0.15);
        float wave=sin(uWindTime*1.35+anchor.x*0.2+anchor.z*0.15);
        float breeze=0.7+0.3*sin(uWindTime*0.37+anchor.z*0.11);
        vec3 offset=vec3(wave,0.07*sin(uWindTime+anchor.x),wave*0.45)*strength*breeze;
        transformed+=inverse(mat3(localToWorld))*offset;
      }`);
  };
  material.customProgramCacheKey=()=> 'island-wind-v1';
  return material;
}

export const foliageDepth=installWind(new THREE.MeshDepthMaterial({depthPacking:THREE.RGBADepthPacking}));

export function createSkyEnvironment(renderer) {
  const width=128,height=64,data=new Uint16Array(width*height*4);
  const sky=new THREE.Color('#a5d8f1'),horizon=new THREE.Color('#fff0d4'),ground=new THREE.Color('#a59b84');
  const color=new THREE.Color();
  for(let y=0;y<height;y++)for(let x=0;x<width;x++) {
    const v=y/(height-1),u=x/(width-1);
    if(v<0.5)color.copy(sky).lerp(horizon,Math.pow(v*2,3));
    else color.copy(horizon).lerp(ground,Math.min((v-0.5)*3,1));
    const sun=Math.exp(-((u-0.28)**2/0.0018+(v-0.28)**2/0.003));
    const i=(y*width+x)*4;
    data[i]=THREE.DataUtils.toHalfFloat(color.r+sun*3.5);
    data[i+1]=THREE.DataUtils.toHalfFloat(color.g+sun*3.1);
    data[i+2]=THREE.DataUtils.toHalfFloat(color.b+sun*2.5);
    data[i+3]=THREE.DataUtils.toHalfFloat(1);
  }
  const texture=new THREE.DataTexture(data,width,height,THREE.RGBAFormat,THREE.HalfFloatType);
  texture.mapping=THREE.EquirectangularReflectionMapping;texture.needsUpdate=true;
  const pmrem=new THREE.PMREMGenerator(renderer),environment=pmrem.fromEquirectangular(texture);
  texture.dispose();pmrem.dispose();return environment;
}
