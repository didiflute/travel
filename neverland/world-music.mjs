// Background music: the five recordings chosen for the original overview (spring / summer / autumn / winter / night).
// "Follow season & time" picks a track from the toolbar season + time; tracks cross-fade through Web Audio gain nodes
// (iOS ignores element.volume). Nothing plays until the viewer presses play. Credits are required by the CC licences.
const TRACKS={
 spring:{file:new URL('./music/spring-april.mp3',import.meta.url).href,t:{zh:'柴可夫斯基《四季》四月 · 松雪草',en:'Tchaikovsky, The Seasons — April: Snowdrop'},c:'Bernd Krueger (piano-midi.de), CC BY-SA 2.0 DE',u:'https://commons.wikimedia.org/wiki/File:Tchaikovsky_the_Seasons_April.ogg'},
 summer:{file:new URL('./music/summer-entertainer.mp3',import.meta.url).href,t:{zh:'乔普林《艺人》',en:'Scott Joplin, The Entertainer'},c:'Gnissah (Wikimedia Commons), public domain',u:'https://commons.wikimedia.org/wiki/File:Scott_Joplin_-_The_Entertainer_(1902).ogg'},
 autumn:{file:new URL('./music/autumn-october.mp3',import.meta.url).href,t:{zh:'柴可夫斯基《四季》十月 · 秋之歌',en:'Tchaikovsky, The Seasons — October: Autumn Song'},c:'Bernd Krueger (piano-midi.de), CC BY-SA 2.0 DE',u:'https://commons.wikimedia.org/wiki/File:Tchaikovsky_the_Seasons_October.ogg'},
 winter:{file:new URL('./music/winter-jingle-bells.mp3',import.meta.url).href,t:{zh:'《Jingle Bells》（静谧版）',en:'Jingle Bells (Calm)'},c:'Kevin MacLeod (incompetech.com), CC BY 3.0',u:'https://commons.wikimedia.org/wiki/File:Jingle_Bells_(Calm)_(Kevin_MacLeod)_(ISRC_USUAN1100188).oga'},
 night:{file:new URL('./music/night-clair-de-lune.mp3',import.meta.url).href,t:{zh:'德彪西《月光》',en:'Debussy, Clair de lune'},c:'Laurens Goedhart, public domain',u:'https://commons.wikimedia.org/wiki/File:Clair_de_lune_(Claude_Debussy)_Suite_bergamasque.ogg'}
};
const KEYS=['spring','summer','autumn','winter','night'];
const WORDS={
 zh:{title:'背景音乐',play:'播放',pause:'暂停',now:'正在播放',next:'点播放开始',auto:'跟随季节和昼夜',autoSub:'春夏秋冬各一首；夜里换成《月光》，冬天一直是 Jingle Bells',for:{spring:'春',summer:'夏',autumn:'秋',winter:'冬',night:'夜'},credits:'录音来源：',close:'关闭音乐面板'},
 en:{title:'Music',play:'Play',pause:'Pause',now:'Now playing',next:'Press play',auto:'Follow season & time',autoSub:'One piece per season; Clair de lune at night (winter stays Jingle Bells)',for:{spring:'Spring',summer:'Summer',autumn:'Autumn',winter:'Winter',night:'Night'},credits:'Recordings: ',close:'Close music panel'}
};
const PICK_KEY='neverland-music-pick-v1';

