'use strict';
const $=id=>document.getElementById(id), escapeHtml=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
let db,session,org='',players=[],metrics=[],evaluations=[],plans=[];
const defaults=[['Offense','Hitting Mechanics','Stance, balance, load and swing path'],['Offense','Contact / Barrel Control','Consistent quality contact'],['Offense','Plate Discipline','Strike-zone awareness and pitch selection'],['Offense','Situational Hitting','Approach with runners and outs'],['Offense','Baserunning','Reads, leads, turns and decisions'],['Offense','Bunting','Technique and execution'],['Defense','Fielding Fundamentals','Ready position, hands and footwork'],['Defense','Throwing Accuracy','Target accuracy and consistency'],['Defense','Arm Strength','Carry and mechanics'],['Defense','Range / First Step','Reaction and ability to cover ground'],['Defense','Baseball IQ','Anticipation, positioning and decisions'],['Defense','Communication','Talks and directs teammates'],['Defense','Position-Specific Skills','Execution of primary position responsibilities'],['Character','Attitude','Coachability, response to adversity and respect'],['Character','Effort','Hustle, preparation and consistent work'],['Character','Body Language','Positive, engaged demeanor'],['Character','Leadership','Encouragement and accountability'],['Character','Focus','Attention and practice habits']];
function message(s){const n=$('status');n.textContent=s;n.style.display='block';clearTimeout(window._notice);window._notice=setTimeout(()=>n.style.display='none',4200)}
function error(e){console.error(e);message('Error: '+(e.message||e))}
function visible(id){for(const v of ['configPanel','authPanel','orgPanel','app'])$(v).classList.toggle('hide',v!==id)}
function check(r){if(r.error)throw r.error;return r.data}
function setTab(tab){document.querySelectorAll('#app section').forEach(e=>e.classList.toggle('hide',e.id!==tab));document.querySelectorAll('[data-tab]').forEach(b=>b.classList.toggle('active',b.dataset.tab===tab));if(tab==='progress'){renderProgress();renderSavedEvaluations();renderCompleteActions();}if(tab==='plans')renderPlans();if(tab==='library')renderLibrary()}
function initDb(url,key){db=supabase.createClient(url,key,{auth:{persistSession:true,autoRefreshToken:true}})}
async function connect(){try{const url=$('projectUrl').value.trim(),key=$('anonKey').value.trim();if(!/^https:\/\/.+\.supabase\.co\/?$/.test(url)||!key)throw Error('Enter a valid Supabase URL and public key.');initDb(url,key);localStorage.setItem('playerdev_config',JSON.stringify({url,key}));await restore()}catch(e){error(e)}}
async function restore(){try{const {data:{session:s},error:e}=await db.auth.getSession();if(e)throw e;session=s;if(!s){visible('authPanel');return} $('who').textContent=s.user.email;$('logout').classList.remove('hide');org=localStorage.getItem('playerdev_org')||'';if(!org){visible('orgPanel');return}await loadAll();visible('app')}catch(e){error(e);visible('authPanel')}}
async function loadAll(){const [a,b,c,d]=await Promise.all([db.from('pd_players').select('*').eq('org',org).order('last_name'),db.from('pd_metrics').select('*').eq('org',org).order('category').order('name'),db.from('pd_evaluations').select('*').eq('org',org).order('evaluated_at'),db.from('pd_plans').select('*').eq('org',org).order('created_at',{ascending:false})]);players=check(a)||[];metrics=check(b)||[];evaluations=check(c)||[];plans=check(d)||[];if(!metrics.length){const rows=defaults.map(([category,name,description])=>({org,category,name,description,active:true}));check(await db.from('pd_metrics').insert(rows));metrics=check(await db.from('pd_metrics').select('*').eq('org',org).order('category').order('name'))}renderAll()}
function cleanName(s){return String(s??'').normalize('NFKC').replace(/[\uFFFD\u00A0\u2000-\u200D\uFEFF]/g,' ').replace(/\s+/g,' ').trim()}
function fullName(p){return `${p.first_name} ${p.last_name}`}
function options(id){const previous=$(id).value;$(id).innerHTML='<option value="">Choose player...</option>'+players.map(p=>`<option value="${p.id}">${escapeHtml(fullName(p))} — ${escapeHtml(p.team)}</option>`).join('');if(players.some(p=>p.id===previous))$(id).value=previous}
function renderAll(){$('playersCount').textContent=players.length;$('evaluationsCount').textContent=evaluations.length;$('plansCount').textContent=plans.length;['evalPlayer','progressPlayer','planPlayer'].forEach(options);$('rosterRows').innerHTML=players.map(p=>`<tr><td>${escapeHtml(fullName(p))}</td><td>${escapeHtml(p.team)}</td><td>${escapeHtml(p.jersey)}</td><td>${evaluations.filter(e=>e.player_id===p.id).length}</td><td class="noprint"><button data-edit-player="${p.id}">Edit</button></td></tr>`).join('');renderMetricInputs();renderProgress();renderSavedEvaluations();renderCompleteActions();renderPlans();renderLibrary();const previous=$('planMetric').value;$('planMetric').innerHTML=metrics.filter(m=>m.active).map(m=>`<option value="${m.id}">${escapeHtml(m.category+' — '+m.name)}</option>`).join('');$('planMetric').value=previous||$('planMetric').value}
function renderMetricInputs(){const selected=metrics.filter(m=>m.active);$('metricInputs').innerHTML=['Offense','Defense','Character'].map(category=>`<h3>${category}</h3>`+selected.filter(m=>m.category===category).map(m=>`<div class="metric"><div><b>${escapeHtml(m.name)}</b><div class="muted"><small>${escapeHtml(m.description)}</small></div></div><select data-score="${m.id}" aria-label="Score ${escapeHtml(m.name)}"><option value="">Not Rated</option>${[1,2,3,4,5,6,7,8].map(n=>`<option value="${n}">${n} / 8</option>`).join('')}</select></div>`).join('')).join('')}
function renderLibrary(){$('libraryRows').innerHTML=['Offense','Defense','Character'].map(c=>`<h3>${c}</h3>`+metrics.filter(m=>m.category===c).map(m=>`<div class="metric"><div><b>${escapeHtml(m.name)}</b><div class="muted">${escapeHtml(m.description)}</div></div><label style="white-space:nowrap;color:white"><input type="checkbox" data-toggle="${m.id}" ${m.active?'checked':''} style="width:auto"> Include</label></div>`).join('')).join('')}
function scoreMap(e){return e.scores||{}}
function average(e,category){const vals=Object.entries(scoreMap(e)).filter(([id,n])=>{const m=metrics.find(m=>m.id===id);return m?.category===category&&Number(n)>0}).map(([,n])=>Number(n));return vals.length?(vals.reduce((a,b)=>a+b,0)/vals.length).toFixed(1):'—'}
function renderProgress(){const id=$('progressPlayer').value, target=$('progressReport');if(!id){target.innerHTML='<p class="muted">Select a player to see scores and progress.</p>';return}const p=players.find(p=>p.id===id),items=evaluations.filter(e=>e.player_id===id).sort((a,b)=>a.evaluated_at.localeCompare(b.evaluated_at));if(!items.length){target.innerHTML='<p>No evaluations saved for this player yet.</p>';return}const first=items[0],last=items[items.length-1];let rows=metrics.filter(m=>items.some(e=>scoreMap(e)[m.id]!=null)).map(m=>{const a=scoreMap(first)[m.id],b=scoreMap(last)[m.id],delta=a!=null&&b!=null?Number(b)-Number(a):null;return `<tr><td>${escapeHtml(m.category)} / ${escapeHtml(m.name)}</td><td>${a??'—'}</td><td>${b??'—'}</td><td>${delta===null?'—':(delta>0?'+':'')+delta}</td></tr>`}).join('');target.innerHTML=`<h3>${escapeHtml(fullName(p))} — ${escapeHtml(p.team)}</h3><p>${items.length} evaluation(s) · ${escapeHtml(first.evaluated_at)} to ${escapeHtml(last.evaluated_at)}</p><div class="grid triple">${['Offense','Defense','Character'].map(c=>`<div class="card"><b>${c}</b><div class="score">${average(last,c)}</div><small>Latest average / 8</small></div>`).join('')}</div><h3>First vs. Most Recent</h3><div class="scroll"><table><thead><tr><th>Criterion</th><th>First</th><th>Latest</th><th>Change</th></tr></thead><tbody>${rows}</tbody></table></div><h3>Evaluation Timeline</h3><div class="scroll"><table><thead><tr><th>Date</th><th>Setting</th><th>Offense</th><th>Defense</th><th>Character</th><th>Coach</th></tr></thead><tbody>${items.map(e=>`<tr><td>${escapeHtml(e.evaluated_at)}</td><td>${escapeHtml(e.setting)}</td><td>${average(e,'Offense')}</td><td>${average(e,'Defense')}</td><td>${average(e,'Character')}</td><td>${escapeHtml(e.coach_email)}</td></tr>`).join('')}</tbody></table></div><h3>Latest Coach Feedback</h3><p><b>Strengths:</b> ${escapeHtml(last.strengths)}</p><p><b>Areas to improve:</b> ${escapeHtml(last.weaknesses)}</p><p><b>Notes:</b> ${escapeHtml(last.notes)}</p><h3>Score Trend</h3>${['Offense','Defense','Character'].map(c=>`<div style="margin:10px 0"><b>${c}</b>${items.map(e=>{const n=Number(average(e,c));return `<div class="flex" style="margin:5px 0"><small style="width:95px">${escapeHtml(e.evaluated_at)}</small><div class="bar" style="flex:1"><span style="width:${Number.isFinite(n)?n*12.5:0}%"></span></div><small style="width:35px">${Number.isFinite(n)?n.toFixed(1):'—'}</small></div>`}).join('')}</div>`).join('')}`}

