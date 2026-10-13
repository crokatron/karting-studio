'use strict';
let managedDriver=null,visibleDriverIds=[],selectedDrivers=new Set(),pendingDelete=[];
function renderDriverPanel(){
 const all=S.groups(rawDoc),q=$('search').value.toLowerCase(),repeat=$('repeat').value,decision=$('decisionFilter').value,visibility=$('driverVisibility').value;
 const rows=all.filter(p=>{const n=new Set(rawDoc.entries.filter(e=>S.driverRoot(rawDoc,e.driver)===p.id).map(e=>e.session)).size;return [p.name,...p.aliases].join(' ').toLowerCase().includes(q)&&(repeat==='all'||(repeat==='repeat'?n>1:n===1))&&(decision==='all'||p.decision===decision)&&(visibility==='all'||(visibility==='removed'?p.hidden:!p.hidden));}).sort((a,b)=>a.name.localeCompare(b.name));
 visibleDriverIds=rows.map(p=>p.id);selectedDrivers=new Set([...selectedDrivers].filter(id=>rawDoc.participants.some(p=>p.id===id)).map(id=>S.driverRoot(rawDoc,id)));
 persistDriverEditor();
 $('driverCount').textContent=`${rows.length} driver profiles shown · ${rawDoc.participants.length} original timing names retained`;
 $('driverRows').innerHTML=rows.map(p=>{const ss=rawDoc.sessions.filter(s=>rawDoc.entries.some(e=>S.driverRoot(rawDoc,e.driver)===p.id&&e.session===s.id));return `<tr class="${p.id===managedDriver?'current-driver':''}">${doc.owner?`<td><input type="checkbox" data-select-driver="${p.id}" aria-label="Select ${esc(p.name)}"${selectedDrivers.has(p.id)?' checked':''}></td>`:''}<td><strong>${esc(p.name)}</strong>${p.hidden?'<span class="badge">REMOVED</span>':''}${ss.length>1?'<span class="badge">REPEAT</span>':''}<small class="source-names">${esc(p.aliases.join(' · '))}</small></td><td>${ss.length}</td><td>${esc([...new Set(ss.map(s=>s.venue))].join(' · '))}</td><td>${doc.owner?`<select aria-label="Review ${esc(p.name)}" data-decision="${p.id}">${['Tentative','Keep','Remove'].map(v=>`<option${v===p.decision?' selected':''}>${v}</option>`).join('')}</select>`:esc(p.decision)}</td><td>${doc.owner?`<button data-manage="${p.id}">Manage driver</button><button class="delete-driver" data-delete-driver="${p.id}" aria-label="Delete ${esc(p.name)}">Delete</button>`:''}${!p.hidden?`<button data-history="${p.id}">View history</button>`:''}</td></tr>`;}).join('');
 $('bulkDrivers').hidden=!doc.owner;document.querySelectorAll('.owner-column').forEach(e=>e.hidden=!doc.owner);renderBulkSelection();
 $('driverManager').hidden=!doc.owner||!managedDriver;
 if(managedDriver&&doc.owner)renderManagedDriver();
}
function renderManagedDriver(){
 const id=S.driverRoot(rawDoc,managedDriver),all=S.groups(rawDoc),p=all.find(p=>p.id===id);if(!p){managedDriver=null;$('driverManager').hidden=true;return;}managedDriver=id;persistDriverEditor();
 $('managedName').textContent=p.name;$('actualName').value=driverDrafts.get(id)??p.actualName;$('managedAliases').textContent='Timing names: '+p.aliases.join(' · ');
 $('removeDriver').textContent=p.hidden?'Restore driver':'Remove from analysis';$('removeDriver').dataset.hidden=String(!p.hidden);
 const choices=all.filter(p=>p.id!==id&&!p.hidden).sort((a,b)=>a.name.localeCompare(b.name));options($('mergeTarget'),[['','Choose the profile to keep'],...choices.map(p=>[p.id,p.name+' · '+p.aliases.join(' / ')])],mergeTargets.get(id));
 $('mergePreview').textContent='Choose another profile to see what the merge would combine.';$('mergeDriver').disabled=true;renderMatches();previewMerge();renderAliasCandidates();
 $('splitAliases').innerHTML=p.members.filter(m=>rawDoc.merges?.[m.id]).map(m=>`<p>${esc(m.name)} <button class="secondary" data-unmerge="${m.id}">Separate this alias</button></p>`).join('')||'<p class="hint">No merged aliases in this profile.</p>';
}
function renderMatches(){const matches=S.suggestions(rawDoc,managedDriver,$('actualName').value);$('nameMatches').innerHTML=matches.length?matches.map(p=>`<button class="secondary" data-match="${p.id}">${esc(p.name)} <small>(${Math.round(p.match*100)}% name similarity)</small></button>`).join(''):'<p class="hint">No close name matches. You can still choose a profile below.</p>';}
function previewMerge(){const source=managedDriver,target=$('mergeTarget').value;if(!target){$('mergeDriver').disabled=true;return;}const all=S.groups(rawDoc),a=all.find(p=>p.id===source),b=all.find(p=>p.id===target),sessions=id=>new Set(rawDoc.entries.filter(e=>S.driverRoot(rawDoc,e.driver)===id).map(e=>e.session)),sa=sessions(source),sb=sessions(target),overlap=[...sa].filter(x=>sb.has(x));$('mergePreview').textContent=overlap.length?`Merge blocked: both profiles appear in ${overlap.length} of the same sessions. Review the source before combining different racers.`:`Merge ${a.name} (${a.aliases.join(', ')}) into ${b.name}. Keep ${b.name} as the main profile and combine ${sa.size+sb.size} sessions. All original laps, exclusions and source names are retained. You can separate the alias afterward.`;$('mergeDriver').disabled=!!overlap.length;}
$('driverVisibility').onchange=renderDrivers;
$('driverRows').addEventListener('click',e=>{const b=e.target.closest('[data-manage]');if(b){managedDriver=b.dataset.manage;selectedAliases.clear();$('aliasSearch').value='';$('driverManager').hidden=false;renderDriverPanel();if(innerWidth<1000)$('driverManager').scrollIntoView({behavior:'smooth',block:'start'});}});
$('actualName').oninput=()=>{driverDrafts.set(managedDriver,$('actualName').value);renderMatches();};
$('saveActualName').onclick=()=>save({action:'profile',driver:managedDriver,actualName:$('actualName').value});
$('removeDriver').onclick=()=>save({action:'visibility',driver:managedDriver,hidden:$('removeDriver').dataset.hidden==='true'});
$('mergeTarget').onchange=()=>{mergeTargets.set(managedDriver,$('mergeTarget').value);previewMerge();};
$('nameMatches').onclick=e=>{const b=e.target.closest('[data-match]');if(b){$('mergeTarget').value=b.dataset.match;previewMerge();}};
$('mergeDriver').onclick=async()=>{const target=$('mergeTarget').value;if(await save({action:'merge',driver:managedDriver,target})){managedDriver=target;renderManagedDriver();}};
$('splitAliases').onclick=e=>{const b=e.target.closest('[data-unmerge]');if(b)save({action:'unmerge',driver:b.dataset.unmerge});};