export function createMusic({getMood,getLanguage,button,host}){
 let on=false,current=null,ctx=null,pick='auto';const chans={};
 try{const p=localStorage.getItem(PICK_KEY);if(p==='auto'||TRACKS[p])pick=p;}catch{}
 const panel=document.createElement('aside');panel.id='musicPanel';panel.hidden=true;panel.setAttribute('role','dialog');panel.setAttribute('aria-labelledby','musicPanelTitle');
 panel.innerHTML='<div class="music-head"><button class="music-play" type="button"><svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M8 5v14l11-7z"/></svg></button><div class="music-now"><small></small><b></b></div><button class="music-close" type="button">×</button></div><p class="music-title" id="musicPanelTitle"></p><div class="music-list" role="radiogroup"></div><p class="music-credits"></p>';
 host.append(panel);
 const $=s=>panel.querySelector(s);
 function auto(){const {season,time}=getMood();return time==='night'&&season!=='winter'?'night':season;}
 function want(){return pick==='auto'?auto():pick;}
 function audioContext(){if(!ctx){const A=window.AudioContext||window.webkitAudioContext;if(A){try{ctx=new A();}catch{ctx=null;}}}if(ctx&&ctx.state==='suspended')ctx.resume().catch(()=>{});}
 function chan(key){if(chans[key])return chans[key];const a=new Audio();a.src=TRACKS[key].file;a.loop=true;a.preload='auto';const ch={a,g:null,stop:0};
  if(ctx){try{const src=ctx.createMediaElementSource(a);ch.g=ctx.createGain();ch.g.gain.value=0;src.connect(ch.g).connect(ctx.destination);}catch{ch.g=null;}}if(!ch.g)a.volume=0;chans[key]=ch;return ch;}
 function fade(ch,v,sec){clearTimeout(ch.stop);
  if(ch.g){const t=ctx.currentTime;ch.g.gain.cancelScheduledValues(t);ch.g.gain.setValueAtTime(ch.g.gain.value,t);ch.g.gain.linearRampToValueAtTime(v,t+sec);}
  else{const from=ch.a.volume,start=performance.now(),step=()=>{const k=Math.min(1,(performance.now()-start)/(sec*1000));ch.a.volume=from+(v-from)*k;if(k<1)ch.raf=requestAnimationFrame(step);};cancelAnimationFrame(ch.raf);step();}
  if(v===0)ch.stop=setTimeout(()=>ch.a.pause(),sec*1000+80);}
 function apply(){const next=on?want():null;
  if(current&&next!==current)fade(chan(current),0,1.4);
  if(next){const ch=chan(next);if(ch.a.paused){const p=ch.a.play();if(p&&p.catch)p.catch(()=>{});}fade(ch,.7,1.6);}
  current=next;render();}
 function render(){const w=WORDS[getLanguage()]||WORDS.zh,lang=getLanguage()==='en'?'en':'zh';
  button.setAttribute('aria-pressed',String(on));
  $('.music-play').setAttribute('aria-label',on?w.pause:w.play);$('.music-play path').setAttribute('d',on?'M7 5h4v14H7zM13 5h4v14h-4z':'M8 5v14l11-7z');
  $('.music-now small').textContent=on?w.now:w.next;$('.music-now b').textContent=TRACKS[want()].t[lang];$('.music-title').textContent=w.title;$('.music-close').setAttribute('aria-label',w.close);
  const opts=[['auto',w.auto,w.autoSub]].concat(KEYS.map(k=>[k,TRACKS[k].t[lang],w.for[k]]));
  $('.music-list').innerHTML=opts.map(([k,a,b])=>'<button type="button" role="radio" aria-checked="'+(pick===k)+'" data-track="'+k+'"><i></i><span>'+a+'<small>'+b+'</small></span></button>').join('');
  $('.music-list').querySelectorAll('button').forEach(b=>b.onclick=()=>{pick=b.dataset.track;try{localStorage.setItem(PICK_KEY,pick);}catch{}if(!on){audioContext();on=true;}apply();});
  $('.music-credits').innerHTML=w.credits+KEYS.map(k=>'<a href="'+TRACKS[k].u+'" target="_blank" rel="noopener">'+TRACKS[k].t[lang]+'</a> — '+TRACKS[k].c).join('；');}
 function toggle(){audioContext();on=!on;apply();return on;}
 function open(value){panel.hidden=!value;button.setAttribute('aria-expanded',String(value));if(value){render();$('.music-play').focus({preventScroll:true});}}
 $('.music-play').onclick=toggle;$('.music-close').onclick=()=>{open(false);button.focus({preventScroll:true});};
 button.setAttribute('aria-expanded','false');button.setAttribute('aria-controls','musicPanel');
 button.onclick=()=>open(panel.hidden);
 const dismiss=e=>{if(!panel.hidden&&!panel.contains(e.target)&&!button.contains(e.target))open(false);};document.addEventListener('pointerdown',dismiss);
 const escape=e=>{if(e.key==='Escape'&&!panel.hidden){e.stopPropagation();open(false);button.focus({preventScroll:true});}};document.addEventListener('keydown',escape,true);
 const visibility=()=>{if(!on||!current)return;const a=chan(current).a;if(document.hidden)a.pause();else{const p=a.play();if(p&&p.catch)p.catch(()=>{});}};document.addEventListener('visibilitychange',visibility);
 render();
 return {toggle,open,
  refresh(){if(on&&pick==='auto')apply();else render();},
  stats:()=>({enabled:on,track:on?current:null,pick,panelOpen:!panel.hidden,loaded:Object.keys(chans)}),
  dispose(){document.removeEventListener('pointerdown',dismiss);document.removeEventListener('keydown',escape,true);document.removeEventListener('visibilitychange',visibility);for(const ch of Object.values(chans)){ch.a.pause();ch.a.src='';}ctx?.close().catch(()=>{});}};
}
