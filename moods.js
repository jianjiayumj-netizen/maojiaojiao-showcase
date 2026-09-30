(()=>{
'use strict';
const moods=[
 ['开心','HAPPY LITTLE MONSTER','快乐，藏不住。','开心到|每根毛都起飞。','今天的快乐有点多，分你一大半。','开心大笑，张开双手'],
 ['生气','A LITTLE GRUMPY','哼！我有小情绪。','气鼓鼓，|也想被哄哄。','先让我鼓一会儿，再给我一个抱抱。','握紧双拳，气鼓鼓地瞪眼'],
 ['震惊','WAIT… WHAT?','我的眼睛都圆了！','等一下，|让我缓一缓。','消息太突然，绒毛比我先反应过来。','睁大独眼，惊讶地向后弹起'],
 ['委屈','HANDLE WITH CARE','今天需要一点偏爱。','小小委屈，|想被你接住。','不用急着讲道理，陪我待一会儿就好。','眼含泪水，嘴角下撇'],
 ['贪吃','SNACK TIME','这一口，留给我！','眼里有光，|因为看见了吃的。','肚子还没说话，眼睛已经替我点单了。','望着美食，张嘴流口水'],
 ['害羞','A LITTLE SHY','别看啦，脸都热了。','被夸一下，|就软成一团。','嘴上说没有，脸颊已经悄悄变红。','半眯独眼，捂脸害羞'],
 ['打招呼','HELLO THERE','嗨！很高兴见到你。','挥挥手，|今天也要开心。','没什么大事，就是想和你打个招呼。','抬眼卖萌，举手打招呼'],
 ['吓唬人','BOO!','嗷呜！被我吓到了吗？','我超凶的，|只有一点点软。','张牙舞爪练习中，欢迎假装被吓到。','张嘴露牙，举起双爪'],
 ['求抱抱','HUG ME PLEASE','抱一下，就充满电。','双手张开，|等你靠过来。','今天的拥抱额度，全部都留给你。','向前张开双手，索要拥抱']
];
const $=s=>document.querySelector(s),pad=n=>String(n).padStart(2,'0');
const img=$('#moodImage'),status=$('#moodStatus'),art=$('.mood-art'),buttons=$('#moodButtons'),zoom=$('#moodZoom'),download=$('#moodDownload');
const src=i=>`assets/mood-posters/${pad(i+1)}.webp`;
let requestId=0,selected=0;
function selectMood(i){
 const id=++requestId,next=new Image();
 status.textContent='正在准备这份心情…';art.setAttribute('aria-busy','true');
 next.onload=()=>{
  if(id!==requestId)return;
  selected=i;const [name,english,word,headline,copy,alt]=moods[i];
  img.src=src(i);img.alt='毛角角：'+alt;
  $('#moodTitle').textContent=name;$('#moodEnglish').textContent=english;$('#moodWord').textContent=word;
  const parts=headline.split('|');$('#moodHeadline').replaceChildren(document.createTextNode(parts[0]),document.createElement('br'),document.createTextNode(parts[1]));
  $('#moodCopy').textContent=copy;$('.mood-number').textContent=pad(i+1)+' / 09';
  $('.mood-console').dataset.mood=String(i);
  zoom.dataset.lightbox=src(i);zoom.dataset.caption=name+' · '+word;zoom.setAttribute('aria-label','放大查看：'+name);
  download.href=src(i);download.download='毛角角-'+name+'.webp';
  [...buttons.children].forEach((b,n)=>{b.classList.toggle('active',n===i);b.setAttribute('aria-pressed',String(n===i))});
  status.textContent='';art.setAttribute('aria-busy','false');
 };
 next.onerror=()=>{if(id!==requestId)return;status.textContent='这份心情加载失败，请再点一次重试。';art.setAttribute('aria-busy','false')};
 next.src=src(i);
}
moods.forEach(([name],i)=>{
 const button=document.createElement('button'),thumb=document.createElement('img'),label=document.createElement('span');
 button.type='button';button.setAttribute('aria-pressed',String(i===0));button.setAttribute('aria-label','切换心情：'+name);button.classList.toggle('active',i===0);
 thumb.src=src(i);thumb.alt='';thumb.width=48;thumb.height=48;thumb.loading='lazy';thumb.decoding='async';label.textContent=name;
 button.append(thumb,label);button.onclick=()=>selectMood(i);buttons.append(button);
});
buttons.addEventListener('keydown',e=>{
 const current=[...buttons.children].indexOf(document.activeElement);if(current<0)return;
 let next=current;
 if(e.key==='ArrowRight')next=(current+1)%9;else if(e.key==='ArrowLeft')next=(current+8)%9;
 else if(e.key==='ArrowDown')next=(current+3)%9;else if(e.key==='ArrowUp')next=(current+6)%9;
 else if(e.key==='Home')next=0;else if(e.key==='End')next=8;else return;
 e.preventDefault();buttons.children[next].focus();selectMood(next);
});
$('#moodTitle').setAttribute('aria-live','polite');
img.addEventListener('error',()=>{status.textContent='图片加载失败，请选择心情重试。'});
})();
