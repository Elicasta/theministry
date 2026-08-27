const ALIGNMENT_SPLIT_VERSES=[
{group:'Primary Text · Matthew 8:5–13',ref:'Matthew 8:5',text:'And when Jesus was entered into Capernaum, there came unto him a centurion, beseeching him,'},
{group:'Primary Text · Matthew 8:5–13',ref:'Matthew 8:6',text:'And saying, Lord, my servant lieth at home sick of the palsy, grievously tormented.'},
{group:'Primary Text · Matthew 8:5–13',ref:'Matthew 8:7',text:'And Jesus saith unto him, I will come and heal him.'},
{group:'Primary Text · Matthew 8:5–13',ref:'Matthew 8:8',text:'The centurion answered and said, Lord, I am not worthy that thou shouldest come under my roof: but speak the word only, and my servant shall be healed.'},
{group:'Primary Text · Matthew 8:5–13',ref:'Matthew 8:9',text:'For I am a man under authority, having soldiers under me: and I say to this man, Go, and he goeth; and to another, Come, and he cometh; and to my servant, Do this, and he doeth it.'},
{group:'Primary Text · Matthew 8:5–13',ref:'Matthew 8:10',text:'When Jesus heard it, he marvelled, and said to them that followed, Verily I say unto you, I have not found so great faith, no, not in Israel.'},
{group:'Primary Text · Matthew 8:5–13',ref:'Matthew 8:11',text:'And I say unto you, That many shall come from the east and west, and shall sit down with Abraham, and Isaac, and Jacob, in the kingdom of heaven.'},
{group:'Primary Text · Matthew 8:5–13',ref:'Matthew 8:12',text:'But the children of the kingdom shall be cast out into outer darkness: there shall be weeping and gnashing of teeth.'},
{group:'Primary Text · Matthew 8:5–13',ref:'Matthew 8:13',text:'And Jesus said unto the centurion, Go thy way; and as thou hast believed, so be it done unto thee. And his servant was healed in the selfsame hour.'},
{group:'Submission & Self-Government',ref:'James 4:7',text:'Submit yourselves therefore to God. Resist the devil, and he will flee from you.'},
{group:'Submission & Self-Government',ref:'Proverbs 25:28',text:'He that hath no rule over his own spirit is like a city that is broken down, and without walls.'},
{group:'Submission & Self-Government',ref:'Proverbs 16:32',text:'He that is slow to anger is better than the mighty; and he that ruleth his spirit than he that taketh a city.'},
{group:'Assignment & Service',ref:'Matthew 10:1',text:'And when he had called unto him his twelve disciples, he gave them power against unclean spirits, to cast them out, and to heal all manner of sickness and all manner of disease.'},
{group:'Assignment & Service',ref:'Matthew 10:5',text:'These twelve Jesus sent forth, and commanded them, saying, Go not into the way of the Gentiles, and into any city of the Samaritans enter ye not:'},
{group:'Assignment & Service',ref:'Matthew 10:6',text:'But go rather to the lost sheep of the house of Israel.'},
{group:'Assignment & Service',ref:'Matthew 10:7',text:'And as ye go, preach, saying, The kingdom of heaven is at hand.'},
{group:'Assignment & Service',ref:'Matthew 10:8',text:'Heal the sick, cleanse the lepers, raise the dead, cast out devils: freely ye have received, freely give.'},
{group:'Assignment & Service',ref:'Luke 16:10',text:'He that is faithful in that which is least is faithful also in much: and he that is unjust in the least is unjust also in much.'},
{group:'Discipleship & Preference',ref:'Matthew 10:24',text:'The disciple is not above his master, nor the servant above his lord.'},
{group:'Discipleship & Preference',ref:'Matthew 10:25',text:'It is enough for the disciple that he be as his master, and the servant as his lord. If they have called the master of the house Beelzebub, how much more shall they call them of his household?'},
{group:'Discipleship & Preference',ref:'Matthew 10:37',text:'He that loveth father or mother more than me is not worthy of me: and he that loveth son or daughter more than me is not worthy of me.'},
{group:'Discipleship & Preference',ref:'Matthew 10:38',text:'And he that taketh not his cross, and followeth after me, is not worthy of me.'},
{group:'Discipleship & Preference',ref:'Matthew 10:39',text:'He that findeth his life shall lose it: and he that loseth his life for my sake shall find it.'}
];

function alignmentSafeHtml(value){return String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));}

window.pushAlignmentVerse=function(index){
  const verse=ALIGNMENT_SPLIT_VERSES[index];
  if(!verse)return;
  try{
    state.overlay={ref:verse.ref,text:verse.text};
    state.black=false;
    state.activePoll=null;
    state.activeQuestion=null;
    send();
  }catch(e){
    console.error('Alignment verse push failed',e);
  }
};

function rebuildAlignmentVerseBank(){
  const outputs=document.querySelector('.outputs');
  if(outputs)outputs.remove();
  const list=document.getElementById('verse-list');
  if(!list)return;
  let currentGroup='';
  list.innerHTML=ALIGNMENT_SPLIT_VERSES.map((verse,index)=>{
    const group=verse.group!==currentGroup?(currentGroup=verse.group,`<div class="alignment-v-group">${alignmentSafeHtml(verse.group)}</div>`):'';
    return `${group}<div class="verse-row"><div class="v-ref">${alignmentSafeHtml(verse.ref)}</div><div class="v-text">${alignmentSafeHtml(verse.text)}</div><button class="btn small" onclick="pushAlignmentVerse(${index})">Push Everywhere</button></div>`;
  }).join('');
  if(!document.getElementById('alignment-remote-cleanup-style')){
    const style=document.createElement('style');
    style.id='alignment-remote-cleanup-style';
    style.textContent='.alignment-v-group{margin:16px 0 2px;padding:10px 3px 7px;border-bottom:1px solid rgba(207,173,110,.32);font-family:var(--fc);font-size:.58rem;font-weight:900;letter-spacing:.16em;text-transform:uppercase;color:var(--gold)}.alignment-v-group:first-child{margin-top:2px}.verse-row{padding-top:12px;padding-bottom:12px}.v-text{font-size:.78rem;line-height:1.42}';
    document.head.appendChild(style);
  }
}

rebuildAlignmentVerseBank();