// brushSize=80, strength=.035, swirl=1.7, rings=2.75, spread=7.25, spacing=8
// dispersion=1, glint=1.5, tint=#5e50ff, tintAmount=.4, highlight=#d98dff
// grayscale=false, quality=medium (.7 displacement sampling), fade=3.
// trigger=hover (default): clickStrength=1.5 is inactive, as in the supplied component.
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
 const waves=[],count=32;
 const fieldCanvas=document.createElement('canvas'),ctx=fieldCanvas.getContext('2d');
 const stamp=document.createElement('canvas');stamp.width=stamp.height=128;
 const sc=stamp.getContext('2d'),pixels=sc.createImageData(128,128);
 for(let y=0;y<128;y++)for(let x=0;x<128;x++){const r=Math.hypot((x-63.5)/64,(y-63.5)/64);const a=r>1?0:(Math.exp(-r*r*5)-Math.exp(-5))/(1-Math.exp(-5))*(.55+.45*Math.cos(r*Math.PI*2*2.75));const n=(y*128+x)*4;pixels.data[n]=pixels.data[n+1]=pixels.data[n+2]=255;pixels.data[n+3]=Math.round(a*255)}sc.putImageData(pixels,0,0);
 let fieldTexture,lastDraw=0;
 function shader(type,source){const s=gl.createShader(type);gl.shaderSource(s,source);gl.compileShader(s);if(!gl.getShaderParameter(s,gl.COMPILE_STATUS))throw Error('Ripple shader unavailable');return s}
 try{
  const vs=shader(gl.VERTEX_SHADER,'attribute vec2 p; varying vec2 uv; void main(){uv=(p+1.0)*0.5;gl_Position=vec4(p,0.,1.);}');
  const fs=shader(gl.FRAGMENT_SHADER,`precision mediump float;
  varying vec2 uv;uniform sampler2D frame;uniform vec2 size;uniform sampler2D displacement;
  float field(vec2 at){return texture2D(displacement,at).r;}
  void main(){float amount=field(uv);float theta=amount*1.7*6.2831853;vec2 push=vec2(sin(theta),cos(theta))*amount*.035;
   vec3 color; color.r=texture2D(frame,clamp(uv+push*1.25,vec2(.001),vec2(.999))).r;color.g=texture2D(frame,clamp(uv+push,vec2(.001),vec2(.999))).g;color.b=texture2D(frame,clamp(uv+push*.75,vec2(.001),vec2(.999))).b;
   // Preserve the original video colors.
   color=mix(color,color*vec3(.368627,.313725,1.)*1.9,clamp(amount*1.6,0.,1.)*.4);
   vec2 texel=1./(size*.7);float ex=field(uv+vec2(texel.x,0.))-field(uv-vec2(texel.x,0.));float ey=field(uv+vec2(0.,texel.y))-field(uv-vec2(0.,texel.y));vec3 normal=normalize(vec3(-ex*26.,-ey*26.,1.));vec3 light=normalize(vec3(-.35,.55,1.));float raw=pow(max(dot(normal,light),0.),22.);float flatSpec=pow(light.z,22.);color+=vec3(.85098,.55294,1.)*clamp((raw-flatSpec)/(1.-flatSpec),0.,1.)*1.5;
   gl_FragColor=vec4(color,1.);}`);
  program=gl.createProgram();gl.attachShader(program,vs);gl.attachShader(program,fs);gl.linkProgram(program);
  gl.deleteShader(vs);gl.deleteShader(fs);if(!gl.getProgramParameter(program,gl.LINK_STATUS))throw Error('Ripple linking failed');
  gl.useProgram(program);buffer=gl.createBuffer();gl.bindBuffer(gl.ARRAY_BUFFER,buffer);gl.bufferData(gl.ARRAY_BUFFER,new Float32Array([-1,-1,1,-1,-1,1,-1,1,1,-1,1,1]),gl.STATIC_DRAW);
  const p=gl.getAttribLocation(program,'p');gl.enableVertexAttribArray(p);gl.vertexAttribPointer(p,2,gl.FLOAT,false,0,0);
  texture=gl.createTexture();gl.bindTexture(gl.TEXTURE_2D,texture);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MIN_FILTER,gl.LINEAR);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MAG_FILTER,gl.LINEAR);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_S,gl.CLAMP_TO_EDGE);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_T,gl.CLAMP_TO_EDGE);gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL,true);
 }catch{canvas.remove();return}
 const sizeLoc=gl.getUniformLocation(program,'size');
 gl.uniform1i(gl.getUniformLocation(program,'frame'),0);gl.uniform1i(gl.getUniformLocation(program,'displacement'),1);
 fieldTexture=gl.createTexture();gl.activeTexture(gl.TEXTURE1);gl.bindTexture(gl.TEXTURE_2D,fieldTexture);for(const p of [gl.TEXTURE_MIN_FILTER,gl.TEXTURE_MAG_FILTER])gl.texParameteri(gl.TEXTURE_2D,p,gl.LINEAR);for(const p of [gl.TEXTURE_WRAP_S,gl.TEXTURE_WRAP_T])gl.texParameteri(gl.TEXTURE_2D,p,gl.CLAMP_TO_EDGE);gl.activeTexture(gl.TEXTURE0);
 hero.insertBefore(canvas,hero.querySelector('.gaze-editorial'));
 new IntersectionObserver(es=>{if(!es[0].isIntersecting)clear()}).observe(hero);
 function resize(){const r=hero.getBoundingClientRect(),dpr=Math.min(1,1280/r.width);canvas.width=Math.round(r.width*dpr);canvas.height=Math.round(r.height*dpr);fieldCanvas.width=Math.min(384,Math.round(r.width*.4));fieldCanvas.height=Math.round(fieldCanvas.width*r.height/r.width);gl.viewport(0,0,canvas.width,canvas.height);gl.uniform2f(sizeLoc,r.width,r.height);dirty=true}
 const observer=new ResizeObserver(resize);observer.observe(hero);resize();
 function clear(){cancelAnimationFrame(raf);raf=0;waves.length=0;lastPoint=null;canvas.style.opacity='0'}
 function draw(now){raf=0;if(disposed||document.hidden||reduced.matches){clear();return}
  while(waves.length&&now-waves[0].time>3000)waves.shift();
  if(!waves.length){clear();return}
  if(now-lastDraw<33){raf=requestAnimationFrame(draw);return}lastDraw=now;
  ctx.globalCompositeOperation='source-over';ctx.globalAlpha=1;ctx.fillStyle='#000';ctx.fillRect(0,0,fieldCanvas.width,fieldCanvas.height);ctx.globalCompositeOperation='lighter';
  const ratio=fieldCanvas.width/hero.clientWidth;
  waves.forEach(w=>{const age=(now-w.time)/1000,scale=1.5+(1.5*7.25-1.5)*(1-Math.exp(-age*1.09)),diameter=scale*80*ratio;ctx.globalAlpha=Math.exp(-age*Math.log(500)/3)**2;ctx.drawImage(stamp,w.x*fieldCanvas.width-diameter/2,(1-w.y)*fieldCanvas.height-diameter/2,diameter,diameter)});
  gl.activeTexture(gl.TEXTURE1);gl.bindTexture(gl.TEXTURE_2D,fieldTexture);gl.texImage2D(gl.TEXTURE_2D,0,gl.RGB,gl.RGB,gl.UNSIGNED_BYTE,fieldCanvas);gl.activeTexture(gl.TEXTURE0);
  // Never play the video: copy only decoded frames supplied by the gaze scrubber.
  if(dirty&&video.readyState>=2){try{gl.texImage2D(gl.TEXTURE_2D,0,gl.RGB,gl.RGB,gl.UNSIGNED_BYTE,video);dirty=false}catch{clear();return}}
  if(video.readyState>=2&&!dirty){gl.drawArrays(gl.TRIANGLES,0,6);canvas.style.opacity='1'}
  raf=requestAnimationFrame(draw);
 }
 function move(e){if(disposed||reduced.matches||e.pointerType==='touch')return;const r=hero.getBoundingClientRect(),x=e.clientX-r.left,y=e.clientY-r.top;if(x<0||y<0||x>r.width||y>r.height)return;
  if(lastPoint&&Math.hypot(x-lastPoint.x,y-lastPoint.y)<8)return;lastPoint={x,y};if(waves.length===count)waves.shift();waves.push({x:x/r.width,y:1-y/r.height,time:performance.now()});if(!raf)raf=requestAnimationFrame(draw);
 }
 const invalidate=()=>{dirty=true};const leave=()=>{lastPoint=null};
 hero.addEventListener('pointermove',move,{passive:true});hero.addEventListener('pointerleave',leave);
 video.addEventListener('seeked',invalidate);video.addEventListener('loadeddata',invalidate);
 document.addEventListener('visibilitychange',()=>{if(document.hidden)clear()});reduced.addEventListener('change',clear);
 canvas.addEventListener('webglcontextlost',e=>{e.preventDefault();disposed=true;clear();canvas.remove()});
 window.addEventListener('pagehide',()=>{clear();dirty=true});
})();
