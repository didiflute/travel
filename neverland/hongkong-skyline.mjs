import * as T from './vendor/three.module.js';
import {bake} from './scene-resources.mjs';

// Recognisable harbour silhouettes, composed at miniature scale rather than geographic scale.
export function buildHarbourSkyline(){
 const root=new T.Group(),mat=(color,extra={})=>new T.MeshStandardMaterial({color,roughness:.58,...extra});
 const silver=mat('#bdcbd0',{metalness:.35}),glass=mat('#52758a',{metalness:.4,roughness:.27}),dark=mat('#364d60'),stone=mat('#c9c2ad'),green=mat('#426b52'),warm=mat('#f3d3a0',{emissive:'#ffc373',emissiveIntensity:.8}),cool=mat('#b4def0',{emissive:'#9fd6ec',emissiveIntensity:.6}),brick=mat('#a86148'),cream=mat('#e6d4af');
 stone.userData.snowSurface=true;green.userData.snowSurface=true;
 const mesh=(g,m,x=0,y=0,z=0)=>{const o=new T.Mesh(g,m);o.position.set(x,y,z);o.castShadow=o.receiveShadow=true;root.add(o);return o;};
 const box=(w,h,d,m,x,y,z)=>mesh(new T.BoxGeometry(w,h,d),m,x,y,z);
 const rod=(a,b,r,m)=>{const av=new T.Vector3(...a),bv=new T.Vector3(...b),o=mesh(new T.CylinderGeometry(r,r,av.distanceTo(bv),6),m,...av.clone().add(bv).multiplyScalar(.5).toArray());o.quaternion.setFromUnitVectors(new T.Vector3(0,1,0),bv.sub(av).normalize());return o;};
 box(21,.25,5.5,stone,0,.16,-7.25);box(21,.13,.6,cream,0,.33,-4.3);
 // Rising green ridge behind the towers binds the Hong Kong Island silhouette.
 for(let i=0;i<7;i++){const x=-8.8+i*2.8,o=mesh(new T.SphereGeometry(1,14,9),green,x,.15,-9.3);o.scale.set(2.1,.7+Math.sin(i*.8)**2*1.15,.7);}
 function office(x,z,w,d,h,index){box(w,h,d,index%2?glass:dark,x,.4+h/2,z);box(w+.08,.10,d+.08,silver,x,h+.42,z);for(let y=.65;y<h+.2;y+=.34){box(w+.015,.025,d+.015,silver,x,y,z);for(let c=0;c<Math.floor(w/.25);c++){const wx=x-w*.39+c*.25;if(Math.sin(y*72+c*17+index*19)>.05){box(.15,.19,.023,(c+index)%4===0?cool:warm,wx,y+.12,z+d/2+.02);box(.15,.19,.023,warm,wx,y+.12,z-d/2-.02);}}}for(let c=0;c<5;c++)box(.018,h,d+.025,silver,x-w*.42+c*w*.21,h/2+.4,z);}
 for(const [x,z,w,d,h,i] of [[-8.8,-7.5,1.4,1.5,3.2,0],[-6.6,-8,1.3,1.2,4.3,1],[-1.4,-8.1,1.3,1.3,4.9,2],[.3,-8.4,1.4,1.3,3.8,3],[5.1,-8,1.3,1.3,4.1,4],[7.1,-8.2,1.5,1.4,5.1,5],[9,-7.3,1.5,1.5,3.3,6]])office(x,z,w,d,h,i);
 // Two IFC: tall silver shaft, slightly tapering upper tiers and an open crown.
 const ix=-4.1,iz=-7.1;office(ix,iz,1.72,1.65,6.7,7);
 for(let level=0;level<4;level++){const w=1.65-level*.14;box(w,.38,w,glass,ix,7.22+level*.32,iz);for(let c=0;c<7;c++){box(.035,.42,w+.03,silver,ix-w*.43+c*w*.143,7.22+level*.32,iz);}}
 for(const dx of [-.53,-.18,.18,.53])for(const dz of [-.5,.5])box(.07,.56,.08,silver,ix+dx,8.43,iz+dz);
 // Bank of China: four unequal triangular prisms, crisp diagonal bracing and two masts.
 const bx=3,bz=-6.8,w=1.8;const heights=[6.7,5.4,4.1,3.15];
 for(let i=0;i<4;i++){const a=i*Math.PI/2,b=(i+1)*Math.PI/2,shape=new T.Shape();shape.moveTo(0,0);shape.lineTo([[-1,-1],[1,-1],[1,1],[-1,1]][i][0]*w*.5,[[-1,-1],[1,-1],[1,1],[-1,1]][i][1]*w*.5);shape.lineTo([[-1,-1],[1,-1],[1,1],[-1,1]][(i+1)%4][0]*w*.5,[[-1,-1],[1,-1],[1,1],[-1,1]][(i+1)%4][1]*w*.5);shape.closePath();const g=new T.ExtrudeGeometry(shape,{depth:heights[i],bevelEnabled:false});g.rotateX(-Math.PI/2);mesh(g,i%2?glass:dark,bx,.4,bz);}
 for(const side of [-1,1]){const z=bz+side*.925,h=side===1?6.7:4.1;for(let section=0;section<3;section++){const y=.4+section*h/3;rod([bx-.9,y,z],[bx+.9,y+h/3,z],.034,silver);rod([bx+.9,y,z],[bx-.9,y+h/3,z],.034,silver);}rod([bx-.9,.4,z],[bx-.9,h+.4,z],.034,silver);rod([bx+.9,.4,z],[bx+.9,h+.4,z],.034,silver);}
 for(const side of [-1,1]){const x=bx+side*.925,h=side===1?5.4:3.15;for(let section=0;section<3;section++){const y=.4+section*h/3;rod([x,y,bz-.9],[x,y+h/3,bz+.9],.03,silver);rod([x,y,bz+.9],[x,y+h/3,bz-.9],.03,silver);}}
 rod([bx,6.7,bz],[bx,8,bz],.025,silver);rod([bx-.22,6.7,bz-.22],[bx-.22,7.8,bz-.22],.022,silver);
 // HSBC-inspired suspended low block at the waterfront, with exposed structural crosses.
 box(2.6,2.5,1.35,glass,-.7,1.9,-5.5);for(let f=0;f<9;f++)box(2.7,.07,1.45,silver,-.7,.8+f*.27,-5.5);
 for(const x of [-2.05,-.7,.65]){box(.16,3.4,.17,silver,x,2.1,-4.78);for(let j=0;j<2;j++){rod([x-.5,1+j*1.2,-4.65],[x+.5,2.2+j*1.2,-4.65],.055,silver);rod([x+.5,1+j*1.2,-4.65],[x-.5,2.2+j*1.2,-4.65],.055,silver);}}
 // The low silver curved convention-centre roof keeps the waterfront open.
 box(3.5,.8,1.8,glass,7.2,.83,-5.4);const vertices=[],indices=[];for(let z=0;z<=10;z++)for(let x=0;x<=16;x++){const u=x/16*2-1,v=z/10*2-1;vertices.push(7.2+u*2.0,1.3+.7*(1-u*u)+.22*v,-5.2+v*1.12);}for(let z=0;z<10;z++)for(let x=0;x<16;x++){const n=z*17+x;indices.push(n,n+1,n+17,n+1,n+18,n+17);}const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(vertices,3));g.setIndex(indices);g.computeVertexNormals();const roof=silver.clone();roof.side=T.DoubleSide;roof.userData.snowSurface=true;mesh(g,roof);
 // Two piers and a continuous necklace of modest quay lamps.
 for(const x of [-6.8,5.4]){box(1.5,.19,2.3,stone,x,.25,-3.5);box(1.45,.15,1.8,green,x,1.18,-3.7);for(const dx of [-.58,.58])for(const z of [-4.3,-2.9])box(.05,.85,.05,cream,x+dx,.7,z);}
 for(let i=0;i<37;i++){const x=-10+i*.55;box(.025,.7,.025,dark,x,.72,-4.03);box(.09,.10,.09,warm,x,1.10,-4.03);}
 // Tsim Sha Tsui clock tower beside the near-bank ferry landing.
 box(.95,2.9,.95,brick,7.9,1.7,8.85);box(1.04,.15,1.04,cream,7.9,2.8,8.85);box(.75,.7,.75,cream,7.9,3.22,8.85);const cap=mesh(new T.ConeGeometry(.58,.48,4),green,7.9,3.8,8.85);cap.rotation.y=Math.PI/4;
 for(const side of [-1,1]){const face=mesh(new T.CircleGeometry(.22,24),warm,7.9,3.22,8.85+side*.382);if(side<0)face.rotation.y=Math.PI;box(.015,.18,.025,dark,7.9,3.27,8.85+side*.4);box(.13,.015,.025,dark,7.96,3.22,8.85+side*.4);}
 const stats=bake(root);return {root,stats,landmarks:['Two IFC','Bank of China Tower','HSBC waterfront','Convention Centre','Clock Tower']};
}
