import * as THREE from './vendor/three.module.js';

// Seven-head proportions, shaped garments, articulated limbs and small facial features.
// Articulated groups can be baked into shared instanced crowd geometry.
const skin=new THREE.MeshStandardMaterial({color:'#cda784',roughness:.86});
const hair=new THREE.MeshStandardMaterial({color:'#282a29',roughness:.82});
const shoe=new THREE.MeshStandardMaterial({color:'#39352f',roughness:.9});
const linen=new THREE.MeshStandardMaterial({color:'#ded2b8',roughness:1});
const belt=new THREE.MeshStandardMaterial({color:'#5b4a3b',roughness:.9});
const sphere=new THREE.SphereGeometry(1,12,10);
export function createPerson({cloth,variant=0,pose='watch',scale=1}={}) {
 const root=new THREE.Group();root.scale.setScalar(scale);root.userData.person=true;
 function part(geometry,material,x=0,y=0,z=0,parent=root){const m=new THREE.Mesh(geometry,material);m.position.set(x,y,z);m.castShadow=true;m.receiveShadow=true;parent.add(m);return m}
 function oval(material,p,s,parent=root){const m=part(sphere,material,...p,parent);m.scale.set(...s);return m}
 function limb(a,b,r1,r2,material,parent=root){const av=new THREE.Vector3(...a),bv=new THREE.Vector3(...b);const m=part(new THREE.CylinderGeometry(r2,r1,av.distanceTo(bv),10),material,...av.clone().add(bv).multiplyScalar(.5).toArray(),parent);m.quaternion.setFromUnitVectors(new THREE.Vector3(0,1,0),bv.sub(av).normalize());return m}
 const long=variant%3!==0;
 // Trouser legs and shoes remain distinct below the hem.
 const legs=[];
 for(const side of [-1,1]){
  const leg=new THREE.Group();leg.position.set(side*.065,.58,0);root.add(leg);legs.push(leg);
  const footZ=side===1&&pose==='walk'?.14:0;
  limb([0,0,0],[side*.01,-.28,footZ*.4],.06,.047,cloth,leg);
  limb([side*.01,-.28,footZ*.4],[side*.02,-.5,footZ],.047,.035,cloth,leg);
  oval(shoe,[side*.02,-.525,footZ+.035],[.052,.045,.106],leg);
 }
 const profile=(long?[[.13,.15],[.15,.2],[.125,.4],[.105,.59],[.115,.72],[.155,.84],[.125,.9],[.065,.94]]:[[.15,.44],[.16,.49],[.105,.6],[.12,.74],[.155,.84],[.125,.9],[.065,.94]]).map(([r,y])=>new THREE.Vector2(r,y));
 const robe=new THREE.LatheGeometry(profile,20);const rp=robe.attributes.position;
 for(let i=0;i<rp.count;i++){const x=rp.getX(i),y=rp.getY(i),z=rp.getZ(i),a=Math.atan2(z,x),fold=1+Math.cos(a*9+variant)*.045*Math.max(0,(.76-y));rp.setXYZ(i,x*fold,y,z*.74*fold)}robe.computeVertexNormals();part(robe,cloth);
 // A crossed collar, sash and narrow overlapping garment edge.
 limb([-.085,.9,.082],[.075,.72,.102],.014,.014,linen);limb([.085,.9,.082],[-.035,.8,.105],.014,.014,linen);
 const sash=part(new THREE.CylinderGeometry(.113,.113,.044,20),belt,0,.61,0);sash.scale.z=.77;
 limb([.06,.59,.087],[.08,long?.25:.47,.12],.012,.009,cloth);
 limb([0,.91,0],[0,.99,0],.039,.042,skin);
 const head=new THREE.Group();head.position.set(0,1.067,.006);head.rotation.x=pose==='watch'?-.12:0;root.add(head);
 oval(skin,[0,0,0],[.072,.096,.065],head);
 oval(skin,[0,-.037,.034],[.05,.046,.038],head);
 oval(skin,[0,.003,.066],[.014,.021,.022],head);
 for(const side of [-1,1]){oval(skin,[side*.07,-.005,0],[.014,.023,.012],head);oval(hair,[side*.027,.018,.06],[.007,.005,.004],head)}
 oval(hair,[0,.049,-.013],[.074,.058,.063],head);
 if(variant%4===1){oval(hair,[0,.09,-.035],[.034,.032,.033],head);limb([-.045,.091,-.035],[.05,.1,-.035],.005,.005,linen,head)}
 else if(variant%4===2){part(new THREE.CylinderGeometry(.069,.078,.048,14),hair,0,.088,0,head)}
 else {oval(hair,[0,.089,-.013],[.024,.023,.027],head)}
 const arms=[];
 for(const side of [-1,1]){
  const arm=new THREE.Group();arm.position.set(side*.135,.844,0);root.add(arm);
  const bent=pose==='carry'||(pose==='watch'&&(variant%5===0));
  const phone=pose==='phone'&&side===1;
  const elbow=phone?[.12,-.075,.09]:[side*.05,-.17,bent?.08:.02],wrist=phone?[-.035,.17,.035]:[side*.035,bent?-.22:-.35,bent?.21:.045];
  limb([0,0,0],elbow,.067,.062,cloth,arm);limb(elbow,wrist,.062,.042,cloth,arm);
  oval(skin,[wrist[0],wrist[1]-.035,wrist[2]+.015],[.025,.045,.021],arm);
  if(phone){const mobile=part(new THREE.BoxGeometry(.023,.093,.047),shoe,wrist[0]-.01,wrist[1]+.015,wrist[2],arm);mobile.rotation.z=-.12;}
  if(pose==='wave'&&side===1)arm.rotation.x=-2.1;
  if(pose==='walk')arm.rotation.x=side*.22;
  arms.push(arm);
 }
 root.rightArm=arms[1];root.leftArm=arms[0];
 root.rightLeg=legs[1];root.leftLeg=legs[0];
 return root;
}
