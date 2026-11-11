// Hesap ekranları; kimlik doğrulama ve playlist'ler gerçek API'ye bağlı.
let profileData={displayName:'Demo Kullanıcı',email:'',photo:''};
try{const name=localStorage.getItem('backendtest-profile-name');if(name)profileData.displayName=name}catch{}
let signedIn=false,authMode='login',profileView=null,authBusy=false;
const avatarButton=document.querySelector('.avatar');
avatarButton.setAttribute('aria-haspopup','menu');avatarButton.setAttribute('aria-expanded','false');avatarButton.setAttribute('aria-label','Profil menüsünü aç');
const profileMenu=document.createElement('div');profileMenu.id='profile-menu';profileMenu.hidden=true;profileMenu.setAttribute('role','menu');profileMenu.setAttribute('aria-label','Profil seçenekleri');
profileMenu.innerHTML=`<button role="menuitem" data-account-page="account">Hesap <span>↗</span></button><button role="menuitem" data-account-page="profile">Profil</button><button role="menuitem" data-account-page="recent">Son çalınanlar</button><a role="menuitem" href="https://support.spotify.com/tr-tr/" target="_blank" rel="noopener noreferrer">Destek <span>↗</span></a><a role="menuitem" href="https://www.spotify.com/tr-tr/download/" target="_blank" rel="noopener noreferrer">İndir <span>↗</span></a><button role="menuitem" data-account-page="settings">Ayarlar</button><button role="menuitem" id="logout">Oturumu kapat</button><div class="menu-updates"><h3>Güncellemelerin</h3><p class="menu-note">Senin için seçilenler</p>${[{cover:4,text:'Yeni sesler keşfet. Bu haftanın seçkisi şimdi hazır.',ago:'2 sa.'},{cover:7,text:'Kendi halinde: haftanın indie favorileri seni bekliyor.',ago:'4 sa.'}].map(n=>`<button role="menuitem" data-playlist="${n.cover===4?'turkce':'indie'}"><img src="${cover(n.cover)}" alt=""><span>${n.text}<small> • ${n.ago}</small></span></button>`).join('')}</div>`;
document.body.append(profileMenu);
const authScreen=document.createElement('section');authScreen.id='auth-screen';authScreen.hidden=true;authScreen.setAttribute('aria-label','Hesap girişi');document.body.append(authScreen);
const editDialog=document.createElement('dialog');editDialog.id='profile-edit-dialog';editDialog.innerHTML=`<form id="profile-edit-form"><div class="dialog-heading"><h2>Profil bilgileri</h2><button type="button" id="close-profile-edit" aria-label="Profil düzenlemeyi kapat">×</button></div><div class="profile-edit-body"><label class="edit-photo" for="profile-photo"><span id="edit-photo-preview">M</span><span>Fotoğraf seç</span></label><input id="profile-photo" type="file" accept="image/png,image/jpeg,image/webp" hidden><div><label for="display-name">Görünen ad</label><input id="display-name" maxlength="60" required></div></div><p class="form-hint">Profil adın ve fotoğrafın bu önizlemede kullanılır.</p><div><button class="green-button">Kaydet</button></div></form>`;document.body.append(editDialog);
function closeMenu(){profileMenu.hidden=true;avatarButton.setAttribute('aria-expanded','false')}
avatarButton.onclick=()=>{profileMenu.hidden=!profileMenu.hidden;avatarButton.setAttribute('aria-expanded',String(!profileMenu.hidden));if(!profileMenu.hidden)profileMenu.querySelector('[role=menuitem]').focus()};
document.addEventListener('click',e=>{if(!profileMenu.contains(e.target)&&!avatarButton.contains(e.target))closeMenu();if(profileMenu.contains(e.target)&&e.target.closest('[role=menuitem]'))closeMenu();const item=e.target.closest('[data-account-page]');if(item){openAccountPage(item.dataset.accountPage);closeMenu()}if(e.target.closest('[data-action="home"],[data-playlist],[data-genre],[data-track],[data-section],#browse')){profileView=null;if(!signedIn)return;}});
profileMenu.addEventListener('keydown',e=>{const els=[...profileMenu.querySelectorAll('[role=menuitem]')];const index=els.indexOf(document.activeElement);if(e.key==='ArrowDown'||e.key==='ArrowUp'){e.preventDefault();els[(index+(e.key==='ArrowDown'?1:-1)+els.length)%els.length].focus()}if(e.key==='Escape'){closeMenu();avatarButton.focus()}});
function refreshIdentity(){const welcome=document.querySelector('.welcome h1');if(welcome)welcome.textContent='Hoş geldin, '+(signedIn?profileData.displayName:'misafir');avatarButton.textContent=profileData.displayName.trim().charAt(0).toLocaleUpperCase('tr');if(profileData.photo){avatarButton.style.backgroundImage=`url("${profileData.photo}")`;avatarButton.classList.add('has-photo')}document.querySelectorAll('.library-row small').forEach(el=>{if(el.textContent.startsWith('Çalma listesi'))el.textContent='Çalma listesi • '+profileData.displayName})}
function profileArtists(){return [...new Map(tracks.map(t=>[t.artist,t])).values()].slice(0,5).map(t=>`<button class="card artist-card" data-query="${esc(t.artist)}"><div class="cover-wrap"><img src="${cover(t.cover)}" alt="${esc(t.artist)}"></div><strong>${esc(t.artist.split(',')[0])}</strong><p>Sanatçı</p></button>`).join('')}
function profileHero(){return `<section class="profile-hero"><button class="profile-photo" data-edit-profile aria-label="Profil fotoğrafını ve adını düzenle">${profileData.photo?`<img src="${profileData.photo}" alt="Profil fotoğrafın">`:`<svg viewBox="0 0 100 100" fill="none" aria-hidden="true"><circle cx="50" cy="36" r="17" fill="currentColor"/><path d="M19 87c0-36 62-36 62 0" fill="currentColor"/></svg>`}<span>Profili düzenle</span></button><div><p>Profil</p><button class="profile-name" data-edit-profile>${esc(profileData.displayName)}</button><div class="profile-stats"><span>Sana ait ${playlists.filter(p=>p.serverId).length} çalma listesi</span><span> • </span><button data-account-page="followers">7 takipçi</button><span> • </span><button data-account-page="following">Takip edilenler: 6</button></div></div></section>`}
function openAccountPage(page){profileView=page;state.search='';$('search').value='';$('clear-search').hidden=true;state.view='home';state.genre='Tümü';$('filters').hidden=true;$('main').style.removeProperty('background');$('main').classList.add('account-view');$('main').scrollTop=0;
if(page==='profile'){$('content').innerHTML=profileHero()+`<div class="profile-body"><div class="profile-actions"><button data-account-page="settings" aria-label="Profil ayarları">⚙</button><button data-edit-profile aria-label="Profili düzenle">•••</button><span class="demo-label">Örnek profil</span></div><div class="section-heading"><div><h2>Bu ayın en çok dinlenen sanatçıları</h2><p class="subheading">Yalnızca sana görünür</p></div></div><div class="cards">${profileArtists()}</div><div class="section-heading"><div><h2>Bu ayın en çok dinlenen parçaları</h2><p class="subheading">Yalnızca sana görünür</p></div></div>${table(tracks.slice(0,4))}<div class="section-heading"><h2>Çalma listelerin</h2><button class="text-button" data-section="playlists">Tümünü göster</button></div><div class="cards">${playlists.filter(p=>p.serverId).slice(0,5).map(p=>card(p)).join('')}</div><div class="section-heading"><h2>Takipçiler</h2><button class="text-button" data-account-page="followers">Tümünü göster</button></div>${peopleCards(['Deniz','Ekin','Ada'])}</div>`}
else if(page==='recent'){$('content').innerHTML=`<div class="account-page-inner"><div class="eyebrow">SANA AİT BİR RİTİM</div><h1>Son çalınanlar</h1><p class="subheading">Bu oturumda dinlediklerin</p>${table([...new Set([state.current.id,...[...state.history].reverse()])].map(id=>tracks.find(t=>t.id===id)).filter(Boolean))}</div>`}
else if(page==='followers'||page==='following'){$('content').innerHTML=`<div class="account-page-inner"><button class="text-button" data-account-page="profile">← Profile dön</button><h1>${page==='followers'?'Takipçiler':'Takip ediliyor'}</h1><p class="subheading">Örnek profil verileri</p>${page==='followers'?peopleCards(['Deniz','Ekin','Ada','Kuzey','Duru','Bora','Yağmur']):`<div class="cards">${profileArtists()}</div>`}</div>`}
else if(page==='settings'){$('content').innerHTML=`<div class="account-page-inner settings-page"><div class="eyebrow">TAM SENİN İSTEDİĞİN GİBİ</div><h1>Ayarlar</h1><section class="settings-block"><h2>Profil</h2><div class="setting-row"><span>Görünen ad<small>${esc(profileData.displayName)}</small></span><button class="outline-button" data-edit-profile>Profili düzenle</button></div><div class="setting-row"><span>Hesap bilgileri</span><button class="outline-button" data-account-page="account">Hesaba git</button></div></section><section class="settings-block"><h2>Görünüm</h2><div class="setting-row"><label for="language-select">Dil<small>Arayüzün görüntüleneceği dil</small></label><select id="language-select"><option>Türkçe</option></select></div><div class="setting-row"><label for="compact-mode">Kompakt kitaplık<small>Listeleri daha küçük gör</small></label><input id="compact-mode" type="checkbox" role="switch" ${document.body.classList.contains('compact-library')?'checked':''}></div></section><section class="settings-block"><h2>Oynatma</h2><div class="setting-row"><label for="settings-shuffle">Karışık çalma</label><input id="settings-shuffle" type="checkbox" role="switch" ${state.shuffle?'checked':''}></div><p class="form-hint">Ses oynatma simülasyonu kullanılıyor.</p></section></div>`}
else {$('content').innerHTML=`<div class="account-page-inner"><div class="eyebrow">SENİN HESABIN</div><h1>Hesap genel görünümü</h1><section class="account-card"><div class="plan-heading"><div><p class="eyebrow">PLANIN</p><h2>Spotify Free</h2></div><span>♪</span></div><p>Müzikle dolu bir dünya.</p><span class="demo-label">Önizleme hesabı</span></section><section class="settings-block"><h2>Profil bilgileri</h2><div class="setting-row"><span>Görünen ad</span><strong>${esc(profileData.displayName)}</strong></div><div class="setting-row"><span>E-posta</span><strong>${esc(profileData.email||'Henüz eklenmedi')}</strong></div><button class="outline-button" data-edit-profile>Profili düzenle</button></section><div class="account-links"><button data-auth="login">Giriş ekranını görüntüle <span>→</span></button><button data-auth="signup">Kayıt ekranını görüntüle <span>→</span></button></div></div>`}
refreshIdentity()}
function peopleCards(names){return `<div class="cards people-cards">${names.map((n,i)=>`<div class="card artist-card"><div class="person-avatar" style="--person-color:${['#b89c8a','#8faac1','#9bb39c'][i%3]}">${n.charAt(0)}</div><strong>${n}</strong><p>Profil</p></div>`).join('')}</div>`}
const originalRenderContent=renderContent;renderContent=function(){profileView=null;$('filters').hidden=false;$('main').classList.remove('account-view');originalRenderContent();refreshIdentity()};
function showAuth(mode='login'){closeMenu();authMode=mode;authScreen.hidden=false;document.body.classList.add('auth-open');state.playing=false;renderPlayer();renderAuth();location.hash=mode==='signup'?'signup':'login';authScreen.scrollTop=0}
function renderAuth(){const signup=authMode==='signup';authScreen.innerHTML=`<header class="auth-brand"><button data-auth-home aria-label="Ana sayfaya dön">${document.querySelector('.brand').innerHTML}</button></header><div class="auth-card ${signup?'signup-card':''}"><div class="auth-logo">${document.querySelector('.brand').innerHTML}</div><div class="auth-kicker">MÜZİĞE BİR ADIM DAHA YAKIN</div><h1>${signup?'Dinlemeye başlamak<br>için kaydol':'Tekrar hoş geldin'}</h1><div class="auth-demo-note">Frontend önizlemesi · Gerçek Spotify hesabına bağlı değil</div><form id="auth-form" novalidate>${signup?`<div class="field"><label for="auth-username">Kullanıcı adı</label><input id="auth-username" name="username" type="text" autocomplete="username" placeholder="Kullanıcı adın" maxlength="50" required aria-describedby="username-error"><small class="field-error" id="username-error"></small></div><div class="field"><label for="auth-name">Sana ne diyelim?</label><input id="auth-name" name="displayName" autocomplete="nickname" placeholder="Profilinde görünecek ad" maxlength="100" required><small class="field-error" id="name-error"></small></div>`:''}<div class="field"><label for="auth-email">E-posta adresi</label><input id="auth-email" name="email" type="email" autocomplete="email" placeholder="isim@ornek.com" required aria-describedby="email-error"><small class="field-error" id="email-error"></small></div><div class="field"><label for="auth-password">Parola</label><div class="password-field"><input id="auth-password" name="password" type="password" autocomplete="${signup?'new-password':'current-password'}" placeholder="${signup?'Bir parola oluştur':'Parolanı gir'}" required aria-describedby="password-error"><button type="button" id="toggle-password" aria-label="Parolayı göster">◉</button></div><small class="field-error" id="password-error"></small>${signup?'<small class="form-hint">15–128 karakter kullan.</small>':''}</div>${signup?`<div class="field"><label for="auth-confirm">Parolanı doğrula</label><input id="auth-confirm" name="confirmPassword" type="password" autocomplete="new-password" placeholder="Parolanı tekrar gir" required><small class="field-error" id="confirm-error"></small></div><label class="check-label"><input type="checkbox" id="auth-terms"> Bu eğitim projesinde hesap oluşturmak istiyorum.</label><small class="field-error" id="terms-error"></small>`:''}<p id="auth-error" class="field-error" role="alert"></p><button class="green-button auth-submit">${signup?'Kaydol':'Oturum aç'}</button><p class="auth-form-note">Bu eğitim uygulamasının hesabını kullan; gerçek Spotify hesabınla bağlantılı değildir.</p></form>${!signup?'<button class="forgot-link" data-auth="reset">Parolanı mı unuttun?</button>':''}<div class="auth-separator"><span>veya</span></div><div class="social-buttons"><button type="button" disabled><b class="google-icon">G</b> Google ile devam et</button><button type="button" disabled><b>●</b> Apple ile devam et</button><button type="button" disabled><b class="facebook-icon">f</b> Facebook ile devam et</button></div><p class="social-hint">Sosyal giriş bağlantıları backend entegrasyonundan sonra açılacak.</p><div class="auth-switch">${signup?'Zaten hesabın var mı?':'Hesabın yok mu?'} <button data-auth="${signup?'login':'signup'}">${signup?'Oturum aç':'Kaydol'}</button></div><button class="guest-link" data-auth-home>Şimdilik müziğe dön →</button></div><footer class="auth-footer">Spotify görünümünden esinlenen bir eğitim projesi.</footer>`;
if(authMode==='reset'){authScreen.querySelector('.auth-card').innerHTML=`<div class="auth-logo">${document.querySelector('.brand').innerHTML}</div><h1>Parolanı sıfırla</h1><p class="subheading">Hesabınla ilişkili e-posta adresini gir.</p><form id="reset-form"><div class="field"><label for="reset-email">E-posta adresi</label><input id="reset-email" type="email" autocomplete="email" placeholder="isim@ornek.com" required></div><button class="green-button auth-submit">Sıfırlama bağlantısı iste</button><p class="auth-form-note" id="reset-status" role="status">Bu işlem önizlemedir; e-posta gönderilmez.</p></form><div class="auth-switch"><button data-auth="login">Oturum açmaya dön</button></div>`;$('reset-form').onsubmit=e=>{e.preventDefault();$('reset-status').textContent='Form hazır. Sıfırlama e-postası göndermek için backend bağlantısı gerekiyor.'};return}
$('toggle-password').onclick=()=>{const show=$('auth-password').type==='password';$('auth-password').type=show?'text':'password';$('toggle-password').setAttribute('aria-label',show?'Parolayı gizle':'Parolayı göster')};$('auth-form').onsubmit=submitAuth;
}
function fieldError(id,message){$(id+'-error').textContent=message;const input=$('auth-'+id);if(input)input.setAttribute('aria-invalid',String(Boolean(message)));return Boolean(message)}
async function submitAuth(e) {
  e.preventDefault();
  if (authBusy) return;
  const signup = authMode === 'signup';
  const email = $('auth-email').value.trim();
  const password = $('auth-password').value;
  const username = signup ? $('auth-username').value.trim() : '';
  const displayName = signup ? $('auth-name').value.trim() : '';
  let bad = false;
  bad = fieldError('email', /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) && email.length <= 254 ? '' : 'Geçerli bir e-posta adresi gir.') || bad;
  bad = fieldError('password', !password ? 'Parolanı gir.' : signup && (password.length < 15 || password.length > 128) ? '15–128 karakter kullan.' : '') || bad;
  if (signup) {
    bad = fieldError('username', username && username.length <= 50 ? '' : '1–50 karakterlik bir kullanıcı adı gir.') || bad;
    bad = fieldError('name', displayName && displayName.length <= 100 ? '' : '1–100 karakterlik bir görünen ad gir.') || bad;
    bad = fieldError('confirm', $('auth-confirm').value === password ? '' : 'Parolalar eşleşmiyor.') || bad;
    bad = fieldError('terms', $('auth-terms').checked ? '' : 'Hesap oluşturmak için kutuyu işaretle.') || bad;
  }
  if (bad) {
    authScreen.querySelector('[aria-invalid="true"]')?.focus();
    return;
  }
  const submit = $('auth-form').querySelector('[type=submit],.auth-submit');
  authBusy = true;
  submit.disabled = true;
  submit.textContent = 'Devam ediliyor…';
  $('auth-error').textContent = '';
  try {
    if (signup) {
      await window.accountService.register({email, password, username, displayName});
      showAuth('login');
      $('auth-email').value = email;
      toast('Hesabın oluşturuldu. E-posta ve parolanla giriş yapabilirsin.');
    } else {
      const user = await window.accountService.login({email, password});
      profileData = {...profileData, ...user};
      signedIn = true;
      await window.playlistUI.setUser(user);
      finishAuth();
      toast('Giriş yapıldı.');
    }
  } catch (error) {
    const errorElement = $('auth-error');
    if (errorElement) errorElement.textContent = error.message || 'İşlem tamamlanamadı. Tekrar dene.';
    else toast(error.message || 'İşlem tamamlanamadı. Tekrar dene.');
  } finally {
    authBusy = false;
    if (submit.isConnected) {
      submit.disabled = false;
      submit.textContent = signup ? 'Kaydol' : 'Oturum aç';
    }
  }
}
function finishAuth(){authScreen.hidden=true;authScreen.innerHTML='';document.body.classList.remove('auth-open');history.replaceState(null,'',location.pathname+location.search);goHome();refreshIdentity()}
$('logout').onclick=async()=>{try{await window.accountService.logout();signedIn=false;window.playlistUI.setUser(null);profileData={displayName:'Misafir',email:'',photo:''};goHome();showAuth('login')}catch{toast('Oturum kapatılamadı. Tekrar dene.')}};
document.addEventListener('click',e=>{const edit=e.target.closest('[data-edit-profile]');if(edit){$('display-name').value=profileData.displayName;$('edit-photo-preview').innerHTML=profileData.photo?`<img src="${profileData.photo}" alt="">`:esc(profileData.displayName.charAt(0));editDialog.showModal()}const auth=e.target.closest('[data-auth]');if(auth)showAuth(auth.dataset.auth);if(e.target.closest('[data-auth-home]')){finishAuth()}});
$('close-profile-edit').onclick=()=>editDialog.close();let pendingPhoto=null;
$('profile-photo').onchange=e=>{const file=e.target.files[0];if(!file)return;if(!['image/jpeg','image/png','image/webp'].includes(file.type)||file.size>5*1024*1024){toast('5 MB altında JPG, PNG veya WebP seç.');return}if(pendingPhoto)URL.revokeObjectURL(pendingPhoto);pendingPhoto=URL.createObjectURL(file);$('edit-photo-preview').innerHTML=`<img src="${pendingPhoto}" alt="Seçilen fotoğraf">`};
$('profile-edit-form').onsubmit=e=>{e.preventDefault();const name=$('display-name').value.trim();if(!name){$('display-name').setCustomValidity('Bir görünen ad gir.');$('display-name').reportValidity();return}profileData.displayName=name;if(pendingPhoto){if(profileData.photo)URL.revokeObjectURL(profileData.photo);profileData.photo=pendingPhoto;pendingPhoto=null}try{localStorage.setItem('backendtest-profile-name',name)}catch{}editDialog.close();openAccountPage(profileView||'profile');refreshIdentity();toast('Profil bilgilerin güncellendi.')};$('display-name').oninput=()=>{$('display-name').setCustomValidity('')};
document.addEventListener('change',e=>{if(e.target.id==='compact-mode')document.body.classList.toggle('compact-library',e.target.checked);if(e.target.id==='settings-shuffle'&&state.shuffle!==e.target.checked)$('shuffle').click()});
// Hesap formlarında oynatıcı kısayollarını engelle.
window.addEventListener('keydown',e=>{if(document.body.classList.contains('auth-open')||editDialog.open)e.stopImmediatePropagation()},true);
restoreSession();
async function restoreSession(){
   try{
        const user = await window.accountService.me();
        if(user){
            profileData={...profileData,...user};
            signedIn=true;
            await window.playlistUI.setUser(user);
            refreshIdentity();
        }else{
            signedIn=false;
            window.playlistUI.setUser(null);
            showAuth('login');

        }
   }catch(error){
        window.playlistUI.setUser(null);
        showAuth('login');
        toast('Oturum geri yüklenemedi. Tekrar dene.');

   }
}
