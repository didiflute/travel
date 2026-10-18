import * as THREE from './vendor/three.module.js';
import {RoundedBoxGeometry} from './vendor/RoundedBoxGeometry.js';
import {createPerson} from './people.mjs';
import {createMarketLayout,BANKS} from './market-layout.mjs';

// A continuous riverside market, composed after the supplied bridge crop.
// Fixed geometry is merged by material; the scene is still until the iron-flower performance.
export function buildWorld({miniature=false}={}){
 const root=new THREE.Group(), batches=new Map(), lanternPositions=[];
 let seed=83;const rand=()=>{seed=(1664525*seed+1013904223)>>>0;return seed/4294967296};
 const mat=(color,extra={})=>new THREE.MeshStandardMaterial({color,roughness:.87,metalness:0,...extra});
 const M={sand:mat('#ccbba4'),stone:mat('#bcb5af'),paving:mat('#ded0b8'),wood:mat('#8a5d4b'),woodLight:mat('#b28667'),woodDark:mat('#644d48'),plaster:mat('#ead7b6'),plasterPink:mat('#d7b5a2'),roof:mat('#555d5b'),roofEdge:mat('#73766b'),roofDark:mat('#3e4847'),cloth:mat('#d5a18e'),cream:mat('#ede0bf'),sage:mat('#99ab91'),leaf:mat('#668970',{side:THREE.DoubleSide}),leafLight:mat('#a7b36d',{side:THREE.DoubleSide}),leafDark:mat('#426e5d',{side:THREE.DoubleSide}),rose:mat('#d3b2b0'),gold:mat('#deb783'),window:mat('#f9cf88',{emissive:'#ffc679',emissiveIntensity:3.6}),red:mat('#b57363'),skin:mat('#e0bc97'),waterSide:mat('#839fa6',{roughness:.4}),base:mat('#b9b5bd')};
 M.lanternLight=M.window.clone();M.lanternLight.emissiveIntensity=3.2;M.window.emissiveIntensity=1.1;
 function add(g,m,p=[0,0,0],r=[0,0,0],s=[1,1,1],parent=null){
  const mesh=new THREE.Mesh(g,m);mesh.position.set(...p);mesh.rotation.set(...r);mesh.scale.set(...s);
  if(parent){parent.add(mesh);mesh.castShadow=true;mesh.receiveShadow=true;return mesh}
  mesh.updateMatrix();g.applyMatrix4(mesh.matrix);if(!batches.has(m))batches.set(m,[]);batches.get(m).push(g);return mesh;
 }
 const box=(w,h,d,m,x,y,z,parent=null)=>add(Math.min(w,h,d)>.055?new RoundedBoxGeometry(w,h,d,1,Math.min(.025,Math.min(w,h,d)*.16)):new THREE.BoxGeometry(w,h,d),m,[x,y,z],[0,0,0],[1,1,1],parent);
 function ball(r,m,x,y,z,scale=[1,1,1],parent=null){return add(new THREE.SphereGeometry(r,miniature?10:14,miniature?7:10),m,[x,y,z],[0,rand()*6,0],scale,parent)}
 function beam(a,b,r,m,parent=null,sides=5){const av=new THREE.Vector3(...a),bv=new THREE.Vector3(...b),g=new THREE.CylinderGeometry(r,r,av.distanceTo(bv),sides);g.applyQuaternion(new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0,1,0),bv.clone().sub(av).normalize()));return add(g,m,av.add(bv).multiplyScalar(.5).toArray(),[0,0,0],[1,1,1],parent)}
 function tube(pts,r,m,parent=null){const curve=new THREE.CatmullRomCurve3(pts.map(p=>new THREE.Vector3(...p)));return add(new THREE.TubeGeometry(curve,Math.max(12,pts.length*(miniature?1:5)),r,miniature?4:5,false),m,[0,0,0],[0,0,0],[1,1,1],parent)}
 function patch(points,depth,m,y){const shape=new THREE.Shape();shape.moveTo(points[0][0],-points[0][1]);for(let i=1;i<points.length;i++)shape.lineTo(points[i][0],-points[i][1]);shape.closePath();return add(new THREE.ExtrudeGeometry(shape,{depth,bevelEnabled:true,bevelThickness:.12,bevelSize:.14,bevelSegments:2,curveSegments:24}),m,[0,y,0],[-Math.PI/2,0,0]);}
 // The river continues beyond both ends of the composition; no circular display plinth.
 box(34,.8,28,M.waterSide,0,-.55,0);
 const waterMaterial=new THREE.ShaderMaterial({transparent:false,uniforms:{time:{value:0},day:{value:0}},vertexShader:`varying vec3 wp;void main(){wp=position;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}`,fragmentShader:`varying vec3 wp;uniform float time;uniform float day;
 void main(){ vec2 p=wp.xy; float a=sin(p.x*2.4+p.y*3.9+time*.55);float b=sin(p.x*5.2-p.y*2.6+time*.38); float c=sin(p.y*14.+sin(p.x*3.+time*.2)*1.8-time*.5);float rip=pow(max(0.,a*b),7.)*.055+pow(max(0.,c),24.)*.017; vec3 base=mix(vec3(.43,.59,.65),vec3(.57,.71,.69),day);float sheen=exp(-pow((p.x+p.y*.18+1.6)/2.5,2.))*smoothstep(-7.,7.,p.y);base=mix(base,vec3(.78,.67,.66),sheen*.32*(1.-day*.5));base+=rip;gl_FragColor=vec4(base,1.);
 #include <tonemapping_fragment>
 #include <colorspace_fragment>
 }`});
 const water=new THREE.Mesh(new THREE.PlaneGeometry(34,28),waterMaterial);water.rotation.x=-Math.PI/2;water.position.y=-.045;root.add(water);
 const [left,right]=BANKS;
 patch(left,.45,M.sand,-.02);patch(right,.45,M.sand,-.02);
 // Quays built in two staggered courses, with a worn stone coping.
 for(const side of [-1,1])for(let j=0;j<44;j++){
  const z=-10.8+j*.5,x=side*(5.45+Math.max(0,Math.abs(z)-3)*.09);
  for(let row=0;row<2;row++)box(.34,.22,.46,j%4===0?M.sand:M.stone,x,.05+row*.23,z+(row?.2:0));
  box(.53,.08,.49,M.paving,x,.52,z);
 }
 for(const side of [-1,1])for(let i=0;i<15;i++)for(let j=0;j<8;j++){
  box(.43,.026,.37,(i+j)%5?M.paving:M.sand,side*(5.3+i*.46),.59,(j-3.5)*.39);
 }
 const arch=x=>.62+2.8*(1-(x/5.15)**2);
 // Broad, continuous masonry arch and rising parapets follow the supplied picture.
 // Every voussoir is a wedge; the river opening is genuinely open underneath.
 const spans=58,width=3.65;
 for(let i=0;i<spans;i++){
  const x0=-5.15+i*10.3/spans,x1=x0+10.3/spans-.009;
  const shape=new THREE.Shape();shape.moveTo(x0,arch(x0)-.68);shape.lineTo(x1,arch(x1)-.68);shape.lineTo(x1,arch(x1)-.09);shape.lineTo(x0,arch(x0)-.09);shape.closePath();
  add(new THREE.ExtrudeGeometry(shape,{depth:width,bevelEnabled:false}),i%5?M.stone:M.sand,[0,0,-width/2]);
  const x=(x0+x1)/2,tilt=Math.atan(-5.6*x/26.5225);
  for(let j=0;j<7;j++)add(new THREE.BoxGeometry(.177,.11,.515),((i+j)%7)?M.paving:M.sand,[x,arch(x),-.0+(j-3)*.52],[0,0,tilt]);
 }
 for(const side of [-1,1]){
  const z=side*1.91;
  for(let i=0;i<19;i++){
   const x=-5.05+i*10.1/18,y=arch(x);
   box(.13,.88,.15,M.paving,x,y+.43,z);box(.2,.065,.2,M.paving,x,y+.9,z);
   ball(.065,M.sand,x,y+.975,z,[1,.75,1]);
   if(i<18){const next=x+10.1/18,m=(x+next)/2,tilt=Math.atan(-5.6*m/26.5225);
    add(new THREE.BoxGeometry(.45,.27,.09),M.stone,[m,arch(m)+.23,z],[0,0,tilt]);
    add(new THREE.BoxGeometry(.49,.08,.15),M.paving,[m,arch(m)+.74,z],[0,0,tilt]);
    for(const dx of [-.15,0,.15])box(.027,.33,.06,M.sand,m+dx,arch(m+dx)+.52,z);
   }
  }
  const ring=[];for(let k=0;k<=40;k++){const x=-5.15+k*10.3/40;ring.push([x,arch(x)-.12,side*1.84])}tube(ring,.055,M.paving);
  // Carved roundel at the crown, as a small relief in the arch face.
  add(new THREE.TorusGeometry(.17,.028,8,24),M.paving,[0,arch(0)-.4,side*1.84]);
 }
 function lantern(x,y,z,s=.23,parent=null){
  beam([x,y+.38*s,z],[x,y+.9*s,z],.015,M.woodDark,parent);
  add(new THREE.SphereGeometry(s,16,12),M.lanternLight,[x,y,z],[0,0,0],[.72,1,.72],parent);
  add(new THREE.CylinderGeometry(s*.56,s*.56,.05,10),M.red,[x,y+s*.87,z],[0,0,0],[1,1,1],parent);add(new THREE.CylinderGeometry(s*.48,s*.48,.04,10),M.red,[x,y-s*.88,z],[0,0,0],[1,1,1],parent);
  beam([x,y-s,z],[x,y-s-.13,z],.012,M.red,parent);
  if(!parent)lanternPositions.push([x,y,z]);
 }
 // Four tall square bridgehead lanterns echo the landmark posts in the reference.
 for(const x of [-5.1,5.1])for(const z of [-2.02,2.02]){
  const y=arch(x);
  box(.42,.17,.42,M.stone,x,y+.08,z);box(.18,1.75,.18,M.woodDark,x,y+.95,z);
  box(.48,.57,.48,M.lanternLight,x,y+2.03,z);
  for(const dx of [-.245,.245])for(const dz of [-.245,.245])box(.035,.63,.035,M.woodDark,x+dx,y+2.03,z+dz);
  box(.58,.07,.58,M.woodDark,x,y+2.35,z);box(.56,.07,.56,M.woodDark,x,y+1.72,z);
  lanternPositions.push([x,y+2.03,z]);
 }
 // Curved roof surfaces, individual tile seams, lifted eaves and ridge finials.
 function roof(x,y,z,w,d,material=M.roof){
  for(let side of [-1,1]){
   const pos=[],idx=[];const nx=10,ns=10;
   for(let i=0;i<=nx;i++)for(let j=0;j<=ns;j++){const u=i/nx,t=j/ns;const xx=(u-.5)*w;const lift=.17*Math.pow(Math.abs(u-.5)*2,6)*t;pos.push(x+xx,y+.66*(1-t)**2+.13*t**7+lift,z+side*t*d/2);}
   for(let i=0;i<nx;i++)for(let j=0;j<ns;j++){const a=i*(ns+1)+j,b=a+ns+1;if(side>0)idx.push(a,a+1,b,b,a+1,b+1);else idx.push(a,b,a+1,b,b+1,a+1)}
   const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(pos,3));g.setIndex(idx);g.computeVertexNormals();add(g,material);
   for(let k=0;k<=Math.ceil(w/.14);k++){
    const xx=-w/2+k*w/Math.ceil(w/.14),ps=[];for(let j=0;j<=8;j++){const t=j/8;ps.push([x+xx,y+.66*(1-t)**2+.13*t**7+.17*Math.pow(Math.abs(xx)/(w/2),6)*t+.014,z+side*t*d/2])}tube(ps,.016,M.roofEdge);
   }
   beam([x-w/2,y+.13,z+side*d/2],[x+w/2,y+.13,z+side*d/2],.047,M.roofDark);
  }
  tube([[x-w/2-.1,y+.87,z],[x-w/2+.12,y+.7,z],[x,y+.71,z],[x+w/2-.12,y+.7,z],[x+w/2+.1,y+.87,z]],.06,M.roofDark);
 }
 function house(x,z,w=2,d=1.7,h=1.5,style=0){
  box(w+.22,.17,d+.22,M.stone,x,.62,z);box(w,h,d,style?M.plasterPink:M.plaster,x,.7+h/2,z);
  for(let xx of [-w/2,w/2])for(let zz of [-d/2,d/2])box(.09,h+.08,.09,M.wood,x+xx,.74+h/2,z+zz);
  for(let yy of [.86,1.3,.7+h-.07])box(w,.055,d+.04,M.wood,x,yy,z);
  for(let side of [-1,1]){
   const zz=z+side*(d/2+.025);
   for(let i=0;i<3;i++){const xx=x+(i-1)*w*.29;box(w*.19,h*.43,.026,M.window,xx,.84+h*.45,zz);for(let q=-1;q<=1;q++)box(.025,h*.44,.04,M.wood,xx+q*w*.06,.84+h*.45,zz);box(w*.2,.028,.05,M.wood,xx,.84+h*.45,zz);}
  }
  roof(x,.7+h,z,w+.55,d+.5);
  box(w+.18,.14,d+.18,M.woodDark,x,.7+h-.06,z);
  for(let side of [-1,1])for(let k=-2;k<=2;k++){
   const xx=x+k*w*.19;box(.1,.12,.29,M.woodLight,xx,.7+h-.16,z+side*d*.51);box(.24,.06,.13,M.wood,xx,.7+h-.23,z+side*d*.52);
  }
  for(let side of [-1,1])for(let k=0;k<Math.ceil(w/.18);k++)box(.045,h*.35,.055,M.wood,x-w*.45+k*w*.9/Math.ceil(w/.18),.9,z+side*(d/2+.02));
  for(const xx of [x-w*.38,x+w*.38])lantern(xx,1.65,z+d/2+.26,.18);
 }
 // Rooflines follow the busy street to each end of the bridge.
 house(-7.7,-3.7,3.3,2.3,2.1);house(-10.6,-3.6,2.1,2.2,2.65,1);house(-13,-3.8,2.2,2.3,1.9);
 house(-7.5,-7.1,2.8,2.4,1.8);house(-10.6,-7,3,2.5,2.1,1);house(-13.2,-7.5,2,2.5,1.8);
 house(7.6,-3.6,3.5,2.2,2);house(10.8,-3.6,2.5,2.3,2.65,1);house(13.3,-3.5,2.1,2.4,1.7);
 house(7.8,-7.2,3.5,2.5,2.3);house(11.1,-7.1,2.7,2.4,1.8);house(13.8,-7.4,2,2.6,2.3,1);
 house(-12,4.8,2.9,2.2,2.25);house(-13.3,8.6,2.5,2.6,1.85,1);
 house(11.6,4.8,2.8,2.1,2);house(12,8.3,3.3,2.5,2.3);
 for(const [cx,cz] of [[-7.8,-1.7],[7.4,-1.55],[7.6,2.4]])for(let i=0;i<7;i++)for(let j=0;j<3;j++){
  box(.25+rand()*.04,.022,.3+rand()*.03,(i+j)%3?M.paving:M.stone,cx+(i-3)*.3,.605,cz+(j-1)*.34);
 }
 // An open tea house, set behind the foreground market so it does not mask the arch.
 {const x=-10.3,z=7.3;box(2.2,.2,1.8,M.wood,x,.62,z);for(const dx of [-.94,.94])for(const dz of [-.7,.7])beam([x+dx,.65,z+dz],[x+dx,2.5,z+dz],.055,M.wood);roof(x,2.45,z,2.65,2.25);box(1.5,.1,.4,M.woodLight,x,1,z+.45);for(const dx of [-.75,.75])lantern(x+dx,2.1,z+.7,.16);}
 function stall(x,z,w=1.2,color=M.cloth){
  for(const dx of [-w/2,w/2])for(const dz of [-.4,.4])beam([x+dx,.6,z+dz],[x+dx,1.9,z+dz],.032,M.wood);
  box(w, .12,.8,M.woodLight,x,1.05,z);
  const g=new THREE.PlaneGeometry(w+.25,1.2,12,8),p=g.attributes.position;for(let i=0;i<p.count;i++){let xx=p.getX(i),yy=p.getY(i);p.setXYZ(i,xx,1.87+.15*(1-(yy/.6)**2)-.06*Math.cos(xx*15),yy)}g.computeVertexNormals();add(g,color,[x,0,z]);
  for(let k=0;k<8;k++){const xx=x-w/2+(k+.5)*w/8;box(w/8,.14,.045,k%2?M.cream:color,xx,1.79,z+.6);}
  for(let k=0;k<8;k++)ball(.075,k%3?M.gold:M.red,x-w*.36+(k%4)*w*.23,1.18,z+(k<4?-.18:.12));
 }
 // Double-sided cloth for viewing from below and behind.
 M.cloth.side=THREE.DoubleSide;M.cream.side=THREE.DoubleSide;M.sage.side=THREE.DoubleSide;
 for(const side of [-1,1]){
  stall(side*6.6,-1.9,1.3,M.cream);stall(side*8.2,-1.9,1.5,M.cloth);stall(side*10,-1.9,1.5,M.sage);
  stall(side*7,3.2,1.35,M.cream);stall(side*8.7,3.3,1.4,M.cloth);
 }
 stall(-7.1,6.3,1.4,M.sage);stall(7.4,6.4,1.5,M.cream);
 function umbrella(x,z){const y=1.95;beam([x,.6,z],[x,y+.2,z],.025,M.wood);add(new THREE.ConeGeometry(.8,.27,12,1,true),M.cream,[x,y,z]);for(let i=0;i<12;i++){let a=i*Math.PI/6;beam([x,y+.15,z],[x+Math.cos(a)*.8,y-.13,z+Math.sin(a)*.8],.012,M.woodLight)}ball(.05,M.wood,x,y+.19,z);box(.65,.09,.65,M.wood,x,1,z);}
 umbrella(-10.1,2.9);umbrella(10.2,2.7);
 const marketLayout=createMarketLayout();
 let personIndex=0;const spectatorPositions=marketLayout.people.map(p=>[p.x,.62,p.z]);
 function person(x,y,z,color=M.sage,rotation=0,parent=null,scale=1,pose='watch'){
  const g=createPerson({cloth:color,variant:personIndex++,pose,scale});g.position.set(x,y,z);g.rotation.y=rotation;
  if(parent){parent.add(g);return g}
  spectatorPositions.push([x,y,z]);g.updateMatrixWorld(true);g.traverse(o=>{if(o.isMesh){const geom=o.geometry.clone().applyMatrix4(o.matrixWorld);if(!batches.has(o.material))batches.set(o.material,[]);batches.get(o.material).push(geom)}});return g;
 }
 // Visitors are shared, articulated instances managed by crowd.mjs, not baked copies.
 // Willow branches and hanging leaf chains, with quiet, open silhouettes.
 function leaf(x,y,z,s,angle,material){
 const p=[],ix=[];for(let i=0;i<=6;i++){const t=i/6,width=Math.pow(Math.sin(t*Math.PI),1.35)*s*.12;for(const side of [-1,0,1])p.push(width*side,-t*s,Math.sin(t*Math.PI)*s*(side===0?.14:.04));}
 for(let i=0;i<6;i++)for(let j=0;j<2;j++){const a=i*3+j,b=a+3;ix.push(a,b,a+1,a+1,b,b+1)}const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(p,3));g.setIndex(ix);g.computeVertexNormals();add(g,material,[x,y,z],[.15,angle,(rand()-.5)*.7]);
 }

 function willow(x,z,size=1){
  const y=.6,H=3.7*size;tube([[x,y,z],[x-.17,y+H*.42,z+.05],[x+.11,y+H*.75,z-.1],[x-.1,y+H,z]],.105*size,M.woodDark);
  for(let k=0;k<11;k++){
   const a=k*2.3999,dx=Math.cos(a),dz=Math.sin(a),reach=(1.1+rand()*.8)*size,top=[x+dx*reach,y+H+(rand()-.45)*.65,z+dz*reach];
   tube([[x+.08,y+H*.6,z],[x+dx*reach*.52,y+H+.16,z+dz*reach*.52],top],.024*size,M.wood);
   for(let q=0;q<24;q++){const aa=rand()*6.28,rr=Math.sqrt(rand())*.5*size;leaf(top[0]+Math.cos(aa)*rr,top[1]+(rand()-.5)*.35,top[2]+Math.sin(aa)*rr,.22*size,aa,q%3?M.leafLight:M.leaf);}
   for(let j=0;j<6;j++){
    const bx=top[0]+(rand()-.5)*.65*size,bz=top[2]+(rand()-.5)*.65*size,len=(.9+rand()*1.65)*size,pts=[];
    for(let n=0;n<14;n++){let t=n/13,px=bx+dx*.32*Math.sin(t*2.5),py=top[1]-t*len,pz=bz+dz*.22*t;pts.push([px,py,pz]);leaf(px,py,pz,(.17+rand()*.14)*size,a+(n%2?1.2:-1.2),n%3?M.leaf:M.leafLight);if(n<9)leaf(px+.05,py+.04,pz,.16*size,a+Math.PI,M.leafDark);}
    tube(pts,.006*size,M.leafDark);
   }
  }
 }

 willow(-14,1.9,1.1);willow(14.2,-7.5,1);willow(13.6,6.6,.9);
 function blossom(x,z,s=1){tube([[x,.6,z],[x+.15,1.65*s,z],[x-.05,2.7*s,z]],.09,M.wood);for(let i=0;i<13;i++){const a=i*2.4,r=rand()*.75*s,yy=2.4*s+rand()*.8*s;beam([x+.1,1.8*s,z],[x+Math.cos(a)*r,yy,z+Math.sin(a)*r],.025,M.wood);ball(.34*s,i%3===0?M.cream:M.rose,x+Math.cos(a)*r,yy,z+Math.sin(a)*r,[1,.75,1]);}}
 // No oversized blossom balls: the bridge and human silhouettes stay in focus.
 // Small planted margins, clay jars, rolled cloth and market baskets.
 for(const [x,z] of [[-5.8,-2.2],[-7.8,-1.5],[5.2,2],[8.5,2.7],[-8.2,3.2]]){
  add(new THREE.CylinderGeometry(.11,.15,.27,10),M.woodLight,[x,.74,z]);add(new THREE.TorusGeometry(.11,.022,5,12),M.wood,[x,.88,z],[Math.PI/2,0,0]);
 }
 // A low landing and mooring posts alongside the front bank.
 for(let i=0;i<15;i++)box(.16,.09,1.05,M.woodLight,-5.4+i*.18,.27,2.25);
 for(const x of [-5.4,-3])for(const z of [1.8,2.7])beam([x,-.3,z],[x,.7,z],.06,M.woodDark);
 tube([[-3,.65,1.8],[-3.2,.4,2.2],[-3,.65,2.7]],.025,M.cream);
 // Boat with curved hull, plank deck, woven canopy and a ferryman.
 const boat=new THREE.Group();root.add(boat);
 const hullShape=new THREE.Shape();hullShape.moveTo(0,-1.75);hullShape.bezierCurveTo(.6,-1.4,.65,.8,.3,1.5);hullShape.quadraticCurveTo(0,1.85,-.3,1.5);hullShape.bezierCurveTo(-.65,.8,-.6,-1.4,0,-1.75);
 add(new THREE.ExtrudeGeometry(hullShape,{depth:.28,bevelEnabled:true,bevelSegments:2,bevelSize:.12,bevelThickness:.12,steps:1}),M.woodDark,[0,.12,0],[-Math.PI/2,0,0],[1,1,1],boat);
 for(let i=0;i<19;i++){const z=-1.35+i*.145,w=.85*(1-.3*Math.abs(z)/1.4);box(w,.06,.135,M.woodLight,0,.46,z,boat)}
 for(const side of [-1,1])tube([[side*.12,.42,-1.65],[side*.51,.52,-.8],[side*.51,.52,.5],[side*.23,.7,1.6]],.045,M.wood,boat);
 const canopy=new THREE.CylinderGeometry(.56,.56,1.45,18,1,true,0,Math.PI);add(canopy,M.cream,[0,.67,-.1],[Math.PI/2,0,Math.PI/2],[1,1,1],boat);
 // Semicircular cover aligned along the keel, built explicitly to keep both ends open.
 boat.remove(boat.children[boat.children.length-1]);
 const cp=[],ci=[];for(let k=0;k<=18;k++)for(let j=0;j<2;j++){let a=k*Math.PI/18;cp.push(Math.cos(a)*.51,.66+Math.sin(a)*.6,-.85+j*1.45)}for(let k=0;k<18;k++){let a=k*2;ci.push(a,a+1,a+2,a+1,a+3,a+2)}const cg=new THREE.BufferGeometry();cg.setAttribute('position',new THREE.Float32BufferAttribute(cp,3));cg.setIndex(ci);cg.computeVertexNormals();add(cg,M.cream,[0,0,0],[0,0,0],[1,1,1],boat);
 for(let z=-.85;z<=.65;z+=.24){const pts=[];for(let k=0;k<=16;k++){const a=k*Math.PI/16;pts.push([Math.cos(a)*.52,.67+Math.sin(a)*.6,z])}tube(pts,.016,M.woodLight,boat)}
 lantern(0,1.02,.8,.14,boat);person(0,.5,1.15,M.roof,Math.PI,boat);beam([.1,.9,1.2],[1.05,-.1,2.2],.025,M.wood,boat);
 boat.position.set(1.1,.04,-2.8);boat.rotation.y=-.14;boat.scale.set(1.2,1.1,1.35);
 // The long cargo boat and curved ribs below the bridge are a second anchor to the painting.
 const freight=new THREE.Group();root.add(freight);freight.position.set(-.8,0,4.2);freight.rotation.y=.14;
 const hull=new THREE.Shape();hull.moveTo(0,-3.1);hull.bezierCurveTo(1.2,-2.4,1.1,2,.55,2.8);hull.quadraticCurveTo(0,3.3,-.55,2.8);hull.bezierCurveTo(-1.1,2,-1.2,-2.4,0,-3.1);
 add(new THREE.ExtrudeGeometry(hull,{depth:.4,bevelEnabled:true,bevelSize:.09,bevelThickness:.08,bevelSegments:2}),M.woodDark,[0,.1,0],[-Math.PI/2,0,0],[1,1,1],freight);
 for(let i=0;i<34;i++){const z=-2.55+i*.155,w=1.7*(1-.35*Math.abs(z)/2.8);box(w,.07,.145,M.woodLight,0,.57,z,freight)}
 for(const side of [-1,1])tube([[0,.58,-3],[side*.88,.75,-1.6],[side*.88,.78,1.5],[side*.35,.85,2.85]],.055,M.wood,freight);
 for(let i=0;i<6;i++){const z=-1.5+i*.46;const pts=[];for(let k=0;k<=14;k++){const a=k*Math.PI/14;pts.push([Math.cos(a)*.85,.73+Math.sin(a)*.75,z])}tube(pts,.035,M.woodLight,freight)}
 for(const x of [-.45,.35])for(const z of [-1.1,-.4,.3,.95]){box(.46,.35,.52,M.sand,x,.79,z,freight);beam([x-.23,.99,z],[x+.23,.99,z],.014,M.wood,freight)}
 beam([0,.6,-1.4],[0,3.25,-1.4],.035,M.woodDark,freight);
 tube([[0,3.2,-1.4],[-.6,1.3,1.5],[0,.6,2.7]],.012,M.cream,freight);
 person(.1,.62,2.2,M.sage,Math.PI,freight,.91,'carry');
 beam([.25,1.5,2.1],[1.7,.0,3.7],.025,M.wood,freight);
 // A pair of moored skiffs, kept well away from the falling sparks.
 const skiff=boat.clone();skiff.position.set(3.4,0,-6.3);skiff.scale.set(.7,.7,.85);skiff.rotation.y=.45;root.add(skiff);
 // Floating lanterns are few, deliberately placed instead of a particle field.
 for(const [x,z] of [[-2.1,5.8],[2.8,3.2],[3.2,-3.6],[-2.4,-4.8],[-.7,6.6]]){
  box(.18,.04,.18,M.wood,x,.015,z);box(.12,.13,.12,M.window,x,.1,z);
  const glow=new THREE.Mesh(new THREE.CircleGeometry(.45,24),new THREE.MeshBasicMaterial({color:'#efd7a4',transparent:true,opacity:.015,depthWrite:false}));glow.rotation.x=-Math.PI/2;glow.scale.y=1.8;glow.position.set(x,-.018,z);glow.visible=false;root.add(glow);
 }
 // Consolidate all fixed vessel parts into the same material batches.
 for(const vessel of [boat,freight,skiff]){
  vessel.updateMatrixWorld(true);vessel.traverse(o=>{if(o.isMesh){const g=o.geometry.clone().applyMatrix4(o.matrixWorld);if(!batches.has(o.material))batches.set(o.material,[]);batches.get(o.material).push(g)}});vessel.clear();
 }
 // A small number of broken golden reflections. Fully flat, inexpensive geometry.
 const shimmer=new THREE.Group();root.add(shimmer);
 const shimmerMat=new THREE.MeshBasicMaterial({color:'#f7d4a4',transparent:true,opacity:.27,depthWrite:false});
 for(let k=0;k<46;k++){const x=(rand()-.5)*7.8,z=1.1+rand()*5.5;if(Math.abs(x)>.6+z*.3)continue;const m=new THREE.Mesh(new THREE.PlaneGeometry(.06+rand()*.27,.012+rand()*.016),shimmerMat);m.rotation.x=-Math.PI/2;m.position.set(x,.008,z);shimmer.add(m)}
 // Merge static meshes, preserving normals and material identities.
 let triangles=0;
 for(const [material,geometries] of batches){
  let vertices=0,count=0;for(const g of geometries){vertices+=g.attributes.position.count;count+=g.index?g.index.count:g.attributes.position.count;}
  const pos=new Float32Array(vertices*3),norm=new Float32Array(vertices*3),indices=new Uint32Array(count);let v=0,k=0;
  for(const g of geometries){const p=g.attributes.position;pos.set(p.array,v*3);norm.set(g.attributes.normal.array,v*3);const n=g.index?g.index.count:p.count;for(let i=0;i<n;i++)indices[k++]=v+(g.index?g.index.getX(i):i);v+=p.count;g.dispose();}
  const merged=new THREE.BufferGeometry();merged.setAttribute('position',new THREE.BufferAttribute(pos,3));merged.setAttribute('normal',new THREE.BufferAttribute(norm,3));merged.setIndex(new THREE.BufferAttribute(indices,1));merged.userData.sampleExpandedIndex=true;merged.computeBoundingSphere();const mesh=new THREE.Mesh(merged,material);mesh.castShadow=true;mesh.receiveShadow=true;root.add(mesh);triangles+=count/3;
 }
 batches.clear();
 return {root,boat,water,waterMaterial,shimmerMat,materials:M,lanternPositions,triangles,stageY:arch(0)+.07,spectatorPositions,bridgeWidth:width,marketLayout};
}