function renderBulkSelection(){
 const hidden=[...selectedDrivers].filter(id=>!visibleDriverIds.includes(id)).length;
 $('selectedCount').textContent=selectedDrivers.size+' selected'+(hidden?` (${hidden} outside this filter)`:'');$('applyBulk').disabled=!selectedDrivers.size||busy;
 $('openBulkMerge').disabled=selectedDrivers.size<2||busy;
 persistDriverEditor();previewBulkMerge();
 document.querySelectorAll('[data-select-driver]').forEach(e=>e.checked=selectedDrivers.has(e.dataset.selectDriver));
 pendingDelete=[];$('deletePreview').hidden=true;
}
$('driverRows').addEventListener('change',e=>{const id=e.target.dataset.selectDriver;if(id){if(e.target.checked)selectedDrivers.add(id);else selectedDrivers.delete(id);renderBulkSelection();}});
$('selectShown').onclick=()=>{visibleDriverIds.forEach(id=>selectedDrivers.add(id));renderBulkSelection();};
$('clearSelected').onclick=()=>{selectedDrivers.clear();renderBulkSelection();};
$('bulkOperation').onchange=renderBulkSelection;
$('applyBulk').onclick=async()=>{
 const drivers=[...selectedDrivers],operation=$('bulkOperation').value;if(!drivers.length)return;
 if(operation==='delete'){previewDriverDeletion(drivers);return;}
 if(await save({action:'bulk-drivers',drivers,operation})){selectedDrivers.clear();renderBulkSelection();}
};
$('cancelDelete').onclick=renderBulkSelection;
$('confirmDelete').onclick=async()=>{const drivers=[...pendingDelete];if(!drivers.length)return;if(await save({action:'bulk-drivers',drivers,operation:'delete',confirmActive:true})){selectedDrivers.clear();managedDriver=null;renderDrivers();}};

