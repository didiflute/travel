import * as T from './vendor/three.module.js';
import {bake} from './scene-resources.mjs';
import {createPerson} from './people.mjs';
import {createHanabi} from './tokyo-hanabi.mjs';

// A composed memory of Asakusa, Showa shopfronts and Marunouchi, not a street map.
export function buildTokyo({reducedMotion=false}={}){
 const root=new T.Group();root.name='Tokyo — lantern streets and summer fireworks';
 const mat=(color,extra={})=>new T.MeshStandardMaterial({color,roughness:.8,...extra});
 const red=mat('#983f32'),redDark=mat('#672b26'),white=mat('#d2c6af'),wood=mat('#5a4034'),roof=mat('#4e555b',{roughness:.62,side:T.DoubleSide}),edge=mat('#77797a'),gold=mat('#ac9462',{metalness:.35,roughness:.46}),stone=mat('#a8a397'),paving=mat('#7f8585'),soil=mat('#777e69'),brick=mat('#8d4a3c'),copper=mat('#3d595b',{metalness:.28,roughness:.63}),metal=mat('#36464b'),leaf=mat('#556c51'),glass=mat('#b9a079',{emissive:'#ffc978',emissiveIntensity:.42,roughness:.38}),lamp=mat('#ffe1a4',{emissive:'#ffc16c',emissiveIntensity:1.8}),paper=mat('#c34b35',{emissive:'#ff6832',emissiveIntensity:.25});
 for(const m of [roof,edge,stone,paving,soil])m.userData.snowSurface=true;
 leaf.userData.seasonal=true;
 // Surface patterns need no image downloads and survive material batching.
 for(const [m,type] of [[brick,'brick'],[paving,'paving']]){m.onBeforeCompile=s=>{s.vertexShader='varying vec3 vLocal;\n'+s.vertexShader;s.vertexShader=s.vertexShader.replace('#include <begin_vertex>','#include <begin_vertex>\nvLocal=position;');s.fragmentShader='varying vec3 vLocal;\n'+s.fragmentShader;const pattern=type==='brick'?`vec2 q=vec2(vLocal.x*12.+mod(floor(vLocal.y*17.),2.)*.5,vLocal.y*17.);vec2 f=fract(q);float joint=step(.065,f.x)*step(.10,f.y);diffuseColor.rgb*=mix(.67,1.,joint);`:`vec2 f=fract(vLocal.xz*3.);float seam=step(.025,min(f.x,f.y));diffuseColor.rgb*=mix(.72,1.,seam);`;s.fragmentShader=s.fragmentShader.replace('#include <color_fragment>','#include <color_fragment>\n'+pattern);};m.customProgramCacheKey=()=> 'tokyo-'+type;}
 const mesh=(g,m,x=0,y=0,z=0,p=root)=>{const o=new T.Mesh(g,m);o.position.set(x,y,z);o.castShadow=o.receiveShadow=true;p.add(o);return o;};
 const box=(w,h,d,m,x,y,z,p=root)=>mesh(new T.BoxGeometry(w,h,d),m,x,y,z,p);
 const rod=(a,b,r,m=wood,p=root)=>{const av=new T.Vector3(...a),bv=new T.Vector3(...b),o=mesh(new T.CylinderGeometry(r,r,av.distanceTo(bv),7),m,...av.clone().add(bv).multiplyScalar(.5).toArray(),p);o.quaternion.setFromUnitVectors(new T.Vector3(0,1,0),bv.sub(av).normalize());return o;};
 const tube=(pts,r,m=wood)=>mesh(new T.TubeGeometry(new T.CatmullRomCurve3(pts.map(p=>new T.Vector3(...p))),10,r,5,false),m);
 const rand=(a,b)=>{const n=Math.sin(a*127.1+b*311.7)*43758.5453;return n-Math.floor(n);};
 box(21,.55,20,stone,0,-.35,0);box(16.3,.16,19.8,paving,-2.25,-.005,0);
 box(.38,.42,19.8,stone,6.05,.09,0);box(.18,.28,19.8,white,5.87,.31,0);
 // One sign atlas: original generic shop signs, no photo or billboard facade.
 const texts=['雷門','金龍山','純喫茶','珈琲','古書','浅草','甘味処','写真館','蕎麦','東京駅','仲見世','小料理'];
 const atlas=document.createElement('canvas');atlas.width=1024;atlas.height=384;const ac=atlas.getContext('2d');
 texts.forEach((text,i)=>{const x=i%4*256,y=Math.floor(i/4)*128;ac.fillStyle=i===1?'#31483b':i===2?'#69352d':'#e2d2ae';ac.fillRect(x,y,256,128);ac.strokeStyle='#a98e5e';ac.lineWidth=5;ac.strokeRect(x+8,y+8,240,112);ac.fillStyle=i===1||i===2?'#e5c77f':'#453831';ac.textAlign='center';ac.textBaseline='middle';ac.font='54px Yu Mincho,SimSun,serif';ac.fillText(text,x+128,y+65,226);});
 const atlasTex=new T.CanvasTexture(atlas);atlasTex.colorSpace=T.SRGBColorSpace;const signMat=mat('#fff',{map:atlasTex,emissive:'#fff',emissiveMap:atlasTex,emissiveIntensity:.14});
 function sign(id,w,h,x,y,z,rotation=0){const g=new T.PlaneGeometry(w,h),uv=g.attributes.uv;for(let i=0;i<uv.count;i++)uv.setXY(i,(id%4+uv.getX(i))/4,1-(Math.floor(id/4)+1-uv.getY(i))/3);const s=mesh(g,signMat,x,y,z);s.rotation.y=rotation;box(w+.06,h+.05,.07,wood,x,y,z-.045);return s;}
 const roofLines=[];
 function hip(x,y,z,w,d,rise){
  const verts=[],indices=[];const patch=(fn,nu,nv)=>{const base=verts.length/3;for(let j=0;j<=nv;j++)for(let i=0;i<=nu;i++)verts.push(...fn(i/nu,j/nv));for(let j=0;j<nv;j++)for(let i=0;i<nu;i++){const k=base+j*(nu+1)+i;indices.push(k,k+1,k+nu+1,k+1,k+nu+2,k+nu+1);}};
  const surf=(u,v,s)=>[x+(u-.5)*(w*.58+w*.42*v),y+rise*(1-v)**1.35+.14*v**7+.12*Math.abs(u*2-1)**6*v**4,z+s*d*.5*v];
  for(const s of [-1,1]){patch((u,v)=>surf(u,v,s),18,8);for(let i=0,n=Math.ceil(w/.09);i<=n;i++)for(let j=0;j<6;j++){const a=surf(i/n,j/6,s),b=surf(i/n,(j+1)/6,s);a[1]+=.02;b[1]+=.02;roofLines.push(...a,...b);}tube([[x-w*.5,y+.26,z+s*d*.5],[x,y+.14,z+s*d*.5],[x+w*.5,y+.26,z+s*d*.5]],.035,edge);}
  for(const s of [-1,1]){patch((u,v)=>[x+s*(w*.29+w*.21*v),y+rise*(1-v)**1.35+.14*v**7+.12*Math.abs(u*2-1)**6*v**4,z+(u-.5)*d*v],8,8);tube([[x+s*w*.29,y+rise,z],[x+s*w*.41,y+rise*.35,z+d*.27],[x+s*w*.5,y+.26,z+d*.5]],.03,edge);tube([[x+s*w*.29,y+rise,z],[x+s*w*.41,y+rise*.35,z-d*.27],[x+s*w*.5,y+.26,z-d*.5]],.03,edge);}
  const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(verts,3));g.setIndex(indices);g.computeVertexNormals();mesh(g,roof);box(w*.6,.12,.16,edge,x,y+rise+.05,z);
  for(const s of [-1,1])tube([[x+s*w*.3,y+rise,z],[x+s*(w*.3+.08),y+rise+.22,z],[x+s*(w*.3+.17),y+rise+.28,z]],.045,edge);
 }
 function rail(x,z,w,y){box(w,.05,.045,red,x,y+.30,z);box(w,.035,.035,red,x,y+.09,z);for(let i=0;i<=Math.ceil(w/.18);i++)box(.025,.30,.03,red,x-w/2+i*w/Math.ceil(w/.18),y+.15,z);}
 function rafters(x,y,z,w,d){for(const side of [-1,1])for(let i=0,n=Math.ceil(w/.17);i<=n;i++){const xx=x-w/2+w*i/n;box(.065,.065,.32,white,xx,y,z+side*d*.5);box(.09,.10,.24,redDark,xx,y-.08,z+side*(d*.5-.10));}}
 // Five distinct roofs and a long nine-ring finial; the tower is slender, not a solid pagoda block.
 const px=-7,pz=-3.65;box(4.4,.26,4.2,stone,px,.2,pz);box(3.9,.12,3.75,white,px,.39,pz);
 for(let level=0;level<5;level++){const y=.48+level*1.15,w=2.75-level*.17,d=w;box(w*.73,.79,d*.73,white,px,y+.40,pz);box(w+.18,.11,d+.18,redDark,px,y,pz);
  for(const side of [-1,1]){for(let j=0;j<5;j++){const k=-w*.37+j*w*.185;box(.065,.82,.075,red,px+k,y+.41,pz+side*w*.38);box(.075,.82,.065,red,px+side*w*.38,y+.41,pz+k);}rail(px,pz+side*(w*.5+.08),w+.18,y);const sideRail=box(.04,.04,w+.18,red,px+side*(w*.5+.08),y+.3,pz);for(let j=0;j<12;j++)box(.027,.29,.027,red,px+side*(w*.5+.08),y+.15,pz-w*.5+j*w/11);}
  for(let j=0;j<4;j++)box(.28,.48,.025,wood,px-.6+j*.4,y+.4,pz+w*.37+.02);rafters(px,y+.87,pz,w+1.05,d+.92);hip(px,y+.94,pz,w+1.2,d+1.15,.55);
 }
 const spireY=6.72;rod([px,spireY,pz],[px,9.10,pz],.045,gold);for(let i=0;i<9;i++){const ring=mesh(new T.TorusGeometry(.27-i*.015,.025,5,20),gold,px,spireY+.25+i*.16,pz);ring.rotation.x=Math.PI/2;}mesh(new T.SphereGeometry(.10,12,8),gold,px,8.83,pz);mesh(new T.SphereGeometry(.065,10,8),gold,px,9.12,pz);
 // Kaminarimon: four red columns, side guardian bays, broad grey tile roof, huge pleated lantern.
 const gx=-2.15,gz=4.25;box(5.8,.16,2.8,stone,gx,.16,gz);
 for(const dx of [-2.4,-1.12,1.12,2.4]){rod([gx+dx,.24,gz+.6],[gx+dx,3.06,gz+.6],.13,red);rod([gx+dx,.24,gz-.6],[gx+dx,3.06,gz-.6],.12,red);box(.33,.21,.36,metal,gx+dx,.30,gz+.6);box(.37,.12,.40,redDark,gx+dx,2.85,gz+.6);}
 box(5.2,.35,1.65,red,gx,2.91,gz);box(5.15,.54,1.25,white,gx,3.23,gz);for(let i=0;i<9;i++)box(.13,.47,1.4,red,gx-2.4+i*.6,3.22,gz);rafters(gx,3.52,gz,5.8,2.3);hip(gx,3.60,gz,6.15,3.15,.94);sign(1,1.12,.43,gx,3.23,gz+.73);
 for(const side of [-1,1]){const x=gx+side*1.78;box(1.1,.95,1.28,redDark,x,.72,gz);box(1.1,1.45,.7,wood,x,1.88,gz-.2);for(let j=0;j<12;j++)box(.028,1.8,.035,metal,x-.51+j*.093,1.67,gz+.62);for(let j=0;j<9;j++)box(1.04,.021,.031,metal,x,1.0+j*.18,gz+.64);for(let j=0;j<9;j++)box(.06,.65,.06,copper,x-.48+j*.12,.72,gz+.68);const guardian=createPerson({cloth:mat('#54766a'),variant:side+3,pose:'carry',scale:.64});guardian.position.set(x,1.02,gz+.1);root.add(guardian);}
 function lantern(x,y,z,r,h,big=false){const pts=[];for(let j=0;j<=20;j++){const t=j/20;pts.push(new T.Vector2(r*(.68+.32*Math.sin(t*Math.PI))*(1+.014*Math.sin(t*40*Math.PI)),(t-.5)*h));}mesh(new T.LatheGeometry(pts,28),paper,x,y,z);for(const side of [-1,1])mesh(new T.CylinderGeometry(r*.7,r*.7,.075,20),big?gold:wood,x,y+side*h*.5,z);rod([x,y+h*.5,z],[x,y+h*.5+.2,z],.02,wood);}
 lantern(gx,1.98,gz+.23,.64,1.52,true);
 const lc=document.createElement('canvas');lc.width=256;lc.height=512;const lctx=lc.getContext('2d');lctx.textAlign='center';lctx.textBaseline='middle';lctx.font='bold 184px Yu Mincho,SimSun,serif';lctx.lineWidth=9;lctx.strokeStyle='#e1c9a3';lctx.fillStyle='#252824';for(const [txt,y] of [['雷',142],['門',354]]){lctx.strokeText(txt,128,y,220);lctx.fillText(txt,128,y,220);}const lt=new T.CanvasTexture(lc);lt.colorSpace=T.SRGBColorSpace;const lm=mat('#fff',{map:lt,transparent:true,alphaTest:.1,side:T.DoubleSide});const lg=new T.CylinderGeometry(.655,.655,1.36,24,1,true,-.64,1.28);mesh(lg,lm,gx,1.98,gz+.23);
 // A smaller hall ends the axis beyond the shops, with an open veranda.
 const hx=-1.6,hz=-3.5;box(4.8,.36,3.2,stone,hx,.28,hz);box(3.9,1.62,2.25,redDark,hx,1.25,hz-.1);box(3.75,1.05,.04,glass,hx,1.25,hz+1.05);
 for(let i=0;i<8;i++){box(.12,1.85,.14,red,hx-2.13+i*.61,1.4,hz+1.42);box(.035,1.1,.055,wood,hx-1.7+i*.48,1.27,hz+1.10);}box(4.5,.16,2.9,red,hx,2.35,hz);rafters(hx,2.49,hz,5.1,3.2);hip(hx,2.55,hz,5.5,3.9,1.15);for(let i=0;i<4;i++)box(2.3,.095,.3,stone,hx,.10+i*.10,hz+2.4-i*.3);
 // Two short irregular rows of Showa-era shops, with recessed windows and awnings.
 const shopColors=[mat('#8b806d'),mat('#a18d70'),mat('#727d79'),mat('#92796a')],awningColors=[mat('#7a3931'),mat('#41605a'),mat('#b7a17a')];
 function shop(x,z,w,d,height,id,angle){const group=new T.Group();root.add(group);group.position.set(x,0,z);group.rotation.y=angle;
  box(w,height,d,shopColors[id%4],0,height/2+.17,0,group);box(w+.12,.12,d+.12,wood,0,.22,0,group);box(w*.83,1.03,.045,glass,0,.83,d/2+.026,group);
  for(let i=0;i<5;i++)box(.035,1.10,.06,wood,-w*.4+i*w*.2,.83,d/2+.06,group);box(w*.87,.045,.08,wood,0,.77,d/2+.065,group);
  const aw=box(w+.14,.07,.78,awningColors[id%3],0,1.65,d/2+.29,group);aw.rotation.x=.23;box(w+.14,.23,.05,awningColors[id%3],0,1.44,d/2+.65,group);for(let i=0;i<7;i++)box(.055,.23,.06,white,-w/2+i*w/6,1.44,d/2+.68,group);
  if(height>2){for(const xx of [-w*.25,w*.25]){box(w*.34,.58,.025,wood,xx,2.25,d/2+.04,group);box(w*.28,.49,.03,glass,xx,2.25,d/2+.06,group);box(.025,.52,.035,white,xx,2.25,d/2+.08,group);}box(w+.12,.08,d+.12,wood,0,2.76,0,group);}
  // Local corrugated pitched roof, kept independent of the global tiled temple roofs.
  for(const side of [-1,1]){const r=box(w+.25,.075,d*.62,roof,0,height+.27,side*d*.24,group);r.rotation.x=side*.33;for(let i=0;i<12;i++){const seam=box(.025,.03,d*.63,edge,-w/2+i*w/11,height+.31,side*d*.24,group);seam.rotation.x=side*.33;}}
  const sg=new T.PlaneGeometry(w*.78,.38),uv=sg.attributes.uv,si=2+id%10;for(let i=0;i<uv.count;i++)uv.setXY(i,(si%4+uv.getX(i))/4,1-(Math.floor(si/4)+1-uv.getY(i))/3);mesh(sg,signMat,0,1.95,d/2+.10,group);
  box(.32,.62,.34,wood,w*.38,.52,d/2+.64,group);box(.25,.33,.01,white,w*.38,.56,d/2+.82,group);
  // Box planters and individual pottery by the doorway.
  for(const side of [-1,1]){mesh(new T.CylinderGeometry(.10,.07,.16,8),redDark,side*w*.46,.29,d/2+.34,group);const shrub=mesh(new T.IcosahedronGeometry(.18,1),leaf,side*w*.46,.48,d/2+.34,group);shrub.scale.y=1.25;}
 }
 for(const [x,z,w,d,h,id,angle] of [[-4.75,1.55,1.8,1.5,2.55,0,Math.PI/2],[-4.75,-.50,1.7,1.6,2.75,1,Math.PI/2],[.72,1.45,1.85,1.45,2.65,2,-Math.PI/2],[.72,-.65,1.7,1.5,2.35,3,-Math.PI/2],[-7.8,5.1,2.1,1.75,2.8,4,0],[-7.45,7.55,2.7,1.55,2.6,5,0],[1.3,6.85,2.5,1.8,2.65,6,0],[4.15,6.7,1.85,1.9,2.4,7,0]])shop(x,z,w,d,h,id,angle);
 for(const [x,z] of [[-3.25,.5],[-.6,.2],[-3.3,2.4],[-.6,2.2],[1.5,8],[4.2,7.9]])lantern(x,1.58,z,.12,.31);
 // Marunouchi's red-brick wings, pale stone bands, two octagonal drums and ribbed domes.
 const sx=.05,sz=-8.0;box(11.5,2.15,1.55,brick,sx,1.28,sz);for(const y of [.38,1.18,2.0,2.38])box(11.7,.09,1.66,white,sx,y,sz);
 function mansard(x,y,z,w,d){const g=new T.CylinderGeometry(1,1,1,4,1,false);g.rotateY(Math.PI/4);const a=g.attributes.position;for(let i=0;i<a.count;i++){const top=a.getY(i)>0;const xx=a.getX(i)*Math.SQRT2*.5*w*(top?.72:1),zz=a.getZ(i)*Math.SQRT2*.5*d*(top?.60:1);a.setXYZ(i,xx,a.getY(i)*.48,zz);}g.computeVertexNormals();mesh(g,roof,x,y+.24,z);box(w*.73,.035,d*.61,metal,x,y+.5,z);}
 mansard(sx,2.43,sz,11.85,1.9);
 function window(x,y,z,w=.3,h=.48){box(w+.08,h+.1,.06,white,x,y,z);box(w,h,.045,glass,x,y,z+.04);box(.025,h,.06,wood,x,y,z+.07);box(w,.025,.065,wood,x,y-.05,z+.07);}
 for(let row=0;row<2;row++)for(let i=0;i<23;i++)window(sx-5.4+i*.49,.72+row*.82,sz+.81,.27,.48);
 for(const x of [sx-4.6,sx+4.6]){mesh(new T.CylinderGeometry(.94,.94,2.55,8),brick,x,1.5,sz);mesh(new T.CylinderGeometry(1.03,1.03,.12,8),white,x,2.82,sz);mesh(new T.CylinderGeometry(.88,.88,.45,8),white,x,3.07,sz);for(let i=0;i<8;i++){const a=i*Math.PI/4;const o=box(.31,.35,.035,glass,x+Math.sin(a)*.895,3.05,sz+Math.cos(a)*.895);o.rotation.y=a;}
  const domePts=[new T.Vector2(1.08,0),new T.Vector2(1.02,.18),new T.Vector2(.86,.43),new T.Vector2(.72,.68),new T.Vector2(.36,.91),new T.Vector2(.15,1.02)];mesh(new T.LatheGeometry(domePts,32),roof,x,3.3,sz);
  for(let i=0;i<12;i++){const a=i*Math.PI/6;tube(domePts.map(p=>[x+Math.sin(a)*(p.x+.015),3.3+p.y,sz+Math.cos(a)*(p.x+.015)]),.023,copper);}mesh(new T.CylinderGeometry(.13,.17,.22,12),copper,x,4.42,sz);mesh(new T.SphereGeometry(.075,10,8),gold,x,4.58,sz);
 }
 box(1.75,2.4,1.9,brick,sx,1.44,sz);mansard(sx,2.76,sz,2.16,2.12);sign(9,.93,.24,sx,2.30,sz+1.0);for(const x of [-.5,0,.5])window(sx+x,1.45,sz+.98,.28,.85);
 const pediment=new T.Shape();pediment.moveTo(-.65,0);pediment.lineTo(-.65,.25);pediment.quadraticCurveTo(-.55,.91,0,.91);pediment.quadraticCurveTo(.55,.91,.65,.25);pediment.lineTo(.65,0);pediment.closePath();mesh(new T.ExtrudeGeometry(pediment,{depth:.10,bevelEnabled:false}),brick,sx,2.52,sz+1.02);tube([[sx-.71,2.75,sz+1.13],[sx-.51,3.23,sz+1.13],[sx,3.48,sz+1.13],[sx+.51,3.23,sz+1.13],[sx+.71,2.75,sz+1.13]],.05,white);mesh(new T.CircleGeometry(.17,24),white,sx,3.03,sz+1.14);rod([sx,3.03,sz+1.15],[sx,3.16,sz+1.15],.013,metal);rod([sx,3.03,sz+1.15],[sx+.08,2.99,sz+1.15],.013,metal);
 // Stone riverwalk: pairs and small groups watch from this side of the water.
 for(let i=0;i<40;i++){const z=-9.6+i*.49;box(.045,.55,.045,metal,5.72,.63,z);}rod([5.72,.92,-9.7],[5.72,.92,9.7],.035,metal);rod([5.72,.59,-9.7],[5.72,.59,9.7],.025,metal);
 for(const [x,z] of [[-8.8,3.0],[-.4,8.3],[4.9,4.0],[4.9,-.2],[4.9,-5.0],[-4.0,-6.4]]){rod([x,.2,z],[x,2.2,z],.04,metal);rod([x,2.2,z],[x+.3,2.2,z],.025,metal);box(.21,.33,.21,lamp,x+.3,2.04,z);box(.28,.055,.28,metal,x+.3,2.25,z);}
 function tree(x,z,s){rod([x,.1,z],[x+.08*s,1.75*s,z],.09*s,wood);for(let i=0;i<12;i++){const a=i*2.4,reach=.23+.45*rand(i,x),y=(1.4+rand(i,z)*.65)*s;rod([x,1.1*s,z],[x+Math.cos(a)*reach*s,y,z+Math.sin(a)*reach*s],.025*s,wood);const c=mesh(new T.IcosahedronGeometry(.42*s,1),leaf,x+Math.cos(a)*reach*s,y,z+Math.sin(a)*reach*s);c.scale.set(1.2,.65,1.0);}}
 for(const [x,z,s] of [[-9.5,-7.8,1],[-9.2,.25,.95],[3.7,-4.8,.8],[3.7,2.8,.8],[5.2,8.7,.65]])tree(x,z,s);
 // Two recognizable bicycles: spoked wheels, triangular frame, saddle and bars.
 for(const [x,z] of [[-6.3,7.9],[2.7,7.9]]){for(const dx of [-.31,.31]){mesh(new T.TorusGeometry(.22,.025,5,16),metal,x+dx,.43,z);for(let j=0;j<8;j++){const a=j*Math.PI/4;rod([x+dx,.43,z],[x+dx+Math.cos(a)*.22,.43+Math.sin(a)*.22,z],.006,edge);}}for(const [a,b] of [[[-.31,.43],[0,.48]],[[0,.48],[-.08,.75]],[[-.08,.75],[-.31,.43]],[[-.08,.75],[.20,.73]],[[.20,.73],[0,.48]],[[.20,.73],[.31,.43]]])rod([x+a[0],a[1],z],[x+b[0],b[1],z],.02,copper);box(.17,.045,.10,wood,x-.08,.80,z);rod([x+.2,.73,z],[x+.17,.91,z],.018,metal);rod([x+.17,.91,z-.12],[x+.17,.91,z+.12],.018,metal);}
 const coats=[mat('#929a9d'),mat('#b08a73'),mat('#847790'),mat('#56767d')];
 const people=[[-2.6,6],[-2.15,6.1],[-1.1,5.6],[-1.45,5.7],[-2.2,2],[-2.65,1.8],[-1.45,.8],[-1.65,-.2],[-.8,-1.5],[-3,-1.5],[-6.2,-.9],[-6.5,-.8],[-5.6,-5.6],[-5.2,-5.8],[3.5,8],[3.85,8.1],[5.2,6.1],[5.1,5.65],[5.0,1.4],[5.25,1],[5.2,-2.5],[4.9,-2.8],[5.12,-5.9],[4.8,-6.1],[2.5,-6.2],[2.8,-6.4],[-8,8.6],[-8.4,8.5]];
 people.forEach(([x,z],i)=>{const p=createPerson({cloth:coats[i%4],variant:i,pose:i%5===0?'carry':'watch',scale:.33});p.position.set(x,.18,z);p.rotation.y=x>4.7?Math.PI/2:i*.63;root.add(p);});
 const stats=bake(root);
 // Warm light pools are a single transparent mesh rather than extra shadow lights.
 const poolPos=[],poolUV=[],poolIndex=[];for(const [x,z,rx,rz] of [[-8.5,3,1,1.2],[-.1,8.3,1.2,1.1],[5,4,.65,1.1],[5,-.2,.65,1.1],[5,-5,.65,1.1],[-2.15,4.9,1.5,1.15],[-6.8,8.4,1.4,.8],[1.3,8,1.4,.8],[-3.8,.5,.8,1.4],[-.2,.2,.8,1.4]]){const base=poolPos.length/3;poolPos.push(x-rx,.086,z-rz,x+rx,.086,z-rz,x+rx,.086,z+rz,x-rx,.086,z+rz);poolUV.push(0,0,1,0,1,1,0,1);poolIndex.push(base,base+2,base+1,base,base+3,base+2);}const pg=new T.BufferGeometry();pg.setAttribute('position',new T.Float32BufferAttribute(poolPos,3));pg.setAttribute('uv',new T.Float32BufferAttribute(poolUV,2));pg.setIndex(poolIndex);const pm=new T.ShaderMaterial({transparent:true,depthWrite:false,side:T.DoubleSide,blending:T.AdditiveBlending,vertexShader:`varying vec2 v;void main(){v=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}`,fragmentShader:`varying vec2 v;void main(){float d=length((v-.5)*2.);gl_FragColor=vec4(.45,.22,.06,pow(max(0.,1.-d),2.)*.35);}`});const pools=mesh(pg,pm);pools.castShadow=pools.receiveShadow=false;
 const rg=new T.BufferGeometry();rg.setAttribute('position',new T.Float32BufferAttribute(roofLines,3));const rl=new T.LineSegments(rg,new T.LineBasicMaterial({color:'#81868b',transparent:true,opacity:.19}));root.add(rl);
 const waterUniforms={time:{value:0},glow:{value:0},hue:{value:new T.Color('#ffd29a')}};
 const waterMat=new T.ShaderMaterial({uniforms:waterUniforms,side:T.DoubleSide,vertexShader:`varying vec2 v;void main(){v=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}`,fragmentShader:`varying vec2 v;uniform float time;uniform float glow;uniform vec3 hue;void main(){float t=time*.38;float ripple=.5*sin(v.y*213.+sin(v.x*12.+t)*3.-t)+.3*sin(v.y*319.-v.x*21.+t)+.2*sin(v.y*157.+v.x*15.-t*.7);float glint=pow(max(0.,ripple),6.);float breakUp=.25+.75*pow(max(0.,sin(v.x*43.+v.y*13.+sin(v.y*23.))),4.);vec3 col=vec3(.006,.018,.028)+vec3(.008,.017,.023)*glint;float lampStripe=exp(-pow((v.x-.12)*10.,2.))*(.20+.80*pow(max(0.,sin(v.y*46.)),9.));col+=vec3(.18,.095,.028)*lampStripe*glint;col+=hue*glow*glint*breakUp*(1.-smoothstep(.1,.7,abs(v.x-.5)));gl_FragColor=vec4(col,1.);}`});
 const water=mesh(new T.PlaneGeometry(4.35,19.8,1,1),waterMat,8.05,-.02,0);water.rotation.x=-Math.PI/2;water.castShadow=water.receiveShadow=false;water.userData.dynamic=true;
 const hanabi=createHanabi(root,{reducedMotion,onLight(power,color){waterUniforms.glow.value=power;waterUniforms.hue.value.copy(color);}});
 const walkers=[];let movingTriangles=0;for(let i=0;i<4;i++){const person=createPerson({cloth:coats[i],variant:i,pose:'walk'});for(const key of ['leftLeg','rightLeg','leftArm','rightArm']){const part=person[key],position=part.position.clone(),q=part.quaternion.clone();part.position.set(0,0,0);part.quaternion.identity();movingTriangles+=bake(part).triangles;part.position.copy(position);part.quaternion.copy(q);part.userData.dynamic=true;}movingTriangles+=bake(person).triangles;person.scale.setScalar(.33);root.add(person);walkers.push(person);}
 let clock=0;function stroll(){walkers.forEach((p,i)=>{const phase=(clock*.035+i*.23)%1,forward=phase<.5,t=forward?phase*2:2-phase*2;p.position.set(-2.55+(i%2)*.54,.18,2.9-t*4.3);p.rotation.y=forward?Math.PI:0;const stride=Math.sin(clock*4+i)*.22;p.leftLeg.rotation.x=stride;p.rightLeg.rotation.x=-stride;p.leftArm.rotation.x=-stride;p.rightArm.rotation.x=stride;});}stroll();
 return {root,stats:{triangles:stats.triangles+movingTriangles,walking:4},setDetail(active){walkers.forEach(p=>p.visible=active);if(!active)hanabi.reset();},update(dt){if(!reducedMotion){clock+=dt;waterUniforms.time.value=clock;stroll();}},show:hanabi,diagnostics(){return {pagodaRoofs:5,stationDomes:2,visitors:people.length+walkers.length,...hanabi.diagnostics()};}};
}
