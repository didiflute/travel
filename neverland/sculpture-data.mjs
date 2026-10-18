// Lossless at the Float32/Uint32 precision used by the renderer. The archive
// retains the original JSON; the browser reads compact typed data directly.
export async function loadSculptureData(url){
 const response=await fetch(url);if(!response.ok)throw new Error('Sculpture data missing: '+response.status);
 const buffer=await response.arrayBuffer(),view=new DataView(buffer);
 if(view.getUint32(0,true)!==0x314c564e)throw new Error('Invalid sculpture data');
 const size=view.getUint32(4,true),header=JSON.parse(new TextDecoder().decode(new Uint8Array(buffer,8,size))),start=(8+size+3)&~3;
 const decode=value=>{if(Array.isArray(value))return value.map(decode);if(value&&typeof value==='object'){
  if(value.bufferType){const Type=value.bufferType==='u16'?Uint16Array:value.bufferType==='u32'?Uint32Array:Float32Array;return new Type(buffer,start+value.offset,value.length);}
  return Object.fromEntries(Object.entries(value).map(([key,item])=>[key,decode(item)]));}return value;};
 return decode(header);
}
