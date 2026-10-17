import * as THREE from './vendor/three.module.js';
import {buildXian} from './xian.mjs';
import {EffectComposer} from './vendor/addons/postprocessing/EffectComposer.js';
import {RenderPass} from './vendor/addons/postprocessing/RenderPass.js';
import {UnrealBloomPass} from './vendor/addons/postprocessing/UnrealBloomPass.js';
import {OutputPass} from './vendor/addons/postprocessing/OutputPass.js';
export function mount(renderer,scene,camera){
 const city=buildXian();scene.add(city.root);
 const composer=new EffectComposer(renderer,new THREE.WebGLRenderTarget(1,1,{type:THREE.HalfFloatType,samples:2}));
 composer.addPass(new RenderPass(scene,camera));composer.addPass(new UnrealBloomPass(new THREE.Vector2(1,1),.16,.45,1.5));composer.addPass(new OutputPass());
 const fx={composer,resize(w,h){composer.setSize(w,h)},invalidateReflection(){},setPerformance(){},simplify(){composer.setPixelRatio(Math.min(renderer.getPixelRatio(),1))}};
 let audio=null;
 function stopAudio(){if(audio){audio.close().catch(()=>{});audio=null}}
 function ring(){
  stopAudio();const Audio=window.AudioContext||window.webkitAudioContext;if(!Audio)return;
  audio=new Audio();audio.resume().catch(()=>{});const now=audio.currentTime;
  [196,398,561,820,1084].forEach((hz,i)=>{const o=audio.createOscillator(),g=audio.createGain();o.frequency.value=hz;o.type='sine';g.gain.setValueAtTime(.0001,now);g.gain.exponentialRampToValueAtTime(.045/(1+i*.6),now+.012);g.gain.exponentialRampToValueAtTime(.0001,now+4.8-i*.4);o.connect(g);g.connect(audio.destination);o.start(now);o.stop(now+5)});
 }
 return {...city,fx,ring,stopAudio,update:()=>false,dispose(){stopAudio();composer.passes.forEach(p=>p.dispose?.());composer.dispose()}};
}
