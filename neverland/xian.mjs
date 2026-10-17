import * as THREE from './vendor/three.module.js';
import {createPerson} from './people.mjs';
import {createCrowd} from './crowd.mjs';
import {bake} from './scene-resources.mjs';
import {warrior,horse} from './terracotta.mjs';

// A composited travel memory, with recognisable landmark proportions rather than geographic scale.
export function buildXian({reducedMotion=false}={}){
 const root=new THREE.Group();root.name='xian';const landmarks=new THREE.Group(),wall=new THREE.Group();root.add(landmarks,wall);let region=landmarks;
 let seed=4707;const random=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296};
 const mat=(color,extra={})=>new THREE.MeshStandardMaterial({color,roughness:.88,...extra});
 const M={stone:mat('#787e7c'),edge:mat('#a9a79b'),pave:mat('#bcb39e'),pale:mat('#d2c6af'),brick:mat('#a68e70'),sand:mat('#bba184'),red:mat('#713c30'),dark:mat('#332f2b'),wood:mat('#705442'),roof:mat('#4a5151'),tile:mat('#626760'),gold:mat('#b79762',{metalness:.25,roughness:.6}),leaf:mat('#667950'),leaf2:mat('#8a9562'),warm:mat('#edc68e',{emissive:'#f3b76e',emissiveIntensity:.45}),cloth:mat('#a4927a'),rust:mat('#a85d48')};
 for(const m of [M.roof,M.tile,M.stone,M.edge,M.pave,M.sand])m.userData.snowSurface=true;
 M.leaf.userData.seasonal=M.leaf2.userData.seasonal=true;
 function weather(material,kind='stone'){
  material.onBeforeCompile=s=>{s.vertexShader='varying vec3 surfacePoint;varying vec3 surfaceNormal;\n'+s.vertexShader;s.vertexShader=s.vertexShader.replace('#include <begin_vertex>','#include <begin_vertex>\nsurfacePoint=(modelMatrix*vec4(position,1.)).xyz;surfaceNormal=normalize(mat3(modelMatrix)*normal);');
   s.fragmentShader='varying vec3 surfacePoint;varying vec3 surfaceNormal;float stoneHash(vec3 p){return fract(sin(dot(p,vec3(127.1,311.7,74.7)))*43758.5453);}\n'+s.fragmentShader;
   const pattern=kind==='brick'?'vec2 uv=vec2(abs(surfaceNormal.z)>.5?surfacePoint.x:surfacePoint.z,surfacePoint.y)*vec2(9.,25.);uv.x+=mod(floor(uv.y),2.)*.5;vec2 f=fract(uv);float seam=(1.-smoothstep(.015,.045,f.x))+(1.-smoothstep(.018,.075,f.y));float tone=.95+stoneHash(vec3(floor(uv),0.))*.09-seam*.085;':'float tone=.95+stoneHash(floor(surfacePoint*46.))*.08;';
   s.fragmentShader=s.fragmentShader.replace('#include <color_fragment>','#include <color_fragment>\n'+pattern+'\nfloat fine=stoneHash(floor(surfacePoint*220.));diffuseColor.rgb*=tone*(.99+fine*.02);');
  };material.customProgramCacheKey=()=> 'xian-weather-'+kind;
 }
 for(const m of [M.brick,M.sand,M.stone])weather(m,'brick');weather(M.pave);
 const mesh=(g,m,x=0,y=0,z=0,parent=region)=>{const o=new THREE.Mesh(g,m);o.position.set(x,y,z);o.castShadow=o.receiveShadow=true;parent.add(o);return o};
 const box=(w,h,d,m,x,y,z,p=region)=>mesh(new THREE.BoxGeometry(w,h,d),m,x,y,z,p);
 const beam=(a,b,r,m,p=region)=>{const av=new THREE.Vector3(...a),bv=new THREE.Vector3(...b),o=mesh(new THREE.CylinderGeometry(r,r,av.distanceTo(bv),6),m,0,0,0,p);o.position.copy(av).add(bv).multiplyScalar(.5);o.quaternion.setFromUnitVectors(new THREE.Vector3(0,1,0),bv.sub(av).normalize());return o};
 function curve(points,r,m,p=region){const c=new THREE.CatmullRomCurve3(points.map(a=>new THREE.Vector3(...a)));return mesh(new THREE.TubeGeometry(c,12,r,5,false),m,0,0,0,p)}
 function roof(x,y,z,width,depth,rise){
  for(let side=0;side<4;side++){
   const w=side%2?depth:width,d=side%2?width:depth,group=new THREE.Group();group.position.set(x,y,z);group.rotation.y=side*Math.PI/2;region.add(group);
   const pos=[],idx=[],nx=20,ny=8;
   const point=(u,t)=>[u*w/2*t,rise*(1-t)**1.65+.2*t**8+.2*Math.abs(u)**7*t**5,d/2*t];
   for(let i=0;i<=nx;i++)for(let j=0;j<=ny;j++)pos.push(...point(i/nx*2-1,j/ny));
   for(let i=0;i<nx;i++)for(let j=0;j<ny;j++){const a=i*(ny+1)+j,b=a+ny+1;idx.push(a,a+1,b,b,a+1,b+1)}
   const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(pos,3));g.setIndex(idx);g.computeVertexNormals();mesh(g,M.roof,0,0,0,group);
   for(let i=0;i<=Math.ceil(w/.19);i++){const u=i/Math.ceil(w/.19)*2-1,pts=[];for(let j=1;j<=8;j++){const p=point(u,j/8);p[1]+=.012;pts.push(p)}curve(pts,.018,M.tile,group)}
   curve([point(-1,1),point(-.5,1),point(0,1),point(.5,1),point(1,1)],.055,M.gold,group);
   curve([point(-1,.06),point(-1,.4),point(-1,.75),point(-1,1)],.048,M.tile,group);
   box(w*.87,.14,.11,M.red,0,.1,d*.49,group);
  }
 }
 function railing(x,y,z,w,d,m=M.red){for(let side=0;side<4;side++){const g=new THREE.Group();g.position.set(x,y,z);g.rotation.y=side*Math.PI/2;region.add(g);const width=side%2?d:w,depth=side%2?w:d;box(width,.045,.055,m,0,.4,depth/2,g);box(width,.045,.055,m,0,.15,depth/2,g);for(let a=-width/2;a<=width/2+.01;a+=.28)box(.045,.43,.045,m,a,.22,depth/2,g);}}
 function hall(x,y,z,w,d,h){box(w,h,d,M.red,x,y+h/2,z);for(let side=0;side<4;side++){const g=new THREE.Group();g.position.set(x,y,z);g.rotation.y=side*Math.PI/2;region.add(g);const width=side%2?d:w,depth=side%2?w:d;for(let i=-2;i<=2;i++){const a=i*width*.18;box(width*.13,h*.59,.03,M.warm,a,h*.52,depth/2+.02,g);for(let j=-1;j<=1;j++)box(.025,h*.6,.05,M.dark,a+j*width*.038,h*.52,depth/2+.04,g);box(width*.14,.03,.06,M.dark,a,h*.5,depth/2+.05,g)}for(let a=-width/2;a<=width/2+.01;a+=width/6){box(.12,h+.2,.12,M.red,a,h/2,depth/2+.22,g);box(.33,.09,.26,M.gold,a,h+.02,depth/2+.25,g);box(.21,.14,.4,M.red,a,h-.08,depth/2+.25,g)}}}
 function lantern(x,y,z,s=.16){const o=mesh(new THREE.SphereGeometry(s,10,8),M.rust,x,y,z);o.scale.y=1.25;box(s*1.15,.04,s*1.15,M.gold,x,y+s*1.2,z);box(s*1.15,.04,s*1.15,M.gold,x,y-s*1.2,z);beam([x,y-s*1.2,z],[x,y-s*2.2,z],.012,M.gold);}

 // The foundations leave a real hole beneath the archaeological cutaway.
 box(21,.25,19,M.stone,0,-1.92,0);
 box(10.5,1.8,19,M.pave,-5.25,-.95,0);
 box(1.2,1.8,19,M.pave,9.9,-.95,0);
 box(9.3,1.8,2.6,M.pave,4.65,-.95,-8.2);
 box(9.3,1.8,3.0,M.pave,4.65,-.95,8);
 // The seven-storey square brick pagoda: broad lower storey, gentle batter, shallow cornices.
 const px=-5.1,pz=-1.0;
 for(let i=0;i<3;i++)box(6.1-i*.24,.15,5.9-i*.24,M.edge,px,-.06+i*.15,pz);
 let levelY=.32;const heights=[1.82,1.4,1.3,1.2,1.15,1.1,1.08];
 for(let tier=0;tier<7;tier++){
  const w=4.45-tier*.34,h=heights[tier],base=levelY,doorW=tier===0?.67:.47,doorBottom=tier===0?.01:.23,doorTop=tier===0?1.15:.79;
  for(let side=0;side<4;side++){
   const facade=new THREE.Group();facade.position.set(px,base,pz);facade.rotation.y=side*Math.PI/2;region.add(facade);
   const shape=new THREE.Shape();shape.moveTo(-w/2,0);shape.lineTo(w/2,0);shape.lineTo(w/2-.065,h);shape.lineTo(-w/2+.065,h);shape.closePath();
   const hole=new THREE.Path();hole.moveTo(-doorW/2,doorBottom);hole.lineTo(-doorW/2,doorTop);hole.absarc(0,doorTop,doorW/2,Math.PI,0,true);hole.lineTo(doorW/2,doorBottom);hole.closePath();shape.holes.push(hole);
   mesh(new THREE.ExtrudeGeometry(shape,{depth:.17,bevelEnabled:false,curveSegments:16}),M.sand,0,0,w/2-.17,facade);
   // Recessed depth, not a window painted on a solid cube.
   box(doorW+.1,doorTop+doorW/2,.02,M.dark,0,(doorTop+doorW/2)/2,w/2-.35,facade);
   for(const ratio of [-.45,-.24,.24,.45]){box(.065,h-.12,.07,M.brick,ratio*w,h/2,w/2-.018,facade);box(.13,.07,.1,M.brick,ratio*w,h-.14,w/2+.005,facade)}
   const arch=[];for(let j=0;j<=14;j++){const a=j/14*Math.PI;arch.push([Math.cos(a)*(doorW/2+.045),doorTop+Math.sin(a)*(doorW/2+.045),w/2+.012])}curve(arch,.033,M.brick,facade);
   for(const s of [-1,1])box(.052,doorTop-doorBottom,.045,M.brick,s*(doorW/2+.04),(doorTop+doorBottom)/2,w/2+.01,facade);
   box(w-.1,.065,.08,M.brick,0,.1,w/2+.008,facade);
  }
  box(w-.1,.12,w-.1,M.brick,px,base+h-.05,pz);
  for(let j=0;j<3;j++)box(w+.07+j*.045,.055,w+.07+j*.045,M.brick,px,base+h+j*.045,pz);
  levelY+=h+.13;
 }
 const topW=2.36;mesh(new THREE.CylinderGeometry(topW*.58,topW*.72,.32,4),M.brick,px,levelY+.06,pz).rotation.y=Math.PI/4;
 for(let j=0;j<6;j++)mesh(new THREE.CylinderGeometry(.15-j*.017,.19-j*.018,.11,12),M.brick,px,levelY+.3+j*.1,pz);
 mesh(new THREE.SphereGeometry(.075,10,8),M.brick,px,levelY+.93,pz);
 // A restrained monastery courtyard keeps the pagoda's silhouette dominant.
 hall(-8.65,.02,3.6,1.6,4.4,1.05);roof(-8.65,1.13,3.6,2.3,5.0,.62);
 for(let i=0;i<5;i++)box(4.8-i*.16,.07,.25,M.pale,px,.01+i*.065,2.72-i*.2);
 for(let x=-7.4;x<-2.6;x+=.36)for(let z=3;z<6.8;z+=.42)box(.35,.018,.41,((Math.round(x*10)+Math.round(z*10))%4)?M.pave:M.pale,x,-.035,z);
 // Pit No. 1 visual vocabulary: deep excavation, rough parallel earth walls, dense infantry lanes.
 const clay=mat('#8b8272'),armor=mat('#867d6d'),crease=mat('#686454'),soil=mat('#82735f'),soilLight=mat('#9d8a6b'),earth=mat('#b09b79');
 [clay,armor,soil,soilLight,earth].forEach(m=>weather(m));
 const floorY=-1.6;box(9.3,.16,13.35,soil,4.65,floorY-.1,-.2);
 for(let x=.3;x<9.1;x+=.52)for(let z=-6.5;z<6.2;z+=.64)box(.5,.035,.62,random()>.4?soil:soilLight,x,floorY-.005,z);
 function earthWall(x,z,w,d,height){
  const g=new THREE.BoxGeometry(w,height,d,2,3,Math.max(1,Math.ceil(d*3))),p=g.attributes.position;
  for(let i=0;i<p.count;i++){const y=p.getY(i),zz=p.getZ(i);p.setXYZ(i,p.getX(i)+(random()-.5)*.055,y+(y>0?(random()-.5)*.12:0),zz+(random()-.5)*.04)}g.computeVertexNormals();mesh(g,soilLight,x,floorY+height/2,z);
 }
 for(const x of [.13,9.15])earthWall(x,-.2,.32,13.3,1.57);
 for(const z of [-6.75,6.35])earthWall(4.65,z,9.25,.3,1.57);
 for(let lane=1;lane<4;lane++)earthWall(.32+lane*2.18,-1,.58,11.0,.92);
 // Uneven excavation edges and a modest conservation patch, not a smooth sandbox rim.
 for(let i=0;i<95;i++){const x=.45+random()*8.35,z=-6.3+random()*.9,o=mesh(new THREE.IcosahedronGeometry(.035+random()*.075,0),random()>.5?earth:soil,x,floorY+.03,z);o.scale.set(1.8,.55,1)}
 const poses=[];for(let lane=0;lane<4;lane++)for(let col=0;col<2;col++)for(let row=0;row<9;row++){if(lane===2&&row<2)continue;poses.push([.85+lane*2.18+col*.66,floorY+.03,-5.8+row*1.07,(lane+row+col)%3])}
 for(let row=0;row<2;row++)for(let col=0;col<8;col++)poses.push([.82+col*1.12,floorY+.03,4.55+row*.78,(row+col)%3]);
 const dummy=new THREE.Object3D();
 for(let variant=0;variant<3;variant++){const template=warrior(variant,clay,armor,crease).root,members=poses.filter(p=>p[3]===variant);
  for(const child of template.children){if(!child.isMesh)continue;const instances=new THREE.InstancedMesh(child.geometry,child.material,members.length);instances.userData.dynamic=true;instances.castShadow=instances.receiveShadow=true;
   members.forEach(([x,y,z],i)=>{dummy.position.set(x,y,z);dummy.rotation.set(0,(i%3-1)*.023,0);dummy.scale.setScalar(.83+(i%4)*.016);dummy.updateMatrix();instances.setMatrixAt(i,dummy.matrix)});landmarks.add(instances)}
  template.clear();
 }
 for(const x of [5.22,5.99]){const h=horse(clay,crease);h.scale.setScalar(.76);h.position.set(x,floorY,-4.85);landmarks.add(h)}
 // Elevated museum railings around the open archaeological section.
 for(const x of [-.18,9.5]){beam([x,.48,-6.8],[x,.48,6.5],.025,M.dark);for(let z=-6.8;z<6.6;z+=.72)beam([x,-.03,z],[x,.5,z],.022,M.dark)}
 beam([-.15,.48,6.65],[9.5,.48,6.65],.025,M.dark);for(let x=0;x<9.6;x+=.75)beam([x,-.03,6.65],[x,.5,6.65],.022,M.dark);
 // Back edge of the exhibition hall: the open roof section keeps the real sunken pit readable.
 for(const x of [.05,9.25]){beam([x,-.05,-6.9],[x,2.1,-6.9],.075,M.stone)}
 beam([[0,2.1,-6.9]][0],[4.65,3,-6.9],.045,M.stone);beam([4.65,3,-6.9],[9.3,2.1,-6.9],.045,M.stone);beam([0,2.1,-6.9],[9.3,2.1,-6.9],.03,M.stone);
 // Temple bell.
 const bx=-3.0,bz=5.2;
 for(const dx of [-.62,.62]){box(.3,.18,.35,M.edge,bx+dx,0,bz);beam([bx+dx,0,bz],[bx+dx,2.12,bz],.075,M.red)}
 beam([bx-.83,2.12,bz],[bx+.83,2.12,bz],.085,M.wood);roof(bx,2.25,bz,2.15,1.5,.55);
 const bell=new THREE.Group();bell.userData.dynamic=true;bell.position.set(bx,1.98,bz);landmarks.add(bell);
 const bronze=mat('#82754e',{metalness:.65,roughness:.42});const profile=[[.32,-.85],[.35,-.79],[.29,-.68],[.25,-.25],[.18,-.1],[.07,-.025]].map(p=>new THREE.Vector2(...p));
 mesh(new THREE.LatheGeometry(profile,28),bronze,0,0,0,bell);for(const y of [-.73,-.27]){const ring=mesh(new THREE.TorusGeometry(y<-.5?.3:.25,.018,6,28),M.gold,0,y,0,bell);ring.rotation.x=Math.PI/2}
 const striker=new THREE.Group();striker.userData.dynamic=true;striker.position.set(bx+.6,1.98,bz);landmarks.add(striker);beam([0,0,0],[0,-.65,0],.012,M.dark,striker);beam([-.2,-.62,0],[.4,-.62,0],.075,M.wood,striker);
 function tree(x,z){
  beam([x,-.08,z],[x,2.0,z],.075,M.wood);for(let branch=0;branch<6;branch++){const a=branch*2.4;beam([x,1.1,z],[x+Math.cos(a)*.6,2+branch%2*.2,z+Math.sin(a)*.6],.025,M.wood)}
  for(const material of [M.leaf,M.leaf2]){const leaves=new THREE.InstancedMesh(new THREE.SphereGeometry(1,8,6),material,35);leaves.userData.dynamic=true;leaves.castShadow=leaves.receiveShadow=true;for(let i=0;i<35;i++){const a=random()*Math.PI*2,r=Math.sqrt(random())*.85;dummy.position.set(x+Math.cos(a)*r,1.8+random()*.8,z+Math.sin(a)*r);dummy.scale.set(.15+random()*.21,.12+random()*.16,.17+random()*.23);dummy.rotation.set(random(),random(),0);dummy.updateMatrix();leaves.setMatrixAt(i,dummy.matrix)}landmarks.add(leaves)}
 }
 for(const p of [[-8.9,-5.6],[-1.6,-4.9],[-8.8,7.9],[-1.8,8.0]])tree(...p);
 for(const [x,z] of [[-7.6,3.1],[-1.5,4.0],[-7.5,-4.5]]){beam([x,0,z],[x,1.55,z],.028,M.dark);lantern(x,1.42,z,.12)}
 // A couple of quiet everyday moments among the moving visitors.
 const callers=[];for(const [i,x,z] of [[0,-7.5,6.1],[1,8.2,7.6]]){const p=createPerson({cloth:i?M.tile:M.rust,variant:0,pose:'phone',scale:.74});p.position.set(x,-.025,z);p.rotation.y=i?-.6:1.7;landmarks.add(p);callers.push(p)}
 const buildingStats=bake(landmarks);
 // A south-wall vignette. The uncertain endpoint is deliberately not labelled as their itinerary.
 region=wall;const wz=-8.05,deck=1.9;
 box(20.4,.26,2.7,M.stone,0,-.19,wz);
 const gateXs=[-7.4,-.5,6.5],cuts=[[-10.2,-8.15],[-6.65,-1.25],[.25,5.75],[7.25,10.2]];
 for(const [a,b] of cuts)box(b-a,1.9,2.12,M.stone,(a+b)/2,.85,wz);
 for(const x of gateXs){
  const sh=new THREE.Shape();sh.moveTo(-.78,-.1);sh.lineTo(.78,-.1);sh.lineTo(.78,1.8);sh.lineTo(-.78,1.8);sh.closePath();const hole=new THREE.Path();hole.moveTo(-.49,-.09);hole.lineTo(-.49,.7);hole.absarc(0,.7,.49,Math.PI,0,true);hole.lineTo(.49,-.09);hole.closePath();sh.holes.push(hole);
  mesh(new THREE.ExtrudeGeometry(sh,{depth:2.12,bevelEnabled:false,curveSegments:18}),M.stone,x,0,wz-1.06);
  const arch=[];for(let i=0;i<=18;i++){const a=i/18*Math.PI;arch.push([x+Math.cos(a)*.55,.7+Math.sin(a)*.55,wz+1.078])}curve(arch,.045,M.edge);
 }
 box(20.4,.12,2.12,M.pave,0,deck-.06,wz);
 for(const s of [-1,1]){box(20.4,.39,.21,M.stone,0,deck+.2,wz+s*.99);for(let x=-10;x<=10;x+=.51)box(.32,.34,.23,M.stone,x,deck+.55,wz+s*.99)}
 const wallPaver=mat('#7b807b'),wallPaverLight=mat('#868a82');for(let x=-9.8;x<10;x+=.32)for(let z=wz-.8;z<wz+.8;z+=.4)box(.31,.016,.39,random()>.3?wallPaver:wallPaverLight,x,deck+.009,z);
 hall(6.5,deck,-8.05,2.6,1.9,1.1);roof(6.5,deck+1.13,-8.05,3.3,2.6,.64);hall(6.5,deck+1.58,-8.05,2.15,1.35,.7);roof(6.5,deck+2.31,-8.05,2.95,2.15,.62);
 for(let x=-9;x<6;x+=2.3){beam([x,deck,wz-.65],[x,deck+1.1,wz-.65],.025,M.dark);lantern(x,deck+.95,wz-.65,.105)}
 const wallStats=bake(wall);
 // A small walking group, only animated while revisiting the wall memory.
 const walkers=[];for(let i=0;i<4;i++){const person=createPerson({cloth:[M.cloth,M.rust,M.tile,M.pale][i],variant:i%2?0:3,pose:'walk',scale:i>1?.49:.72});person.userData.dynamic=true;person.traverse(o=>{if(o.isMesh)o.castShadow=false});wall.add(person);walkers.push(person)}
 function positionWalk(t){walkers.forEach((p,i)=>{p.position.set(-5.7+t*.7-(i>1?.65:0),deck+.02,wz+(i%2?-.27:.29));p.rotation.y=Math.PI/2;const swing=Math.sin(t*5.3+i*.9)*.25;p.leftLeg.rotation.x=swing;p.rightLeg.rotation.x=-swing;p.leftArm.rotation.x=-swing;p.rightArm.rotation.x=swing})}positionWalk(0);
 // Visiting people are grouped and scattered; only this city updates when opened.
 const paths=[[[-7.0,3.4],[-6.8,6.0],[-4.2,6.6]],[[.4,7.5],[3.0,7.6],[7.6,7.5]],[[-1.0,-4.4],[-1.1,-1.2],[-1.05,2.5]]],groups=[],people=[];
 paths.forEach((nodes,k)=>{const curve=new THREE.CatmullRomCurve3(nodes.map(([x,z])=>new THREE.Vector3(x,0,z))),length=curve.getLength(),route={points:curve.getSpacedPoints(60),length},group={route,lower:.3,upper:length-.3,d:length*.45,sign:k%2?1:-1,speed:.22,wait:0,pace:1};groups.push(group);for(let j=0;j<3;j++)people.push({group,sideOffset:(j-1)*.25,alongOffset:j*.22,variant:(k*3+j)%6,scale:j===2?.48:.7,phase:j*2,heading:0,moving:true,x:0,z:0})});
 const visitors=createCrowd(root,{cream:M.pale,red:M.rust,sage:M.tile,plasterPink:M.cloth,roof:M.roof,woodLight:M.wood},{people,groups},{reducedMotion,groundY:-.025});visitors.root.userData.dynamic=true;
 const waves=[];for(let i=0;i<3;i++){const m=new THREE.MeshBasicMaterial({color:'#e7ce97',transparent:true,opacity:0,depthWrite:false,side:THREE.DoubleSide}),ring=mesh(new THREE.RingGeometry(.97,1,64),m,bx,-.025+i*.002,bz,landmarks);ring.rotation.x=-Math.PI/2;ring.visible=false;waves.push(ring)}
 const show={update(t){bell.rotation.z=Math.sin(t*11)*.11*Math.exp(-t*.85);striker.rotation.z=Math.sin(Math.min(t/.2,1)*Math.PI)*.35;waves.forEach((ring,i)=>{const a=t-i*.48;ring.visible=a>=0&&a<3.6;ring.scale.setScalar(1+Math.max(0,a)*1.45);ring.material.opacity=ring.visible?Math.sin(Math.min(1,a/.25)*Math.PI/2)*.1*(1-a/3.6):0})},reset(){bell.rotation.z=striker.rotation.z=0;waves.forEach(r=>r.visible=false)}};
 let wallMode=false,detailActive=false;return {root,show,wall,stats:{triangles:buildingStats.triangles+wallStats.triangles,geometryBytes:buildingStats.geometryBytes+wallStats.geometryBytes,warriors:poses.length,walking:people.length,pagodaLevels:7,pitDepth:1.6},anchor:new THREE.Vector3(px,10,pz),setDetail(active){detailActive=active;walkers.forEach(p=>p.visible=active);visitors.root.visible=active&&!wallMode},setWallMode(active){wallMode=active;landmarks.visible=!active;visitors.root.visible=detailActive&&!active},walk:{update:positionWalk,reset:()=>positionWalk(0)},update(dt){if(!wallMode)visitors.update(dt,false);return !reducedMotion}};
}