$('tentativeOnly').onclick=()=>{$('decisionFilter').value='Tentative';$('driverVisibility').value='active';$('search').value='';$('repeat').value='all';renderDrivers();};
$('allDriverStatuses').onclick=()=>{$('decisionFilter').value='all';renderDrivers();};

function previewDriverDeletion(drivers){
 const ids=new Set(drivers),people=S.groups(rawDoc).filter(p=>ids.has(p.id)),matches=id=>ids.has(S.driverRoot(rawDoc,id));pendingDelete=drivers;
 $('deleteDescription').textContent=`Delete ${people.length} profiles (${people.map(p=>p.name).join(', ')}), ${rawDoc.entries.filter(e=>matches(e.driver)).length} session results and ${rawDoc.laps.filter(l=>matches(l.driver)).length} laps from this portal? Their aliases and analysis will also be deleted. This cannot be undone here; original source workbooks remain archived. Use Remove from analysis instead if you may want to restore them.`;
 $('deletePreview').hidden=false;$('deletePreview').scrollIntoView({behavior:'smooth',block:'center'});
}
$('driverRows').addEventListener('click',e=>{const b=e.target.closest('[data-delete-driver]');if(b)previewDriverDeletion([b.dataset.deleteDriver]);});

const driverDrafts=new Map(),mergeTargets=new Map(),selectedAliases=new Set();
function persistDriverEditor(){if(!doc?.owner)return;try{localStorage.setItem('karting-driver-editor',JSON.stringify({id:managedDriver,selected:[...selectedDrivers],filters:Object.fromEntries(['search','repeat','decisionFilter','driverVisibility'].map(id=>[id,$(id).value]))}));}catch{}}
function restoreDriverEditor(){if(!doc?.owner)return;try{const saved=JSON.parse(localStorage.getItem('karting-driver-editor')||'null');if(!saved)return;managedDriver=rawDoc.participants.some(p=>p.id===saved.id)?S.driverRoot(rawDoc,saved.id):null;selectedDrivers=new Set((Array.isArray(saved.selected)?saved.selected:[]).filter(id=>rawDoc.participants.some(p=>p.id===id)).map(id=>S.driverRoot(rawDoc,id)));for(const id of ['search','repeat','decisionFilter','driverVisibility'])if(typeof saved.filters?.[id]==='string')$(id).value=saved.filters[id];}catch{}}
function renderAliasCandidates(){
 const q=$('aliasSearch').value.toLowerCase(),all=S.groups(rawDoc),target=S.driverRoot(rawDoc,managedDriver),matches=S.suggestions(rawDoc,target,$('actualName').value).map(p=>p.id),choices=all.filter(p=>p.id!==target);
 for(const id of [...selectedAliases])if(!choices.some(p=>p.id===id))selectedAliases.delete(id);
 $('aliasCandidates').innerHTML=choices.filter(p=>[p.name,...p.aliases].join(' ').toLowerCase().includes(q)).sort((a,b)=>Number(matches.includes(b.id))-Number(matches.includes(a.id))||a.name.localeCompare(b.name)).map(p=>`<label class="alias-option"><input type="checkbox" data-alias="${p.id}" ${selectedAliases.has(p.id)?'checked':''}><span><strong>${esc(p.name)}</strong><small>${esc(p.aliases.join(' / '))}${p.hidden?' · removed':''}${matches.includes(p.id)?' · suggested match':''}</small></span></label>`).join('')||'<p>No matching names.</p>';
 const selected=choices.filter(p=>selectedAliases.has(p.id)),groups=[target,...selected.map(p=>p.id)],seen=new Set();let overlap=false;
 for(const id of groups){const sessions=new Set(rawDoc.entries.filter(e=>S.driverRoot(rawDoc,e.driver)===id).map(e=>e.session));for(const sid of sessions){if(seen.has(sid))overlap=true;seen.add(sid);}}
 $('aliasesPreview').textContent=!selected.length?'Tick one or more profiles to combine with the selected driver.':overlap?'Cannot merge this selection: two profiles have results in the same session. Nothing will change.':`Keep ${all.find(p=>p.id===target)?.name} as the main driver. Merge ${selected.map(p=>p.name+' ('+p.aliases.join(' / ')+')').join(', ')} into it, combining ${seen.size} sessions. Each name can be separated afterward.`;
 $('mergeAliases').disabled=!selected.length||overlap||busy;
}
$('aliasSearch').oninput=renderAliasCandidates;
$('aliasCandidates').onchange=e=>{const id=e.target.dataset.alias;if(!id)return;if(e.target.checked)selectedAliases.add(id);else selectedAliases.delete(id);renderAliasCandidates();};
$('mergeAliases').onclick=async()=>{const target=managedDriver,sources=[...selectedAliases];if(await save({action:'merge-many',driver:target,sources})){managedDriver=target;selectedAliases.clear();renderDrivers();}};