function playerEvaluations(id){return evaluations.filter(e=>e.player_id===id).sort((a,b)=>a.evaluated_at.localeCompare(b.evaluated_at)||a.created_at.localeCompare(b.created_at))}
function scoreDelta(n,old){if(old==null)return 'New';const d=Number(n)-Number(old);return d>0?'↑ +'+d:d<0?'↓ '+d:'→ 0'}
function renderPrevious(){const id=$('evalPlayer').value, target=$('previousEvaluation');if(!id){target.innerHTML='<p class="muted">Choose a player to see their previous evaluation and score trends.</p>';return}const history=playerEvaluations(id).filter(e=>e.id!==$('editingEvaluationId').value),last=history.at(-1);if(!last){target.innerHTML='<p class="muted">First evaluation for this player — no previous scores.</p>';return}target.innerHTML='<h3>Previous Evaluation: '+escapeHtml(last.evaluated_at)+'</h3><p class="muted">Changes compare your current scores with the latest saved evaluation.</p><div id="previousScoreRows"></div>';renderScoreComparison()}
function renderScoreComparison(){const id=$('evalPlayer').value,last=playerEvaluations(id).filter(e=>e.id!==$('editingEvaluationId').value).at(-1),target=$('previousScoreRows');if(!target||!last)return;target.innerHTML=[...document.querySelectorAll('[data-score]')].map(s=>{const m=metrics.find(m=>m.id===s.dataset.score),prev=last.scores?.[s.dataset.score],now=s.value;return `<div class="metric"><span>${escapeHtml(m?.name||'Skill')}</span><span>Previous: ${prev??'—'} · Current: ${now||'—'} ${now?scoreDelta(now,prev):''}</span></div>`}).join('')}
function renderSavedEvaluations(){const id=$('progressPlayer').value,target=$('savedEvaluationList');if(!id){target.innerHTML='<p class="muted">Select a player to access saved evaluations.</p>';return}const history=playerEvaluations(id).slice().reverse();target.innerHTML=history.length?history.map(e=>`<div class="metric"><div><b>${escapeHtml(e.evaluated_at)} — ${escapeHtml(e.setting)}</b><div class="muted"><small>Offense ${average(e,'Offense')} · Defense ${average(e,'Defense')} · Character ${average(e,'Character')} · ${escapeHtml(e.coach_email)}</small></div></div><button class="noprint" data-edit-eval="${e.id}">Open / Edit</button></div>`).join(''):'<p>No evaluations saved for this player.</p>'}
// Each evaluation owns its complete editable development plan, stored in pd_evaluations.skill_plans.
let skillPlanDrafts={};
const SKILL_DRILLS = {
 "Attitude": [
  "Identify one coaching correction each practice; repeat it back and apply it on the next repetition.",
  "After a strikeout, error, or unfavorable call, use a 5-second reset: breathe, acknowledge, and return attention to the next play.",
  "During three challenging drill sequences, respond to correction without arguing or disengaging.",
  "At the end of each practice, give one specific example of accepting feedback and making an adjustment.",
  "Coach records constructive responses across the next three practices and two games."
 ],
 "Body Language": [
  "Establish a ready posture: head up, shoulders neutral, eyes on the next pitch, and hands prepared.",
  "Practice a 5-second reset after a missed play: exhale, positive cue, and return to ready position.",
  "In a controlled error drill, respond to five simulated mistakes without negative gestures or equipment slamming.",
  "During scrimmage, maintain engaged posture between pitches and give a teammate one positive response after an error.",
  "Coach tallies visible positive resets after mistakes over three practices and two games."
 ],
 "Effort": [
  "Define full-speed expectations for home-to-first, defensive pursuit, backing up bases, and transitions.",
  "Complete five timed home-to-first runs with consistent effort and safe mechanics; record times.",
  "Finish every assigned defensive repetition by moving through the play and backing up the appropriate base.",
  "During a scrimmage, demonstrate full-speed first steps and follow-through on every live ball.",
  "Coach tracks hustle and completion on 10 consecutive observable opportunities across two sessions."
 ],
 "Focus": [
  "Use a pre-pitch routine: check outs/runners, identify assignment, assume ready position, and lock onto the hitter.",
  "Before each of 10 defensive repetitions, verbally state the likely play and required first move.",
  "Complete two 8-minute distraction-controlled stations while staying engaged between repetitions.",
  "In live scrimmage, communicate outs and situational responsibilities before each new hitter.",
  "Coach records assignment readiness and correct pre-pitch decisions on 10 consecutive opportunities."
 ],
 "Leadership": [
  "Choose one daily leadership action: organize a station, encourage a teammate, or model preparation.",
  "Give at least two specific, constructive teammate acknowledgments during each practice.",
  "Lead a brief pre-drill reminder of purpose, effort, and the team standard with coach support.",
  "During adversity in scrimmage, initiate calm communication and help teammates reset.",
  "Coach records three independent examples of positive influence over two weeks."
 ],
 "Arm Strength": [
  "Review grip, stride direction, hip/torso sequencing, and follow-through with coach; avoid max-effort throwing until mechanics are sound.",
  "Complete the team-approved progressive throwing routine at a comfortable distance, emphasizing clean mechanics.",
  "Progress distance only when throws retain carry, accuracy, and pain-free mechanics; record distance and quality.",
  "Make 8–10 position-specific throws after fielding or receiving, using game footwork without overthrowing.",
  "Coach compares controlled throw carry and mechanics at the same distance; stop for pain or fatigue."
 ],
 "Baseball IQ": [
  "Before each defensive rep, identify outs, runner locations, score situation, and primary/secondary plays.",
  "Work through 10 coach-presented situations and verbally choose the correct base or cutoff responsibility.",
  "Run 6 live reads with changing runners and ball locations; pause to explain each decision.",
  "In scrimmage, call the likely play before the pitch and execute the correct decision after contact.",
  "Coach logs correct decisions out of 10 comparable game situations and reviews missed reads."
 ],
 "Communication": [
  "Review position-specific calls for fly balls, cutoffs, relays, bunt coverage, and backups.",
  "Run 12 fly-ball communication repetitions using early, loud, repeated calls and clear ownership.",
  "Practice 8 cutoff/relay situations: name the target, communicate the throw, and confirm coverage.",
  "In live defense, make a clear pre-pitch assignment call and communicate on each playable ball.",
  "Coach tracks timely, audible, correct calls in 10 relevant opportunities."
 ],
 "Fielding Fundamentals": [
  "Set an athletic pre-pitch position with glove presented and feet active before contact.",
  "Complete 15 short-hop and routine-ground-ball reps emphasizing approach angle, glove out front, and secure transfer.",
  "Add 12 forehand/backhand and move-through reps with correct footwork before throwing.",
  "Field 10 game-speed balls and make accurate throws using appropriate footwork for each angle.",
  "Coach records clean fields and controlled transfers out of 20 comparable reps."
 ],
 "Position-Specific Skills": [
  "Identify the primary position and list its three highest-frequency responsibilities with the coach.",
  "Complete 12 position-specific footwork and receiving/fielding reps for the player’s actual position.",
  "Practice 8 situational responsibilities: coverage, backup, cutoff, tag, or throw selection as appropriate.",
  "Execute the same responsibilities in a live defensive inning with coach observation.",
  "Coach checks correct positioning and execution on 10 position-specific opportunities; customize these drills for the assigned position."
 ],
 "Range / First Step": [
  "Start in a balanced ready position and identify contact cues before each rep.",
  "Complete 12 left/right reaction reps from a neutral stance; focus on first movement without a false step.",
  "Complete 12 crossover/drop-step and angle-to-ball reps using varied ball direction and speed.",
  "Field 10 balls placed just outside routine range, using efficient routes and a controlled finish.",
  "Coach records correct first-step direction and balls reached out of 20 comparable reps."
 ],
 "Throwing Accuracy": [
  "Check grip, alignment, footwork to target, and release point on 10 stationary throws.",
  "Complete 20 target throws at comfortable distance; record hits within a defined target box.",
  "Add 12 throws after moving left/right or charging a ball while maintaining target alignment.",
  "Execute 10 game-speed throws to position-appropriate bases with a receiving teammate.",
  "Coach compares accurate throws out of 20 at the same distance and task difficulty."
 ],
 "Baserunning": [
  "Review stance, first three steps, running through first, and proper turns at each base.",
  "Time 5 home-to-first starts and practice 10 controlled turns around first base.",
  "Practice 12 coach-cued reads on balls in dirt, line drives, and fly balls with correct freeze/advance decisions.",
  "Run 8 first-to-third or scoring decisions in live simulated situations with coach feedback.",
  "Coach records correct reads and decisions out of 10 comparable opportunities; use times only where relevant."
 ],
 "Bunting": [
  "Establish balanced bunt stance, safe bat position, and early angle control.",
  "Place 15 stationary-feed bunts toward first- and third-base target zones; record successful placements.",
  "Complete 12 soft-toss bunts, adjusting angle to deaden the ball and avoid popping it up.",
  "Execute 8 situational sacrifice or push-bunt attempts with a runner and defense in place.",
  "Coach records fair, controlled target-zone bunts out of 20 comparable attempts."
 ],
 "Contact / Barrel Control": [
  "Review strike-zone contact point, head stability, and barrel path with video or coach observation.",
  "Hit 3 sets of 10 tee balls to defined middle/opposite/pull targets while tracking hard, centered contact.",
  "Complete 3 sets of 8 front-toss swings with varied locations and the same centered-contact objective.",
  "Progress to 15 controlled machine/live swings; chart solid contact and mishit locations.",
  "Compare solid-contact percentage over 20 comparable swings and review contact-point video."
 ],
 "Hitting Mechanics": [
  "Identify one priority movement from video: stance/balance, load, separation, stride, or bat path; avoid changing everything at once.",
  "Complete 3 sets of 8 slow-motion dry swings or tee reps rehearsing the selected movement.",
  "Complete 3 sets of 10 tee swings and 2 sets of 8 front-toss swings while checking balance and contact position.",
  "Advance to 15 machine/live swings only when the movement is repeatable at controlled speed.",
  "Compare before/after swing video and coach-rated execution over 20 comparable swings."
 ],
 "Plate Discipline": [
  "Define the player’s strike-zone plan and one preferred attack zone before the session.",
  "Take 20 tracked pitches without swinging; call ball/strike and location before feedback.",
  "Complete 20 mixed front-toss or machine pitches; chart swings at strikes versus chase swings outside the zone.",
  "In 8 simulated at-bats, use count-specific plans and record takes, chases, and swing decisions.",
  "Compare chase rate and correct take/swing decisions over 20–30 tracked pitches."
 ],
 "Situational Hitting": [
  "Review the hitter’s approach for runner on third under two outs, runner on second no outs, and two-strike counts.",
  "Complete 10 opposite-field or middle-of-field tee reps for the assigned runner-advancement situation.",
  "Run 12 front-toss reps with a coach calling out count, outs, and runner situation before each pitch.",
  "Complete 8 live situational at-bats, scoring whether the decision and ball-in-play approach fit the assignment.",
  "Coach records appropriate approach and execution out of 10 comparable situational opportunities."
 ]
};
const SKILL_STEP_TITLES=['Define the skill','Controlled practice','Progressive challenge','Game-speed application','Measure progress'];
function skillScoreGoal(m,score){const s=Math.max(1,Math.min(8,Number(score)||1)),next=Math.min(8,s+1);return `Improve ${m.name} from ${s}/8 toward ${next}/8 by the next evaluation, using the specific drills and observable success measure below.`}
function skillPlanMeasure(m,score){const n=m.name;const s=Number(score);const base={
 'Attitude':'Coach observes constructive responses to feedback and adversity in at least 8 of 10 relevant situations.',
 'Body Language':'Coach observes positive reset and engaged posture after at least 8 of 10 mistakes or difficult moments.',
 'Effort':'Coach observes full-speed, complete effort on at least 9 of 10 relevant plays or repetitions.',
 'Focus':'Correct pre-pitch assignment and ready position on at least 8 of 10 observed plays.',
 'Leadership':'At least three independent examples of positive leadership documented over two weeks.',
 'Arm Strength':'Consistent pain-free mechanics and improved throw carry at the same distance and task difficulty.',
 'Baseball IQ':'Correct defensive choice on at least 8 of 10 comparable game situations.',
 'Communication':'Timely, clear, correct communication on at least 8 of 10 relevant opportunities.',
 'Fielding Fundamentals':'At least 16 clean fields and controlled transfers in 20 comparable repetitions.',
 'Position-Specific Skills':'Correct positioning and execution on at least 8 of 10 position-specific situations.',
 'Range / First Step':'Correct initial direction and efficient route on at least 16 of 20 comparable reads.',
 'Throwing Accuracy':'At least 16 accurate throws to a defined target in 20 comparable repetitions.',
 'Baserunning':'Correct reads and decisions on at least 8 of 10 comparable baserunning situations.',
 'Bunting':'At least 14 controlled, fair target-zone bunts in 20 comparable attempts.',
 'Contact / Barrel Control':'At least 14 centered, solid-contact swings in 20 comparable pitches.',
 'Hitting Mechanics':'Repeat the selected priority movement on at least 16 of 20 comparable swings, confirmed by video.',
 'Plate Discipline':'At least 16 correct swing/take decisions in 20 tracked pitches, with fewer chase swings.',
 'Situational Hitting':'Appropriate approach and execution on at least 8 of 10 comparable situational at-bats.'
 }[n]||`Coach documents measurable ${n} execution in comparable practice and game situations.`;
 return `${base} Reevaluate the MLB 1–8 rating (current ${s}/8) using multiple observations, not one drill.`;
}
function stepsForSkill(m){const raw=SKILL_DRILLS[m.name];if(raw)return raw.map((description,i)=>({title:SKILL_STEP_TITLES[i],description}));const description=m.description?.trim()||m.name;return [
 {title:'Define the skill',description:`Coach identifies the exact observable behavior for ${m.name}: ${description}. Agree on a baseline.`},
 {title:'Controlled practice',description:`Complete 10 focused ${m.name} repetitions or observations and record successful executions using the agreed standard.`},
 {title:'Progressive challenge',description:`Repeat ${m.name} in 10 more difficult or varied situations while recording results.`},
 {title:'Game-speed application',description:`Apply ${m.name} during 10 realistic baseball situations; coach records correct decisions and execution.`},
 {title:'Measure progress',description:`Compare success rate in equivalent situations, review video/coach notes, and update the 1–8 score.`}
 ];}
