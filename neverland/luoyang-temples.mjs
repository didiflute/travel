import * as T from './vendor/three.module.js';
import {bake} from './scene-resources.mjs';

export function buildTemples(){
 const root=new T.Group();root.name='White Horse Temple international precinct';
 const material=(color,extra={})=>new T.MeshStandardMaterial({color,roughness:.8,...extra});
 const cream=material('#d8cbb0'),white=material('#ece4d1'),stone=material('#a79a7d'),dark=material('#483e30'),gold=material('#b08d43',{metalness:.45,roughness:.48}),red=material('#813d2d'),roof=material('#703a31'),tile=material('#514f43'),leaf=material('#415a3e');
 for(const m of [roof,tile,stone,white])m.userData.snowSurface=true;leaf.userData.seasonal=true;dark.emissive.set('#ce8b40');dark.emissiveIntensity=.20;
 const lamp=material('#f1c47e',{emissive:'#ffb452',emissiveIntensity:1.2});
 const mesh=(g,m,x=0,y=0,z=0,p=root)=>{const o=new T.Mesh(g,m);o.position.set(x,y,z);o.castShadow=o.receiveShadow=true;p.add(o);return o;};
 const box=(w,h,d,m,x,y,z,p=root)=>mesh(new T.BoxGeometry(w,h,d),m,x,y,z,p);
 const cyl=(r1,r2,h,m,x,y,z,p=root)=>mesh(new T.CylinderGeometry(r1,r2,h,20),m,x,y,z,p);
 const tube=(pts,r,m=gold,p=root)=>mesh(new T.TubeGeometry(new T.CatmullRomCurve3(pts.map(v=>new T.Vector3(...v))),12,r,5,false),m,0,0,0,p);
 function lathe(points,m,x,y,z){return mesh(new T.LatheGeometry(points.map(p=>new T.Vector2(...p)),48),m,x,y,z);}
 function terrace(x,z,w,d){for(let i=0;i<3;i++)box(w-i*.1,.12,d-i*.1,i%2?stone:white,x,.08+i*.12,z);for(let i=0;i<5;i++)box(w*.45,.075,.2,cream,x,.04+i*.065,z+d/2+.72-i*.16);}
 // Sloped tiled planes have curved, raised edges, thickness and a carved ridge.
 function gabledRoof(x,y,z,w,d,rise,m=roof,ornament=true){
  for(const side of [-1,1]){
   const verts=[],uv=[],idx=[],nx=16,nz=20;
   for(let j=0;j<=nz;j++)for(let i=0;i<=nx;i++){const u=i/nx,v=j/nz,yy=y+rise*(1-u)+.13*u**5+.035*Math.cos(v*Math.PI*2*nz);verts.push(x+side*w*.5*u,yy,z+(v-.5)*d);uv.push(u,v);}
   for(let j=0;j<nz;j++)for(let i=0;i<nx;i++){const k=j*(nx+1)+i;idx.push(k,k+1,k+nx+1,k+1,k+nx+2,k+nx+1);}
   const geo=new T.BufferGeometry();geo.setAttribute('position',new T.Float32BufferAttribute(verts,3));geo.setAttribute('uv',new T.Float32BufferAttribute(uv,2));geo.setIndex(idx);geo.computeVertexNormals();m.side=T.DoubleSide;mesh(geo,m);
   box(.07,.10,d,gold,x+side*w*.5,y+.1,z);
   for(const end of [-1,1]){
    tube([[x+side*w*.5,y+.14,z+end*d*.5],[x+side*w*.28,y+rise*.45,z+end*d*.5],[x,y+rise,z+end*d*.5]],.027,gold);
    if(ornament)tube([[x,y+rise-.05,z+end*d*.5],[x,y+rise+.27,z+end*(d*.5+.06)],[x,y+rise+.52,z+end*(d*.5+.16)]],.028,gold);
   }
   for(let k=0;k<=24;k++){const zz=z-d/2+k*d/24;tube([[x,y+rise+.015,zz],[x+side*w*.25,y+rise*.5+.02,zz],[x+side*w*.5,y+.15,zz]],.009,red);}
  }
  tube([[x,y+rise+.03,z-d/2],[x,y+rise+.03,z+d/2]],.05,gold);
 }
 function pediment(x,y,z,w,h){const shape=new T.Shape();shape.moveTo(-w/2,0);shape.lineTo(0,h);shape.lineTo(w/2,0);shape.closePath();mesh(new T.ShapeGeometry(shape),gold,x,y,z);const inset=new T.Shape();inset.moveTo(-w*.41,.04);inset.lineTo(0,h*.85);inset.lineTo(w*.41,.04);inset.closePath();mesh(new T.ShapeGeometry(inset),red,x,y,z+.015);
  for(let k=-4;k<=4;k++)tube([[x+k*w*.08,y+.07,z+.025],[x+k*w*.035,y+h*.47,z+.03],[x,y+h*.8,z+.025]],.01,gold);
 }
 // Thai ubosot: raised white plinth, a columned gallery, red/gold window surrounds and triple roof.
 terrace(5.8,-5.7,5.6,4.8);box(3.7,1.65,3.2,white,5.8,1.22,-5.7);box(4.6,.15,4.05,cream,5.8,2.02,-5.7);
 for(const x of [3.55,4.3,5.05,5.8,6.55,7.3,8.05])for(const z of [-7.6,-3.8]){
  cyl(.068,.085,1.63,white,x,1.21,z);cyl(.12,.13,.11,gold,x,.47,z);cyl(.13,.08,.16,gold,x,1.98,z);box(.21,.09,.21,cream,x,2.1,z);
 }
 for(const x of [3.55,8.05])for(const z of [-6.9,-6.1,-5.3,-4.5]){cyl(.065,.08,1.63,white,x,1.21,z);cyl(.12,.08,.14,gold,x,1.97,z);}
 for(const x of [4.65,6.95]){
  box(.53,.96,.04,gold,x,1.24,-4.07);box(.40,.85,.045,dark,x,1.22,-4.035);for(let i=0;i<5;i++)box(.018,.83,.03,red,x-.16+i*.08,1.22,-4.0);pediment(x,1.73,-4.01,.7,.6);
 }
 box(.68,1.35,.05,dark,5.8,1.04,-4.075);for(const x of [5.39,6.21])box(.07,1.47,.07,gold,x,1.12,-4.03);pediment(5.8,1.81,-4,1.04,.65);
 for(let i=0;i<3;i++){gabledRoof(5.8,2.1+i*.53,-5.7,5.45-i*.95,4.65-i*.65,1.06-i*.08);pediment(5.8,2.13+i*.53,-5.7+(4.65-i*.65)/2+.015,5.05-i*.91,1.01-i*.08);}
 for(const x of [3.22,8.38]){tube([[x,.51,-3.25],[x,.85,-2.75],[x,.8,-2.1]],.05,white);cyl(.095,.13,.15,gold,x,.85,-2.1);}
 // Indian Sanchi-inspired hall: sandstone drum and dome, railing, harmika and a three-bar torana.
 terrace(2,-1.8,4.2,3.8);cyl(1.28,1.4,.56,cream,2,.71,-1.8);
 mesh(new T.SphereGeometry(1.28,48,24,0,Math.PI*2,0,Math.PI/2),cream,2,1.0,-1.8);
 for(const y of [.48,.65,.9]){const ring=mesh(new T.TorusGeometry(1.32,.035,6,64),stone,2,y,-1.8);ring.rotation.x=Math.PI/2;}
 for(let i=0;i<44;i++){const a=i/44*Math.PI*2;cyl(.028,.034,.42,white,2+Math.sin(a)*1.4,1.1,-1.8+Math.cos(a)*1.4);}
 for(const y of [.98,1.28]){const ring=mesh(new T.TorusGeometry(1.4,.025,5,64),white,2,y,-1.8);ring.rotation.x=Math.PI/2;}
 box(.55,.28,.55,white,2,2.35,-1.8);cyl(.035,.04,.85,stone,2,2.91,-1.8);for(let i=0;i<3;i++)cyl(.34-i*.065,.36-i*.065,.055,white,2,2.65+i*.21,-1.8);
 for(const x of [.83,3.17]){box(.19,1.7,.23,cream,x,1.18,.04);for(let i=0;i<8;i++)box(.23,.045,.27,stone,x,.5+i*.18,.04);box(.38,.17,.34,white,x,2.09,.04);}
 for(let i=0;i<3;i++){const y=2.12+i*.23;box(3.0,.12,.22,cream,2,y,.04);for(let j=0;j<12;j++)box(.09,.07,.05,stone,.63+j*.25,y,.17);}
 // Myanmar pagoda: square terraces, a bell-shaped gilded body and hti, with a real entrance porch.
 terrace(7.3,-.2,4.3,4.1);
 for(let i=0;i<5;i++)box(3.3-i*.34,.14,3.3-i*.34,i%2?gold:white,7.3,.44+i*.14,-.2);
 lathe([[0,0],[1.12,0],[1.18,.08],[1.11,.18],[.98,.24],[1.02,.34],[.9,.48],[.83,.8],[.69,1.11],[.5,1.38],[.34,1.56],[.27,1.83],[.15,2.12],[.06,2.4],[0,2.52]],gold,7.3,1.0,-.2);
 for(let i=0;i<10;i++){const r=.3-i*.022;cyl(r,r+.014,.035,gold,7.3,2.65+i*.075,-.2);}
 cyl(.015,.025,.7,gold,7.3,3.7,-.2);for(let i=0;i<4;i++)cyl(.22-i*.045,.24-i*.045,.025,gold,7.3,3.41+i*.13,-.2);
 for(const dx of [-1.48,1.48])for(const dz of [-1.48,1.48]){cyl(.19,.27,.3,white,7.3+dx,.67,-.2+dz);lathe([[0,0],[.2,0],[.19,.15],[.11,.33],[.05,.5],[0,.72]],gold,7.3+dx,.82,-.2+dz);}
 box(.85,.86,.36,white,7.3,.91,1.36);box(.4,.65,.04,dark,7.3,.86,1.56);pediment(7.3,1.35,1.58,1.1,.72);for(const x of [6.84,7.76])cyl(.055,.07,.89,gold,x,.95,1.56);
 // A restrained Chinese entrance establishes the whole group as the White Horse Temple visit.
 for(const x of [4.05,5.85]){box(.16,1.21,.16,red,x,.73,1.76);box(.32,.12,.3,stone,x,.18,1.76);}
 box(2.1,.25,.28,red,4.95,1.42,1.76);gabledRoof(4.95,1.53,1.76,2.65,1.25,.42,tile,false);
 const sign=document.createElement('canvas');sign.width=256;sign.height=80;const sc=sign.getContext('2d');sc.fillStyle='#40382b';sc.fillRect(0,0,256,80);sc.strokeStyle='#b69b62';sc.lineWidth=5;sc.strokeRect(3,3,250,74);sc.fillStyle='#e9d2a2';sc.font='48px SimSun';sc.textAlign='center';sc.textBaseline='middle';sc.fillText('白马寺',128,42);const signTex=new T.CanvasTexture(sign);signTex.colorSpace=T.SRGBColorSpace;mesh(new T.PlaneGeometry(.86,.27),new T.MeshStandardMaterial({map:signTex,roughness:1}),4.95,1.41,1.915);
 for(const x of [4.08,5.82])cyl(.065,.065,.14,lamp,x,1.12,1.83);
 // Paths, small precinct walls, planted corners and warm low lamps tie the halls together.
 for(let i=0;i<11;i++)box(.52,.025,.43,stone,4.95,.05,1.35-i*.4);
 for(const [x,z] of [[.1,-3.4],[3.6,-2.9],[8.9,-7.6],[8.95,1.4]]){box(.44,.22,.44,cream,x,.19,z);const bush=mesh(new T.IcosahedronGeometry(.32,1),leaf,x,.45,z);bush.scale.y=.75;}
 for(const x of [.05,9.5])for(let i=0;i<20;i++)box(.055,.36,.055,white,x,.26,-7.9+i*.48);
 for(const [x,z] of [[3.4,-3.4],[8.4,-3.4],[.35,.2],[8.9,1.5]]){box(.07,.35,.07,stone,x,.2,z);box(.12,.09,.12,lamp,x,.42,z);}
 const stats=bake(root);root.userData.dynamic=true;
 const fill=new T.SpotLight('#f9dcaa',22,17,.9,.85,1.6);fill.position.set(5,7,4);fill.target.position.set(5,1,-3);root.add(fill,fill.target);
 return {root,stats};
}
