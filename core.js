/* Core: shapes, solver, generator. Also runs inside the worker. */
const T8=[(x,y)=>[x,y],(x,y)=>[-y,x],(x,y)=>[-x,-y],(x,y)=>[y,-x],(x,y)=>[-x,y],(x,y)=>[y,x],(x,y)=>[x,-y],(x,y)=>[-y,-x]];
function norm(cells){let mx=Infinity,my=Infinity;for(const[x,y]of cells){if(x<mx)mx=x;if(y<my)my=y}return cells.map(([x,y])=>[x-mx+0,y-my+0]).sort((a,b)=>a[1]-b[1]||a[0]-b[0])}
function ckey(cells){return cells.map(c=>c[0]+','+c[1]).join(';')}
function orients(cells,flip){const out=[],seen=new Set();for(let t=0;t<(flip?8:4);t++){const n=norm(cells.map(([x,y])=>T8[t](x,y)));const k=ckey(n);if(!seen.has(k)){seen.add(k);out.push(n)}}return out}
function shapeKey(cells,flip){let b=null;for(let t=0;t<(flip?8:4);t++){const k=ckey(norm(cells.map(([x,y])=>T8[t](x,y))));if(b===null||k<b)b=k}return b}
function isRect(cells){let a=Infinity,b=Infinity,c=-Infinity,d=-Infinity;for(const[x,y]of cells){a=Math.min(a,x);b=Math.min(b,y);c=Math.max(c,x);d=Math.max(d,y)}return (c-a+1)*(d-b+1)===cells.length}
function traySyms(w,h,mask){
  const cells=[];for(let i=0;i<w*h;i++)if(mask[i])cells.push([i%w,(i/w)|0]);
  const bk=ckey(norm(cells));let ox=Infinity,oy=Infinity;for(const[x,y]of cells){ox=Math.min(ox,x);oy=Math.min(oy,y)}
  const syms=[];
  for(let t=0;t<8;t++){const tc=cells.map(([x,y])=>T8[t](x,y));let mx=Infinity,my=Infinity;for(const[x,y]of tc){mx=Math.min(mx,x);my=Math.min(my,y)}
    const n=tc.map(([x,y])=>[x-mx+0,y-my+0]).sort((a,b)=>a[1]-b[1]||a[0]-b[0]);if(ckey(n)!==bk)continue;
    const map=new Int32Array(w*h).fill(-1);cells.forEach(([x,y],j)=>{const[a,b]=tc[j];map[y*w+x]=(b-my+oy)*w+(a-mx+ox)});syms.push(map)}
  return syms}
function classesOf(pieces,flip){const m=new Map();pieces.forEach((p,i)=>{const k=shapeKey(p,flip);if(!m.has(k))m.set(k,{orients:orients(p,flip),count:0,ids:[]});const c=m.get(k);c.count++;c.ids.push(i)});return [...m.values()]}
function enumSols(w,h,mask,classes,syms,maxCount,limit,pre){
  const N=w*h,board=new Int16Array(N);for(let i=0;i<N;i++)board[i]=mask[i]?0:-1;
  if(pre)for(const i of pre)board[i]=-1;
  const rem=classes.map(c=>c.count);
  const cls=classes.map(c=>c.orients.map(o=>{const[ax,ay]=o[0];return o.map(([x,y])=>[x-ax,y-ay])}));
  let nodes=0,aborted=false;const found=new Map(),stack=[];
  const canon=()=>{if(syms.length<2)return board.join(',');let b=null;for(const m of syms){const a=new Array(N).fill('.');for(let i=0;i<N;i++)if(board[i]>0)a[m[i]]=String.fromCharCode(64+board[i]);const s=a.join('');if(b===null||s<b)b=s}return b};
  const rec=from=>{
    if(++nodes>limit){aborted=true;return}
    let i=from;while(i<N&&board[i]!==0)i++;
    if(i>=N){const c=canon();if(!found.has(c))found.set(c,stack.map(s=>[s[0],s[1].slice()]));return}
    const x=i%w,y=(i/w)|0;
    for(let k=0;k<cls.length;k++){if(!rem[k])continue;
      for(const o of cls[k]){let ok=true;
        for(const[dx,dy]of o){const nx=x+dx,ny=y+dy;if(nx<0||nx>=w||ny>=h||board[ny*w+nx]!==0){ok=false;break}}
        if(!ok)continue;
        const cells=o.map(([dx,dy])=>(y+dy)*w+x+dx);
        for(const c of cells)board[c]=k+1;rem[k]--;stack.push([k,cells]);
        rec(i+1);
        stack.pop();rem[k]++;for(const c of cells)board[c]=0;
        if(aborted||found.size>=maxCount)return}}};
  rec(0);
  return {sols:[...found.values()],nodes,aborted}}