function makeSkillPlan(m,score){return {metric_id:m.id,category:m.category,name:m.name,score:Number(score),goal:skillScoreGoal(m,score),steps:stepsForSkill(m),measure:skillPlanMeasure(m,score)}}
function currentScores(){const scores={};document.querySelectorAll('[data-score]').forEach(el=>{if(el.value)scores[el.dataset.score]=Number(el.value)});return scores}
function syncSkillPlans(){const scores=currentScores(),next={};for(const [id,score] of Object.entries(scores)){const m=metrics.find(x=>x.id===id);if(!m)continue;const existing=skillPlanDrafts[id];next[id]=existing?{...existing,score:Number(score),name:m.name,category:m.category}:makeSkillPlan(m,score)}skillPlanDrafts=next;renderAllSkillPlans()}
function renderAllSkillPlans(){const host=$('allSkillPlans');if(!host)return;const arr=Object.values(skillPlanDrafts);host.innerHTML=arr.length?`<p><b>${arr.length} individual skill plans</b> — all editable before saving.</p>`+['Character','Defense','Offense'].map(cat=>{const items=arr.filter(x=>x.category===cat);return items.length?`<h3>${cat}</h3>`+items.map(x=>`<div class="card" data-skill-plan="${escapeAttr(x.metric_id)}"><h3>${escapeHtml(x.name)} — ${x.score}/8</h3><label>Measurable goal</label><textarea data-skill-field="goal">${escapeHtml(x.goal)}</textarea><label>Development steps / drills</label>${x.steps.map((st,i)=>`<div style="padding:7px 0"><label>Step ${i+1} title</label><input data-skill-step="${i}" data-step-part="title" value="${escapeAttr(st.title)}"><label>Instructions / drills</label><textarea data-skill-step="${i}" data-step-part="description">${escapeHtml(st.description)}</textarea></div>`).join('')}<label>Success measure</label><textarea data-skill-field="measure">${escapeHtml(x.measure)}</textarea></div>`).join(''):''}).join(''):'<p class="muted">Select scores, then click Generate / Refresh All Skill Plans.</p>'}
function collectSkillPlanEdit(e){const block=e.target.closest('[data-skill-plan]');if(!block)return;const p=skillPlanDrafts[block.dataset.skillPlan];if(!p)return;const field=e.target.dataset.skillField;if(field)p[field]=e.target.value;const step=e.target.dataset.skillStep;if(step!==undefined&&p.steps[Number(step)])p.steps[Number(step)][e.target.dataset.stepPart]=e.target.value}
$('allSkillPlans').addEventListener('input',collectSkillPlanEdit);
$('generateAllPlans').onclick=syncSkillPlans;
function completeReport(e){const player=players.find(p=>p.id===e.player_id),records=playerEvaluations(e.player_id),prior=records.filter(x=>x.id!==e.id&&x.evaluated_at<=e.evaluated_at).at(-1);const planMap=e.skill_plans||{};const parts=['Character','Defense','Offense'].map(cat=>{const scored=Object.entries(e.scores||{}).filter(([id])=>metrics.find(m=>m.id===id)?.category===cat);if(!scored.length)return '';return `<h2>${cat}</h2>`+scored.map(([id,score])=>{const m=metrics.find(x=>x.id===id),p=planMap[id]||makeSkillPlan(m,score);return `<div class="report-skill"><h3>${escapeHtml(m?.name||p.name)} — ${score}/8 ${prior?.scores?.[id]!=null?`(previous ${prior.scores[id]}/8; ${escapeHtml(scoreDelta(score,prior.scores[id]))})`:''}</h3><p><b>Goal:</b> ${escapeHtml(p.goal)}</p>${(p.steps||[]).map((st,i)=>`<p><b>${i+1}. ${escapeHtml(st.title)}:</b> ${escapeHtml(st.description)}</p>`).join('')}<p><b>Success measure:</b> ${escapeHtml(p.measure)}</p></div>`}).join('')}).join('');return `<h1>PLAYER EVALUATION — COMPLETE DEVELOPMENT REPORT</h1><div class="report-meta"><b>Player:</b> ${escapeHtml(player?fullName(player):'Unknown')} &nbsp; <b>Team:</b> ${escapeHtml(player?.team||'')}<p><b>Evaluation:</b> ${escapeHtml(e.evaluated_at)} · ${escapeHtml(e.setting)} &nbsp; <b>Coach:</b> ${escapeHtml(e.coach_email)}</p><p><b>MLB Scouting Scale:</b> 1 Poor · 2 Well Below Average · 3 Below Average · 4 Fringe Average · 5 Average · 6 Above Average · 7 Plus · 8 Elite</p></div><h2>Coach Assessment</h2><p><b>Strengths:</b> ${escapeHtml(e.strengths)}</p><p><b>Areas for Improvement:</b> ${escapeHtml(e.weaknesses)}</p><p><b>Notes:</b> ${escapeHtml(e.notes)}</p>${parts}<h2>Next Review</h2><p>Reevaluate each scored criterion, compare scores with this report, and update development goals.</p>`}

