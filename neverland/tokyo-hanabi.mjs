import * as T from './vendor/three.module.js';

// Bounded spherical shells, not random confetti: chrysanthemum, peony and a gold crown.
export function createHanabi(parent,{reducedMotion=false,onLight=()=>{}}={}){
 const root=new T.Group();root.name='Tokyo nine-second hanabi';parent.add(root);root.visible=false;
 const shells=[
  {at:1.25,x:-1.9,y:11.3,z:-6.3,speed:3.3,life:2.45,type:'chrysanthemum',color:'#ffd397',core:'#d390f1'},
  {at:2.7,x:5.8,y:12.0,z:-7.1,speed:3.0,life:2.2,type:'peony',color:'#f991b5',core:'#a9e2d1'},
  {at:3.65,x:-4.8,y:13.8,z:-7.7,speed:2.65,life:2.35,type:'peony',color:'#b5b6ff',core:'#ffcb85'},
  {at:4.55,x:1.2,y:14.2,z:-7.3,speed:3.35,life:4.1,type:'crown',color:'#ffd58b',core:'#f4ddbb'},
  {at:5.0,x:6.2,y:13.1,z:-5.9,speed:2.7,life:3.65,type:'crown',color:'#ffe2a9',core:'#f6a17f'}
 ];
 const perShell=innerWidth<750?190:290,segments=9,count=perShell*shells.length;
 const particles=[];let seed=872;const rand=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296;};
 shells.forEach((s,j)=>{s.rgb=new T.Color(s.color);s.coreRGB=new T.Color(s.core);for(let i=0;i<perShell;i++){
  const core=i%5===0,k=core?Math.floor(i/5):i,amount=core?Math.ceil(perShell/5):perShell;
  const vy=1-2*(k+.5)/amount,az=k*2.399963229728653+rand()*.07,radial=Math.sqrt(1-vy*vy),speed=s.speed*(core?.45:1)*(.97+rand()*.06);
  particles.push({shell:j,vx:Math.cos(az)*radial*speed,vy:vy*speed,vz:Math.sin(az)*radial*speed,life:s.life*(.90+rand()*.10),core,phase:rand()*6.28,size:1.7+rand()*1.2});
 }});
 const positions=new Float32Array(count*segments*6),colors=new Float32Array(positions.length),heads=new Float32Array(count*3),headColors=new Float32Array(count*3),sizes=new Float32Array(count);
 const lineGeo=new T.BufferGeometry();lineGeo.setAttribute('position',new T.BufferAttribute(positions,3).setUsage(T.DynamicDrawUsage));lineGeo.setAttribute('color',new T.BufferAttribute(colors,3).setUsage(T.DynamicDrawUsage));
 const lineMat=new T.LineBasicMaterial({vertexColors:true,transparent:true,blending:T.AdditiveBlending,depthWrite:false,toneMapped:false});const trails=new T.LineSegments(lineGeo,lineMat);trails.frustumCulled=false;root.add(trails);
 const pointGeo=new T.BufferGeometry();pointGeo.setAttribute('position',new T.BufferAttribute(heads,3).setUsage(T.DynamicDrawUsage));pointGeo.setAttribute('color',new T.BufferAttribute(headColors,3).setUsage(T.DynamicDrawUsage));pointGeo.setAttribute('size',new T.BufferAttribute(sizes,1));
 const pointMat=new T.ShaderMaterial({vertexColors:true,transparent:true,depthWrite:false,blending:T.AdditiveBlending,toneMapped:false,vertexShader:`attribute float size;varying vec3 c;void main(){c=color;gl_PointSize=size;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}`,fragmentShader:`varying vec3 c;void main(){float r=length(gl_PointCoord-.5)*2.;if(r>1.)discard;gl_FragColor=vec4(c,pow(1.-r,1.6));}`});
 const points=new T.Points(pointGeo,pointMat);points.frustumCulled=false;root.add(points);particles.forEach((p,i)=>sizes[i]=p.size*(devicePixelRatio>1?1.2:1));
 const rocketPos=new Float32Array(shells.length*12*6),rocketColors=new Float32Array(rocketPos.length),rocketGeo=new T.BufferGeometry();rocketGeo.setAttribute('position',new T.BufferAttribute(rocketPos,3).setUsage(T.DynamicDrawUsage));rocketGeo.setAttribute('color',new T.BufferAttribute(rocketColors,3).setUsage(T.DynamicDrawUsage));const rockets=new T.LineSegments(rocketGeo,lineMat);rockets.frustumCulled=false;root.add(rockets);
 // A few translucent puffs drift behind the stars; there is no persistent particle spawning.
 const c=document.createElement('canvas');c.width=c.height=64;const cx=c.getContext('2d'),gradient=cx.createRadialGradient(32,32,0,32,32,32);gradient.addColorStop(0,'rgba(210,210,215,.45)');gradient.addColorStop(.4,'rgba(200,200,210,.18)');gradient.addColorStop(1,'rgba(190,190,205,0)');cx.fillStyle=gradient;cx.fillRect(0,0,64,64);const smokeTex=new T.CanvasTexture(c);const smoke=shells.map(s=>{const m=new T.SpriteMaterial({map:smokeTex,color:'#7e879b',transparent:true,opacity:0,depthWrite:false});const sprite=new T.Sprite(m);sprite.position.set(s.x,s.y,s.z-1);sprite.scale.setScalar(3);root.add(sprite);return sprite;});
 const light=new T.PointLight('#ffd4a1',0,32,2);light.position.set(2,8,-2);root.add(light);
 let progress=0,live=0;const p=new T.Vector3(),rgb=new T.Color(),lit=new T.Color(),amber=new T.Color('#e6983d');
 function pos(q,s,t,out){const drag=s.type==='crown'?.57:.76,travel=(1-Math.exp(-drag*t))/drag;out.set(s.x+q.vx*travel+.10*t*t,s.y+q.vy*travel-(s.type==='crown'?.43:.28)*t*t,s.z+q.vz*travel);return out;}
 function update(time){root.visible=true;progress=T.MathUtils.clamp(time/9,0,1);live=0;let energy=0;lit.setRGB(0,0,0);
  for(let i=0;i<count;i++){const q=particles[i],s=shells[q.shell],age=time-s.at,active=age>=0&&age<q.life;pos(q,s,Math.max(0,age),p);heads[i*3]=p.x;heads[i*3+1]=p.y;heads[i*3+2]=p.z;
   const fade=active?Math.min(1,age/.045)*Math.pow(1-age/q.life,.6)*Math.min(1,(q.life-age)/.4):0;
   const twinkle=s.type==='crown'&&age>1.45?.65+.35*Math.sin(age*19+q.phase):1;const power=fade*twinkle*(reducedMotion?.65:1);if(active)live++;
   rgb.copy(q.core?s.coreRGB:s.rgb);if(s.type==='chrysanthemum'&&age>1.15)rgb.lerp(s.coreRGB,Math.min(.65,(age-1.15)*.65));if(s.type==='crown')rgb.lerp(amber,Math.max(0,age/q.life-.3));
   headColors[i*3]=rgb.r*power*7;headColors[i*3+1]=rgb.g*power*7;headColors[i*3+2]=rgb.b*power*7;
   const tail=s.type==='peony'?.09:s.type==='crown'?Math.min(1.05,age*.75):Math.min(.65,age*.80);
   for(let j=0;j<segments;j++)for(let e=0;e<2;e++){const f=(j+e)/segments,at=(i*segments*2+j*2+e)*3,t=Math.max(0,age-tail*f);pos(q,s,t,p);positions[at]=p.x;positions[at+1]=p.y;positions[at+2]=p.z;const b=power*(1-f)**1.4*(s.type==='peony'?.35:1.55);colors[at]=rgb.r*b;colors[at+1]=rgb.g*b;colors[at+2]=rgb.b*b;}
   energy+=power;lit.r+=rgb.r*power;lit.g+=rgb.g*power;lit.b+=rgb.b*power;
  }
  shells.forEach((s,i)=>{const u=(time-(s.at-1.08))/.93,visible=u>=0&&u<=1;for(let j=0;j<12;j++)for(let e=0;e<2;e++){const f=(j+e)/12,t=T.MathUtils.clamp(u-f*.18,0,1),at=(i*24+j*2+e)*3;rocketPos[at]=T.MathUtils.lerp(8.1,s.x,t);rocketPos[at+1]=.25+(s.y-.25)*(1-(1-t)**1.55);rocketPos[at+2]=T.MathUtils.lerp(-6.4,s.z,t);const b=visible?(1-f)*2.8:0;rocketColors[at]=b;rocketColors[at+1]=b*.58;rocketColors[at+2]=b*.18;}
   const age=time-s.at;smoke[i].material.opacity=age>0?Math.min(.20,age*.10)*Math.max(0,1-age/4):0;smoke[i].position.x=s.x+Math.max(0,age)*.26;smoke[i].scale.setScalar(2.2+Math.max(0,age)*1.45);
  });
  for(const a of [lineGeo.attributes.position,lineGeo.attributes.color,pointGeo.attributes.position,pointGeo.attributes.color,rocketGeo.attributes.position,rocketGeo.attributes.color])a.needsUpdate=true;
  if(energy>0)lit.multiplyScalar(1/energy);else lit.set('#ffd39a');light.color.copy(lit);light.intensity=Math.min(9,energy*.018);onLight(Math.min(.42,energy*.00075),lit);
 }
 function reset(done=false){root.visible=false;light.intensity=0;progress=done?1:0;live=0;onLight(0,amber);}
 return {reset,update,diagnostics(){return {progress,active:root.visible,liveParticles:live,capacity:count,bursts:shells.length};}};
}
