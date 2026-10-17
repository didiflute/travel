import * as T from './vendor/three.module.js';
// A closed stone volume. Texture UVs describe the face, while the back and perimeter are actual geometry.
export function stoneSculpture(data,texture,sideMaterial){
 const root=new T.Group(),frontMaterial=new T.MeshStandardMaterial({map:texture,roughness:.98,color:'#d2c4b1',side:T.DoubleSide});
 const add=(geo,material)=>{geo.computeVertexNormals();const mesh=new T.Mesh(geo,material);mesh.castShadow=mesh.receiveShadow=true;root.add(mesh);};
 const front=new T.BufferGeometry();front.setAttribute('position',new T.Float32BufferAttribute(data.positions,3));front.setAttribute('uv',new T.Float32BufferAttribute(data.uv,2));front.setIndex(data.indices);add(front,frontMaterial);
 const back=new T.BufferGeometry();back.setAttribute('position',new T.Float32BufferAttribute(data.back,3));const reverse=[];for(let i=0;i<data.indices.length;i+=3)reverse.push(data.indices[i],data.indices[i+2],data.indices[i+1]);back.setIndex(reverse);add(back,sideMaterial);
 const nu=data.nu||100,nv=data.nv||160,outline=[];for(let i=0;i<=nu;i++)outline.push(i);for(let j=1;j<=nv;j++)outline.push(j*(nu+1)+nu);for(let i=nu-1;i>=0;i--)outline.push(nv*(nu+1)+i);for(let j=nv-1;j>0;j--)outline.push(j*(nu+1));const positions=[];
 for(let i=0;i<outline.length;i++){const a=outline[i],b=outline[(i+1)%outline.length];for(const [source,k] of [[data.positions,a],[data.back,a],[data.positions,b],[data.positions,b],[data.back,a],[data.back,b]])positions.push(...source.slice(k*3,k*3+3));}
 const sides=new T.BufferGeometry();sides.setAttribute('position',new T.Float32BufferAttribute(positions,3));add(sides,sideMaterial);root.userData.dynamic=true;root.userData.triangles=data.indices.length/3*2+positions.length/9;
 return root;
}
