'use strict';
let ratingSeries=[],ratingSelected=new Set(),ratingSessionId=null,ratingSort='overall',ratingDirection=1,raceView='trend',ratingProjection={distance:0,rows:[]};
const ratingPalette=['#d5f68a','#78c9ed','#ffb775','#c1a1ff','#f79bd3','#68dbc0','#ff7d7d','#d6c185','#aabfff','#e2ecb1'];
function ratingColor(id){let n=0;for(const c of id)n=(n*31+c.charCodeAt(0))>>>0;return ratingPalette[n%ratingPalette.length];}
function ratingSettings(){return {mode:$('ratingMode').value,pit:Math.max(30,Math.min(600,Number($('pitThreshold').value)||120)),incident:Math.max(1,Math.min(60,Number($('incidentThreshold').value)||5)),cooldown:Math.max(0,Math.min(30,Number($('cooldownThreshold').value)||0)),reference:$('trendMethod').value==='reference',scope:$('ratingScope').value,skipFirst:$('skipFirst').checked};}
function renderRatings(){
 options($('ratingVenue'),[...new Set(doc.sessions.map(s=>s.venue))].sort().map(v=>[v,v]),$('venue').value);
 options($('ratingSession'),doc.sessions.filter(s=>s.venue===$('venue').value).sort((a,b)=>b.date.localeCompare(a.date)||a.name.localeCompare(b.name)).map(s=>[s.id,s.date+' · '+s.name]),$('session').value);
 const sid=$('session').value,changed=ratingSessionId!==sid,hasRef=doc.laps.some(l=>l.session===sid&&doc.reference?.[l.id]);
 if(changed){$('ratingMode').value=$('venue').value==='Yas Kartzone'?'speed':'balanced';ratingSort=$('venue').value==='Yas Kartzone'?'best':'overall';ratingDirection=1;$('ratingScope').value=hasRef&&$('analysisStatus').value==='all'?'reference':'all';$('chartCap').value=$('venue').value==='Yas Kartzone'?'80':'140';}
 ratingSeries=KartRatings.analyze(analysisDoc(),sid,ratingSettings());
 if(changed){ratingSelected=new Set(ratingSeries.map(s=>s.id));ratingSessionId=sid;}else ratingSelected=new Set([...ratingSelected].filter(id=>ratingSeries.some(s=>s.id===id)));
 const fastest=ratingSeries.filter(s=>s.best!==null).sort((a,b)=>a.best-b.best)[0];
 const lead=ratingSeries.filter(s=>s.overall!==null).sort((a,b)=>b.overall-a.overall||a.best-b.best)[0],provided=ratingSeries.filter(s=>s.useReference).length;
 $('ratingsTakeaway').textContent=session()?.timingDetail==='summary'?'Summary timing sheet: best and second-best times are shown in the leaderboard. Full lap lists were not supplied, so consistency ratings and race projections are unavailable.':session()?.venue==='Yas Kartzone'&&fastest?`${fastest.name} leads this comparison group on fastest lap: ${S.format(fastest.best)}. Fastest lap decides these sessions; consistency and overall stars are context only. Slower experimental laps do not outweigh a faster valid best.`:lead?`${lead.name} leads this comparison group on ${lead.overall} / 5 stars. ${provided} supplied fits; ${ratingSeries.length-provided} recalculated. ${$('skipFirst').checked?'Lap 1 is filtered. ':''}Scores are relative to this group, not a universal driver rating.`:'No rated laps in this group. Choose All active drivers or another session.';
 renderRatingRows();renderRatingCharts();
}
function ratingNumber(v,d=3){return Number.isFinite(v)?v.toFixed(d):'—';}
function starCell(value,stars){return `<strong>${value}</strong><small class="stars">${stars===null?'Insufficient data':stars.toFixed(1)+' / 5 ★'}</small>`;}
function renderRatingRows(){const speed=$('ratingMode').value==='speed';$('starHeading').textContent=speed?'Peak-speed stars ↕':'Balanced stars ↕';
 const rows=[...ratingSeries].sort((a,b)=>{const av=a[ratingSort],bv=b[ratingSort];if(av===null)return bv===null?0:1;if(bv===null)return -1;return ((ratingSort==='overall'?bv-av:av-bv)||a.name.localeCompare(b.name))*ratingDirection;});
 $('ratingsRows').innerHTML=rows.map(s=>`<tr class="${ratingSelected.has(s.id)?'selected-driver':'muted-driver'}" data-rating-row="${s.id}"><td><label class="check"><input type="checkbox" data-rating-driver="${s.id}" aria-label="Show ${esc(s.name)} on charts" ${ratingSelected.has(s.id)?'checked':''}><span class="dot" style="background:${ratingColor(s.id)}"></span>${esc(s.name)}</label><small class="source-names">${s.clean} clean laps · ${s.useReference?'supplied fit':'estimated fit'}</small></td><td>${starCell(S.format(s.best),speed?s.speedStars:s.stars.best)}</td><td>${starCell((s.pace>0?'+':'')+ratingNumber(s.pace,2)+' s/lap',s.stars.pace)}</td><td>${starCell(ratingNumber(s.consistency,2)+' s',s.stars.consistency)}</td><td>${starCell(s.incidents+' flagged',s.stars.incidents)}<small class="source-names">~${ratingNumber(s.lost,1)} s estimated loss</small></td><td><strong class="total-stars">${s.overall===null?'—':s.overall.toFixed(1)+' ★'}</strong>${speed&&s.speedRank?`<small class="source-names">Best-lap rank #${s.speedRank}</small>`:''}</td></tr>`).join('');
 document.querySelectorAll('[data-sort]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.sort===ratingSort)));
}
function renderRatingCharts(){
 const selected=ratingSeries.filter(s=>ratingSelected.has(s.id));$('ratingsSelection').textContent=`${selected.length} of ${ratingSeries.length} shown on charts`;
 const maxLap=Math.max(1,...selected.flatMap(s=>s.laps.map(l=>l.lap)));$('inspectLap').max=maxLap;$('inspectLap').value=Math.min(maxLap,Number($('inspectLap').value)||1);
 ratingProjection=KartRatings.race(selected);renderPlot('ratingsLapChart',selected,'raw');
 renderPlot('ratingsRaceChart',raceView==='race'?ratingProjection.rows:selected,raceView);
 $('projectedResults').innerHTML=ratingProjection.rows.map((s,i)=>`<tr><td>${i+1}</td><td><span class="dot" style="background:${ratingColor(s.id)}"></span>${esc(s.name)}</td><td>${S.format(s.total)}</td><td>${i?'+'+ratingNumber(s.total-ratingProjection.rows[0].total,1)+' s':'—'}</td><td>${s.gain>=0?'−':'+'}${ratingNumber(Math.abs(s.gain),1)} s</td></tr>`).join('');
 $('raceDistance').textContent=ratingProjection.distance?`${ratingProjection.distance} projected laps · equal start assumed · gain is the first-to-last trend change over this distance.`:'Select drivers with a common consecutive lap range and enough clean data for a projection.';
 $('showTrends').setAttribute('aria-pressed',String(raceView==='trend'));$('showRaceGaps').setAttribute('aria-pressed',String(raceView==='race'));$('showTrendLaps').closest('label').hidden=raceView==='race';inspectRatingsLap(Number($('inspectLap').value));
}
function renderPlot(id,series,mode){
 const box=$(id);if(!series.length){box.innerHTML='<p class="hint chart-empty">Select a driver to see the chart.</p>';return;}
 const w=Math.max(320,box.clientWidth-18),h=340,left=55,right=18,top=30,bottom=38,cap=Math.max(30,Math.min(600,Number($('chartCap').value)||80));
 const raw=series.flatMap(s=>s.laps),maxLap=mode==='race'?ratingProjection.distance:Math.max(1,...raw.map(l=>l.lap)),vals=mode==='race'?series.flatMap(s=>s.gaps):mode==='trend'?raw.filter(l=>l.trend!==null).map(l=>l.trend):raw.map(l=>l.seconds);
 if(!vals.length){box.innerHTML='<p class="hint chart-empty">Not enough clean laps for a fitted trend.</p>';return;}
 const lo=mode==='race'?0:Math.min(cap-2,Math.floor(Math.min(...vals))-1),hi=mode==='race'?Math.max(1,Math.ceil(Math.max(...vals))):cap,x=n=>left+(n-1)/Math.max(1,maxLap-1)*(w-left-right),y=n=>top+(hi-Math.min(hi,Math.max(lo,n)))/(hi-lo)*(h-top-bottom);
 let out=`<svg viewBox="0 0 ${w} ${h}" role="img" aria-label="${mode==='raw'?'Multi-driver lap times':mode==='trend'?'Driver trend lines':'Projected race gaps'}"><title>Tap or drag to compare laps. Use the Inspect lap slider for keyboard access.</title>`;
 for(let i=0;i<=4;i++){const v=lo+(hi-lo)*i/4;out+=`<path d="M${left} ${y(v)}H${w-right}" stroke="#304537"/><text x="${left-7}" y="${y(v)+4}" text-anchor="end">${v.toFixed(0)}s</text>`;}
 for(let n=1;n<=maxLap;n+=Math.max(1,Math.ceil(maxLap/8)))out+=`<text x="${x(n)}" y="${h-14}" text-anchor="middle">${n}</text>`;
 for(const s of series){const c=ratingColor(s.id),points=mode==='race'?s.gaps.map((v,i)=>({lap:i+1,value:v})):s.laps.map(l=>({...l,value:mode==='trend'?l.trend:l.seconds})).filter(l=>l.value!==null);let last=null;const line=points.map(p=>{const cmd=last!==null&&p.lap===last+1?'L':'M';last=p.lap;return cmd+x(p.lap)+' '+y(p.value);}).join(' ');out+=`<path d="${line}" fill="none" stroke="${c}" stroke-width="2" stroke-linejoin="round"/>`;
  if(mode==='raw'||(mode==='trend'&&$('showTrendLaps').checked))for(const l of s.laps){const xx=x(l.lap),yy=y(l.seconds),grey=['pit','cooldown','filtered'].includes(l.status),color=grey?'#829184':c,title=esc(s.name)+' · lap '+l.lap+' · '+S.format(l.seconds)+' · '+l.status+(l.manual?' (saved exclusion)':'');
   if(l.seconds>hi)out+=`<path d="M${xx} ${top-12}l-4 7h8z" fill="${color}"><title>${title}</title></path>`;
   else if(mode==='raw'&&l.seconds===s.best)out+=`<text x="${xx}" y="${yy+5}" fill="${c}" class="best-marker" text-anchor="middle">★<title>${title}</title></text>`;
   else out+=`<circle cx="${xx}" cy="${yy}" r="${l.status==='incident'?4:2.5}" fill="${l.status==='incident'?'#101d16':color}" stroke="${color}" stroke-width="1.5"><title>${title}</title></circle>`;
  }
 }
 out+='</svg>';box.innerHTML=out;box.onpointerdown=box.onpointermove=e=>{if(e.type==='pointermove'&&e.pointerType!=='mouse'&&!e.buttons)return;const b=box.querySelector('svg').getBoundingClientRect(),n=Math.round(1+((e.clientX-b.left)*w/b.width-left)/(w-left-right)*Math.max(1,maxLap-1));inspectRatingsLap(Math.max(1,Math.min(maxLap,n)));};
}
function inspectRatingsLap(n){$('inspectLap').value=n;const selected=ratingSeries.filter(s=>ratingSelected.has(s.id));$('ratingsLapReadout').innerHTML=`<b>Lap ${n}</b>`+selected.map(s=>{const l=s.laps.find(l=>l.lap===n);return `<span><i class="dot" style="background:${ratingColor(s.id)}"></i>${esc(s.name)}: <b>${S.format(l?.seconds)}</b>${l?' · '+esc(l.status)+(l.manual?' · saved exclusion':''):''}</span>`;}).join('');$('raceReadout').innerHTML=`<b>${raceView==='race'?'After lap':'Trend at lap'} ${n}</b>`+(raceView==='race'?ratingProjection.rows:selected).map(s=>{const v=raceView==='race'?s.gaps[n-1]:s.laps.find(l=>l.lap===n)?.trend;return `<span><i class="dot" style="background:${ratingColor(s.id)}"></i>${esc(s.name)}: <b>${raceView==='race'?(v===undefined?'—':'+'+v.toFixed(2)+' s'):S.format(v)}</b></span>`;}).join('');}
$('ratingVenue').onchange=()=>{$('venue').value=$('ratingVenue').value;sessionOptions();ratingSessionId=null;renderRatings();};
$('ratingSession').onchange=()=>{$('session').value=$('ratingSession').value;renderSession();renderRatings();};
$('ratingScope').onchange=()=>{renderRatings();ratingSelected=new Set(ratingSeries.map(s=>s.id));renderRatingRows();renderRatingCharts();};
['pitThreshold','incidentThreshold','cooldownThreshold','trendMethod','ratingMode'].forEach(id=>$(id).onchange=renderRatings);
$('chartCap').onchange=renderRatingCharts;$('showTrendLaps').onchange=renderRatingCharts;$('inspectLap').oninput=()=>inspectRatingsLap(Number($('inspectLap').value));
$('ratingsAll').onclick=()=>{ratingSelected=new Set(ratingSeries.map(s=>s.id));renderRatingRows();renderRatingCharts();};$('ratingsNone').onclick=()=>{ratingSelected.clear();renderRatingRows();renderRatingCharts();};
$('ratingsRows').onchange=e=>{const b=e.target.closest('[data-rating-driver]');if(b){b.checked?ratingSelected.add(b.dataset.ratingDriver):ratingSelected.delete(b.dataset.ratingDriver);renderRatingRows();renderRatingCharts();}};
$('ratingsRows').onclick=e=>{if(e.target.closest('input,label'))return;const r=e.target.closest('[data-rating-row]');if(r){const id=r.dataset.ratingRow;ratingSelected.has(id)?ratingSelected.delete(id):ratingSelected.add(id);renderRatingRows();renderRatingCharts();}};
document.querySelectorAll('[data-sort]').forEach(b=>b.onclick=()=>{ratingDirection=ratingSort===b.dataset.sort?-ratingDirection:1;ratingSort=b.dataset.sort;renderRatingRows();});
$('showTrends').onclick=()=>{raceView='trend';renderRatingCharts();};$('showRaceGaps').onclick=()=>{raceView='race';renderRatingCharts();};
document.querySelector('nav').addEventListener('click',e=>{if(e.target.closest('[data-tab="ratings"]'))renderRatings();});
let ratingResize;addEventListener('resize',()=>{clearTimeout(ratingResize);ratingResize=setTimeout(()=>{if(doc&&!$('ratings').hidden)renderRatingCharts();},150);});
