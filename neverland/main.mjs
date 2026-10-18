import * as THREE from './vendor/three.module.js';
import {createViewControls} from './view-controls.mjs';
import {buildWorld} from './world.mjs';
import {buildXian} from './xian.mjs';
import {buildLuoyang} from './luoyang.mjs';
import {buildDatong} from './datong.mjs';
import {buildTokyo} from './tokyo.mjs';
import {buildHongkong} from './hongkong.mjs';
import {createCrowd} from './crowd.mjs';
import {ironFlowers} from './iron-flowers.mjs';
import {cinematic} from './rendering.mjs';
import {disposeScene} from './scene-resources.mjs';
import {CELL,DEFAULT_LAYOUT,validLayout,migrateLayout,moveTile} from './rail-layout.mjs';
import {createRailway} from './railway.mjs';
import {createAtmosphere} from './world-atmosphere.mjs';
import {createWorldToolbar} from './world-toolbar.mjs';
import {createSecondStar} from './second-star.mjs';
const startup={moduleStart:performance.now(),readyAt:0,firstFrame:0};
const $=s=>document.querySelector(s),STORE='neverland-playground-layout-v1';
try {
 const reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;
 let layout=structuredClone(DEFAULT_LAYOUT);try{const saved=JSON.parse(localStorage.getItem(STORE));const migrated=migrateLayout(saved);if(migrated)layout=migrated}catch{}
 const renderer=new THREE.WebGLRenderer({antialias:true,alpha:false,powerPreference:'high-performance'});
 renderer.outputColorSpace=THREE.SRGBColorSpace;renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=1.15;
 renderer.shadowMap.enabled=true;renderer.shadowMap.type=THREE.PCFSoftShadowMap;renderer.shadowMap.autoUpdate=false;renderer.info.autoReset=false;
 $('#stage').appendChild(renderer.domElement);const canvas=renderer.domElement;
 canvas.setAttribute('aria-label','旅行记忆地图，拖动旋转，点击城市进入详情');
 const scene=new THREE.Scene();scene.background=new THREE.Color('#202d40');
 const camera=new THREE.OrthographicCamera(-30,30,22,-22,.1,900);
 const hemi=new THREE.HemisphereLight('#b4cbea','#685447',1.15);scene.add(hemi);
 const sun=new THREE.DirectionalLight('#ffdbb4',2.1);sun.position.set(-18,30,22);sun.castShadow=true;sun.shadow.mapSize.set(2048,2048);sun.shadow.bias=-.0008;sun.shadow.normalBias=.025;sun.shadow.radius=3;scene.add(sun,sun.target);
 const rim=new THREE.DirectionalLight('#849edb',1.5);rim.position.set(10,18,-20);scene.add(rim);
 const cityGroups={},cityData={};let startupReady=false,startupDisposed=false;let ui=null;let cameraTween=null,mapOrientation=null,detailShot='all',walkPlaying=false,walkElapsed=0;let editing=false,focused=false,selected=location.hash==='#xian'?'xian':'kaifeng',playing=false,elapsed=0,audio=null,drag=null,press=null,raf=0,previous=0,accumulator=0,frames=0,quality=1.25,slow=0,samples=0,adapted=false;
 const metadata={kaifeng:{name:'开封',subtitle:'虹桥 · 打铁花',button:'一起看打铁花',duration:7,status:'等一场满天金花',title:'汴河<em>· 一梦</em>',verse:'虹桥灯火，和你一起看满天金花',eyebrow:'KAIFENG · OUR NIGHT BY THE RIVER'},xian:{name:'西安',subtitle:'大雁塔 · 兵马俑',button:'敲响长安钟',duration:5,status:'轻轻一敲，听长安的回响',title:'长安<em>· 旧梦</em>',verse:'塔影与军阵，记得我们走过的长安',eyebrow:'XI’AN · THE DAYS WE WALKED'},luoyang:{name:'洛阳',subtitle:'龙门石窟 · 国际佛殿群',button:'乘车看夜色',duration:8,status:'小车沿岸慢行，灯火映在伊河上',title:'洛阳<em>· 晚风</em>',verse:'那晚坐在车上，隔着河看灯光里的龙门',eyebrow:'LUOYANG · A GARDEN OF OUR MEMORIES'},datong:{name:'大同',subtitle:'云冈石窟 · 悬空寺',button:'走过悬空栈道',duration:7,status:'崖壁上的回廊，脚下是山谷',title:'大同<em>· 云崖</em>',verse:'石刻的宁静，悬在山间的楼阁',eyebrow:'DATONG · BETWEEN STONE AND SKY'},tokyo:{name:'东京',subtitle:'浅草寺 · 昭和街巷 · 东京站',button:'一起看花火大会',duration:9,status:'店灯渐暖，等一场夏夜花火',title:'东京<em>· 花火</em>',verse:'穿过灯笼下的街巷，一起等夜空开花',eyebrow:'TOKYO · LIGHTS OF A SUMMER EVENING'}};
 metadata.hongkong={name:'香港',subtitle:'九龙城寨 · 维港 · 天星小轮',button:'乘小轮，看海风',duration:8,status:'密密的城，宽宽的海，等一艘绿白小轮',title:'香港<em>· 海风</em>',verse:'把密密的街巷留在身后，一起吹一会儿海风',eyebrow:'HONG KONG · ACROSS THE HARBOUR'};
 const labels={};for(const id of Object.keys(DEFAULT_LAYOUT)){
  const group=new THREE.Group();group.userData.city=id;scene.add(group);cityGroups[id]=group;
  const plinth=new THREE.Mesh(new THREE.BoxGeometry(CELL-.08,.7,CELL-.08),new THREE.MeshStandardMaterial({color:id==='xian'?'#b6ad98':'#a6b7b6',roughness:.85}));plinth.position.y=-.82;plinth.receiveShadow=true;
  if(id==='xian'){plinth.visible=false;const border=new THREE.Group();const strips=[[CELL,.7,1.42,0,-.82,-8.26],[CELL,.7,1.42,0,-.82,8.26],[1.22,.7,15.2,-8.35,-.82,0],[1.22,.7,15.2,8.35,-.82,0]];for(const [w,h,d,x,y,z] of strips){const p=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),plinth.material);p.position.set(x,y,z);p.receiveShadow=true;border.add(p)}plinth.geometry.dispose();group.add(border);group.userData.plinth=border}else{group.add(plinth);group.userData.plinth=plinth}
  const label=document.createElement('button');label.className='map-label';label.dataset.city=id;label.innerHTML='<b>'+metadata[id].name+'</b><span>'+metadata[id].subtitle+'</span>';label.onclick=()=>editing?select(id):enterCity(id);$('#mapLabels').appendChild(label);labels[id]=label;
 }
 const kaifeng=buildWorld({miniature:true}),kfLocal=new THREE.Group();kfLocal.scale.setScalar(.46);cityGroups.kaifeng.add(kfLocal);kfLocal.add(kaifeng.root);
 const crowd=createCrowd(kfLocal,kaifeng.materials,kaifeng.marketLayout,{reducedMotion:reduced}),flowers=ironFlowers(kfLocal,{reducedMotion:reduced,stageY:kaifeng.stageY});
 const xian=buildXian({reducedMotion:reduced});xian.root.scale.setScalar(.73);cityGroups.xian.add(xian.root);
 cityData.kaifeng={show:flowers};cityData.xian=xian;
 const luoyang=buildLuoyang({reducedMotion:reduced});luoyang.root.scale.setScalar(.73);cityGroups.luoyang.add(luoyang.root);cityData.luoyang=luoyang;
 let longmenReady=false;luoyang.ready.then(ok=>{longmenReady=ok;renderer.shadowMap.needsUpdate=true;});
 const datong=buildDatong({reducedMotion:reduced});datong.root.scale.setScalar(.73);cityGroups.datong.add(datong.root);cityData.datong=datong;datong.ready.then(()=>{renderer.shadowMap.needsUpdate=true;schedule();});
 const tokyo=buildTokyo({reducedMotion:reduced});tokyo.root.scale.setScalar(.73);cityGroups.tokyo.add(tokyo.root);cityData.tokyo=tokyo;
 const hongkong=buildHongkong({reducedMotion:reduced});hongkong.root.scale.setScalar(.73);cityGroups.hongkong.add(hongkong.root);cityData.hongkong=hongkong;
 const fx=cinematic(renderer,scene,camera,kaifeng);fx.ao.enabled=false;fx.mirror.getRenderTarget().setSize(384,384);kaifeng.shimmerMat.opacity=.18;fx.update(0,false);
 for(const name of ['roof','roofDark','roofEdge','stone','paving','sand'])kaifeng.materials[name].userData.snowSurface=true;
 for(const name of ['leaf','leafLight','leafDark'])kaifeng.materials[name].userData.seasonal=true;
 const atmosphere=createAtmosphere({scene,cityGroups,sun,hemi,rim,renderer,fx,reduced});
 const secondStar=createSecondStar({scene,camera,cityGroups,reduced,getLanguage:()=>atmosphere.state.language});
 const railway=createRailway(scene),grid=new THREE.Group();scene.add(grid);
 const marker=new THREE.Mesh(new THREE.PlaneGeometry(CELL-.15,CELL-.15),new THREE.MeshBasicMaterial({color:'#efca82',transparent:true,opacity:.25,depthWrite:false,side:THREE.DoubleSide}));marker.rotation.x=-Math.PI/2;marker.position.y=-.43;marker.visible=false;scene.add(marker);
 const selection=new THREE.LineLoop(new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(-8.9,-.43,-8.9),new THREE.Vector3(8.9,-.43,-8.9),new THREE.Vector3(8.9,-.43,8.9),new THREE.Vector3(-8.9,-.43,8.9)]),new THREE.LineBasicMaterial({color:'#efc98b',transparent:true,opacity:.65}));scene.add(selection);
 function save(){try{localStorage.setItem(STORE,JSON.stringify(layout))}catch{}}
 function bounds(extra=0){const p=Object.values(layout);return {minX:Math.min(...p.map(p=>p[0]))-extra,maxX:Math.max(...p.map(p=>p[0]))+extra,minZ:Math.min(...p.map(p=>p[1]))-extra,maxZ:Math.max(...p.map(p=>p[1]))+extra}}
 function shadow(){const b=bounds(),cx=focused?cityGroups[selected].position.x:(b.minX+b.maxX)*CELL/2,cz=focused?cityGroups[selected].position.z:(b.minZ+b.maxZ)*CELL/2,span=focused?15:Math.max(28,(b.maxX-b.minX+1)*CELL*.9,(b.maxZ-b.minZ+1)*CELL*.9);const off=sun.userData.offset||[-12,24,16];sun.position.set(cx+off[0],off[1],cz+off[2]);sun.target.position.set(cx,1,cz);Object.assign(sun.shadow.camera,{left:-span,right:span,top:span,bottom:-span,near:.5,far:400});sun.shadow.camera.updateProjectionMatrix();renderer.shadowMap.needsUpdate=true;fx.invalidateReflection()}
 function applyLayout(){for(const [id,p] of Object.entries(layout)){cityGroups[id].position.set(p[0]*CELL,0,p[1]*CELL);cityGroups[id].rotation.y=p[2]*Math.PI/2}scene.updateMatrixWorld(true);selection.position.copy(cityGroups[selected].position);railway.rebuild(layout);shadow()}
 function buildGrid(){disposeScene(grid);const b=bounds(1),positions=[];for(let c=b.minX;c<=b.maxX+1;c++){positions.push((c-.5)*CELL,-.46,(b.minZ-.5)*CELL,(c-.5)*CELL,-.46,(b.maxZ+.5)*CELL)}for(let r=b.minZ;r<=b.maxZ+1;r++){positions.push((b.minX-.5)*CELL,-.46,(r-.5)*CELL,(b.maxX+.5)*CELL,-.46,(r-.5)*CELL)}const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(positions,3));grid.add(new THREE.LineSegments(g,new THREE.LineBasicMaterial({color:'#97b9c1',transparent:true,opacity:.3})));grid.visible=editing}
 const view=createViewControls(canvas,{enabled:()=>!editing&&!(playing&&selected==='luoyang'),onChange(){frame();fx.invalidateReflection();schedule()},onDrag(active){document.body.classList.toggle('rotating',active)}});
 function positionMobileView(){
  if(focused&&innerWidth<=750){
   const introBottom=$('.intro').getBoundingClientRect().bottom,panelTop=$('.performance-control').getBoundingClientRect().top,tabs=$('#xianViews'),tabsTop=tabs.hidden?Infinity:tabs.getBoundingClientRect().top;
   const bottom=Math.min(panelTop||innerHeight*.65,tabsTop)-12,top=introBottom+20;
   const center=(top+Math.max(top+80,bottom))/2,offset=Math.max(0,innerHeight/2-center);
   camera.setViewOffset(innerWidth,innerHeight,0,offset,innerWidth,innerHeight);
  }else if(camera.view?.enabled)camera.clearViewOffset();
 }
 function frame(animate=false){
  document.body.classList.toggle('river-view',focused&&selected==='luoyang'&&detailShot==='river');
  document.body.classList.toggle('temple-view',focused&&((selected==='datong'&&detailShot==='temple')||(selected==='tokyo'&&detailShot==='hanabi')||(selected==='hongkong'&&detailShot==='harbour')));
  const from={position:camera.position.clone(),quaternion:camera.quaternion.clone(),span:camera.top-camera.bottom};
  cameraTween=null;
  const aspect=innerWidth/innerHeight,b=bounds(editing?1:0),target=new THREE.Vector3((b.minX+b.maxX)*CELL/2,1,(b.minZ+b.maxZ)*CELL/2);
  if(focused){
   let local=selected==='kaifeng'?new THREE.Vector3(0,1.5,0):new THREE.Vector3(0,2.0,0);
   if(selected==='xian'){if(detailShot==='pit')local.set(4.65,-.2,0);if(detailShot==='pagoda')local.set(-5.1,5,-1);if(detailShot==='wall')local.set(-.8,2.0,-8.05);local.multiplyScalar(.73)}
   else {if(selected==='luoyang'){local.set(-.5,3.3,0);if(detailShot==='river')local.set(-.4,3.8,0)}if(selected==='datong'){local.set(0,4.2,-.5);if(detailShot==='temple')local.set(5.3,7.0,-1.0);}if(selected==='tokyo'){local.set(0,3.7,-.2);if(detailShot==='hanabi')local.set(.6,7.0,-1.7);}if(selected==='hongkong'){local.set(0,3.1,0);if(detailShot==='harbour')local.set(0,3.2,-.4);}local.multiplyScalar(['luoyang','datong','tokyo','hongkong'].includes(selected)?.73:.46);}
   cityGroups[selected].updateMatrixWorld(true);target.copy(cityGroups[selected].localToWorld(local));
  }
  const {yaw,elevation}=view.orientation;camera.position.copy(target).add(new THREE.Vector3(Math.sin(yaw)*Math.cos(elevation),Math.sin(elevation),Math.cos(yaw)*Math.cos(elevation)).multiplyScalar(400));camera.lookAt(target);camera.updateMatrixWorld(true);
  let span;
  if(focused){const values=selected==='kaifeng'?[18.5,24]:selected==='hongkong'?(detailShot==='harbour'?[20,26]:[23,28]):selected==='tokyo'?(detailShot==='hanabi'?[27,30]:[23,27]):selected==='datong'?(detailShot==='temple'?[11.7,13.5]:[23,27]):selected==='luoyang'?(detailShot==='river'?[14.8,19]:[22,26]):detailShot==='pit'?[11.8,14]:detailShot==='pagoda'?[12.4,13]:detailShot==='wall'?[10.8,17]:[21.5,25];span=innerWidth<750?Math.max(values[0],values[1]/aspect):values[0]}
  else{let x=0,y=0;for(const xx of [(b.minX-.5)*CELL,(b.maxX+.5)*CELL])for(const zz of [(b.minZ-.5)*CELL,(b.maxZ+.5)*CELL])for(const yy of [-1,9]){const p=new THREE.Vector3(xx,yy,zz).applyMatrix4(camera.matrixWorldInverse);x=Math.max(x,Math.abs(p.x));y=Math.max(y,Math.abs(p.y))}span=Math.max(y*2.7,x*2.35/aspect);if(innerWidth<750)span*=.98}
  span/=view.orientation.zoom;camera.left=-span*aspect/2;camera.right=span*aspect/2;camera.top=span/2;camera.bottom=-span/2;camera.updateProjectionMatrix();
  if(animate&&!reduced){cameraTween={from,to:{position:camera.position.clone(),quaternion:camera.quaternion.clone(),span},start:performance.now(),duration:850};camera.position.copy(from.position);camera.quaternion.copy(from.quaternion);camera.top=from.span/2;camera.bottom=-from.span/2;camera.left=-from.span*aspect/2;camera.right=from.span*aspect/2;camera.updateProjectionMatrix()}
  positionMobileView();$('#overview').setAttribute('aria-pressed',String(!focused));
 }
 function stepCamera(now){if(!cameraTween)return;const t=Math.min(1,(now-cameraTween.start)/cameraTween.duration),e=t*t*(3-2*t),{from,to}=cameraTween;camera.position.lerpVectors(from.position,to.position,e);camera.quaternion.slerpQuaternions(from.quaternion,to.quaternion,e);const span=THREE.MathUtils.lerp(from.span,to.span,e),aspect=innerWidth/innerHeight;camera.top=span/2;camera.bottom=-span/2;camera.left=-span*aspect/2;camera.right=span*aspect/2;camera.updateProjectionMatrix();camera.updateMatrixWorld(true);fx.invalidateReflection();if(t>=1)cameraTween=null}
 function visibility(){
  for(const [id,group] of Object.entries(cityGroups)){group.visible=!focused||id===selected;group.userData.plinth.visible=!focused}
  railway.setVisible(!focused);crowd.root.visible=focused&&selected==='kaifeng';xian.setDetail(focused&&selected==='xian');luoyang.setDetail(focused&&selected==='luoyang');datong.setDetail(focused&&selected==='datong');tokyo.setDetail(focused&&selected==='tokyo');hongkong.setDetail(focused&&selected==='hongkong');grid.visible=editing&&!focused;selection.visible=!focused;document.body.classList.toggle('city-detail',focused);
  $('#returnMap').hidden=!focused;$('#editLayout').hidden=focused;$('#overview').hidden=focused;$('#xianViews').hidden=!(focused&&selected==='xian');$('#wallWalk').hidden=!(focused&&selected==='xian');$('#journalLink').hidden=!focused;
  fx.ao.enabled=focused&&quality>=1;fx.ao.kernelRadius=.2;fx.ao.minDistance=.001;fx.ao.maxDistance=.025;
  fx.mirror.getRenderTarget().setSize(focused&&selected==='kaifeng'?640:384,focused&&selected==='kaifeng'?640:384);
  atmosphere.light(playing&&['kaifeng','luoyang','tokyo'].includes(selected));
  const intro=$('.intro');intro.querySelector('h1').innerHTML=focused?metadata[selected].title:'把回忆，<em>拼成世界</em>';
  intro.querySelector('.verse').textContent=focused?metadata[selected].verse:'每一座城市，都藏着我们一起走过的时光';
  intro.querySelector('.eyebrow').innerHTML='<span></span>'+(focused?metadata[selected].eyebrow:'THE PLACES WE KEEP');
  $('#hint').textContent=focused?'拖动旋转 · 从不同角度看这段旅行 · 返回地图继续探索':'点击城市进入回忆 · 拖动旋转 · 调整布局，让列车换条路线';
  $('#journalLink').href='https://didiflute.github.io/travel/'+({hongkong:'hk-2025'}[selected]||selected+'-2026')+'/';shadow();ui?.sync(true);
 }
 function enterCity(id,push=true){
  if(editing){select(id);return}if(focused&&selected===id)return;
  if(!focused)mapOrientation={...view.orientation};view.orientation.zoom=1;if(playing)finish();if(walkPlaying)finishWalk();selected=id;focused=true;detailShot='all';xian.setWallMode(false);
  for(const b of document.querySelectorAll('[data-shot]'))b.setAttribute('aria-pressed',String(b.dataset.shot==='all'));select(id);view.orientation.yaw=layout[id][2]*Math.PI/2-(id==='luoyang'?.32:id==='datong'?.3:id==='tokyo'?.42:id==='hongkong'?.36:Math.PI/4);view.orientation.elevation=id==='luoyang'?.48:id==='datong'?.5:id==='tokyo'?.47:id==='hongkong'?.53:Math.atan(1/Math.sqrt(2));visibility();frame(true);
  if(push)history.pushState(null,'','#'+id);$('#returnMap').focus({preventScroll:true});schedule();
 }
 function returnMap(push=true){if(playing)finish();if(walkPlaying)finishWalk();focused=false;detailShot='all';xian.setWallMode(false);if(mapOrientation)Object.assign(view.orientation,mapOrientation);visibility();frame(true);if(push)history.pushState(null,'','#map');schedule()}
 function setShot(shot){if(!focused||selected!=='xian')return;if(playing)finish();if(walkPlaying)finishWalk();detailShot=shot;xian.setWallMode(shot==='wall');view.orientation.yaw=layout.xian[2]*Math.PI/2+(shot==='pit'?Math.PI/4:-Math.PI/4);for(const b of document.querySelectorAll('[data-shot]'))b.setAttribute('aria-pressed',String(b.dataset.shot===shot));frame(true);shadow();schedule()}
 function finishWalk(){walkPlaying=false;$('#wallWalk').disabled=false;$('#wallWalk').textContent='在城墙上走走 · 8 秒';$('#showStatus').textContent='城墙上的风，还记得那天的我们。';$('#stopShow').hidden=true}
 function resize(){const ratio=Math.min(devicePixelRatio,quality,Math.sqrt(1400000/(innerWidth*innerHeight)));renderer.setPixelRatio(ratio);renderer.setSize(innerWidth,innerHeight);fx.composer.setPixelRatio(ratio);fx.resize(innerWidth,innerHeight);frame();schedule()}
 function select(id){if(playing)finish();selected=id;document.body.dataset.city=id;selection.position.copy(cityGroups[id].position);const m=metadata[id];$('#selectedName').textContent=m.name;$('#selectedPlace').textContent=m.subtitle;$('#showLabel').textContent=m.button;$('#showStatus').textContent=m.status;$('.duration').textContent=m.duration+' 秒';for(const key of Object.keys(labels))labels[key].setAttribute('aria-pressed',String(key===id));schedule()}
 function stopAudio(){if(audio){audio.close().catch(()=>{});audio=null}}
 function ring(){stopAudio();const Audio=window.AudioContext||window.webkitAudioContext;if(!Audio)return;audio=new Audio();audio.resume().catch(()=>{});const now=audio.currentTime;[196,398,561,820,1084].forEach((hz,i)=>{const o=audio.createOscillator(),g=audio.createGain();o.frequency.value=hz;g.gain.setValueAtTime(.0001,now);g.gain.exponentialRampToValueAtTime(.045/(1+i*.6),now+.012);g.gain.exponentialRampToValueAtTime(.0001,now+4.8-i*.4);o.connect(g);g.connect(audio.destination);o.start(now);o.stop(now+5)})}
 function finish(){playing=false;atmosphere.light();elapsed=0;cityData[selected].show.reset(true);stopAudio();fx.setPerformance(false);$('#ironFlower').disabled=editing;$('#ironFlower').dataset.state='finished';$('#showLabel').textContent=metadata[selected].button;$('#showStatus').textContent=metadata[selected].status;$('#stopShow').hidden=true;document.body.classList.remove('performing');ui?.sync(true)}
 $('#ironFlower').onclick=()=>{if(editing||playing||!focused)return;if(walkPlaying)finishWalk();if(selected==='xian'&&detailShot==='wall')setShot('all');playing=true;elapsed=0;view.orientation.zoom=1;atmosphere.light(['kaifeng','luoyang','tokyo'].includes(selected));cityData[selected].show.reset();if(selected==='xian')ring();if(selected==='hongkong'){detailShot='harbour';view.orientation.yaw=layout.hongkong[2]*Math.PI/2-.16;view.orientation.elevation=.39;frame(true)}if(selected==='tokyo'){detailShot='hanabi';view.orientation.yaw=layout.tokyo[2]*Math.PI/2-.25;view.orientation.elevation=.35;frame(true)}if(selected==='datong'){detailShot='temple';view.orientation.yaw=layout.datong[2]*Math.PI/2-.18;view.orientation.elevation=.38;frame(true)}if(selected==='luoyang'){detailShot='river';luoyang.setRideMode(true);view.orientation.yaw=layout.luoyang[2]*Math.PI/2;view.orientation.elevation=.27;frame(true)}fx.setPerformance(true);$('#ironFlower').disabled=true;$('#ironFlower').dataset.state='playing';$('#showLabel').textContent=selected==='hongkong'?'小轮开了，海风正好':selected==='tokyo'?'抬头，花火开了':selected==='datong'?'沿着回廊，慢慢走':selected==='luoyang'?'接驳车沿河驶过':selected==='xian'?'听，长安的回响':'金花正在绽放';$('#showStatus').textContent=selected==='hongkong'?'绿白船身驶过维港，身后散开一弯水纹':selected==='tokyo'?'一朵一朵盛开，金色余光缓缓落下':selected==='datong'?'走过细长木栈道，停下来看看山谷':selected==='luoyang'?'车慢慢走，灯影留在河面上':selected==='kaifeng'?'这一刻，一起仰望满天金花':'钟声悠长，慢慢听它散去';$('#stopShow').hidden=false;document.body.classList.add('performing');schedule()};
 $('#stopShow').onclick=()=>{if(playing)finish();if(walkPlaying)finishWalk()};
 $('#wallWalk').onclick=()=>{if(!focused||selected!=='xian')return;setShot('wall');xian.walk.reset();walkPlaying=true;walkElapsed=0;$('#wallWalk').disabled=true;$('#wallWalk').textContent='一起沿着城墙走一段…';$('#showStatus').textContent='从小南门出发，把脚步放慢一点。';$('#stopShow').hidden=false;schedule()};
 for(const b of document.querySelectorAll('[data-shot]'))b.onclick=()=>setShot(b.dataset.shot);
 $('#returnMap').onclick=()=>returnMap();
 $('#resetView').onclick=()=>{if(playing)finish();detailShot='all';luoyang.setRideMode(false);view.reset();frame(true)};
 function edit(value){if(focused)returnMap(false);if(playing)finish();editing=value;focused=false;document.body.classList.toggle('editing',value);$('#editLayout').textContent=value?'完成布局':'调整布局';$('#editLayout').setAttribute('aria-pressed',String(value));$('#editActions').hidden=!value;$('#ironFlower').disabled=value;$('#hint').textContent=value?'拖动城市到空格 · 放到另一座城市上交换位置 · 可旋转城市':'点击城市放大 · 拖动旋转 · 调整城市位置，列车跟着改道';buildGrid();frame();schedule()}
 $('#editLayout').onclick=()=>edit(!editing);
 $('#overview').onclick=()=>{if(editing)edit(false);returnMap();view.reset();frame();schedule()};
 function commit(next){layout=next;applyLayout();save();buildGrid();$('#hint').textContent='位置已保存，列车换了一条新路线';ui?.sync(true);schedule()}
 $('#rotateTile').onclick=()=>{const next=structuredClone(layout);next[selected][2]=(next[selected][2]+1)%4;commit(next)};
 $('#resetLayout').onclick=()=>{commit(structuredClone(DEFAULT_LAYOUT));frame()};
 for(const button of document.querySelectorAll('[data-move]'))button.onclick=()=>{const [dx,dz]=button.dataset.move.split(',').map(Number),p=layout[selected],c=p[0]+dx,r=p[1]+dz;if(Math.abs(c)<=8&&Math.abs(r)<=8){commit(moveTile(layout,selected,c,r));ui?.sync(true);frame()}};
 const ray=new THREE.Raycaster(),mouse=new THREE.Vector2(),plane=new THREE.Plane(new THREE.Vector3(0,1,0),0);
 function point(e){mouse.set(e.clientX/innerWidth*2-1,1-e.clientY/innerHeight*2);ray.setFromCamera(mouse,camera);return ray.ray.intersectPlane(plane,new THREE.Vector3())}
 function pick(e){point(e);const hits=ray.intersectObjects(Object.values(cityGroups).filter(g=>g.visible),true);for(const hit of hits){let o=hit.object;while(o){if(o.userData.city)return o.userData.city;o=o.parent}}return null}
 canvas.addEventListener('pointerdown',e=>{if(e.button!==0)return;press={x:e.clientX,y:e.clientY,id:pick(e)};if(!editing||!press.id)return;select(press.id);const p=point(e);drag={id:press.id,pointer:e.pointerId,offset:p.clone().sub(cityGroups[press.id].position),cell:layout[press.id].slice(0,2)};canvas.setPointerCapture(e.pointerId);document.body.classList.add('dragging');});
 canvas.addEventListener('pointermove',e=>{if(!drag)return;const p=point(e);if(!p)return;p.sub(drag.offset);const c=Math.max(-8,Math.min(8,Math.round(p.x/CELL))),r=Math.max(-8,Math.min(8,Math.round(p.z/CELL)));drag.cell=[c,r];cityGroups[drag.id].position.set(p.x,.55,p.z);selection.position.set(p.x,.55,p.z);marker.position.set(c*CELL,-.43,r*CELL);marker.visible=true;fx.invalidateReflection();schedule()});
 function endDrag(e,cancel=false){if(drag){const d=drag;drag=null;marker.visible=false;document.body.classList.remove('dragging');if(canvas.hasPointerCapture(d.pointer))canvas.releasePointerCapture(d.pointer);if(cancel)applyLayout();else commit(moveTile(layout,d.id,...d.cell));}else if(!cancel&&press&&Math.hypot(e.clientX-press.x,e.clientY-press.y)<6&&press.id){if(editing)select(press.id);else enterCity(press.id)}press=null}
 canvas.addEventListener('pointerup',e=>endDrag(e));canvas.addEventListener('pointercancel',e=>endDrag(e,true));
 canvas.addEventListener('lostpointercapture',e=>{if(drag)endDrag(e,true)});
 canvas.addEventListener('keydown',e=>{if(e.key==='Escape'&&focused){returnMap();return}if(!editing)return;const moves={ArrowLeft:[-1,0],ArrowRight:[1,0],ArrowUp:[0,-1],ArrowDown:[0,1]};if(e.key==='Escape'){if(drag)endDrag(e,true);else edit(false);return}if(moves[e.key]){e.preventDefault();const [dx,dz]=moves[e.key],p=layout[selected],c=p[0]+dx,r=p[1]+dz;if(Math.abs(c)<=8&&Math.abs(r)<=8){commit(moveTile(layout,selected,c,r));frame()}}});
 function schedule(){ui?.sync();if(startupReady&&!raf&&!document.hidden)raf=requestAnimationFrame(render)}
 const projected=new THREE.Vector3();
 function render(now){raf=0;if(document.hidden)return;const dt=previous?Math.max(0,(now-previous)/1000):0;previous=now;accumulator+=dt;if(frames>1&&accumulator<1/30){schedule();return}const elapsedStep=accumulator,step=Math.min(.1,accumulator);accumulator=0;
  atmosphere.update(step);stepCamera(now);secondStar.update(step);if(!focused&&!drag)railway.update(step);if(focused&&!reduced){if(selected==='kaifeng')crowd.update(step,playing);else cityData[selected].update(step)}
  if(walkPlaying){walkElapsed+=elapsedStep;xian.walk.update(Math.min(8,walkElapsed));if(walkElapsed>=8)finishWalk()}
  if(playing){elapsed+=elapsedStep;cityData[selected].show.update(elapsed);if(elapsed>=metadata[selected].duration)finish()}
  renderer.info.reset();fx.composer.render();frames++;if(frames===1)startup.firstFrame=performance.now();
  for(const [id,group] of Object.entries(cityGroups)){projected.set(0,-.3,7.1).applyMatrix4(group.matrixWorld).project(camera);const label=labels[id];label.style.left=(projected.x*.5+.5)*innerWidth+'px';label.style.top=(-projected.y*.5+.5)*innerHeight+'px';label.hidden=focused||projected.z>1||Math.abs(projected.x)>1.05||Math.abs(projected.y)>1.05}
  $('#loading')?.remove();
  if(!adapted&&step>0){samples++;if(step>.065)slow++;if(samples>=65){if(slow>50){quality=.9;fx.simplify();resize()}adapted=true}}
  schedule();
 }
 const panelObserver=new ResizeObserver(entries=>{const height=entries[0].borderBoxSize?.[0]?.blockSize||$('.performance-control').getBoundingClientRect().height;if(height>0){document.documentElement.style.setProperty('--memory-panel-height',height+'px');positionMobileView();schedule();}});panelObserver.observe($('.performance-control'));
 addEventListener('resize',resize);
 document.addEventListener('visibilitychange',()=>{if(document.hidden){if(raf)cancelAnimationFrame(raf);raf=0;stopAudio()}else{previous=0;accumulator=0;schedule()}});
 function route(){const id=location.hash.slice(1);if(metadata[id])enterCity(id,false);else returnMap(false)}addEventListener('hashchange',route);addEventListener('popstate',route);
 ui=createWorldToolbar({metadata,atmosphere,getState:()=>({selected,focused,editing,playing,walkPlaying,detailShot}),onEnter(id){if(editing)select(id);else enterCity(id);},onLanguage(){ui.sync(true);},onTime(value){if(playing)finish();atmosphere.setTime(value);schedule();}});
 applyLayout();buildGrid();select(selected);resize();visibility();if(metadata[location.hash.slice(1)])enterCity(location.hash.slice(1),false);schedule();
 // Compile the visible materials in parallel before the first draw. Use the
 // same HDR target as the composer, so this warms the actual shader variants.
 async function prepareFirstFrame(){
  $('#loading p').textContent='正在点亮我们的旅行地图…';
  const warm=new THREE.Group();scene.traverseVisible(o=>{if(o.isMesh||o.isPoints||o.isLine||o.isSprite)warm.add(o.isMesh&&!o.isInstancedMesh?new THREE.Mesh(o.geometry,o.material).copy(o,false):o.clone(false));});
  const previousTarget=renderer.getRenderTarget();
  try{renderer.setRenderTarget(fx.composer.readBuffer);const ready=renderer.compileAsync(warm,camera,scene);renderer.setRenderTarget(previousTarget);await ready;}
  catch(error){renderer.setRenderTarget(previousTarget);console.warn('Shader warmup deferred to first draw',error);}
  finally{warm.clear();if(!startupDisposed){startup.readyAt=performance.now();startupReady=true;schedule();}}
 }
 prepareFirstFrame();
 // Read-only diagnostics make layout, route and resource checks reproducible.
 window.__neverlandStats=()=>{const screen=(x,y,z)=>{const p=new THREE.Vector3(x,y,z).project(camera);return {x:(p.x*.5+.5)*innerWidth,y:(-p.y*.5+.5)*innerHeight}};return {startup:{...startup},world:atmosphere.stats(),star:secondStar.stats(),toolbar:ui.stats(),zoom:view.orientation.zoom,city:selected,editing,focused,layout:structuredClone(layout),contexts:1,activeScenes:1,visibleCities:Object.keys(cityGroups).filter(id=>cityGroups[id].visible),detailShot,walkPlaying,walkElapsed,cameraMoving:!!cameraTween,aoEnabled:fx.ao.enabled,warriors:xian.stats.warriors,pitDepth:xian.stats.pitDepth,pagodaLevels:xian.stats.pagodaLevels,walking:focused?(selected==='kaifeng'?crowd.stats.walking:cityData[selected].stats.walking):0,crowdPosition:crowd.people.filter(p=>p.moving).slice(0,2).map(p=>[p.x,p.z]),frames,playing,pixels:canvas.width*canvas.height,geometryCount:renderer.info.memory.geometries,textureCount:renderer.info.memory.textures,programs:renderer.info.programs.length,railway:railway.stats(),longmenReady,luoyangTriangles:luoyang.stats.triangles,luoyangMemory:luoyang.diagnostics(),luoyangBlooms:luoyang.stats.blooms,datong:datong.diagnostics(),datongTriangles:datong.stats.triangles,tokyo:tokyo.diagnostics(),tokyoTriangles:tokyo.stats.triangles,hongkong:hongkong.diagnostics(),hongkongTriangles:hongkong.stats.triangles,triangles:kaifeng.triangles+xian.stats.triangles+luoyang.stats.triangles+datong.stats.triangles+tokyo.stats.triangles+hongkong.stats.triangles,tileScreens:Object.fromEntries(Object.entries(layout).map(([id,p])=>[id,screen(p[0]*CELL,0,p[1]*CELL)])),slots:Array.from({length:5},(_,c)=>Array.from({length:5},(_,r)=>({c:c-1,r:r-2,...screen((c-1)*CELL,0,(r-2)*CELL)}))).flat()}};
 canvas.addEventListener('webglcontextlost',e=>{e.preventDefault();$('#error').hidden=false});
 addEventListener('pagehide',()=>{startupDisposed=true;if(raf)cancelAnimationFrame(raf);panelObserver.disconnect();stopAudio();ui.dispose();secondStar.dispose();atmosphere.dispose();view.dispose();fx.dispose();luoyang.dispose();hongkong.dispose();railway.dispose();disposeScene(scene);renderer.dispose()},{once:true});
}catch(error){console.error(error);$('#loading')?.remove();$('#error').hidden=false}
