import * as T from './vendor/three.module.js';
import {RoundedBoxGeometry} from './vendor/RoundedBoxGeometry.js';
import {bake} from './scene-resources.mjs';

export function buildShuttle(){
 const root=new T.Group();root.name='Open electric river shuttle';root.userData.dynamic=true;
 const material=(color,extra={})=>new T.MeshStandardMaterial({color,roughness:.7,...extra});
 const cream=material('#e5dcc4'),body=material('#648d82'),metal=material('#a3ada8',{metalness:.55,roughness:.35}),rubber=material('#252b2b'),seat=material('#947c59'),skin=material('#c2a186'),hair=material('#35342f'),lamp=material('#fff0c8',{emissive:'#ffdca4',emissiveIntensity:.8});
 const add=(g,m,x,y,z,p=root)=>{const o=new T.Mesh(g,m);o.position.set(x,y,z);o.castShadow=o.receiveShadow=true;p.add(o);return o;};
 const box=(w,h,d,m,x,y,z,p=root)=>add(new RoundedBoxGeometry(w,h,d,2,Math.min(w,h,d)*.17),m,x,y,z,p);
 const rod=(a,b,r,m,p=root)=>{const av=new T.Vector3(...a),bv=new T.Vector3(...b);const o=add(new T.CylinderGeometry(r,r,av.distanceTo(bv),8),m,...av.clone().add(bv).multiplyScalar(.5).toArray(),p);o.quaternion.setFromUnitVectors(new T.Vector3(0,1,0),bv.sub(av).normalize());return o;};
 box(2.5,.16,1.1,body,0,.39,0);box(2.65,.07,1.25,metal,0,.28,0);box(.54,.34,1.1,body,1.02,.59,0);box(.15,.40,1.1,body,-1.2,.57,0);
 box(2.85,.11,1.42,cream,-.05,1.48,0);
 for(const x of [-1.15,1.12])for(const z of [-.55,.55])rod([x,.55,z],[x-.08,1.44,z],.027,metal);
 for(const x of [-.75,.2]){box(.46,.12,1.0,seat,x,.67,0);box(.1,.36,1.0,seat,x-.23,.87,0);}
 box(.47,.045,1.25,metal,.1,.36,0);box(.47,.045,1.25,metal,-.8,.36,0);
 for(const z of [-.36,.36])box(.05,.09,.17,lamp,1.30,.59,z);
 const glass=new T.MeshStandardMaterial({color:'#c4dcd5',transparent:true,opacity:.16,roughness:.14,metalness:.08,depthWrite:false,side:T.DoubleSide});
 const windshield=add(new T.PlaneGeometry(1.05,.57),glass,1.08,1.11,0);windshield.rotation.y=Math.PI/2;windshield.rotation.z=.1;
 const steering=add(new T.TorusGeometry(.14,.017,6,16),rubber,.73,.94,-.28);steering.rotation.y=Math.PI/2;steering.rotation.z=-.5;rod([.7,.64,-.28],[.76,.94,-.28],.023,metal);
 const wheels=[];for(const x of [-.88,.91])for(const z of [-.59,.59]){const wheel=new T.Group();wheel.position.set(x,.26,z);wheel.userData.dynamic=true;root.add(wheel);const tire=add(new T.CylinderGeometry(.23,.23,.14,18),rubber,0,0,0,wheel);tire.rotation.x=Math.PI/2;const rim=add(new T.CylinderGeometry(.12,.12,.15,12),metal,0,0,0,wheel);rim.rotation.x=Math.PI/2;for(let i=0;i<5;i++){const a=i*Math.PI*2/5;rod([0,0,z>0?.08:-.08],[Math.cos(a)*.11,Math.sin(a)*.11,z>0?.08:-.08],.012,cream,wheel);}wheels.push(wheel);}
 // Seated contemporary passengers: bent knees, short jackets and distinct heads.
 for(const [i,x,z] of [[0,.24,-.27],[1,.24,.27],[2,-.72,-.28],[3,-.72,.28]]){
  const cloth=material(['#476974','#c0aa91','#8f6963','#87927a'][i]);
  box(.18,.26,.23,cloth,x,.86,z);const head=add(new T.SphereGeometry(.086,12,10),skin,x+.01,1.08,z);head.scale.set(.85,1.12,.9);const cap=add(new T.SphereGeometry(.087,12,8,0,Math.PI*2,0,Math.PI*.52),hair,x+.01,1.11,z);
  const nose=add(new T.SphereGeometry(.02,8,6),skin,x+.083,1.075,z);nose.scale.y=1.1;
  for(const s of [-1,1]){rod([x,.72,z+s*.065],[x+.22,.70,z+s*.065],.045,cloth);rod([x+.22,.70,z+s*.065],[x+.23,.46,z+s*.065],.035,cloth);box(.14,.06,.075,rubber,x+.26,.43,z+s*.065);rod([x,.95,z+s*.13],[x+.12,.84,z+s*.14],.033,cloth);rod([x+.12,.84,z+s*.14],[x+.23,.84,z+s*.10],.026,skin);}
 }
 const stats=bake(root);root.position.set(-8.4,.1,9.35);
 return {root,triangles:stats.triangles,reset(){root.position.x=-8.4;wheels.forEach(w=>w.rotation.z=0);},update(t){const x=-8.4+16.8*T.MathUtils.clamp(t/8,0,1);root.position.x=x;wheels.forEach(w=>w.rotation.z=-(x+8.4)/.23);},x(){return root.position.x;}};
}
