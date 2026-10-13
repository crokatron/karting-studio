'use strict';
(()=>{
 const el=id=>document.getElementById(id);let groups=[],busy=false,selected=null;
 const time=s=>`${Math.floor(s/60)}:${(s%60).toFixed(1).padStart(4,'0')}`;
 const node=(tag,text)=>{const n=document.createElement(tag);n.textContent=text;return n;};
 const label=g=>{const o=g.options;return `${o.wet?'Wet':'Dry'} · ${o.tyres} start · ${o.maxSpeed} km/h · power ${Math.round(o.power*100)}% / brakes ${Math.round(o.brakes*100)}% / grip ${Math.round(o.grip*100)}%${g.kind==='race'?` · ${g.laps} lap${g.laps===1?'':'s'}`:''}`;};
 function draw(){const list=groups.filter(g=>g.kind===el('leaderKind').value);el('leaderGroup').replaceChildren();for(const g of list){const o=node('option',label(g));o.value=g.id;el('leaderGroup').append(o);}if(!list.some(g=>g.id===selected))selected=list[0]?.id;el('leaderGroup').value=selected||'';el('leaderGroup').disabled=!list.length;const group=list.find(g=>g.id===selected),rows=group?.entries||[];el('leaderTable').hidden=!rows.length;el('leaderHero').hidden=!rows.length;el('leaderRows').replaceChildren();el('leaderHero').replaceChildren();
  if(!rows.length){el('leaderStatus').textContent='No times yet for this ranking. Set the first one.';return;}
  const fastest=rows[0].seconds,winners=rows.filter(r=>r.rank===1);el('leaderHero').append(node('span',winners.length>1?'JOINT FASTEST':'FASTEST DRIVER'),node('strong',winners.map(r=>r.name+(r.you?' (you)':'')).join(' · ')),node('b',time(fastest)));
  for(const r of rows){const row=document.createElement('tr');if(r.you)row.className='your-time';const duplicate=rows.some(other=>other.driver!==r.driver&&other.name===r.name),name=r.name+(duplicate?' · '+r.driver.slice(0,4):'')+(r.you?' (you)':'');for(const value of [r.rank,name,time(r.seconds),r.rank===1?'—':'+'+(r.seconds-fastest).toFixed(1),new Date(r.at).toLocaleDateString()])row.append(node('td',value));el('leaderRows').append(row);}
  el('leaderStatus').textContent=`${rows.length} driver${rows.length===1?'':'s'} · best time each · saved on the NAS`;
 }
 async function load(){if(busy)return;busy=true;el('refreshLeaderboard').disabled=true;el('leaderStatus').textContent='Loading saved times…';try{const r=await fetch('api/leaderboard',{cache:'no-store'});if(!(r.headers.get('Content-Type')||'').includes('application/json'))throw Error('Sign in again to view rankings.');const value=await r.json();if(!r.ok)throw Error(value.error||'Rankings are unavailable.');groups=value.groups;draw();}catch(e){el('leaderStatus').textContent=e.message+' Use Refresh times to retry.';}finally{busy=false;el('refreshLeaderboard').disabled=false;}}
 el('refreshLeaderboard').onclick=load;el('leaderKind').onchange=()=>{selected=null;draw();};el('leaderGroup').onchange=()=>{selected=el('leaderGroup').value;draw();};el('leaderTrial').onclick=()=>{showTab('play');el('raceDetails').open=true;el('driverName').focus();};
 window.addEventListener('yas-tab',e=>{if(e.detail==='leaderboard')load();});window.addEventListener('yas-result',()=>{if(document.body.dataset.tab==='leaderboard')load();});
 if(location.hash==='#leaderboard')showTab('leaderboard');
})();
