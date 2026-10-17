import * as T from './vendor/three.module.js';

// Hundreds of small warm lamp halos in one draw, without individual shadow lights.
export function lampGlows(lamps){
 const positions=[],corners=[],sizes=[],indices=[];
 for(const [x,y,z,size=.14] of lamps){const start=positions.length/3;for(const [u,v] of [[-1,-1],[1,-1],[1,1],[-1,1]]){positions.push(x,y,z);corners.push(u,v);sizes.push(size);}indices.push(start,start+1,start+2,start,start+2,start+3);}
 const geometry=new T.BufferGeometry();geometry.setAttribute('position',new T.Float32BufferAttribute(positions,3));geometry.setAttribute('corner',new T.Float32BufferAttribute(corners,2));geometry.setAttribute('lampSize',new T.Float32BufferAttribute(sizes,1));geometry.setIndex(indices);geometry.computeBoundingSphere();
 const material=new T.ShaderMaterial({transparent:true,depthWrite:false,blending:T.AdditiveBlending,
 vertexShader:`attribute vec2 corner;attribute float lampSize;varying vec2 q;void main(){q=corner;vec4 view=modelViewMatrix*vec4(position,1.);float scale=length(modelViewMatrix[0].xyz);view.xy+=corner*lampSize*scale;gl_Position=projectionMatrix*view;}`,
 fragmentShader:`varying vec2 q;void main(){float r=length(q);if(r>1.)discard;float halo=exp(-r*r*6.)*pow(1.-r,1.2);vec3 gold=mix(vec3(1.,.33,.045),vec3(1.,.79,.35),exp(-r*r*55.));gl_FragColor=vec4(gold,halo*.78);}`});
 const mesh=new T.Mesh(geometry,material);mesh.userData.dynamic=true;mesh.castShadow=mesh.receiveShadow=false;mesh.renderOrder=2;return mesh;
}
