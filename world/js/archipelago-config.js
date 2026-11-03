import { ISLAND,LAB,BRIDGE } from './config.js';

export const DISTRICTS=Object.freeze({
  main:{title:'Портфолио',en:'Portfolio',outline:ISLAND.outline},
  lab:{title:'Полигон',en:'Test range',outline:LAB.outline},
  observatory:{title:'Обсерватория',en:'Observatory',center:[-13,-36],seed:417,outline:[
    [-27.6,-36],[-25.2,-36],[-25.2,-42],[-20.4,-42],[-20.4,-45.6],[-8.4,-45.6],[-8.4,-44.4],[-2.4,-44.4],[-2.4,-40.8],[1.2,-40.8],[1.2,-30],[-1.2,-30],[-1.2,-25.2],[-10.8,-25.2],[-10.8,-24],[-18,-24],[-18,-26.4],[-24,-26.4],[-24,-30],[-27.6,-30],
  ]},
  playground:{title:'Игротека',en:'Playground',center:[25,-37],seed:638,outline:[
    [13.2,-40.8],[15.6,-40.8],[15.6,-45.6],[21.6,-45.6],[21.6,-48],[32.4,-48],[32.4,-45.6],[37.2,-45.6],[37.2,-36],[38.4,-36],[38.4,-28.8],[33.6,-28.8],[33.6,-26.4],[21.6,-26.4],[21.6,-28.8],[13.2,-28.8],
  ]},
  energy:{title:'Остров энергии',en:'Energy island',center:[63,-23],seed:951,outline:[
    [54,-26.4],[55.2,-26.4],[55.2,-30],[60,-30],[60,-32.4],[67.2,-32.4],[67.2,-30],[72,-30],[72,-22.8],[70.8,-22.8],[70.8,-16.8],[67.2,-16.8],[67.2,-13.2],[57.6,-13.2],[57.6,-16.8],[54,-16.8],
  ]},
});

export const EXTRA_BRIDGES=Object.freeze([
  {id:'main-observatory',regions:['main','observatory'],from:{x:-6,z:-14.4},to:{x:-13.2,z:-26.4},width:4.2,sag:0.85},
  {id:'observatory-playground',regions:['observatory','playground'],from:{x:0,z:-33.6},to:{x:14.4,z:-34.8},width:4.2,sag:1},
  {id:'playground-energy',regions:['playground','energy'],from:{x:36,z:-32.4},to:{x:55.2,z:-24},width:4.2,sag:1.1},
  {id:'lab-energy',regions:['lab','energy'],from:{x:49.2,z:-6},to:{x:60,z:-16.8},width:4.2,sag:0.9},
  {id:'lab-playground',regions:['lab','playground'],from:{x:33.6,z:-12},to:{x:26.4,z:-27.6},width:4.2,sag:1},
]);
export const ROUTES=[{...BRIDGE,id:'main-lab',regions:['main','lab']},...EXTRA_BRIDGES];
export function districtPortal(region,x,z) {
  return ROUTES.some(route=>{
    const side=route.regions.indexOf(region);
    if(side<0)return false;
    const point=side===0?route.from:route.to;
    return Math.hypot(x-point.x,z-point.z)<route.width/2+1.5;
  });
}

// Open approaches are reserved now; future player collisions use these same routes.
export const APPROACHES={
  main:[[-6,-14.4],[-5.7,-9],[-5.7,-5],[-5.7,-2.5]],
  observatory:[[-13.2,-26.4],[-7.2,-29],[-3.6,-33.6],[0,-33.6]],
  playground:[[14.4,-34.8],[19,-32],[26.4,-30.6],[36,-32.4]],
  energy:[[55.2,-24],[58.8,-20.4],[60,-16.8]],
};

export function distanceToPath(x,z,points) {
  let closest=Infinity;
  for(let i=1;i<points.length;i++) {
    const [ax,az]=points[i-1],[bx,bz]=points[i],dx=bx-ax,dz=bz-az;
    const t=Math.max(0,Math.min(1,((x-ax)*dx+(z-az)*dz)/(dx*dx+dz*dz)));
    closest=Math.min(closest,Math.hypot(x-ax-dx*t,z-az-dz*t));
  }
  return closest;
}
