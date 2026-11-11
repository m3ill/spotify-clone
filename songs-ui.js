// Real catalog data stays separate from the sample player tracks.
(() => {
  let songs=[], loading=false, failure='', saving=false, selected=null, editVersion=0;
  const base='http://localhost:3000';
  async function request(path, method='GET', body) {
    const response=await fetch(base+path,{method,credentials:'include',...(body===undefined?{}:{headers:{'Content-Type':'application/json'},body:JSON.stringify(body)})});
    if(!response.ok){const data=await response.json().catch(()=>({}));throw new Error(response.status===404?'Şarkı bulunamadı.':data.error||'İşlem tamamlanamadı. Tekrar dene.');}
    return response.json();
  }
  window.songService={list:()=>request('/songs'),get:id=>request('/songs/'+id),create:body=>request('/songs','POST',body),update:(id,body)=>request('/songs/'+id,'PATCH',body)};
  const nav=document.createElement('button');nav.id='open-song-catalog';nav.className='pill song-catalog-link';nav.setAttribute('aria-label','Şarkı kataloğu');nav.innerHTML='♫ <span>Şarkı kataloğu</span>';
  document.querySelector('.library-title').after(nav);
  const dialog=document.createElement('dialog');dialog.id='song-editor';dialog.setAttribute('aria-labelledby','song-editor-title');
  dialog.innerHTML=`<form id="song-form"><h2 id="song-editor-title">Şarkı ekle</h2><label for="song-title">Şarkı adı</label><input id="song-title" maxlength="200" required autocomplete="off"><label for="song-duration">Süre (saniye)</label><input id="song-duration" type="number" min="1" max="2147483647" step="1" required><p class="form-hint">Örneğin 3 dakika 34 saniye için 214 yaz.</p><p id="song-error" class="field-error" role="alert"></p><div class="song-form-actions"><button type="button" class="pill" id="cancel-song">Vazgeç</button><button class="green-button" id="save-song">Ekle</button></div></form>`;
  document.body.append(dialog);
  function paint(){
    if(state.view!=='catalog')return;
    const shown=songs.filter(s=>normalize(s.title).includes(normalize(state.search)));
    $('filters').hidden=true;$('main').classList.remove('account-view');$('main').style.removeProperty('background');
    $('content').innerHTML=`<section class="song-catalog"><div class="eyebrow">MÜZİK KATALOĞU</div><div class="section-heading"><h1>Şarkılar</h1><button class="green-button" id="add-song" ${saving?'disabled':''}>＋ Şarkı ekle</button></div><p class="subheading">Kayıtlı şarkıları keşfet ve bilgilerini düzenle.</p><div class="catalog-tools"><button class="outline-button" id="reload-songs" ${loading?'disabled':''}>Yenile</button><span role="status">${loading?'Şarkılar yükleniyor…':failure?esc(failure):shown.length+' / '+songs.length+' şarkı'}</span></div>${failure?'<p class="field-error" role="alert">Katalog yüklenemedi. Yenile ile tekrar deneyebilirsin.</p>':loading?'<p class="empty">Katalog yükleniyor…</p>':shown.length?`<table class="track-table catalog-table"><thead><tr><th>Şarkı</th><th>Süre</th><th><span class="sr-only">İşlem</span></th></tr></thead><tbody>${shown.map(s=>`<tr><td><button class="song-detail" data-edit-song="${s.id}" aria-label="${esc(s.title)} bilgilerini aç"><strong>${esc(s.title)}</strong></button></td><td>${time(s.duration_seconds)}</td><td><button class="text-button" data-edit-song="${s.id}" aria-label="${esc(s.title)} düzenle">Düzenle</button></td></tr>`).join('')}</tbody></table>`:songs.length?'<div class="empty"><h2>Şarkı bulunamadı</h2><p>Başka bir şarkı adıyla tekrar ara.</p></div>':'<div class="empty"><h2>Henüz şarkı yok</h2><p>Şarkı ekle ile kataloğunu oluşturmaya başla.</p></div>'}</section>`;
    $('add-song').onclick=()=>openEditor();$('reload-songs').onclick=load;
  }
  async function load(){loading=true;failure='';paint();try{songs=await window.songService.list();}catch(e){failure=e.message;}finally{loading=false;paint();}}
  const original=renderContent;renderContent=function(){original();paint();};
  nav.onclick=()=>{state.view='catalog';state.playlist=null;state.search='';$('search').value='';$('clear-search').hidden=true;renderContent();renderNow();load();};
  async function openEditor(id){
    if(saving)return;
    const version=++editVersion;selected=null;$('song-error').textContent='';
    $('song-title').value='';$('song-duration').value='';$('song-title').setCustomValidity('');
    $('song-editor-title').textContent=id?'Şarkıyı düzenle':'Şarkı ekle';$('save-song').textContent=id?'Kaydet':'Ekle';
    $('save-song').disabled=Boolean(id);$('song-title').disabled=Boolean(id);$('song-duration').disabled=Boolean(id);
    dialog.showModal();
    if(id){try{const row=await window.songService.get(id);if(version!==editVersion||!dialog.open)return;selected=row;$('song-title').value=row.title;$('song-duration').value=row.duration_seconds;$('save-song').disabled=false;$('song-title').disabled=false;$('song-duration').disabled=false;}catch(e){if(version===editVersion)$('song-error').textContent=e.message;}}
    if(dialog.open&&!$('song-title').disabled)$('song-title').focus();
  }
  dialog.addEventListener('close',()=>{++editVersion;});
  dialog.addEventListener('cancel',e=>{if(saving)e.preventDefault();});
  $('cancel-song').onclick=()=>{if(!saving)dialog.close();};
  $('song-title').oninput=()=>$('song-title').setCustomValidity('');
  document.addEventListener('click',e=>{const b=e.target.closest('[data-edit-song]');if(b)openEditor(Number(b.dataset.editSong));});
  $('song-form').onsubmit=async e=>{
    e.preventDefault();if(saving||$('save-song').disabled)return;
    const title=$('song-title').value.trim(), duration_seconds=Number($('song-duration').value);
    if(!title||title.length>200){$('song-title').setCustomValidity('1–200 karakterlik bir şarkı adı gir.');$('song-title').reportValidity();return;}
    if(!Number.isInteger(duration_seconds)||duration_seconds<=0||duration_seconds>2147483647)return;
    const body={};if(!selected||title!==selected.title)body.title=title;if(!selected||duration_seconds!==selected.duration_seconds)body.duration_seconds=duration_seconds;
    if(!Object.keys(body).length){dialog.close();return;}
    saving=true;$('save-song').disabled=true;$('cancel-song').disabled=true;$('song-error').textContent='';
    try{if(selected)await window.songService.update(selected.id,body);else await window.songService.create(body);dialog.close();toast(selected?'Şarkı bilgileri güncellendi.':'Şarkı kataloğa eklendi.');await load();}
    catch(e){$('song-error').textContent=e.message;}
    finally{saving=false;$('save-song').disabled=false;$('cancel-song').disabled=false;paint();}
  };
})();
