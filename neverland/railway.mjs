import * as THREE from './vendor/three.module.js';
import {CELL,routeCells,outline} from './rail-layout.mjs';
import {disposeScene} from './scene-resources.mjs';
import {createHeritageTram} from './heritage-tram.mjs';
export function createRailway(scene){
 const tracks=new THREE.Group(),train=new THREE.Group();scene.add(tracks,train);let points=[],length=0,travel=0,revision=0;
 const tram=createHeritageTram();train.add(tram.root);const contact=new THREE.Vector3();let poleCount=0;
 function rebuild(layout){
  disposeScene(tracks);revision++;
  const area=loop=>Math.abs(loop.reduce((sum,p,i)=>{const q=loop[(i+1)%loop.length];return sum+p[0]*q[1]-q[0]*p[1]},0));
  const loops=outline(routeCells(layout)).sort((a,b)=>area(b)-area(a)),poly=loops[0].map(([x,z])=>new THREE.Vector3((x-.5)*CELL,-.22,(z-.5)*CELL));
  // Inset from the tile boundary, then round each bend so the train turns smoothly.
  const inset=poly.map((p,i)=>{const a=poly[(i+poly.length-1)%poly.length],b=poly[(i+1)%poly.length],u=p.clone().sub(a).normalize(),v=b.clone().sub(p).normalize();return p.clone().add(new THREE.Vector3(-u.z-v.z,0,u.x+v.x).multiplyScalar(.64))});
  const path=new THREE.CurvePath(),starts=[],ends=[];
  for(let i=0;i<inset.length;i++){const p=inset[i],a=inset[(i+inset.length-1)%inset.length],b=inset[(i+1)%inset.length];starts.push(p.clone().lerp(a,Math.min(.20,2.3/p.distanceTo(a))));ends.push(p.clone().lerp(b,Math.min(.20,2.3/p.distanceTo(b))))}
  for(let i=0;i<inset.length;i++){path.add(new THREE.QuadraticBezierCurve3(starts[i],inset[i],ends[i]));path.add(new THREE.LineCurve3(ends[i],starts[(i+1)%inset.length]))}
  length=path.getLength();points=path.getSpacedPoints(Math.ceil(length*10));
  const strip=(offset,width,y,material)=>{const vertices=[],indices=[],uv=[];for(let i=0;i<points.length;i++){const p=points[i],a=points[(i+points.length-2)%(points.length-1)],b=points[(i+1)%(points.length-1)],t=b.clone().sub(a).normalize(),normal=new THREE.Vector3(-t.z,0,t.x);for(const side of [-1,1]){const q=p.clone().addScaledVector(normal,offset+side*width);vertices.push(q.x,y,q.z);uv.push((side+1)/2,i/(points.length-1)*length/1.8)}if(i<points.length-1){const k=i*2;indices.push(k,k+2,k+1,k+1,k+2,k+3)}}const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(vertices,3));g.setAttribute('uv',new THREE.Float32BufferAttribute(uv,2));g.setIndex(indices);g.computeVertexNormals();const mesh=new THREE.Mesh(g,material);mesh.receiveShadow=true;tracks.add(mesh)};
  // Street-running tram rails: flush steel heads and dark flangeways in setts,
  // not exposed mainline sleepers. One tiny repeating paving texture per route.
  const canvas=document.createElement('canvas');canvas.width=canvas.height=128;const ctx=canvas.getContext('2d');ctx.fillStyle='#79776d';ctx.fillRect(0,0,128,128);
  for(let row=0;row<8;row++)for(let col=-1;col<5;col++){const shade=143+((row*17+col*23+80)%21);ctx.fillStyle=`rgb(${shade+8},${shade+4},${shade-4})`;ctx.fillRect(col*32+(row%2)*16+1,row*16+1,30,14);}
  const texture=new THREE.CanvasTexture(canvas);texture.colorSpace=THREE.SRGBColorSpace;texture.wrapS=texture.wrapT=THREE.RepeatWrapping;texture.anisotropy=4;
  const paving=new THREE.MeshStandardMaterial({map:texture,roughness:.94,side:THREE.DoubleSide}),edge=new THREE.MeshStandardMaterial({color:'#b4aa94',roughness:.9,side:THREE.DoubleSide}),groove=new THREE.MeshStandardMaterial({color:'#38403d',roughness:.85,side:THREE.DoubleSide}),metal=new THREE.MeshStandardMaterial({color:'#b8bcb9',metalness:.7,roughness:.34,side:THREE.DoubleSide});
  strip(0,.94,-.29,groove);strip(0,.86,-.27,paving);
  for(const s of [-1,1]){strip(s*.88,.045,-.255,edge);strip(s*.36,.055,-.25,groove);strip(s*.375,.024,-.22,metal);strip(s*.325,.008,-.231,metal);}
  const wirePoints=points.map(p=>new THREE.Vector3(p.x,2.8,p.z));tracks.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints(wirePoints),new THREE.LineBasicMaterial({color:'#66716c',transparent:true,opacity:.65})));
  poleCount=Math.max(4,Math.ceil(length/12));const poleMat=new THREE.MeshStandardMaterial({color:'#445b50',metalness:.38,roughness:.65}),poles=new THREE.InstancedMesh(new THREE.CylinderGeometry(.026,.042,1,8),poleMat,poleCount*2),bases=new THREE.InstancedMesh(new THREE.CylinderGeometry(.085,.10,.25,8),poleMat,poleCount),dummy=new THREE.Object3D(),axis=new THREE.Vector3(0,1,0);
  for(let i=0;i<poleCount;i++){
   const p=at((i+.5)*length/poleCount),q=at((i+.5)*length/poleCount+.1),t=q.sub(p).normalize(),n=new THREE.Vector3(-t.z,0,t.x),base=p.clone().addScaledVector(n,-1.02);base.y=-.29;const top=base.clone();top.y=2.84;
   dummy.position.copy(base).lerp(top,.5);dummy.quaternion.identity();dummy.scale.set(1,top.y-base.y,1);dummy.updateMatrix();poles.setMatrixAt(i*2,dummy.matrix);
   const tip=p.clone();tip.y=2.84;const arm=tip.clone().sub(top);dummy.position.copy(top).lerp(tip,.5);dummy.quaternion.setFromUnitVectors(axis,arm.clone().normalize());dummy.scale.set(.7,arm.length(),.7);dummy.updateMatrix();poles.setMatrixAt(i*2+1,dummy.matrix);
   dummy.position.copy(base);dummy.position.y+=.125;dummy.quaternion.identity();dummy.scale.set(1,1,1);dummy.updateMatrix();bases.setMatrixAt(i,dummy.matrix);
  }
  tracks.add(poles,bases);if(revision===1)travel=length*.62;travel%=length;update(0);
 }
 function at(distance){if(!points.length)return new THREE.Vector3();const v=((distance%length+length)%length)/length*(points.length-1),i=Math.floor(v);return points[i].clone().lerp(points[(i+1)%(points.length-1)],v-i)}
 function update(dt){if(!length)return;travel=(travel+dt*2.25)%length;const p=at(travel),front=at(travel+.85),back=at(travel-.85);tram.root.position.copy(p);tram.root.rotation.y=Math.atan2(front.x-back.x,front.z-back.z);tram.root.updateMatrixWorld(true);contact.copy(at(travel-.95));contact.y=2.8;tram.root.worldToLocal(contact);tram.update(travel,contact);}
 return {rebuild,update,setVisible(visible){tracks.visible=train.visible=visible},stats:()=>({revision,length,trackSamples:points.length,train:tram.root.position.toArray(),vehicle:'Hong Kong heritage double-deck tram',cars:1,decks:2,tramTriangles:tram.stats.triangles,tramBatches:tram.stats.batches,trackStyle:'embedded grooved street rails',poleCount}),dispose(){disposeScene(tracks);disposeScene(train)}};
}
