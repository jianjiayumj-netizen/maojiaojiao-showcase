(()=>{
 'use strict';
 const area=document.querySelector('.gaze-hero'),video=document.querySelector('#gazeVideo');
 if(!area||!video)return;
 video.autoplay=false;video.controls=false;video.muted=true;video.playsInline=true;video.pause();
 const reduced=matchMedia('(prefers-reduced-motion: reduce)');
 // Calibrated on the new video's first, right-to-left pass. Compress its central hold
 // into a narrow pointer interval; never seek into the return pass.
 const anchors=[[0,0],[.25,.35],[.5,.65],[.53,1.4],[.75,1.9],[1,2.70]];
 let ready=false,position=.5,target=.5,raf=0,last=0,active=false;
 function timeAt(p){for(let i=1;i<anchors.length;i++){const [x,t]=anchors[i], [a,b]=anchors[i-1];if(p<=x)return b+(t-b)*(p-a)/(x-a)}return anchors.at(-1)[1]}
 function seek(){
  if(!ready||video.seeking||!video.seekable.length)return;
  const end=Math.min(video.duration-1/24,video.seekable.end(video.seekable.length-1));
  const t=Math.max(video.seekable.start(0),Math.min(end,timeAt(position)));
  if(Math.abs(video.currentTime-t)<1/96)return;
  try{video.currentTime=t}catch{/* Retry when media reports a seekable range. */}
 }
 function tick(now){raf=0;const dt=Math.min(50,last?now-last:16);last=now;
  position=reduced.matches?target:position+(target-position)*(1-Math.exp(-dt/65));
  if(Math.abs(target-position)<.001)position=target;
  seek();if(active&&position!==target)raf=requestAnimationFrame(tick);
 }
 function schedule(){if(!raf){last=0;raf=requestAnimationFrame(tick)}}
 function available(){ready=Number.isFinite(video.duration)&&video.duration>0&&video.readyState>=2;video.pause();if(ready)schedule()}
 ['loadedmetadata','loadeddata','canplay','progress'].forEach(e=>video.addEventListener(e,available));
 video.addEventListener('seeked',()=>{if(ready)seek()});
 video.addEventListener('play',()=>video.pause());
 video.addEventListener('error',()=>{ready=false;cancelAnimationFrame(raf);raf=0});
 area.addEventListener('pointermove',e=>{const r=area.getBoundingClientRect();target=1-Math.max(0,Math.min(1,(e.clientX-r.left)/r.width));active=true;if(ready)schedule()},{passive:true});
 area.addEventListener('pointerleave',()=>{active=false;cancelAnimationFrame(raf);raf=0;target=position});
 video.addEventListener('keydown',e=>{if(!['ArrowLeft','ArrowRight','Home','End'].includes(e.key))return;e.preventDefault();target=e.key==='Home'?1:e.key==='End'?0:Math.max(0,Math.min(1,target+(e.key==='ArrowLeft'?.08:-.08)));active=true;schedule()});
 document.addEventListener('visibilitychange',()=>{if(document.hidden){active=false;cancelAnimationFrame(raf);raf=0;target=position}});
 available();
})();
