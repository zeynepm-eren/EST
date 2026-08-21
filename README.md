# 🥛  Süt Takip Sistemi

Süt Takip Sistemi; günlük süt siparişlerini, müşteri cari hesaplarını, süt fiyatlarını ve haftalık satış verilerini takip etmek için geliştirilmiş mobil uyumlu bir web uygulamasıdır.

Uygulama GitHub Pages üzerinde yayınlanır. Ortak veriler Firebase Cloud Firestore üzerinde tutulur ve Firebase Authentication ile yetkili kullanıcı girişi yapılır.

📱 Canlı uygulama:

https://zeynepm-eren.github.io/EST/

---

## ✨ Özellikler

### 🥛 Sipariş takibi

- Pazartesi–Pazar haftalık görünüm
- Sabah ve akşam için ayrı sipariş girişi
- Girilen süt miktarlarını otomatik toplama
- Hatalı sipariş satırlarını gösterme
- Günlük toplam litre hesabı
- Haftalık toplam litre hesabı
- Haftalık günlük süt grafiği
- Önceki ve sonraki haftaları görüntüleme
- Hazır WhatsApp mesajı oluşturma
- Mesajı panoya kopyalama
- Haftalık verileri kaydetme
- Siparişleri cihazlar arasında Firebase ile senkronize etme

Siparişler örneğin şu biçimde girilebilir:

```text
Ahmet 5 L
Mehmet 2,5 L
Ayşe 10
```

---

## 💳 Cari hesap

- Müşteri bazında cari hesap takibi
- Yeni müşteri ekleme
- Süt satışı kaydetme
- Ödeme kaydetme
- Otomatik bakiye hesaplama
- Tarih ve açıklama ekleme
- Haftalık süt toplamı
- Haftalık satış toplamı
- Haftalık ödeme toplamı
- Günlere göre cari hareket geçmişi
- Hatalı cari hareketini silme
- Önceki ve sonraki haftaları görüntüleme
- Cari verileri cihazlar arasında senkronize etme

---

## 💰 Süt fiyatı

Başlangıç süt fiyatı **36 TL/L** olarak tanımlıdır.

Cari Panel'in üst bölümündeki fiyat düğmesi kullanılarak:

- yeni litre fiyatı,
- fiyatın geçerli olacağı tarih

kaydedilebilir.

Fiyatlar tarihçeli olarak tutulur.

Örneğin 20 Ağustos tarihinde litre fiyatı 40 TL yapılırsa:

- 19 Ağustos tarihli yeni bir satış eski fiyat üzerinden hesaplanır.
- 20 Ağustos ve sonrasındaki satışlar 40 TL/L üzerinden hesaplanır.
- Daha önce kaydedilmiş satışların fiyatı değiştirilmez.

Her satış hareketinde işlem sırasında kullanılan litre fiyatı ayrıca saklanır. Böylece süt fiyatı daha sonra değiştirilse bile geçmiş cari hesapların tutarı korunur.

---

## 📊 Haftalık grafik

Sipariş ekranında seçili haftanın günlük süt miktarları grafik olarak gösterilir.

Her sütun ilgili günün:

```text
Sabah siparişi + Akşam siparişi
```

toplamını temsil eder.

Ayrıca seçili haftanın toplam süt miktarı litre olarak gösterilir.

---

## ☁️ Firebase senkronizasyonu

Uygulama Firebase altyapısını kullanır.

Kullanılan servisler:

- Firebase Authentication
- Cloud Firestore

Yetkili kullanıcı Firebase Authentication ile giriş yaptıktan sonra Firestore üzerindeki ortak verilere erişebilir.

Firestore aşağıdaki verilerin ortak kaynağıdır:

- Siparişler
- Cari müşteriler
- Cari hareketler
- Süt fiyat geçmişi
- Uygulama ayarları

Bu sayede aynı hesapla giriş yapılan telefon ve bilgisayarlarda aynı veriler görüntülenebilir.

---

## 💾 Yerel veri ve yedekleme

Firestore uygulamanın ana veri kaynağıdır.

Bunun yanında tarayıcıdaki `localStorage`, cihaz üzerindeki yerel kopya/yedek olarak kullanılmaya devam eder.

Kullanılan temel yerel kayıt anahtarları:

```text
sut-takip-veriler
sut-takip-cariler
sut-takip-ayarlar
sut-takip-sync
```

Firebase'e ilk geçiş sırasında ayrıca eski yerel verilerin yedeği alınır.

İlk Firebase kurulumu sırasında Firestore boşsa, eski verilerin bulunduğu cihazdan açık kullanıcı onayıyla tek seferlik aktarım yapılır.

Boş bir cihazın buluttaki dolu veriyi yanlışlıkla ezmesini engellemek için otomatik ilk yükleme yapılmaz.

---

## 🔐 Güvenlik

Uygulama Firebase Authentication ile kullanıcı girişi gerektirir.

Firestore Security Rules ile yalnızca izin verilen Firebase kullanıcısının verileri okumasına ve değiştirmesine izin verilir.

