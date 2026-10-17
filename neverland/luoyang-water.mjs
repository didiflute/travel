import * as T from './vendor/three.module.js';
import {Reflector} from './vendor/addons/objects/Reflector.js';

// A small, throttled real reflection. No reflection rendering while on the city map.
export function buildRiver(){
 const shader={...Reflector.ReflectorShader,uniforms:{...Reflector.ReflectorShader.uniforms,time:{value:0},detail:{value:0}},
 vertexShader:`uniform mat4 textureMatrix;varying vec4 reflectedUv;varying vec2 p;void main(){p=position.xy;reflectedUv=textureMatrix*vec4(position,1.);gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}`,
 fragmentShader:`uniform sampler2D tDiffuse;uniform float time;uniform float detail;varying vec4 reflectedUv;varying vec2 p;
 float hash(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}
 float noise(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);return mix(mix(hash(i),hash(i+vec2(1,0)),f.x),mix(hash(i+vec2(0,1)),hash(i+vec2(1,1)),f.x),f.y);}
 void main(){
  vec2 uv=reflectedUv.xy/reflectedUv.w;
  float a=noise(vec2(p.x*1.8+time*.10,p.y*17.-time*.26));
  float b=noise(vec2(p.x*3.2-time*.12,p.y*29.+time*.15));
  uv+=vec2((a-.5)*.006,(b-.5)*.003);
  vec3 reflection=texture2D(tDiffuse,uv).rgb*.5+texture2D(tDiffuse,uv+vec2(.002,0)).rgb*.25+texture2D(tDiffuse,uv-vec2(.002,0)).rgb*.25;
  vec3 deep=vec3(.012,.031,.040);float silk=noise(vec2(p.x*.8+time*.04,p.y*12.-time*.12));
  vec3 col=deep*(.85+silk*.3)+reflection*detail*.44;
  float highlights=pow(max(0.,a*.7+b*.3-.35),4.)*2.;
  col+=vec3(.055,.085,.095)*highlights;
  gl_FragColor=vec4(col,1.);
 }`};
 const root=new Reflector(new T.PlaneGeometry(21,6.3),{textureWidth:384,textureHeight:384,multisample:0,clipBias:.002,shader});
 root.position.set(0,.065,6.35);root.rotation.x=-Math.PI/2;root.userData.dynamic=true;root.castShadow=root.receiveShadow=false;
 const capture=root.onBeforeRender;let active=false,last=0,capturing=false,captures=0;
 root.onBeforeRender=function(renderer,scene,camera){if(!active||capturing||scene.overrideMaterial)return;const now=performance.now();if(now-last<125)return;last=now;capturing=true;try{capture.call(this,renderer,scene,camera);captures++;}finally{capturing=false;}};
 return {root,update(t){root.material.uniforms.time.value=t;},setDetail(value){active=value;last=0;root.material.uniforms.detail.value=value?1:0;},stats(){return {captures,size:384,active};},dispose(){root.dispose();}};
}
