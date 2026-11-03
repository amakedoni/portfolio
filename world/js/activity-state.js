// Deterministic state lives separately from rendering, including reduced-motion outcomes.
export function createBowlingState() {
  const pins=[];
  for(let row=0;row<3;row++)for(let col=0;col<=row;col++)pins.push({startX:(col-row/2)*0.7,startZ:-2.15-row*0.66});
  let state='ready',elapsed=0,aim=0,accumulator=0,ball={x:0,z:3.5,vx:0,vz:0};
  function reset(){elapsed=0;accumulator=0;state='ready';ball={x:aim*0.55,z:3.5,vx:0,vz:0};pins.forEach(p=>Object.assign(p,{x:p.startX,z:p.startZ,vx:0,vz:0,fall:0,angle:0,hit:false}));}
  function hit(pin,vx,vz){if(pin.hit)return;pin.hit=true;pin.vx=vx;pin.vz=vz;pin.angle=Math.atan2(vx,vz);}
  function step(dt) {
    elapsed+=dt;ball.x+=ball.vx*dt;ball.z+=ball.vz*dt;
    if(ball.z<-3.95){ball.z=-3.95;ball.vz=0;}
    for(const p of pins)if(!p.hit && Math.hypot(p.x-ball.x,p.z-ball.z)<0.59) {
      const dx=p.x-ball.x,dz=p.z-ball.z,n=Math.max(0.01,Math.hypot(dx,dz));
      hit(p,dx/n*2.8,dz/n*2.8-0.7);
    }
    for(const p of pins)if(p.hit) {
      p.x+=p.vx*dt;p.z+=p.vz*dt;p.vx*=Math.exp(-dt*1.6);p.vz*=Math.exp(-dt*1.6);p.fall=Math.min(1,p.fall+dt*2.8);
      const reach=Math.sin(p.fall*Math.PI/2)*1.2,rx=Math.sin(p.angle)*reach,rz=Math.cos(p.angle)*reach;
      p.x=Math.max(-1.8-Math.min(rx,0),Math.min(1.8-Math.max(rx,0),p.x));
      p.z=Math.max(-4-Math.min(rz,0),Math.min(4-Math.max(rz,0),p.z));
      // Only the initial fall transfers an impact; settled pins cannot start a new chain as they slide against the rails.
      for(const q of pins)if(p.fall<0.5 && !q.hit && Math.hypot(p.x-q.x,p.z-q.z)<0.64) {
        const dx=q.x-p.x,dz=q.z-p.z,n=Math.max(0.01,Math.hypot(dx,dz));hit(q,dx/n*2,dz/n*2-0.4);
      }
    }
    if(elapsed>=4){state='complete';ball.vz=0;}
  }
  reset();
  return {
    get state(){return state;},get pins(){return pins;},get ball(){return ball;},get aim(){return aim;},get score(){return pins.filter(p=>p.hit).length;},
    aimBy(direction){if(state==='rolling')return;aim=Math.max(-2,Math.min(2,aim+direction));reset();},
    activate(reduced=false){if(state==='rolling' || state==='complete'){reset();return;}state='rolling';ball.vz=-4.3;if(reduced)while(state==='rolling')step(1/120);},
    update(dt){if(state!=='rolling')return;accumulator+=dt;while(accumulator>=1/120 && state==='rolling'){step(1/120);accumulator-=1/120;}},
    finish(){if(state==='rolling')while(state==='rolling')step(1/120);},
  };
}
