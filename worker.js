importScripts('core.js');
postMessage({ready:true});
onmessage=e=>{const d=e.data,tick=(t,f)=>postMessage({tick:true,tries:t,found:f});
  const r=d.job==='challenges'?makeChallenges(d,tick):d.job==='level'?generateLevel(d.level,d.time||25000,tick):generate(d,tick);postMessage({done:true,...r})};
