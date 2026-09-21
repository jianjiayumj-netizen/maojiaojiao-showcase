(()=>{
const q=s=>document.querySelector(s),all=s=>[...document.querySelectorAll(s)],reduce=matchMedia('(prefers-reduced-motion: reduce)');
const titles=['开心','生气','震惊','委屈','贪吃','害羞','卖萌','吓唬人','求抱抱'];
const copy=['把快乐张开。','气鼓鼓，也毛茸茸。','哇，发生了什么？','想要一点安慰。','发现好吃的啦。','有一点点害羞。','挥挥手，看看我。','张牙舞爪的小怪兽。','靠近一点，抱抱你。'];
titles.forEach((name,i)=>{const b=document.createElement('button');b.textContent=name;b.type='button';b.setAttribute('aria-pressed',String(i===0));b.classList.toggle('active',i===0);b.onclick=()=>{q('#moodImage').src=`assets/mood${i+1}.webp`;q('#moodImage').alt='毛角角：'+name;q('#moodTitle').textContent=name;q('#moodCopy').textContent=copy[i];all('#moodButtons button').forEach(x=>{x.classList.toggle('active',x===b);x.setAttribute('aria-pressed',String(x===b))});if(!reduce.matches)q('#moodImage').animate([{opacity:.5},{opacity:1}],{duration:220})};q('#moodButtons').append(b)});q('#moodTitle').setAttribute('aria-live','polite');
const menu=q('.menu-toggle'),nav=q('#chapterNav');menu.onclick=()=>{const open=nav.classList.toggle('open');menu.setAttribute('aria-expanded',String(open))};all('#chapterNav a').forEach(a=>a.onclick=()=>{nav.classList.remove('open');menu.setAttribute('aria-expanded','false')});
all('[data-filter]').forEach(b=>{b.setAttribute('aria-pressed',String(b.classList.contains('active')));b.addEventListener('click',()=>{all('[data-filter]').forEach(x=>x.setAttribute('aria-pressed',String(x===b)));all('.product').forEach(p=>p.classList.toggle('is-hidden',b.dataset.filter!=='all'&&!p.dataset.cat.split(' ').includes(b.dataset.filter)))})});
all('[data-lightbox]').filter(el=>el.tagName!=='BUTTON').forEach(el=>el.addEventListener('keydown',e=>{if(e.key===' '){e.preventDefault();el.click()}}));
const box=q('#lightbox'),stage=q('.viewer-stage'),img=q('.viewer-stage img');let scale=1,x=0,y=0,drag=null;
const names=['封面','角色介绍','色彩系统','标准三视图','毛发细节','开心动作','九种表情','抱抱动作','甜品场景','海边场景','森林场景','星空场景','帆布包与鸭舌帽','书包','T恤','数码产品','保温杯','居家产品','角色服装延展','结束页'];
function paint(){img.style.transform=`translate(${x}px,${y}px) scale(${scale})`;q('[data-view="reset"]').textContent=Math.round(scale*100)+'%';stage.classList.toggle('zoomed',scale>1)}
function reset(){scale=1;x=y=0;paint()}
function zoom(d){scale=Math.max(1,Math.min(4,scale+d));if(scale===1)x=y=0;paint()}
function page(d){const n=Number(img.getAttribute('src').match(/p(\d+)/)?.[1]||1);const next=(n-1+d+20)%20+1;img.src=`assets/p${String(next).padStart(2,'0')}.webp`;img.alt=names[next-1];q('#lightbox p').textContent=`${next} / 20 · ${names[next-1]}`;reset()}
all('[data-view]').forEach(b=>b.onclick=()=>{switch(b.dataset.view){case 'prev':page(-1);break;case 'next':page(1);break;case 'plus':zoom(.5);break;case 'minus':zoom(-.5);break;default:reset()}});
new MutationObserver(()=>{reset();img.alt=q('#lightbox p').textContent||'毛角角作品'}).observe(img,{attributes:true,attributeFilter:['src']});
stage.addEventListener('wheel',e=>{e.preventDefault();zoom(e.deltaY<0?.25:-.25)},{passive:false});stage.onpointerdown=e=>{if(scale<=1)return;drag={x:e.clientX,y:e.clientY,px:x,py:y};stage.setPointerCapture(e.pointerId)};stage.onpointermove=e=>{if(!drag)return;const mx=stage.clientWidth*(scale-1)/2,my=stage.clientHeight*(scale-1)/2;x=Math.max(-mx,Math.min(mx,drag.px+e.clientX-drag.x));y=Math.max(-my,Math.min(my,drag.py+e.clientY-drag.y));paint()};stage.onpointerup=stage.onpointercancel=()=>drag=null;box.onclose=reset;box.onkeydown=e=>{if(['ArrowLeft','ArrowRight','+','-'].includes(e.key)){e.preventDefault();if(e.key==='ArrowLeft')page(-1);if(e.key==='ArrowRight')page(1);if(e.key==='+')zoom(.5);if(e.key==='-')zoom(-.5)}};
all('#indexGrid img').forEach(i=>{i.loading='lazy';i.width=1122;i.height=1402});
let pending=false;addEventListener('scroll',()=>{if(pending||reduce.matches)return;pending=true;requestAnimationFrame(()=>{if(innerWidth>900&&scrollY<innerHeight*1.5)q('.hero-art').style.transform=`translateY(${Math.min(scrollY*.08,65)}px)`;pending=false})},{passive:true});
})();