function solve(w,h,mask,classes,syms,limit){const r=enumSols(w,h,mask,classes,syms,2,limit);return {count:r.sols.length,nodes:r.nodes,aborted:r.aborted}}
function toPieces(sol,classes,w){const out={},next=classes.map(()=>0);for(const[k,cells]of sol){const id=classes[k].ids[next[k]++];out[id]=cells.map(i=>[i%w,(i/w)|0])}return out}
function partition(w,h,mask,n,mn,mx,rnd){
  const N=w*h,reg=new Int16Array(N).fill(-2);const cells=[];for(let i=0;i<N;i++)if(mask[i]){reg[i]=-1;cells.push(i)}
  let free=cells.length;if(free<n*mn||free>n*mx||n>free)return null;
  for(let i=cells.length-1;i>0;i--){const j=(rnd()*(i+1))|0;[cells[i],cells[j]]=[cells[j],cells[i]]}
  const size=new Array(n).fill(1),mem=[];for(let r=0;r<n;r++){reg[cells[r]]=r;mem.push([cells[r]]);free--}
  const nb=i=>{const x=i%w,o=[];if(x>0)o.push(i-1);if(x<w-1)o.push(i+1);if(i>=w)o.push(i-w);if(i+w<N)o.push(i+w);return o};
  while(free>0){
    const cand=[];let tot=0;
    for(let r=0;r<n;r++){if(size[r]>=mx)continue;let has=false;
      for(const c of mem[r]){for(const j of nb(c))if(reg[j]===-1){has=true;break}if(has)break}
      if(has){const wgt=(mx-size[r]+1)**2;cand.push([r,wgt]);tot+=wgt}}
    if(!cand.length)return null;
    let t=rnd()*tot,r=cand[0][0];for(const[c,wg]of cand){if((t-=wg)<=0){r=c;break}}
    const fr=[];for(const c of mem[r])for(const j of nb(c))if(reg[j]===-1)fr.push(j);
    const j=fr[(rnd()*fr.length)|0];reg[j]=r;size[r]++;mem[r].push(j);free--}
  if(size.some(s=>s<mn))return null;
  return mem.map(m=>m.map(i=>[i%w,(i/w)|0]))}
function randomPoly(size){const S=new Set(['0,0']),c=[[0,0]];while(c.length<size){const[x,y]=c[(Math.random()*c.length)|0],d=[[1,0],[-1,0],[0,1],[0,-1]][(Math.random()*4)|0],k=(x+d[0])+','+(y+d[1]);if(!S.has(k)){S.add(k);c.push([x+d[0],y+d[1]])}}return norm(c)}
function tryOne(o,syms){
  let parts;
  if(o.many&&o.min===o.max){const area=o.mask.filter(Boolean).length;if(area!==o.n*o.min)return null;
    parts=[];const keys=new Set();for(let g=0;parts.length<o.n&&g<200;g++){const p=randomPoly(o.min),k=shapeKey(p,o.flip);if(o.distinct&&keys.has(k))continue;if(o.noRect&&isRect(p))continue;keys.add(k);parts.push(p)}
    if(parts.length<o.n)return null;
    const r=enumSols(o.w,o.h,o.mask,classesOf(parts,o.flip),syms,60,o.limit);if(r.sols.length<20)return null;
    const P=toPieces(r.sols[0],classesOf(parts,o.flip),o.w);return {pieces:parts.map((_,i)=>P[i]),nodes:r.nodes,count:r.sols.length}}
  parts=partition(o.w,o.h,o.mask,o.n,o.min,o.max,Math.random);if(!parts)return null;
  if(o.noRect&&parts.some(isRect))return null;
  if(o.distinct&&new Set(parts.map(p=>shapeKey(p,o.flip))).size<parts.length)return null;
  const cl=classesOf(parts,o.flip);
  if(o.many){const r=enumSols(o.w,o.h,o.mask,cl,syms,60,o.limit);if(r.sols.length<20)return null;return {pieces:parts,nodes:r.nodes,count:r.sols.length}}
  const r=solve(o.w,o.h,o.mask,cl,syms,o.limit);if(r.aborted||r.count!==1)return null;return {pieces:parts,nodes:r.nodes,count:1}}
