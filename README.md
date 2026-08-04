# Eren Süt Takip

Mobil odaklı süt siparişi ve müşteri cari hesabı uygulaması.

## Dosya yapısı

- `index.html`: Yalnızca sayfa içeriği ve dosya bağlantıları.
- `css/styles.css`: Uygulamanın tüm görsel stilleri.
- `js/shared.js`: Ortak sabitler, tarih ve kayıt yardımcıları.
- `js/orders.js`: Sipariş, WhatsApp ve haftalık aktarım işlemleri.
- `js/accounts.js`: Cari müşteri, satış, ödeme ve bakiye işlemleri.
- `js/app.js`: Siparişler ve Cari Panel arasındaki ana geçiş.

## Çalıştırma

`index.html` dosyasını tarayıcıda açmak yeterlidir. Haricî paket veya derleme
adımı gerekmez.

## Veri saklama

Siparişler ve cari hareketler mevcut sürümde kullanılan cihazın tarayıcı
depolama alanında tutulur. Tarayıcı verileri temizlenirse uygulama kayıtları da
silinebilir.
