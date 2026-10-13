'use strict';
(()=>{
 const el=id=>document.getElementById(id),RULES='paddock-2026-10-v2';
 let room=null,busy=false,timer=null,lastOK=0,offset=0,epoch=null,autoStarted=false,previous=[],receivedAt=0,reconnecting=false;
 let clientId;try{clientId=sessionStorage.getItem('yas-client')||crypto.randomUUID();sessionStorage.setItem('yas-client',clientId);}catch{clientId=crypto.randomUUID();}
 const say=text=>el('raceStatus').textContent=text;
 const time=t=>`${Math.floor(t/60)}:${(t%60).toFixed(1).padStart(4,'0')}`;
 const sim=()=>window.YasSimulator;
 const accepted=()=>{if(!el('acceptRules').checked){el('paddockRules').open=true;throw Error('Read the Paddock Rules and tick the box before joining.');}};
 function lock(on){for(const id of ['simPower','simMaxSpeed','simBrakes','simBaseGrip','simSurface','simStartTyres','resetDrive'])el(id).disabled=on;el('joinFields').hidden=on;el('joinActions').hidden=on;el('roomActions').hidden=!on;el('raceHUD').hidden=!on;el('acceptRules').disabled=on;el('copyRoom').hidden=!!room?.trial;}
 function saveRoom(){try{if(room)sessionStorage.setItem('yas-room',JSON.stringify({code:room.code,name:el('driverName').value,rules:RULES}));else sessionStorage.removeItem('yas-room');}catch{}}
 function leaveLocal(message){clearTimeout(timer);room=null;epoch=null;autoStarted=false;lock(false);saveRoom();el('hostActions').hidden=true;el('roomBadge').textContent='· private rooms · up to 8 drivers';el('raceDetails').open=true;sim()?.pause(message);say(message);}
 async function request(action,extra={}){
  const response=await fetch('api/room',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({action,clientId,code:room?.code,epoch:room?.epoch,...extra}),signal:AbortSignal.timeout(5000)});
  let value;try{value=await response.json();}catch{throw Error('Sign-in may have expired. Sign in again and rejoin.');}
  if(!response.ok){const e=Error(value.error||'The NAS could not complete that action.');e.status=response.status;throw e;}return value;
 }
 function apply(value){
  if(value.left){leaveLocal('You left the room. Solo practice is ready.');return;}
  const was=room;previous=peers();room=value;receivedAt=performance.now();lastOK=performance.now();offset=value.serverTime*1000-Date.now();
  const mine=room.players.find(p=>p.id===room.you);if(!mine){leaveLocal('You are no longer in this room.');return;}
  if(epoch!==room.epoch||!was){epoch=room.epoch;autoStarted=false;sim().setRace(room.options,mine.pose);}
  else if(value.resync||reconnecting){sim().setPose(mine.pose);}
  reconnecting=false;lock(true);saveRoom();el('roomBadge').textContent=room.trial?'· timed solo run':`· ${room.code} · ${room.players.length}/8 drivers`;
  el('hostActions').hidden=!room.canControl;el('startRace').disabled=room.phase!=='waiting'||room.players.length<(room.trial?1:2);el('weatherVeto').textContent=room.options.wet?'Weather veto: make it dry':'Weather veto: summon rain';
  el('roomSettings').textContent=`${room.raceLaps} laps · ${room.options.wet?'Wet':'Dry'} · ${room.options.tyres} tyres · ${room.options.maxSpeed} km/h · shared power, grip and brakes. Leaving as host ends the room.`;
  // Build controls only when the roster changes so polling never steals focus.
  const roster=JSON.stringify(room.players.map(p=>[p.id,p.name,p.color,p.isHost]));
  if(el('roomDrivers').dataset.roster!==roster){el('roomDrivers').dataset.roster=roster;el('roomDrivers').replaceChildren();for(const p of room.players){const row=document.createElement('div'),label=document.createElement('span');row.className='driver';label.textContent=`● ${p.name}${p.id===room.you?' (you)':''}${p.isHost?' · host':''}`;label.style.color=p.color;row.append(label);if(room.canControl&&p.id!==room.you){const b=document.createElement('button');b.textContent='Pit-lane timeout';b.onclick=()=>{if(confirm(`Remove ${p.name} from this room?`))act('kick',{target:p.id});};row.append(b);}el('roomDrivers').append(row);}}
  if(room.phase==='waiting')say(room.trial?'Timed solo run ready. Start the countdown to set a leaderboard time.':'Share the invite link. The host starts when everyone is here.');
  else if(room.phase==='finished')say('Race complete. Brag responsibly. The host can decree a rematch.');
  else say('Connected · live positions · no kart-to-kart contact.');
  if(mine.finished!==null){sim().pause('Finished! The other drivers can keep racing.');}
  if(room.leaderboardWarning)say(room.leaderboardWarning);
  const prior=was?.players.find(p=>p.id===room.you);if(mine.laps>(prior?.laps||0))window.dispatchEvent(new Event('yas-result'));
  updateHUD();
 }
 async function act(action,extra={}){
  if(busy)return;busy=true;try{
   if(!sim())throw Error('Wait for the track to finish loading.');
   if(action==='create'||action==='join'){accepted();const name=el('driverName').value.trim();if(!name)throw Error('Choose your driver nickname.');extra={...extra,name,rules:RULES};}
   const value=await request(action,extra);apply(value);if(room){clearTimeout(timer);timer=setTimeout(poll,200);}
  }catch(e){say(e.message);if(room&&(e.status===403||e.status===404))leaveLocal(e.message);}finally{busy=false;}
 }
 async function poll(){
  if(!room)return;if(busy){timer=setTimeout(poll,200);return;}
  busy=true;try{const s=sim().getState(),pose=Object.fromEntries(['x','y','angle','speed','steer'].map(k=>[k,s[k]]));apply(await request('sync',{pose}));}
  catch(e){reconnecting=true;sim().pause('Connection interrupted — waiting for the room.');say('Connection interrupted. Reconnecting… '+e.message);if(e.status===403||e.status===404||e.status===401)leaveLocal(e.message);}
  finally{busy=false;if(room)timer=setTimeout(poll,200);}
 }
 function peers(){if(!room||performance.now()-lastOK>2500)return[];const t=Math.min(1,(performance.now()-receivedAt)/200);return room.players.filter(p=>p.id!==room.you&&p.connected).map(p=>{const old=previous.find(x=>x.id===p.id),pose=p.pose;if(!old)return{...pose,id:p.id,name:p.name,color:p.color};let a=pose.angle-old.angle;a=Math.atan2(Math.sin(a),Math.cos(a));return{...pose,x:old.x+(pose.x-old.x)*t,y:old.y+(pose.y-old.y)*t,angle:old.angle+a*t,id:p.id,name:p.name,color:p.color};});}
 function canDrive(){if(!room)return true;const mine=room.players.find(p=>p.id===room.you);return performance.now()-lastOK<2500&&room.startAt!==null&&(Date.now()+offset)/1000>=room.startAt&&mine?.finished===null&&room.phase!=='finished';}
 function updateHUD(){if(!room)return;const now=(Date.now()+offset)/1000,mine=room.players.find(p=>p.id===room.you),count=room.startAt?Math.ceil(room.startAt-now):null;
  el('raceClock').textContent=room.phase==='waiting'?`Room ${room.code} · waiting`:count>0?`Grid countdown · ${count}`:mine.finished!==null?`Finished · ${time(mine.finished)}`:`Race · ${time(Math.max(0,now-room.startAt))}`;
  el('raceStanding').textContent=room.players.map((p,i)=>`${i+1}. ${p.name} ${p.finished!==null?`🏁 ${time(p.finished)}`:`${p.laps}/${room.raceLaps}`}${p.connected?'':' (offline)'}`).join(' · ');
  if(!autoStarted&&room.startAt!==null&&count<=0&&canDrive()){autoStarted=true;el('raceDetails').open=false;showTab('play');sim().resume();}
  if(performance.now()-lastOK>2500&&sim().getState().running)sim().pause('Connection interrupted — reconnecting.');
 }
 el('createRoom').onclick=()=>act('create',{options:sim()?.getState().options,laps:+el('raceLaps').value});
 el('startTrial').onclick=async()=>{await act('create',{trial:true,options:sim()?.getState().options,laps:+el('raceLaps').value});if(room?.trial&&room.phase==='waiting')await act('start');};
 el('joinRoom').onclick=()=>act('join',{code:el('roomCode').value.trim().toUpperCase()});
 el('startRace').onclick=()=>act('start');el('leaveRoom').onclick=()=>{if(room?.canControl&&!confirm('Leave this room? If you are the host, this ends it for everyone.'))return;act('leave');};
 el('rematchRace').onclick=()=>{if(confirm('Reset this race and bring everyone back to the grid?'))act('rematch');};
 el('weatherVeto').onclick=()=>{if(confirm('Change the weather and reset everyone to the grid?'))act('weather',{wet:!room.options.wet});};
 el('endRace').onclick=()=>{if(confirm('End this room for everyone?'))act('end');};
 el('copyRoom').onclick=async()=>{const url=new URL(location.href);url.hash='room='+room.code;try{await navigator.clipboard.writeText(url.href);say('Invite link copied. Only people with Yas access can join.');}catch{say('Share this link: '+url.href);}};
 window.YasMultiplayer={active:()=>!!room,canDrive,peers,recover:async()=>{if(busy)return;await act('recover');if(room){const mine=room.players.find(p=>p.id===room.you);sim().setPose(mine.pose);}},getRoom:()=>room};
 fetch('api/session').then(r=>r.ok?r.json():null).then(data=>{if(data?.owner){el('friendsManager').hidden=false;el('friendsInline').hidden=false;el('friendsFallback').hidden=true;}}).catch(()=>{});
 const invited=new URLSearchParams(location.hash.slice(1)).get('room');if(invited&&/^[A-Z2-9]{8}$/.test(invited)){el('roomCode').value=invited;el('raceDetails').open=true;}
 let saved;try{saved=JSON.parse(sessionStorage.getItem('yas-room')||'null');}catch{}
 if(saved?.rules===RULES){el('driverName').value=saved.name;el('roomCode').value=saved.code;el('acceptRules').checked=true;const restore=setInterval(()=>{if(sim()){clearInterval(restore);act('join',{code:saved.code});}},150);}
 setInterval(updateHUD,100);
})();
