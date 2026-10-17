import * as THREE from './vendor/three.module.js';

// "Second to the right, and straight on till morning."
// The brightest star in the dusk / night sky of the map view. Clicking it sends a small fairy light from the star
// over every city tile, trailing fairy dust, then a golden shower settles over the whole map and she flies home.
// One sprite + one Points buffer, created once and reused; nothing runs while the star is idle.
const WORDS={
 zh:{label:'右边第二颗星——点一下',caption:'右边第二颗星，一直飞到天亮。',toast:'叮铃——一阵仙尘落在了城里'},
 en:{label:'The second star to the right — tap it',caption:'Second to the right, and straight on till morning.',toast:'Tinkle — fairy dust drifts over the city'}
};
function canvasTexture(size,draw){const c=document.createElement('canvas');c.width=c.height=size;draw(c.getContext('2d'),size);const t=new THREE.CanvasTexture(c);t.colorSpace=THREE.SRGBColorSpace;return t;}

export function createSecondStar({scene,camera,cityGroups,reduced=false,getLanguage=()=>'zh'}){
 const body=document.body,host=document.querySelector('#app');
 const star=document.createElement('button');star.type='button';star.id='secondStar';star.className='second-star';
 star.innerHTML='<span class="star-core" aria-hidden="true"></span><span class="star-caption" aria-hidden="true"></span>';host.append(star);
 const toastEl=document.createElement('p');toastEl.id='starToast';toastEl.setAttribute('role','status');host.append(toastEl);
 const words=()=>WORDS[getLanguage()==='en'?'en':'zh'];
 let lang='';function relabel(){const l=getLanguage();if(l===lang)return;lang=l;star.setAttribute('aria-label',words().label);star.querySelector('.star-caption').textContent=words().caption;}

 // Fairy light and dust (world space, additive, bright enough to bloom).
 const flare=canvasTexture(128,(g,s)=>{const c=s/2,r=g.createRadialGradient(c,c,0,c,c,c);r.addColorStop(0,'rgba(255,255,255,1)');r.addColorStop(.1,'rgba(255,247,214,.95)');r.addColorStop(.32,'rgba(255,226,160,.25)');r.addColorStop(1,'rgba(255,220,150,0)');g.fillStyle=r;g.fillRect(0,0,s,s);g.globalCompositeOperation='lighter';
  for(const [w,l,a] of [[3,60,0],[3,60,Math.PI/2],[1.5,30,Math.PI/4],[1.5,30,-Math.PI/4]]){g.save();g.translate(c,c);g.rotate(a);const lg=g.createLinearGradient(-l,0,l,0);lg.addColorStop(0,'rgba(255,240,200,0)');lg.addColorStop(.5,'rgba(255,250,235,.95)');lg.addColorStop(1,'rgba(255,240,200,0)');g.fillStyle=lg;g.beginPath();g.ellipse(0,0,l,w,0,0,Math.PI*2);g.fill();g.restore();}});
 const dot=canvasTexture(64,(g,s)=>{const r=g.createRadialGradient(32,32,0,32,32,32);r.addColorStop(0,'rgba(255,255,255,1)');r.addColorStop(.4,'rgba(255,255,255,.8)');r.addColorStop(1,'rgba(255,255,255,0)');g.fillStyle=r;g.fillRect(0,0,s,s);});
 const tink=new THREE.Sprite(new THREE.SpriteMaterial({map:flare,color:new THREE.Color(2.6,2.25,1.5),transparent:true,depthWrite:false,depthTest:false,blending:THREE.AdditiveBlending}));
 tink.visible=false;tink.renderOrder=20;tink.userData.dynamic=true;scene.add(tink);
 const N=1400,pos=new Float32Array(N*3),col=new Float32Array(N*3),vel=new Float32Array(N*3),life=new Float32Array(N),age=new Float32Array(N),phase=new Float32Array(N),base=new Float32Array(N*3);
 const geo=new THREE.BufferGeometry();geo.setAttribute('position',new THREE.BufferAttribute(pos,3));geo.setAttribute('color',new THREE.BufferAttribute(col,3));
 const dust=new THREE.Points(geo,new THREE.PointsMaterial({size:4.6,map:dot,vertexColors:true,transparent:true,depthWrite:false,blending:THREE.AdditiveBlending,sizeAttenuation:false}));
 dust.frustumCulled=false;dust.visible=false;dust.renderOrder=19;dust.userData.dynamic=true;scene.add(dust);
 const COLORS=[[1,.86,.48],[1,.93,.7],[1,.78,.4],[.95,.95,1],[1,.82,.9]];let next=0,alive=0;
 function spawn(x,y,z,vx,vy,vz,l,ci){const i=next;next=(next+1)%N;const j=i*3;pos[j]=x;pos[j+1]=y;pos[j+2]=z;vel[j]=vx;vel[j+1]=vy;vel[j+2]=vz;life[i]=l;age[i]=0;phase[i]=Math.random()*6.28;const c=COLORS[ci??(Math.random()*COLORS.length|0)];base[j]=c[0];base[j+1]=c[1];base[j+2]=c[2];}

 const ray=new THREE.Raycaster(),ndc=new THREE.Vector2(),plane=new THREE.Plane(new THREE.Vector3(0,1,0),-12),tmp=new THREE.Vector3();
 function anchor(out){const r=star.querySelector('.star-core').getBoundingClientRect();ndc.set((r.left+r.width/2)/innerWidth*2-1,1-(r.top+r.height/2)/innerHeight*2);ray.setFromCamera(ndc,camera);return ray.ray.intersectPlane(plane,out)||out.set(0,12,0);}
 const F={active:false,phase:'',t:0,dur:0,curve:null,emit:0,from:new THREE.Vector3(),last:new THREE.Vector3(),bounds:null,clock:0};
 function tiles(){return Object.values(cityGroups).filter(g=>g.visible).map(g=>g.getWorldPosition(new THREE.Vector3()));}
 function route(start){const left=tiles(),pts=[start.clone()];let prev=start.clone();
  while(left.length){let k=0;for(let i=1;i<left.length;i++)if(left[i].distanceToSquared(prev)<left[k].distanceToSquared(prev))k=i;const c=left.splice(k,1)[0];
   const dir=tmp.copy(c).sub(prev).setY(0);if(dir.lengthSq()<1e-3)dir.set(1,0,0);dir.normalize();const side=pts.length%4?1:-1,perp=new THREE.Vector3(-dir.z,0,dir.x).multiplyScalar(2.6*side);
   pts.push(c.clone().addScaledVector(dir,-4.2).add(perp).setY(8.6),c.clone().addScaledVector(dir,4.2).sub(perp).setY(6.8));prev=c;}
  return pts;}
 function showToast(){toastEl.textContent=words().toast;toastEl.classList.add('on');clearTimeout(showToast.t);showToast.t=setTimeout(()=>toastEl.classList.remove('on'),3200);}
 function flash(){star.classList.remove('flash');void star.offsetWidth;star.classList.add('flash');}
 function fire(){if(F.active||!star.classList.contains('on'))return;showToast();flash();if(reduced)return;
  const start=anchor(new THREE.Vector3()),pts=route(start),centers=tiles();
  F.curve=new THREE.CatmullRomCurve3(pts,false,'centripetal');F.dur=1.2+1.25*centers.length;F.t=0;F.emit=0;F.phase='tour';F.active=true;F.last.copy(start);
  const xs=centers.map(v=>v.x),zs=centers.map(v=>v.z);F.bounds=[Math.min(...xs)-9,Math.max(...xs)+9,Math.min(...zs)-9,Math.max(...zs)+9];
  tink.visible=dust.visible=true;star.classList.add('away');}
 function abort(){if(!F.active)return;F.active=false;tink.visible=false;dust.visible=false;life.fill(0);star.classList.remove('away');}
 star.addEventListener('click',fire);

 let wasOn=false,hinted=false;
 function update(dt){relabel();
  const map=!body.classList.contains('city-detail')&&!body.classList.contains('editing')&&!body.classList.contains('performing'),time=body.dataset.time,want=map&&(time==='night'||time==='dusk');
  if(want!==wasOn){wasOn=want;star.classList.toggle('on',want);star.tabIndex=want?0:-1;star.setAttribute('aria-hidden',String(!want));
   if(want&&!hinted){hinted=true;star.classList.add('hint');setTimeout(()=>star.classList.remove('hint'),6500);}}
  if(!map)abort();
  if(!F.active)return;
  F.clock+=dt;const span=camera.top-camera.bottom,flick=.82+Math.sin(F.clock*31)*.1+Math.sin(F.clock*17)*.08;
  if(F.phase==='tour'){F.t+=dt;const u=Math.min(1,F.t/F.dur);F.curve.getPointAt(u,tink.position);
   tink.material.opacity=Math.min(1,u*10)*flick;tink.scale.setScalar(span*.06*flick);
   F.emit+=dt*230;const n0=F.emit;while(F.emit>=1){F.emit--;const k=n0>1?F.emit/n0:0;tmp.lerpVectors(tink.position,F.last,k);spawn(tmp.x+(Math.random()-.5)*.5,tmp.y+(Math.random()-.5)*.5,tmp.z+(Math.random()-.5)*.5,(Math.random()-.5)*.6,-.3-Math.random()*.6,(Math.random()-.5)*.6,2.2+Math.random()*1.8);}F.last.copy(tink.position);
   if(u>=1){F.phase='home';F.t=0;F.from.copy(tink.position);const [x0,x1,z0,z1]=F.bounds;
    for(let i=0;i<520;i++)spawn(x0+Math.random()*(x1-x0),8+Math.random()*5,z0+Math.random()*(z1-z0),(Math.random()-.5)*.3,-.6-Math.random()*.6,(Math.random()-.5)*.3,3.2+Math.random()*2.6,Math.random()*3|0);}}
  else if(F.phase==='home'){F.t+=dt;const u=Math.min(1,F.t/1.4),e=u*u*(3-2*u);tink.position.lerpVectors(F.from,anchor(tmp),e);tink.position.y+=Math.sin(u*Math.PI)*2.5;
   tink.material.opacity=(1-u*.7)*flick;tink.scale.setScalar(span*.06*flick*(1-u*.6));
   if(u>=1){F.phase='settle';F.t=0;tink.visible=false;star.classList.remove('away');flash();}}
  else{F.t+=dt;if(F.t>6){abort();return;}}
  alive=0;
  for(let i=0;i<N;i++){const j=i*3;if(life[i]<=0){col[j]=col[j+1]=col[j+2]=0;continue;}age[i]+=dt;const a=age[i]/life[i];if(a>=1){life[i]=0;col[j]=col[j+1]=col[j+2]=0;continue;}alive++;
   vel[j+1]-=dt*.12;pos[j]+=(vel[j]+Math.sin(F.clock*1.3+phase[i])*.25)*dt;pos[j+1]+=vel[j+1]*dt;pos[j+2]+=vel[j+2]*dt;if(pos[j+1]<.4){pos[j+1]=.4;vel[j+1]=0;vel[j]*=.9;vel[j+2]*=.9;}
   const f=Math.min(1,a*10)*(1-a*a)*(.55+.45*Math.sin(F.clock*9+phase[i]*3))*2.1;col[j]=base[j]*f;col[j+1]=base[j+1]*f;col[j+2]=base[j+2]*f;}
  geo.attributes.position.needsUpdate=geo.attributes.color.needsUpdate=true;
 }
 relabel();
 return {update,fire,abort,stats:()=>({visible:star.classList.contains('on'),active:F.active,phase:F.phase,dust:alive}),dispose(){abort();star.remove();toastEl.remove();scene.remove(tink,dust);geo.dispose();dust.material.dispose();tink.material.dispose();flare.dispose();dot.dispose();}};
}