Firebase Web SDK içerisinde bulunan `firebaseConfig` bilgileri istemci uygulamasının Firebase projesine bağlanabilmesi için kullanılır.

Gizli bilgiler, servis hesabı özel anahtarları veya yönetici kimlik bilgileri istemci koduna eklenmemelidir.

---

## 📱 Telefon kullanımı

Uygulama GitHub Pages üzerinden telefondan açılabilir.

Tarayıcının **Ana ekrana ekle** özelliği kullanılarak uygulama telefonun ana ekranına eklenebilir ve normal bir uygulamaya benzer şekilde kullanılabilir.

Firebase sayesinde farklı cihazlarda aynı kullanıcı hesabıyla giriş yapıldığında ortak Firestore verilerine erişilir.

---

## 💬 WhatsApp

Mevcut sürüm WhatsApp mesajını otomatik olarak göndermez.

Uygulama:

1. Sipariş mesajını hazırlar.
2. WhatsApp'ı açar.
3. Mesajı kullanıcıya hazır şekilde gösterir.

Son gönderme işlemi kullanıcı tarafından yapılır.

### Planlanan otomatik WhatsApp sistemi

Gelecekte WhatsApp Business Platform / Cloud API kullanılarak:

```text
Belirlenen sabah saati
        ↓
Firestore'dan sabah siparişleri
        ↓
Otomatik mesaj oluşturma
        ↓
WhatsApp Cloud API
        ↓
Belirlenen telefona otomatik gönderim
```

ve aynı işlemin akşam siparişleri için de yapılması planlanmaktadır.

Bu sistem için Firebase Cloud Functions ve zamanlanmış görevler kullanılabilir.

---

## 📁 Dosya yapısı

```text
EST/
│
├── index.html
│
├── README.md
│
├── css/
│   └── styles.css
│
└── js/
    ├── shared.js
    ├── orders.js
    ├── accounts.js
    ├── app.js
    └── firebase.js
```

### Dosyaların görevleri

`index.html`

Uygulamanın HTML arayüzü.

`css/styles.css`

Uygulamanın mobil ve masaüstü tasarımı.

`js/shared.js`

Ortak sabitler, tarih işlemleri ve kayıt yardımcıları.

`js/orders.js`

Sipariş işlemleri, toplam hesapları, grafik ve WhatsApp mesajları.

`js/accounts.js`

Cari müşteriler, süt satışları, ödemeler, bakiye ve süt fiyatları.

`js/app.js`

Sipariş ve Cari Panel ekranları arasındaki geçişler.

`js/firebase.js`

Firebase Authentication, Firestore senkronizasyonu ve ilk veri aktarımı.

---

## 💻 Yerelde çalıştırma

Firebase kullanılan sürümü doğrudan `index.html` dosyasına çift tıklayarak açmak yerine yerel bir HTTP sunucusu üzerinden çalıştırmak önerilir.

Python yüklüyse proje klasöründe:

```bash
python -m http.server 8000
```

komutu çalıştırılabilir.

Daha sonra:

```text
http://localhost:8000
```

adresinden uygulama açılır.

---

## 🌐 GitHub Pages

Uygulama GitHub Pages üzerinden ücretsiz olarak yayınlanmaktadır.

Yayın ayarları:

```text
Repository:
zeynepm-eren/EST

Branch:
main

Folder:
/(root)
```

GitHub üzerinde:

```text
Settings → Pages
```

bölümünden yayın ayarları yönetilebilir.

`main` branch'ine gönderilen güncellemeler GitHub Pages tarafından yeniden yayınlanır.

---

## 🏗️ Sistem mimarisi

```text
Telefon / Bilgisayar
        │
        ▼
GitHub Pages
HTML + CSS + JavaScript
        │
        ├──── Firebase Authentication
        │
        ▼
Cloud Firestore
        │
        ▼
Ortak sipariş ve cari verileri
```

GitHub Pages uygulamanın arayüz dosyalarını yayınlar.

Firebase ise kullanıcı doğrulaması ve ortak veritabanı görevlerini gerçekleştirir.

---

## 🛠️ Kullanılan teknolojiler

- HTML5
- CSS3
- Vanilla JavaScript
- Web Storage API
- Firebase Authentication
- Cloud Firestore
- Firebase Web SDK
- GitHub Pages
- WhatsApp `wa.me`
- Git
- GitHub

---

## 🚀 Planlanan geliştirmeler

- Sabah ve akşam siparişlerini belirlenen saatlerde otomatik WhatsApp mesajı olarak gönderme
- WhatsApp Business Cloud API entegrasyonu
- Verileri JSON dosyasına yedekleme
- Yedekten geri yükleme
- Siparişleri tek tuşla cari hesaba aktarma
- Cari hareketlerini düzenleme
- İşlem geri alma
- Aylık satış raporları
- Aylık süt miktarı grafikleri
- Cari ekstresini PDF olarak oluşturma
- Cari ekstresini WhatsApp üzerinden paylaşma
- Daha gelişmiş kullanıcı ve yetki sistemi

---

## 📄 Lisans

Bu proje kişisel kullanım amacıyla geliştirilmiştir.
