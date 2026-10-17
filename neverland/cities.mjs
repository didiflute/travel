// Only metadata lives in the shell. Each city module is imported on selection.
export const cities=[
 {id:'kaifeng',name:'开封',seal:'汴',title:['虹桥','金花'],eyebrow:'KAIFENG · OUR NIGHT BY THE RIVER',verse:['那晚，我们站在河边。','等一树金花，落满汴河。'],caption:'汴河 · 虹桥夜市',memory:'那一晚，我们一起看金花。',hint:'拖动旋转，看一看桥的另一面',subtitle:'虹桥 · 打铁花',poster:new URL('./previews/kaifeng.jpg',import.meta.url).href,button:'看一场打铁花',replay:'再看一场',playing:'金花正在盛放',status:'与你一起，看一场打铁花',finished:'金花落尽，夜市继续热闹。',stop:'收起这一场',label:'虹桥 · 今夜有金花',duration:7,load:()=>import('./city-kaifeng.mjs')},
 {id:'xian',name:'西安',seal:'長',title:['雁塔','回响'],eyebrow:'XI’AN · ECHOES OF ANCIENT DAYS',verse:['塔影落在长安。','一声钟鸣，留住这一程。'],caption:'大雁塔 · 兵马俑',memory:'走过千年，也记得那天。',hint:'拖动旋转，看看我们的西安',subtitle:'大雁塔 · 兵马俑',poster:new URL('./previews/xian.jpg',import.meta.url).href,button:'轻叩一声钟',replay:'再听一声',playing:'听，长安的回响',status:'在塔旁，留下一声回响',finished:'余音渐远，塔影依旧。',stop:'收住余音',label:'大雁塔 · 长安回响',duration:5,load:()=>import('./city-xian.mjs')}
];
