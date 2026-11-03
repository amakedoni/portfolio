export const PALETTE = Object.freeze({
  stone: '#bda99f', stoneLight: '#e8cbb0', stoneShade: '#a18b9b', stoneDeep: '#786b8c',
  paving: '#dfa86b', pavingLight: '#e9b57d', pavingWarm: '#d89e62', pavingFleck: '#a87f57',
  wood: '#89523d', woodLight: '#bb7b48', woodDark: '#593b4a',
  cream: '#ffe4b5', graphite: '#384052', dark: '#22283a', metal: '#72849b', metalLight: '#b5c4d2',
  orange: '#f5792d', orangeLight: '#ffad41', orangeShade: '#bd4928',
  yellow: '#efbc38', leaf: '#6da840', leafLight: '#8dc24a', leafDark: '#3e7650', grass: '#83aa46',
  leafSun: '#b5d268', moss: '#5d884b',
  blue: '#285780', blueLight: '#428cac', cyan: '#64d4cf', screen: '#172e42',
});

// Deliberate terraces, shoulders and coves rather than a circular perimeter.
export const ISLAND = Object.freeze({ tile:1.2, entranceZ:11.8, outline:[
  [-20.4,-4.8],[-18,-7.2],[-18,-12],[-12,-12],[-12,-16.8],[-3.6,-16.8],
  [-3.6,-14.4],[7.2,-14.4],[7.2,-12],[14.4,-12],[14.4,-9.6],[18,-9.6],
  [18,-5.4],[20.4,-5.4],[20.4,2.4],[18,2.4],[18,7.2],[15.6,7.2],
  [15.6,10.8],[12,10.8],[12,12],[-10.8,12],[-10.8,10.8],[-15.6,10.8],
  [-15.6,8.4],[-18,8.4],[-20.4,4.8],
] });
export const LAB = Object.freeze({ outline:[
  [28.8,-8.4],[31.2,-8.4],[31.2,-13.2],[37.2,-13.2],[37.2,-14.4],[45.6,-14.4],
  [45.6,-12],[49.2,-12],[49.2,-8.4],[51.6,-8.4],[51.6,-1.2],[50.4,-1.2],
  [50.4,3.6],[46.8,3.6],[46.8,6],[37.2,6],[37.2,4.8],[32.4,4.8],[32.4,2.4],[28.8,2.4],
], center:{x:39,z:-4},radiusX:6.7,radiusZ:5,duration:18,gateHeight:3.45,gateWidth:3.8 });
export const BRIDGE = Object.freeze({ from:{x:19.2,z:-1.2}, to:{x:30,z:-5.4}, width:4.2, sag:0.8 });
export const DRIVE = Object.freeze({ left: -8.5, right: 8.5, back: -2.5, front: 7, corner: 2.5, width: 3.6 });
// The basin follows tile boundaries so the ground is actually cut away.
export const POND=Object.freeze({level:-0.23,bottom:-1.05,duration:6.5,buoy:{x:-13.4,z:-0.15},outline:[
  [-15,-3],[-11.4,-3],[-11.4,1.8],[-12.6,1.8],[-12.6,3],[-13.8,3],
  [-13.8,1.8],[-15,1.8],[-15,0.6],[-16.2,0.6],[-16.2,-1.8],[-15,-1.8],
]});
export const insidePond=(x,z,margin=0)=>insidePolygon(x,z,POND.outline,margin);
export const STREAM=Object.freeze({bottom:-0.8,outline:[
  [-13.8,3],[-12.6,3],[-12.6,7.8],[-13.8,7.8],[-13.8,10.8],[-15,10.8],[-15,6.6],[-13.8,6.6],
]});
export const insideStream=(x,z,margin=0)=>insidePolygon(x,z,STREAM.outline,margin);

