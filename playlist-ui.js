// Account playlist API adapter and interface. Backend owns identity/authorization.
(() => {
  const base = 'http://localhost:3000';
  let user = null, generation = 0, busy = false, loading = false, loadError = false;
  let editing = null, mode = 'create';
  const dialog = $('create-dialog'), form = $('create-form'), input = $('playlist-name');
  const title = form.querySelector('h2'), submit = form.querySelector('.green-button');
  const error = document.createElement('p');
  error.id = 'playlist-error'; error.className = 'field-error'; error.setAttribute('role','alert');
  input.after(error);
  const status = document.createElement('p');
  status.id = 'playlist-status'; status.className = 'form-hint'; status.setAttribute('role','status');
  $('library-list').before(status);
  const retry = document.createElement('button');
  retry.className = 'text-button'; retry.textContent = 'Tekrar dene'; retry.hidden = true;
  status.after(retry);
  async function request(path, method = 'GET', body) {
    const response = await fetch(base + path, {
      method, credentials:'include',
      ...(body === undefined ? {} : {headers:{'Content-Type':'application/json'},body:JSON.stringify(body)})
    });
    if (!response.ok) {
      const data = await response.json().catch(() => ({}));
      const e = new Error(response.status === 401 ? 'Oturumun sona erdi. Tekrar giriş yap.' : response.status === 404 ? 'Liste bulunamadı veya bu hesaba ait değil.' : data.error || 'İşlem tamamlanamadı. Tekrar dene.');
      e.status = response.status; throw e;
    }
    return response.status === 204 ? null : response.json();
  }
  window.playlistService = {
    list: () => request('/playlists'),
    create: name => request('/playlists','POST',{name}),
    rename: (id,name) => request('/playlists/'+id,'PATCH',{name}),
    remove: id => request('/playlists/'+id,'DELETE')
  };
  function mapped(row) {
    return {id:'server-'+row.id,serverId:row.id,name:row.name,owner:user.displayName,
      subtitle:'Sana ait çalma listesi.',cover:row.id % 8,color:'#45594f',trackIds:[]};
  }
  function removeAccountLists() {
    for(let i=playlists.length-1;i>=0;i--) if(playlists[i].serverId) playlists.splice(i,1);
    if(state.playlist?.serverId) {state.playlist=null;state.view='home';state.search='';$('search').value='';$('clear-search').hidden=true;}
    state.queueId=null;
  }
  function refresh() {
    renderContent(); renderNow();
    status.textContent = loading ? 'Çalma listelerin yükleniyor…' : loadError ? 'Listeler yüklenemedi.' : !user ? 'Kendi listelerin için giriş yap.' : !playlists.some(p=>p.serverId) ? 'Henüz çalma listen yok. Oluştur ile başlayabilirsin.' : '';
    retry.hidden = !loadError;
    $('create').disabled = busy || loading;
  }
  function expire(e) {
    if(e.status !== 401) return;
    window.playlistUI.setUser(null); signedIn=false; profileData={displayName:'Misafir',email:'',photo:''};
    showAuth('login');
  }
  async function load(token = generation) {
    loading = true; loadError = false; refresh();
    try {
      const rows = await window.playlistService.list();
      if(token !== generation) return;
      const selectedId = state.playlist?.serverId;
      removeAccountLists(); playlists.push(...rows.map(mapped));
      if(selectedId) {const p=playlists.find(p=>p.serverId===selectedId);if(p){state.playlist=p;state.view='playlist';}}
    } catch(e) {
      if(token !== generation) return;
      loadError = true; expire(e); toast(e.message);
    } finally { if(token === generation) {loading=false;refresh();} }
  }
  window.playlistUI = {
    async setUser(next) {
      const token=++generation; user=next; busy=false;loading=false;loadError=false;
      dialog.close(); removeAccountLists(); refresh();
      if(user) await load(token);
    }
  };
  retry.onclick=()=>load();
  function open(modeValue, p=null) {
    if(!user) {showAuth('login');toast('Çalma listesi oluşturmak için giriş yap.');return;}
    if(busy) return;
    mode=modeValue;editing=p; error.textContent='';input.setCustomValidity('');
    title.textContent=mode==='rename'?'Liste adını değiştir':mode==='delete'?'Çalma listesini sil':'Yeni çalma listesi';
    submit.textContent=mode==='rename'?'Kaydet':mode==='delete'?'Sil':'Oluştur';
    input.hidden=mode==='delete';form.querySelector('label').hidden=mode==='delete';input.required=mode!=='delete';
    input.value=p?.name||'';
    error.textContent=mode==='delete'?'“'+p.name+'” silinecek. Bu işlem geri alınamaz.':'';
    dialog.showModal(); if(mode==='delete')$('cancel-create').focus();else input.focus();
  }
  $('create').onclick=()=>open('create');
  input.oninput=()=>input.setCustomValidity('');
  dialog.addEventListener('cancel',e=>{if(busy)e.preventDefault();});
  $('cancel-create').onclick=()=>{if(!busy)dialog.close();};
  form.onsubmit=async e=>{
    e.preventDefault();if(busy||!user)return;
    const name=input.value.trim();
    if(mode!=='delete'&&(!name||name.length>60)){input.setCustomValidity('1–60 karakterlik bir liste adı gir.');input.reportValidity();return;}
    const token=generation, action=mode, target=editing;
    busy=true;submit.disabled=true;$('cancel-create').disabled=true;error.textContent='';refresh();
    try {
      if(action==='delete') {
        await window.playlistService.remove(target.serverId);
        if(token!==generation)return;
        const i=playlists.findIndex(p=>p.id===target.id);if(i>=0)playlists.splice(i,1);
        if(state.playlist?.id===target.id)goHome();
      } else {
        const row=action==='create'?await window.playlistService.create(name):await window.playlistService.rename(target.serverId,name);
        if(token!==generation)return;
        const p=mapped(row), i=playlists.findIndex(x=>x.id===p.id);
        if(i>=0)playlists[i]=p;else playlists.push(p);
        openPlaylist(p.id);
      }
      dialog.close();refresh();toast(action==='delete'?'Çalma listen silindi.':action==='rename'?'Liste adı güncellendi.':'Çalma listen oluşturuldu.');
    } catch(e) {if(token===generation){error.textContent=e.message;expire(e);}}
    finally {if(token===generation){busy=false;refresh();}submit.disabled=false;$('cancel-create').disabled=false;}
  };
  const original=renderContent;
  renderContent=function(){
    original();
    if(state.view==='playlist'&&state.playlist?.serverId&&!state.search){
      const actions=document.querySelector('.playlist-actions');
      for(const [action,label] of [['rename','Adını değiştir'],['delete','Listeyi sil']]){
        const b=document.createElement('button');b.className='text-button';b.textContent=label;b.disabled=busy;
        b.onclick=()=>open(action,state.playlist);actions.append(b);
      }
    }
  };
  status.textContent='Oturum kontrol ediliyor…';
})();
