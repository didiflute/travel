import * as T from './vendor/three.module.js';
import {buildLongmen} from './longmen.mjs';
import {buildTemples} from './luoyang-temples.mjs';
import {buildWillow} from './willow.mjs';
import {buildRiver} from './luoyang-water.mjs';
import {buildShuttle} from './shuttle.mjs';
import {bake} from './scene-resources.mjs';
import {createPerson} from './people.mjs';

// A memory composition, not a geographic reconstruction of the two destinations.
export function buildLuoyang({reducedMotion=false}={}){
 const root=new T.Group();root.name='luoyang';let region=root;
 const mat=(color,extra={})=>new T.MeshStandardMaterial({color,roughness:.78,...extra});
 const M={rock:mat('#a39580'),stone:mat('#c0ae91'),shade:mat('#60594c'),cream:mat('#eadcc0'),gold:mat('#d9ae53',{metalness:.48,roughness:.37}),red:mat('#934e3b'),roof:mat('#c15e43'),green:mat('#477360'),leaf:mat('#3f5340'),trunk:mat('#77634e'),water:mat('#4d989c',{metalness:.4,roughness:.24}),path:mat('#d0bea0'),soil:mat('#756d4d')};
 for(const m of [M.rock,M.stone,M.path,M.soil])m.userData.snowSurface=true;
 M.leaf.userData.seasonal=true;
 const mesh=(g,m,x=0,y=0,z=0,p=region)=>{const o=new T.Mesh(g,m);o.position.set(x,y,z);o.castShadow=o.receiveShadow=true;p.add(o);return o};
 const box=(w,h,d,m,x,y,z,p=region)=>mesh(new T.BoxGeometry(w,h,d),m,x,y,z,p);
 const ell=(a,b,c,m,x,y,z,p=region)=>{const o=mesh(new T.SphereGeometry(1,16,12),m,x,y,z,p);o.scale.set(a,b,c);return o};
 const cyl=(a,b,h,m,x,y,z,p=region)=>mesh(new T.CylinderGeometry(a,b,h,24),m,x,y,z,p);
 const line=(pts,r,m,p=region)=>mesh(new T.TubeGeometry(new T.CatmullRomCurve3(pts.map(a=>new T.Vector3(...a))),20,r,5,false),m,0,0,0,p);
 const lathe=(points,m,x,y,z,p=region)=>mesh(new T.LatheGeometry(points.map(a=>new T.Vector2(...a)),32),m,x,y,z,p);
 box(21,.55,20,M.stone,0,-.32,0);box(21,.08,20,M.leaf,0,-.02,0);
 // Open river foreground with planted banks; the winding pale promenade is a visual link.
 box(21,.12,1.1,M.path,0,.12,2.6);box(21,.32,.16,M.stone,0,.05,3.15);box(21,.18,1.25,M.path,0,.1,9.35);
 for(let i=0;i<65;i++){box(.025,.28,.025,M.stone,-10.3+i*.32,.35,3.12)}
 line([[-10.4,.5,3.12],[0,.5,3.12],[10.4,.5,3.12]],.025,M.stone);
 const river=buildRiver();root.add(river.root);
 const longmen=buildLongmen();longmen.root.position.set(-4.4,0,-4.7);longmen.root.userData.dynamic=true;root.add(longmen.root);
 const templeBundle=buildTemples(),temples=templeBundle.root;root.add(temples);
 const willows=[];for(const [x,z,scale,seed] of [[-9,8.75,1.04,12],[7.5,8.8,.98,31],[-9.1,1.05,.72,9],[9,-8,.65,24]]){const tree=buildWillow(seed,scale);tree.root.position.set(x,.12,z);root.add(tree.root);willows.push(tree);}
 for(const [x,z] of [[-9,8.75],[7.5,8.8]]){const light=new T.PointLight('#e3dfb3',1.1,4.5,1.5);light.position.set(x,2.1,z+1.2);root.add(light);}
 const roadLight=new T.SpotLight('#e7e3d0',18,23,1.1,1,1.3);roadLight.position.set(0,8,14);roadLight.target.position.set(0,.3,9.35);root.add(roadLight,roadLight.target);
 const clothes=['#b4a68d','#748994','#9d7d6f','#858a71'].map(color=>mat(color));
 const groups=[[-7.7,2.7],[-7.25,2.58],[-1.6,2.6],[-1.15,2.8],[-.7,2.62],[4.8,2.6],[5.3,2.72],[8.6,2.6],[2.3,.2],[2.65,.4],[5.1,-2.7],[5.5,-2.8],[8.8,-3.5],[8.5,-3.1],[-6.8,8.8],[-6.35,8.7],[3.9,8.8],[4.3,8.75]];
 groups.forEach(([x,z],i)=>{const person=createPerson({cloth:clothes[i%4],variant:i*3,scale:.43,pose:i%5===0?'phone':'watch'});person.position.set(x,z>2?.21:.1,z);person.rotation.y=i%3===0?.35:Math.PI;root.add(person);});
 const shuttle=buildShuttle();root.add(shuttle.root);
 const stats=bake(root);const baseTriangles=stats.triangles+templeBundle.stats.triangles+shuttle.triangles+willows.reduce((n,t)=>n+t.triangles,0);
 const visitors=[];for(let i=0;i<8;i++){const person=createPerson({cloth:clothes[i%4],variant:i*3,pose:'walk'});for(const key of ['leftLeg','rightLeg','leftArm','rightArm']){const part=person[key],pos=part.position.clone(),rot=part.quaternion.clone();part.position.set(0,0,0);part.quaternion.identity();bake(part);part.position.copy(pos);part.quaternion.copy(rot);part.userData.dynamic=true;}bake(person);person.scale.setScalar(i<4?.43:.35);if(i<4){person.position.set(-9+i*4.3,.21,2.55+(i%2)*.22);person.rotation.y=Math.PI/2;}else{const t=(i-4)*.23;person.position.set(-4.4+(i%2?-.57:.55),.31+t*2.3,-.35-t*3.99);person.rotation.y=Math.PI;}root.add(person);visitors.push(person);}
 let clock=0,ride=false;
 return {root,stats:{...stats,get triangles(){return baseTriangles+longmen.stats.triangles;},walking:8,blooms:0},ready:longmen.ready,diagnostics(){return {shuttleX:shuttle.x(),river:river.stats(),visitors:46};},dispose(){river.dispose();},show:{reset(done=false){ride=!done;if(!done)shuttle.reset();},update(t){shuttle.update(t);}},setRideMode(){temples.visible=true;},setDetail(active){temples.visible=true;river.setDetail(active);visitors.forEach(p=>p.visible=active);},update(dt){clock+=dt;if(!reducedMotion){willows.forEach(w=>w.update(clock));river.update(clock);}for(let i=0;i<visitors.length;i++){const p=visitors[i];if(i<4){p.position.set(-9+(i*4.3+clock*.16)%18,.21,2.55+(i%2)*.22);p.rotation.y=Math.PI/2;}else{const t=((i-4)*.23+clock*.026)%1;p.position.set(-4.4+(i%2?-.57:.55),.31+t*2.3,-.35-t*3.99);p.rotation.y=Math.PI;}p.leftLeg.rotation.x=Math.sin(clock*3+i)*.22;p.rightLeg.rotation.x=-p.leftLeg.rotation.x;p.leftArm.rotation.x=-p.leftLeg.rotation.x;p.rightArm.rotation.x=p.leftLeg.rotation.x}}};
}
