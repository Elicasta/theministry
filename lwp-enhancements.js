(function(){
  'use strict';
  if(window.__lwpEnhancementsInstalled)return;
  window.__lwpEnhancementsInstalled=true;

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

  if(view==='remote'){
    state.activeQuestion=null;
    ensureConstellationQuickControl();
    renderRemoteData();
    setRemoteCue();
  }
  if(projector)renderQuestionWall();
})();