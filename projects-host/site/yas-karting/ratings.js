(function(root){
'use strict';
const median=a=>{const v=a.filter(Number.isFinite).sort((a,b)=>a-b),n=v.length;return n?(v[(n-1)>>1]+v[n>>1])/2:null;},mean=a=>a.length?a.reduce((s,v)=>s+v,0)/a.length:null,sd=a=>{const m=mean(a);return m===null?null:Math.sqrt(mean(a.map(v=>(v-m)**2)));},half=x=>Math.round(x*2)/2,clamp=x=>Math.max(1,Math.min(5,x));
function fit(points){
 if(!points.length)return ()=>null;
 if(points.length<4){const m=median(points.map(p=>p.seconds));return ()=>m;}
 const lo=Math.min(...points.map(p=>p.lap)),hi=Math.max(...points.map(p=>p.lap)),span=Math.max(1,hi-lo);let best=null;
 // Search S-shaped curves; least squares solves the level and amplitude at each shape.
 for(const k of [.5,1,2,3,4,6,8,12,18])for(const mid of [-.25,0,.2,.4,.6,.8,1,1.25]){
  const basis=x=>1/(1+Math.exp(k*((x-lo)/span-mid))),xs=points.map(p=>basis(p.lap)),ys=points.map(p=>p.seconds),mx=mean(xs),my=mean(ys),den=xs.reduce((s,x)=>s+(x-mx)**2,0),b=den?xs.reduce((s,x,i)=>s+(x-mx)*(ys[i]-my),0)/den:0,a=my-b*mx;
  const pred=x=>Math.max(1,a+b*basis(x)),err=points.map(p=>(p.seconds-pred(p.lap))**2).sort((a,b)=>a-b),cost=mean(err.slice(0,Math.max(3,Math.ceil(err.length*.85))));
  if(!best||cost<best.cost)best={cost,pred};
 }
 return best.pred;
}
function analyze(doc,sid,settings={}){
 const cfg={pit:120,incident:5,cooldown:1,skipFirst:false,reference:true,scope:'all',...settings};
 let drivers=doc.participants.filter(p=>doc.entries.some(e=>e.driver===p.id&&e.session===sid));
 if(cfg.scope==='reference')drivers=drivers.filter(p=>doc.laps.some(l=>l.session===sid&&l.driver===p.id&&doc.reference?.[l.id]));
 const series=drivers.map(person=>{
  const raw=doc.laps.filter(l=>l.session===sid&&l.driver===person.id).sort((a,b)=>a.lap-b.lap),eligible=raw.filter(l=>l.seconds<=cfg.pit&&!doc.excluded?.[l.id]&&(!cfg.skipFirst||l.lap>1));
  let trend=fit(eligible);for(let i=0;i<3;i++)trend=fit(eligible.filter(l=>l.seconds-trend(l.lap)<=cfg.incident));
  const useReference=cfg.reference&&raw.length>0&&raw.every(l=>doc.reference?.[l.id]);
  let laps=raw.map(l=>{const ref=doc.reference?.[l.id],t=useReference?ref.trend:trend(l.lap);let status=useReference?ref.status:l.seconds>cfg.pit?'pit':t!==null&&l.seconds-t>cfg.incident?'incident':'clean';if(doc.excluded?.[l.id])status='incident';if(cfg.skipFirst&&l.lap===1)status='filtered';return {...l,trend:t,status,manual:!!doc.excluded?.[l.id]};});
  if(!useReference&&laps.length>=4){const end=laps.at(-1),prev=laps.slice(0,-1).filter(l=>l.status==='clean').slice(-3);if(!end.manual&&end.status!=='pit'&&prev.length===3&&end.seconds>mean(prev.map(l=>l.seconds))+cfg.cooldown)end.status='cooldown';const clean=laps.filter(l=>l.status==='clean');trend=fit(clean);laps=laps.map(l=>({...l,trend:trend(l.lap)}));}
  const clean=laps.filter(l=>l.status==='clean'),inc=laps.filter(l=>l.status==='incident'),bestLaps=laps.filter(l=>!l.manual&&!['pit','cooldown','filtered'].includes(l.status)),best=bestLaps.length?Math.min(...bestLaps.map(l=>l.seconds)):null;
  return {id:person.id,name:person.name,person,laps,useReference,best,clean:clean.length,consistency:sd(clean.filter(l=>l.trend!==null).map(l=>l.seconds-l.trend)),incidents:inc.length,lost:inc.reduce((s,l)=>s+Math.max(0,l.trend===null?0:l.seconds-l.trend),0),gain:null};
 });
 const all=series.flatMap(s=>s.laps),lapMedians=new Map([...new Set(all.map(l=>l.lap))].map(n=>[n,median(all.filter(l=>l.lap===n&&l.status==='clean').map(l=>l.seconds))]));
 for(const s of series){s.pace=mean(s.laps.filter(l=>l.status==='clean'&&lapMedians.get(l.lap)!==null).map(l=>l.seconds-lapMedians.get(l.lap)));const valid=s.laps.filter(l=>l.status!=='cooldown'&&l.trend!==null);s.gain=valid.length?valid[0].trend-valid.at(-1).trend:null;}
 const scale=key=>{const v=series.map(s=>s[key]).filter(Number.isFinite),lo=Math.min(...v),hi=Math.max(...v);return n=>n===null?null:hi===lo?3:half(1+4*(hi-n)/(hi-lo));};
 const cv=series.map(s=>s.consistency).filter(Number.isFinite),cm=median(cv),mad=median(cv.map(v=>Math.abs(v-cm)))*1.4826,bs=scale('best'),ps=scale('pace');
 for(const s of series){s.stars={best:bs(s.best),pace:ps(s.pace),consistency:s.consistency===null?null:clamp(half(mad>1e-9?3+(cm-s.consistency)/mad:3)),incidents:clamp(5-.5*s.incidents)};s.overall=Object.values(s.stars).some(v=>v===null)?null:half(mean(Object.values(s.stars)));}
 const qualifying=series.map(s=>s.best).filter(Number.isFinite),fastest=Math.min(...qualifying);
 for(const s of series){s.balanced=s.overall;s.speedStars=s.best===null?null:s.best-fastest<.0005?5:Math.max(1,5-.5*Math.ceil(Math.max(0,(s.best/fastest-1)*100-1e-9)/2));s.speedRank=s.best===null?null:1+qualifying.filter(t=>t<s.best-.0005).length;if(cfg.mode==='speed')s.overall=s.speedStars;}
 return series;
}
function race(series){
 const usable=series.filter(s=>s.laps.some(l=>l.trend!==null));if(!usable.length||usable.length!==series.length)return {distance:0,rows:[]};
 const distance=Math.min(...usable.map(s=>{const cool=s.laps.find(l=>l.status==='cooldown');return cool?cool.lap-1:Math.max(...s.laps.map(l=>l.lap));}));
 if(distance<1||usable.some(s=>Array.from({length:distance},(_,i)=>i+1).some(n=>!s.laps.some(l=>l.lap===n&&l.trend!==null))))return {distance:0,rows:[]};
 const rows=usable.map(s=>{let total=0;const cumulative=Array.from({length:distance},(_,i)=>{total+=s.laps.find(l=>l.lap===i+1).trend;return total;});return {...s,cumulative,total,gain:s.laps.find(l=>l.lap===1).trend-s.laps.find(l=>l.lap===distance).trend};}).sort((a,b)=>a.total-b.total);
 for(const row of rows)row.gaps=row.cumulative.map((t,i)=>t-Math.min(...rows.map(s=>s.cumulative[i])));
 return {distance,rows};
}
const api={analyze,race,fit,median};if(typeof module!=='undefined')module.exports=api;else root.KartRatings=api;
})(globalThis);