function allCategoryPlanReport(e){
 const player=players.find(p=>p.id===e.player_id), map=e.skill_plans||{}, scored=e.scores||{};
 const groups=['Character','Defense','Offense'].map(cat=>{
  const selected=Object.entries(scored).filter(([id,v])=>v!=null&&v!==''&&metrics.some(m=>m.id===id&&m.category===cat));
  if(!selected.length)return '';
  return `<h2 class="report-category">${cat} — ${selected.length} skills</h2>`+selected.map(([id,score])=>{
   const metric=metrics.find(m=>m.id===id), plan=map[id]||(metric?makeSkillPlan(metric,score):null);
   if(!plan)return '';
   return `<article class="report-skill"><h3>${escapeHtml(metric?.name||plan.name||'Skill')} <span style="float:right">${escapeHtml(score)}/8</span></h3><p><strong>Measurable Goal:</strong> ${escapeHtml(plan.goal)}</p><p><strong>Development Steps & Drills</strong></p><ol>${(plan.steps||[]).map(st=>`<li><b>${escapeHtml(st.title)}</b> — ${escapeHtml(st.description)}</li>`).join('')}</ol><p><strong>Success Measure:</strong> ${escapeHtml(plan.measure)}</p></article>`;
  }).join('');
 }).join('');
 return `<h1>PLAYER DEVELOPMENT — COMPLETE IMPROVEMENT PLAN</h1><div class="report-meta"><b>Player:</b> ${escapeHtml(player?fullName(player):'Unknown')} &nbsp; <b>Team:</b> ${escapeHtml(player?.team||'')}<p><b>Evaluation Date:</b> ${escapeHtml(e.evaluated_at)} &nbsp; <b>Coach:</b> ${escapeHtml(e.coach_email)}</p><p>All scored criteria • MLB-style 1–8 scale • Individual editable plans</p></div>${groups}<p>Reassess these skills at the next evaluation and update each development plan.</p>`;
}
function printAllCategoryPlans(id){const e=evaluations.find(x=>x.id===id);if(!e)return message('Evaluation not found');$('completePrintSheet').innerHTML=allCategoryPlanReport(e);document.body.classList.add('printing-complete');const done=()=>{document.body.classList.remove('printing-complete');window.removeEventListener('afterprint',done)};window.addEventListener('afterprint',done);window.print()}

