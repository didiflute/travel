import {buildWorld} from './world.mjs';
import {cinematic} from './rendering.mjs';
import {createCrowd} from './crowd.mjs';
import {ironFlowers} from './iron-flowers.mjs';
import * as THREE from './vendor/three.module.js';
export function mount(renderer,scene,camera,{reducedMotion}){
 const world=buildWorld();scene.add(world.root);
 for(const x of [-3.5,3.5]){const light=new THREE.PointLight('#ffad58',18,7,2);light.position.set(x,3.3,0);scene.add(light)}
 const fx=cinematic(renderer,scene,camera,world),crowd=createCrowd(scene,world.materials,world.marketLayout,{reducedMotion}),show=ironFlowers(scene,{reducedMotion,stageY:world.stageY});
 world.waterMaterial.uniforms.time.value=0;world.shimmerMat.opacity=.18;fx.update(0,false);
 return {fx,show,anchor:new THREE.Vector3(0,5.4,0),continuous:!reducedMotion,update:(dt,playing)=>crowd.update(dt,playing),stats:{triangles:world.triangles,...crowd.stats},dispose(){fx.dispose()}};
}
