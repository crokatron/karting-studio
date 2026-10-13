(function(root){
'use strict';
function metrics(laps){const t=laps.map(l=>l.seconds).filter(Number.isFinite).sort((a,b)=>a-b),n=t.length;if(!n)return {count:0,best:null,mean:null,median:null,spread:null,sd:null};const mean=t.reduce((a,b)=>a+b,0)/n;return {count:n,best:t[0],mean,median:n%2?t[(n-1)/2]:(t[n/2-1]+t[n/2])/2,spread:t[n-1]-t[0],sd:Math.sqrt(t.reduce((s,v)=>s+(v-mean)**2,0)/n)};}
function format(s){if(s==null||!Number.isFinite(s))return '—';const ms=Math.round(s*1000),m=Math.floor(ms/60000);return m+':'+((ms%60000)/1000).toFixed(3).padStart(6,'0');}
function seconds(s){return s==null?'—':s.toFixed(3)+' s';}
function appearances(doc,id){return new Set(doc.entries.filter(e=>e.driver===id).map(e=>e.session)).size;}
function included(doc,l,skip=false){return !doc.excluded?.[l.id]&&(!skip||l.lap>1);}
function sessionRows(doc,id,skip=false){return doc.entries.filter(e=>e.session===id).map(e=>({...e,person:doc.participants.find(p=>p.id===e.driver),...metrics(doc.laps.filter(l=>l.session===id&&l.driver===e.driver&&included(doc,l,skip)))})).sort((a,b)=>(a.best??Infinity)-(b.best??Infinity)||(a.person?.name||'').localeCompare(b.person?.name||''));}
function csvCell(v){let s=String(v??'');if(/^[\s]*[=+@-]/.test(s)||/^[\t\r]/.test(s))s="'"+s;return '"'+s.replaceAll('"','""')+'"';}
function driverRoot(doc,id){const seen=new Set();while(doc.merges?.[id]){if(seen.has(id))throw Error('Invalid driver merge');seen.add(id);id=doc.merges[id];}return id;}
function groups(doc){return doc.participants.filter(p=>driverRoot(doc,p.id)===p.id).map(p=>{const members=doc.participants.filter(a=>driverRoot(doc,a.id)===p.id),profile=doc.profiles?.[p.id]||{};return {...p,decision:p.decision==='Review'?'Tentative':p.decision,name:profile.actualName||p.name,actualName:profile.actualName||'',hidden:!!profile.hidden,members,aliases:members.map(m=>m.name)};});}
function view(doc){const participants=groups(doc).filter(p=>!p.hidden),ids=new Set(participants.map(p=>p.id));return {...doc,participants,entries:doc.entries.map(e=>({...e,sourceDriver:e.driver,driver:driverRoot(doc,e.driver)})).filter(e=>ids.has(e.driver)),laps:doc.laps.map(l=>({...l,sourceDriver:l.driver,driver:driverRoot(doc,l.driver)})).filter(l=>ids.has(l.driver))};}
function normalized(name){return name.normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[^a-z0-9]+/g,' ').trim();}
function similarity(a,b){a=normalized(a);b=normalized(b);if(!a||!b)return 0;if(a===b)return 1;const tokens=a.split(' '),other=b.split(' '),common=tokens.filter(t=>other.includes(t)).length;let prev=Array.from({length:b.length+1},(_,i)=>i);for(let i=1;i<=a.length;i++){const next=[i];for(let j=1;j<=b.length;j++)next[j]=Math.min(next[j-1]+1,prev[j]+1,prev[j-1]+(a[i-1]===b[j-1]?0:1));prev=next;}return Math.max(1-prev[b.length]/Math.max(a.length,b.length),common/(new Set([...tokens,...other]).size));}
function suggestions(doc,id,name){const all=groups(doc),p=all.find(p=>p.id===id);if(!p)return [];const mine=[name||p.actualName,...p.aliases].filter(Boolean);return all.filter(p=>p.id!==id&&!p.hidden).map(p=>({...p,match:Math.max(...mine.flatMap(a=>[p.actualName,...p.aliases].filter(Boolean).map(b=>similarity(a,b))))})).filter(p=>p.match>=.45).sort((a,b)=>b.match-a.match).slice(0,6);}
function headToHead(doc,a,b,skip=false){
 if(!a||!b||a===b)return [];
 return doc.sessions.filter(s=>[a,b].every(id=>doc.entries.some(e=>e.driver===id&&e.session===s.id))).sort((a,b)=>b.date.localeCompare(a.date)||a.name.localeCompare(b.name)).map(session=>{
  const drivers=[a,b].map(id=>{const entry=doc.entries.find(e=>e.driver===id&&e.session===session.id),laps=doc.laps.filter(l=>l.driver===id&&l.session===session.id&&included(doc,l,skip)).sort((a,b)=>a.lap-b.lap),m=metrics(laps),fast=[...laps].sort((a,b)=>a.seconds-b.seconds).slice(0,5);return {id,laps,...m,best:session.timingDetail==='summary'?entry.reportedBest:m.best,fastestFive:fast.length===5?metrics(fast).mean:null};});
  const last=Math.min(...drivers.map(d=>Math.max(0,...d.laps.map(l=>l.lap)))),window=Array.from({length:5},(_,i)=>last-4+i);
  const late=drivers.map(d=>window.map(n=>d.laps.find(l=>l.lap===n)));
  return {session,drivers,lateStart:last-4,lateEnd:last,lateMeans:late.every(ls=>ls.every(Boolean))?late.map(ls=>metrics(ls).mean):null};
 });
}
const api={metrics,format,seconds,appearances,sessionRows,csvCell,included,driverRoot,groups,view,suggestions,headToHead};if(typeof module!=='undefined')module.exports=api;else root.KartStats=api;
})(globalThis);
