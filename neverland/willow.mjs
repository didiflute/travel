import * as T from './vendor/three.module.js';
import {bake} from './scene-resources.mjs';
export function buildWillow(seed=1,scale=1){
 const root=new T.Group(),wood=new T.MeshStandardMaterial({color:'#55564a',roughness:1});
 let state=seed*7919;const rnd=()=>{state=(state*1664525+1013904223)>>>0;return state/4294967296;};
 const tube=(points,r)=>{const o=new T.Mesh(new T.TubeGeometry(new T.CatmullRomCurve3(points.map(p=>new T.Vector3(...p))),12,r,5,false),wood);o.castShadow=true;root.add(o);};
 tube([[0,0,0],[.09,.85,-.04],[-.03,1.7,.05],[.13,2.65,-.05]],.09);
 const vertices=[],colors=[],wind=[];const color=new T.Color(),a=new T.Vector3(),b=new T.Vector3(),c=new T.Vector3(),d=new T.Vector3();
 function leaf(x,y,z,angle,length,sway=.10,phase=0){
  const w=length*.23,dx=Math.cos(angle)*w,dz=Math.sin(angle)*w;a.set(x,y,z);b.set(x+dx,y-length*.45,z+dz);c.set(x+.025*Math.sin(angle),y-length,z+.025*Math.cos(angle));d.set(x-dx,y-length*.48,z-dz);const mid=new T.Vector3(x+.012,y-length*.47,z+.014);
  for(const v of [a,b,mid,b,c,mid,c,d,mid,d,a,mid]){vertices.push(v.x,v.y,v.z);colors.push(color.r,color.g,color.b);wind.push(sway,phase+seed*.73);}
 }
 for(let j=0;j<22;j++){
  const angle=j*2.39996,reach=1.05+rnd()*.72,tipY=2.2+rnd()*.9;
  tube([[.04,1.65+rnd()*.35,0],[Math.sin(angle)*reach*.6,3.15+rnd()*.2,Math.cos(angle)*reach*.6],[Math.sin(angle)*reach,tipY,Math.cos(angle)*reach]],.012+rnd()*.015);
  for(let k=0;k<65;k++){const t=.15+rnd()*.85,r=reach*t,ang=angle+(rnd()-.5)*.8; color.setHSL(.23,.35,.30+rnd()*.13);leaf(Math.sin(ang)*r,2.65+Math.sin(t*Math.PI)*.5+(rnd()-.5)*.25,Math.cos(ang)*r,ang,.22+rnd()*.11);}
  for(let strand=0;strand<9;strand++){
   const ang=angle+(rnd()-.5)*.75,r=reach*(.65+rnd()*.46),sx=Math.sin(ang)*r,sz=Math.cos(ang)*r,sy=tipY+.22+rnd()*.45,length=.95+rnd()*1.55,lean=(rnd()-.5)*.35,steps=18+Math.floor(rnd()*8);
   for(let k=0;k<steps;k++){const t=k/(steps-1),xx=sx+Math.sin(ang)*Math.sin(t*Math.PI)*.14+lean*t,yy=sy-t*length,zz=sz+Math.cos(ang)*.15*Math.sin(t*Math.PI);
    for(const side of [-1,1]){color.setHSL(.21+rnd()*.035,.25+rnd()*.2,.29+rnd()*.14);leaf(xx+side*(.028+.018*Math.sin(t*8)),yy,zz+side*.018,ang+side*.75,.16+rnd()*.09,.1+t*t*.95,ang*.7);}
   }
  }
 }
 const stats=bake(root),geometry=new T.BufferGeometry();geometry.setAttribute('position',new T.Float32BufferAttribute(vertices,3));geometry.setAttribute('color',new T.Float32BufferAttribute(colors,3));geometry.setAttribute('willowWind',new T.Float32BufferAttribute(wind,2));geometry.computeVertexNormals();
 const time={value:0},material=new T.MeshStandardMaterial({vertexColors:true,side:T.DoubleSide,roughness:.83,emissive:'#62723a',emissiveIntensity:.16});
 material.userData.seasonal=true;
 material.onBeforeCompile=s=>{s.uniforms.willowTime=time;s.vertexShader='uniform float willowTime;attribute vec2 willowWind;\n'+s.vertexShader;s.vertexShader=s.vertexShader.replace('#include <begin_vertex>',`#include <begin_vertex>
 float phase=willowWind.y;float breeze=sin(willowTime*.68+phase)*.12+sin(willowTime*1.13+phase*1.7)*.025;float w=breeze*willowWind.x;transformed.x+=w;transformed.z+=w*.42+sin(willowTime*.51+phase)*.025*willowWind.x;transformed.y+=abs(w)*.07;`);};material.customProgramCacheKey=()=> 'willow-hanging-breeze-v2';
 const leaves=new T.Mesh(geometry,material);leaves.castShadow=false;leaves.receiveShadow=true;leaves.userData.dynamic=true;root.add(leaves);root.scale.setScalar(scale);root.userData.dynamic=true;
 return {root,triangles:stats.triangles+vertices.length/9,update(t){time.value=t;}};
}
