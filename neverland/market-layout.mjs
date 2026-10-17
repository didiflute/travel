import * as THREE from './vendor/three.module.js';

// The walkable space is shared by placement, movement and geometry checks.
export const BANKS=[
 [[-16,-12],[-8,-12],[-6.2,-8],[-5.4,-4],[-5.15,-1],[-5.15,1.4],[-5.7,4.5],[-5.2,8],[-7,12],[-16,12]],
 [[5.4,-12],[16,-12],[16,12],[7.5,12],[6.1,8],[5.6,4],[5.15,1.4],[5.15,-1],[5.7,-5]]
];
export const OBSTACLES=[
 [-7.7,-3.7,3.3,2.3],[-10.6,-3.6,2.1,2.2],[-13,-3.8,2.2,2.3],[-7.5,-7.1,2.8,2.4],[-10.6,-7,3,2.5],[-13.2,-7.5,2,2.5],
 [7.6,-3.6,3.5,2.2],[10.8,-3.6,2.5,2.3],[13.3,-3.5,2.1,2.4],[7.8,-7.2,3.5,2.5],[11.1,-7.1,2.7,2.4],[13.8,-7.4,2,2.6],
 [-12,4.8,2.9,2.2],[-13.3,8.6,2.5,2.6],[11.6,4.8,2.8,2.1],[12,8.3,3.3,2.5],[-10.3,7.3,2.2,1.8],
 ...[-1,1].flatMap(s=>[[s*6.6,-1.9,1.55,1.2],[s*8.2,-1.9,1.75,1.2],[s*10,-1.9,1.75,1.2],[s*7,3.2,1.6,1.2],[s*8.7,3.3,1.65,1.2]]),
 [-7.1,6.3,1.65,1.2],[7.4,6.4,1.75,1.2],[-10.1,2.9,1.6,1.6],[10.2,2.7,1.6,1.6]
];
function inside(x,z,poly){let result=false;for(let i=0,j=poly.length-1;i<poly.length;j=i++){const [a,b]=poly[i],[c,d]=poly[j];if((b>z)!==(d>z)&&x<(c-a)*(z-b)/(d-b)+a)result=!result}return result}
export function walkable(x,z,clearance=.2){
 if(Math.abs(x)<5.5||!BANKS.some(poly=>inside(x,z,poly)))return false;
 for(const [ox,oz,w,d] of OBSTACLES)if(Math.abs(x-ox)<w/2+clearance&&Math.abs(z-oz)<d/2+clearance)return false;
 return true;
}
export function sampleRoute(route,distance,out,tangent){
 const f=THREE.MathUtils.clamp(distance/route.length,0,1)*(route.points.length-1),i=Math.min(route.points.length-2,Math.floor(f)),t=f-i;
 out.lerpVectors(route.points[i],route.points[i+1],t);tangent.subVectors(route.points[i+1],route.points[i]).normalize();
}
export function createMarketLayout(){
 let seed=5187;const rand=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296};
 const groups=[],people=[],routes=[];
 const paths=[
  {nodes:[[6.7,.25],[8.6,.6],[10.8,.5],[13.2,.8]],size:3},
  {nodes:[[5.9,-.25],[5.85,.6],[5.9,1.65]],size:2},
  {nodes:[[6.8,-5.37],[8.2,-5.35],[9.1,-5.23],[11.6,-5.28],[13.6,-5.45]],size:2},
  {nodes:[[9.4,4.7],[8.9,5.6],[8.65,7.4],[8.8,9.5]],size:1}
 ];
 for(const side of [-1,1])for(let n=0;n<paths.length;n++){
  const path=paths[n],curve=new THREE.CatmullRomCurve3(path.nodes.map(([x,z])=>new THREE.Vector3(side*(x+(side>0&&n===1?.2:0)),.62,side>0&&n===2?Math.min(z,-5.32):z)),false,'centripetal');
  const points=curve.getSpacedPoints(160),length=curve.getLength(),route={points,length};routes.push(route);
  const lower=n===2?.55:.2,upper=length-lower;
  const group={route,lower,upper,d:THREE.MathUtils.clamp(length*(.18+rand()*.65),lower,upper),sign:rand()>.5?1:-1,speed:.22+rand()*.065,wait:0,pace:1};groups.push(group);
  for(let j=0;j<path.size;j++)people.push({group,sideOffset:(j-(path.size-1)/2)*(n===2?.20:.48),alongOffset:j%2?(n===2?.48:.17):0,variant:(people.length+2)%6,scale:path.size===3&&j===2?.65:.87+rand()*.12,phase:rand()*Math.PI*2,heading:0,moving:true});
 }
 const nearRoute=(x,z)=>routes.some(r=>r.points.some(p=>Math.hypot(p.x-x,p.z-z)<.72));
 // Scattered conversation pockets, never rows: each centre, angle and spacing differs.
 const sizes=[2,3,2,1,3,2,2,1];
 for(const side of [-1,1])for(let g=0;g<sizes.length;g++){
  const count=sizes[g];let found=false;
  for(let attempt=0;attempt<900&&!found;attempt++){
   const zone=g%3,x=side*(zone===0?6+rand()*7:zone===1?5.9+rand()*4.1:7.4+rand()*6),z=zone===0?-.9+rand()*2.8:zone===1?4.15+rand()*5.8:-10.7+rand()*1.4;
   const orientation=rand()*Math.PI*2,candidates=[];
   for(let j=0;j<count;j++){
    const a=orientation+j*Math.PI*2/count,r=count===1?0:.34+rand()*.11,px=x+Math.sin(a)*r,pz=z+Math.cos(a)*r;
    candidates.push({x:px,z:pz,y:.62,heading:count>1?Math.atan2(x-px,z-pz):(rand()-.5)*Math.PI,variant:(g+j+(side>0?1:0))%6,scale:j===2&&g%2===0?.64:.86+rand()*.13,phase:rand()*Math.PI*2,moving:false});
   }
   if(candidates.every(p=>walkable(p.x,p.z,.27)&&!nearRoute(p.x,p.z)&&people.filter(q=>!q.moving).every(q=>Math.hypot(q.x-p.x,q.z-p.z)>.54))){people.push(...candidates);found=true}
  }
 }
 const p=new THREE.Vector3(),t=new THREE.Vector3();
 for(const v of people)if(v.moving){sampleRoute(v.group.route,v.group.d+v.alongOffset,p,t);v.x=p.x+t.z*v.sideOffset;v.z=p.z-t.x*v.sideOffset;v.y=.62;v.heading=Math.atan2(t.x*v.group.sign,t.z*v.group.sign)}
 return {people,groups,routes};
}
