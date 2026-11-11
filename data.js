// Backend bağlantısı için örnek veriler burada tutulur. Sürelerin birimi saniyedir.
const tracks = [
{id:1,title:'Yanyana',artist:'Uğur Öztürk, Motive, Jefe',album:'Geceye Doğru',genre:'Hip-Hop',duration:214,cover:0},
{id:2,title:'Bir Gece Daha',artist:'Atlas',album:'Şehir Işıkları',genre:'Hip-Hop',duration:192,cover:1},
{id:3,title:'Kıyıya Vuran',artist:'Deniz Aydın',album:'Mavi Saat',genre:'Pop',duration:238,cover:2},
{id:4,title:'Uzak Şehirler',artist:'Kuzey',album:'Yol Hikâyeleri',genre:'Indie',duration:201,cover:3},
{id:5,title:'Senden Kalan',artist:'Duru',album:'Gün Batımı',genre:'Pop',duration:176,cover:4},
{id:6,title:'Yağmurdan Sonra',artist:'Gece Kolektifi',album:'Sessiz Sokaklar',genre:'Chill',duration:245,cover:5},
{id:7,title:'Sonsuz Döngü',artist:'Nova',album:'Frekans',genre:'Elektronik',duration:228,cover:6},
{id:8,title:'İçimde Bir Yer',artist:'Ada & Ekin',album:'Biraz Yavaş',genre:'Indie',duration:198,cover:7},
{id:9,title:'Neon',artist:'Nova',album:'Frekans',genre:'Elektronik',duration:185,cover:6},
{id:10,title:'Pazar Sabahı',artist:'Deniz Aydın',album:'Mavi Saat',genre:'Chill',duration:223,cover:2},
{id:11,title:'Buralardan',artist:'Atlas',album:'Şehir Işıkları',genre:'Hip-Hop',duration:164,cover:1},
{id:12,title:'Rüzgâr',artist:'Kuzey',album:'Yol Hikâyeleri',genre:'Indie',duration:206,cover:3}
];
const playlists = [
{id:'rap',name:'Raptiye Rap Rap',subtitle:'Şehrin ritmini yakala.',cover:0,color:'#554445',trackIds:[1,2,11,7,9]},
{id:'turkce',name:'Türkçe MIX',subtitle:'Her ruh haline bir şarkı.',cover:4,color:'#83604c',trackIds:[3,5,1,8,4]},
{id:'chill',name:"CHILLIN’",subtitle:'Biraz yavaşla. Derin bir nefes al.',cover:5,color:'#354b50',trackIds:[6,10,8,3]},
{id:'yol',name:'Yolculuk başlasın',subtitle:'Cam kenarı, kulaklık ve uzun yollar.',cover:3,color:'#76613f',trackIds:[4,12,8,10]},
{id:'hiphop',name:'HIP-HOP',subtitle:'Baslar açık, dünya kapalı.',cover:1,color:'#65523e',trackIds:[2,11,1]},
{id:'gece',name:'Gece Frekansı',subtitle:'Şehir uyurken seninle.',cover:6,color:'#613582',trackIds:[7,9,2,6]},
{id:'karadeniz',name:'Maviye doğru',subtitle:'Biraz deniz, biraz huzur.',cover:2,color:'#357e85',trackIds:[3,10,6]},
{id:'indie',name:'Kendi halinde',subtitle:'Bildik yollardan biraz uzakta.',cover:7,color:'#7a5a45',trackIds:[8,4,12,5]}
];
const mixes = [
{id:'discover',name:'Haftalık Keşif',desc:'Yeni favorilerin burada. Tam senlik bir keşif.',cover:8,trackIds:[8,5,7,12]},
{id:'mix1',name:'Daily Mix 01',desc:'Atlas, Motive, Kuzey ve daha fazlası',cover:1,trackIds:[2,1,11],tint:'#4ee5de'},
{id:'mix2',name:'Daily Mix 02',desc:'Duru, Deniz Aydın ve daha fazlası',cover:4,trackIds:[5,3,10],tint:'#e0f451'},
{id:'mix3',name:'Daily Mix 03',desc:'Nova, Gece Kolektifi ve daha fazlası',cover:6,trackIds:[7,9,6],tint:'#ff775c'},
{id:'mix4',name:'Daily Mix 04',desc:'Ada & Ekin, Kuzey ve daha fazlası',cover:7,trackIds:[8,4,12],tint:'#e5a9d9'}
];
