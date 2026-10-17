import * as THREE from './vendor/three.module.js';
import {bake} from './scene-resources.mjs';

// Dedicated Qin sculpture: broad armoured torso, fitted trousers, bun, face and bent hands.
// These are reusable sculptural meshes, not recoloured visitor figures.
export function warrior(variant,clay,armor,crease){
 const root=new THREE.Group();
 const add=(g,m,x=0,y=0,z=0)=>{const o=new THREE.Mesh(g,m);o.position.set(x,y,z);root.add(o);return o};
 const oval=(m,x,y,z,sx,sy,sz)=>{const o=add(new THREE.SphereGeometry(1,12,9),m,x,y,z);o.scale.set(sx,sy,sz);return o};
 const box=(w,h,d,m,x,y,z)=>add(new THREE.BoxGeometry(w,h,d),m,x,y,z);
 const limb=(a,b,r1,r2,m)=>{const p=new THREE.Vector3(...a),q=new THREE.Vector3(...b),o=add(new THREE.CylinderGeometry(r2,r1,p.distanceTo(q),10),m);o.position.copy(p).add(q).multiplyScalar(.5);o.quaternion.setFromUnitVectors(new THREE.Vector3(0,1,0),q.sub(p).normalize());return o};
 const profile=[[.16,.43],[.19,.49],[.18,.65],[.165,.72],[.21,.92],[.235,1.04],[.18,1.1],[.07,1.14]].map(p=>new THREE.Vector2(...p));
 const tunic=new THREE.LatheGeometry(profile,20);for(let i=0;i<tunic.attributes.position.count;i++){const p=tunic.attributes.position,y=p.getY(i),a=Math.atan2(p.getZ(i),p.getX(i)),f=1+Math.cos(a*12)*.025;p.setXYZ(i,p.getX(i)*f,y,p.getZ(i)*.68*f)}tunic.computeVertexNormals();add(tunic,clay);
 for(const s of [-1,1]){limb([s*.1,.59,0],[s*.105,.31,.01],.082,.068,clay);limb([s*.105,.31,.01],[s*.108,.08,.025],.067,.049,clay);oval(clay,s*.108,.065,.065,.078,.055,.155);for(let j=0;j<3;j++)limb([s*.1-.05,.17+j*.055,.057],[s*.1+.05,.17+j*.055,.057],.008,.008,armor)}
 // Slightly curved individual lamellae, with dark binding holes and a scalloped skirt.
 for(const side of [-1,1])for(let row=0;row<7;row++)for(let col=0;col<6;col++){
  const x=(col-2.5)*.064,y=.59+row*.063,z=side*(.134-Math.abs(x)*.13),m=box(.061,.061,.012,armor,x,y,z);m.rotation.y=-side*x*.7;
  if(row%2===0&&col%2===0){oval(crease,x-.018,y+.019,z+side*.017,.005,.005,.003);oval(clay,x+.014,y+.018,z+side*.018,.006,.006,.004)}
 }
 const sash=add(new THREE.CylinderGeometry(.178,.18,.037,20),crease,0,.725,0);sash.scale.z=.71;
 limb([-.09,1.095,.087],[.105,.94,.15],.021,.021,clay);limb([.09,1.095,.087],[-.02,1.01,.145],.018,.018,clay);
 for(const s of [-1,1]){
  const lowered=s<0&&variant!==1,elbow=[s*.27,.84,.04],wrist=lowered?[s*.23,.63,.08]:[s*.2,.84,.23];limb([s*.2,1.03,0],elbow,.09,.084,clay);limb(elbow,wrist,.085,.059,clay);
  const cuff=limb([wrist[0],wrist[1],wrist[2]-.035],[wrist[0],wrist[1],wrist[2]+.025],.068,.066,armor);
  oval(clay,wrist[0],wrist[1]-.018,wrist[2]+.034,.048,.055,.043);for(let j=0;j<3;j++)limb([wrist[0]-.03+j*.02,wrist[1]-.02,wrist[2]+.07],[wrist[0]-.03+j*.02,wrist[1]-.046,wrist[2]+.058],.006,.007,crease);
  for(let row=0;row<3;row++)for(let col=0;col<2;col++){const plate=box(.052,.052,.028,armor,s*(.21+row*.026),1.01-row*.052,.072+col*.054);plate.rotation.z=s*.25}
 }
 limb([0,1.09,0],[0,1.18,0],.057,.061,clay);
 const head=oval(clay,0,1.285,.01,.102+variant*.006,.143,.09);head.rotation.y=(variant-1)*.025;
 oval(clay,0,1.228,.048,.079,.075,.066);oval(clay,0,1.28,.099,.024,.041,.028);
 for(const s of [-1,1]){oval(clay,s*.105,1.283,.005,.021,.035,.018);oval(clay,s*.044,1.298,.085,.035,.017,.018);limb([s*.018,1.309,.099],[s*.066,1.305,.096],.008,.009,crease);limb([s*.02,1.291,.102],[s*.065,1.289,.097],.0045,.0045,crease);limb([s*.008,1.249,.108],[s*.056,1.237,.101],.009,.004,crease)}
 limb([-.032,1.223,.109],[.034,1.223,.109],.004,.004,crease);
 // A fitted hair cap and side bun, rather than a generic helmet.
 oval(armor,0,1.364,-.015,.102,.071,.086);oval(armor,variant===2?-.03:.04,1.432,-.015,.046,.047,.043);
 for(let i=0;i<7;i++)limb([-.075+i*.025,1.388,-.07],[-.067+i*.022,1.4,.028],.0035,.0035,crease);
 if(variant!==1){const beard=add(new THREE.ConeGeometry(.037,.095,8),crease,0,1.164,.087);beard.rotation.z=Math.PI;beard.scale.z=.45}
 const stats=bake(root);root.userData.sculpture=true;return {root,stats};
}

export function horse(clay,dark){
 const root=new THREE.Group();const oval=(x,y,z,sx,sy,sz,m=clay)=>{const o=new THREE.Mesh(new THREE.SphereGeometry(1,12,9),m);o.position.set(x,y,z);o.scale.set(sx,sy,sz);root.add(o);return o};
 oval(0,.75,0,.27,.32,.66);const neck=oval(0,1.08,.43,.18,.47,.24);neck.rotation.x=-.28;oval(0,1.43,.61,.18,.2,.32);oval(0,1.35,.83,.14,.13,.2);
 for(const x of [-.17,.17])for(const z of [-.43,.4]){oval(x,.38,z,.07,.36,.075);oval(x,.08,z+.025,.09,.07,.13,dark)}for(const x of [-.11,.11]){const ear=oval(x,1.65,.51,.046,.15,.06);ear.rotation.z=x>0?-.13:.13;oval(x*1.4,1.47,.68,.02,.02,.012,dark)}oval(0,1.2,.27,.025,.38,.08,dark);oval(0,.53,-.68,.055,.34,.06,dark);bake(root);return root;
}
