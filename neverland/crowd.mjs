import * as THREE from './vendor/three.module.js';
import {createPerson} from './people.mjs';
import {sampleRoute} from './market-layout.mjs';

// Six shared figures, baked by material and limb. No per-person mesh or animation mixer.
export function createCrowd(scene,materials,layout,{reducedMotion=false,groundY=.62}={}){
 const root=new THREE.Group();root.name='market-crowd';scene.add(root);
 const colors=[materials.cream,materials.red,materials.sage,materials.plasterPink,materials.roof,materials.woodLight];
 const people=layout.people,bindings=[];
 let geometryBytes=0,matrixBytes=0,drawCalls=0;
 for(let variant=0;variant<6;variant++){
  const template=createPerson({cloth:colors[variant],variant,pose:'walk'});
  const bones={body:template,leftArm:template.leftArm,rightArm:template.rightArm,leftLeg:template.leftLeg,rightLeg:template.rightLeg};
  for(const bone of Object.values(bones))if(bone!==template)bone.rotation.set(0,0,0);
  template.updateMatrixWorld(true);
  const members=people.filter(v=>v.variant===variant),parts=[];
  for(const [key,bone] of Object.entries(bones)){
   const buckets=new Map(),inverse=new THREE.Matrix4().copy(bone.matrixWorld).invert();
   bone.traverse(o=>{
    if(!o.isMesh)return;
    if(key==='body'){let parent=o.parent;while(parent&&parent!==template){if(Object.values(bones).includes(parent))return;parent=parent.parent}}
    const g=o.geometry.index?o.geometry.toNonIndexed():o.geometry.clone();g.applyMatrix4(new THREE.Matrix4().multiplyMatrices(inverse,o.matrixWorld));
    if(!buckets.has(o.material))buckets.set(o.material,[]);buckets.get(o.material).push(g);
   });
   for(const [material,gs] of buckets){
    const count=gs.reduce((n,g)=>n+g.attributes.position.count,0),pos=new Float32Array(count*3),normal=new Float32Array(count*3);let at=0;
    for(const g of gs){pos.set(g.attributes.position.array,at);normal.set(g.attributes.normal.array,at);at+=g.attributes.position.array.length;g.dispose()}
    const geometry=new THREE.BufferGeometry();geometry.setAttribute('position',new THREE.BufferAttribute(pos,3));geometry.setAttribute('normal',new THREE.BufferAttribute(normal,3));geometry.computeBoundingSphere();
    const mesh=new THREE.InstancedMesh(geometry,material,members.length);mesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);mesh.frustumCulled=false;mesh.receiveShadow=true;mesh.castShadow=false;root.add(mesh);
    parts.push({key,pivot:bone.position.clone(),mesh});geometryBytes+=pos.byteLength+normal.byteLength;matrixBytes+=mesh.instanceMatrix.array.byteLength;drawCalls++;
   }
  }
  bindings.push({members,parts});
 }
 // Small soft contact shadows move with the feet; the architectural shadow map stays cached.
 const shadowGeometry=new THREE.PlaneGeometry(.68,.5);shadowGeometry.rotateX(-Math.PI/2);
 const shadowMaterial=new THREE.ShaderMaterial({transparent:true,depthWrite:false,uniforms:{},vertexShader:`varying vec2 v;void main(){v=uv;gl_Position=projectionMatrix*modelViewMatrix*instanceMatrix*vec4(position,1.);}`,fragmentShader:`varying vec2 v;void main(){float d=length((v-.5)*2.);gl_FragColor=vec4(.07,.055,.04,pow(max(0.,1.-d),2.)*.25);}`});
 const shadows=new THREE.InstancedMesh(shadowGeometry,shadowMaterial,people.length);shadows.frustumCulled=false;shadows.instanceMatrix.setUsage(THREE.DynamicDrawUsage);root.add(shadows);
 const position=new THREE.Vector3(),tangent=new THREE.Vector3(),dummy=new THREE.Object3D(),joint=new THREE.Object3D(),matrix=new THREE.Matrix4();
 const turn=(from,to,amount)=>from+Math.atan2(Math.sin(to-from),Math.cos(to-from))*amount;
 let initial=true;
 for(const v of people)v.restHeading=v.heading;
 function update(dt,watching=false){
  if(reducedMotion&&!initial)return false;
  dt=Math.min(dt,.12);
  for(const g of layout.groups){
   sampleRoute(g.route,g.d,position,tangent);
   g.watching=watching&&Math.hypot(position.x,position.z)<12.5;
   const moving=!reducedMotion&&!g.watching&&g.wait<=0;
   g.pace=THREE.MathUtils.lerp(g.pace,moving?1:0,initial?1:1-Math.exp(-dt*6));
   if(!reducedMotion&&!g.watching){
    if(g.wait>0){g.wait-=dt;if(g.wait<=0)g.sign*=-1}
    else {g.d+=g.sign*g.speed*dt*g.pace;if(g.d<=g.lower||g.d>=g.upper){g.d=THREE.MathUtils.clamp(g.d,g.lower,g.upper);g.wait=3.4+g.speed*5}}
   }
  }
  for(const v of people){
   let heading=v.restHeading,pace=0;
   if(v.moving){
    const g=v.group;sampleRoute(g.route,g.d+v.alongOffset,position,tangent);
    v.x=position.x+tangent.z*v.sideOffset;v.z=position.z-tangent.x*v.sideOffset;
    heading=Math.atan2(tangent.x*g.sign,tangent.z*g.sign);pace=g.pace;
   }
   if(watching&&Math.hypot(v.x,v.z)<12.5)heading=Math.atan2(-v.x,-v.z);
   v.heading=initial?heading:turn(v.heading,heading,1-Math.exp(-dt*4));
   v.phase+=dt*4.4*pace/v.scale;v.swing=Math.sin(v.phase)*.26*pace;
   v.bob=(1-Math.cos(v.phase*2))*.006*pace;
  }
  for(const {members,parts} of bindings){
   for(let i=0;i<members.length;i++){
    const v=members[i];dummy.position.set(v.x,groundY+v.bob,v.z);dummy.rotation.set(0,v.heading,0);dummy.scale.setScalar(v.scale);dummy.updateMatrix();
    for(const part of parts){
     if(part.key==='body')matrix.copy(dummy.matrix);
     else {
      joint.position.copy(part.pivot);const opposite=part.key==='leftArm'||part.key==='rightLeg';joint.rotation.set((opposite?1:-1)*v.swing,0,0);joint.updateMatrix();matrix.multiplyMatrices(dummy.matrix,joint.matrix);
     }
     part.mesh.setMatrixAt(i,matrix);
    }
   }
   for(const part of parts)part.mesh.instanceMatrix.needsUpdate=true;
  }
  for(let i=0;i<people.length;i++){const v=people[i];dummy.position.set(v.x,groundY+.005,v.z);dummy.rotation.set(0,v.heading,0);dummy.scale.setScalar(v.scale);dummy.updateMatrix();shadows.setMatrixAt(i,dummy.matrix)}shadows.instanceMatrix.needsUpdate=true;
  initial=false;return !reducedMotion;
 }
 update(0,false);
 return {root,people,update,stats:{people:people.length,walking:people.filter(p=>p.moving).length,templates:6,drawCalls:drawCalls+1,geometryBytes,matrixBytes},dispose(){root.traverse(o=>{if(o.isMesh)o.geometry.dispose()});shadowMaterial.dispose();scene.remove(root)}};
}