function previewBulkMerge(){
 const chosen=S.groups(rawDoc).filter(p=>selectedDrivers.has(p.id)),ids=new Set(chosen.map(p=>p.id)),seen=new Set();let overlap=false;
 for(const p of chosen){const ss=new Set(rawDoc.entries.filter(e=>S.driverRoot(rawDoc,e.driver)===p.id).map(e=>e.session));for(const sid of ss){if(seen.has(sid))overlap=true;seen.add(sid);}}
 const name=$('bulkMergeName').value.trim(),laps=rawDoc.laps.filter(l=>ids.has(S.driverRoot(rawDoc,l.driver))).length;
 $('bulkMergeDescription').textContent=chosen.length<2?'Select at least two driver profiles.':overlap?'Cannot merge: selected profiles have results in the same session. Review those results before combining them.':`${chosen.map(p=>p.name+' ('+p.aliases.join(' / ')+')').join(' + ')} → ${name||'enter a name below'}. Combine ${seen.size} sessions and retain all ${laps} recorded laps, summary results and incident exclusions. Original timing names remain linked for history and future imports. You can separate aliases afterward.${chosen.some(p=>p.hidden)?' Removed source profiles will join the main profile; its current visibility is kept.':''}`;
 $('confirmBulkMerge').disabled=chosen.length<2||overlap||!name||busy;
 return chosen;
}
$('openBulkMerge').onclick=()=>{$('bulkMergePanel').hidden=false;previewBulkMerge();$('bulkMergeName').focus();};
$('bulkMergeName').oninput=previewBulkMerge;
$('cancelBulkMerge').onclick=()=>{$('bulkMergePanel').hidden=true;};
$('confirmBulkMerge').onclick=async()=>{
 const chosen=previewBulkMerge();if($('confirmBulkMerge').disabled)return;
 const target=chosen.find(p=>!p.hidden)?.id||chosen[0].id,name=$('bulkMergeName').value.trim();
 if(await save({action:'merge-many',driver:target,sources:chosen.filter(p=>p.id!==target).map(p=>p.id),actualName:name})){
  managedDriver=target;driverDrafts.delete(target);selectedAliases.clear();selectedDrivers=new Set([target]);$('bulkMergePanel').hidden=true;$('bulkMergeName').value='';renderDrivers();message(`Merged into ${name}. All original timing names and records are retained.`);
 }
};
