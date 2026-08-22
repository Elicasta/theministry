(function(){
  'use strict';
  if(window.__lwpEnhancementsInstalled)return;
  window.__lwpEnhancementsInstalled=true;

  /* Anonymous question display */
  state.activeQuestion=null;
  const projector=document.getElementById('projector');
  if(projector&&!document.getElementById('question-wall')){
    const wall=document.createElement('div');
    wall.id='question-wall';
    wall.className='question-wall hidden';
    wall.innerHTML='<div class="question-wall-inner"><div class="question-wall-kicker">Anonymous Question</div><div id="question-wall-text" class="question-wall-text"></div><div class="question-wall-rule"></div><div class="question-wall-foot">Living With Purpose · Anonymous Q&amp;A</div></div>';
    const blackout=document.getElementById('blackout');
    if(blackout)projector.insertBefore(wall,blackout);else projector.appendChild(wall);
  }

  function questionKey(q,i){return String((q&&(q.id||q.client_question_id||q.question_id))||i)}
  function questionIsLive(q,i){return !!state.activeQuestion&&state.activeQuestion.id===questionKey(q,i)}
  function renderQuestionWall(){
    const wall=document.getElementById('question-wall');
    if(!wall)return;
    if(state.activeQuestion&&String(state.activeQuestion.text||'').trim()){
      const text=document.getElementById('question-wall-text');
      if(text){
        const value=String(state.activeQuestion.text).trim();
        text.textContent=value;
        text.classList.toggle('question-medium',value.length>180&&value.length<=430);
        text.classList.toggle('question-long',value.length>430);
      }
      wall.classList.remove('hidden');
    }else wall.classList.add('hidden');
  }

  window.displayQuestion=function(i){
    const q=questionRows&&questionRows[i];
    if(!q||!String(q.text||'').trim())return;
    state.overlay=null;
    state.black=false;
    state.constellation=null;
    state.activePoll=null;
    state.activeQuestion={id:questionKey(q,i),text:String(q.text).trim()};
    send();
  };
  window.closeQuestion=function(){state.activeQuestion=null;send()};

  const baseRenderRemoteData=renderRemoteData;
  renderRemoteData=function(){
    baseRenderRemoteData();
    const list=document.getElementById('question-list');
    if(list&&Array.isArray(questionRows)){
      const items=[...list.querySelectorAll('.qa-item')];
      items.forEach((item,i)=>{
        const q=questionRows[i];
        if(!q)return;
        const live=questionIsLive(q,i);
        item.classList.toggle('question-live',live);
        let actions=item.querySelector('.qa-actions');
        if(!actions){actions=document.createElement('div');actions.className='qa-actions';item.appendChild(actions)}
        actions.innerHTML='';
        const button=document.createElement('button');
        button.className='btn small '+(live?'on':'primary');
        button.textContent=live?'Hide from Main':'Display on Main';
        button.addEventListener('click',()=>live?closeQuestion():displayQuestion(i));
        actions.appendChild(button);
      });
    }
    updateConstellationQuickControl();
  };

  const baseSetRemoteCue=setRemoteCue;
  setRemoteCue=function(){
    baseSetRemoteCue();
    if(state.activeQuestion){
      const num=document.getElementById('now-num'),title=document.getElementById('now-title'),type=document.getElementById('now-type'),notes=document.getElementById('now-notes'),cue=document.getElementById('next-cue'),next=document.getElementById('next-btn');
      if(num)num.textContent='Q';
      if(title)title.textContent='Anonymous Question';
      if(type)type.textContent='Live question · main screen';
      if(notes)notes.textContent=state.activeQuestion.text;
      if(cue)cue.innerHTML='<strong>Next</strong>Hide question and return to slide';
      if(next)next.textContent='Hide Question';
    }
    updateConstellationQuickControl();
  };

  const baseSetProjector=setProjector;
  setProjector=function(){baseSetProjector();renderQuestionWall()};

  const baseGoTo=goTo;
  goTo=function(i){state.activeQuestion=null;return baseGoTo(i)};
  const baseNextSlide=nextSlide;
  nextSlide=async function(){if(state.activeQuestion){closeQuestion();return}return baseNextSlide()};
  const basePrevSlide=prevSlide;
  prevSlide=function(){if(state.activeQuestion){closeQuestion();return}return basePrevSlide()};
  const basePushVerse=pushVerse;
  pushVerse=function(i){state.activeQuestion=null;return basePushVerse(i)};
  const baseToggleBlack=toggleBlack;
  toggleBlack=function(){state.activeQuestion=null;return baseToggleBlack()};
  const baseLaunchPoll=launchPoll;
  launchPoll=function(id){state.activeQuestion=null;return baseLaunchPoll(id)};
  const baseShowPollResults=showPollResults;
  showPollResults=async function(id){state.activeQuestion=null;return baseShowPollResults(id)};
  const baseRevealConstellation=revealConstellation;
  revealConstellation=async function(){state.activeQuestion=null;return baseRevealConstellation()};
  const baseToggleConstellation=toggleConstellation;
  toggleConstellation=async function(){state.activeQuestion=null;return baseToggleConstellation()};

  /* Always-visible constellation control */
  function ensureConstellationQuickControl(){
    if(view!=='remote')return null;
    let button=document.getElementById('lwp-constellation-quick');
    if(button)return button;
    const controls=document.querySelector('.controls');
    if(!controls)return null;
    button=document.createElement('button');
    button.id='lwp-constellation-quick';
    button.type='button';
    button.className='lwp-constellation-quick';
    button.innerHTML='<span class="lwp-constellation-quick-main"><span class="lwp-constellation-quick-ey">Purpose Journey</span><span class="lwp-constellation-quick-title">Reveal Opening Constellation</span></span><span class="lwp-constellation-quick-count">0</span>';
    button.addEventListener('click',()=>toggleConstellation());
    controls.insertAdjacentElement('afterend',button);
    return button;
  }

  function updateConstellationQuickControl(){
    const button=ensureConstellationQuickControl();
    if(!button)return;
    const open=!!state.constellation?.open;
    const finalPhase=!!(state.started&&Number(state.slide)>=42);
    const count=Array.isArray(purposeVotes)?purposeVotes.length:0;
    const ey=button.querySelector('.lwp-constellation-quick-ey');
    const title=button.querySelector('.lwp-constellation-quick-title');
    const badge=button.querySelector('.lwp-constellation-quick-count');
    button.classList.toggle('on',open);
    if(ey)ey.textContent=open?'Main Screen Active':finalPhase?'Final Purpose Journey':'Opening Purpose Journey';
    if(title)title.textContent=open?'Close Constellation':finalPhase?'Reveal Final Constellation':'Reveal Opening Constellation';
    if(badge)badge.textContent=String(count);
  }

  /* Presentation sync hardening */
  const SYNC_FRESH_MS=2*60*60*1000;
  const ALLOWED_CLOCK_SKEW_MS=5*60*1000;
  const WRITE_TIMEOUT_MS=3200;
  const READ_TIMEOUT_MS=2800;
  const remoteSession='lwp_'+Date.now().toString(36)+'_'+Math.random().toString(36).slice(2,9);
  let syncSeq=0;
  let pendingMsg=null;
  let writeBusy=false;
  let lastAppliedTs=0;
  let lastAppliedSession='';
  let lastAppliedSeq=0;

  function normalizeModes(){
    if(state.black){state.overlay=null;state.activePoll=null;state.activeQuestion=null;state.constellation=null;return}
    if(state.activeQuestion){state.overlay=null;state.activePoll=null;state.constellation=null;return}
    if(state.constellation&&state.constellation.open){state.overlay=null;state.activePoll=null;state.activeQuestion=null;return}
    if(state.activePoll&&state.activePoll.id){state.overlay=null;state.activeQuestion=null;state.constellation=null;return}
    if(state.overlay){state.activePoll=null;state.activeQuestion=null;state.constellation=null}
  }

  async function timedFetch(url,opts,timeout){
    const controller=new AbortController();
    const timer=setTimeout(()=>controller.abort(),timeout);
    try{return await fetch(url,{...(opts||{}),signal:controller.signal})}
    finally{clearTimeout(timer)}
  }

  async function flushLatest(){
    if(view!=='remote'||writeBusy||!pendingMsg||!sbUrl||!sbKey)return;
    writeBusy=true;
    const msg=pendingMsg;
    try{
      const r=await timedFetch(sbUrl+'/rest/v1/sync_state',{
        method:'POST',
        headers:{'Content-Type':'application/json','apikey':sbKey,'Authorization':'Bearer '+sbKey,'Prefer':'resolution=merge-duplicates,return=minimal'},
        body:JSON.stringify({id:1,payload:JSON.stringify(msg),updated_at:new Date().toISOString()})
      },WRITE_TIMEOUT_MS);
      if(!r.ok)throw new Error('sync '+r.status);
      if(pendingMsg===msg)pendingMsg=null;
      try{setStatus(true,'Live sync')}catch(e){}
    }catch(e){
      try{setStatus(false,navigator.onLine?'Retrying sync':'Offline · retrying')}catch(x){}
    }finally{
      writeBusy=false;
      if(pendingMsg)setTimeout(flushLatest,120);
    }
  }

  send=function(){
    normalizeModes();
    state.ts=Date.now();
    state.sync={session:remoteSession,seq:++syncSeq};
    const msg={type:'lwp_state',room:ROOM,state:payload()};
    try{if(!bc)bc=new BroadcastChannel(CHANNEL);bc.postMessage(msg)}catch(e){}
    pendingMsg=msg;
    flushLatest();
    if(view==='remote'){
      try{setRemoteCue()}catch(e){console.error('Remote cue render failed',e)}
    }
  };

  const baseHandle=handle;
  handle=function(msg){
    if(!msg||msg.type!=='lwp_state'||msg.room!==ROOM||!msg.state)return;
    const incoming=msg.state;
    const meta=incoming.sync||null;
    const ts=Number(incoming.ts)||0;
    if(meta&&meta.session){
      const seq=Number(meta.seq)||0;
      if(meta.session===lastAppliedSession&&seq&&seq<=lastAppliedSeq)return;
      if(ts&&lastAppliedTs&&ts<lastAppliedTs)return;
      lastAppliedSession=String(meta.session);
      lastAppliedSeq=seq;
    }else if(ts&&lastAppliedTs&&ts<=lastAppliedTs)return;
    if(ts)lastAppliedTs=Math.max(lastAppliedTs,ts);
    try{return baseHandle(msg)}catch(e){
      console.error('Presentation state render failed',e);
      try{state={...state,...incoming};if(view==='remote')setRemoteCue();else setProjector()}catch(x){console.error('Presentation recovery render failed',x)}
    }
  };

  async function readLatestState(){
    if(view!=='projector'||document.hidden||!sbUrl||!sbKey)return;
    try{
      const r=await timedFetch(sbUrl+'/rest/v1/sync_state?id=eq.1&select=payload',{headers:{apikey:sbKey,Authorization:'Bearer '+sbKey},cache:'no-store'},READ_TIMEOUT_MS);
      if(!r.ok)return;
      const rows=await r.json();
      const raw=rows&&rows[0]&&rows[0].payload;
      const msg=typeof raw==='string'?JSON.parse(raw):raw;
      if(!msg||msg.type!=='lwp_state'||msg.room!==ROOM||!msg.state)return;
      const age=Date.now()-(Number(msg.state.ts)||0);
      if(age>-ALLOWED_CLOCK_SKEW_MS&&age<SYNC_FRESH_MS)handle(msg);
    }catch(e){}
  }

  function guardFunction(name,delay){
    const fn=window[name];
    if(typeof fn!=='function')return;
    let last=0;
    window[name]=function(){
      const now=performance.now();
      if(now-last<delay)return;
      last=now;
      return fn.apply(this,arguments);
    };
  }

  if(view==='remote'){
    state.overlay=null;
    state.black=false;
    state.constellation=null;
    state.activePoll=null;
    state.activeQuestion=null;
    ensureConstellationQuickControl();
    updateConstellationQuickControl();
    ['nextSlide','prevSlide','goTo','pushVerse','toggleBlack','launchPoll','showPollResults','displayQuestion','revealConstellation','toggleConstellation'].forEach(name=>guardFunction(name,180));
    setInterval(flushLatest,1500);
    window.addEventListener('online',()=>{flushLatest();setTimeout(()=>send(),120)});
    document.addEventListener('visibilitychange',()=>{
      if(!document.hidden){
        try{loadRemoteData()}catch(e){}
        flushLatest();
        setTimeout(()=>send(),180);
      }
    });
    window.addEventListener('pageshow',()=>{flushLatest()});
  }else{
    setInterval(readLatestState,2500);
    document.addEventListener('visibilitychange',()=>{if(!document.hidden)readLatestState()});
    window.addEventListener('online',readLatestState);
    setTimeout(readLatestState,900);
  }

  window.addEventListener('error',e=>console.error('Presentation runtime error',e.error||e.message));
  window.addEventListener('unhandledrejection',e=>console.error('Presentation async error',e.reason));

  if(document.getElementById('remote')){renderRemoteData();setRemoteCue();updateConstellationQuickControl()}
  if(projector)renderQuestionWall();
})();