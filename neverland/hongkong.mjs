import * as T from './vendor/three.module.js';
import {Reflector} from './vendor/addons/objects/Reflector.js';
import {bake} from './scene-resources.mjs';
import {createPerson} from './people.mjs';
import {buildHarbourSkyline} from './hongkong-skyline.mjs';

// A composed travel memory: historic Kowloon Walled City beside an open harbour.
// Architecture is actual geometry, consolidated once; only the ferry and water move.
export function buildHongkong({reducedMotion=false}={}){
 const root=new T.Group();root.name='hongkong';let region=root,seed=813;
 const rnd=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296;};
 const mat=(color,extra={})=>new T.MeshStandardMaterial({color,roughness:.83,...extra});
 const M={stone:mat('#a29c88'),road:mat('#72766e'),edge:mat('#b4b09d'),dark:mat('#293c3c'),frame:mat('#777c72'),pipe:mat('#8b7a62'),roof:mat('#677268'),green:mat('#23584c'),white:mat('#e7e1c9'),gold:mat('#c5aa69'),red:mat('#a34f3e'),blue:mat('#54737d'),black:mat('#273532'),wood:mat('#94785b'),glass:mat('#31484b',{metalness:.25,roughness:.32}),lit:mat('#e8c590',{emissive:'#dca25d',emissiveIntensity:.28}),cloth:mat('#bbada0'),foliage:mat('#55705b')};
 M.foliage.userData.seasonal=true;
 const plaster=['#b0aa95','#8a9184','#bcb39d','#86948b','#a19d8d','#a6ad9a','#8d9189'].map(c=>mat(c));
 // Fine procedural plaster mottling and rain streaks: no large surface textures.
 for(const material of [...plaster,M.stone]){material.onBeforeCompile=shader=>{
  shader.vertexShader=shader.vertexShader.replace('#include <common>','#include <common>\nvarying vec3 plasterP;').replace('#include <begin_vertex>','#include <begin_vertex>\nplasterP=position;');
  shader.fragmentShader=shader.fragmentShader.replace('#include <common>',`#include <common>
   varying vec3 plasterP;
   float patinaHash(vec3 p){return fract(sin(dot(p,vec3(127.1,311.7,74.7)))*43758.5453);}
   float patina(vec3 p){vec3 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);return mix(mix(mix(patinaHash(i),patinaHash(i+vec3(1,0,0)),f.x),mix(patinaHash(i+vec3(0,1,0)),patinaHash(i+vec3(1,1,0)),f.x),f.y),mix(mix(patinaHash(i+vec3(0,0,1)),patinaHash(i+vec3(1,0,1)),f.x),mix(patinaHash(i+vec3(0,1,1)),patinaHash(i+vec3(1,1,1)),f.x),f.y),f.z);}`)
   .replace('#include <color_fragment>','#include <color_fragment>\nfloat stain=patina(plasterP*vec3(7.,.65,7.));float grit=patina(plasterP*65.);diffuseColor.rgb*=.77+stain*.26+grit*.12;');
 };}
 const mesh=(g,m,x=0,y=0,z=0,p=region)=>{const o=new T.Mesh(g,m);o.position.set(x,y,z);o.castShadow=o.receiveShadow=true;p.add(o);return o;};
 const box=(w,h,d,m,x,y,z,p=region)=>mesh(new T.BoxGeometry(w,h,d),m,x,y,z,p);
 const cyl=(a,b,h,m,x,y,z,p=region,n=10)=>mesh(new T.CylinderGeometry(a,b,h,n),m,x,y,z,p);
 const tube=(points,r,m,p=region,n=12)=>mesh(new T.TubeGeometry(new T.CatmullRomCurve3(points.map(v=>new T.Vector3(...v))),n,r,5,false),m,0,0,0,p);
 const ring=(r,t,m,x,y,z,p=region)=>mesh(new T.TorusGeometry(r,t,5,16),m,x,y,z,p);
 const ell=(a,b,c,m,x,y,z,p=region)=>{const o=mesh(new T.SphereGeometry(1,10,7),m,x,y,z,p);o.scale.set(a,b,c);return o;};
 M.stone.userData.snowSurface=M.edge.userData.snowSurface=M.roof.userData.snowSurface=true;
 box(21,.55,20,M.stone,0,-.32,0);
 box(8.1,.28,6.1,M.road,-6.45,.12,6.95);box(21,.23,1.2,M.edge,0,.12,9.4);
 box(8.2,.3,.18,M.edge,-6.4,.1,3.91);box(.18,.3,6.1,M.edge,-2.37,.1,6.95);
 const skyline=buildHarbourSkyline();root.add(skyline.root);
 const district=new T.Group();root.add(district);region=district;
 // One shared sign atlas; signboards remain small physical objects.
 const atlas=document.createElement('canvas');atlas.width=1024;atlas.height=512;const ctx=atlas.getContext('2d');
 const signs=['永安茶餐廳','海記士多','榮興電器','金發麵家','涼茶','理髮','渡輪碼頭','STAR FERRY'];
 signs.forEach((s,i)=>{const x=(i%4)*256,y=Math.floor(i/4)*256;ctx.fillStyle=['#345953','#a65039','#d4c5a3','#3e5d67'][i%4];ctx.fillRect(x,y,256,256);ctx.strokeStyle='#d5bf8a';ctx.lineWidth=5;ctx.strokeRect(x+9,y+9,238,238);ctx.fillStyle=i===2?'#334c48':'#eddfbb';ctx.textAlign='center';ctx.textBaseline='middle';ctx.font=(i===7?'25px':'37px')+' serif';if(i<6){[...s].forEach((c,j)=>ctx.fillText(c,x+128,y+29+j*40));}else{ctx.fillText(s,x+128,y+128);}});
 const texture=new T.CanvasTexture(atlas);texture.colorSpace=T.SRGBColorSpace;
 const signMat=mat('#ffffff',{map:texture,emissive:'#c69f67',emissiveIntensity:.15,side:T.DoubleSide});
 function sign(i,w,h,x,y,z,p=region){const g=new T.PlaneGeometry(w,h),uv=g.attributes.uv;for(let j=0;j<uv.count;j++){uv.setXY(j,(uv.getX(j)+i%4)/4,(uv.getY(j)+1-Math.floor(i/4))/2);}return mesh(g,signMat,x,y,z,p);}
 let buildings=0,windows=0;
 // Different depths and floor heights form a nearly continuous mass, not a grid of towers.
 const cols=[[-8.9,2.35],[-6.55,2.25],[-4.25,2.35],[-1.85,2.35],[.55,2.25]];
 for(let row=0;row<4;row++)for(let col=0;col<5;col++){
  if(row===1&&col===2)continue; // Small, partly hidden communal courtyard.
  const [cx,cw]=cols[col],x=cx+(rnd()-.5)*.12,z=-8.25+row*2.12+(rnd()-.5)*.16,w=cw-.10,d=2.03+rnd()*.13,h=4.5+rnd()*2.8+(row===0?.7:0),body=plaster[(row*3+col)%plaster.length];buildings++;
  box(w,h,d,body,x,h/2+.19,z);
  // Patchwork enclosed bays and repairs break up the repeated concrete structure.
  for(let patch=0;patch<3;patch++){const ph=.7+rnd()*1.5,px=x-w*.27+rnd()*w*.54,py=.7+rnd()*(h-2.4);box(.45+rnd()*.5,ph,.04,plaster[(row+col+patch+3)%7],px,py+ph/2,z+d/2+.035);}
  box(w+.08,.10,d+.08,M.edge,x,h+.24,z);
  // Vertical render scars and subtly offset concrete floor bands.
  for(let f=.72;f<h-.3;f+=.67){box(w+.02,.045,d+.02,M.stone,x,f,z);}
  box(.08,h-.4,.032,M.pipe,x-w*.39,h/2,z+d/2+.035);
  const front=z+d/2+.04,side=x-w/2-.025;
  for(let level=.9;level<h-.3;level+=.67)for(let k=0;k<4;k++){
   const wx=x-w*.36+k*w*.24,lit=rnd()>.46,win=lit?M.lit:M.glass;windows++;
   box(.40,.45,.07,M.frame,wx,level,front);box(.33,.36,.085,win,wx,level,front+.017);
   box(.023,.37,.02,M.edge,wx,level,front+.065);box(.35,.025,.09,M.edge,wx,level-.19,front+.08);
   if(rnd()>.47){box(.22,.13,.19,M.edge,wx+.07,level-.31,front+.13);for(let a=0;a<3;a++)box(.16,.012,.014,M.frame,wx+.07,level-.35+a*.035,front+.235);}
   if(rnd()>.65){box(.48,.045,.28,M.stone,wx,level-.22,front+.16);for(let q=0;q<4;q++)box(.018,.31,.018,M.frame,wx-.18+q*.12,level-.04,front+.29);box(.45,.025,.025,M.frame,wx,level+.11,front+.29);if(rnd()>.45)box(.16,.25,.012,[M.cloth,M.blue,M.white][k%3],wx,level-.1,front+.32);}
  }
  // Side windows ensure orbiting reveals a finished miniature.
  for(let level=.9;level<h-.3;level+=.67)for(let k=0;k<3;k++){
   const wz=z-.64+k*.64;box(.07,.43,.40,M.frame,side,level,wz);box(.085,.34,.32,rnd()>.55?M.lit:M.glass,side-.018,level,wz);box(.023,.35,.025,M.edge,side-.069,level,wz);
   box(.07,.43,.40,M.frame,x+w/2+.02,level,wz);box(.085,.34,.32,M.glass,x+w/2+.04,level,wz);
  }
  for(let k=0;k<4;k++)for(let level=1;level<h-.3;level+=.8){box(.32,.38,.06,M.glass,x-w*.35+k*w*.23,level,z-d/2-.035);}
  // Roof parapets, corrugated shacks, reservoirs, antennas and laundry.
  box(w,.17,.055,M.stone,x,h+.35,z-d/2);box(.055,.17,d,M.stone,x-w/2,h+.35,z);box(.055,.17,d,M.stone,x+w/2,h+.35,z);
  const shackW=.7+rnd()*.6,shackH=.38+rnd()*.45,shackZ=z-.55+rnd()*.5;
  box(shackW,shackH,.74,plaster[(col+2)%7],x-.28,h+.26+shackH/2,shackZ);const roof=box(shackW+.17,.055,.86,[M.roof,M.frame,M.pipe][row%3],x-.28,h+.27+shackH,shackZ);roof.rotation.z=.025+rnd()*.08;
  for(let q=0;q<9;q++)box(.02,.02,.86,M.frame,x-.28-shackW*.48+q*shackW*.12,h+.31+shackH,shackZ);
  if((row+col)%3!==0){cyl(.21,.21,.32+col*.04,M.edge,x+.58,h+.47,z+.35);cyl(.23,.23,.04,M.frame,x+.58,h+.65+col*.02,z+.35);}
  else{box(.65,.18,.58,M.edge,x+.55,h+.4,z+.42);for(let q=0;q<4;q++)box(.55,.018,.025,M.frame,x+.55,h+.51,z+.2+q*.13);}
  if((row+col)%3!==1){cyl(.012,.012,1.05,M.frame,x+.55,h+.85,z-.53,district,6);for(let q=0;q<3;q++)box(.65-q*.12,.015,.014,M.frame,x+.55,h+1.27-q*.13,z-.53);}
  if((row+col)%2===0){tube([[x-.8,h+.85,z+.65],[x,h+.76,z+.65],[x+.8,h+.85,z+.65]],.009,M.frame);for(let q=0;q<4;q++){box(.23,.32,.012,[M.cloth,M.white,M.blue,M.red][q],x-.57+q*.32,h+.6,z+.65);}}
  // Plumbing bends on exposed front surfaces.
  tube([[x+w*.44,.3,front+.1],[x+w*.44,h*.65,front+.1],[x+w*.37,h*.65+.2,front+.1],[x+w*.37,h+.3,front+.1]],.025,M.pipe);
  if(row===3){for(let k=0;k<2;k++){const sx=x-.55+k*1.12;box(.88,.78,.08,M.dark,sx,.58,front+.05);box(.94,.09,.65,[M.green,M.red,M.blue][col%3],sx,1.08,front+.25);box(.8,.08,.4,M.wood,sx,.34,front+.27);for(let q=0;q<5;q++)box(.12,.14,.12,[M.gold,M.red,M.green][q%3],sx-.3+q*.15,.45,front+.28);}
   sign(col,.34,1.65,x+w*.43,2.2,front+.25);box(.09,1.8,.1,M.frame,x+w*.43,2.2,front+.14);
   for(let q=0;q<3;q++)tube([[x-w/2,1.5+q*.09,front+.32],[x,1.24+q*.1,front+.4],[x+w/2,1.53+q*.1,front+.32]],.008,M.black);
  }
 }
 district.scale.set(.58,.65,.58);district.position.set(-4.1,0,9.4);region=root;
 // Near-bank promenade and a second ferry landing, with the open channel between shores.
 for(let x=-10;x<10.4;x+=.55){box(.02,.015,1.1,M.stone,x,.245,9.4);cyl(.025,.025,.45,M.frame,x,.47,8.84);}
 tube([[-10,.7,8.84],[0,.7,8.84],[10.3,.7,8.84]],.022,M.frame);
 box(2.7,.2,2.5,M.edge,1.5,.18,7.7);box(2.7,.12,2,M.green,1.5,1.39,7.9);
 for(const x of [.3,2.7])for(const z of [7.1,8.7])box(.055,1.2,.055,M.white,x,.78,z);
 box(2.6,.3,.06,M.white,1.5,1.17,6.9);sign(7,1.6,.27,1.5,1.18,6.85).rotation.y=Math.PI;
 for(let i=0;i<20;i++){const x=-1.3+i*.56;const p=createPerson({cloth:[M.blue,M.cloth,M.red,M.white][i%4],variant:i,scale:.3,pose:i%4===0?'phone':'watch'});p.position.set(x,.24,9.3+(i%3)*.14);p.rotation.y=Math.PI+(i%3-1)*.4;root.add(p);}
 for(const x of [-1.8,4.5,9.5]){cyl(.055,.09,1.3,M.wood,x,.86,9.4);for(let j=0;j<14;j++){const a=j*2.4,r=.1+rnd()*.45;ell(.23,.29,.23,M.foliage,x+Math.cos(a)*r,1.55+rnd()*.5,9.4+Math.sin(a)*r);}}
 for(let i=0;i<22;i++){const x=-1.9+i*.57;box(.025,.7,.025,M.frame,x,.58,8.87);box(.10,.11,.10,M.lit,x,.96,8.87);}
 const fixed=bake(root);

 // Green/white double-ended ferry: pointed hull, open decks, wheelhouses and funnel.
 const boat=new T.Group();boat.name='star-ferry';
 function hull(){const shape=new T.Shape();shape.moveTo(-2.25,0);shape.bezierCurveTo(-2.12,-.51,-1.8,-.66,-1.25,-.66);shape.lineTo(1.25,-.66);shape.bezierCurveTo(1.8,-.66,2.12,-.51,2.25,0);shape.bezierCurveTo(2.12,.51,1.8,.66,1.25,.66);shape.lineTo(-1.25,.66);shape.bezierCurveTo(-1.8,.66,-2.12,.51,-2.25,0);return shape;}
 function deck(y,depth,m,s=1){const g=new T.ExtrudeGeometry(hull(),{depth,bevelEnabled:true,bevelSegments:2,steps:1,bevelSize:.035,bevelThickness:.035,curveSegments:14});g.rotateX(-Math.PI/2);const o=mesh(g,m,0,y,0,boat);o.scale.set(s,1,s);return o;}
 deck(.12,.29,M.green,.97);deck(.42,.055,M.white);deck(.91,.07,M.white,.96);deck(1.40,.065,M.white,.89);
 box(3.35,.08,1.14,M.green,0,1.02,0,boat);
 for(let side of [-1,1]){
  for(let i=0;i<12;i++){const x=-1.74+i*.316;box(.027,.44,.027,M.white,x,.68,side*.57,boat);box(.026,.34,.026,M.white,x,1.22,side*.54,boat);}
  box(3.65,.12,.035,M.white,0,1.08,side*.57,boat);box(3.7,.035,.035,M.green,0,.66,side*.61,boat);
  for(let i=0;i<10;i++){box(.22,.24,.025,M.glass,-1.42+i*.315,1.24,side*.535,boat);}
  for(const x of [-1.64,1.64]){const porthole=ring(.078,.014,M.gold,x,1.20,side*.556,boat);const inner=mesh(new T.CircleGeometry(.064,16),M.dark,x,1.20,side*.56,boat);if(side<0){porthole.rotation.y=Math.PI;inner.rotation.y=Math.PI;}}
  for(const x of [-1.5,-.7,.7,1.5]){const tire=ring(.11,.039,M.black,x,.36,side*.65,boat);if(side<0)tire.rotation.y=Math.PI;}
  for(const x of [-1.15,1.15]){const life=ring(.105,.025,M.red,x,1.08,side*.615,boat);if(side<0)life.rotation.y=Math.PI;}
  for(let i=0;i<7;i++){box(.29,.045,.24,M.wood,-1.1+i*.35,.58,side*.31,boat);box(.29,.14,.025,M.wood,-1.1+i*.35,.68,side*.4,boat);}
 }
 for(const x of [-1.68,1.68]){box(.47,.25,.72,M.white,x,1.58,0,boat);box(.49,.14,.68,M.glass,x,1.59,0,boat);box(.56,.055,.79,M.green,x,1.74,0,boat);cyl(.014,.014,.68,M.gold,x,1.98,0,boat,8);box(.28,.012,.012,M.gold,x,2.18,0,boat);}
 cyl(.17,.21,.54,M.gold,0,1.72,0,boat,16);cyl(.18,.18,.10,M.black,0,2.02,0,boat,16);
 // Open ends and curved railings retain the distinctive double-ended silhouette.
 for(const dir of [-1,1]){for(let i=0;i<9;i++){const a=-Math.PI/2+i*Math.PI/8,x=dir*(1.5+.55*Math.cos(a)),z=.49*Math.sin(a);box(.018,.32,.018,M.white,x,.62,z,boat);}tube(Array.from({length:13},(_,i)=>{const a=-Math.PI/2+i*Math.PI/12;return [dir*(1.5+.55*Math.cos(a)),.78,.49*Math.sin(a)];}),.02,M.white,boat);}
 for(let i=0;i<8;i++){const p=createPerson({cloth:[M.cloth,M.blue,M.red][i%3],variant:i,scale:.19,pose:'watch'});p.position.set(-1.2+(i%4)*.75,.48,i<4?-.35:.35);boat.add(p);}
 const ferryStats=bake(boat);boat.traverse(o=>{o.castShadow=false;});boat.userData.dynamic=true;root.add(boat);

 // One 320px reflection, six captures/second in detail only. No second canvas.
 const waterShader={...Reflector.ReflectorShader,uniforms:{...Reflector.ReflectorShader.uniforms,time:{value:0},detail:{value:0},waterTint:{value:new T.Color('#19637e')},sunGlow:{value:0}},vertexShader:`uniform mat4 textureMatrix;varying vec4 r;varying vec2 p;void main(){p=position.xy;r=textureMatrix*vec4(position,1.);gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}`,fragmentShader:`uniform sampler2D tDiffuse;uniform float time;uniform float detail;uniform vec3 waterTint;uniform float sunGlow;varying vec4 r;varying vec2 p;
 float hash(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}float noise(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);return mix(mix(hash(i),hash(i+vec2(1.,0.)),f.x),mix(hash(i+vec2(0.,1.)),hash(i+vec2(1.,1.)),f.x),f.y);}
 void main(){float n=noise(vec2(p.x*2.+time*.08,p.y*19.-time*.32)),n2=noise(vec2(p.x*4.-time*.13,p.y*32.+time*.16));vec2 uv=r.xy/r.w+vec2((n-.5)*.008,(n2-.5)*.004);vec3 ref=texture2D(tDiffuse,uv).rgb;float light=pow(max(0.,n*.6+n2*.4-.35),3.);vec3 col=waterTint*(.75+light*.8)+ref*detail*.24;float sunset=exp(-pow((p.x-4.+p.y*.18)/2.2,2.))*pow(max(0.,n),3.);col+=vec3(.7,.26,.05)*sunset*sunGlow;col+=vec3(.14,.20,.18)*light;gl_FragColor=vec4(col,1.);}`};
 const water=new Reflector(new T.PlaneGeometry(21,20),{textureWidth:320,textureHeight:320,multisample:0,clipBias:.003,shader:waterShader});water.rotation.x=-Math.PI/2;water.position.set(0,.055,0);root.add(water);water.userData.dynamic=true;water.material.userData.worldWater=true;
 let detail=false,captures=0,lastCapture=0,capturing=false;const capture=water.onBeforeRender;
 water.onBeforeRender=function(renderer,scene,camera){if(!detail||capturing||scene.overrideMaterial)return;const now=performance.now();if(now-lastCapture<166)return;lastCapture=now;capturing=true;try{capture.call(this,renderer,scene,camera);captures++;}finally{capturing=false;}};
 // Fixed-size ribbons trail the actual route; no particles or meshes allocated per replay.
 const wakeCount=72,wakePos=new Float32Array(wakeCount*2*3),wakeAlpha=new Float32Array(wakeCount*2),wakeIndices=[];
 for(let i=0;i<wakeCount-1;i++){const n=i*2;wakeIndices.push(n,n+1,n+2,n+1,n+3,n+2);}
 const wakes=[-1,1].map(side=>{const g=new T.BufferGeometry();g.setAttribute('position',new T.BufferAttribute(wakePos.slice(),3));g.setAttribute('alpha',new T.BufferAttribute(wakeAlpha.slice(),1));g.setIndex(wakeIndices);const m=new T.ShaderMaterial({transparent:true,depthWrite:false,side:T.DoubleSide,uniforms:{},vertexShader:'attribute float alpha;varying float a;void main(){a=alpha;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}',fragmentShader:'varying float a;void main(){gl_FragColor=vec4(.67,.81,.73,a);}' });const o=new T.Mesh(g,m);o.frustumCulled=false;root.add(o);return {o,side};});
 const route=t=>new T.Vector3(0.3+5.8*t,0,2.6-3.4*t+.4*Math.sin(t*Math.PI));
 let clock=0,progress=0,active=false;
 function place(t){const p=route(t),angle=Math.atan2(-3.4+.4*Math.PI*Math.cos(t*Math.PI),5.8);boat.position.set(p.x,.01+(reducedMotion?0:Math.sin(clock*1.2)*.018),p.z);boat.rotation.y=-angle;boat.rotation.z=reducedMotion?0:Math.sin(clock*.9)*.007;}
 function wake(t,fade=1){for(const {o,side} of wakes){const pos=o.geometry.attributes.position,alpha=o.geometry.attributes.alpha;for(let i=0;i<wakeCount;i++){const age=i/(wakeCount-1),u=Math.max(0,t-.30-age*.46),p=route(u),tangent=new T.Vector3(5.8,0,-3.4+.4*Math.PI*Math.cos(u*Math.PI)).normalize(),width=.47+age*.80;for(let edge=0;edge<2;edge++){const offset=side*(width+edge*(.055+age*.17)),j=i*2+edge;pos.setXYZ(j,p.x-tangent.z*offset,.075+edge*.001,p.z+tangent.x*offset);alpha.setX(j,active&&u>0?Math.pow(1-age,1.7)*.24*fade*(.75+.25*Math.sin(i*2.1)):0);}}pos.needsUpdate=true;alpha.needsUpdate=true;o.visible=active;}}
 place(0);wake(0);
 return {root,stats:{triangles:fixed.triangles+ferryStats.triangles,walking:0},setDetail(v){detail=v;water.material.uniforms.detail.value=v?1:0;lastCapture=0;},update(dt){clock+=dt;water.material.uniforms.time.value=clock;place(progress);},show:{reset(keep=false){active=false;if(!keep)progress=0;place(progress);wake(progress);},update(t){active=t<8;progress=Math.min(1,t/8);place(progress);wake(progress,Math.min(1,(8-t)*2));}},diagnostics(){return {landmarks:skyline.landmarks,shoreCount:2,buildings,windows,progress,active,ferryX:boat.position.x,ferryZ:boat.position.z,reflection:{size:320,captures,active:detail},wakeVertices:wakeCount*4};},dispose(){water.dispose();}};
}
