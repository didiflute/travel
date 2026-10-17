import * as T from './vendor/three.module.js';
import {bake} from './scene-resources.mjs';
import {createPerson} from './people.mjs';
import {stoneSculpture} from './stone-sculpture.mjs';
import {lampGlows} from './lamp-glows.mjs';

export function buildLongmen(){
 const root=new T.Group();root.name='Fengxian sculptural cliff';
 const mat=(color,extra={})=>new T.MeshStandardMaterial({color,roughness:.96,...extra});
 const rock=mat('#545954'),carving=mat('#a29379'),shadowStone=mat('#777260'),edge=mat('#918b79'),dark=mat('#383c36');
 const rockMap=new T.TextureLoader().load(new URL('./assets/longmen/rock.webp',import.meta.url).href);rockMap.colorSpace=T.SRGBColorSpace;rockMap.wrapS=rockMap.wrapT=T.RepeatWrapping;rockMap.repeat.set(1.6,1.6);rock.map=rockMap;rock.bumpMap=rockMap;rock.bumpScale=.12;rock.color.set('#a2a49b');
 const light=mat('#f7d294',{emissive:'#ffc06b',emissiveIntensity:3.4}),lamps=[];
 const mesh=(g,m,x=0,y=0,z=0,p=root)=>{const o=new T.Mesh(g,m);o.position.set(x,y,z);o.castShadow=o.receiveShadow=true;p.add(o);return o;};
 const box=(w,h,d,m,x,y,z,p=root)=>mesh(new T.BoxGeometry(w,h,d),m,x,y,z,p);
 const tube=(pts,r,m=carving,p=root)=>mesh(new T.TubeGeometry(new T.CatmullRomCurve3(pts.map(v=>new T.Vector3(...v))),18,r,5,false),m,0,0,0,p);
 const hash=(x,y)=>{const f=Math.sin(x*127.65+y*311.7)*43758.5453;return f-Math.floor(f);};
 function noise(x,y){const ix=Math.floor(x),iy=Math.floor(y);let u=x-ix,v=y-iy;u=u*u*(3-2*u);v=v*v*(3-2*v);return T.MathUtils.lerp(T.MathUtils.lerp(hash(ix,iy),hash(ix+1,iy),u),T.MathUtils.lerp(hash(ix,iy+1),hash(ix+1,iy+1),u),v);}
 for(const material of [rock,carving,shadowStone,edge]){
  material.onBeforeCompile=s=>{s.vertexShader='varying vec3 stonePosition;\n'+s.vertexShader;s.vertexShader=s.vertexShader.replace('#include <begin_vertex>','#include <begin_vertex>\nstonePosition=position;');s.fragmentShader='varying vec3 stonePosition;\n'+s.fragmentShader;s.fragmentShader=s.fragmentShader.replace('#include <color_fragment>',`#include <color_fragment>
 float grain=fract(sin(dot(floor(stonePosition*110.),vec3(12.9898,78.233,45.164)))*43758.5453);diffuseColor.rgb*=.88+grain*.2;`);};material.customProgramCacheKey=()=> 'limestone-soft-grain';
 }
 function surface(nu,nv,fn,m,p=root){const a=[],uv=[],idx=[];for(let j=0;j<=nv;j++)for(let i=0;i<=nu;i++){a.push(...fn(i/nu,j/nv));uv.push(i/nu,j/nv);}for(let j=0;j<nv;j++)for(let i=0;i<nu;i++){const k=j*(nu+1)+i;idx.push(k,k+1,k+nu+1,k+1,k+nu+2,k+nu+1);}const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(a,3));g.setAttribute('uv',new T.Float32BufferAttribute(uv,2));g.setIndex(idx);g.computeVertexNormals();m.side=T.DoubleSide;return mesh(g,m,0,0,0,p);}
 surface(104,72,(u,v)=>{const x=(u-.5)*11.8,y=v*(9.15+noise(x*.6,7)*.65),shrine=T.MathUtils.smoothstep(y,2.3,2.8)*(1-T.MathUtils.smoothstep(y,8.1,8.8))*(1-T.MathUtils.smoothstep(Math.abs(x),4.3,5.2)),n=(noise(x*2.4,y*3)-.5)*.22+(noise(x*.8,y*1.8)-.5)*.32;return [x,y,-2.35-shrine*.75+n*(1-shrine*.72)];},rock);
 box(11.4,8.4,2.1,rock,0,4.15,-4.5);
 const blockGeo=new T.DodecahedronGeometry(1,0);
 for(let i=0;i<45;i++){const side=i%2?1:-1,isTop=i>26,x=isTop?-5.7+(i-27)*.67:side*(5.2+hash(i,2)*.55),y=isTop?8.7+noise(x,5)*.65:.5+(i%14)*.62;const o=mesh(blockGeo,rock,x,y,-3.3+(hash(i,3)-.5)*.4);o.scale.set(.55+hash(i,7)*.6,.22+hash(i,9)*.35,.48+hash(i,11)*.5);o.rotation.set(hash(i,12)*.2,hash(i,13)*.3,hash(i,14)*.5);}
 box(10.9,.35,3.5,edge,0,2.5,-1.2);
 surface(80,25,(u,v)=>{const x=(u-.5)*11.8;return [x,v*2.4,1.15-v*.4+(noise(x*2,v*7)-.5)*.28];},rock);
 mesh(new T.CircleGeometry(1.38,72),shadowStone,0,7.65,-2.3);
 for(const r of [1.25,1.34])mesh(new T.TorusGeometry(r,.018,5,72),carving,0,7.65,-2.28);
 for(let k=0;k<32;k++){const a=k/32*Math.PI*2;tube([[Math.sin(a)*1.18,7.65+Math.cos(a)*1.18,-2.26],[Math.sin(a+.035)*1.30,7.65+Math.cos(a+.035)*1.30,-2.25],[Math.sin(a+.07)*1.19,7.65+Math.cos(a+.07)*1.19,-2.26]],.009);}
 for(const x of [-4.95,-3.3,3.3,4.95])for(let y=3.2;y<8.2;y+=.7)box(.12,.17,.035,dark,x,y,-2.78);
 for(let i=0;i<38;i++){const z=4.35-i*.105,y=.27+i*.061;box(3.35,.07,.15,edge,0,y,z);for(const x of [-1.55,0,1.55]){box(.065,.025,.12,light,x,y+.05,z);lamps.push([x,y+.075,z,.17]);}}
 for(const x of [-1.72,1.72]){tube([[x,.66,4.45],[x,2.94,.35]],.025,edge);for(let i=0;i<20;i++)box(.027,.34,.027,edge,x,.48+i*.12,4.35-i*.21);}
 for(const side of [-1,1]){tube([[side*1.8,2.94,.25],[side*5.2,2.94,.25]],.022,edge);for(let i=0;i<20;i++)box(.025,.35,.025,edge,side*(1.8+i*.18),2.77,.25);}
 box(3.6,.42,1.05,edge,0,.18,4.55);box(.75,.55,.12,dark,0,.36,5.09);box(.44,.42,.02,light,0,.32,5.17);
 const peopleMats=['#93958d','#687d84','#ac937c','#a6a094'].map(c=>mat(c));for(let i=0;i<20;i++){const p=createPerson({cloth:peopleMats[i%4],variant:i*3,scale:.34});p.position.set(-4.8+hash(i,71)*9.6,2.69,-.05-hash(i,81)*.9);p.rotation.y=hash(i,91)*6.28;root.add(p);}
 // Small fixtures along the viewing platform, low terrace and irregular cliff-top path.
 for(let i=0;i<43;i++){const x=-5.15+i*.245;box(.055,.055,.055,light,x,2.99,.27);lamps.push([x,3,.31,.13]);}
 for(let i=0;i<33;i++){const x=-5.25+i*.328;if(Math.abs(x)<1.85)continue;box(.06,.06,.07,light,x,.21,1.27);lamps.push([x,.23,1.32,.14]);}
 const ridge=[];for(let i=0;i<88;i++){const x=-5.65+i*.13,y=9.15+noise(x*.6,7)*.65+.08;ridge.push([x,y,-2.23]);box(.045,.05,.045,light,x,y,-2.23);lamps.push([x,y,-2.2,.115]);}
 for(let i=0;i<ridge.length-1;i+=3)tube(ridge.slice(i,Math.min(i+4,ridge.length)),.012,light);
 for(const x of [-5.18,5.18])for(let i=0;i<7;i++){const z=.05-i*.39;box(.07,.04,.07,light,x,2.73,z);lamps.push([x,2.77,z,.16]);}
 const glows=lampGlows(lamps);root.add(glows);
 const stats=bake(root),sculpture=new T.Group();sculpture.name='Vairocana volumetric sculpture';sculpture.position.set(0,2.65,-2.6);sculpture.userData.dynamic=true;root.add(sculpture);
 const loader=new T.TextureLoader();
 const ready=Promise.all([fetch(new URL('./assets/longmen/sculpture.json',import.meta.url).href).then(r=>r.json()),fetch(new URL('./assets/longmen/attendants.json',import.meta.url).href).then(r=>r.json()),loader.loadAsync(new URL('./assets/longmen/sculpture.webp',import.meta.url).href),loader.loadAsync(new URL('./assets/longmen/attendants.webp',import.meta.url).href)]).then(([mainData,attendantData,mainTex,attendantTex])=>{
  for(const texture of [mainTex,attendantTex]){texture.colorSpace=T.SRGBColorSpace;texture.anisotropy=4;}
  const main=stoneSculpture(mainData,mainTex,carving);sculpture.add(main);stats.triangles+=main.userData.triangles;
  const monk=stoneSculpture(attendantData[0],attendantTex,shadowStone),bodhisattva=stoneSculpture(attendantData[1],attendantTex,shadowStone);
  for(const [x,source,angle,scale] of [[-2.45,monk,.08,.97],[2.45,monk,-.08,1.01],[-4.05,bodhisattva,.10,1],[4.05,bodhisattva,-.10,1.02]]){const figure=source.clone(true);figure.position.set(x,2.66,-2.69);figure.rotation.y=angle;figure.scale.setScalar(scale);root.add(figure);stats.triangles+=source.userData.triangles;}
  sculpture.userData.loaded=true;return true;
 }).catch(e=>{console.error(e);return false;});
 const key=new T.SpotLight('#ffe1b2',28,20,.86,1,1.2);key.position.set(-.6,10.5,4.2);key.target.position.set(0,5.5,-2.5);root.add(key,key.target);
 const face=new T.PointLight('#ffcf83',2.6,6,1.2);face.position.set(0,8.9,-.4);root.add(face);
 for(const x of [-4.2,4.2]){const lamp=new T.PointLight('#f1dfc5',3.7,8,1.3);lamp.position.set(x,7.6,1.5);root.add(lamp);}
 const stair=new T.PointLight('#ffcf8c',1.1,7,1.3);stair.position.set(0,3.9,3);root.add(stair);
 stats.triangles+=lamps.length*2;
 return {root,stats,ready,lamps:lamps.length};
}
