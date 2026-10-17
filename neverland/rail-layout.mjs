// Grid cells form the same editable island as the original playground.
export const CELL=18;
export const DEFAULT_LAYOUT={xian:[0,0,0],kaifeng:[1,0,0],luoyang:[0,1,0],datong:[1,1,0],tokyo:[2,0,0],hongkong:[2,1,0]};
export function migrateLayout(value){
 if(validLayout(value))return value;
 if(!value||typeof value!=='object'||!value.xian||!value.kaifeng||Object.keys(value).some(id=>!DEFAULT_LAYOUT[id]))return null;
 const next=structuredClone(value),seen=new Set();
 for(const p of Object.values(next)){if(!Array.isArray(p)||p.length!==3||!p.every(Number.isInteger)||Math.abs(p[0])>8||Math.abs(p[1])>8||p[2]<0||p[2]>3)return null;const key=p.slice(0,2).join(',');if(seen.has(key))return null;seen.add(key);}
 for(const id of Object.keys(DEFAULT_LAYOUT)){if(next[id])continue;const wanted=DEFAULT_LAYOUT[id];let choice=null;
  for(let radius=0;radius<=32&&!choice;radius++)for(let x=-8;x<=8&&!choice;x++)for(let z=-8;z<=8;z++){if(Math.abs(x-wanted[0])+Math.abs(z-wanted[1])!==radius||seen.has(x+','+z))continue;choice=[x,z,0];break;}
  if(!choice)return null;next[id]=choice;seen.add(choice.slice(0,2).join(','));
 }return validLayout(next)?next:null;
}
export function validLayout(value){
 if(!value||Object.keys(value).length!==Object.keys(DEFAULT_LAYOUT).length)return false;
 const seen=new Set();for(const id of Object.keys(DEFAULT_LAYOUT)){const p=value[id];if(!Array.isArray(p)||p.length!==3||!p.every(Number.isInteger)||Math.abs(p[0])>8||Math.abs(p[1])>8||p[2]<0||p[2]>3)return false;const k=p.slice(0,2).join(',');if(seen.has(k))return false;seen.add(k)}return true;
}
export function moveTile(layout,id,c,r){
 c+=0;r+=0; // Canonicalize -0 from pointer snapping before storing grid coordinates.
 const next=structuredClone(layout),old=next[id].slice();
 const other=Object.keys(next).find(k=>k!==id&&next[k][0]===c&&next[k][1]===r);
 if(other){next[other][0]=old[0];next[other][1]=old[1]}
 next[id][0]=c;next[id][1]=r;return next;
}
export function routeCells(layout){
 // A shortest grid connector keeps the railway continuous when cities are separated.
 const cells=new Map(),positions=Object.values(layout);const add=(c,r)=>cells.set(c+','+r,[c,r]);
 positions.forEach(([c,r])=>add(c,r));const linked=[positions[0]],pending=positions.slice(1);
 while(pending.length){let best=null;for(let i=0;i<pending.length;i++)for(const from of linked){const to=pending[i],d=Math.abs(to[0]-from[0])+Math.abs(to[1]-from[1]);if(!best||d<best.d)best={i,from,to,d}}
  let [c,r]=best.from;const [x,z]=best.to;while(c!==x){c+=Math.sign(x-c);add(c,r)}while(r!==z){r+=Math.sign(z-r);add(c,r)}linked.push(best.to);pending.splice(best.i,1);
 }return [...cells.values()];
}
export function outline(cells){
 const set=new Set(cells.map(p=>p.join(','))),edges=[];
 for(const [x,z] of cells){if(!set.has(x+','+(z-1)))edges.push([[x,z],[x+1,z]]);if(!set.has((x+1)+','+z))edges.push([[x+1,z],[x+1,z+1]]);if(!set.has(x+','+(z+1)))edges.push([[x+1,z+1],[x,z+1]]);if(!set.has((x-1)+','+z))edges.push([[x,z+1],[x,z]])}
 const used=new Set(),loops=[];for(let first=0;first<edges.length;first++){if(used.has(first))continue;const loop=[];let i=first;
  while(i!==undefined&&!used.has(i)){used.add(i);const [a,b]=edges[i];loop.push(a);const dx=b[0]-a[0],dz=b[1]-a[1];let candidates=[];
   edges.forEach((e,j)=>{if(!used.has(j)&&e[0][0]===b[0]&&e[0][1]===b[1]){const ex=e[1][0]-b[0],ez=e[1][1]-b[1];candidates.push({j,turn:Math.atan2(dx*ez-dz*ex,dx*ex+dz*ez)})}});candidates.sort((a,b)=>b.turn-a.turn);i=candidates[0]?.j;
  }if(loop.length>=4)loops.push(loop.filter((p,k)=>{const a=loop[(k+loop.length-1)%loop.length],b=loop[(k+1)%loop.length];return (p[0]-a[0])*(b[1]-p[1])!==(p[1]-a[1])*(b[0]-p[0])}));
 }return loops;
}
