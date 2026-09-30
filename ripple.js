// Video-backed adaptation of the supplied RippleDistortion wave/falloff idea.
// Kept independent of React so the existing static showcase remains lightweight.
(()=>{
 'use strict';
 const hero=document.querySelector('.gaze-hero'),video=document.querySelector('#gazeVideo');
 const reduced=matchMedia('(prefers-reduced-motion: reduce)');
 if(!hero||!video||reduced.matches)return;
 const canvas=document.createElement('canvas');canvas.className='hero-ripple';canvas.setAttribute('aria-hidden','true');
 const gl=canvas.getContext('webgl',{alpha:false,antialias:false,depth:false,powerPreference:'low-power'});
 if(!gl)return;
 let program,texture,buffer,disposed=false,raf=0,dirty=true,lastPoint=null;
 const waves=[],count=24,packed=new Float32Array(count*4);
 function shader(type,source){const s=gl.createShader(type);gl.shaderSource(s,source);gl.compileShader(s);if(!gl.getShaderParameter(s,gl.COMPILE_STATUS))throw Error('Ripple shader unavailable');return s}
 try{
  const vs=shader(gl.VERTEX_SHADER,'attribute vec2 p; varying vec2 uv; void main(){uv=(p+1.0)*0.5;gl_Position=vec4(p,0.,1.);}');
  const fs=shader(gl.FRAGMENT_SHADER,`precision mediump float;
  varying vec2 uv;uniform sampler2D frame;uniform vec2 size;uniform vec4 waves[24];
  void main(){vec2 offset=vec2(0.);float sheen=0.;
   for(int i=0;i<24;i++){vec4 w=waves[i];vec2 d=(uv-w.xy)*size;float r=length(d)/max(w.z,1.);float fall=exp(-r*r*5.);float ring=sin(r*28.);float a=fall*w.w;
    offset+=normalize(d+vec2(.001))*ring*a*2.8/size;sheen+=max(0.,ring)*a;}
   vec3 color=texture2D(frame,clamp(uv+offset,vec2(.001),vec2(.999))).rgb;
   color+=vec3(.09,.22,.32)*min(sheen,.45);gl_FragColor=vec4(color,1.);}`);
  program=gl.createProgram();gl.attachShader(program,vs);gl.attachShader(program,fs);gl.linkProgram(program);
  gl.deleteShader(vs);gl.deleteShader(fs);if(!gl.getProgramParameter(program,gl.LINK_STATUS))throw Error('Ripple linking failed');
  gl.useProgram(program);buffer=gl.createBuffer();gl.bindBuffer(gl.ARRAY_BUFFER,buffer);gl.bufferData(gl.ARRAY_BUFFER,new Float32Array([-1,-1,1,-1,-1,1,-1,1,1,-1,1,1]),gl.STATIC_DRAW);
  const p=gl.getAttribLocation(program,'p');gl.enableVertexAttribArray(p);gl.vertexAttribPointer(p,2,gl.FLOAT,false,0,0);
  texture=gl.createTexture();gl.bindTexture(gl.TEXTURE_2D,texture);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MIN_FILTER,gl.LINEAR);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MAG_FILTER,gl.LINEAR);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_S,gl.CLAMP_TO_EDGE);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_T,gl.CLAMP_TO_EDGE);gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL,true);
 }catch{canvas.remove();return}
 const sizeLoc=gl.getUniformLocation(program,'size'),waveLoc=gl.getUniformLocation(program,'waves[0]');
 hero.insertBefore(canvas,hero.querySelector('.gaze-editorial'));
 function resize(){const r=hero.getBoundingClientRect(),dpr=Math.min(devicePixelRatio||1,1.5);canvas.width=Math.round(r.width*dpr);canvas.height=Math.round(r.height*dpr);gl.viewport(0,0,canvas.width,canvas.height);gl.uniform2f(sizeLoc,r.width,r.height);dirty=true}
 const observer=new ResizeObserver(resize);observer.observe(hero);resize();
 function clear(){cancelAnimationFrame(raf);raf=0;waves.length=0;lastPoint=null;canvas.style.opacity='0'}
 function draw(now){raf=0;if(disposed||document.hidden||reduced.matches){clear();return}
  while(waves.length&&now-waves[0].time>1100)waves.shift();
  if(!waves.length){clear();return}
  packed.fill(0);waves.forEach((w,i)=>{const age=(now-w.time)/1100;packed.set([w.x,w.y,36+age*90,Math.pow(1-age,2)*.75],i*4)});
  // Never play the video: copy only decoded frames supplied by the gaze scrubber.
  if(dirty&&video.readyState>=2){try{gl.texImage2D(gl.TEXTURE_2D,0,gl.RGB,gl.RGB,gl.UNSIGNED_BYTE,video);dirty=false}catch{clear();return}}
  if(video.readyState>=2&&!dirty){gl.uniform4fv(waveLoc,packed);gl.drawArrays(gl.TRIANGLES,0,6);canvas.style.opacity='1'}
  raf=requestAnimationFrame(draw);
 }
 function move(e){if(disposed||reduced.matches||e.pointerType==='touch')return;const r=hero.getBoundingClientRect(),x=e.clientX-r.left,y=e.clientY-r.top;if(x<0||y<0||x>r.width||y>r.height)return;
  if(lastPoint&&Math.hypot(x-lastPoint.x,y-lastPoint.y)<10)return;lastPoint={x,y};if(waves.length===count)waves.shift();waves.push({x:x/r.width,y:1-y/r.height,time:performance.now()});if(!raf)raf=requestAnimationFrame(draw);
 }
 const invalidate=()=>{dirty=true};const leave=()=>{lastPoint=null};
 hero.addEventListener('pointermove',move,{passive:true});hero.addEventListener('pointerleave',leave);
 video.addEventListener('seeked',invalidate);video.addEventListener('loadeddata',invalidate);
 document.addEventListener('visibilitychange',()=>{if(document.hidden)clear()});reduced.addEventListener('change',clear);
 canvas.addEventListener('webglcontextlost',e=>{e.preventDefault();disposed=true;clear();canvas.remove()});
 window.addEventListener('pagehide',()=>{clear();dirty=true});
})();
