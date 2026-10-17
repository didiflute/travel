import * as THREE from './vendor/three.module.js';
import {bake} from './scene-resources.mjs';

// Small, fully modelled Hong Kong heritage tram. Labels are generated locally;
// no document-relative asset URLs, downloaded models or extra lights.
export function createHeritageTram(){
 const root=new THREE.Group();root.name='Neverland heritage double-deck tram';
 const mat=(color,roughness=.55,extra={})=>new THREE.MeshStandardMaterial({color,roughness,...extra});
 const green=mat('#235e49',.36),cream=mat('#f2e1b6'),wood=mat('#96613a'),metal=mat('#29383a',.47,{metalness:.55}),brass=mat('#bfa36a',.35,{metalness:.65}),rubber=mat('#263030'),glass=mat('#36535a',.25,{metalness:.25,emissive:'#e0ac5c',emissiveIntensity:.12}),light=mat('#fff1bc',.25,{emissive:'#ffd48c',emissiveIntensity:1.4});
 function mesh(geometry,material,x=0,y=0,z=0){const o=new THREE.Mesh(geometry,material);o.position.set(x,y,z);o.castShadow=true;o.receiveShadow=true;root.add(o);return o;}
 const box=(w,h,d,m,x,y,z)=>mesh(new THREE.BoxGeometry(w,h,d),m,x,y,z);
 const rod=(a,b,r,m)=>{const start=new THREE.Vector3(...a),end=new THREE.Vector3(...b),delta=end.clone().sub(start);const o=mesh(new THREE.CylinderGeometry(r,r,delta.length(),8),m);o.position.copy(start).add(end).multiplyScalar(.5);o.quaternion.setFromUnitVectors(new THREE.Vector3(0,1,0),delta.normalize());return o;};
 box(.91,.16,2.60,metal,0,.30,0);
 box(1.02,.12,2.93,wood,0,.42,0);
 // The green waist panels and separate floors keep the two decks readable.
 box(1.02,.36,2.86,green,0,.64,0);
 box(1.03,.28,2.86,green,0,1.48,0);
 box(1.06,.075,2.94,cream,0,1.30,0);
 box(1.07,.075,2.96,cream,0,1.64,0);
 box(.94,.07,2.76,wood,0,1.37,0);
 for(const y of [.84,1.68]){
  // Individually inset window panes, slender teak jambs and cream corner posts.
  for(const side of [-1,1]){
   for(let i=0;i<7;i++){const z=-1.20+i*.40;box(.025,.43,.335,glass,side*.512,y+.22,z);box(.035,.46,.032,wood,side*.532,y+.23,z-.184);box(.038,.027,.338,cream,side*.534,y+.39,z);}
   for(const z of [-1.42,1.42])box(.065,.46,.065,cream,side*.495,y+.23,z);
   box(.045,.045,2.88,cream,side*.516,y+.47,0);
  }
  for(const side of [-1,1]){
   box(.87,.43,.025,glass,0,y+.22,side*1.438);
   for(const x of [-.44,0,.44])box(.037,.47,.04,cream,x,y+.23,side*1.457);
   box(.99,.045,.06,cream,0,y+.47,side*1.44);
  }
 }
 // Curved ivory roof, with dark rain gutters and four shallow ventilators.
 const roofShape=new THREE.Shape();roofShape.moveTo(-.57,0);roofShape.quadraticCurveTo(-.5,.15,0,.16);roofShape.quadraticCurveTo(.5,.15,.57,0);roofShape.lineTo(.57,-.055);roofShape.lineTo(-.57,-.055);roofShape.closePath();
 mesh(new THREE.ExtrudeGeometry(roofShape,{depth:3.02,bevelEnabled:false,curveSegments:10}),cream,0,2.20,-1.51);
 for(const x of [-.565,.565])box(.035,.04,3.04,metal,x,2.19,0);
 for(const z of [-.9,-.3,.3,.9])box(.28,.055,.16,cream,0,2.37,z);
 // Front and rear entry platforms, folding doors, brass grab rails and fenders.
 for(const s of [-1,1]){
  box(1.09,.09,.24,metal,0,.26,s*1.47);box(.88,.06,.17,wood,0,.34,s*1.49);
  box(.94,.10,.12,green,0,.48,s*1.49);
  for(const x of [-.45,.45])rod([x,.45,s*1.52],[x,.82,s*1.52],.018,brass);
  rod([-.45,.81,s*1.52],[.45,.81,s*1.52],.017,brass);
  for(const x of [-.31,.31]){const o=mesh(new THREE.CylinderGeometry(.075,.075,.045,14),brass,x,.68,s*1.46);o.rotation.x=Math.PI/2;const l=mesh(new THREE.CircleGeometry(.054,12),light,x,.68,s*1.488);if(s<0)l.rotation.y=Math.PI;}
  for(const x of [-.31,.31]){box(.022,.24,.02,cream,x,.59,s*1.441);}
  // Two recessed side door leaves by the end, on opposite sides of the tram.
  box(.025,.70,.27,wood,s*.537,.89,s*1.25);
  for(const z of [1.18,1.31])box(.027,.34,.095,glass,s*.552,1.02,s*z);
  rod([s*.57,.50,s*1.4],[s*.57,1.27,s*1.4],.016,brass);
 }
 // Tiny windshield wipers and the slatted lower body give scale at close zoom.
 for(const s of [-1,1])rod([-.28,.89,s*1.474],[-.13,1.12,s*1.474],.009,metal);
 for(const x of [-.515,.515])for(const y of [.54,.61,.68,.75])box(.013,.008,2.5,wood,x,y,0);
 const canvas=document.createElement('canvas');canvas.width=512;canvas.height=256;const ctx=canvas.getContext('2d');
 ctx.fillStyle='#183c31';ctx.fillRect(0,0,512,256);ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillStyle='#fff0c8';ctx.font='bold 31px Georgia';ctx.fillText('NEVERLAND',256,46);ctx.font='26px Georgia';ctx.fillText('120',256,107);ctx.font='25px Georgia';ctx.fillText('THE PLACES WE KEEP',256,173);ctx.font='21px Georgia';ctx.fillText('HONG KONG  ·  DING DING',256,224);
 const texture=new THREE.CanvasTexture(canvas);texture.colorSpace=THREE.SRGBColorSpace;texture.anisotropy=2;
 const sign=new THREE.MeshStandardMaterial({map:texture,roughness:.65,emissive:'#e6c797',emissiveMap:texture,emissiveIntensity:.22});
 function plaque(w,h,x,y,z,angle,v0,v1){const g=new THREE.PlaneGeometry(w,h),uv=g.attributes.uv;for(let i=0;i<uv.count;i++)uv.setY(i,v0+uv.getY(i)*(v1-v0));const o=mesh(g,sign,x,y,z);o.rotation.y=angle;}
 for(const s of [-1,1]){plaque(.81,.16,0,2.13,s*1.463,s<0?Math.PI:0,.67,1);plaque(.28,.13,0,.64,s*1.465,s<0?Math.PI:0,.47,.67);plaque(2.18,.20,s*.518,1.48,0,s*Math.PI/2,.22,.47);}
 // Wheels are the only continuously rotating parts; the body is material-batched.
 const wheelGroups=[];
 for(const z of [-.85,.85]){
  const axle=new THREE.Group();axle.userData.dynamic=true;axle.position.set(0,.16,z);root.add(axle);wheelGroups.push(axle);
  for(const x of [-.36,.36]){const o=new THREE.Mesh(new THREE.CylinderGeometry(.16,.16,.065,14),rubber);o.rotation.z=Math.PI/2;o.position.x=x;axle.add(o);const hub=new THREE.Mesh(new THREE.CylinderGeometry(.08,.08,.071,12),brass);hub.rotation.z=Math.PI/2;hub.position.x=x;axle.add(hub);}
 }
 // The trolley pole follows the actual wire position around bends.
 const pickup=new THREE.Mesh(new THREE.CylinderGeometry(.014,.018,1,8),metal);pickup.userData.dynamic=true;root.add(pickup);
 const shoe=new THREE.Mesh(new THREE.SphereGeometry(.037,8,6),brass);shoe.userData.dynamic=true;root.add(shoe);
 const pivot=new THREE.Vector3(0,2.40,.12),axis=new THREE.Vector3(0,1,0),delta=new THREE.Vector3();
 const stats=bake(root);
 return {root,stats,update(distance,contact){for(const w of wheelGroups)w.rotation.x=distance/.16;delta.copy(contact).sub(pivot);pickup.position.copy(pivot).add(contact).multiplyScalar(.5);pickup.scale.y=delta.length();pickup.quaternion.setFromUnitVectors(axis,delta.normalize());shoe.position.copy(contact);}};
}
