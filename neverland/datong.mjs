import * as T from './vendor/three.module.js';
import {bake} from './scene-resources.mjs';
import {stoneSculpture} from './stone-sculpture.mjs';
import {createPerson} from './people.mjs';

// Two separate landmarks composed as a miniature, not a geographic reconstruction.
export function buildDatong({reducedMotion=false}={}){
 const root=new T.Group();root.name='Datong · carved stone and hanging timber';
 const mat=(color,extra={})=>new T.MeshStandardMaterial({color,roughness:.88,...extra});
 const rock=mat('#b5a48a'),cut=mat('#a79983'),stone=mat('#c5b79d'),deep=mat('#625b4d'),soil=mat('#6d7160'),sand=mat('#b3ac94'),wood=mat('#713b30'),red=mat('#935044'),paint=mat('#526f66'),cream=mat('#b9aa8d'),gold=mat('#bd963f',{roughness:.6}),green=mat('#42796a',{roughness:.65}),dark=mat('#343b35'),leaf=mat('#506044');
 for(const m of [rock,cut,stone,soil,sand,gold,green])m.userData.snowSurface=true;dark.emissive.set('#c6873e');dark.emissiveIntensity=.22;
 leaf.userData.seasonal=true;
 sand.side=T.DoubleSide;
 const rockTex=new T.TextureLoader().load(new URL('./assets/longmen/rock.webp',import.meta.url).href);rockTex.colorSpace=T.SRGBColorSpace;rockTex.wrapS=rockTex.wrapT=T.RepeatWrapping;rockTex.repeat.set(2.3,2.3);rock.bumpMap=rockTex;rock.bumpScale=.09;rock.color.set('#c1b7a4');rock.vertexColors=true;
 rock.map=rockTex;rock.onBeforeCompile=shader=>{shader.fragmentShader=shader.fragmentShader.replace('#include <map_fragment>',`#ifdef USE_MAP
 float mineral=dot(texture2D(map,vMapUv).rgb,vec3(.299,.587,.114));
 diffuseColor.rgb*=mix(.70,1.08,sqrt(mineral));
 #endif`);};rock.customProgramCacheKey=()=> 'datong-pale-sandstone-v1';
 const mesh=(g,m,x=0,y=0,z=0,p=root)=>{const o=new T.Mesh(g,m);o.position.set(x,y,z);o.castShadow=o.receiveShadow=true;p.add(o);return o;};
 const box=(w,h,d,m,x,y,z,p=root)=>mesh(new T.BoxGeometry(w,h,d),m,x,y,z,p);
 const rod=(a,b,r,m=wood,p=root)=>{const av=new T.Vector3(...a),bv=new T.Vector3(...b),o=mesh(new T.CylinderGeometry(r,r,av.distanceTo(bv),7),m,...av.clone().add(bv).multiplyScalar(.5).toArray(),p);o.quaternion.setFromUnitVectors(new T.Vector3(0,1,0),bv.sub(av).normalize());return o;};
 const tube=(pts,r,m=wood)=>mesh(new T.TubeGeometry(new T.CatmullRomCurve3(pts.map(p=>new T.Vector3(...p))),12,r,5,false),m);
 const hash=(x,y)=>{const n=Math.sin(x*127.1+y*311.7)*43758.5453;return n-Math.floor(n);};
 const noise=(x,y)=>{const ix=Math.floor(x),iy=Math.floor(y);let u=x-ix,v=y-iy;u=u*u*(3-2*u);v=v*v*(3-2*v);return T.MathUtils.lerp(T.MathUtils.lerp(hash(ix,iy),hash(ix+1,iy),u),T.MathUtils.lerp(hash(ix,iy+1),hash(ix+1,iy+1),u),v);};
 box(21,.55,20,cut,0,-.36,0);box(21,.08,20,soil,0,-.05,0);
 // Closed eroded rock masses. Narrow horizontal ledges are part of the geometry.
 function cliff(x,z,w,h,d,seed,niche=false){
  const g=new T.BoxGeometry(w,h,d,48,44,16),a=g.attributes.position,colors=[];
  for(let i=0;i<a.count;i++){let xx=a.getX(i),yy=a.getY(i)+h/2,zz=a.getZ(i),t=yy/h;
   const ridge=.32*Math.sin(xx*1.42+seed)+noise(xx*.9+seed,7)*.8;
   const layered=Math.sin(yy*8.3+xx*.35)*.07+Math.sin(yy*2.5+xx*.16)*.12;
   const erosion=(noise(xx*1.3+seed,yy*1.5)-.5)*.32+layered;
   if(zz>d*.45){zz+=erosion;if(niche)zz-=1.1*Math.exp(-Math.pow(xx/2.9,4))*T.MathUtils.smoothstep(yy,.7,1.5)*(1-T.MathUtils.smoothstep(yy,5.7,6.6));else zz-=.55*Math.exp(-Math.pow((yy-7)/3.3,4));}
   const edge=Math.pow(Math.abs(xx)/(w/2),6),back=Math.pow(Math.abs(zz)/(d/2),6);
   yy+=(ridge-edge*.85-back*.25)*t*t;
   const shoulder=T.MathUtils.smoothstep(t,.74,1);xx*=1-.09*shoulder-.045*back;
   zz*=1-.20*shoulder-.10*edge;zz+=Math.sin(xx*.5+seed)*.17*t;
   const shade=.78+noise(xx*.8+seed,yy*.65)*.20+.035*Math.sin(yy*9.3+xx*.8);colors.push(shade,shade*.98,shade*.94);
   a.setXYZ(i,xx,yy,zz);
  }g.setAttribute('color',new T.Float32BufferAttribute(colors,3));g.computeVertexNormals();mesh(g,rock,x,0,z);
 }
 cliff(-5.5,-1.6,9.1,6.65,4.7,2,true);
 cliff(4.5,-4.3,10.65,10.7,4.9,7,false);
 // Sloping shoulder joining the two formations, with open gorge left in front.
 for(let i=0;i<7;i++){const o=mesh(new T.DodecahedronGeometry(1,0),rock,-.9+i*.36,2+i*.55,-3.8);o.scale.set(1.2,2.2+i*.2,2);o.rotation.z=-.18;}
 // Yungang's exposed cave: a broad forecourt and a carved, broken aureole.
 box(9.6,.22,4.4,stone,-5.3,.18,1.95);for(let i=0;i<5;i++)box(4.6,.095,.28,stone,-5.2,.04+i*.085,4.55-i*.27);
 for(const r of [1.60,1.78,1.98]){const ring=mesh(new T.TorusGeometry(r,.035,5,64),stone,-5.35,3.70,.08);ring.scale.y=1.12;}
 for(let i=0;i<30;i++){const a=-Math.PI*.85+i/29*Math.PI*1.7,x=-5.35+Math.sin(a)*1.9,y=3.7+Math.cos(a)*2.12;mesh(new T.SphereGeometry(.07,8,6),stone,x,y+.13,.15);box(.12,.16,.07,stone,x,y,.14);const lap=mesh(new T.SphereGeometry(.1,8,6),stone,x,y-.08,.15);lap.scale.set(1.3,.55,.5);}
 for(const [x,z] of [[-9.2,1.5],[-1.55,1.3]]){box(.66,1.04,.16,deep,x,1.18,z);box(.83,.11,.32,stone,x,1.75,z);for(const side of [-1,1])box(.12,1.3,.3,rock,x+side*.43,1.1,z+.06);}
 for(let i=0;i<31;i++){const x=-9.4+i*.28;box(.035,.36,.035,wood,x,.55,3.78);}rod([-9.4,.74,3.78],[-1,.74,3.78],.025,wood);
 // Hip roofs: curved tiled slopes, raised eaves, green borders and ridge ornaments.
 const tileLines=[];
 function hipRoof(x,y,z,w,d,rise){
  const vertices=[],idx=[];const put=(fn,nu,nv)=>{const start=vertices.length/3;for(let j=0;j<=nv;j++)for(let i=0;i<=nu;i++)vertices.push(...fn(i/nu,j/nv));for(let j=0;j<nv;j++)for(let i=0;i<nu;i++){const k=start+j*(nu+1)+i;idx.push(k,k+1,k+nu+1,k+1,k+nu+2,k+nu+1);}};
  const surface=(u,v,side)=>[x+(u-.5)*(w*.56+(w*.44)*v),y+rise*(1-v)+.13*v**5+.10*Math.abs(u*2-1)**6*v**3,z+side*d*.5*v];
  for(const side of [-1,1]){put((u,v)=>surface(u,v,side),16,8);for(let i=0;i<26;i++)for(let j=0;j<6;j++){const a=surface(i/25,j/6,side),b=surface(i/25,(j+1)/6,side);a[1]+=.012;b[1]+=.012;tileLines.push(...a,...b);}tube([[x-w*.5,y+.23,z+side*d*.5],[x,y+.13,z+side*d*.5],[x+w*.5,y+.23,z+side*d*.5]],.035,green);}
  for(const side of [-1,1]){put((u,v)=>[x+side*(w*.28+(w*.22)*v),y+rise*(1-v)+.13*v**5+.10*Math.abs(u*2-1)**5*v**3,z+(u-.5)*d*v],8,8);tube([[x+side*w*.28,y+rise,z],[x+side*w*.39,y+rise*.5,z+d*.25],[x+side*w*.5,y+.23,z+d*.5]],.026,green);tube([[x+side*w*.28,y+rise,z],[x+side*w*.39,y+rise*.5,z-d*.25],[x+side*w*.5,y+.23,z-d*.5]],.026,green);}
  const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(vertices,3));g.setIndex(idx);g.computeVertexNormals();gold.side=T.DoubleSide;mesh(g,gold);rod([x-w*.28,y+rise+.035,z],[x+w*.28,y+rise+.035,z],.045,green);
  for(const side of [-1,1]){tube([[x+side*w*.28,y+rise,z],[x+side*(w*.28+.06),y+rise+.19,z],[x+side*(w*.28+.13),y+rise+.25,z]],.034,green);for(const end of [-1,1]){const ornament=mesh(new T.SphereGeometry(.06,8,6),green,x+side*w*.5,y+.27,z+end*d*.5);ornament.scale.y=1.7;}}
 }
 function rail(x1,x2,y,z){rod([x1,y+.32,z],[x2,y+.32,z],.023,red);rod([x1,y+.1,z],[x2,y+.1,z],.018,wood);const n=Math.ceil((x2-x1)/.15);for(let i=0;i<=n;i++)box(.028,.31,.028,red,x1+(x2-x1)*i/n,y+.16,z);}
 function hall(x,y,z,w,d){
  box(w+.34,.12,d+.68,wood,x,y-.06,z+.16);box(w,.84,d*.48,cream,x,y+.43,z-.25);
  box(w,.10,d+.16,paint,x,y+.92,z);box(w,.07,d+.12,red,x,y+.83,z);
  const n=Math.max(3,Math.round(w/.52));for(let i=0;i<=n;i++){const xx=x-w/2+i*w/n;rod([xx,y,z+d*.48],[xx,y+.91,z+d*.48],.038,red);box(.17,.08,.20,paint,xx,y+.98,z+d*.44);box(.24,.06,.12,wood,xx,y+1.04,z+d*.44);}
  for(let i=0;i<n;i++){const xx=x-w/2+(i+.5)*w/n;box(w/n*.80,.57,.025,dark,xx,y+.48,z+d*.04);for(let j=0;j<4;j++)box(.016,.54,.022,red,xx-w/n*.3+j*w/n*.2,y+.48,z+d*.065);box(w/n*.8,.025,.023,red,xx,y+.48,z+d*.07);}
  rail(x-w/2-.12,x+w/2+.12,y,z+d*.5+.22);
  for(const side of [-1,1]){rod([x+side*(w/2+.1),y+.32,z-d*.4],[x+side*(w/2+.1),y+.32,z+d*.5+.22],.024,red);for(let j=0;j<8;j++)box(.028,.31,.028,red,x+side*(w/2+.1),y+.16,z-d*.4+j*d*.13);}
  hipRoof(x,y+1.02,z,w+.55,d+.55,.42);
  for(let i=0;i<6;i++)box(.07,.12,d+.82,wood,x-w/2+i*w/5,y-.16,z+.08);
 }
 // The entrance court sits lower, the two three-storey towers hang over empty space.
 box(3.5,2.35,1.8,stone,1.05,3.45,-1.8);box(3.5,.38,1.9,red,1.05,4.72,-1.8);
 hall(.95,4.95,-1.7,3.15,1.15);hall(-.3,6.4,-2.0,.8,.8);hall(2.25,6.4,-2.0,.8,.8);
 for(const y of [5.25,6.7,8.15])hall(4.35,y,-1.7,2.35,1.18);
 for(const y of [5.25,6.7,8.15])hall(8.2,y,-1.7,1.75,1.18);
 // Narrow connecting gallery and rising stair, entirely clear of the valley below.
 box(1.65,.10,.65,wood,6.35,6.64,-1.22);rail(5.52,7.18,6.7,-.89);
 for(let i=0;i<20;i++){const t=i/19;box(.12,.065,.62,wood,5.60+t*1.62,6.70+t*1.45,-1.22);box(.025,.34,.025,red,5.60+t*1.62,6.87+t*1.45,-.89);}
 rod([5.55,7.05,-.89],[7.25,8.50,-.89],.024,red);
 // Cantilever beams enter the cliff. Short visible poles end on mid-cliff rock,
 // leaving the entire lower valley clear rather than reaching the ground.
 for(const x of [3.16,3.75,4.97,5.57,7.35,8.94]){const foot=4.02+hash(x,7)*.18;rod([x,foot,-.95],[x,5.25,-.95],.035,red);box(.13,.14,3.85,wood,x,5.13,-2.45);const ledge=mesh(new T.DodecahedronGeometry(1,0),rock,x,foot-.14,-1.80);ledge.scale.set(.29,.22,1.15);}
 for(const x of [-.53,2.5]){rod([x,3.92,-.97],[x,4.95,-.97],.035,red);box(.22,.13,.40,stone,x,3.88,-1.06);}
 // The invented ground-to-temple approach was removed at the user's request.
 for(let row=0;row<8;row++){const y=2.31+row*.29;rod([-.69,y,-.885],[2.79,y,-.885],.008,cut);for(let col=0;col<6;col++){const x=-.69+col*.59+(row%2)*.29;if(x<2.79)rod([x,y,-.883],[x,y+.28,-.883],.009,cut);}}
 const signCanvas=document.createElement('canvas');signCanvas.width=256;signCanvas.height=80;const sc=signCanvas.getContext('2d');sc.fillStyle='#31463d';sc.fillRect(0,0,256,80);sc.fillStyle='#d3b56c';sc.font='42px SimSun,serif';sc.textAlign='center';sc.fillText('悬空寺',128,55);const signTex=new T.CanvasTexture(signCanvas);signTex.colorSpace=T.SRGBColorSpace;mesh(new T.PlaneGeometry(.78,.24),new T.MeshStandardMaterial({map:signTex,roughness:1}),.95,5.67,-.965);
 const linesGeo=new T.BufferGeometry();linesGeo.setAttribute('position',new T.Float32BufferAttribute(tileLines,3));const lines=new T.LineSegments(linesGeo,new T.LineBasicMaterial({color:'#796936',transparent:true,opacity:.48}));lines.userData.dynamic=true;root.add(lines);
 // Low rocky banks and sparse pines frame a generous, open valley foreground.
 const groundGeo=new T.PlaneGeometry(20.7,8.2,55,24),groundPos=groundGeo.attributes.position,groundColors=[];
 for(let i=0;i<groundPos.count;i++){const x=groundPos.getX(i),z=groundPos.getY(i)+5.65;const height=.03+.20*noise(x*.42+15,z*.55)*Math.sin((z-1.55)/8.2*Math.PI)**2;groundPos.setXYZ(i,x,height,z);const c=.85+noise(x*.6,z*.6)*.15;groundColors.push(c,c,c*.94);}groundGeo.setAttribute('color',new T.Float32BufferAttribute(groundColors,3));groundGeo.computeVertexNormals();const groundMat=soil.clone();groundMat.vertexColors=true;groundMat.side=T.DoubleSide;mesh(groundGeo,groundMat);
 const path=new T.Shape();path.moveTo(-10,5.6);path.bezierCurveTo(-4,5.1,-2,7.9,3,6.8);path.bezierCurveTo(6,6.0,8,5.8,10,4.5);path.lineTo(10,5.3);path.bezierCurveTo(6,7.0,5,7.0,3,7.6);path.bezierCurveTo(-2,8.6,-4,6.0,-10,6.4);const pathMesh=mesh(new T.ShapeGeometry(path),sand,0,.25,0);pathMesh.rotation.x=Math.PI/2;
 for(let i=0;i<38;i++){const x=-10+hash(i,5)*20,z=3.8+hash(i,9)*5.8;const o=mesh(new T.DodecahedronGeometry(.17+hash(i,11)*.3,0),cut,x,.1,z);o.scale.set(1.3,.5,.9);o.rotation.y=i;}
 function pine(x,z,s,seed){const group=new T.Group();root.add(group);group.position.set(x,0,z);group.scale.setScalar(s);rod([x,.02,z],[x+.11*s,2.55*s,z],.07*s,wood);for(let j=0;j<14;j++){const a=j*2.4,yy=.9+j*.11,reach=.65*(1-j/19),ex=x+Math.cos(a)*reach*s,ez=z+Math.sin(a)*reach*s;rod([x,yy*s,z],[ex,(yy+.13)*s,ez],.025*s,wood);for(let k=0;k<6;k++){const foliage=mesh(new T.IcosahedronGeometry(1,0),leaf,ex+(hash(k,j)-.5)*.42*s,(yy+.15+hash(j,k)*.1)*s,ez+(hash(k,j+3)-.5)*.4*s);foliage.scale.set(.31*s,.09*s,.26*s);}}}
 for(const [x,z,s,seed] of [[-9.3,6.9,1.0,1],[8.9,6.7,1.1,2],[5.3,8.8,.65,3],[-1.6,8.5,.6,4],[-9.5,-6.8,.8,5]])pine(x,z,s,seed);
 const visitorCloth=[mat('#7f9195'),mat('#a78b6c'),mat('#8b6961')];
 for(const [i,x,y,z] of [[0,-7.8,.32,2.9],[1,-7.4,.32,2.8],[2,-4.2,.32,3.2],[3,-3.8,.32,3.15],[4,-1.8,.32,3.2],[5,2.4,.12,6.7],[6,2.8,.12,6.6],[7,4.2,5.28,-.72],[8,8.4,6.73,-1.15],[9,.75,4.98,-.9]]){const p=createPerson({cloth:visitorCloth[i%3],variant:i*3,scale:.31});p.position.set(x,y,z);p.rotation.y=i%3;root.add(p);}
 const stats=bake(root);let sculptureTriangles=0,loaded=false;
 const ready=Promise.all([fetch(new URL('./assets/datong/buddha.json',import.meta.url).href).then(r=>{if(!r.ok)throw new Error('Datong sculpture missing');return r.json();}),new T.TextureLoader().loadAsync(new URL('./assets/datong/buddha.webp',import.meta.url).href)]).then(([data,texture])=>{texture.colorSpace=T.SRGBColorSpace;texture.anisotropy=4;const buddha=stoneSculpture(data,texture,cut);buddha.position.set(-5.35,.40,.90);buddha.scale.setScalar(1.22);buddha.children[0].material.color.set('#fff6e8');root.add(buddha);sculptureTriangles=buddha.userData.triangles;loaded=true;return true;}).catch(e=>{console.error(e);return false;});
 const walkers=[];for(let i=0;i<3;i++){const person=createPerson({cloth:visitorCloth[i],variant:i*3,pose:'walk'});for(const key of ['leftLeg','rightLeg','leftArm','rightArm']){const part=person[key],p=part.position.clone(),q=part.quaternion.clone();part.position.set(0,0,0);part.quaternion.identity();bake(part);part.position.copy(p);part.quaternion.copy(q);part.userData.dynamic=true;}bake(person);person.scale.setScalar(.34);root.add(person);walkers.push(person);}
 let clock=0,progress=0;
 function walk(t){progress=T.MathUtils.clamp(t/7,0,1);walkers.forEach((p,i)=>{const x=4.15+4.7*progress-i*.34,y=6.74+1.45*T.MathUtils.clamp((x-5.6)/1.62,0,1);p.position.set(x,y,-1.22);p.rotation.y=Math.PI/2;const stride=progress>0&&progress<1?Math.sin(t*6-i)*.25:0;p.leftLeg.rotation.x=stride;p.rightLeg.rotation.x=-stride;p.leftArm.rotation.x=-stride;p.rightArm.rotation.x=stride;});}
 walk(0);
 return {root,ready,stats:{get triangles(){return stats.triangles+sculptureTriangles;},walking:3},setDetail(active){walkers.forEach(p=>p.visible=active);},update(dt){clock+=dt;},show:{reset(done=false){if(!done)walk(0);},update(t){walk(t);}},diagnostics(){return {loaded,progress,templeFloors:6,walkers:walkers.map(p=>p.position.toArray())};}};
}
