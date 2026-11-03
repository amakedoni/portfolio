import * as THREE from '../vendor/three/three.module.js';
import { Pass,FullScreenQuad } from '../vendor/three/addons/postprocessing/Pass.js';

const vertexShader='varying vec2 vUv;void main(){vUv=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0);}';

export class CinematicPass extends Pass {
  constructor() {
    super();
    this.a=new THREE.WebGLRenderTarget(1,1,{type:THREE.HalfFloatType,depthBuffer:false});
    this.b=this.a.clone();
    this.blur=new THREE.ShaderMaterial({depthTest:false,depthWrite:false,vertexShader,
      uniforms:{tInput:{value:null},uStep:{value:new THREE.Vector2()},uExtract:{value:1}},
      fragmentShader:`varying vec2 vUv;uniform sampler2D tInput;uniform vec2 uStep;uniform float uExtract;
        vec3 sampleLight(vec2 uv){vec4 c=texture2D(tInput,uv);float energy=max(c.r,max(c.g,c.b));
          return c.rgb*mix(1.0,smoothstep(0.9,1.8,energy)*c.a,uExtract);}
        void main(){vec3 c=sampleLight(vUv)*0.227027;
          c+=(sampleLight(vUv+uStep*1.384615)+sampleLight(vUv-uStep*1.384615))*0.316216;
          c+=(sampleLight(vUv+uStep*3.230769)+sampleLight(vUv-uStep*3.230769))*0.070270;
          gl_FragColor=vec4(c,1.0);}`,
    });
    this.composite=new THREE.ShaderMaterial({depthTest:false,depthWrite:false,vertexShader,
      uniforms:{tScene:{value:null},tGlow:{value:this.b.texture},uPixel:{value:new THREE.Vector2()},
        uFocusBlur:{value:1},uSky:{value:new THREE.Color('#929fd2')},uHorizon:{value:new THREE.Color('#c0d8df')},uWarm:{value:new THREE.Color('#e6c7bb')}},
      fragmentShader:`varying vec2 vUv;uniform sampler2D tScene,tGlow;uniform vec2 uPixel;
        uniform float uFocusBlur;uniform vec3 uSky,uHorizon,uWarm;
        vec4 sceneSample(vec2 p){vec4 c=texture2D(tScene,p);return vec4(c.rgb*c.a,c.a);}
        void main(){
          float edge=smoothstep(0.29,0.50,abs(vUv.y-0.51))*uFocusBlur;
          vec2 radius=uPixel*edge*2.4;
          vec4 c=sceneSample(vUv)*0.4;
          c+=sceneSample(vUv+vec2(radius.x,radius.y))*0.15;
          c+=sceneSample(vUv+vec2(-radius.x,radius.y))*0.15;
          c+=sceneSample(vUv+vec2(radius.x,-radius.y))*0.15;
          c+=sceneSample(vUv-radius)*0.15;
          vec3 sky=mix(uHorizon,uSky,smoothstep(0.12,1.0,vUv.y));
          sky=mix(sky,uWarm,pow(1.0-vUv.y,3.0)*0.55);
          vec3 color=c.rgb+sky*(1.0-c.a)+texture2D(tGlow,vUv).rgb*0.27;
          float vignette=dot(vUv-0.5,vUv-0.5);
          color*=1.0-vignette*0.11;
          gl_FragColor=vec4(color,1.0);
        }`,
    });
    this.quad=new FullScreenQuad(this.blur);
  }
  setSize(width,height) {
    this.a.setSize(Math.max(1,Math.round(width/4)),Math.max(1,Math.round(height/4)));
    this.b.setSize(this.a.width,this.a.height);
    this.composite.uniforms.uPixel.value.set(1/width,1/height);
    this.composite.uniforms.uFocusBlur.value=width<900?0:1;
  }
  render(renderer,writeBuffer,readBuffer) {
    this.quad.material=this.blur;
    this.blur.uniforms.tInput.value=readBuffer.texture;this.blur.uniforms.uExtract.value=1;
    this.blur.uniforms.uStep.value.set(1/this.a.width,0);renderer.setRenderTarget(this.a);this.quad.render(renderer);
    this.blur.uniforms.tInput.value=this.a.texture;this.blur.uniforms.uExtract.value=0;
    this.blur.uniforms.uStep.value.set(0,1/this.a.height);renderer.setRenderTarget(this.b);this.quad.render(renderer);
    this.quad.material=this.composite;this.composite.uniforms.tScene.value=readBuffer.texture;
    renderer.setRenderTarget(this.renderToScreen?null:writeBuffer);this.quad.render(renderer);
  }
  dispose(){this.a.dispose();this.b.dispose();this.blur.dispose();this.composite.dispose();this.quad.dispose();}
}
