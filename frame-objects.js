/* Frame-mode image object import. Existing frame drawing and JSON format remain unchanged. */
(() => {
'use strict';
function init(){
 const draw=document.getElementById('draw'), stage=draw?.parentElement,toolbar=document.querySelector('.toolbar');
 if(!draw||!stage||!toolbar)return;
 const controls=document.createElement('div');controls.className='toolbar';controls.id='frameObjectControls';
 controls.innerHTML='<label class="filebtn">🖼 이미지 개체 불러오기<input id="foImport" type="file" accept="image/png,image/jpeg,image/webp,image/gif" multiple></label><button id="foSelect" type="button">↔ 개체 이동</button><label>크기 % <input type="number" id="foScale" min="5" max="500" value="100"></label><label>회전 ° <input type="number" id="foRotate" min="-360" max="360" value="0"></label><button id="foApply" type="button">✓ 프레임에 적용</button><button id="foDiscard" type="button">✕ 개체 취소</button><span class="small" id="foStatus" role="status"></span>';
 toolbar.insertAdjacentElement('afterend',controls);
 const overlay=document.createElement('canvas');overlay.width=800;overlay.height=450;overlay.setAttribute('aria-label','이미지 개체 이동 및 편집');overlay.style.cssText='z-index:3;pointer-events:none;cursor:move';stage.append(overlay);
 const c=overlay.getContext('2d'),importer=document.getElementById('foImport'),select=document.getElementById('foSelect'),scale=document.getElementById('foScale'),rotate=document.getElementById('foRotate'),apply=document.getElementById('foApply'),discard=document.getElementById('foDiscard'),status=document.getElementById('foStatus');
 let objects=[],active=-1,drag=null,moving=false,previousTool=null;
 const selected=()=>objects[active];
 function paint(target,handles){target.clearRect(0,0,800,450);objects.forEach((o,i)=>{target.save();target.translate(o.x,o.y);target.rotate(o.rotation*Math.PI/180);const k=o.scale/100;target.scale(k,k);target.drawImage(o.img,-o.w/2,-o.h/2,o.w,o.h);if(handles&&i===active){target.strokeStyle='#745fe0';target.lineWidth=2/k;target.setLineDash([6/k,4/k]);target.strokeRect(-o.w/2,-o.h/2,o.w,o.h)}target.restore()})}
 function redraw(){paint(c,true);const o=selected();if(o){scale.value=o.scale;rotate.value=o.rotation}overlay.style.pointerEvents=objects.length&&moving?'auto':'none';select.classList.toggle('active',moving)}
 function reset(){objects=[];active=-1;drag=null;moving=false;redraw()}
 function point(e){const r=overlay.getBoundingClientRect();return{x:(e.clientX-r.left)*800/r.width,y:(e.clientY-r.top)*450/r.height}}
 function hit(o,p){const a=-o.rotation*Math.PI/180,dx=p.x-o.x,dy=p.y-o.y,k=o.scale/100;return Math.abs(dx*Math.cos(a)-dy*Math.sin(a))<=o.w*k/2&&Math.abs(dx*Math.sin(a)+dy*Math.cos(a))<=o.h*k/2}
 select.onclick=()=>{moving=!moving;redraw();status.textContent=moving?'개체를 드래그해서 이동하세요':'그리기 도구 사용 가능'};
 overlay.onpointerdown=e=>{const p=point(e);for(let i=objects.length-1;i>=0;i--){if(hit(objects[i],p)){active=i;drag={dx:p.x-objects[i].x,dy:p.y-objects[i].y};overlay.setPointerCapture(e.pointerId);redraw();break}}};
 overlay.onpointermove=e=>{if(!drag)return;const p=point(e),o=selected();if(!o)return;o.x=p.x-drag.dx;o.y=p.y-drag.dy;redraw()};
 overlay.onpointerup=overlay.onpointercancel=()=>drag=null;
 scale.onchange=()=>{const o=selected();if(!o)return;o.scale=Math.max(5,Math.min(500,Number(scale.value)||100));redraw()};
 rotate.onchange=()=>{const o=selected();if(!o)return;o.rotation=Math.max(-360,Math.min(360,Number(rotate.value)||0));redraw()};
 importer.onchange=async e=>{const files=Array.from(e.target.files||[]).slice(0,8);for(const f of files){try{if(f.size>12e6)throw Error('12MB 이하 파일만 불러올 수 있어요');const url=URL.createObjectURL(f);let img;try{img=await new Promise((res,rej)=>{const v=new Image();v.onload=()=>res(v);v.onerror=()=>rej(Error('이미지를 읽을 수 없어요'));v.src=url})}finally{URL.revokeObjectURL(url)}const k=Math.min(1,300/Math.max(img.naturalWidth,img.naturalHeight));objects.push({img,w:img.naturalWidth*k,h:img.naturalHeight*k,x:400,y:225,scale:100,rotation:0});active=objects.length-1;moving=true;status.textContent=objects.length+'개 이미지 개체 · 적용하면 현재 프레임에 합쳐져요';redraw()}catch(err){status.textContent='⚠ '+err.message}}e.target.value=''};
 apply.onclick=()=>{if(!objects.length)return;const target=draw.getContext('2d');try{const temp=document.createElement('canvas');temp.width=800;temp.height=450;paint(temp.getContext('2d'),false);target.drawImage(temp,0,0);window.dispatchEvent(new Event('fw-frame-object-commit'));reset();status.textContent='✓ 현재 프레임에 이미지가 적용되고 자동 저장됐어요'}catch(err){status.textContent='⚠ 적용 실패: '+err.message}};
 discard.onclick=()=>{reset();status.textContent='개체 편집 취소'};
 // Prevent object previews from carrying over to another frame or playback.
 document.getElementById('timeline')?.addEventListener('click',e=>{if(e.target.closest('.frame')){if(objects.length)status.textContent='프레임을 변경해 미적용 개체가 취소됐어요';reset()}});
 ['add','duplicate','remove','prev','next','play','stop','load'].forEach(id=>document.getElementById(id)?.addEventListener('click',()=>{if(objects.length){reset();status.textContent='다른 작업으로 이동해 미적용 개체가 취소됐어요'}}));
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);else init();
})();