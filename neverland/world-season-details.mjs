import * as T from './vendor/three.module.js';

export function createSeasonDetails(cityGroups){
 const snow={value:0},night={value:0},seasonMeshes=[],glows=[],patched=new Set();
 const flowerGeometry=new T.IcosahedronGeometry(.105,0),flowerMaterial=new T.MeshStandardMaterial({color:'#ffccd3',roughness:.83,emissive:'#e8998e',emissiveIntensity:.08});
 const leafGeometry=new T.CircleGeometry(.065,5),leafMaterial=new T.MeshStandardMaterial({color:'#d18b32',roughness:1,side:T.DoubleSide});
 const glowMaterial=new T.ShaderMaterial({transparent:true,depthWrite:false,blending:T.AdditiveBlending,uniforms:{night},vertexShader:'uniform float night;varying float a;void main(){vec4 p=modelViewMatrix*vec4(position,1.);gl_Position=projectionMatrix*p;gl_PointSize=9.;a=night;}',fragmentShader:'varying float a;void main(){float r=length(gl_PointCoord-.5);float glow=exp(-r*r*30.)*.22;gl_FragColor=vec4(1.,.61,.24,glow*a);}'});
 let flowerCount=0;
 for(const group of Object.values(cityGroups)){
  group.updateMatrixWorld(true);const inverse=group.matrixWorld.clone().invert(),flowers=[],lights=[];
  group.traverse(o=>{if(!o.isMesh||!o.geometry?.attributes.position)return;const materials=[o.material].flat(),g=o.geometry,pos=g.attributes.position,sampleIndex=g.userData.sampleExpandedIndex?g.index:null,sampleCount=sampleIndex?sampleIndex.count:pos.count;
   for(const material of materials){
    if(material.userData.snowSurface&&!patched.has(material)){
     patched.add(material);const previous=material.onBeforeCompile,cache=material.customProgramCacheKey();
     material.onBeforeCompile=shader=>{previous(shader);shader.uniforms.seasonSnow=snow;shader.vertexShader=shader.vertexShader.replace('#include <common>','#include <common>\nvarying vec3 climatePosition;varying vec3 climateNormal;').replace('#include <begin_vertex>','#include <begin_vertex>\nclimatePosition=position;climateNormal=normalize(mat3(modelMatrix)*normal);');shader.fragmentShader=shader.fragmentShader.replace('#include <common>','#include <common>\nuniform float seasonSnow;varying vec3 climatePosition;varying vec3 climateNormal;');shader.fragmentShader=shader.fragmentShader.replace('#include <color_fragment>',`#include <color_fragment>
      float frostNoise=sin(climatePosition.x*3.7+sin(climatePosition.z*7.))*sin(climatePosition.z*4.3);
      float frost=seasonSnow*smoothstep(.25,.72,climateNormal.y)*(.83+.17*frostNoise);
      diffuseColor.rgb=mix(diffuseColor.rgb,vec3(.91,.94,.96),frost);`);};material.customProgramCacheKey=()=>cache+'-season-snow';material.needsUpdate=true;
    }
    if(material.userData.seasonal&&flowers.length<210){const matrix=inverse.clone().multiply(o.matrixWorld),stride=Math.max(1,Math.floor(sampleCount/100));for(let i=3;i<sampleCount&&flowers.length<210;i+=stride){const p=new T.Vector3().fromBufferAttribute(pos,sampleIndex?sampleIndex.getX(i):i).applyMatrix4(matrix);if(p.y>.7&&p.y<10&&Math.abs(p.x)<8.5&&Math.abs(p.z)<8.5)flowers.push(p);}}
    if(material.emissiveIntensity>.2&&!material.userData.seasonal&&lights.length<120){const matrix=inverse.clone().multiply(o.matrixWorld),stride=Math.max(3,Math.floor(sampleCount/50));for(let i=0;i<sampleCount&&lights.length<120;i+=stride){const p=new T.Vector3().fromBufferAttribute(pos,sampleIndex?sampleIndex.getX(i):i).applyMatrix4(matrix);if(p.y>.3&&p.y<10)lights.push(p);}}
   }
  });
  const blossom=new T.InstancedMesh(flowerGeometry,flowerMaterial,flowers.length),fall=new T.InstancedMesh(leafGeometry,leafMaterial,flowers.length),dummy=new T.Object3D();
  flowers.forEach((p,i)=>{dummy.position.copy(p);dummy.rotation.set(i*1.7,i*.6,i*2.4);dummy.scale.setScalar(.7+(i%4)*.25);dummy.updateMatrix();blossom.setMatrixAt(i,dummy.matrix);dummy.position.set(p.x+Math.sin(i)*.35,.22,p.z+Math.cos(i)*.35);dummy.rotation.set(-Math.PI/2,0,i*2.4);dummy.scale.setScalar(1.2);dummy.updateMatrix();fall.setMatrixAt(i,dummy.matrix);});
  for(const o of [blossom,fall]){o.frustumCulled=false;o.userData.dynamic=true;group.add(o);}seasonMeshes.push({blossom,fall});flowerCount+=flowers.length;
  const geometry=new T.BufferGeometry().setFromPoints(lights),points=new T.Points(geometry,glowMaterial);points.frustumCulled=false;points.userData.dynamic=true;group.add(points);glows.push(points);
 }
 return {setSeason(value){snow.value=value==='winter'?1:0;seasonMeshes.forEach(({blossom,fall})=>{blossom.visible=value==='spring';fall.visible=value==='autumn';});},setTime(value){night.value=value==='night'?1:value==='dusk'?.35:0;glows.forEach(o=>o.visible=night.value>0);},stats(){return {flowerCount,snowSurfaces:patched.size,nightGlowPoints:glows.reduce((n,o)=>n+o.geometry.attributes.position.count,0)};}};
}
