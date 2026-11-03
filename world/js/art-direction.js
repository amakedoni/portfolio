import * as THREE from '../vendor/three/three.module.js';

// Art-directed illumination: hue is retained in sunlight and in cast shadows.
// These uniforms are also shared by the water and the distant cliff atmosphere.
export const artLight={
  direction:{value:new THREE.Vector3(-0.55,0.75,0.36).normalize()},
  sunlight:{value:new THREE.Color('#ffe1bd').multiplyScalar(1.22)},
  shadow:{value:new THREE.Color('#8a78cf')},
  haze:{value:new THREE.Color('#9faccb')},
  focus:{value:new THREE.Vector3()},
};

export function installArtDirection(material,{foliage=false}={}) {
  const previous=material.onBeforeCompile.bind(material);
  const previousKey=material.customProgramCacheKey();
  material.onBeforeCompile=shader=>{
    previous(shader);
    Object.assign(shader.uniforms,{
      uArtSun:artLight.direction,uArtLight:artLight.sunlight,
      uArtShadow:foliage?{value:new THREE.Color('#648c9d')}:artLight.shadow,
      uArtHaze:artLight.haze,uArtFocus:artLight.focus,
    });
    shader.vertexShader='varying vec3 vArtWorld;\n'+shader.vertexShader;
    shader.vertexShader=shader.vertexShader.replace('#include <project_vertex>',`
      vec4 artPosition=vec4(transformed,1.0);
      #ifdef USE_INSTANCING
        artPosition=instanceMatrix*artPosition;
      #endif
      vArtWorld=(modelMatrix*artPosition).xyz;
      #include <project_vertex>`);
    shader.fragmentShader=`varying vec3 vArtWorld;
      uniform vec3 uArtSun,uArtLight,uArtShadow,uArtHaze,uArtFocus;\n`+shader.fragmentShader;
    shader.fragmentShader=shader.fragmentShader.replace('#include <shadowmap_pars_fragment>',
      '#include <shadowmap_pars_fragment>\n#include <shadowmask_pars_fragment>');
    shader.fragmentShader=shader.fragmentShader.replace('#include <opaque_fragment>',`
      vec3 worldNormal=inverseTransformDirection(normal,viewMatrix);
      float formShade=1.0-smoothstep(-0.28,0.92,dot(worldNormal,uArtSun));
      float castShade=1.0-getShadowMask();
      float shade=max(formShade,castShade*0.92);
      vec3 lit=diffuseColor.rgb*uArtLight;
      vec3 shaded=diffuseColor.rgb*uArtShadow;
      vec3 painted=mix(lit,shaded,shade);
      // Ground bounce gives the undersides a warm accent without flattening them.
      float bounce=(1.0-smoothstep(0.0,2.0,vArtWorld.y))*max(-worldNormal.y,0.0);
      painted+=diffuseColor.rgb*vec3(0.12,0.045,0.015)*bounce;
      outgoingLight=painted+totalSpecular*0.42+totalEmissiveRadiance;
      float distanceHaze=smoothstep(20.0,75.0,distance(vArtWorld.xz,uArtFocus.xz))*0.12;
      float cliffHaze=smoothstep(0.0,8.0,-vArtWorld.y)*0.25;
      outgoingLight=mix(outgoingLight,uArtHaze,max(distanceHaze,cliffHaze));
      #include <opaque_fragment>`);
  };
  material.customProgramCacheKey=()=>previousKey+'-painted-light-v1-'+foliage;
  return material;
}

// Points are camera-oriented coordinates relative to the desired target.
// The depth term keeps the nearest corners inside a perspective frustum too.
export function perspectiveDistance(points,fov,aspect,padding=1.05) {
  const tangent=Math.tan(THREE.MathUtils.degToRad(fov/2));
  let distance=1;
  for(const p of points) distance=Math.max(distance,p.z+Math.max(Math.abs(p.y)/tangent,Math.abs(p.x)/(tangent*aspect))*padding);
  return distance;
}

// A perspective view is not centred by the world-space bounding box: nearer
// cliffs occupy more screen space. Iteratively balance the projected margins.
export function balancedPerspectiveFrame(points,fov,aspect,padding=1.05) {
  const tangent=Math.tan(THREE.MathUtils.degToRad(fov/2));
  let x=0,y=0,distance=perspectiveDistance(points,fov,aspect,padding);
  for(let iteration=0;iteration<5;iteration++) {
    let left=Infinity,right=-Infinity,bottom=Infinity,top=-Infinity;
    for(const p of points) {
      const depth=distance-p.z,px=(p.x-x)/depth,py=(p.y-y)/depth;
      left=Math.min(left,px);right=Math.max(right,px);bottom=Math.min(bottom,py);top=Math.max(top,py);
    }
    x+=(left+right)/2*distance*0.8;y+=(bottom+top)/2*distance*0.8;
    distance=1;
    for(const p of points)distance=Math.max(distance,p.z+Math.max(Math.abs(p.y-y)/tangent,Math.abs(p.x-x)/(tangent*aspect))*padding);
  }
  return {x,y,distance};
}
