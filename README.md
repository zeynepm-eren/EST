

=======
#  Süt Takip Sistemi

 Süt Takip Sistemi; günlük süt siparişlerini, WhatsApp bildirimlerini ve müşteri cari hesaplarını takip etmek için geliştirilmiş mobil uyumlu bir web uygulamasıdır.

Uygulama herhangi bir sunucu veya haricî paket gerektirmeden çalışır. Veriler kullanılan cihazın tarayıcısında saklanır.

## Özellikler

### Sipariş takibi

- Pazartesi–Pazar haftalık görünüm
- Sabah ve akşam için ayrı sipariş girişi
- Girilen süt miktarlarını otomatik toplama
- Hatalı sipariş satırlarını gösterme
- Günlük toplam litre hesabı
- Hazır WhatsApp mesajı oluşturma
- Mesajı panoya kopyalama
- Önceki ve sonraki haftaları görüntüleme
- Haftalık verileri iOS Kestirmeler uygulamasına aktarma

Siparişler aşağıdaki biçimde girilebilir:

    Ahmet 5 L
    Mehmet 2,5 L
    Ayşe 10

## Cari hesap

- Müşteri bazında cari hesap takibi
- Yeni müşteri ekleme
- Süt satışı kaydetme
- Ödeme kaydetme
- Otomatik bakiye hesaplama
- Tarih ve açıklama ekleme
- Haftalık süt, satış ve ödeme toplamları
- Günlere göre cari hareket geçmişi
- Hatalı cari hareketini silme
- Önceki ve sonraki haftaları görüntüleme

## Süt fiyatı

Uygulamadaki ortak süt fiyatı:

    1 litre süt = 36 TL

Hızlı litre butonları:

- 2 litre = 72 TL
- 2,5 litre = 90 TL
- 5 litre = 180 TL
- 15 litre = 540 TL

Bir litre butonuna birden fazla kez basıldığında miktar birikerek artar. Eksiltme butonlarıyla yanlış giriş düzeltilebilir.

Her satış kaydında işlem sırasında kullanılan litre fiyatı ayrıca saklanır. İleride genel fiyat değişse bile eski cari hareketlerin tutarı değişmez.

## Dosya yapısı

- `index.html` — Sayfanın HTML içeriği
- `css/styles.css` — Uygulamanın görsel tasarımı
- `js/shared.js` — Ortak sabitler, tarih ve kayıt yardımcıları
- `js/orders.js` — Sipariş, WhatsApp ve haftalık aktarım işlemleri
- `js/accounts.js` — Cari müşteri, süt satışı, ödeme ve bakiye işlemleri
- `js/app.js` — Siparişler ve Cari Panel arasındaki ekran geçişleri

## Çalıştırma

Projeyi bilgisayarda çalıştırmak için `index.html` dosyasını bir web tarayıcısında açmak yeterlidir.

Haricî paket, kurulum veya derleme işlemi gerekmez.

GitHub Pages üzerinden yayınlandığında uygulama telefon veya bilgisayar tarayıcısından kullanılabilir.

## Veri saklama

Uygulama verileri tarayıcının `localStorage` alanında saklanır.


Sayfanın veya GitHub Pages içeriğinin güncellenmesi normal şartlarda kayıtları silmez. Aynı adres ve aynı tarayıcı kullanılmaya devam edildiği sürece veriler korunur.

Ancak aşağıdaki işlemler veri kaybına neden olabilir:

- Tarayıcıdaki web sitesi verilerini temizlemek
- Gizli sekme kullanmak
- Uygulamayı farklı bir alan adından açmak
- Farklı bir tarayıcı veya cihaz kullanmak
- Telefonun site verilerini depolama alanı nedeniyle temizlemesi

Cari hesaplarda gerçek para kayıtları tutulacağı için düzenli yedek alınması önerilir.

## GitHub Pages

Uygulamayı GitHub Pages üzerinden yayınlamak için:

1. Projeyi GitHub deposuna gönderin.
2. Repository ayarlarından `Settings → Pages` bölümünü açın.
3. Yayın kaynağı olarak `main` dalını seçin.
4. Kök klasörü `/root` olarak ayarlayın.
5. Kaydedip GitHub Pages adresinin oluşmasını bekleyin.

Yayın dalına gönderilen yeni değişiklikler GitHub Pages sitesine otomatik olarak yansıtılır.

## Kullanılan teknolojiler

- HTML5
- CSS3
- Vanilla JavaScript
- Web Storage API
- WhatsApp `wa.me` bağlantıları
- iOS Shortcuts bağlantısı

## Planlanan geliştirmeler

- Verileri dosyaya yedekleme
- Yedekten geri yükleme
- Siparişleri tek tuşla cari hesaba aktarma
- Cari hareketlerini düzenleme ve geri alma
- Aylık raporlar
- Cari ekstresini WhatsApp veya PDF olarak paylaşma
- Çoklu cihaz ve çevrim içi veritabanı desteği

## Lisans

Bu proje kişisel kullanım amacıyla geliştirilmiştir.
