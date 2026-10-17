import * as THREE from './vendor/three.module.js';

// Equal foreshortening on all three axes, without flattening the actual 3D scene.
export const HOME_VIEW={yaw:-Math.PI/4,elevation:Math.atan(1/Math.sqrt(2))};
export function frameMarket(camera,width,height,view=HOME_VIEW){
 const aspect=width/height,spanY=width<750?22/aspect:24;
 camera.left=-spanY*aspect/2;camera.right=spanY*aspect/2;
 camera.top=spanY/2;camera.bottom=-spanY/2;
 const target=new THREE.Vector3(0,1.5,1.2);
 const c=Math.cos(view.elevation);
 camera.position.copy(target).addScaledVector(new THREE.Vector3(Math.sin(view.yaw)*c,Math.sin(view.elevation),Math.cos(view.yaw)*c),46);
 camera.lookAt(target);
 camera.setViewOffset(width,height,width<750?0:-width*.035,width<750?-height*.025:0,width,height);
 camera.updateProjectionMatrix();camera.updateMatrixWorld();
}