function printCompleteEvaluation(id){const e=evaluations.find(x=>x.id===id);if(!e)return message('Evaluation not found');$('completePrintSheet').innerHTML=completeReport(e);document.body.classList.add('printing-complete');const done=()=>{document.body.classList.remove('printing-complete');window.removeEventListener('afterprint',done)};window.addEventListener('afterprint',done);window.print()}
function renderCompleteActions(){const host=$('completeEvalActions');if(!host)return;const id=$('progressPlayer').value;const rows=playerEvaluations(id).slice().reverse();host.innerHTML=rows.length?'<h3>Complete Evaluation Reports</h3>'+rows.map(e=>`<p><button data-print-all-plans="${e.id}" class="primary">Print All Improvement Plans — ${escapeHtml(e.evaluated_at)}</button> <button data-print-complete="${e.id}">Print Complete Evaluation</button> <button data-edit-complete="${e.id}">Edit Evaluation & All Plans</button></p>`).join(''):''}
$('completeEvalActions').onclick=e=>{const p=e.target.closest('[data-print-complete]'),edit=e.target.closest('[data-edit-complete]');if(p)printCompleteEvaluation(p.dataset.printComplete);if(edit)startEditEvaluation(edit.dataset.editComplete)};
function startEditEvaluation(id){const e=evaluations.find(x=>x.id===id);if(!e)return;$('editingEvaluationId').value=e.id;$('evalPlayer').value=e.player_id;$('evalDate').value=e.evaluated_at;$('evalSetting').value=e.setting;$('strengths').value=e.strengths||'';$('weaknesses').value=e.weaknesses||'';$('coachNotes').value=e.notes||'';document.querySelectorAll('[data-score]').forEach(s=>s.value=e.scores?.[s.dataset.score]??'');$('evaluationHeading').textContent='Edit Saved Evaluation';$('saveEvaluation').textContent='Update Evaluation';$('cancelEvaluationEdit').classList.remove('hide');skillPlanDrafts=JSON.parse(JSON.stringify(e.skill_plans||{}));syncSkillPlans();setTab('evaluation');renderPrevious();window.scrollTo({top:0,behavior:'smooth'})}
function resetEvaluation(){ skillPlanDrafts={};renderAllSkillPlans(); $('editingEvaluationId').value='';$('evaluationHeading').textContent='Player Evaluation';$('saveEvaluation').textContent='Save Evaluation';$('cancelEvaluationEdit').classList.add('hide');['strengths','weaknesses','coachNotes'].forEach(id=>$(id).value='');document.querySelectorAll('[data-score]').forEach(s=>s.value='');renderPrevious()}

