import * as THREE from '../vendor/three/three.module.js';
import { Parts, planeTexture } from './geometry.js';

function canvasTexture(width, height, draw) {
  const canvas = document.createElement('canvas'); canvas.width = width; canvas.height = height;
  const ctx = canvas.getContext('2d'); ctx.imageSmoothingEnabled = false; draw(ctx, width, height);
  const texture = new THREE.CanvasTexture(canvas); texture.colorSpace = THREE.SRGBColorSpace;
  texture.magFilter = THREE.NearestFilter; texture.minFilter = THREE.LinearMipmapLinearFilter;
  return texture;
}

export function textTexture(lines, { width = 1024, height = 256, fontSize = 104, color = '#302c2a', background = '#fff0cb', gap = 1.05, fit = true } = {}) {
  return canvasTexture(width, height, (ctx, w, h) => {
    if (background) {
      ctx.fillStyle = background; ctx.fillRect(0, 0, w, h);
      // Quiet grain in the actual wood panel; no baked lettering or scene image.
      ctx.fillStyle='rgba(165,112,65,.045)';
      for (let y=18;y<h;y+=43) { ctx.fillRect(0,y,w,2); ctx.fillRect((y*13)%w,y+7,w*.17,1); }
    }
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillStyle = color;
    for (let i = 0; i < lines.length; i++) {
      const line = typeof lines[i] === 'string' ? { text: lines[i] } : lines[i];
      let size = line.size || fontSize;
      ctx.font = `${line.weight || 800} ${size}px Signage, sans-serif`;
      if (fit && !line.size) {
        size = Math.min(height / (lines.length === 1 ? 1.45 : lines.length + 0.35), size * (w - 95) / Math.max(1, ctx.measureText(line.text).width));
        ctx.font = `${line.weight || 800} ${size}px Signage, sans-serif`;
      }
      const y = h / 2 + (i - (lines.length - 1) / 2) * fontSize * gap;
      ctx.fillText(line.text, w / 2, y, w - 52);
    }
  });
}

export function sign(parent, title, width = 2.9, height = 0.7, position = [0, 2, 0], { href, lines, name, fontSize = 104,textureWidth=1024 } = {}) {
  const parts = new Parts(name || `sign-${title}`);
  parts.box('wood', 0, 0, 0, width + 0.24, height + 0.22, 0.2);
  parts.box('woodLight', 0, height / 2 + 0.08, 0.01, width + 0.32, 0.12, 0.24);
  parts.box('woodDark', 0, -height / 2 - 0.07, 0.01, width + 0.3, 0.12, 0.24);
  for (const x of [-width / 2, width / 2]) {
    parts.box('woodDark', x, 0, 0.12, 0.13, height + 0.29, 0.11);
    for (const y of [-height / 2 + 0.04, height / 2 - 0.04]) parts.box('metal', x, y, 0.19, 0.065, 0.065, 0.055);
  }
  const group = parts.finish(); group.position.set(...position);
  const texture = textTexture(lines || [title], { fontSize,width:textureWidth, height: lines?.length > 1 ? 512 : 256 });
  const face = planeTexture(texture, width - 0.12, height, group, [0, 0, 0.115]);
  group.userData = { href, sign: true, texture, face, title,textureWidth }; parent.add(group); return group;
}

export function screenTexture(kind) {
  return canvasTexture(512, 320, (ctx, w, h) => {
    ctx.fillStyle = '#11243a'; ctx.fillRect(0, 0, w, h);
    ctx.fillStyle = '#1d3651'; for (let x = 20; x < w; x += 52) ctx.fillRect(x, 38, 1, h - 55);
    for (let y = 40; y < h; y += 44) ctx.fillRect(18, y, w - 36, 1);
    if (kind === 'finly') {
      ctx.fillStyle = '#edf2df'; ctx.font = '600 64px Pixelify'; ctx.fillText('Finly', 28, 82);
      ctx.fillStyle = '#7394ac'; for (let i = 0; i < 3; i++) ctx.fillRect(32, 125 + i * 19, 100 - i * 18, 6);
      const bars = [80, 112, 91, 145, 186, 220];
      bars.forEach((bar, i) => { ctx.fillStyle = i < 4 ? '#3a86bc' : '#f1a126'; ctx.fillRect(177 + i * 45, h - 34 - bar, 29, bar); });
      ctx.fillStyle = '#eaa125'; ctx.fillRect(31, 233, 109, 4);
    } else if (kind === 'code') {
      ctx.fillStyle = '#59d7ef'; ctx.font = '600 158px Pixelify'; ctx.textAlign = 'center'; ctx.fillText('</>', w / 2, 210);
      ctx.fillStyle = '#40647a'; ctx.fillRect(128, 253, 256, 5);
    } else {
      ctx.strokeStyle = '#54dded'; ctx.lineWidth = 9; ctx.lineJoin = 'miter'; ctx.beginPath();
      [0.55, 0.48, 0.64, 0.35, 0.47, 0.19, 0.62, 0.51, 0.72, 0.43, 0.52].forEach((p, i) => {
        const x = 30 + i * 45, y = 50 + p * 250; i ? ctx.lineTo(x, y) : ctx.moveTo(x, y);
      }); ctx.stroke();
    }
  });
}

export function solarTexture() {
  return canvasTexture(256, 256, (ctx, w, h) => {
    ctx.fillStyle = '#214c85'; ctx.fillRect(0, 0, w, h);
    for (let x = 0; x < 256; x += 64) for (let y = 0; y < 256; y += 64) {
      ctx.fillStyle = (x + y) % 128 === 0 ? '#2f64a0' : '#27578e'; ctx.fillRect(x + 3, y + 3, 58, 58);
      ctx.fillStyle = '#698cb2'; ctx.fillRect(x + 10, y + 6, 3, 49);
    }
    ctx.strokeStyle = '#e6b943'; ctx.lineWidth = 3; for (let p = 0; p <= 256; p += 64) {
      ctx.beginPath(); ctx.moveTo(p, 0); ctx.lineTo(p, 256); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(0, p); ctx.lineTo(256, p); ctx.stroke();
    }
  });
}

export function starChartTexture() {
  return canvasTexture(512,320,(ctx,w,h)=>{
    ctx.fillStyle='#203954';ctx.fillRect(0,0,w,h);
    ctx.strokeStyle='#365872';ctx.lineWidth=2;
    for(let r=45;r<210;r+=45){ctx.beginPath();ctx.arc(w/2,h/2,r,0,Math.PI*2);ctx.stroke();}
    ctx.beginPath();ctx.moveTo(20,h/2);ctx.lineTo(w-20,h/2);ctx.moveTo(w/2,15);ctx.lineTo(w/2,h-15);ctx.stroke();
    const stars=[[75,220],[145,160],[203,188],[278,104],[367,128],[420,60],[371,244],[288,226]];
    ctx.strokeStyle='#eab45e';ctx.lineWidth=3;ctx.beginPath();stars.slice(0,6).forEach(([x,y],i)=>i?ctx.lineTo(x,y):ctx.moveTo(x,y));ctx.stroke();
    for(const [i,[x,y]] of stars.entries()){ctx.fillStyle=i%2?'#91d9d7':'#fff0c9';ctx.beginPath();ctx.arc(x,y,i%3===0?7:4,0,Math.PI*2);ctx.fill();}
    ctx.fillStyle='#fff0c9';ctx.font='800 24px Signage';ctx.textAlign='center';ctx.fillText('N',w/2,33);
  });
}
