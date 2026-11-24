// Builds pack/level-<n>.json: single-solution puzzles at one chilli level.
// Usage: node tools/make-pack.js <level> <count> <minutes>
const fs=require('fs'),path=require('path');
eval(fs.readFileSync(path.join(__dirname,'..','core.js'),'utf8'));
const level=+process.argv[2],count=+process.argv[3]||40,mins=+process.argv[4]||8;
const out=[],seen=new Set(),t0=Date.now();
while(out.length<count&&Date.now()-t0<mins*60000){
  const r=generateLevel(level,30000);if(!r.found||r.level!==level)continue;
  const key=r.w+'x'+r.h+':'+r.pieces.map(p=>shapeKey(p,true)).sort().join('|');if(seen.has(key))continue;seen.add(key);
  out.push({w:r.w,h:r.h,mask:r.mask,flip:true,level,human:Math.round(r.human),nodes:r.nodes,pieces:r.pieces});
  process.stdout.write(`L${level}: ${out.length}/${count} (${Math.round((Date.now()-t0)/1000)}s)\n`)}
out.sort((a,b)=>a.human-b.human);
fs.mkdirSync(path.join(__dirname,'..','pack'),{recursive:true});
fs.writeFileSync(path.join(__dirname,'..','pack','level-'+level+'.json'),JSON.stringify(out));
console.log('done L'+level,out.length);