function pickCand(c,o){if(o.many)return c.reduce((a,b)=>b.count>a.count?b:a);c.sort((a,b)=>a.nodes-b.nodes);return o.diff==='gentle'?c[0]:o.diff==='hard'?c[c.length-1]:c[(c.length/2)|0]}
function generate(o,tick){
  const syms=traySyms(o.w,o.h,o.mask),t0=Date.now(),cands=[];let tries=0;
  while(Date.now()-t0<o.time&&cands.length<o.want){tries++;if(tick&&tries%100===0)tick(tries,cands.length);
    const c=tryOne(o,syms);if(c){cands.push(c);if(tick)tick(tries,cands.length)}}
  if(!cands.length)return {tries,found:0};
  const p=pickCand(cands,o);return {tries,found:cands.length,pieces:p.pieces,nodes:p.nodes,count:p.count}}
/* Challenge sets: starter pieces in the tray, and shapes to build on the table. */
function perimeter(S){let p=0;for(const k of S){const[x,y]=k.split(',').map(Number);if(!S.has((x+1)+','+y))p++;if(!S.has((x-1)+','+y))p++;if(!S.has(x+','+(y+1)))p++;if(!S.has(x+','+(y-1)))p++}return p}
function blob(ids,pieces,flip){
  const S=new Set(),placed={};const order=ids.slice().sort(()=>Math.random()-.5);
  for(const id of order){const os=orients(pieces[id],flip);
    if(!S.size){const o=os[(Math.random()*os.length)|0];placed[id]=o.map(c=>c.slice());for(const[x,y]of o)S.add(x+','+y);continue}
    const occ=[...S].map(k=>k.split(',').map(Number));let best=null;
    for(let t=0;t<40;t++){const o=os[(Math.random()*os.length)|0],c=occ[(Math.random()*occ.length)|0],d=[[1,0],[-1,0],[0,1],[0,-1]][(Math.random()*4)|0];
      const tx=c[0]+d[0],ty=c[1]+d[1];if(S.has(tx+','+ty))continue;const a=o[(Math.random()*o.length)|0],dx=tx-a[0],dy=ty-a[1];
      const cells=o.map(([x,y])=>[x+dx,y+dy]);if(cells.some(([x,y])=>S.has(x+','+y)))continue;
      const S2=new Set(S);for(const[x,y]of cells)S2.add(x+','+y);const sc=perimeter(S2)+Math.random()*2;
      if(!best||sc<best.sc)best={sc,cells}}
    if(!best)return null;placed[id]=best.cells;for(const[x,y]of best.cells)S.add(x+','+y)}
  return placed}
function makeChallenges(o,tick){
  const tray=[],shapes=[],t0=Date.now(),n=o.pieces.length,classes=classesOf(o.pieces,o.flip),N=o.w*o.h;
  const ID=[Int32Array.from({length:N},(_,i)=>i)],kOf={};classes.forEach((c,k)=>c.ids.forEach(id=>kOf[id]=k));
  const tagOf=(id,cells)=>kOf[id]+':'+cells.map(([x,y])=>y*o.w+x).sort((a,b)=>a-b).join(',');
  let trayNote='';
  if(o.trayN>0){
    const all=enumSols(o.w,o.h,o.mask,classes,ID,3000,4e6);
    const sols=all.sols.map(s=>{const P=toPieces(s,classes,o.w),tags={};for(const id in P)tags[id]=tagOf(id,P[id]);return {P,tags,set:new Set(Object.values(tags))}});
    if(sols.length<2)trayNote='single';
    else{const seen=new Set();let guard=0;
      const count=(s,fx)=>{let c=0;for(const t of sols){if(fx.every(id=>t.set.has(s.tags[id]))&&++c>1)return 2}return c};
      while(tray.length<o.trayN&&Date.now()-t0<o.time*0.55&&guard++<o.trayN*40){
        if(tick&&guard%5===0)tick(guard,tray.length);
        const s=sols[(Math.random()*sols.length)|0],order=Object.keys(s.P).map(Number).sort(()=>Math.random()-.5);
        let fixed=[];for(const id of order){fixed.push(id);if(count(s,fixed)===1)break}
        for(const id of fixed.slice()){const f2=fixed.filter(x=>x!==id);if(f2.length&&count(s,f2)===1)fixed=f2}
        if(fixed.length>=n-1)continue;
        const key=fixed.map(id=>s.tags[id]).sort().join('/');if(seen.has(key))continue;seen.add(key);
        const pre=[];for(const id of fixed)for(const[x,y]of s.P[id])pre.push(y*o.w+x);
        const rest=order.filter(id=>!fixed.includes(id)),rc=classesOf(rest.map(id=>o.pieces[id]),o.flip);
        const r=enumSols(o.w,o.h,o.mask,rc,ID,2,1e6,pre);
        if(r.aborted||r.sols.length!==1)continue;
        tray.push({type:'tray',fixed:fixed.sort((a,b)=>a-b),sol:s.P,nodes:r.nodes});if(tick)tick(guard,tray.length)}}}
  if(o.shapeN>0){const seen=new Set();let guard=0;
    while(shapes.length<o.shapeN&&Date.now()-t0<o.time&&guard++<o.shapeN*300){
      if(tick&&guard%20===0)tick(guard,tray.length+shapes.length);
      const m=Math.min(n,o.shapeMin+((Math.random()*(o.shapeMax-o.shapeMin+1))|0));
      const ids=[...Array(n).keys()].sort(()=>Math.random()-.5).slice(0,m).sort((a,b)=>a-b);
      const pl=blob(ids,o.pieces,o.flip);if(!pl)continue;
      const all=[].concat(...Object.values(pl));if(loops(all).length>1)continue;
      let mx=Infinity,my=Infinity,Mx=-Infinity,My=-Infinity;for(const[x,y]of all){mx=Math.min(mx,x);my=Math.min(my,y);Mx=Math.max(Mx,x);My=Math.max(My,y)}
      const w=Mx-mx+1,h=My-my+1;if(w>14||h>14||all.length<0.55*w*h)continue;
      const mask=new Array(w*h).fill(0);for(const[x,y]of all)mask[(y-my)*w+x-mx]=1;
      const key=ids.join(',')+'|'+shapeKey(all,true);if(seen.has(key))continue;seen.add(key);
      const rc=classesOf(ids.map(id=>o.pieces[id]),o.flip),r=solve(w,h,mask,rc,traySyms(w,h,mask),1e6);
      if(r.aborted||r.count!==1)continue;
      const sol={};for(const id of ids)sol[id]=pl[id].map(([x,y])=>[x-mx,y-my]);
      shapes.push({type:'shape',w,h,mask,ids,sol,nodes:r.nodes});if(tick)tick(guard,tray.length+shapes.length)}}
  const LV=['Starter','Junior','Expert','Master'];
  const grade=(list,pre)=>{list.sort((a,b)=>a.nodes-b.nodes);list.forEach((c,i)=>{c.level=LV[Math.min(3,Math.floor(i*4/list.length))];c.num=pre+(i+1)})};
  grade(tray,'T');grade(shapes,'S');
  return {challenges:tray.concat(shapes),trayNote,found:tray.length+shapes.length}}
