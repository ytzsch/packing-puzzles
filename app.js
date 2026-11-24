{
const $=id=>document.getElementById(id);
const svg=$('svg');
const root=document.documentElement,MODE=root.dataset.mode,Q=new URLSearchParams(location.search);
const SITE='https://ytzsch.github.io/packing-puzzles/';
const esc=t=>String(t).replace(/[&<>"']/g,c=>'&#'+c.charCodeAt(0)+';');
const slug=t=>String(t||'puzzle').toLowerCase().normalize('NFKD').replace(/[^a-z0-9]+/g,'-').replace(/^-+|-+$/g,'').slice(0,40)||'puzzle';
const siteBase=()=>MODE==='player'?location.origin+location.pathname.replace(/index\.html$/,''):SITE;
const setURL=(id,c)=>siteBase()+'?set='+encodeURIComponent(id)+(c?'&c='+c:'');
/* A chilli, in a 1x1 box: curved body, calyx and stem as separate closed shapes (for laser scan-engraving). */
const CHILLI=(()=>{const P0=[.30,.30],P1=[.27,.88],P2=[.95,.95];
  const B=t=>[(1-t)**2*P0[0]+2*(1-t)*t*P1[0]+t*t*P2[0],(1-t)**2*P0[1]+2*(1-t)*t*P1[1]+t*t*P2[1]];
  const D=t=>[2*(1-t)*(P1[0]-P0[0])+2*t*(P2[0]-P1[0]),2*(1-t)*(P1[1]-P0[1])+2*t*(P2[1]-P1[1])];
  const hw=t=>.17*Math.pow(1-t,.7),L=[],R=[];
  for(let i=0;i<=24;i++){const t=i/24,[x,y]=B(t),[dx,dy]=D(t),l=Math.hypot(dx,dy),nx=-dy/l,ny=dx/l,w=hw(t);L.push([x+nx*w,y+ny*w]);R.push([x-nx*w,y-ny*w])}
  const[dx0,dy0]=D(0),a0=Math.atan2(dy0,dx0),w0=hw(0),cap=[];
  for(let i=1;i<12;i++){const a=a0+1.5*Math.PI-i*Math.PI/12;cap.push([P0[0]+Math.cos(a)*w0,P0[1]+Math.sin(a)*w0])}
  const body=[...L,...R.slice().reverse().slice(1),...cap];
  const ring=(r1,r2,from,to)=>{const o=[],n=10;for(let i=0;i<=n;i++){const a=from+(to-from)*i/n;o.push([P0[0]+Math.cos(a)*r2,P0[1]+Math.sin(a)*r2])}for(let i=n;i>=0;i--){const a=from+(to-from)*i/n;o.push([P0[0]+Math.cos(a)*r1,P0[1]+Math.sin(a)*r1])}return o};
  const back=a0+Math.PI,calyx=ring(w0+.02,w0+.07,back-1.25,back+1.25);
  const u=[Math.cos(back),Math.sin(back)],S0=[P0[0]+u[0]*(w0+.09),P0[1]+u[1]*(w0+.09)],S1=[S0[0]+.13,S0[1]-.14],C=[S0[0]-.03,S0[1]-.10],st=[],sb=[];
  for(let i=0;i<=8;i++){const t=i/8,x=(1-t)**2*S0[0]+2*(1-t)*t*C[0]+t*t*S1[0],y=(1-t)**2*S0[1]+2*(1-t)*t*C[1]+t*t*S1[1];
    const dx=2*(1-t)*(C[0]-S0[0])+2*t*(S1[0]-C[0]),dy=2*(1-t)*(C[1]-S0[1])+2*t*(S1[1]-C[1]),l=Math.hypot(dx,dy),w=.032;st.push([x-dy/l*w,y+dx/l*w]);sb.push([x+dy/l*w,y-dx/l*w])}
  const stem=[...st,...sb.reverse()];
  let mx=1,my=1,Mx=0,My=0;for(const p of[...body,...calyx,...stem]){mx=Math.min(mx,p[0]);my=Math.min(my,p[1]);Mx=Math.max(Mx,p[0]);My=Math.max(My,p[1])}
  const k=1/Math.max(Mx-mx,My-my);return [body,calyx,stem].map(P=>P.map(([x,y])=>[(x-mx)*k,(y-my)*k]))})();
const chilliD=(x,y,s)=>CHILLI.map(P=>'M'+P.map(([a,b])=>(x+a*s).toFixed(3)+' '+(y+b*s).toFixed(3)).join('L')+'Z').join('');
function chillies(n,size){if(!n)return '';let s='';for(let i=0;i<5;i++)s+=`<svg viewBox="-.03 -.03 1.06 1.06" width="${size}" height="${size}" aria-hidden="true"><path d="${chilliD(0,0,1)}" fill="${i<n?'#d4231b':'none'}" stroke="${i<n?'none':'currentColor'}" stroke-width=".05" opacity="${i<n?1:.35}"/></svg>`;
  return `<span class="chillies" role="img" aria-label="${n} of 5 chillies">${s}</span>`}
function ensureLevel(p){if(!p.many&&!p.level&&p.pieces){p.human=humanEffort(p.w,p.h,p.mask,p.pieces,p.flip,6);p.level=levelOf(p.human)}return p}
function qrSVG(url){try{if(typeof qrcode!=='function')return '';const q=qrcode(0,'M');q.addData(url);q.make();return q.createSvgTag({cellSize:1,margin:2,scalable:true})}catch(e){return ''}}
const WOOD=['#e3c393','#c48a4f','#9c5b3b','#6e4b33','#efd8ae','#b8743f','#d6a86c','#8a6a4c','#f2cf95','#a9805a','#d99263','#7f5a3e','#e8bb7a','#b5946c','#c27a52','#5f4330'];
const PRESETS=[
  {name:'Pocket 4×4',w:4,h:4,n:4,min:3,max:5},
  {name:'Classic 6×5',w:6,h:5,n:6,min:4,max:6},
  {name:'Square 6×6',w:6,h:6,n:7,min:4,max:6},
  {name:'Big 8×6',w:8,h:6,n:8,min:5,max:7},
  {name:'Heart',w:7,h:6,n:6,min:4,max:7,mask:'011011011111111111111011111000111000001000'},
  {name:'Challenge set 8×5',w:8,h:5,n:8,min:4,max:6,many:true},
  {name:'Five-square set 10×5',w:10,h:5,n:10,min:5,max:5,many:true}];
const OPT_KEYS=['cell','border','clear','kerf','mode'];
const SKEY=MODE==='maker'?'packpuz':'packpuz-play';
if('serviceWorker' in navigator&&location.protocol==='https:'&&MODE!=='maker')navigator.serviceWorker.register('sw.js').catch(()=>{});
let store={};try{store=JSON.parse(localStorage.getItem(SKEY)||'{}')}catch(e){}
const persist=()=>{try{localStorage.setItem(SKEY,JSON.stringify(store))}catch(e){}};
let cut=Object.assign({cell:20,border:12,clear:0.3,kerf:0.15,mode:'inside',chilli:true},store.cut||{});
let draft=Object.assign({w:6,h:5,n:6,min:4,max:6,flip:true,distinct:true,noRect:true,diff:'medium',many:false,mask:null},store.draft||{});
if(!draft.mask||draft.mask.length!==draft.w*draft.h)draft.mask=new Array(draft.w*draft.h).fill(1);
let puz=MODE==='maker'?store.puzzle||null:null,mode='play',ps=[],sel=null,G=null,chal=null,cls=[],hints=0,t0=null,solved=false,worker=null,running=false;
const ID1=n=>[Int32Array.from({length:n},(_,i)=>i)];
const P=id=>ps.find(p=>p.id===id);

/* ---------- Puzzle setup ---------- */
function loadPuzzle(p){
  puz=ensureLevel(p);if(MODE==='maker'){store.puzzle=p;persist()}cls=p.pieces.map(c=>shapeKey(c,p.flip));
  openGame(null);renderChallenges();if(MODE==='maker')updatePub()}
function openGame(c){
  chal=c;
  if(MODE==='player'&&puz.id)try{history.replaceState(null,'','?set='+encodeURIComponent(puz.id)+(c?'&c='+c.num:''))}catch(e){}
  if(!c)G={w:puz.w,h:puz.h,mask:puz.mask,ids:puz.pieces.map((_,i)=>i),fixed:[],sol:Object.fromEntries(puz.pieces.map((v,i)=>[i,v])),shape:false};
  else if(c.type==='tray')G={w:puz.w,h:puz.h,mask:puz.mask,ids:puz.pieces.map((_,i)=>i),fixed:c.fixed,sol:c.sol,shape:false};
  else G={w:c.w,h:c.h,mask:c.mask,ids:c.ids,fixed:[],sol:c.sol,shape:true};
  resetPlay();renderInfo();renderChallenges()}
function resetPlay(){
  hints=0;t0=null;solved=false;sel=null;$('banner').hidden=true;ps=[];
  for(const id of G.fixed){const c=G.sol[id];ps.push({id,shape:norm(c),x:Math.min(...c.map(v=>v[0])),y:Math.min(...c.map(v=>v[1])),inTray:true,fixed:true})}
  const free=G.ids.filter(id=>!G.fixed.includes(id)).sort(()=>Math.random()-.5).map(id=>{const os=orients(puz.pieces[id],puz.flip),sh=os[(Math.random()*os.length)|0];
    let bw=0,bh=0;for(const[a,b]of sh){bw=Math.max(bw,a+1);bh=Math.max(bh,b+1)}return {id,sh,bw,bh,sz:Math.max(bw,bh)}});
  // Lay the waiting pieces out in rows, choosing the row width that makes the board largest on this screen.
  const layout=rowW=>{let x=0,y=G.h+1,rowH=0;const homes=[];
    for(const f of free){if(x+f.bw>rowW&&x>0){x=0;y+=rowH+1;rowH=0}homes.push([x,y]);x+=f.bw+1;rowH=Math.max(rowH,f.bh)}
    return {homes,W:Math.max(rowW,G.w)+2,H:(free.length?y+rowH:G.h)+2}};
  const box=svg.parentNode.getBoundingClientRect(),appPlayView=MODE==='app'&&root.dataset.view==='play';
  const availW=Math.max(260,box.width-(appPlayView?8:24)),availH=appPlayView?Math.max(240,box.height-8):Math.max(320,innerHeight*.78);
  const maxSz=Math.max(0,...free.map(f=>f.sz));let best=null;
  for(let rw=Math.max(G.w,maxSz);rw<=Math.max(G.w,maxSz)+30;rw++){const L=layout(rw),sc=Math.min(availW/L.W,availH/L.H);if(!best||sc>best.sc+1e-9)best={sc,L,rw}}
  free.forEach((f,i)=>{const home=best.L.homes[i];ps.push({id:f.id,shape:f.sh,home,x:home[0],y:home[1],inTray:false,at:0})});
  world={x0:-1,y0:-1,x1:best.L.W-1,y1:best.L.H-1};
  $('p-msg').textContent='';render()}
let world={x0:-1,y0:-1,x1:8,y1:8};
function renderInfo(){
  const cellsN=G.mask.filter(Boolean).length;
  if(!chal){$('pz-name').textContent=puz.name||'Puzzle';
    $('pz-stat').innerHTML=`<span>Tray <b>${puz.w}×${puz.h}</b> (${cellsN} squares)</span><span><b>${puz.pieces.length}</b> pieces</span>`+
      (puz.many?`<span>Fits the tray <b>${puz.count>=60?'60+':puz.count}</b> ways</span>`:`<span>Difficulty ${chillies(puz.level,18)}</span>`)+
      `<span>${puz.flip?'Pieces turn over':'No turning over'}</span>`}
  else{$('pz-name').textContent=`Challenge ${chal.num} · ${chal.level}`;
    $('pz-stat').innerHTML=chal.type==='tray'?`<span><b>${chal.fixed.length}</b> starter piece${chal.fixed.length>1?'s':''} placed</span><span>Fill the tray with the other <b>${puz.pieces.length-chal.fixed.length}</b></span>`:`<span>Build this shape with the <b>${chal.ids.length}</b> pieces shown</span><span>${cellsN} squares</span>`}
  $('back').hidden=!chal}

/* ---------- Rendering ---------- */
const pathOf=(cells,inset)=>loops(cells).map(L=>'M'+offsetLoop(L,-inset).map(p=>p[0].toFixed(3)+' '+p[1].toFixed(3)).join('L')+'Z').join('');
function trayMarkup(w,h,mask,editable){
  const cells=[];for(let i=0;i<w*h;i++)if(mask[i])cells.push([i%w,(i/w)|0]);
  let s='';
  if(cells.length){const outer=loops(cells).map(L=>'M'+offsetLoop(L,0.35).map(p=>p.join(' ')).join('L')+'Z').join('');
    s+=`<path d="${outer}" fill="var(--tray)" fill-rule="nonzero"/>`}
  for(let i=0;i<w*h;i++){const x=i%w,y=(i/w)|0;
    if(mask[i])s+=`<rect x="${x+.03}" y="${y+.03}" width=".94" height=".94" rx=".06" fill="var(--trayCell)" ${editable?`data-cell="${i}" style="cursor:pointer"`:''}/>`;
    else if(editable)s+=`<rect x="${x+.06}" y="${y+.06}" width=".88" height=".88" rx=".06" fill="none" stroke="var(--line)" stroke-width=".04" stroke-dasharray=".1 .08" data-cell="${i}" style="cursor:pointer"/>`}
  return s}
function shapeMarkup(w,h,mask){
  const cells=[];for(let i=0;i<w*h;i++)if(mask[i])cells.push([i%w,(i/w)|0]);
  let s=`<path d="${pathOf(cells,0)}" fill="var(--slot)" stroke="var(--muted)" stroke-width=".06" stroke-dasharray=".18 .1"/>`;
  for(const[x,y]of cells)s+=`<rect x="${x+.45}" y="${y+.45}" width=".1" height=".1" rx=".05" fill="var(--line)"/>`;
  return s}
function render(){
  if(mode==='cut')return renderCut();
  if(mode==='design'){
    const pad=1;svg.setAttribute('viewBox',`${-pad} ${-pad} ${draft.w+2*pad} ${draft.h+2*pad}`);
    svg.innerHTML=trayMarkup(draft.w,draft.h,draft.mask,true);return}
  if(!puz){svg.setAttribute('viewBox','0 0 10 6');svg.innerHTML=`<text x="5" y="3" text-anchor="middle" font-size=".5" fill="var(--muted)">${MODE==='player'?'Loading the puzzle…':'Generating your first puzzle…'}</text>`;return}
  svg.setAttribute('viewBox',`${world.x0} ${world.y0} ${world.x1-world.x0} ${world.y1-world.y0}`);
  let s=G.shape?shapeMarkup(G.w,G.h,G.mask):trayMarkup(G.w,G.h,G.mask,false);
  s+=`<text x="${G.w/2}" y="${G.h+0.72}" text-anchor="middle" font-size=".34" fill="var(--muted)" font-family="Barlow">Pieces</text>`;
  const order=ps.slice().sort((a,b)=>(a.id===sel)-(b.id===sel));
  for(const p of order){
    const d=pathOf(p.shape,0.04),[px,py]=p.shape[0];
    s+=`<g class="pc" data-id="${p.id}" transform="translate(${p.x} ${p.y})" style="cursor:${p.fixed?'default':'grab'}">
      <path d="${d}" transform="translate(.05 .07)" fill="rgba(0,0,0,.28)"/>
      <path d="${d}" fill="${WOOD[p.id%WOOD.length]}" stroke="${p.id===sel?'var(--laser)':'rgba(0,0,0,.45)'}" stroke-width="${p.id===sel?.08:.03}"/>
      <path d="${pathOf(p.shape,0.12)}" fill="none" stroke="rgba(255,255,255,.28)" stroke-width=".025"/>
      ${p.fixed?`<circle cx="${px+.5}" cy="${py+.5}" r=".13" fill="rgba(0,0,0,.55)"/><circle cx="${px+.5}" cy="${py+.5}" r=".06" fill="rgba(255,255,255,.7)"/>`:''}</g>`}
  svg.innerHTML=s}

/* ---------- Play interaction ---------- */
const toWorld=e=>{const pt=svg.createSVGPoint();pt.x=e.clientX;pt.y=e.clientY;return pt.matrixTransform(svg.getScreenCTM().inverse())};
let drag=null,paint=null;
svg.addEventListener('pointerdown',e=>{
  if(mode==='design'){const c=e.target.dataset?.cell;if(c==null)return;const i=+c;paint=draft.mask[i]?0:1;draft.mask[i]=paint;svg.setPointerCapture(e.pointerId);saveDraft();render();return}
  if(mode!=='play'||solved)return;
  const g=e.target.closest('.pc');if(!g)return;
  const p=P(+g.dataset.id);if(!p)return;
  if(p.fixed){$('p-msg').textContent='Starter pieces (with a pin) stay where they are.';return}
  const w=toWorld(e);
  if(sel!==p.id){sel=p.id;render()}
  const g2=svg.querySelector(`.pc[data-id="${p.id}"]`);g2.classList.add('drag');
  drag={p,g:g2,dx:w.x-p.x,dy:w.y-p.y,sx:w.x,sy:w.y,lx:w.x,ly:w.y,ox:p.x,oy:p.y,t:Date.now(),moved:false};svg.setPointerCapture(e.pointerId);e.preventDefault()});
svg.addEventListener('pointermove',e=>{
  if(paint!==null){const el=document.elementFromPoint(e.clientX,e.clientY);const c=el?.dataset?.cell;if(c!=null&&draft.mask[+c]!==paint){draft.mask[+c]=paint;saveDraft();render()}return}
  if(!drag)return;const w=toWorld(e);
  if(Math.hypot(w.x-drag.sx,w.y-drag.sy)>.15)drag.moved=true;
  drag.lx=w.x;drag.ly=w.y;drag.p.x=w.x-drag.dx;drag.p.y=w.y-drag.dy;drag.g.setAttribute('transform',`translate(${drag.p.x} ${drag.p.y})`)});
const endDrag=()=>{
  if(paint!==null){paint=null;return}
  if(!drag)return;const{p,moved,t,sx,sy,lx,ly,ox,oy}=drag;drag=null;const dt=Date.now()-t,fx=lx-sx,fy=ly-sy;
  if(!moved&&dt<400){p.x=Math.round(p.x);p.y=Math.round(p.y);turn(p,'rot');return}
  // A quick flick turns the piece where it was: left/right flips, down rotates clockwise, up anticlockwise.
  if(dt<260&&Math.hypot(fx,fy)>.35){p.x=ox;p.y=oy;if(Math.abs(fx)>Math.abs(fy))turn(p,'flip');else turn(p,fy>0?'rot':'rotl');return}
  if(!t0)t0=Date.now();drop(p);render();check()};
svg.addEventListener('pointerup',endDrag);svg.addEventListener('pointercancel',endDrag);
function absCells(p){return p.shape.map(([a,b])=>[a+p.x,b+p.y])}
function onTray(x,y){return x>=0&&y>=0&&x<G.w&&y<G.h&&G.mask[y*G.w+x]}
function occupied(except){const S=new Set();for(const q of ps)if(q!==except)for(const[a,b]of absCells(q))S.add(a+','+b);return S}
function drop(p){
  p.x=Math.round(p.x);p.y=Math.round(p.y);
  const A=absCells(p),occ=occupied(p),hit=A.some(([a,b])=>occ.has(a+','+b)),inT=A.filter(([a,b])=>onTray(a,b)).length;
  const inside=A.every(([a,b])=>a>world.x0&&b>world.y0&&a<world.x1-1&&b<world.y1-1);
  if(inT===A.length&&!hit){if(!p.inTray)p.at=Date.now();p.inTray=true;return}
  p.inTray=false;
  if(inT===0&&!hit&&inside)return;
  const f=findFree(p);if(f){p.x=f.x;p.y=f.y}else{p.x=p.home[0];p.y=p.home[1]}}
/* Nearest place below the tray where the piece fits without touching another piece. */
function findFree(p){const occ=occupied(p),mx=world.x1-2,my=world.y1-2;let best=null;
  for(let y=G.h+1;y<=my;y++)for(let x=0;x<=mx;x++){
    if(p.shape.some(([a,b])=>a+x>mx||b+y>my||occ.has((a+x)+','+(b+y))))continue;
    const d=(x-p.x)**2+(y-p.y)**2;if(!best||d<best.d)best={x,y,d}}
  return best}
function turn(p,how){
  if(!p||solved||p.fixed)return;
  const n=p.shape.length;let cx=0,cy=0;for(const[a,b]of p.shape){cx+=a;cy+=b}cx/=n;cy/=n;
  if(how==='flip'&&!puz.flip){$('p-msg').textContent='This set is made so pieces stay face up.';return}
  const ns=norm(p.shape.map(([a,b])=>how==='rot'?[-b,a]:how==='rotl'?[b,-a]:[-a,b]));
  let nx=0,ny=0;for(const[a,b]of ns){nx+=a;ny+=b}nx/=n;ny/=n;
  p.shape=ns;p.x=Math.round(p.x+cx-nx);p.y=Math.round(p.y+cy-ny);
  if(!t0)t0=Date.now();drop(p);render();check()}
function check(){
  const need=G.mask.filter(Boolean).length;let cov=0;for(const p of ps)if(p.inTray)cov+=p.shape.length;
  if(cov===need&&ps.every(p=>p.inTray)){solved=true;sel=null;render();
    const secs=t0?Math.round((Date.now()-t0)/1000):0;const m=Math.floor(secs/60),s=secs%60;
    $('banner').textContent=`Solved in ${m}:${String(s).padStart(2,'0')}${hints?` with ${hints} hint${hints>1?'s':''}`:''}`;$('banner').hidden=false;
    if(chal){store.done=store.done||{};store.done[puz.created+':'+chal.num]=1;persist();renderChallenges()}
    if(MODE==='app'&&!chal){if(puz.packNum){store.done=store.done||{};store.done['pack-'+puz.packNum]=1;persist()}
      if(puz.packNum||puz.fresh){$('next').textContent=puz.fresh?'Another one':'Next puzzle';$('next').hidden=false}}}}
/* Hints work from wherever you are: the solver finishes the tray from your current pieces. */
function completeFrom(placed){
  const pre=[];for(const p of placed)for(const[a,b]of absCells(p))pre.push(b*G.w+a);
  const rest=ps.filter(p=>!placed.includes(p)),cl=classesOf(rest.map(p=>puz.pieces[p.id]),puz.flip);
  const r=enumSols(G.w,G.h,G.mask,cl,ID1(G.w*G.h),1,3e5,pre);
  if(!r.sols.length)return null;return {rest,P:toPieces(r.sols[0],cl,G.w)}}
function placeAt(p,cells){p.shape=norm(cells);p.x=Math.min(...cells.map(c=>c[0]));p.y=Math.min(...cells.map(c=>c[1]));p.inTray=true;p.at=Date.now()}
function hint(){
  if(solved||!puz)return;hints++;if(!t0)t0=Date.now();
  const placed=ps.filter(p=>p.inTray),res=completeFrom(placed);
  if(res){const keys=Object.keys(res.P).map(Number);let k=keys.find(k=>res.rest[k].id===sel);if(k==null)k=keys[(Math.random()*keys.length)|0];
    const p=res.rest[k];placeAt(p,res.P[k]);sel=p.id;$('p-msg').textContent='One piece placed for you.';render();check();return}
  const movable=placed.filter(p=>!p.fixed).sort((a,b)=>b.at-a.at);
  let culprit=movable.find(q=>completeFrom(placed.filter(p=>p!==q)))||movable[0];
  if(!culprit){$('p-msg').textContent='No hint available here.';return}
  culprit.inTray=false;culprit.x=culprit.home[0];culprit.y=culprit.home[1];sel=culprit.id;render();
  $('p-msg').textContent=`The highlighted piece can't stay where it was, so it's back with the others.`}
function showSolution(){for(const p of ps)placeAt(p,G.sol[p.id]);
  sel=null;solved=true;render();$('banner').textContent='The solution';$('banner').hidden=false}
$('rot').onclick=()=>turn(P(sel),'rot');$('flp').onclick=()=>turn(P(sel),'flip');$('back').onclick=()=>openGame(null);
$('hint').onclick=hint;$('sol').onclick=showSolution;$('shuf').onclick=()=>puz&&resetPlay();
document.addEventListener('keydown',e=>{if(mode!=='play'||sel==null||e.target.matches('input,select,textarea'))return;
  if(e.key==='r'||e.key==='R'){turn(P(sel),'rot');e.preventDefault()}if(e.key==='f'||e.key==='F'){turn(P(sel),'flip');e.preventDefault()}});

/* ---------- Design ---------- */
const dIds={w:'d-w',h:'d-h',n:'d-n',min:'d-min',max:'d-max',diff:'d-diff'};
function fillDesign(){for(const k in dIds)$(dIds[k]).value=draft[k];$('d-flip').checked=draft.flip;$('d-distinct').checked=draft.distinct;$('d-norect').checked=draft.noRect;$('d-many').value=draft.many?'many':'one';$('d-diffrow').hidden=!!draft.many;designMsg()}
function saveDraft(){store.draft=draft;persist();designMsg()}
const genInvalid=()=>{const c=draft.mask.filter(Boolean).length;return c<draft.n*draft.min||c>draft.n*draft.max||draft.min>draft.max};
function designMsg(){const c=draft.mask.filter(Boolean).length;const lo=draft.n*draft.min,hi=draft.n*draft.max;
  $('d-msg').textContent=genInvalid()?`The tray has ${c} squares, but ${draft.n} pieces of ${draft.min} to ${draft.max} squares cover ${lo} to ${hi}. Change the sizes or the tray.`:`${c} squares in the tray, about ${(c/draft.n).toFixed(1)} per piece.`;
  $('gen').disabled=running||genInvalid()}
for(const k of['n','min','max'])$(dIds[k]).addEventListener('input',e=>{draft[k]=Math.max(2,Math.min(16,+e.target.value||2));saveDraft()});
$('d-diff').onchange=e=>{draft.diff=e.target.value;saveDraft()};
$('d-many').onchange=e=>{draft.many=e.target.value==='many';$('d-diffrow').hidden=draft.many;saveDraft()};
for(const k of['w','h'])$(dIds[k]).addEventListener('change',e=>{const v=Math.max(3,Math.min(12,+e.target.value||3));const nw=k==='w'?v:draft.w,nh=k==='h'?v:draft.h;
  const m=[];for(let y=0;y<nh;y++)for(let x=0;x<nw;x++)m.push(x<draft.w&&y<draft.h?draft.mask[y*draft.w+x]:1);draft.w=nw;draft.h=nh;draft.mask=m;e.target.value=v;saveDraft();render()});
$('d-flip').onchange=e=>{draft.flip=e.target.checked;saveDraft()};$('d-distinct').onchange=e=>{draft.distinct=e.target.checked;saveDraft()};$('d-norect').onchange=e=>{draft.noRect=e.target.checked;saveDraft()};
$('presets').innerHTML=PRESETS.map((p,i)=>`<button type="button" data-p="${i}">${p.name}</button>`).join('');
$('presets').onclick=e=>{const i=e.target.dataset.p;if(i==null)return;const p=PRESETS[i];
  Object.assign(draft,{w:p.w,h:p.h,n:p.n,min:p.min,max:p.max,many:!!p.many,mask:p.mask?p.mask.split('').map(Number):new Array(p.w*p.h).fill(1)});fillDesign();saveDraft();render()};

/* ---------- Background jobs (worker, with an on-page fallback) ---------- */
const workerURL='worker.js';
let sliceJob=null;
function busy(b){$('gen').disabled=b||genInvalid();$('ch-make').disabled=b;$('stop').hidden=!b}
function stopAll(){running=false;if(worker){worker.terminate();worker=null}if(sliceJob){sliceJob.stop=true;sliceJob=null}busy(false)}
function runJob(o,msgEl,done){
  stopAll();running=true;busy(true);
  $(msgEl).textContent=o.job==='challenges'?'Making challenges…':'Trying layouts…';
  const onMsg=m=>{if(m.ready)return;
    if(m.tick){$(msgEl).textContent=o.job==='level'?'Making a new puzzle…':o.job==='challenges'?`Making challenges… ${m.found} so far.`:`Trying layouts… ${m.tries} tried, ${m.found} ${o.many?'fit many ways':'fit only one way'}.`;return}
    stopAll();done(m)};
  let alive=false;
  const fallback=()=>{if(worker){try{worker.terminate()}catch(e){}worker=null}if(!running)return;
    if(o.job==='challenges')setTimeout(()=>{if(running)onMsg({done:true,...makeChallenges(o)})},30);
    else if(o.job==='level')setTimeout(()=>{if(running)onMsg({done:true,...generateLevel(o.level,8000)})},30);else sliced(o,onMsg)};
  try{worker=new Worker(workerURL);worker.onmessage=e=>{alive=true;onMsg(e.data)};worker.onerror=e=>{e.preventDefault?.();fallback()};worker.postMessage(o);setTimeout(()=>{if(!alive&&worker)fallback()},1500)}
  catch(e){worker=null;fallback()}}
function sliced(o,onMsg){
  const syms=traySyms(o.w,o.h,o.mask),t0=Date.now(),cands=[],oo=Object.assign({},o,{limit:Math.min(o.limit,4e5)});let tries=0;const job={stop:false};sliceJob=job;
  const step=()=>{if(job.stop)return;const ts=Date.now();
    while(Date.now()-ts<40&&Date.now()-t0<o.time&&cands.length<o.want){tries++;const c=tryOne(oo,syms);if(c)cands.push(c)}
    if(Date.now()-t0<o.time&&cands.length<o.want){onMsg({tick:true,tries,found:cands.length});setTimeout(step,0);return}
    sliceJob=null;if(!cands.length){onMsg({done:true,tries,found:0});return}
    const p=pickCand(cands,o);onMsg({done:true,tries,found:cands.length,pieces:p.pieces,nodes:p.nodes,count:p.count,human:p.human,level:p.level})};
  setTimeout(step,0)}
function genOpts(d){const big=d.mask.filter(Boolean).length>40;
  return {job:'gen',w:d.w,h:d.h,mask:d.mask,n:d.n,min:d.min,max:d.max,flip:d.flip,distinct:d.distinct,noRect:d.noRect,diff:d.diff,many:!!d.many,
    time:big?14000:7000,want:d.many?2:(d.diff==='medium'?8:16),limit:big?4e6:1.5e6}}
function makePuz(d,m){const n=(store.count=(store.count||0)+1);persist();
  return {v:2,name:d.many?`Puzzle ${n}`:`Puzzle ${n} (${m.level}/5)`,level:m.level,human:m.human,w:d.w,h:d.h,mask:d.mask.slice(),flip:d.flip,many:!!d.many,count:m.count||1,pieces:m.pieces,nodes:m.nodes,challenges:[],created:new Date().toISOString()}}
$('gen').onclick=()=>runJob(genOpts(draft),'d-msg',m=>{
  if(!m.found){$('d-msg').textContent=draft.many?`No set fitted the tray 20 or more ways after ${m.tries} tries. Try a bigger tray, smaller pieces, or allow turning over.`:`No layout with a single solution after ${m.tries} tries. Try fewer or larger pieces, untick "Every piece a different shape", or allow turning over.`;return}
  loadPuzzle(makePuz(draft,m));setMode('play');
  $('p-msg').textContent=draft.many?`This set fits the tray ${m.count>=60?'60 or more':m.count} ways. Make challenges below.`:`Picked from ${m.found} layouts that fit only one way (${m.tries} tried).`});
$('stop').onclick=()=>{stopAll();$('d-msg').textContent='Stopped.'};

/* ---------- Challenges ---------- */
const chS=Object.assign({tray:24,shape:24,smin:3,smax:5},store.ch||{});
for(const k of['tray','shape','smin','smax']){const el=$('ch-'+k);el.value=chS[k];el.addEventListener('input',()=>{chS[k]=Math.max(0,Math.min(k.startsWith('s')&&k!=='shape'?8:60,+el.value||0));store.ch=chS;persist()})}
$('ch-make').onclick=()=>{if(!puz)return;
  const smin=Math.max(2,Math.min(chS.smin,puz.pieces.length)),smax=Math.max(smin,Math.min(chS.smax,puz.pieces.length));
  runJob({job:'challenges',w:puz.w,h:puz.h,mask:puz.mask,flip:puz.flip,pieces:puz.pieces,trayN:chS.tray,shapeN:chS.shape,shapeMin:smin,shapeMax:smax,time:20000},'ch-msg',m=>{
    puz.challenges=m.challenges||[];store.puzzle=puz;persist();renderChallenges();
    const t=puz.challenges.filter(c=>c.type==='tray').length,sh=puz.challenges.length-t;
    $('ch-msg').textContent=`${t} tray challenge${t===1?'':'s'} and ${sh} shape${sh===1?'':'s'}, each with only one answer.`+(chS.tray&&t<chS.tray?' Fewer tray challenges than asked: this set has few ways to fill the tray.':'')})};
function renderChallenges(){
  const list=(puz&&puz.challenges)||[],done=store.done||{};
  if(MODE==='player')$('ch-intro').textContent=list.length?'In the tray: some pieces are already placed for you (with a pin), so fill the rest. Shapes: build the outline on the table from the pieces shown. Each has one answer.':'This puzzle has no challenges yet.';
  else $('ch-intro').textContent=puz&&!puz.many?'Tray challenges give you some pieces already placed. This set fits its tray only one way, so they work as easier versions of the main puzzle; for a full challenge set, design one with "Fits many ways". Shape challenges are built on the table, no tray needed.':'Tray challenges give you some pieces already placed (marked with a pin): fill the rest. Shape challenges are built on the table from the pieces shown.';
  const groups=[['tray','In the tray'],['shape','Shapes to build']];let h='';
  for(const[t,label]of groups){const l=list.filter(c=>c.type===t);if(!l.length)continue;h+=`<p class="lv">${label}</p>`;
    for(const lv of['Starter','Junior','Expert','Master']){const ll=l.filter(c=>c.level===lv);if(!ll.length)continue;
      h+=`<div class="lvrow"><span class="lvname">${lv}</span><div class="chips">${ll.map(c=>`<button type="button" data-c="${list.indexOf(c)}" class="${done[puz.created+':'+c.num]?'done':''}" ${chal===c?'aria-current="true"':''} aria-label="Challenge ${c.num}${done[puz.created+':'+c.num]?', solved':''}">${c.num}</button>`).join('')}</div></div>`}}
  $('ch-list').innerHTML=h;$('ch-book').hidden=!list.length}
$('ch-list').onclick=e=>{const i=e.target.closest('button')?.dataset.c;if(i==null)return;openGame(puz.challenges[+i]);if(innerWidth<860)svg.scrollIntoView({behavior:'smooth',block:'start'})};
function miniSVG(w,h,mask,pieces,silhouette){
  const cells=[];for(let i=0;i<w*h;i++)if(mask[i])cells.push([i%w,(i/w)|0]);
  const L=loops(cells),pad=.45;
  let s=`<svg xmlns="http://www.w3.org/2000/svg" viewBox="${-pad} ${-pad} ${w+2*pad} ${h+2*pad}">`;
  if(silhouette)s+=`<path d="${L.map(l=>'M'+l.map(p=>p.join(' ')).join('L')+'Z').join('')}" fill="#e4dfd5" stroke="#222" stroke-width=".07"/>`;
  else{s+=`<path d="${L.map(l=>'M'+offsetLoop(l,.3).map(p=>p.join(' ')).join('L')+'Z').join('')}" fill="#4a3526"/>`;for(const[x,y]of cells)s+=`<rect x="${x+.04}" y="${y+.04}" width=".92" height=".92" fill="#fff"/>`}
  for(const p of pieces)s+=`<path d="${pathOf(p.cells,.04)}" fill="${p.fill}" stroke="#222" stroke-width=".05"/>`;
  return s+'</svg>'}
function pieceSVG(id){const n=norm(puz.pieces[id]);let w=0,h=0;for(const[x,y]of n){w=Math.max(w,x+1);h=Math.max(h,y+1)}
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="-.15 -.15 ${w+.3} ${h+.3}" style="height:${(h+.3)*4}mm"><path d="${pathOf(n,.04)}" fill="${WOOD[id%WOOD.length]}" stroke="#222" stroke-width=".06"/></svg>`}
function bookletHTML(){
  const id=puz.id||slug(puz.name),qr=c=>qrSVG(setURL(id,c));
  const list=puz.challenges||[],card=(c,sol)=>{const fills=id=>({cells:c.sol[id],fill:WOOD[id%WOOD.length]});
    const pic=c.type==='tray'?miniSVG(puz.w,puz.h,puz.mask,(sol?Object.keys(c.sol).map(Number):c.fixed).map(fills),false):miniSVG(c.w,c.h,c.mask,sol?c.ids.map(fills):[],true);
    const use=c.type==='shape'&&!sol?`<div class="use">${c.ids.map(pieceSVG).join('')}</div>`:'';
    return `<div class="card"><div class="hd"><b>${c.num}</b><span>${c.level}</span>${sol?'':`<i class="qr">${qr(c.num)}</i>`}</div>${pic}${use}</div>`};
  const sec=(t,title,note)=>{const l=list.filter(c=>c.type===t);return l.length?`<h2>${title}</h2><p>${note}</p><div class="grid">${l.map(c=>card(c,false)).join('')}</div>`:''};
  return `<!DOCTYPE html><html lang="en-GB"><head><meta charset="utf-8"><title>${esc(puz.name)} challenges</title><style>
@page{size:A4;margin:12mm}body{font:11pt/1.4 system-ui,sans-serif;color:#1b1c1e;margin:0 auto;max-width:190mm;padding:8mm}
h1{font-size:22pt;margin:0 0 2mm}h2{font-size:15pt;margin:8mm 0 2mm;break-after:avoid}.pg{break-before:page}
.grid{display:grid;grid-template-columns:repeat(3,1fr);gap:4mm}.grid.sm{grid-template-columns:repeat(4,1fr)}
.card{border:1px solid #bbb;border-radius:3mm;padding:3mm;break-inside:avoid}.card svg{width:100%;height:auto;max-height:42mm;display:block}
.hd{display:flex;gap:2mm;align-items:center;font-size:10pt;margin-bottom:1mm}.hd span{color:#666;flex:1}.qr{width:16mm;flex:none}.qr svg{width:16mm;height:16mm;display:block}
.cover{display:flex;gap:6mm;align-items:flex-start;justify-content:space-between}.cover .big{width:32mm;flex:none;text-align:center;font-size:8.5pt;color:#444}.cover .big svg{width:32mm;height:32mm;display:block}
@media print{.noprint{display:none}}
.use{display:flex;flex-wrap:wrap;gap:2mm;margin-top:2mm;align-items:end}.use svg{width:auto}
.pieces{display:flex;flex-wrap:wrap;gap:5mm;align-items:end}.pieces svg{width:auto}
</style></head><body>
<p class="noprint"><button onclick="print()" style="font:inherit;padding:2mm 4mm">Print</button></p>
<div class="cover"><div><h1>${esc(puz.name)}: challenges</h1>
<p>${puz.pieces.length} pieces${puz.flip?', which may be turned over':''}. Each challenge has exactly one answer. Scan a challenge's code to try it on your phone, with hints. Solutions are at the back.</p></div>
<div class="big">${qr('')}<br>Play online</div></div>
<div class="pieces">${puz.pieces.map((_,i)=>pieceSVG(i)).join('')}</div>
${sec('tray','In the tray','Place the coloured pieces exactly as shown, then fill the white squares with all the other pieces.')}
${sec('shape','Shapes to build','On the table, build the shape using only the pieces shown under it.')}
<h2 class="pg">Solutions</h2><div class="grid sm">${list.map(c=>card(c,true)).join('')}</div>
</body></html>`}
$('ch-book').onclick=()=>{if(!puz)return;const html=bookletHTML();
  if(dl){save(fname()+'-challenges.html',html,'ch-msg');return}
  const u=URL.createObjectURL(new Blob([html],{type:'text/html'}));const w=window.open(u,'_blank');
  if(!w)save(fname()+'-challenges.html',html,'ch-msg');else $('ch-msg').textContent='The booklet opened in a new tab. Print it from there.'};
/* ---------- Publish (maker) ---------- */
function updatePub(){if(!puz)return;if(document.activeElement!==$('pub-name'))$('pub-name').value=puz.name||'';
  const u=setURL(slug(puz.name));$('pub-url').textContent=u;$('pub-qr').innerHTML=qrSVG(u)}
$('pub-name').addEventListener('input',e=>{if(!puz)return;puz.name=e.target.value.trim()||'Puzzle';store.puzzle=puz;persist();renderInfo();updatePub()});
$('pub-dl').onclick=()=>{if(!puz)return;const id=slug(puz.name);puz.id=id;store.puzzle=puz;persist();
  save(id+'.json',JSON.stringify(puz),'pub-msg').then(()=>{const n=(puz.challenges||[]).length;
    $('pub-msg').textContent=`${id}.json is ready${n?` with ${n} challenges`:', with no challenges yet'}. Upload it to the puzzles folder on GitHub.`})};

/* ---------- Cut geometry ---------- */
function geometry(){
  const C=+cut.cell,B=+cut.border,kf=+cut.kerf,inside=cut.mode==='inside',cl=inside?0:+cut.clear,{w,h,mask}=puz,gap=6;
  const cells=[];for(let i=0;i<w*h;i++)if(mask[i])cells.push([i%w,(i/w)|0]);
  let bx0=Infinity,by0=Infinity,bx1=-Infinity,by1=-Infinity;for(const[x,y]of cells){bx0=Math.min(bx0,x);by0=Math.min(by0,y);bx1=Math.max(bx1,x+1);by1=Math.max(by1,y+1)}
  const fw=(bx1-bx0)*C+2*(B+cl),fh=(by1-by0)*C+2*(B+cl);
  const polys=[],lines=[];
  const rect=(x,y,W,H,o)=>[[x-o,y-o],[x+W+o,y-o],[x+W+o,y+H+o],[x-o,y+H+o]];
  // Inner shapes first: window, then the frame's outside, then the base beside it.
  // Inside mode: the window line sits on the tray outline and is also the pieces' outer edge.
  for(const L of loops(cells))polys.push(offsetLoop(L,(cl-kf/2)/C).map(([x,y])=>[(x-bx0)*C+B+cl,(y-by0)*C+B+cl]));
  polys.push(rect(0,0,fw,fh,kf/2));
  const base=rect(fw+gap,0,fw,fh,kf/2);base.L='BASE';polys.push(base);
  let W=2*fw+gap,H=fh;const py0=fh+gap;
  if(inside||cut.mode==='shared'){
    const pid=new Int16Array(w*h).fill(-1);puz.pieces.forEach((c,j)=>c.forEach(([x,y])=>pid[y*w+x]=j));
    const at=(x,y)=>x<0||y<0||x>=w||y>=h?-1:pid[y*w+x];
    const ox=inside?B-bx0*C:-bx0*C,oy=inside?B-by0*C:py0-by0*C,layer=inside?'PIECES':'CUT';
    const isCut=(a,b)=>a!==b&&(!inside||(a!==-1&&b!==-1));
    for(let y=0;y<=h;y++){let run=null;for(let x=0;x<=w;x++){const c=x<w&&isCut(at(x,y-1),at(x,y));
      if(c&&run===null)run=x;if(!c&&run!==null){lines.push([ox+run*C,oy+y*C,ox+x*C,oy+y*C,layer]);run=null}}}
    for(let x=0;x<=w;x++){let run=null;for(let y=0;y<=h;y++){const c=y<h&&isCut(at(x-1,y),at(x,y));
      if(c&&run===null)run=y;if(!c&&run!==null){lines.push([ox+x*C,oy+run*C,ox+x*C,oy+y*C,layer]);run=null}}}
    if(!inside)H=py0+(by1-by0)*C}
  else{let x=0,y=py0,rowH=0;const maxW=W;
    for(const c of puz.pieces){const n=norm(c);let bw=0,bh=0;for(const[a,b]of n){bw=Math.max(bw,a+1);bh=Math.max(bh,b+1)}
      const pw=bw*C+kf,ph=bh*C+kf;if(x+pw>maxW&&x>0){x=0;y+=rowH+gap;rowH=0}
      for(const L of loops(n))polys.push(offsetLoop(L,kf/2/C).map(([a,b])=>[x+kf/2+a*C,y+kf/2+b*C]));
      x+=pw+gap;rowH=Math.max(rowH,ph)}
    H=y+rowH}
  // Difficulty chillies, scan-engraved along the frame's top border.
  const engr=[];
  if(cut.chilli&&puz.level&&!puz.many&&B>=6){const hc=Math.min(9,B*.7),sp=hc*1.05,x0=fw/2-puz.level*sp/2,y0=(B-hc)/2;
    for(let i=0;i<puz.level;i++)for(const P of CHILLI)engr.push(P.map(([a,b])=>[x0+i*sp+a*hc,y0+b*hc]))}
  const m=kf;return{polys,lines,engr,W:W+2*m,H:H+2*m,m,fw,fh,inside}}
const BLUE='#1f5fd6',MAGENTA='#c026d3';
function renderCut(){
  if(!puz){svg.innerHTML='';return}
  const g=geometry(),pad=4;$('c-clear').disabled=g.inside;
  svg.setAttribute('viewBox',`${-pad} ${-pad} ${g.W+2*pad} ${g.H+2*pad}`);
  const sw=Math.max(g.W,g.H)/450;
  let s=`<rect x="${-pad/2}" y="${-pad/2}" width="${g.W+pad}" height="${g.H+pad}" fill="var(--slot)" rx="2"/>`;
  s+=g.polys.map(p=>`<path d="M${p.map(v=>(v[0]+g.m).toFixed(2)+' '+(v[1]+g.m).toFixed(2)).join('L')}Z" fill="none" stroke="${p.L==='BASE'?MAGENTA:'var(--laser)'}" stroke-width="${sw}"/>`).join('');
  s+=g.engr.map(p=>`<path d="M${p.map(v=>(v[0]+g.m).toFixed(2)+' '+(v[1]+g.m).toFixed(2)).join('L')}Z" fill="#16a34a"/>`).join('');
  s+=g.lines.map(l=>`<line x1="${l[0]+g.m}" y1="${l[1]+g.m}" x2="${l[2]+g.m}" y2="${l[3]+g.m}" stroke="${l[4]==='PIECES'?BLUE:'var(--laser)'}" stroke-width="${sw*(l[4]==='PIECES'?1.4:1)}"/>`).join('');
  const fs=Math.max(g.W,g.H)/45;
  s+=`<text x="${g.m+g.fw/2}" y="${g.m+g.fh-(+cut.border)/2+fs*.35}" font-size="${fs}" text-anchor="middle" fill="var(--muted)" font-family="Barlow">Frame${g.inside?' + pieces':''}</text><text x="${g.m+g.fw*1.5+6}" y="${g.m+g.fh/2}" font-size="${fs}" text-anchor="middle" fill="var(--muted)" font-family="Barlow">Base</text>`;
  svg.innerHTML=s;
  $('c-stat').innerHTML=`<span>Sheet needed <b class="dims">${g.W.toFixed(0)} × ${g.H.toFixed(0)} mm</b></span><span>Frame and base <b class="dims">${g.fw.toFixed(1)} × ${g.fh.toFixed(1)} mm</b></span>`+
    `<span>Layer order: ${g.engr.length?'<b style="color:#16a34a">green</b> ENGRAVE (scan the chillies), then ':''}${g.inside?`<b style="color:${BLUE}">blue</b> PIECES (lines between pieces), then `:''}<b style="color:var(--laser)">red</b> CUT (window, then frame outside${g.inside?'':', pieces'}), then <b style="color:${MAGENTA}">magenta</b> BASE.${g.inside?` Fit comes from the kerf: about ${(+cut.kerf).toFixed(2)} mm play on each outside edge.`:''}</span>`}
function toDXF(g){
  const f=v=>(+v).toFixed(3),Y=y=>f(g.H-(y+g.m)),X=x=>f(x+g.m),ACI={CUT:1,PIECES:5,BASE:6,ENGRAVE:3};
  let s='0\nSECTION\n2\nHEADER\n9\n$INSUNITS\n70\n4\n0\nENDSEC\n0\nSECTION\n2\nTABLES\n0\nTABLE\n2\nLAYER\n70\n2\n';
  for(const n of[...(g.engr.length?['ENGRAVE']:[]),...(g.inside?['PIECES']:[]),'CUT','BASE'])s+=`0\nLAYER\n2\n${n}\n70\n0\n62\n${ACI[n]}\n6\nCONTINUOUS\n`;
  s+='0\nENDTAB\n0\nENDSEC\n0\nSECTION\n2\nENTITIES\n';
  // Written in cutting order: engraving, lines between pieces, then the window, frame outside and base.
  for(const p of g.engr){s+='0\nPOLYLINE\n8\nENGRAVE\n62\n3\n66\n1\n10\n0\n20\n0\n30\n0\n70\n1\n';for(const v of p)s+=`0\nVERTEX\n8\nENGRAVE\n10\n${X(v[0])}\n20\n${Y(v[1])}\n30\n0\n`;s+='0\nSEQEND\n8\nENGRAVE\n'}
  for(const l of g.lines){const L=l[4]||'CUT';s+=`0\nLINE\n8\n${L}\n62\n${ACI[L]}\n10\n${X(l[0])}\n20\n${Y(l[1])}\n30\n0\n11\n${X(l[2])}\n21\n${Y(l[3])}\n31\n0\n`}
  const polys=g.polys.filter(p=>p.L!=='BASE').concat(g.polys.filter(p=>p.L==='BASE'));
  for(const p of polys){const L=p.L||'CUT';s+=`0\nPOLYLINE\n8\n${L}\n62\n${ACI[L]}\n66\n1\n10\n0\n20\n0\n30\n0\n70\n1\n`;for(const v of p)s+=`0\nVERTEX\n8\n${L}\n10\n${X(v[0])}\n20\n${Y(v[1])}\n30\n0\n`;s+=`0\nSEQEND\n8\n${L}\n`}
  return s+'0\nENDSEC\n0\nEOF\n'}
function toSVG(g){const f=v=>(+v).toFixed(3),pa=p=>`<path d="M${p.map(v=>f(v[0]+g.m)+' '+f(v[1]+g.m)).join(' L')} Z"/>`,ln=l=>`<line x1="${f(l[0]+g.m)}" y1="${f(l[1]+g.m)}" x2="${f(l[2]+g.m)}" y2="${f(l[3]+g.m)}"/>`;
  const pl=g.lines.filter(l=>l[4]==='PIECES'),cl=g.lines.filter(l=>l[4]!=='PIECES');
  return `<?xml version="1.0" encoding="UTF-8"?>\n<svg xmlns="http://www.w3.org/2000/svg" width="${f(g.W)}mm" height="${f(g.H)}mm" viewBox="0 0 ${f(g.W)} ${f(g.H)}">\n`+
  (g.engr.length?`<g id="ENGRAVE" fill="#00ff00" stroke="none">\n${g.engr.map(pa).join('\n')}\n</g>\n`:'')+
  (pl.length?`<g id="PIECES" fill="none" stroke="#0000ff" stroke-width="0.1">\n${pl.map(ln).join('\n')}\n</g>\n`:'')+
  `<g id="CUT" fill="none" stroke="#ff0000" stroke-width="0.1">\n`+cl.map(ln).join('\n')+(cl.length?'\n':'')+
  g.polys.filter(p=>p.L!=='BASE').map(pa).join('\n')+'\n</g>\n'+
  `<g id="BASE" fill="none" stroke="#ff00ff" stroke-width="0.1">\n`+g.polys.filter(p=>p.L==='BASE').map(pa).join('\n')+'\n</g>\n</svg>\n'}
/* Minimal ZIP (stored, no compression) */
const CRC=(()=>{const t=new Uint32Array(256);for(let n=0;n<256;n++){let c=n;for(let k=0;k<8;k++)c=c&1?0xEDB88320^(c>>>1):c>>>1;t[n]=c>>>0}return t})();
const crc32=b=>{let c=0xFFFFFFFF;for(let i=0;i<b.length;i++)c=CRC[(c^b[i])&255]^(c>>>8);return(c^0xFFFFFFFF)>>>0};
function zip(files){const enc=new TextEncoder(),parts=[],cen=[];let off=0;
  for(const[name,text]of files){const nb=enc.encode(name),db=enc.encode(text),c=crc32(db);
    const h=new DataView(new ArrayBuffer(30));h.setUint32(0,0x04034b50,true);h.setUint16(4,20,true);h.setUint32(14,c,true);h.setUint32(18,db.length,true);h.setUint32(22,db.length,true);h.setUint16(26,nb.length,true);
    parts.push(new Uint8Array(h.buffer),nb,db);
    const e=new DataView(new ArrayBuffer(46));e.setUint32(0,0x02014b50,true);e.setUint16(4,20,true);e.setUint16(6,20,true);e.setUint32(16,c,true);e.setUint32(20,db.length,true);e.setUint32(24,db.length,true);e.setUint16(28,nb.length,true);e.setUint32(42,off,true);
    cen.push(new Uint8Array(e.buffer),nb);off+=30+nb.length+db.length}
  const cs=cen.reduce((a,b)=>a+b.length,0),end=new DataView(new ArrayBuffer(22));end.setUint32(0,0x06054b50,true);end.setUint16(8,files.length,true);end.setUint16(10,files.length,true);end.setUint32(12,cs,true);end.setUint32(16,off,true);
  return new Blob([...parts,...cen,new Uint8Array(end.buffer)])}
let dl=null;
(async()=>{try{dl=await window.claude?.use?.('downloads')}catch(e){dl=null}})();
const fname=()=>(puz.name||'puzzle').replace(/[^\w-]+/g,'-').toLowerCase();
async function save(name,data,msgEl){
  if(!dl){try{const a=document.createElement('a');a.href=URL.createObjectURL(data instanceof Blob?data:new Blob([data]));a.download=name;document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(a.href),4000);$(msgEl).textContent='Downloaded '+name+'.'}
    catch(e){$(msgEl).textContent='That download was blocked. Use Copy instead.'}return}
  try{await dl.save({filename:name,data});$(msgEl).textContent='Saved '+name+'.'}
  catch(e){$(msgEl).textContent=e?.code==='declined'?'Download cancelled.':'That download didn\'t go through. Try again, or use Copy.'}}
for(const k of OPT_KEYS){const el=$('c-'+k);el.value=cut[k];el.addEventListener('input',()=>{cut[k]=k==='mode'?el.value:(+el.value||0);store.cut=cut;persist();render()})}
$('dlzip').onclick=()=>{const g=geometry(),n=fname();save(n+'-laser.zip',zip([[n+'.dxf',toDXF(g)],[n+'.svg',toSVG(g)],[n+'.json',JSON.stringify(puz)]]),'c-msg')};
$('c-chilli').checked=!!cut.chilli;$('c-chilli').onchange=e=>{cut.chilli=e.target.checked;store.cut=cut;persist();render()};
$('dldxf').onclick=()=>save(fname()+'.dxf',toDXF(geometry()),'c-msg');
$('dlsvg').onclick=()=>save(fname()+'.svg',toSVG(geometry()),'c-msg');
$('cpdxf').onclick=async()=>{try{await navigator.clipboard.writeText(toDXF(geometry()));$('c-msg').textContent='DXF copied. Paste it into a text file ending .dxf.'}catch(e){$('c-msg').textContent='Copying was blocked here.'}};
$('savejson').onclick=()=>puz&&save(fname()+'.json',JSON.stringify(puz,null,1),'p-msg');
$('openjson').onchange=async e=>{const f=e.target.files[0];if(!f)return;
  try{const p=JSON.parse(await f.text());if(!p.w||!p.h||!Array.isArray(p.mask)||!Array.isArray(p.pieces))throw 0;if(!Array.isArray(p.challenges))p.challenges=[];p.created=p.created||new Date().toISOString();loadPuzzle(p);setMode('play');$('p-msg').textContent='Opened '+f.name+'.'}
  catch(err){$('p-msg').textContent='That file isn\'t a puzzle file from this page.'}e.target.value=''};

/* ---------- Modes ---------- */
function setMode(m){mode=m;for(const k of['design','play','cut'])$('tab-'+k).setAttribute('aria-selected',String(k===m));
  $('p-design').hidden=m!=='design';$('p-play').hidden=m!=='play';$('p-pub').hidden=m!=='play';$('p-chal').hidden=m!=='play';$('p-cut').hidden=m!=='cut';$('p-file').hidden=m==='design';
  if(m!=='play')$('banner').hidden=true;else if(solved)$('banner').hidden=false;
  if(m==='design')fillDesign();render()}
for(const k of['design','play','cut'])$('tab-'+k).onclick=()=>{if(k!=='design'&&!puz)return;setMode(k)};
function home(){
  fetch('puzzles/index.json',{cache:'no-cache'}).then(r=>{if(!r.ok)throw 0;return r.json()}).then(list=>{
    $('sets').innerHTML=list.length?list.map(s=>`<a class="set" href="?set=${encodeURIComponent(s.id)}">${miniSVG(s.w,s.h,s.mask,[],false)}<b>${esc(s.name)}</b>${s.level?chillies(s.level,16):''}<span>${s.pieces} pieces${s.tray+s.shape?` · ${s.tray+s.shape} challenges`:''}</span></a>`).join(''):'<p class="note">No puzzles yet.</p>'})
  .catch(()=>{$('sets').innerHTML='<p class="note">The puzzle list couldn\'t load. Try again in a moment.</p>'})}
function player(){
  setMode('play');const id=Q.get('set');
  fetch('puzzles/'+encodeURIComponent(id)+'.json',{cache:'no-cache'}).then(r=>{if(!r.ok)throw 0;return r.json()}).then(p=>{
    p.id=p.id||id;p.challenges=p.challenges||[];p.created=p.created||id;loadPuzzle(p);
    $('title').textContent=p.name;document.title=p.name+' · Wooden packing puzzles';
    $('lede').textContent=p.many?'Fill the tray with all the pieces: there are lots of ways. Then try the challenges, each with one answer.':'Fit every piece into the tray. There is only one way.';
    const c=Q.get('c'),ch=c&&p.challenges.find(x=>x.num===c);if(ch)openGame(ch)})
  .catch(()=>{$('title').textContent='Puzzle not found';$('lede').innerHTML='That puzzle isn\'t here. <a href="./">See all puzzles</a>.';svg.innerHTML=''})}
/* ---------- App: library of graded puzzles, new puzzles made on the phone, published sets ---------- */
let PACK=null,SETS=null,installEvt=null;

function loadPack(){if(PACK)return Promise.resolve(PACK);
  return Promise.all([1,2,3,4,5].map(l=>fetch('pack/level-'+l+'.json').then(r=>r.ok?r.json():[]).catch(()=>[]))).then(levels=>{
    PACK=[];levels.forEach(list=>list.forEach(p=>{const num=PACK.length+1;PACK.push(Object.assign({},p,{packNum:num,name:'Puzzle '+num,id:'pack-'+num,created:'pack-'+num,challenges:[]}))}));return PACK})}
function loadSets(){if(SETS)return Promise.resolve(SETS);return fetch('puzzles/index.json').then(r=>r.ok?r.json():[]).catch(()=>[]).then(l=>SETS=l)}
function appHome(){
  root.dataset.view='home';document.title='Packing Puzzles';stopAll();
  const done=store.done||{};
  $('app-new').innerHTML=[1,2,3,4,5].map(l=>`<button type="button" data-l="${l}" aria-label="New ${l}-chilli puzzle"><span class="chillies">${Array.from({length:l},()=>`<svg viewBox="-.03 -.03 1.06 1.06" width="13" height="13" aria-hidden="true"><path d="${chilliD(0,0,1)}" fill="#d4231b"/></svg>`).join('')}</span><span>${['Mild','Warm','Hot','Very hot','Fiery'][l-1]}</span></button>`).join('');
  loadPack().then(pack=>{
    const solved=pack.filter(p=>done['pack-'+p.packNum]).length;
    $('app-progress').textContent=pack.length?`${solved} of ${pack.length} puzzles solved`:'The puzzles couldn\'t load. Check your connection and try again.';
    $('app-levels').innerHTML=[1,2,3,4,5].map(l=>{const L=pack.filter(p=>p.level===l);if(!L.length)return '';
      return `<section class="lvl"><h2>${chillies(l,20)}<span>${L.filter(p=>done['pack-'+p.packNum]).length} of ${L.length}</span></h2><div class="tiles">${L.map(p=>`<a class="tile${done['pack-'+p.packNum]?' done':''}" href="#p${p.packNum}" aria-label="Puzzle ${p.packNum}${done['pack-'+p.packNum]?', solved':''}">${p.packNum}</a>`).join('')}</div></section>`}).join('')});
  loadSets().then(list=>{list=list.filter(s=>s.tray+s.shape>0);
    $('app-sets').innerHTML=list.length?`<section class="lvl"><h2>Challenge sets</h2><div class="sets">${list.map(s=>`<a class="set" href="#set-${encodeURIComponent(s.id)}">${miniSVG(s.w,s.h,s.mask,[],false)}<b>${esc(s.name)}</b>${s.level?chillies(s.level,16):''}<span>${s.pieces} pieces · ${s.tray+s.shape} challenges</span></a>`).join('')}</div></section>`:''})}
function appPlay(title,lede){root.dataset.view='play';$('next').hidden=true;sheet(false);$('title').textContent=title;$('lede').innerHTML=lede||'';document.title=title+' · Packing Puzzles';window.scrollTo(0,0)}
function appRoute(){
  const h=decodeURIComponent(location.hash.slice(1));
  if(!h)return appHome();
  let m;
  if(m=h.match(/^p(\d+)$/)){appPlay('Puzzle '+m[1],'');puz=null;render();
    loadPack().then(pack=>{const p=pack[+m[1]-1];if(!p){location.hash='';return}
      $('lede').innerHTML=chillies(p.level,16);loadPuzzle(Object.assign({},p));$('p-chal').hidden=true;tbChal()})}
  else if(m=h.match(/^new([1-5])$/)){const l=+m[1];appPlay('New puzzle',chillies(l,16));$('p-msg').textContent='Making a new puzzle…';puz=null;render();$('p-chal').hidden=true;
    runJob({job:'level',level:l,time:25000},'p-msg',r=>{if(!r.found){$('p-msg').textContent='Couldn\'t make one this time. Try again.';return}
      const p={v:2,name:'New puzzle',w:r.w,h:r.h,mask:r.mask,flip:true,many:false,count:1,pieces:r.pieces,nodes:r.nodes,human:r.human,level:r.level,challenges:[],created:'new-'+Date.now(),fresh:l};
      $('lede').innerHTML=chillies(r.level,16);loadPuzzle(p);$('p-msg').textContent='';$('p-chal').hidden=true;tbChal()})}
  else if(h.startsWith('set-')){const id=h.slice(4);appPlay('Loading…','');puz=null;render();
    fetch('puzzles/'+encodeURIComponent(id)+'.json').then(r=>{if(!r.ok)throw 0;return r.json()}).then(p=>{p.id=p.id||id;p.challenges=p.challenges||[];p.created=p.created||id;$('lede').innerHTML=p.level?chillies(p.level,16):'';loadPuzzle(p);$('p-chal').hidden=false;$('title').textContent=p.name;tbChal()})
    .catch(()=>{$('title').textContent='Not available offline';$('lede').textContent='Open this set once while online to keep it on your phone.'})}
  else location.hash=''}
function sheet(open){$('p-chal').classList.toggle('open',!!open);$('tb-chal')?.setAttribute('aria-expanded',String(!!open))}
function tbChal(){const has=!!(puz&&puz.challenges&&puz.challenges.length);$('tb-chal').hidden=!has;$('back').hidden=!chal}
function app(){
  setMode('play');
  // One-screen play layout: messages float over the board, Next sits on the board, challenges open as a panel.
  const board=svg.parentNode;board.append($('p-msg'),$('next'));document.body.append($('p-chal'));$('p-chal').prepend($('back'));
  let tm=null;new MutationObserver(()=>{clearTimeout(tm);if($('p-msg').textContent)tm=setTimeout(()=>$('p-msg').textContent='',3500)}).observe($('p-msg'),{childList:true,characterData:true,subtree:true});
  const need=()=>{if(sel==null||!P(sel)){$('p-msg').textContent='Tap a piece first, or flick it.';return null}return P(sel)};
  $('tb-rot').onclick=()=>{const p=need();if(p)turn(p,'rot')};$('tb-flip').onclick=()=>{const p=need();if(p)turn(p,'flip')};
  $('tb-hint').onclick=hint;$('tb-restart').onclick=()=>puz&&resetPlay();$('tb-sol').onclick=()=>puz&&showSolution();
  $('tb-chal').onclick=()=>sheet(!$('p-chal').classList.contains('open'));$('sheet-close').onclick=()=>sheet(false);
  $('ch-list').addEventListener('click',()=>setTimeout(()=>{sheet(false);tbChal()},0));$('back').addEventListener('click',()=>{sheet(false);setTimeout(tbChal,0)});
  $('app-new').onclick=e=>{const b=e.target.closest('button');if(b)location.hash='new'+b.dataset.l};
  $('app-back').onclick=e=>{e.preventDefault();location.hash=''};
  $('next').onclick=()=>{if(puz?.fresh){const h='new'+puz.fresh;if(location.hash==='#'+h)appRoute();else location.hash=h;return}
    const done=store.done||{},n=puz?.packNum||0;const nx=PACK&&(PACK.find(p=>p.packNum>n&&!done['pack-'+p.packNum])||PACK.find(p=>!done['pack-'+p.packNum]));location.hash=nx?'p'+nx.packNum:''};
  const standalone=matchMedia('(display-mode: standalone)').matches||navigator.standalone;
  if(!standalone)$('app-hint').hidden=false;
  addEventListener('beforeinstallprompt',e=>{e.preventDefault();installEvt=e;$('app-install').hidden=false;$('app-hint').hidden=true});
  $('app-install').onclick=async()=>{if(!installEvt)return;installEvt.prompt();try{await installEvt.userChoice}catch(e){}installEvt=null;$('app-install').hidden=true};
  addEventListener('hashchange',appRoute);appRoute()}
if(MODE==='home')home();
else if(MODE==='player')player();
else if(MODE==='app')app();
else{setMode('play');
if(puz)loadPuzzle(puz);
else{const d0=Object.assign({},draft,{w:6,h:5,n:6,min:4,max:6,mask:new Array(30).fill(1),diff:'medium',many:false});runJob(genOpts(d0),'p-msg',m=>{if(!m.found){$('p-msg').textContent='Open Design to make a puzzle.';return}const p=makePuz(d0,m);loadPuzzle(p);$('p-msg').textContent=''})}
}
}
