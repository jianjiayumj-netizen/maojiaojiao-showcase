const $=(s,p=document)=>p.querySelector(s), $$=(s,p=document)=>[...p.querySelectorAll(s)];
const progress=$('.progress span');
addEventListener('scroll',()=>{const max=document.documentElement.scrollHeight-innerHeight;progress.style.width=`${max?scrollY/max*100:0}%`},{passive:true});

const io=new IntersectionObserver(entries=>entries.forEach(e=>{if(e.isIntersecting)e.target.classList.add('in')}),{threshold:.12});
$$('.reveal').forEach(el=>io.observe(el));

const sections=$$('[data-section]'), sectionName=$('#sectionName'), sectionNo=$('.section-label span');
const sectionIo=new IntersectionObserver(entries=>entries.forEach(e=>{if(e.isIntersecting){const i=sections.indexOf(e.target);sectionName.textContent=e.target.dataset.section;sectionNo.textContent=String(i+1).padStart(2,'0')}}),{rootMargin:'-40% 0px -55%'});
sections.forEach(s=>sectionIo.observe(s));

const moods={happy:'#ffd24d',angry:'#ff795d',shock:'#76c9ff',sad:'#aabcf5',hungry:'#ff9868',cute:'#f6a8c6'};
$$('[data-mood]').filter(x=>x.tagName==='BUTTON').forEach(btn=>btn.addEventListener('click',()=>{
  $$('.mood-buttons button').forEach(b=>b.classList.toggle('active',b===btn));
  $('.mood-console').dataset.mood=btn.dataset.mood; $('.mood-console').style.background=moods[btn.dataset.mood];
  $('#moodTitle').textContent=btn.dataset.title; $('#moodWord').textContent=btn.dataset.title; $('#moodCopy').textContent=btn.dataset.copy;
  $('#moodImage').animate([{transform:'scale(1)'},{transform:'scale(1.035)'},{transform:'scale(1)'}],{duration:520,easing:'cubic-bezier(.2,.8,.2,1)'});
}));

const track=$('#sceneTrack'), scenes=$$('.scene',track); let sceneIndex=0;
function setScene(i,scroll=true){sceneIndex=(i+scenes.length)%scenes.length;scenes.forEach((s,n)=>s.classList.toggle('active',n===sceneIndex));$('#sceneNo').textContent=String(sceneIndex+1).padStart(2,'0');$('#sceneTitle').textContent=scenes[sceneIndex].dataset.title;if(scroll)scenes[sceneIndex].scrollIntoView({behavior:'smooth',block:'nearest',inline:'start'})}
$('[data-prev]').onclick=()=>setScene(sceneIndex-1);$('[data-next]').onclick=()=>setScene(sceneIndex+1);
track.addEventListener('keydown',e=>{if(e.key==='ArrowRight')setScene(sceneIndex+1);if(e.key==='ArrowLeft')setScene(sceneIndex-1)});
let sceneTimer;track.addEventListener('scroll',()=>{clearTimeout(sceneTimer);sceneTimer=setTimeout(()=>{const x=track.scrollLeft;let best=0,dist=Infinity;scenes.forEach((s,i)=>{const d=Math.abs(s.offsetLeft-x-track.offsetLeft);if(d<dist){dist=d;best=i}});setScene(best,false)},90)},{passive:true});

$$('[data-filter]').forEach(btn=>btn.addEventListener('click',()=>{$$('[data-filter]').forEach(b=>b.classList.toggle('active',b===btn));$$('.product').forEach(p=>p.classList.toggle('is-hidden',btn.dataset.filter!=='all'&&p.dataset.cat!==btn.dataset.filter))}));

const lightbox=$('#lightbox');function openLightbox(src,caption){$('img',lightbox).src=src;$('p',lightbox).textContent=caption||'';lightbox.showModal()}
$$('[data-lightbox]').forEach(el=>{el.tabIndex=0;el.setAttribute('role','button');el.addEventListener('click',()=>openLightbox(el.dataset.lightbox,el.dataset.caption));el.addEventListener('keydown',e=>{if(e.key==='Enter')openLightbox(el.dataset.lightbox,el.dataset.caption)})});
$('.close',lightbox).onclick=()=>lightbox.close();lightbox.addEventListener('click',e=>{if(e.target===lightbox)lightbox.close()});

const names=['封面','角色介绍','色彩系统','标准三视图','毛发细节','开心动作','九种表情','抱抱动作','甜品场景','海边场景','森林场景','星空场景','帆布包与鸭舌帽','书包','T 恤','数码产品','保温杯','居家产品','角色服装延展','结束页'];
const indexPanel=$('#indexPanel'),indexGrid=$('#indexGrid');names.forEach((name,i)=>{const b=document.createElement('button');b.innerHTML=`<img src="assets/p${String(i+1).padStart(2,'0')}.webp" alt=""><span>${String(i+1).padStart(2,'0')} · ${name}</span>`;b.onclick=()=>{indexPanel.close();openLightbox(`assets/p${String(i+1).padStart(2,'0')}.webp`,name)};indexGrid.appendChild(b)});
$('[data-open-index]').onclick=()=>indexPanel.showModal();$('.close',indexPanel).onclick=()=>indexPanel.close();indexPanel.addEventListener('click',e=>{if(e.target===indexPanel)indexPanel.close()});
