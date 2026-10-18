import * as THREE from './vendor/three.module.js';

// Explicit ownership: a city leaves no GPU geometry, material, texture or shadow behind.
export function disposeScene(scene){
 const geometries=new Set(),materials=new Set(),textures=new Set();
 const texture=value=>{if(value?.isTexture)textures.add(value);else if(Array.isArray(value))value.forEach(texture)};
 scene.traverse(o=>{if(o.geometry)geometries.add(o.geometry);for(const m of [o.material].flat().filter(Boolean)){materials.add(m);Object.values(m).forEach(texture);if(m.uniforms)for(const u of Object.values(m.uniforms))texture(u.value)}o.shadow?.dispose();});
 scene.traverse(o=>{if(o.isInstancedMesh)o.dispose()});
 geometries.forEach(g=>g.dispose());textures.forEach(t=>t.dispose());materials.forEach(m=>m.dispose());scene.clear();
}

// Preserve indexed vertices while consolidating static architecture into material batches.
export function bake(root){
 root.updateMatrixWorld(true);const batches=new Map(),remove=[],old=new Set();
 root.traverse(o=>{if(!o.isMesh||o.userData.dynamic||o.material.transparent)return;
  let parent=o.parent;while(parent&&parent!==root){if(parent.userData.dynamic)return;parent=parent.parent}
  const g=o.geometry;if(!g.attributes.normal)g.computeVertexNormals();
  // Write each transformed vertex directly to its final buffer. The former
  // clone/apply/copy sequence temporarily held another full copy of every mesh.
  if(!batches.has(o.material))batches.set(o.material,[]);batches.get(o.material).push({g,matrix:o.matrixWorld.clone()});remove.push(o);old.add(g);
 });
 remove.forEach(o=>o.removeFromParent());
 let triangles=0,bytes=0;
 for(const [material,gs] of batches){
  let vertices=0,n=0;for(const {g} of gs){vertices+=g.attributes.position.count;n+=g.index?g.index.count:g.attributes.position.count}
  const positions=new Float32Array(vertices*3),normals=new Float32Array(vertices*3),uvs=new Float32Array(vertices*2),indices=new Uint32Array(n);let v=0,k=0;
  const colors=material.vertexColors?new Float32Array(vertices*3).fill(1):null;
  const point=new THREE.Vector3(),normal=new THREE.Vector3(),normalMatrix=new THREE.Matrix3();
  for(const {g,matrix} of gs){const p=g.attributes.position,np=g.attributes.normal;normalMatrix.getNormalMatrix(matrix);
   for(let j=0;j<p.count;j++){point.fromBufferAttribute(p,j).applyMatrix4(matrix);normal.fromBufferAttribute(np,j).applyNormalMatrix(normalMatrix);const i=(v+j)*3;positions[i]=point.x;positions[i+1]=point.y;positions[i+2]=point.z;normals[i]=normal.x;normals[i+1]=normal.y;normals[i+2]=normal.z;}
   if(g.attributes.uv)uvs.set(g.attributes.uv.array,v*2);if(colors&&g.attributes.color)colors.set(g.attributes.color.array,v*3);const count=g.index?g.index.count:p.count;for(let j=0;j<count;j++)indices[k++]=v+(g.index?g.index.getX(j):j);v+=p.count;}
  const geometry=new THREE.BufferGeometry();geometry.setAttribute('position',new THREE.BufferAttribute(positions,3));geometry.setAttribute('normal',new THREE.BufferAttribute(normals,3));geometry.setAttribute('uv',new THREE.BufferAttribute(uvs,2));geometry.setIndex(new THREE.BufferAttribute(indices,1));geometry.computeBoundingSphere();
  if(colors){geometry.setAttribute('color',new THREE.BufferAttribute(colors,3));bytes+=colors.byteLength;}
  const mesh=new THREE.Mesh(geometry,material);mesh.castShadow=true;mesh.receiveShadow=true;root.add(mesh);triangles+=n/3;bytes+=positions.byteLength+normals.byteLength+uvs.byteLength+indices.byteLength;
 }
 old.forEach(g=>g.dispose());return {triangles,geometryBytes:bytes,batches:batches.size};
}
