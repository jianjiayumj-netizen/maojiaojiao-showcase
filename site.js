(()=>{
'use strict';
const $=(s,p=document)=>p.querySelector(s),$$=(s,p=document)=>[...p.querySelectorAll(s)];
const reduced=matchMedia('(prefers-reduced-motion: reduce)');
const names=['封面','角色介绍','色彩系统','标准三视图','毛发细节','开心动作','九种表情','抱抱动作','甜品场景','海边场景','森林场景','星空场景','帆布包与鸭舌帽','书包','T 恤','数码产品','保温杯','居家产品','角色服装延展','结束页'];
const pad=n=>String(n).padStart(2,'0');
const progress=()=>{const max=document.documentElement.scrollHeight-innerHeight;$('.progress span').style.width=`${max>0?scrollY/max*100:0}%`};
addEventListener('scroll',progress,{passive:true});addEventListener('resize',progress);addEventListener('load',progress);progress();
const reveal=new IntersectionObserver(es=>es.forEach(e=>{if(e.isIntersecting){e.target.classList.add('in');reveal.unobserve(e.target)}}),{threshold:.08});$$('.reveal').forEach(e=>reveal.observe(e));
const nav=$('#chapterNav'),menu=$('.menu-toggle');
function closeMenu(focus=false){nav.classList.remove('open');menu.setAttribute('aria-expanded','false');if(focus)menu.focus()}
menu.onclick=()=>{const open=nav.classList.toggle('open');menu.setAttribute('aria-expanded',String(open))};
$$('a',nav).forEach(a=>a.onclick=()=>closeMenu());
document.addEventListener('click',e=>{if(!nav.contains(e.target)&&!menu.contains(e.target))closeMenu()});
document.addEventListener('keydown',e=>{if(e.key==='Escape'&&nav.classList.contains('open'))closeMenu(true)});
nav.addEventListener('focusout',e=>{if(!nav.contains(e.relatedTarget)&&e.relatedTarget!==menu)closeMenu()});
matchMedia('(min-width:801px)').addEventListener('change',()=>closeMenu());
const sectionObserver=new IntersectionObserver(es=>es.forEach(e=>{if(e.isIntersecting){$$('a',nav).forEach(a=>{if(a.hash==='#'+e.target.id)a.setAttribute('aria-current','location');else a.removeAttribute('aria-current')})}}),{rootMargin:'-20% 0px -60%'});$$('main section[id]').forEach(e=>sectionObserver.observe(e));

const moodNames=['开心','生气','震惊','委屈','贪吃','害羞','卖萌','吓唬人','求抱抱'];
const moodCopy=['把快乐张开，让绒毛一起跳起来。','气鼓鼓，也毛茸茸。','哇，发生了什么？','想要一点安慰。','发现好吃的啦。','有一点点害羞。','挥挥手，看看我。','张牙舞爪的小怪兽。','靠近一点，抱抱你。'];
let moodRequest=0;
function selectMood(i){
 const request=++moodRequest,status=$('#moodStatus'),img=$('#moodImage');status.textContent='正在准备表情…';$('.mood-art').setAttribute('aria-busy','true');
 const next=new Image();next.onload=()=>{if(request!==moodRequest)return;img.src=next.src;img.alt='毛角角：'+moodNames[i];$('#moodTitle').textContent=moodNames[i];$('#moodCopy').textContent=moodCopy[i];$('.mood-number').textContent=pad(i+1)+' / 09';status.textContent='';$('.mood-art').setAttribute('aria-busy','false');$$('#moodButtons button').forEach((b,n)=>{b.classList.toggle('active',n===i);b.setAttribute('aria-pressed',String(n===i))});if(!reduced.matches)img.animate([{opacity:.5,transform:'translateY(8px)'},{opacity:1,transform:'translateY(0)'}],{duration:250})};
 next.onerror=()=>{if(request!==moodRequest)return;status.textContent='表情加载失败，请再次选择重试。';$('.mood-art').setAttribute('aria-busy','false')};next.src=`assets/mood${i+1}.webp`;
}
moodNames.forEach((name,i)=>{const b=document.createElement('button');b.type='button';b.textContent=name;b.setAttribute('aria-pressed',String(i===0));b.classList.toggle('active',i===0);b.onclick=()=>selectMood(i);$('#moodButtons').append(b)});$('#moodTitle').setAttribute('aria-live','polite');
$('#moodImage').addEventListener('error',()=>{$('#moodStatus').textContent='表情加载失败，请再次选择重试。'});

const track=$('#sceneTrack'),scenes=$$('.scene',track);let sceneIndex=0,timer;
function setScene(n,scroll=true){sceneIndex=(n+scenes.length)%scenes.length;scenes.forEach((s,i)=>s.classList.toggle('active',i===sceneIndex));$('#sceneNo').textContent=pad(sceneIndex+1);$('#sceneTitle').textContent=scenes[sceneIndex].dataset.title;if(scroll)track.scrollTo({left:scenes[sceneIndex].offsetLeft,behavior:reduced.matches?'instant':'smooth'})}
$('[data-prev]').onclick=()=>setScene(sceneIndex-1);$('[data-next]').onclick=()=>setScene(sceneIndex+1);
track.addEventListener('keydown',e=>{if(['ArrowLeft','ArrowRight'].includes(e.key)){e.preventDefault();setScene(sceneIndex+(e.key==='ArrowRight'?1:-1))}});
track.addEventListener('scroll',()=>{clearTimeout(timer);timer=setTimeout(()=>{const x=track.scrollLeft;let best=0;scenes.forEach((s,i)=>{if(Math.abs(s.offsetLeft-x)<Math.abs(scenes[best].offsetLeft-x))best=i});setScene(best,false)},100)},{passive:true});
$$('[data-filter]').forEach(btn=>{btn.setAttribute('aria-pressed',String(btn.classList.contains('active')));btn.onclick=()=>{$$('[data-filter]').forEach(b=>{b.classList.toggle('active',b===btn);b.setAttribute('aria-pressed',String(b===btn))});$$('.product').forEach(p=>{p.hidden=btn.dataset.filter!=='all'&&!p.dataset.cat.split(' ').includes(btn.dataset.filter)});progress()}});

const box=$('#lightbox'),stage=$('.viewer-stage'),viewer=$('img',stage),status=$('#viewerStatus'),index=$('#indexPanel');
let scale=1,x=0,y=0,currentPage=null,loadId=0,returnFocus=null;
const points=new Map();let gesture=null;
function limits(){const ratio=viewer.naturalWidth&&viewer.naturalHeight?Math.min(stage.clientWidth/viewer.naturalWidth,stage.clientHeight/viewer.naturalHeight):1;return {x:Math.max(0,(viewer.naturalWidth*ratio*scale-stage.clientWidth)/2),y:Math.max(0,(viewer.naturalHeight*ratio*scale-stage.clientHeight)/2)}}
function paint(){const limit=limits();x=Math.max(-limit.x,Math.min(limit.x,x));y=Math.max(-limit.y,Math.min(limit.y,y));viewer.style.transform=`translate(${x}px,${y}px) scale(${scale})`;stage.classList.toggle('zoomed',scale>1);$('[data-view="reset"]').textContent=scale===1?'适合':scale.toFixed(1)+'×';$('[data-view="minus"]').disabled=scale<=1;$('[data-view="plus"]').disabled=scale>=4}
viewer.addEventListener('load',paint);
function reset(){scale=1;x=y=0;points.clear();gesture=null;paint()}
function zoom(value){scale=Math.min(4,Math.max(1,value));paint()}
function loadPicture(src,caption){const id=++loadId;reset();status.textContent='图片加载中…';viewer.style.visibility='hidden';stage.setAttribute('aria-busy','true');$('#lightbox>p').textContent=caption;$('#originalLink').href=src;viewer.alt=caption;const next=new Image();next.onload=()=>{if(id!==loadId)return;viewer.src=src;viewer.style.visibility='visible';status.textContent='';stage.setAttribute('aria-busy','false');paint()};next.onerror=()=>{if(id!==loadId)return;status.textContent='图片暂时无法加载，可点「原图」重试。';stage.setAttribute('aria-busy','false')};next.src=src}
function openPicture(src,caption,opener){returnFocus=opener||document.activeElement;const match=src.match(/p(\d{2})\.webp$/);currentPage=match?Number(match[1]):null;$$('[data-view="prev"],[data-view="next"]').forEach(b=>b.hidden=currentPage===null);box.showModal();loadPicture(currentPage?`assets/full/p${pad(currentPage)}.png`:src,caption)}
function page(delta){if(currentPage===null)return;currentPage=(currentPage-1+delta+20)%20+1;loadPicture(`assets/full/p${pad(currentPage)}.png`,`${pad(currentPage)} / 20 · ${names[currentPage-1]}`)}
$$('[data-lightbox]').forEach(el=>{if(el.tagName!=='BUTTON'){el.tabIndex=0;el.setAttribute('role','button');el.setAttribute('aria-label','放大查看：'+el.dataset.caption);el.addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();el.click()}})}el.onclick=()=>openPicture(el.dataset.lightbox,el.dataset.caption,el)});
$('.close',box).onclick=()=>box.close();box.addEventListener('close',()=>{++loadId;reset();returnFocus?.focus({preventScroll:true})});
$$('[data-view]').forEach(b=>b.onclick=()=>{switch(b.dataset.view){case 'prev':page(-1);break;case 'next':page(1);break;case 'minus':zoom(scale-.5);break;case 'plus':zoom(scale+.5);break;default:reset()}});
box.addEventListener('keydown',e=>{if(['ArrowLeft','ArrowRight','+','-','0'].includes(e.key)){e.preventDefault();if(e.key==='ArrowLeft')page(-1);if(e.key==='ArrowRight')page(1);if(e.key==='+')zoom(scale+.5);if(e.key==='-')zoom(scale-.5);if(e.key==='0')reset()}});
stage.addEventListener('wheel',e=>{e.preventDefault();zoom(scale+(e.deltaY<0?.2:-.2))},{passive:false});
function beginGesture(){const p=[...points.values()];if(p.length===2)gesture={type:'pinch',distance:Math.hypot(p[1].x-p[0].x,p[1].y-p[0].y)||1,scale,x,y,cx:(p[0].x+p[1].x)/2,cy:(p[0].y+p[1].y)/2};else if(p.length===1)gesture={type:'drag',cx:p[0].x,cy:p[0].y,x,y};else gesture=null}
stage.addEventListener('pointerdown',e=>{if(points.size>=2||e.button>0)return;points.set(e.pointerId,{x:e.clientX,y:e.clientY});stage.setPointerCapture(e.pointerId);beginGesture()});
stage.addEventListener('pointermove',e=>{if(!points.has(e.pointerId))return;points.set(e.pointerId,{x:e.clientX,y:e.clientY});const p=[...points.values()];if(gesture?.type==='pinch'&&p.length===2){scale=Math.min(4,Math.max(1,gesture.scale*Math.hypot(p[1].x-p[0].x,p[1].y-p[0].y)/gesture.distance));x=gesture.x+(p[0].x+p[1].x)/2-gesture.cx;y=gesture.y+(p[0].y+p[1].y)/2-gesture.cy}else if(gesture?.type==='drag'&&scale>1){x=gesture.x+p[0].x-gesture.cx;y=gesture.y+p[0].y-gesture.cy}paint()});
function endPointer(e){points.delete(e.pointerId);beginGesture()}['pointerup','pointercancel','lostpointercapture'].forEach(event=>stage.addEventListener(event,endPointer));addEventListener('resize',()=>{if(box.open)paint()});
names.forEach((name,i)=>{const b=document.createElement('button'),img=document.createElement('img'),label=document.createElement('span');b.type='button';img.loading='lazy';img.decoding='async';img.width=1122;img.height=1402;img.alt='';img.src=`assets/p${pad(i+1)}.webp`;label.textContent=`${pad(i+1)} · ${name}`;b.append(img,label);b.onclick=()=>{index.close();openPicture(img.getAttribute('src'),name,$('[data-open-index]'))};$('#indexGrid').append(b)});
$('[data-open-index]').onclick=()=>{closeMenu();index.showModal()};$('.close',index).onclick=()=>index.close();index.addEventListener('click',e=>{const r=index.getBoundingClientRect();if(e.target===index&&(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom))index.close()});
})();