function rating(nodes){return Math.max(1,Math.min(5,1+Math.floor(Math.log10(Math.max(nodes,10))-1.5)))}
/* Outline loops of a set of cells, clockwise on screen (shape on the right). */
function loops(cells){
  const S=new Set(cells.map(([x,y])=>x+','+y)),has=(x,y)=>S.has(x+','+y),E=new Map();
  const add=(a,b,c,d)=>{const k=a+','+b;if(!E.has(k))E.set(k,[]);E.get(k).push([c,d])};
  for(const[x,y]of cells){if(!has(x,y-1))add(x,y,x+1,y);if(!has(x+1,y))add(x+1,y,x+1,y+1);if(!has(x,y+1))add(x+1,y+1,x,y+1);if(!has(x-1,y))add(x,y+1,x,y)}
  const out=[];
  while(E.size){
    const sk=E.keys().next().value;let[px,py]=sk.split(',').map(Number);const sx=px,sy=py,loop=[[px,py]];let pd=null;
    for(;;){const k=px+','+py,l=E.get(k);if(!l)break;let idx=0;
      if(l.length>1&&pd){const rx=-pd[1],ry=pd[0];const f=l.findIndex(([ex,ey])=>ex-px===rx&&ey-py===ry);if(f>=0)idx=f}
      const[ex,ey]=l.splice(idx,1)[0];if(!l.length)E.delete(k);pd=[ex-px,ey-py];px=ex;py=ey;
      if(px===sx&&py===sy)break;loop.push([px,py])}
    const s=[];for(let i=0;i<loop.length;i++){const a=loop[(i-1+loop.length)%loop.length],b=loop[i],c=loop[(i+1)%loop.length];
      const d1=[Math.sign(b[0]-a[0]),Math.sign(b[1]-a[1])],d2=[Math.sign(c[0]-b[0]),Math.sign(c[1]-b[1])];if(d1[0]!==d2[0]||d1[1]!==d2[1])s.push(b)}
    out.push(s)}
  return out}
function offsetLoop(L,o){return L.map((b,i)=>{const a=L[(i-1+L.length)%L.length],c=L[(i+1)%L.length];
  const d1=[Math.sign(b[0]-a[0]),Math.sign(b[1]-a[1])],d2=[Math.sign(c[0]-b[0]),Math.sign(c[1]-b[1])];
  return [b[0]+o*(d1[1]+d2[1]),b[1]+o*(-d1[0]-d2[0])]})}
