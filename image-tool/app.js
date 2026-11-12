(() => {
  'use strict';
  const C = window.ConverterCore;
  const $ = id => document.getElementById(id);
  const copy = v => JSON.parse(JSON.stringify(v));
  const esc = s => String(s).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  let type = 'image', settings = copy(C.defaults), view = 'output', jobs = [], nextJob = 1, loadToken = 0;
  let source = makeSample();
  function makeSample() {
    const canvas = document.createElement('canvas'); canvas.width = 960; canvas.height = 720;
    const x = canvas.getContext('2d');
    x.fillStyle='#e7e9db';x.beginPath();x.arc(480,340,270,0,Math.PI*2);x.fill();
    x.fillStyle='#a6b593';x.beginPath();x.ellipse(465,594,260,24,0,0,Math.PI*2);x.fill();
    x.strokeStyle='#526d42';x.lineWidth=8;x.lineCap='round';x.beginPath();x.moveTo(478,486);x.bezierCurveTo(505,352,439,236,525,133);x.stroke();
    const leaf=(cx,cy,rx,ry,r,col)=>{x.fillStyle=col;x.beginPath();x.ellipse(cx,cy,rx,ry,r,0,Math.PI*2);x.fill()};
    leaf(527,202,73,26,-.78,'#839b65');leaf(441,260,80,31,.55,'#627f4e');leaf(550,314,76,30,-.6,'#91a876');leaf(423,367,86,32,.55,'#77935b');
    x.fillStyle='#c97d57';x.beginPath();x.moveTo(373,447);x.lineTo(584,447);x.lineTo(560,570);x.quadraticCurveTo(478,619,397,570);x.closePath();x.fill();
    x.fillStyle='#dc936d';x.beginPath();x.ellipse(479,448,106,20,0,0,Math.PI*2);x.fill();x.fillStyle='#6d5540';x.beginPath();x.ellipse(479,448,83,11,0,0,Math.PI*2);x.fill();
    x.fillStyle='#536745';x.font='600 21px Segoe UI, sans-serif';x.textAlign='center';x.fillText('A LITTLE ROOM TO GROW',480,656);x.font='12px Segoe UI, sans-serif';x.fillStyle='#8a987e';x.fillText('ORIGINAL PROTOTYPE ARTWORK',480,678);
    return { image:canvas, width:960, height:720, name:'weekend-artwork.png', sample:true };
  }
  function say(message, error=false) { const n=$('notice');n.textContent=message;n.className='notice'+(error?' error':'');n.hidden=false; }
  function imageError() { return C.validateImage(settings.image); }
  function error() { return type==='image'?imageError():type==='pdf'?C.validatePdf(settings.pdf):C.validateVideo(settings.video); }
  function orientedRatio() { return settings.image.rotation % 180 ? source.height/source.width : source.width/source.height; }
  function renderImageCanvas(s, input=source) {
    const c=document.createElement('canvas');c.width=s.width;c.height=s.height;const x=c.getContext('2d');
    if (s.format==='jpeg') {x.fillStyle='#ffffff';x.fillRect(0,0,c.width,c.height);}
    x.imageSmoothingEnabled=true;x.imageSmoothingQuality='high';x.save();x.translate(c.width/2,c.height/2);x.rotate(s.rotation*Math.PI/180);
    const quarter=s.rotation%180!==0;
    x.drawImage(input.image,-(quarter?c.height:c.width)/2,-(quarter?c.width:c.height)/2,quarter?c.height:c.width,quarter?c.width:c.height);x.restore();
    if(s.caption.trim()) {const size=Math.max(10,Math.round(c.width/19));x.font=`700 ${size}px Segoe UI, sans-serif`;x.textAlign='center';x.textBaseline='middle';let text=s.caption.trim();while(x.measureText(text).width>c.width*.88&&text.length>1){text=text.slice(0,-1)}x.fillStyle='#20261ccc';x.fillRect(0,c.height-size*2,c.width,size*2);x.fillStyle='white';x.fillText(text,c.width/2,c.height-size);}
    return c;
  }
  function setType(t) {loadToken++;type=t;view='output';if(t==='image'){source=makeSample();settings.image=copy(C.defaults.image);}render();}
  function render() {
    const focusId=document.activeElement?.id;
    document.querySelectorAll('[data-type]').forEach(b=>{const selected=b.dataset.type===type&&(type!=='image'||source.sample);b.classList.toggle('selected',selected);b.setAttribute('aria-pressed',String(selected));});
    $('source-label').textContent=type==='image'?`${source.width} × ${source.height} · ${source.sample?'sample':'local image'}`:type==='pdf'?'Schematic layout · not a PDF':'Storyboard · not a video';
    $('preview-title').textContent=type==='image'?'Image preview':type==='pdf'?'Page selection':'Trim storyboard';
    $('preview-footnote').textContent=type==='image'?'Checkerboard = transparency · drop an image to replace':type==='pdf'?'Illustrative sample pages. No document was parsed.':'Synthetic still illustration. No video playback.';
    renderControls();renderPreview();updateSummary();
    if(focusId&&$(focusId))$(focusId).focus({preventScroll:true});
  }
  function renderControls() {
    let html='';
    if(type==='image') {const s=settings.image;html=`<div class="controls-inner"><div class="field-row"><div class="field"><label for="width">Width / px</label><input id="width" type="number" min="1" max="4096" step="1" value="${s.width}"></div><div class="field"><label for="height">Height / px</label><input id="height" type="number" min="1" max="4096" step="1" value="${s.height}"></div></div><label class="check-label"><input id="lock" type="checkbox" ${s.lock?'checked':''}> Keep original proportions</label><div class="preset-row"><button class="pill" id="half-size">Half size</button><button class="pill" id="square-size">512 square</button></div><label for="format">Save as</label><select id="format"><option value="png" ${s.format==='png'?'selected':''}>PNG · keep transparency</option><option value="jpeg" ${s.format==='jpeg'?'selected':''}>JPEG · white background</option></select><p class="field-help" id="format-help">${s.format==='png'?'Transparent areas remain transparent.':'Transparency is flattened onto white. JPEG uses 90% quality.'}</p><div class="rotate-row"><button id="rotate-left" aria-label="Rotate left 90 degrees">↶ 90°</button><button id="rotate-right" aria-label="Rotate right 90 degrees">↷ 90°</button></div><label for="caption">Add a caption <span style="font-weight:400">/ optional</span></label><input id="caption" type="text" maxlength="45" placeholder="Make it yours…" value="${esc(s.caption)}"><p class="field-help">Simple meme-style edit. Long captions may be shortened to fit.</p></div>`;
    } else if(type==='pdf') {const s=settings.pdf;html=`<div class="controls-inner"><p class="field-label">Operation</p><label class="radio-option"><input type="radio" name="pdf-operation" value="split" ${s.operation==='split'?'checked':''}> Extract selected pages</label><label class="radio-option"><input type="radio" name="pdf-operation" value="merge" ${s.operation==='merge'?'checked':''}> Merge sample documents</label><div class="rule"></div>${s.operation==='split'?'<p class="field-help">Choose pages in the preview. The plan keeps their original order in one proposed PDF.</p>':`<label class="check-label"><input id="appendix" type="checkbox" ${s.appendix?'checked':''}> Include two-page appendix</label><p class="field-help">Fixed order: Field notes first, then Appendix. Reordering is outside this slice.</p>`}<p class="warning">Planning mode only. Download is a JSON recipe, never a converted PDF.</p></div>`;
    } else {const s=settings.video;html=`<div class="controls-inner"><div class="field-row"><div class="field"><label for="start">Start / seconds</label><input id="start" type="number" min="0" max="12" step="0.1" value="${s.start}"></div><div class="field"><label for="end">End / seconds</label><input id="end" type="number" min="0" max="12" step="0.1" value="${s.end}"></div></div><label for="start-range">Trim start</label><input id="start-range" type="range" min="0" max="12" step="0.1" value="${s.start}"><label for="end-range">Trim end</label><input id="end-range" type="range" min="0" max="12" step="0.1" value="${s.end}"><div class="rule"></div><div class="field-row"><div class="field"><label for="fps">Frames / second</label><select id="fps">${[6,12,24].map(n=>`<option ${n===s.fps?'selected':''}>${n}</option>`).join('')}</select></div><div class="field"><label for="video-width">Width / px</label><select id="video-width">${[320,480,640].map(n=>`<option ${n===s.width?'selected':''}>${n}</option>`).join('')}</select></div></div><p class="warning">GIF is silent. This prototype has no video decoder or GIF encoder. Download is a JSON plan.</p></div>`;}
    $('controls').innerHTML=html;
    if(type==='image') {
      ['width','height'].forEach(key=>$(key).addEventListener('input',()=>{const n=$(key).valueAsNumber;settings.image[key]=n;const other=key==='width'?'height':'width';if(settings.image.lock&&Number.isFinite(n)&&n>0){settings.image[other]=Math.round(key==='width'?n/orientedRatio():n*orientedRatio());$(other).value=settings.image[other];}refresh();}));
      $('lock').addEventListener('change',()=>{settings.image.lock=$('lock').checked;if(settings.image.lock&&Number.isFinite(settings.image.width)){settings.image.height=Math.round(settings.image.width/orientedRatio());$('height').value=settings.image.height;}refresh();});
      $('format').addEventListener('change',()=>{settings.image.format=$('format').value;$('format-help').textContent=settings.image.format==='png'?'Transparent areas remain transparent.':'Transparency is flattened onto white. JPEG uses 90% quality.';refresh();});
      $('caption').addEventListener('input',()=>{settings.image.caption=$('caption').value;refresh();});
      $('half-size').addEventListener('click',()=>{const quarter=settings.image.rotation%180;settings.image.width=Math.max(1,Math.round((quarter?source.height:source.width)/2));settings.image.height=Math.max(1,Math.round((quarter?source.width:source.height)/2));settings.image.lock=true;render();});
      $('square-size').addEventListener('click',()=>{Object.assign(settings.image,{width:512,height:512,lock:false});render();say('512-square stretches the image to fit. This is a size proposal, not a validated sticker format.');});
      const rotate=dir=>{settings.image.rotation=(settings.image.rotation+dir+360)%360;[settings.image.width,settings.image.height]=[settings.image.height,settings.image.width];render();};
      $('rotate-left').addEventListener('click',()=>rotate(-90));$('rotate-right').addEventListener('click',()=>rotate(90));
    } else if(type==='pdf') {
      document.querySelectorAll('[name="pdf-operation"]').forEach(el=>el.addEventListener('change',()=>{settings.pdf.operation=el.value;render();}));
      if($('appendix'))$('appendix').addEventListener('change',()=>{settings.pdf.appendix=$('appendix').checked;refresh();});
    } else {
      ['start','end'].forEach(key=>{const update=(fromRange)=>{const n=$(key+(fromRange?'-range':'')).valueAsNumber;settings.video[key]=n;if(fromRange)$(key).value=n;else if(Number.isFinite(n))$(key+'-range').value=n;refresh();};$(key).addEventListener('input',()=>update(false));$(key+'-range').addEventListener('input',()=>update(true));});
      $('fps').addEventListener('change',()=>{settings.video.fps=Number($('fps').value);refresh();});$('video-width').addEventListener('change',()=>{settings.video.width=Number($('video-width').value);refresh();});
    }
  }
  function refresh() {renderPreview();updateSummary();}
  function renderPreview() {
    const focusId=document.activeElement?.id;
    const host=$('preview-content');
    if(type==='image') {
      host.innerHTML=`<div class="image-toolbar"><div class="segmented" aria-label="Image view"><button id="view-original" class="${view==='original'?'active':''}" aria-pressed="${view==='original'}">Original</button><button id="view-output" class="${view==='output'?'active':''}" aria-pressed="${view==='output'}">Output preview</button></div><span class="scale-label">Fit to view</span></div><div class="canvas-wrap" id="drop-zone"><span class="sample-stamp">${source.sample?'GENERATED SAMPLE':'YOUR LOCAL IMAGE'}</span></div>`;
      if(view==='original'||!imageError()) {const c=view==='original'?renderImageCanvas({width:source.width,height:source.height,rotation:0,format:'png',caption:''}):renderImageCanvas(settings.image);c.setAttribute('role','img');c.setAttribute('aria-label',view==='original'?'Original image':'Edited image output preview');$('drop-zone').prepend(c);}else{const p=document.createElement('p');p.className='field-help';p.textContent='Fix the dimensions to preview your output.';$('drop-zone').prepend(p);}
      $('view-original').addEventListener('click',()=>{view='original';renderPreview();});$('view-output').addEventListener('click',()=>{view='output';renderPreview();});
      const dz=$('drop-zone');dz.addEventListener('dragover',e=>{e.preventDefault();dz.classList.add('dragover');});dz.addEventListener('dragleave',()=>dz.classList.remove('dragover'));dz.addEventListener('drop',e=>{e.preventDefault();dz.classList.remove('dragover');if(e.dataTransfer.files.length!==1){say('Drop one PNG, JPEG or WebP at a time.',true);return;}loadImage(e.dataTransfer.files[0]);});
    } else if(type==='pdf') {
      const s=settings.pdf;host.innerHTML=`<p class="pdf-banner">SIMULATED PDF · These page layouts are illustrative, not rendered PDF content.</p>`+(s.operation==='split'?`<div class="page-grid">${['A field guide','First observations','Colour & texture','Small discoveries','Collected notes','Next steps'].map((title,i)=>`<button class="page-card ${s.selected.includes(i+1)?'selected':''}" data-page="${i+1}" aria-label="Page ${i+1}: ${title}" aria-pressed="${s.selected.includes(i+1)}"><span class="page-check">${s.selected.includes(i+1)?'✓':'+'}</span><span class="page-kicker">FIELD NOTES / SAMPLE</span><span class="page-heading">${title}</span><span class="page-art" style="background:${['#dce5cf','#e9d9c3','#d6dfd5','#ded7c3','#cfdac2','#dfd7e6'][i]}"></span><span class="page-lines"></span><span class="page-number">0${i+1}</span></button>`).join('')}</div><div class="select-all"><button id="all-pages" class="text-button">Select all</button><span>·</span><button id="no-pages" class="text-button">Clear selection</button></div><p class="pdf-selection">${s.selected.length} of 6 pages selected · original order</p>`:`<div class="merge-stack"><div class="merge-document"><strong>Field notes</strong><small>6 sample pages<br>First in plan</small></div><span>＋</span><div class="merge-document" style="opacity:${s.appendix?1:.35}"><strong>Appendix</strong><small>2 sample pages<br>Second in plan</small></div></div><p class="pdf-selection">${s.appendix?'8 planned pages · Field notes → Appendix':'Include the appendix to plan a merge.'}</p>`);
      document.querySelectorAll('[data-page]').forEach(b=>b.addEventListener('click',()=>{const n=Number(b.dataset.page);s.selected=s.selected.includes(n)?s.selected.filter(p=>p!==n):[...s.selected,n].sort((a,b)=>a-b);refresh();const next=document.querySelector(`[data-page="${n}"]`);if(next)next.focus({preventScroll:true});}));
      if($('all-pages')){$('all-pages').addEventListener('click',()=>{s.selected=[1,2,3,4,5,6];refresh();$('all-pages').focus({preventScroll:true});});$('no-pages').addEventListener('click',()=>{s.selected=[];refresh();$('no-pages').focus({preventScroll:true});});}
    } else {
      const s=settings.video,valid=!C.validateVideo(s);host.innerHTML=`<p class="video-banner">SIMULATED VIDEO · Synthetic storyboard, not a playable or imported clip.</p><div class="video-stage"><span class="video-text">STUDIO LOOP / SAMPLE</span><div class="story-shape"></div><span class="video-time">12.0 s storyboard</span></div><div class="filmstrip">${'<span></span>'.repeat(8)}${valid?`<div class="timeline-range" style="left:${s.start/12*100}%;width:${(s.end-s.start)/12*100}%"></div>`:''}</div><div class="timeline-ticks"><span>0:00</span><span>0:03</span><span>0:06</span><span>0:09</span><span>0:12</span></div><div class="video-footer"><span>${valid?`${s.start.toFixed(1)} → ${s.end.toFixed(1)} sec`:'Choose a valid trim range'}</span><span>${valid?`${(s.end-s.start).toFixed(1)} sec selected`:'No valid preview'}</span></div>`;
    }
    if(focusId&&$(focusId))$(focusId).focus({preventScroll:true});
  }
  function updateSummary() {
    const err=error();$('validation').textContent=err;$('prepare').disabled=!!err;
    if(type==='image') {const s=settings.image;$('output-summary').innerHTML=err?'Output needs attention':`${s.format.toUpperCase()} <span style="color:#a7af9b">/</span> ${s.width} × ${s.height}<small>${s.format==='png'?'Transparency supported':'White background · 90% quality'} · metadata omitted</small>`;$('prepare').innerHTML='Create image output <span>↗</span>';$('action-note').textContent='Real image · processed here in your browser';}
    else if(type==='pdf') {$('output-summary').innerHTML=`JSON plan <span style="color:#a7af9b">/</span> ${settings.pdf.operation==='merge'?(settings.pdf.appendix?8:6):settings.pdf.selected.length} pages<small>Simulated ${settings.pdf.operation==='merge'?'merge':'page extraction'} · no PDF generated</small>`;$('prepare').innerHTML='Create sample plan <span>↗</span>';$('action-note').textContent='No file conversion · JSON recipe only';}
    else {$('output-summary').innerHTML=err?'Plan needs attention':`JSON plan <span style="color:#a7af9b">/</span> ${(settings.video.end-settings.video.start).toFixed(1)} sec<small>${C.estimatedFrames(settings.video)} estimated frames · ${settings.video.width}px · silent GIF proposal</small>`;$('prepare').innerHTML='Create sample plan <span>↗</span>';$('action-note').textContent='No video conversion · JSON recipe only';}
  }
  async function loadImage(file) {
    const token=++loadToken;const rejected=C.classifyFile(file);if(rejected){say(rejected,true);return;}
    const url=URL.createObjectURL(file),img=new Image();say('Opening the image locally…');
    try {await new Promise((resolve,reject)=>{img.onload=resolve;img.onerror=()=>reject(new Error('This file could not be decoded as an image. Try another PNG, JPEG or WebP.'));img.src=url;});
      if(token!==loadToken)return;
      if(!img.naturalWidth||!img.naturalHeight||img.naturalWidth*img.naturalHeight>C.limits.maxPixels||Math.max(img.naturalWidth,img.naturalHeight)>C.limits.maxInputSide)throw new Error('This image exceeds the input limit: 16 million pixels and 8192 pixels per side. Resize it before importing.');
      const c=document.createElement('canvas');c.width=img.naturalWidth;c.height=img.naturalHeight;c.getContext('2d').drawImage(img,0,0);
      source={image:c,width:c.width,height:c.height,name:file.name,sample:false};const scale=Math.min(1,C.limits.maxSide/Math.max(c.width,c.height));settings.image={...copy(C.defaults.image),width:Math.max(1,Math.round(c.width*scale)),height:Math.max(1,Math.round(c.height*scale))};type='image';view='output';render();say(`${file.name} opened locally. ${c.width} × ${c.height} pixels. ${scale<1?'Output was fitted within 4096 pixels per side. ':''}Review the output before saving.`);
    } catch(e){if(token===loadToken)say(e.message,true);}finally{URL.revokeObjectURL(url);}
  }
  function renderJobs() {
    $('job-count').textContent=jobs.length;$('tray-count').textContent=jobs.length;$('clear-jobs').disabled=!jobs.length;
    $('job-list').innerHTML=jobs.length?jobs.map(j=>`<article class="job" data-job="${j.id}">${j.kind==='image'&&j.url?`<img class="job-thumb" src="${j.url}" alt="Output thumbnail">`:`<span class="job-icon">${j.kind==='image'?'▧':'≡'}</span>`}<div class="job-info"><strong>${esc(j.name)}</strong><small>${esc(j.detail)}</small></div><span class="job-state">${j.state==='ready'?(j.kind==='image'?'✓ Image ready':'Plan only'):j.state==='failed'?'Failed':'Encoding…'}</span>${j.url?`<a class="download" href="${j.url}" download="${esc(j.name)}">${j.kind==='image'?'Save image ↓':'Download plan (.json) ↓'}</a>`:''}<button class="job-remove" data-remove="${j.id}" aria-label="${j.state==='preparing'?'Cancel':'Remove'} ${esc(j.name)}">×</button></article>`).join(''):'<div class="empty-tray"><span>↧</span> Your outputs will land here. The original always stays yours.</div>';
    document.querySelectorAll('[data-remove]').forEach(b=>b.addEventListener('click',()=>{const i=jobs.findIndex(j=>j.id===Number(b.dataset.remove));if(i<0)return;const j=jobs[i];if(j.url)URL.revokeObjectURL(j.url);jobs.splice(i,1);renderJobs();say(j.state==='preparing'?'Output cancelled. No downloadable result was retained.':'Output removed from this tab. Files already downloaded are unchanged.');}));
  }
  function createOutput() {
    if(error()){updateSummary();return;}
    const id=nextJob++,kind=type;
    if(kind==='image') {
      const s=copy(settings.image),name=C.outputName(source.name,s.format==='jpeg'?'jpg':'png');
      const j={id,kind,name,state:'preparing',detail:`${s.width} × ${s.height} · ${s.format.toUpperCase()} · ${source.sample?'generated sample':'local image'} · settings saved with this output`};jobs.push(j);renderJobs();
      try{const canvas=renderImageCanvas(s);canvas.toBlob(blob=>{if(!jobs.includes(j))return;if(!blob||blob.type!==`image/${s.format}`){j.state='failed';j.detail='Browser could not encode the requested format. Try PNG or smaller dimensions.';renderJobs();say(j.detail,true);return;}j.url=URL.createObjectURL(blob);j.state='ready';j.detail+=` · ${(blob.size/1024).toFixed(1)} KiB`;renderJobs();say('Image ready in the output tray. Review and save it as a separate file.');},`image/${s.format}`,0.9);}catch(e){j.state='failed';j.detail='Image encoding failed. Try smaller dimensions.';renderJobs();say(j.detail,true);}
    } else {
      const plan=C.plan(kind,copy(settings[kind])),name=`${kind==='pdf'?'field-notes-'+settings.pdf.operation:'studio-loop-trim'}-SIMULATED-plan.json`,blob=new Blob([JSON.stringify(plan,null,2)],{type:'application/json'});
      jobs.push({id,kind,name,state:'ready',url:URL.createObjectURL(blob),detail:`SAMPLE PLAN ONLY · ${kind==='pdf'?`${plan.pages.length} proposed pages · no PDF created`:`${plan.durationSeconds}s · ${plan.estimatedFrames} estimated frames · no GIF created`}`});renderJobs();say('Sample plan ready. The JSON describes the proposed operation; no media file was converted.');
    }
  }
  document.querySelectorAll('[data-type]').forEach(b=>b.addEventListener('click',()=>{setType(b.dataset.type);say(b.dataset.type==='image'?'Generated image sample loaded. PNG and JPEG exports work locally.':b.dataset.type==='pdf'?'Sample PDF planning mode. These pages are illustrative, not an imported document.':'Sample video planning mode. This storyboard is synthetic and has no playable media.');}));
  $('import-button').addEventListener('click',()=>$('file-input').click());$('file-input').addEventListener('change',()=>{if($('file-input').files[0])loadImage($('file-input').files[0]);$('file-input').value='';});
  $('restore').addEventListener('click',()=>{if(type==='image'){const scale=Math.min(1,C.limits.maxSide/Math.max(source.width,source.height));settings.image={...copy(C.defaults.image),width:Math.max(1,Math.round(source.width*scale)),height:Math.max(1,Math.round(source.height*scale))};}else settings[type]=copy(C.defaults[type]);view='output';render();say('Edits reset for this input. Existing outputs keep their saved settings.');});
  $('prepare').addEventListener('click',createOutput);$('clear-jobs').addEventListener('click',()=>{jobs.forEach(j=>{if(j.url)URL.revokeObjectURL(j.url);});jobs=[];renderJobs();say('Output tray cleared from this tab. Files already downloaded are unchanged.');});
  ['open-support','scope-button'].forEach(id=>$(id).addEventListener('click',()=>$('support-dialog').showModal()));['close-support','dialog-done'].forEach(id=>$(id).addEventListener('click',()=>$('support-dialog').close()));
  window.addEventListener('beforeunload',()=>jobs.forEach(j=>{if(j.url)URL.revokeObjectURL(j.url);}));
  window.addEventListener('dragover',e=>{if(e.dataTransfer.types.includes('Files'))e.preventDefault();});window.addEventListener('drop',e=>{if(e.dataTransfer.types.includes('Files'))e.preventDefault();});
  render();renderJobs();
})();


