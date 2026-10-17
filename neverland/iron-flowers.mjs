import * as THREE from './vendor/three.module.js';
import {createPerson} from './people.mjs';

// One bounded performance. A full, three-dimensional crown rises from each strike.
export function ironFlowers(scene,{reducedMotion=false,stageY=3.49}={}) {
 const root=new THREE.Group();root.name='iron-flower-performance';scene.add(root);
 const gold=new THREE.MeshStandardMaterial({color:'#c69c60',roughness:.8});
 const coat=new THREE.MeshStandardMaterial({color:'#a49d83',roughness:1});
 const apron=new THREE.MeshStandardMaterial({color:'#473e35',roughness:1});
 const skin=new THREE.MeshStandardMaterial({color:'#d9b58e',roughness:1});
 const wood=new THREE.MeshStandardMaterial({color:'#664328',roughness:.9});
 function mesh(g,m,parent,x,y,z){const o=new THREE.Mesh(g,m);o.position.set(x,y,z);o.receiveShadow=true;parent.add(o);return o}
 const actor=createPerson({cloth:coat,variant:2,pose:'carry',scale:1});actor.position.set(-.35,stageY,.25);actor.rotation.y=.25;root.add(actor);
 const arm=actor.rightArm;
 const paddle=mesh(new THREE.CylinderGeometry(.018,.03,.92,10),wood,arm,.025,-.32,.38);paddle.rotation.x=-.9;
 const helper=createPerson({cloth:coat,variant:0,pose:'carry',scale:.97});helper.position.set(.55,stageY-.03,-.6);helper.rotation.y=2.6;root.add(helper);
 mesh(new THREE.CylinderGeometry(.18,.13,.22,12,1,true),apron,root,.65,stageY+.12,.3);
 const light=new THREE.PointLight('#ffb342',0,24,1.65);light.position.set(0,stageY+1.5,1);root.add(light);
 let seed=92;const random=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296};
 const count=innerWidth<750?1100:1800,segments=5,particles=[];
 for(let i=0;i<count;i++){
  const burst=i<count*.37?0:1;
  // Cover the entire horizontal circle in EACH strike, with varied upward angles.
  // This is a volume of ballistic arcs, not a flat fan or a camera-facing disc.
  const split=Math.ceil(count*.37),index=burst?i-split:i,total=burst?count-split:split;
  const azimuth=(index+random())/total*Math.PI*2;
  const elevation=.42+Math.pow(random(),1.3)*.96;
  const speed=(burst?6.2:5.0)*(.55+Math.pow(random(),.65)*.54);
  const radial=Math.cos(elevation)*speed;
  particles.push({born:(burst?2.35:.86)+random()*.13,vx:Math.cos(azimuth)*radial,vy:Math.sin(elevation)*speed,vz:Math.sin(azimuth)*radial,life:2.7+random()*1.3,size:1.5+random()*1.8,seed:random()*6.28,bright:.6+random()*.4});
 }
 const positions=new Float32Array(count*segments*2*3),colors=new Float32Array(positions.length);
 const heads=new Float32Array(count*3),headColors=new Float32Array(count*3),sizes=new Float32Array(count);
 const linesGeo=new THREE.BufferGeometry();linesGeo.setAttribute('position',new THREE.BufferAttribute(positions,3).setUsage(THREE.DynamicDrawUsage));linesGeo.setAttribute('color',new THREE.BufferAttribute(colors,3).setUsage(THREE.DynamicDrawUsage));
 const lineMat=new THREE.LineBasicMaterial({vertexColors:true,transparent:true,opacity:1,blending:THREE.AdditiveBlending,depthWrite:false,toneMapped:false});
 const trails=new THREE.LineSegments(linesGeo,lineMat);trails.frustumCulled=false;root.add(trails);
 const headGeo=new THREE.BufferGeometry();headGeo.setAttribute('position',new THREE.BufferAttribute(heads,3).setUsage(THREE.DynamicDrawUsage));headGeo.setAttribute('color',new THREE.BufferAttribute(headColors,3).setUsage(THREE.DynamicDrawUsage));headGeo.setAttribute('size',new THREE.BufferAttribute(sizes,1).setUsage(THREE.DynamicDrawUsage));
 const headMat=new THREE.ShaderMaterial({transparent:true,depthWrite:false,blending:THREE.AdditiveBlending,vertexColors:true,
  vertexShader:`attribute float size;varying vec3 sparkColor;void main(){sparkColor=color;vec4 mv=modelViewMatrix*vec4(position,1.);gl_PointSize=clamp(size*27./max(1.,-mv.z),.8,5.);gl_Position=projectionMatrix*mv;}`,
  fragmentShader:`varying vec3 sparkColor;void main(){float d=length(gl_PointCoord-.5)*2.;if(d>1.)discard;gl_FragColor=vec4(sparkColor,pow(1.-d,1.4));}`
 });
 const points=new THREE.Points(headGeo,headMat);points.frustumCulled=false;root.add(points);
 // A soft light pool binds the shower to the water without a white exposure flash.
 const poolMat=new THREE.ShaderMaterial({transparent:true,depthWrite:false,blending:THREE.AdditiveBlending,uniforms:{power:{value:0}},vertexShader:`varying vec2 v;void main(){v=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}`,fragmentShader:`varying vec2 v;uniform float power;void main(){float d=length((v-.5)*2.);float wave=.65+.35*sin(v.y*150.+sin(v.x*31.)*3.);float a=pow(max(0.,1.-d),2.)*power*wave;gl_FragColor=vec4(1.,.46,.08,a);}`});
 const pool=new THREE.Mesh(new THREE.PlaneGeometry(12,12),poolMat);pool.rotation.x=-Math.PI/2;pool.position.set(0,.025,.65);root.add(pool);
 const p=new THREE.Vector3();
 function position(q,t,out){
  const travel=(1-Math.exp(-t*.22))/.22;
  out.set(q.vx*travel,stageY+.95+q.vy*travel-1.48*t*t,.65+q.vz*travel);
  return out;
 }
 function reset(){trails.visible=points.visible=pool.visible=false;light.intensity=0;arm.rotation.x=-.5;actor.rotation.z=0}
 function update(time){
  trails.visible=points.visible=pool.visible=true;
  let energy=0;
  for(let i=0;i<count;i++){
   const q=particles[i],age=time-q.born,active=age>=0&&age<q.life;
   position(q,Math.max(0,age),p);
   const fade=active?Math.min(1,age/.045)*Math.pow(Math.max(0,1-age/q.life),.65)*Math.min(1,Math.max(0,p.y-.1)) :0;
   const glow=fade*q.bright*(reducedMotion?.7:1);
   energy+=glow;
   heads.set([p.x,p.y,p.z],i*3);sizes[i]=q.size;
   headColors.set([glow*5.5,glow*(2.5-age*.3),glow*.38],i*3);
   const length=.12+Math.min(Math.max(age,0),2.5)*.14;
   for(let j=0;j<segments;j++)for(let end=0;end<2;end++){
    const f=(j+end)/segments,t=Math.max(0,age-length*f),at=(i*segments*2+j*2+end)*3;
    position(q,t,p);positions[at]=p.x;positions[at+1]=p.y;positions[at+2]=p.z;
    const b=glow*(1-f)*1.5;colors[at]=b*2.3;colors[at+1]=b*(.82-age*.09);colors[at+2]=b*.075;
   }
  }
  for(const a of Object.values(linesGeo.attributes))a.needsUpdate=true;
  for(const a of Object.values(headGeo.attributes))a.needsUpdate=true;
  light.intensity=Math.min(115,energy*.17);poolMat.uniforms.power.value=Math.min(.32,energy*.0005);
  // Preparatory lift, a quick upward strike, then recovery, twice.
  const strike=time<1.65?time-.86:time-2.35;
  if(strike<0)arm.rotation.x=-.5-Math.sin(Math.max(0,1+strike/.8)*Math.PI*.5)*1.55;
  else arm.rotation.x=-.5+Math.exp(-strike*7)*1.2;
  actor.rotation.z=strike>=0?Math.sin(strike*7)*Math.exp(-strike*6)*.18:0;
 }
 reset();return {update,reset};
}
