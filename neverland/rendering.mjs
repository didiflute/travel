import * as THREE from 'three';
import {EffectComposer} from './vendor/addons/postprocessing/EffectComposer.js';
import {RenderPass} from './vendor/addons/postprocessing/RenderPass.js';
import {SSAOPass} from './vendor/addons/postprocessing/SSAOPass.js';
import {UnrealBloomPass} from './vendor/addons/postprocessing/UnrealBloomPass.js';
import {OutputPass} from './vendor/addons/postprocessing/OutputPass.js';
import {ShaderPass} from './vendor/addons/postprocessing/ShaderPass.js';
import {Reflector} from './vendor/addons/objects/Reflector.js';

export function cinematic(renderer,scene,camera,world){
 const mobile=innerWidth<750;
 // Linear HDR rendering, screen-space contact shadows, restrained lens diffusion.
 const target=new THREE.WebGLRenderTarget(1,1,{type:THREE.HalfFloatType,samples:2});const composer=new EffectComposer(renderer,target);composer.addPass(new RenderPass(scene,camera));
 const ao=new SSAOPass(scene,camera,1,1,8);ao.kernelRadius=.32;ao.minDistance=.001;ao.maxDistance=.035;
 ao.ssaoMaterial.defines.PERSPECTIVE_CAMERA=camera.isPerspectiveCamera?1:0;
 ao.depthRenderMaterial.defines.PERSPECTIVE_CAMERA=camera.isPerspectiveCamera?1:0;
 const aoResize=ao.setSize.bind(ao);ao.setSize=(w,h)=>aoResize(Math.floor(w*.5),Math.floor(h*.5));composer.addPass(ao);
 const bloom=new UnrealBloomPass(new THREE.Vector2(1,1),.28,.6,1.2);composer.addPass(bloom);
 const finish=new ShaderPass({uniforms:{tDiffuse:{value:null},resolution:{value:new THREE.Vector2(innerWidth,innerHeight)}},vertexShader:`varying vec2 vUv;void main(){vUv=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}`,fragmentShader:`uniform sampler2D tDiffuse;uniform vec2 resolution;varying vec2 vUv;void main(){vec3 c=texture2D(tDiffuse,vUv).rgb;float edge=smoothstep(.2,.82,length((vUv-.5)*vec2(1.,.85)));c*=1.-edge*.18;gl_FragColor=vec4(c,1.);}`});composer.addPass(finish);composer.addPass(new OutputPass());
 // One half-resolution planar reflection. It follows the real model and the viewpoint.
 const shader={...Reflector.ReflectorShader,uniforms:{...Reflector.ReflectorShader.uniforms,time:{value:0},day:{value:0}},vertexShader:`uniform mat4 textureMatrix;varying vec4 vUv;varying vec2 vWater;void main(){vWater=position.xy;vUv=textureMatrix*vec4(position,1.);gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}`,fragmentShader:`uniform sampler2D tDiffuse;uniform float time;uniform float day;varying vec4 vUv;varying vec2 vWater;void main(){vec2 p=vWater;vec2 uv=vUv.xy/vUv.w;float wave=sin(p.y*8.+p.x*1.9+time*.6)*.0011+sin(p.y*18.-time*.4)*.00045;uv+=vec2(wave,wave*.35);vec3 reflection=texture2D(tDiffuse,uv).rgb*.48;vec3 deep=mix(vec3(.035,.075,.105),vec3(.12,.24,.23),day);vec3 col=mix(deep,reflection,.68);float fleck=pow(max(0.,sin(p.y*32.+sin(p.x*7.)*2.-time*.65)),40.)*pow(max(0.,sin(p.x*6.+p.y*2.)),12.);col+=vec3(.16,.22,.23)*fleck*.22;gl_FragColor=vec4(col,1.);}`};
 const mirror=new Reflector(new THREE.PlaneGeometry(34,28),{textureWidth:mobile?512:768,textureHeight:mobile?512:768,multisample:0,clipBias:.001,shader});mirror.rotation.x=-Math.PI/2;mirror.position.y=-.025;
 const reflectionRender=mirror.onBeforeRender;let lastReflection=0,reflectionInterval=100;mirror.onBeforeRender=function(r,s,c){if(s.overrideMaterial)return;const now=performance.now();if(now-lastReflection<reflectionInterval)return;lastReflection=now;reflectionRender.call(this,r,s,c)};
 world.water.visible=false;world.root.add(mirror);
 // Procedural world-space surface detail survives the static geometry merge.
 const fragment=`varying vec3 vSurface;float hash31(vec3 p){return fract(sin(dot(p,vec3(127.1,311.7,74.7)))*43758.5453);}float noise3(vec3 p){vec3 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);return mix(mix(mix(hash31(i),hash31(i+vec3(1,0,0)),f.x),mix(hash31(i+vec3(0,1,0)),hash31(i+vec3(1,1,0)),f.x),f.y),mix(mix(hash31(i+vec3(0,0,1)),hash31(i+vec3(1,0,1)),f.x),mix(hash31(i+vec3(0,1,1)),hash31(i+vec3(1,1,1)),f.x),f.y),f.z);}`;
 function surface(material,type){material.onBeforeCompile=shader=>{shader.vertexShader='varying vec3 vSurface;\n'+shader.vertexShader;shader.vertexShader=shader.vertexShader.replace('#include <begin_vertex>','#include <begin_vertex>\nvSurface=(modelMatrix*vec4(position,1.)).xyz;');shader.fragmentShader=fragment+'\n'+shader.fragmentShader;
  const pattern=type==='wood'?'sin(vSurface.y*90.+noise3(vSurface*vec3(9.,.6,9.))*8.)*.06 + noise3(vSurface*vec3(18.,1.5,18.))*.12':type==='cloth'?'sin(vSurface.x*190.)*sin(vSurface.z*190.)*.035+noise3(vSurface*24.)*.05':'noise3(vSurface*32.)*.07+noise3(vSurface*4.)*.10';
  shader.fragmentShader=shader.fragmentShader.replace('#include <color_fragment>',`#include <color_fragment>\nfloat grain=${pattern};diffuseColor.rgb*=.9+grain;`);
  shader.fragmentShader=shader.fragmentShader.replace('#include <roughnessmap_fragment>','#include <roughnessmap_fragment>\nroughnessFactor=clamp(roughnessFactor+grain*.3,.2,1.);');};material.customProgramCacheKey=()=>type;material.needsUpdate=true;
 }
 for(const name of ['wood','woodLight','woodDark']){surface(world.materials[name],'wood');world.materials[name].roughness=.62;}
 for(const name of ['roof','roofDark','roofEdge','plaster','plasterPink','stone','sand','paving'])surface(world.materials[name],'stone');
 for(const name of ['cloth','cream'])surface(world.materials[name],'cloth');
 world.materials.roof.roughness=.38;world.materials.roofEdge.roughness=.48;
 for(const name of ['leaf','leafLight','leafDark']){world.materials[name].emissive.set('#789965');world.materials[name].emissiveIntensity=.16;}
 const glowCanvas=document.createElement('canvas');glowCanvas.width=64;glowCanvas.height=64;const ctx=glowCanvas.getContext('2d');const g=ctx.createRadialGradient(32,32,0,32,32,32);g.addColorStop(0,'rgba(255,202,128,0.8)');g.addColorStop(.15,'rgba(255,167,71,0.22)');g.addColorStop(1,'rgba(255,161,55,0)');ctx.fillStyle=g;ctx.fillRect(0,0,64,64);const tex=new THREE.CanvasTexture(glowCanvas);const glowMat=new THREE.SpriteMaterial({map:tex,color:'#ffbd75',transparent:true,depthWrite:false,blending:THREE.AdditiveBlending,opacity:.32,toneMapped:false});
 for(const p of world.lanternPositions){const sprite=new THREE.Sprite(glowMat);sprite.position.set(...p);sprite.scale.set(1,1,1);world.root.add(sprite)}
 let simplified=false;
 return {composer,ao,bloom,mirror,dispose(){mirror.dispose();composer.passes.forEach(p=>p.dispose?.());composer.dispose()},invalidateReflection(){lastReflection=0},setPerformance(active){reflectionInterval=active?40:100},resize(w,h){composer.setSize(w,h);finish.uniforms.resolution.value.set(w,h)},update(t,day){mirror.material.uniforms.time.value=t;mirror.material.uniforms.day.value=day?1:0;glowMat.opacity=day?.08:.32},simplify(){if(simplified)return;simplified=true;ao.enabled=false;renderer.setPixelRatio(1);composer.setPixelRatio(1);mirror.getRenderTarget().setSize(384,384)}};
}

