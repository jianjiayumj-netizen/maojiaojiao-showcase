// brushSize=80, strength=.035, swirl=1.7, rings=2.75, spread=7.25, spacing=8
// dispersion=1, glint=1.5, tint=#5e50ff, tintAmount=.4, highlight=#d98dff
// grayscale=true, quality=medium (.7 displacement sampling), fade=3.
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
 const waves=[],count=100,packed=new Float32Array(count*4);
 function shader(type,source){const s=gl.createShader(type);gl.shaderSource(s,source);gl.compileShader(s);if(!gl.getShaderParameter(s,gl.COMPILE_STATUS))throw Error('Ripple shader unavailable');return s}
 try{
  const vs=shader(gl.VERTEX_SHADER,'attribute vec2 p; varying vec2 uv; void main(){uv=(p+1.0)*0.5;gl_Position=vec4(p,0.,1.);}');
  const fs=shader(gl.FRAGMENT_SHADER,`precision mediump float;
  varying vec2 uv;uniform sampler2D frame;uniform vec2 size;uniform vec4 waves[100];
  float field(vec2 at){float amount=0.;for(int i=0;i<100;i++){vec4 w=waves[i];if(w.w<.002)continue;float r=length((at-w.xy)*size)/max(w.z,1.);if(r>1.)continue;float brush=(exp(-r*r*5.)-.006737947)/(1.-.006737947);brush*=.55+.45*cos(r*6.2831853*2.75);amount+=brush*w.w*w.w;}return clamp(amount,0.,1.);}
  void main(){float amount=field(uv);float theta=amount*1.7*6.2831853;vec2 push=vec2(sin(theta),cos(theta))*amount*.035;
   vec3 color; color.r=texture2D(frame,clamp(uv+push*1.25,vec2(.001),vec2(.999))).r;color.g=texture2D(frame,clamp(uv+push,vec2(.001),vec2(.999))).g;color.b=texture2D(frame,clamp(uv+push*.75,vec2(.001),vec2(.999))).b;
   color=vec3(dot(color,vec3(.2126,.7152,.0722)));
   color=mix(color,color*vec3(.368627,.313725,1.)*1.9,clamp(amount*1.6,0.,1.)*.4);
   vec2 texel=1./(size*.7);float ex=field(uv+vec2(texel.x,0.))-field(uv-vec2(texel.x,0.));float ey=field(uv+vec2(0.,texel.y))-field(uv-vec2(0.,texel.y));vec3 normal=normalize(vec3(-ex*26.,-ey*26.,1.));vec3 light=normalize(vec3(-.35,.55,1.));float raw=pow(max(dot(normal,light),0.),22.);float flatSpec=pow(light.z,22.);color+=vec3(.85098,.55294,1.)*clamp((raw-flatSpec)/(1.-flatSpec),0.,1.)*1.5;
   gl_FragColor=vec4(color,1.);}`);
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
  while(waves.length&&now-waves[0].time>3000)waves.shift();
  if(!waves.length){clear();return}
  packed.fill(0);waves.forEach((w,i)=>{const age=(now-w.time)/1000;const scale=1.5+(1.5*7.25-1.5)*(1-Math.exp(-age*1.09));packed.set([w.x,w.y,scale*80/2,Math.exp(-age*Math.log(500)/3)],i*4)});
  // Never play the video: copy only decoded frames supplied by the gaze scrubber.
  if(dirty&&video.readyState>=2){try{gl.texImage2D(gl.TEXTURE_2D,0,gl.RGB,gl.RGB,gl.UNSIGNED_BYTE,video);dirty=false}catch{clear();return}}
  if(video.readyState>=2&&!dirty){gl.uniform4fv(waveLoc,packed);gl.drawArrays(gl.TRIANGLES,0,6);canvas.style.opacity='1'}
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