const PLAN_TEMPLATES={
 Offense:['Review the hitting fundamentals and identify the specific movement or decision to improve.','Complete 3 tee-work sessions per week: 3 sets of 10 purposeful swings with coach feedback.','Progress to front toss and soft toss with 3 sets of 10 quality repetitions, focusing on the same skill.','Apply the movement in controlled machine or live batting practice once fundamentals are consistent.','Reevaluate in 14 days using the same scouting criterion and record video or observable results.'],
 Defense:['Review ready position, footwork, glove presentation, throwing mechanics and situational responsibilities.','Complete 3 focused fielding sessions weekly, 15–20 controlled repetitions per session.','Progress to moving balls, throws on the run and situational defensive decisions.','Apply the skill in game-speed repetitions and document execution and decision quality.','Reevaluate in 14 days with the same defensive criterion and compare to the prior score.'],
 Character:['Discuss the specific behavior and establish one clear, observable standard for practice and games.','Practice the standard at every team activity with a short pre-practice reminder.','Use real situations to demonstrate effort, coachability, communication and teammate support.','Coach gives specific weekly feedback and records examples of progress.','Reevaluate in 14 days using observed behavior rather than a single incident.']
};
let planSteps=[];
function escapeAttr(v){return escapeHtml(String(v??'')).replace(/"/g,'&quot;')}
function defaultSteps(){const metric=metrics.find(m=>m.id===$('planMetric').value);return metric?stepsForSkill(metric):[]}
function renderPlanSteps(){$('planSteps').innerHTML=planSteps.map((s,i)=>`<div class="card" data-step-index="${i}"><div class="flex"><b>Step ${i+1}</b><button type="button" data-remove-step="${i}">Remove</button></div><label>Step name</label><input data-step-title="${i}" value="${escapeAttr(s.title)}"><label>Instructions / Drills</label><textarea data-step-description="${i}">${escapeHtml(s.description)}</textarea><div class="flex"><button type="button" data-move-step="${i}" data-direction="-1" ${i===0?'disabled':''}>Move Up</button><button type="button" data-move-step="${i}" data-direction="1" ${i===planSteps.length-1?'disabled':''}>Move Down</button></div></div>`).join('')}
function setDefaultSteps(){planSteps=defaultSteps();renderPlanSteps()}
function stepsToText(){return planSteps.map((s,i)=>`${i+1}. ${s.title}\n${s.description}`).join('\n\n')}
function parseSavedSteps(actions){const txt=String(actions||'');const matches=[...txt.matchAll(/(?:^|\n\n)(\d+)\.\s+([^\n]+)\n([\s\S]*?)(?=\n\n\d+\.\s+|$)/g)];return matches.length?matches.map(m=>({title:m[2],description:m[3].trim()})):txt?[{title:'Practice Actions',description:txt}]:defaultSteps()}
$('planSteps').addEventListener('input',e=>{const i=Number(e.target.dataset.stepTitle??e.target.dataset.stepDescription);if(!Number.isInteger(i)||!planSteps[i])return;if(e.target.hasAttribute('data-step-title'))planSteps[i].title=e.target.value;if(e.target.hasAttribute('data-step-description'))planSteps[i].description=e.target.value});
$('planSteps').addEventListener('click',e=>{const rm=e.target.closest('[data-remove-step]');if(rm){planSteps.splice(Number(rm.dataset.removeStep),1);renderPlanSteps();return}const mv=e.target.closest('[data-move-step]');if(mv){const i=Number(mv.dataset.moveStep),j=i+Number(mv.dataset.direction);if(j<0||j>=planSteps.length)return;[planSteps[i],planSteps[j]]=[planSteps[j],planSteps[i]];renderPlanSteps()}});
$('addPlanStep').onclick=()=>{planSteps.push({title:'New Step',description:''});renderPlanSteps()};
$('resetPlanSteps').onclick=setDefaultSteps;
$('planMetric').addEventListener('change',()=>makePlanDraft(true));
function makePlanDraft(respectSelection=false){const id=$('planPlayer').value;if(!id)return;const history=playerEvaluations(id),last=history.at(-1);if(!last){$('planAutoNote').textContent='No saved evaluations yet. Select a skill to use editable skill-specific steps.';setDefaultSteps();$('planActions').value=stepsToText();return}const scored=Object.entries(last.scores||{}).map(([id,v])=>({metric:metrics.find(m=>m.id===id),value:Number(v)})).filter(x=>x.metric&&x.value>=1&&x.value<=8).sort((a,b)=>a.value-b.value);if(!scored.length)return;const selected=scored.find(x=>x.metric.id===$('planMetric').value);const focus=(respectSelection&&selected)||selected||scored[0];$('planMetric').value=focus.metric.id;const draft=makeSkillPlan(focus.metric,focus.value);planSteps=draft.steps;renderPlanSteps();$('planGoal').value=draft.goal;$('planActions').value=stepsToText();$('planMeasure').value=draft.measure;const prior=history.slice(0,-1).reverse().find(e=>e.scores?.[focus.metric.id]!=null);$('planAutoNote').textContent=`Skill-specific recommendation from ${last.evaluated_at}: ${focus.metric.name} ${focus.value}/8${prior?` (previously ${prior.scores[focus.metric.id]}/8)`:''}. Review and edit before saving.`}
function startEditPlan(id){const p=plans.find(x=>x.id===id);if(!p)return;$('editingPlanId').value=id;$('planPlayer').value=p.player_id;$('planMetric').value=p.metric_id||'';$('targetDate').value=p.target_date||'';$('planGoal').value=p.goal||'';$('planActions').value=p.actions||'';$('planMeasure').value=p.measure||'';planSteps=parseSavedSteps(p.actions);renderPlanSteps();$('planHeading').textContent='Edit Saved Improvement Plan';$('savePlan').textContent='Update Plan';$('cancelPlanEdit').classList.remove('hide');$('planAutoNote').textContent='Editing an existing plan. Save changes to update it.';setTab('plans');window.scrollTo({top:0,behavior:'smooth'})}
function resetPlan(){planSteps=[];renderPlanSteps();$('editingPlanId').value='';$('planHeading').textContent='Improvement Plan';$('savePlan').textContent='Save Plan';$('cancelPlanEdit').classList.add('hide');['planGoal','planActions','planMeasure','targetDate'].forEach(id=>$(id).value='');$('planAutoNote').textContent='Select a player to generate a suggested improvement plan from saved evaluations.'}
function renderPlans(){$('planList').innerHTML=plans.length?plans.map(p=>{const player=players.find(x=>x.id===p.player_id),metric=metrics.find(x=>x.id===p.metric_id);return `<div class="card"><div class="flex"><h3 style="flex:1">${escapeHtml(player?fullName(player):'Unknown Player')} — ${escapeHtml(metric?.name||'Focus')}</h3><span class="pill">${escapeHtml(p.status)}</span></div><p><b>Goal:</b> ${escapeHtml(p.goal)}</p><p><b>Practice Actions:</b> ${escapeHtml(p.actions)}</p><p><b>Success Measure:</b> ${escapeHtml(p.measure)}</p><p><b>Review Date:</b> ${escapeHtml(p.target_date)}</p><div class="noprint"><button data-print-plan="${p.id}">Print / Save PDF</button> <button data-edit-plan="${p.id}">Edit Plan</button> <button data-complete="${p.id}">${p.status==='Complete'?'Reopen Plan':'Mark Complete'}</button></div></div>`}).join(''):'<p class="muted">No improvement plans yet.</p>'}
async function addPlayer(first,last,team,jersey){first=cleanName(first);last=cleanName(last);team=String(team??'').trim();if(!first||!last||!team)throw Error('First name, last name and team are required.');if(players.some(p=>p.first_name.toLowerCase()===first.toLowerCase()&&p.last_name.toLowerCase()===last.toLowerCase()&&p.team.toLowerCase()===team.toLowerCase()))return false;check(await db.from('pd_players').insert({org,first_name:first,last_name:last,team,jersey:jersey||null}));return true}
function csvRows(raw){const result=[];let row=[],cell='',quoted=false;for(let i=0;i<raw.length;i++){const ch=raw[i];if(ch==='"'){if(quoted&&raw[i+1]==='"'){cell+='"';i++}else quoted=!quoted}else if(ch===','&&!quoted){row.push(cell);cell=''}else if((ch==='\n'||ch==='\r')&&!quoted){if(ch==='\r'&&raw[i+1]==='\n')i++;row.push(cell);if(row.some(v=>v.trim()))result.push(row);row=[];cell=''}else cell+=ch}row.push(cell);if(row.some(v=>v.trim()))result.push(row);return result}
function download(name,body){const a=document.createElement('a'),url=URL.createObjectURL(new Blob([body],{type:'text/csv;charset=utf-8'}));a.href=url;a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(url),1000)}
$('connect').onclick=connect;$('changeDb').onclick=()=>{localStorage.removeItem('playerdev_config');location.reload()};$('login').onclick=async()=>{try{check(await db.auth.signInWithPassword({email:$('email').value.trim(),password:$('password').value}));await restore()}catch(e){error(e)}};$('logout').onclick=async()=>{await db.auth.signOut();session=null;$('logout').classList.add('hide');visible('authPanel')};$('joinOrg').onclick=async()=>{try{org=$('orgCode').value.trim().toLowerCase();if(!/^[a-z0-9][a-z0-9-]{2,60}$/.test(org))throw Error('Use 3–61 lowercase letters, numbers or hyphens.');localStorage.setItem('playerdev_org',org);await loadAll();visible('app')}catch(e){error(e)}};document.querySelectorAll('[data-tab]').forEach(b=>b.onclick=()=>setTab(b.dataset.tab));
$('addPlayer').onclick=async()=>{try{await addPlayer($('first').value,$('last').value,$('team').value,$('jersey').value);['first','last','jersey'].forEach(id=>$(id).value='');await loadAll();message('Player added')}catch(e){error(e)}};
$('rosterRows').onclick=e=>{const btn=e.target.closest('[data-edit-player]');if(!btn)return;const p=players.find(x=>x.id===btn.dataset.editPlayer);if(!p)return;$('editPlayerId').value=p.id;$('editFirst').value=cleanName(p.first_name);$('editLast').value=cleanName(p.last_name);$('editTeam').value=p.team;$('editJersey').value=p.jersey||'';$('editPlayerPanel').classList.remove('hide');$('editPlayerPanel').scrollIntoView({behavior:'smooth',block:'center'})};
$('cancelPlayerEdit').onclick=()=>{$('editPlayerPanel').classList.add('hide')};
$('savePlayerEdit').onclick=async()=>{try{const id=$('editPlayerId').value;const first_name=cleanName($('editFirst').value),last_name=cleanName($('editLast').value),team=$('editTeam').value.trim(),jersey=$('editJersey').value.trim();if(!id||!first_name||!last_name||!team)throw Error('First name, last name and team are required.');if(players.some(p=>p.id!==id&&cleanName(p.first_name).toLowerCase()===first_name.toLowerCase()&&cleanName(p.last_name).toLowerCase()===last_name.toLowerCase()&&p.team.toLowerCase()===team.toLowerCase()))throw Error('A player with this name already exists on that team.');check(await db.from('pd_players').update({first_name,last_name,team,jersey:jersey||null}).eq('id',id).eq('org',org));$('editPlayerPanel').classList.add('hide');await loadAll();message('Player updated. Existing evaluations preserved.')}catch(e){error(e)}};
$('template').onclick=()=>download('player_roster_template.csv','First Name,Last Name,Team,Jersey Number\r\nJane,Doe,14U A,12\r\n');
$('csv').onchange=async ev=>{try{const file=ev.target.files[0];if(!file)return;const bytes=await file.arrayBuffer();let raw=new TextDecoder('utf-8').decode(bytes);if(raw.includes('\uFFFD'))raw=new TextDecoder('windows-1252').decode(bytes);const rows=csvRows(raw.replace(/^\uFEFF/,'')),headers=rows.shift().map(s=>s.trim().toLowerCase().replace(/[^a-z]/g,''));const idx=(...names)=>headers.findIndex(h=>names.includes(h));const first=idx('firstname','first'),last=idx('lastname','last'),name=idx('name','playername'),team=idx('team','agegroup','division'),jersey=idx('jerseynumber','jersey','number');if(team<0||(name<0&&(first<0||last<0)))throw Error('CSV needs Team and Name or First Name / Last Name columns.');let added=0,skipped=0;for(const r of rows){const full=name>=0?(r[name]||'').trim().split(/\s+/):[];const f=cleanName(first>=0?r[first]:full[0]),l=cleanName(last>=0?r[last]:full.slice(1).join(' '));if(!f||!l||!r[team]){skipped++;continue}if(await addPlayer(f,l,r[team],jersey>=0?r[jersey]:'') )added++;else skipped++}await loadAll();$('importInfo').textContent=`Imported ${added} players; skipped ${skipped} duplicates/incomplete rows.`;message('Roster import finished')}catch(e){error(e)}finally{ev.target.value=''}};

$('evalPlayer').onchange=renderPrevious;
$('metricInputs').onchange=()=>{renderScoreComparison();syncSkillPlans()};
$('cancelEvaluationEdit').onclick=resetEvaluation;
$('saveEvaluation').onclick=async()=>{try{const id=$('evalPlayer').value;if(!id)throw Error('Select a player.');const scores={};document.querySelectorAll('[data-score]').forEach(s=>{if(s.value)scores[s.dataset.score]=Number(s.value)});if(!Object.keys(scores).length)throw Error('Score at least one criterion.');syncSkillPlans();const payload={org,player_id:id,skill_plans:skillPlanDrafts,evaluated_at:$('evalDate').value,setting:$('evalSetting').value,coach_email:session.user.email,scores,strengths:$('strengths').value,weaknesses:$('weaknesses').value,notes:$('coachNotes').value};const editId=$('editingEvaluationId').value;if(editId){check(await db.from('pd_evaluations').update(payload).eq('id',editId).eq('org',org))}else{check(await db.from('pd_evaluations').insert(payload))}resetEvaluation();await loadAll();$('progressPlayer').value=id;renderProgress();renderSavedEvaluations();$('planPlayer').value=id;setTab('progress');renderCompleteActions();message(editId?'Complete evaluation and all skill plans updated.':'Complete evaluation and all individual skill plans saved.')}catch(e){error(e)}};
$('progressPlayer').onchange=()=>{renderProgress();renderSavedEvaluations();renderCompleteActions()};
$('savedEvaluationList').onclick=e=>{const btn=e.target.closest('[data-edit-eval]');if(btn)startEditEvaluation(btn.dataset.editEval)};
$('printProgress').onclick=()=>{const e=playerEvaluations($('progressPlayer').value).at(-1);if(e)printCompleteEvaluation(e.id);else message('Select a player with a saved evaluation.')};
$('planPlayer').onchange=()=>{if(!$('editingPlanId').value)makePlanDraft()};
$('generatePlan').onclick=makePlanDraft;
$('cancelPlanEdit').onclick=resetPlan;
$('savePlan').onclick=async()=>{try{if(!$('planPlayer').value||!$('planMetric').value||!$('planGoal').value.trim())throw Error('Choose a player, skill and goal.');const payload={org,player_id:$('planPlayer').value,metric_id:$('planMetric').value,target_date:$('targetDate').value||null,goal:$('planGoal').value,actions:stepsToText()||$('planActions').value,measure:$('planMeasure').value,coach_email:session.user.email};const editId=$('editingPlanId').value;if(editId){check(await db.from('pd_plans').update(payload).eq('id',editId).eq('org',org))}else{check(await db.from('pd_plans').insert({...payload,status:'Active'}))}resetPlan();await loadAll();message(editId?'Improvement plan updated':'Improvement plan saved for future access')}catch(e){error(e)}};

function printSavedPlan(id){
 const p=plans.find(x=>x.id===id);if(!p){message('Plan not found');return}
 const player=players.find(x=>x.id===p.player_id),metric=metrics.find(x=>x.id===p.metric_id);
 const steps=parseSavedSteps(p.actions);
 const stepMarkup=steps.map((s,i)=>`<div class="print-step"><strong>Step ${i+1}: ${escapeHtml(s.title)}</strong><p>${escapeHtml(s.description)}</p></div>`).join('');
 $('planPrintSheet').innerHTML=`<h1>PLAYER EVALUATION — IMPROVEMENT PLAN</h1><div class="print-meta"><div><strong>Player:</strong> ${escapeHtml(player?fullName(player):'Unknown Player')}</div><div><strong>Team:</strong> ${escapeHtml(player?.team||'—')}</div></div><div class="print-meta"><div><strong>Focus Skill:</strong> ${escapeHtml(metric?.name||'—')}</div><div><strong>Review Date:</strong> ${escapeHtml(p.target_date||'Not set')}</div><div><strong>Status:</strong> ${escapeHtml(p.status||'Active')}</div></div><h2>Measurable Goal</h2><p>${escapeHtml(p.goal||'—')}</p><h2>Development Steps</h2>${stepMarkup}<h2>Success Measure</h2><p>${escapeHtml(p.measure||'—')}</p><div class="print-signatures"><span>Coach Signature / Date</span><span>Player / Parent Acknowledgment</span></div>`;
 document.body.classList.add('printing-plan');
 const cleanup=()=>{document.body.classList.remove('printing-plan');window.removeEventListener('afterprint',cleanup)};
 window.addEventListener('afterprint',cleanup);
 window.print();
}
$('planList').onclick=async e=>{const print=e.target.closest('[data-print-plan]');if(print){printSavedPlan(print.dataset.printPlan);return}const edit=e.target.closest('[data-edit-plan]');if(edit){startEditPlan(edit.dataset.editPlan);return}const btn=e.target.closest('[data-complete]');if(!btn)return;try{const p=plans.find(p=>p.id===btn.dataset.complete);check(await db.from('pd_plans').update({status:p.status==='Complete'?'Active':'Complete'}).eq('id',p.id).eq('org',org));await loadAll()}catch(e){error(e)}};
$('addMetric').onclick=async()=>{try{const name=$('metricName').value.trim();if(!name)throw Error('Enter a criterion name.');check(await db.from('pd_metrics').insert({org,category:$('metricCategory').value,name,description:$('metricDesc').value.trim(),active:true}));$('metricName').value='';$('metricDesc').value='';await loadAll();message('Criterion added')}catch(e){error(e)}};
$('libraryRows').onchange=async e=>{const id=e.target.dataset.toggle;if(!id)return;try{check(await db.from('pd_metrics').update({active:e.target.checked}).eq('id',id).eq('org',org));await loadAll()}catch(err){error(err)}};
$('evalDate').value=new Date().toLocaleDateString('en-CA');
const saved=localStorage.getItem('playerdev_config');if(saved){try{const {url,key}=JSON.parse(saved);initDb(url,key);restore()}catch(e){error(e);visible('configPanel')}}else visible('configPanel')


$("completeEvalActions").addEventListener("click",event=>{const btn=event.target.closest("[data-print-all-plans]");if(btn)printAllCategoryPlans(btn.dataset.printAllPlans)});
