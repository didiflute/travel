import {HOME_VIEW} from './composition.mjs';

// Orbit plus bounded orthographic zoom, scoped to the scene canvas.
export function createViewControls(element,{onChange=()=>{},onDrag=()=>{},enabled=()=>true}={}){
 const orientation={...HOME_VIEW,zoom:1};let pointer=null;
 const minElevation=22*Math.PI/180,maxElevation=53*Math.PI/180;
 const wrap=angle=>Math.atan2(Math.sin(angle),Math.cos(angle));
 const atHome=()=>Math.abs(wrap(orientation.yaw-HOME_VIEW.yaw))<.0001&&Math.abs(orientation.elevation-HOME_VIEW.elevation)<.0001;
 function changed(){orientation.yaw=wrap(orientation.yaw);orientation.elevation=Math.max(minElevation,Math.min(maxElevation,orientation.elevation));element.dataset.viewYaw=orientation.yaw.toFixed(5);element.dataset.viewElevation=orientation.elevation.toFixed(5);onChange(orientation,atHome())}
 function end(event){if(!pointer||(event&&event.pointerId!==pointer.id))return;const id=pointer.id;pointer=null;if(element.hasPointerCapture(id))element.releasePointerCapture(id);onDrag(false)}
 function down(event){
  if(!enabled()||!event.isPrimary||event.button!==0)return;
  pointer={id:event.pointerId,x:event.clientX,y:event.clientY,yaw:orientation.yaw,elevation:orientation.elevation,touch:event.pointerType==='touch',active:false};
 }
 function move(event){
  if(!pointer||event.pointerId!==pointer.id)return;
  if(!pointer.touch&&!(event.buttons&1)){end(event);return}
  const dx=event.clientX-pointer.x,dy=event.clientY-pointer.y;
  if(!pointer.active){
   if(Math.hypot(dx,dy)<6)return;
   // A vertical touch gesture belongs to the surrounding page, not to this tile.
   if(pointer.touch&&Math.abs(dy)>Math.abs(dx)*1.15){pointer=null;return}
   pointer.active=true;element.setPointerCapture(pointer.id);onDrag(true);
  }
  orientation.yaw=pointer.yaw-dx*Math.PI*2/Math.max(320,Math.min(element.clientWidth,850));
  if(!pointer.touch)orientation.elevation=pointer.elevation+dy*.003;
  changed();
 }
 function reset(){end();Object.assign(orientation,HOME_VIEW,{zoom:1});changed()}
 function wheel(event){if(!enabled())return;event.preventDefault();const delta=event.deltaY*(event.deltaMode===1?16:event.deltaMode===2?element.clientHeight:1);orientation.zoom=Math.max(.6,Math.min(2.6,orientation.zoom*Math.exp(-Math.max(-250,Math.min(250,delta))*.0014)));changed();}
 function key(event){
  if(!enabled()||!['ArrowLeft','ArrowRight','ArrowUp','ArrowDown','Home','+','=','-','_'].includes(event.key))return;
  event.preventDefault();
  if(event.key==='Home'){reset();return}
  if(event.key==='+'||event.key==='=')orientation.zoom=Math.min(2.6,orientation.zoom*1.15);
  if(event.key==='-'||event.key==='_')orientation.zoom=Math.max(.6,orientation.zoom/1.15);
  if(event.key==='ArrowLeft')orientation.yaw+=Math.PI/18;
  if(event.key==='ArrowRight')orientation.yaw-=Math.PI/18;
  if(event.key==='ArrowUp')orientation.elevation+=Math.PI/36;
  if(event.key==='ArrowDown')orientation.elevation-=Math.PI/36;
  changed();
 }
 element.tabIndex=0;element.setAttribute('role','group');element.setAttribute('aria-label','三维虹桥夜市。拖动旋转，方向键调整角度，Home 键回正。');
 element.dataset.viewYaw=orientation.yaw.toFixed(5);element.dataset.viewElevation=orientation.elevation.toFixed(5);
 element.addEventListener('wheel',wheel,{passive:false});
 element.addEventListener('pointerdown',down);element.addEventListener('pointermove',move);element.addEventListener('pointerup',end);element.addEventListener('pointercancel',end);element.addEventListener('lostpointercapture',end);element.addEventListener('keydown',key);
 return {orientation,reset,atHome,dispose(){end();element.removeEventListener('wheel',wheel);element.removeEventListener('pointerdown',down);element.removeEventListener('pointermove',move);element.removeEventListener('pointerup',end);element.removeEventListener('pointercancel',end);element.removeEventListener('lostpointercapture',end);element.removeEventListener('keydown',key)}};
}