export const STATIONS = Object.freeze({
  projects: { x: -12.1, z: -6.0, footprint: [3.1, 2], href: '../index.html#projects' },
  about: { x: -0.8, z: -8.5, footprint: [3.3, 2.3], href: '../index.html#about' },
  skills: { x: 11.2, z: -7.0, footprint: [3, 1.7], href: '../index.html#skills' },
  contact: { x: 13.7, z: 4.1, footprint: [2.7, 1.4], href: '../index.html#contact' },
});

export function drivingCircuit(segmentsPerCorner = 12) {
  const { left, right, back, front, corner: r } = DRIVE;
  const points = [];
  for (const [cx, cz, angle] of [[right-r,front-r,0],[left+r,front-r,90],[left+r,back+r,180],[right-r,back+r,270]]) {
    for (let i = 0; i <= segmentsPerCorner; i++) {
      const a = (angle + i / segmentsPerCorner * 90) * Math.PI / 180;
      points.push({ x: cx + Math.cos(a)*r, z: cz + Math.sin(a)*r });
    }
  }
  return points;
}

export function seededRandom(seed = 971) {
  let value = seed >>> 0;
  return () => {
    value += 0x6D2B79F5;
    let n = Math.imul(value ^ value >>> 15, 1 | value);
    n ^= n + Math.imul(n ^ n >>> 7, 61 | n);
    return ((n ^ n >>> 14) >>> 0) / 4294967296;
  };
}

export function insideIsland(x, z, margin = 0) {
  return insidePolygon(x,z,ISLAND.outline,margin);
}

export function polygonBounds(outline) {
  return {minX:Math.min(...outline.map(p=>p[0])),maxX:Math.max(...outline.map(p=>p[0])),
    minZ:Math.min(...outline.map(p=>p[1])),maxZ:Math.max(...outline.map(p=>p[1]))};
}

export function insidePolygon(x,z,outline,margin=0) {
  let inside=false, distance=Infinity;
  for(let i=0,j=outline.length-1;i<outline.length;j=i++) {
    const [ax,az]=outline[j], [bx,bz]=outline[i];
    if((az>z)!==(bz>z) && x<(bx-ax)*(z-az)/(bz-az)+ax) inside=!inside;
    const dx=bx-ax,dz=bz-az;
    const t=Math.max(0,Math.min(1,((x-ax)*dx+(z-az)*dz)/(dx*dx+dz*dz)));
    distance=Math.min(distance,Math.hypot(x-ax-dx*t,z-az-dz*t));
  }
  return inside && distance>=margin;
}

export const insideLab=(x,z,margin=0)=>insidePolygon(x,z,LAB.outline,margin);
export const bridgePose=t=>({
  x:BRIDGE.from.x+(BRIDGE.to.x-BRIDGE.from.x)*t,
  z:BRIDGE.from.z+(BRIDGE.to.z-BRIDGE.from.z)*t,
  y:0.045-4*BRIDGE.sag*t*(1-t),
});

export function coursePose(progress) {
  const a=progress*Math.PI*2-Math.PI/2;
  const x=LAB.center.x+LAB.radiusX*Math.cos(a), z=LAB.center.z+LAB.radiusZ*Math.sin(a);
  const distance=Math.abs(z-LAB.center.z);
  const onRamp=x>44 && distance<2.2;
  const y=onRamp ? Math.min(0.65,(2.2-distance)/1.4*0.65) : 0;
  const slope=onRamp && distance>0.8 ? -Math.sign(z-LAB.center.z)*0.65/1.4 : 0;
  return {x,z,y,heading:Math.atan2(-LAB.radiusX*Math.sin(a),LAB.radiusZ*Math.cos(a)),pitch:-Math.atan(slope)};
}

export function cameraFrame(width, height, bounds = { minX: -14.9, maxX: 14.9, minY: -9.9, maxY: 9.9 }, padding = 1) {
  const aspect = Math.max(width, 1) / Math.max(height, 1);
  const vertical = Math.max(bounds.maxY - bounds.minY, (bounds.maxX - bounds.minX) / aspect) * padding;
  return { left: -vertical * aspect / 2, right: vertical * aspect / 2, top: vertical / 2, bottom: -vertical / 2 };
}
