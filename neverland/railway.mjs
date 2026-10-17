import * as THREE from './vendor/three.module.js';
import {CELL,routeCells,outline} from './rail-layout.mjs';
import {disposeScene} from './scene-resources.mjs';
export function createRailway(scene){
 const tracks=new THREE.Group(),train=new THREE.Group();scene.add(tracks,train);let points=[],length=0,travel=0,revision=0;
 const body=new THREE.MeshStandardMaterial({color:'#b95e49',roughness:.46}),roof=new THREE.MeshStandardMaterial({color:'#e4cf9e',roughness:.65}),glass=new THREE.MeshStandardMaterial({color:'#ffe0a0',emissive:'#ffc76b',emissiveIntensity:.9}),dark=new THREE.MeshStandardMaterial({color:'#293644'});
 const cars=[];function box(parent,w,h,d,mat,x,y,z){const m=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),mat);m.position.set(x,y,z);m.castShadow=true;parent.add(m);return m}
 for(let n=0;n<2;n++){const car=new THREE.Group();train.add(car);cars.push(car);box(car,.75,.64,1.65,body,0,.4,0);box(car,.83,.13,1.75,roof,0,.78,0);box(car,.78,.27,1.28,glass,0,.5,0);for(const x of [-.4,.4])for(const z of [-.52,.52]){const wheel=new THREE.Mesh(new THREE.CylinderGeometry(.14,.14,.1,10),dark);wheel.rotation.z=Math.PI/2;wheel.position.set(x,.09,z);car.add(wheel)}for(const z of [-.55,0,.55])box(car,.8,.31,.07,body,0,.51,z);box(car,.16,.12,.04,glass,0,.4,.85)}
 function rebuild(layout){
  disposeScene(tracks);revision++;
  const area=loop=>Math.abs(loop.reduce((sum,p,i)=>{const q=loop[(i+1)%loop.length];return sum+p[0]*q[1]-q[0]*p[1]},0));
  const loops=outline(routeCells(layout)).sort((a,b)=>area(b)-area(a)),poly=loops[0].map(([x,z])=>new THREE.Vector3((x-.5)*CELL,-.18,(z-.5)*CELL));
  // Inset from the tile boundary, then round each bend so the train turns smoothly.
  const inset=poly.map((p,i)=>{const a=poly[(i+poly.length-1)%poly.length],b=poly[(i+1)%poly.length],u=p.clone().sub(a).normalize(),v=b.clone().sub(p).normalize();return p.clone().add(new THREE.Vector3(-u.z-v.z,0,u.x+v.x).multiplyScalar(.64))});
  const path=new THREE.CurvePath(),starts=[],ends=[];
  for(let i=0;i<inset.length;i++){const p=inset[i],a=inset[(i+inset.length-1)%inset.length],b=inset[(i+1)%inset.length];starts.push(p.clone().lerp(a,Math.min(.12,1.25/p.distanceTo(a))));ends.push(p.clone().lerp(b,Math.min(.12,1.25/p.distanceTo(b))))}
  for(let i=0;i<inset.length;i++){path.add(new THREE.QuadraticBezierCurve3(starts[i],inset[i],ends[i]));path.add(new THREE.LineCurve3(ends[i],starts[(i+1)%inset.length]))}
  length=path.getLength();points=path.getSpacedPoints(Math.ceil(length*10));
  const strip=(offset,width,y,material)=>{const vertices=[],indices=[];for(let i=0;i<points.length;i++){const p=points[i],a=points[(i+points.length-2)%(points.length-1)],b=points[(i+1)%(points.length-1)],t=b.clone().sub(a).normalize(),normal=new THREE.Vector3(-t.z,0,t.x);for(const side of [-1,1]){const q=p.clone().addScaledVector(normal,offset+side*width);vertices.push(q.x,y,q.z)}if(i<points.length-1){const k=i*2;indices.push(k,k+2,k+1,k+1,k+2,k+3)}}const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(vertices,3));g.setIndex(indices);g.computeVertexNormals();const mesh=new THREE.Mesh(g,material);mesh.receiveShadow=true;tracks.add(mesh)};
  strip(0,.58,-.27,new THREE.MeshStandardMaterial({color:'#374449',roughness:.92,side:THREE.DoubleSide}));const metal=new THREE.MeshStandardMaterial({color:'#c6b58a',metalness:.7,roughness:.35,side:THREE.DoubleSide});strip(-.29,.035,-.19,metal);strip(.29,.035,-.19,metal);
  const count=Math.floor(length/.48),ties=new THREE.InstancedMesh(new THREE.BoxGeometry(.93,.07,.11),new THREE.MeshStandardMaterial({color:'#716451'}),count),dummy=new THREE.Object3D();
  for(let i=0;i<count;i++){const p=at(i*length/count),q=at(i*length/count+.1);dummy.position.copy(p);dummy.position.y=-.25;dummy.rotation.y=Math.atan2(q.x-p.x,q.z-p.z);dummy.updateMatrix();ties.setMatrixAt(i,dummy.matrix)}tracks.add(ties);travel%=length;update(0);
 }
 function at(distance){if(!points.length)return new THREE.Vector3();const v=((distance%length+length)%length)/length*(points.length-1),i=Math.floor(v);return points[i].clone().lerp(points[(i+1)%(points.length-1)],v-i)}
 function update(dt){if(!length)return;travel=(travel+dt*2.8)%length;cars.forEach((car,i)=>{const p=at(travel-i*2),q=at(travel-i*2+.2);car.position.copy(p);car.rotation.y=Math.atan2(q.x-p.x,q.z-p.z)})}
 return {rebuild,update,setVisible(visible){tracks.visible=train.visible=visible},stats:()=>({revision,length,trackSamples:points.length,train:cars[0].position.toArray()}),dispose(){disposeScene(tracks);disposeScene(train)}};
}
