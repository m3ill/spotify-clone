# Spotify Clone

Backend öğrenmek için geliştirilen, Spotify görünümünden esinlenen Türkçe bir müzik uygulaması. Arayüz sade HTML/CSS/JavaScript; backend Express ve PostgreSQL kullanır.

> Eğitim projesidir; Spotify ile bağlantılı değildir. Gerçek Spotify hesabına bağlanmaz ve ses dosyası oynatmaz. Oynatıcı, örnek şarkılar üzerinden durum ve süre simülasyonu yapar.

## Özellikler

- Masaüstü ve mobil arayüz, arama, tür filtreleme ve kitaplık.
- Örnek albüm/playlist detayları, kuyruk, karıştırma, tekrar ve beğeniler.
- PostgreSQL üzerinde kullanıcı kaydı, Argon2 parola hashleme ve cookie tabanlı oturum.
- Giriş yapan kullanıcıya ait playlist oluşturma, listeleme, yeniden adlandırma ve silme.
- Backend'e bağlı şarkı kataloğu: listeleme, detay, ekleme ve düzenleme.
- Kurgusal topluluk profilleri ve tarayıcıda tutulan örnek takip etkileşimleri.

## Teknolojiler

Frontend: HTML, CSS ve JavaScript. Backend: Node.js, Express 5, PostgreSQL (`pg`), Argon2, `express-session`, `cors` ve `dotenv`.

## Yerelde çalıştırma

Node.js/npm, PostgreSQL ve frontend sunucusu için Python 3 gerekir.

### 1. Backend ayarları

```sh
cd backend
npm ci
cp .env.example .env
```

`.env` içindeki `PGHOST`, `PGPORT`, `PGDATABASE`, `PGUSER`, `PGPASSWORD` alanlarını kendi yerel veritabanına göre doldur. `SESSION_SECRET` için örnek değeri değiştir; rastgele değer üretmek için:

```sh
node -e "console.log(require('node:crypto').randomBytes(32).toString('hex'))"
```

Bu değeri yalnız `.env` dosyana yaz. `.env` Git'e eklenmez; `.env.example` gerçek kimlik bilgisi içermez.

### 2. Veritabanı

Mevcut backend, önceden oluşturulmuş bir PostgreSQL şeması bekler. Repoda henüz migration/şema veya seed dosyası yoktur; **yalnız `npm ci` çalıştırmak tam kurulum sağlamaz**.

Kaynak kodun kullandığı tablolar:

| Tablo | Kullanılan sütunlar |
| --- | --- |
| `users` | `id`, `username`, `display_name`, `bio`, `email`, `password_hash` |
| `playlists` | `id`, `user_id`, `name` |
| `songs` | `id`, `title`, `duration_seconds` |
| `playlist_songs` | `playlist_id`, `song_id` |

Kimlik sütunlarında otomatik ID üretimi, kullanıcı adı/e-posta üzerinde benzersizlik ve playlist–şarkı çifti üzerinde benzersizlik gerekir. Backend bazı hataları `users_username_key`, `users_email_key` ve `playlist_songs_song_id_fkey` kısıt adlarıyla eşler. Bu tablo özeti migration değildir; kendi şemanı mevcut sorgular ve ilişkilerle uyumlu hazırlaman gerekir.

### 3. API sunucusu

`backend/` klasöründe:

```sh
node server.js
```

API adresi: `http://localhost:3000`. Basit canlılık kontrolü: `GET /health` (veritabanı bağlantısını kontrol etmez).

### 4. Frontend

İkinci terminalde repo kökünden:

```sh
python3 -m http.server 5173 --bind 127.0.0.1
```

Tarayıcıda **http://localhost:5173** adresini aç. Mevcut API çağrıları `localhost:3000`, CORS izni ise `http://localhost:5173` kullanır; tarayıcı adresinde `127.0.0.1` kullanmak bu ayarla eşleşmez.

Frontend sunucusunu yalnız yerel geliştirmede kullan: Python sunucusu proje klasörünü sunduğu için `.gitignore`, `.env` dosyasına HTTP erişimini engellemez.

## API özeti

| Metot | Yol | İşlev / oturum |
| --- | --- | --- |
| GET | `/health` | Canlılık kontrolü |
| GET | `/users`, `/users/:id` | Kullanıcı profilleri |
| POST | `/auth/register` | Kayıt: `username`, `display_name`, `email`, `password`, isteğe bağlı `bio` |
| POST | `/auth/login` | `email` ve `password` ile oturum açma |
| GET | `/me` | Geçerli kullanıcı; oturum gerekir |
| POST | `/auth/logout` | Oturumu kapatma |
| GET, POST | `/playlists` | Kullanıcının listeleri; oturum gerekir |
| PATCH, DELETE | `/playlists/:id` | Kullanıcının listesini değiştirme/silme; oturum gerekir |
| GET | `/songs`, `/songs/:id` | Şarkı kataloğu ve detay |
| POST, PATCH | `/songs`, `/songs/:id` | Şarkı ekleme/düzenleme |
| GET, POST | `/playlists/:id/songs` | Liste şarkıları / `songId` ile ekleme; liste sahibinin oturumu gerekir |

Playlist oluşturma/yeniden adlandırma gövdesi `name`; şarkı oluşturma gövdesi `title` ve saniye cinsinden `duration_seconds` kullanır. Kayıt parolası mevcut backend'de 15–128 karakterdir.

## Dosya yapısı

```text
├── index.html / styles.css   # Arayüz
├── app.js / data.js          # Örnek katalog ve oynatıcı
├── account.js               # Hesap ekranları
├── account-service.js       # Gerçek auth API çağrıları
├── playlist-ui.js           # Kullanıcı playlistleri ve API bağlantısı
├── songs-ui.js              # Şarkı kataloğu ve API bağlantısı
├── community.js             # Kurgusal topluluk verileri
├── assets/                  # Yerel SVG kapaklar
└── backend/
    ├── server.js / db.js     # Express API ve PostgreSQL bağlantısı
    ├── .env.example         # Güvenli yapılandırma şablonu
    ├── hash-test.mjs         # Sabit örnek parolayla Argon2 denemesi
    └── package*.json        # Bağımlılıklar ve kilit dosyası
```

## Mevcut sınırlar

- Proje geliştirme aşamasındadır; üretime hazır değildir. Session deposu varsayılan bellek deposudur, cookie `secure: false` kullanır.
- Şarkı ekleme/düzenleme endpoint'lerinde henüz oturum veya yönetici yetkisi kontrolü yoktur.
- Playlist'e şarkı ekleme/listeleme API'de bulunur; frontend entegrasyonu ve playlist'ten şarkı çıkarma endpoint'i henüz yoktur.
- Örnek oynatıcı kataloğu ile PostgreSQL şarkı kataloğu ayrıdır; sunucudaki playlist şarkıları oynatıcıya henüz aktarılmaz.
- Topluluk verileri, bazı profil alanları ve beğeniler demo/tarayıcı verisidir; hepsi backend'e kaydedilmez.
- Otomatik test paketi henüz yoktur; `npm test` yer tutucudur. Veritabanı migration/seed dosyaları henüz eklenmemiştir.

## Klavye

Boşluk: çal/duraklat · Oklar: 5 saniye ileri/geri · `/`: aramayı aç.
