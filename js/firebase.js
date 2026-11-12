"use strict";

// Firebase Authentication + Firestore ortak veri katmanı.
// localStorage yerel yedek/önbellek olarak korunur.

const firebaseConfig = {
  apiKey: "AIzaSyCWpFMYIwQAto0QvdbRq188Bo2h18rUaP8",
  authDomain: "eren-sut-takibi.firebaseapp.com",
  projectId: "eren-sut-takibi",
  storageBucket: "eren-sut-takibi.firebasestorage.app",
  messagingSenderId: "947211305276",
  appId: "1:947211305276:web:5766831f6b92c33dba1e39"
};

const BULUT_KOLEKSIYONU = "est";
const YEREL_YEDEK_ANAHTARI =
  "eren-sut-takip-firebase-oncesi-yedek-v1";

const girisKatmani = eleman("#girisKatmani");
const girisFormu = eleman("#girisFormu");
const girisEposta = eleman("#girisEposta");
const girisSifre = eleman("#girisSifre");
const girisButonu = eleman("#girisButonu");
const girisAciklama = eleman("#girisAciklama");
const girisHata = eleman("#girisHata");
const gocPaneli = eleman("#gocPaneli");
const yerelVeriOzeti = eleman("#yerelVeriOzeti");
const yereliBulutaAktar = eleman("#yereliBulutaAktar");
const bulutDurum = eleman("#bulutDurum");
const cikisButonu = eleman("#cikisButonu");

let auth = null;
let db = null;
let bulutHazir = false;
let aktifKullanici = null;
let dinleyiciIptalleri = [];
const kaydetmeZamanlayicilari = new Map();
const bekleyenVeriler = new Map();
const ucustakiYazmalar = new Map();

// Buluta henüz ulaşmamış kayıtları cihazda işaretler. Sayfa kapanırsa
// bir sonraki açılışta önce bu kayıtlar gönderilir, sonra bulut indirilir.
const BEKLEYEN_YAZMA_ANAHTARI = "eren-sut-takip-bekleyen-yazma";
const BEKLEYEN_YAZMA_OMRU_MS = 3 * 24 * 60 * 60 * 1000;

function bekleyenIsaretleri() {
  const kayit = kayitOku(BEKLEYEN_YAZMA_ANAHTARI, {});

  return kayit && typeof kayit === "object"
    ? kayit
    : {};
}

function bekleyenIsaretle(tur) {
  try {
    const isaretler = bekleyenIsaretleri();
    isaretler[tur] = Date.now();
    localStorage.setItem(
      BEKLEYEN_YAZMA_ANAHTARI,
      JSON.stringify(isaretler)
    );
  } catch {
    // Depolama kapalıysa sessizce devam et.
  }
}

function bekleyenIsaretiniKaldir(tur) {
  try {
    const isaretler = bekleyenIsaretleri();
    delete isaretler[tur];
    localStorage.setItem(
      BEKLEYEN_YAZMA_ANAHTARI,
      JSON.stringify(isaretler)
    );
  } catch {
    // Depolama kapalıysa sessizce devam et.
  }
}

// Bu cihazın gönderilmemiş ya da yolda olan bir kaydı varsa,
// buluttan gelen (daha eski) veri ekrandaki yeni girişin üzerine yazılmaz.
function yazmaBekliyor(tur) {
  return (
    kaydetmeZamanlayicilari.has(tur) ||
    (ucustakiYazmalar.get(tur) || 0) > 0
  );
}

function bulutDurumunuGoster(metin, tur = "") {
  bulutDurum.textContent = metin;
  bulutDurum.className = "bulut-durum";

  if (tur) {
    bulutDurum.classList.add(tur);
  }
}

function hataMesaji(error) {
  const kod = error && error.code
    ? error.code
    : "";

  const mesajlar = {
    "auth/invalid-credential":
      "E-posta veya şifre hatalı.",
    "auth/invalid-email":
      "E-posta adresini kontrol et.",
    "auth/missing-password":
      "Şifreni gir.",
    "auth/too-many-requests":
      "Çok fazla deneme yapıldı. Biraz sonra tekrar dene.",
    "permission-denied":
      "Bu hesabın Firestore erişim izni yok.",
    "firestore/permission-denied":
      "Bu hesabın Firestore erişim izni yok."
  };

  return mesajlar[kod] ||
    "Bağlantı kurulamadı. İnternet bağlantısını ve Firebase ayarlarını kontrol et.";
}

function yerelYedekAl() {
  if (localStorage.getItem(YEREL_YEDEK_ANAHTARI)) {
    return;
  }

  const yedek = {
    createdAt: new Date().toISOString(),
    siparisler: kayitOku(VERI_ANAHTARI, {}),
    cariler: kayitOku(CARI_ANAHTARI, {}),
    ayarlar: kayitOku(AYAR_ANAHTARI, {}),
    sync: kayitOku(SYNC_ANAHTARI, {})
  };

  localStorage.setItem(
    YEREL_YEDEK_ANAHTARI,
    JSON.stringify(yedek)
  );
}

function siparisliGunSayisi(veriler) {
  let sayi = 0;

  Object.values(veriler || {}).forEach(
    (hafta) => {
      Object.values(hafta || {}).forEach(
        (gun) => {
          if (
            gun &&
            (
              String(gun.sabah || "").trim() ||
              String(gun.aksam || "").trim()
            )
          ) {
            sayi++;
          }
        }
      );
    }
  );

  return sayi;
}

function yerelVeriBilgisi() {
  const siparisler =
    kayitOku(VERI_ANAHTARI, {});

  const cariler =
    kayitOku(
      CARI_ANAHTARI,
      {
        musteriler: [],
        hareketler: []
      }
    );

  const ayarlar =
    kayitOku(
      AYAR_ANAHTARI,
      {
        aliciAdi: "",
        telefon: ""
      }
    );

  const musteriler = Array.isArray(cariler.musteriler)
    ? cariler.musteriler
    : [];

  const hareketler = Array.isArray(cariler.hareketler)
    ? cariler.hareketler
    : [];

  const fiyatGecmisi = Array.isArray(cariler.fiyatGecmisi)
    ? cariler.fiyatGecmisi
    : [];

  const ozelFiyatVar = fiyatGecmisi.some(
    (kayit) => {
      const tarih = String(kayit && kayit.tarih || "");
      const fiyat = Number(kayit && kayit.fiyat);

      return (
        /^\d{4}-\d{2}-\d{2}$/.test(tarih) &&
        Number.isFinite(fiyat) &&
        fiyat > 0 &&
        !(tarih === "1900-01-01" && fiyat === 36)
      );
    }
  );

  const siparisliGun =
    siparisliGunSayisi(siparisler);

  const varsayilanCariDisindaVeri =
    musteriler.length > 1 ||
    musteriler.some(
      (musteri) =>
        !(musteri.id === "ahmet" && musteri.ad === "Ahmet")
    );

  const ayarVar = Boolean(
    String(ayarlar.aliciAdi || "").trim() ||
    String(ayarlar.telefon || "").trim()
  );

  return {
    siparisler,
    cariler,
    ayarlar,
    siparisliGun,
    musteriSayisi: musteriler.length,
    hareketSayisi: hareketler.length,
    fiyatKaydiSayisi: fiyatGecmisi.length,
    veriVar:
      siparisliGun > 0 ||
      hareketler.length > 0 ||
      varsayilanCariDisindaVeri ||
      ayarVar ||
      ozelFiyatVar
  };
}

function yerelOzetiGoster() {
  const bilgi = yerelVeriBilgisi();

  yerelVeriOzeti.innerHTML = `
    <div class="yerel-veri-satiri">
      <span>Sipariş bulunan gün</span>
      <strong>${bilgi.siparisliGun}</strong>
    </div>
    <div class="yerel-veri-satiri">
      <span>Cari müşteri</span>
      <strong>${bilgi.musteriSayisi}</strong>
    </div>
    <div class="yerel-veri-satiri">
      <span>Cari hareket</span>
      <strong>${bilgi.hareketSayisi}</strong>
    </div>
    <div class="yerel-veri-satiri">
      <span>Fiyat kaydı</span>
      <strong>${bilgi.fiyatKaydiSayisi}</strong>
    </div>
  `;

  yereliBulutaAktar.disabled =
    !bilgi.veriVar;

  if (!bilgi.veriVar) {
    girisHata.textContent =
      "Bu cihazda aktarılacak eski kayıt görünmüyor. İlk aktarımı eski verilerin bulunduğu telefondan yap.";
  } else {
    girisHata.textContent = "";
  }
}

function girisEkraniniGoster() {
  bulutHazir = false;
  aktifKullanici = null;
  girisKatmani.classList.remove("gizli");
  girisFormu.classList.remove("gizli");
  gocPaneli.classList.add("gizli");
  cikisButonu.classList.add("gizli");
  girisAciklama.textContent =
    "Ortak verilere ulaşmak için giriş yap.";
  girisHata.textContent = "";
  girisSifre.value = "";
  bulutDurumunuGoster("Giriş gerekli");
}

function dinleyicileriDurdur() {
  dinleyiciIptalleri.forEach(
    (iptal) => {
      try {
        iptal();
      } catch {
        // Dinleyici zaten kapanmış olabilir.
      }
    }
  );

  dinleyiciIptalleri = [];
}

function belge(tur) {
  return db
    .collection(BULUT_KOLEKSIYONU)
    .doc(tur);
}

function bulutVerisiniUygula(tur, veri) {
  if (tur === "siparisler") {
    siparisVerileriniUygula(veri || {});
    return;
  }

  if (tur === "cariler") {
    cariVerileriniUygula(veri || {});
    return;
  }

  if (tur === "ayarlar") {
    ayarlariUygula(veri || {});
    return;
  }

  if (tur === "inekler" && typeof inekVerileriniUygula === "function") {
    inekVerileriniUygula(veri || {});
  }
}

function yereldenOku(tur) {
  if (tur === "siparisler") {
    return kayitOku(VERI_ANAHTARI, {});
  }

  if (tur === "cariler") {
    return kayitOku(CARI_ANAHTARI, {});
  }

  if (tur === "inekler") {
    return kayitOku(INEK_ANAHTARI, {});
  }

  return kayitOku(AYAR_ANAHTARI, {});
}

// Önceki oturumda buluta ulaşamamış kayıtları tamamlar.
async function bekleyenYazmalariTamamla() {
  const isaretler = bekleyenIsaretleri();

  for (const tur of ["siparisler", "cariler", "ayarlar", "inekler"]) {
    const zaman = Number(isaretler[tur]);

    if (!zaman) {
      continue;
    }

    if (Date.now() - zaman > BEKLEYEN_YAZMA_OMRU_MS) {
      bekleyenIsaretiniKaldir(tur);
      continue;
    }

    try {
      await belgeyeYaz(
        tur,
        JSON.parse(JSON.stringify(yereldenOku(tur) || {}))
      );
      bekleyenIsaretiniKaldir(tur);
    } catch (error) {
      console.error(
        `Bekleyen ${tur} kaydı gönderilemedi:`,
        error
      );
    }
  }
}

async function ilkBulutVerileriniIndir() {
  yerelYedekAl();
  await bekleyenYazmalariTamamla();

  const turler = [
    "siparisler",
    "cariler",
    "ayarlar",
    "inekler"
  ];

  const sonuc = await Promise.all(
    turler.map(
      (tur) => belge(tur).get()
    )
  );

  sonuc.forEach(
    (snapshot, index) => {
      if (!snapshot.exists) {
        return;
      }

      const kayit = snapshot.data() || {};
      bulutVerisiniUygula(
        turler[index],
        kayit.value
      );
    }
  );
}

function gercekZamanliDinlemeyiBaslat() {
  dinleyicileriDurdur();

  ["siparisler", "cariler", "ayarlar", "inekler"]
    .forEach(
      (tur) => {
        const iptal = belge(tur).onSnapshot(
          (snapshot) => {
            if (!snapshot.exists) {
              return;
            }

            // Kendi kaydımızın yankısı ya da kayıt beklerken gelen eski
            // veri: uygularsak yeni yazılan litre/hareket ekrandan silinir.
            if (
              snapshot.metadata.hasPendingWrites ||
              yazmaBekliyor(tur)
            ) {
              return;
            }

            const kayit = snapshot.data() || {};
            bulutVerisiniUygula(
              tur,
              kayit.value
            );

            bulutDurumunuGoster(
              "☁️ Bulut bağlı",
              "basarili"
            );
          },
          (error) => {
            console.error(
              "Firestore dinleme hatası:",
              error
            );

            bulutDurumunuGoster(
              "Bulut hatası",
              "hata"
            );
          }
        );

        dinleyiciIptalleri.push(iptal);
      }
    );
}

async function bulutOturumunuHazirla(kullanici) {
  aktifKullanici = kullanici;
  bulutHazir = false;
  girisHata.textContent = "";
  girisAciklama.textContent =
    `${kullanici.email || "Kullanıcı"} ile giriş yapıldı. Bulut kontrol ediliyor…`;
  girisFormu.classList.add("gizli");
  gocPaneli.classList.add("gizli");
  cikisButonu.classList.remove("gizli");
  bulutDurumunuGoster("Bağlanıyor…");

  try {
    const meta = await belge("meta").get();

    if (!meta.exists || !meta.data().initialized) {
      girisAciklama.textContent =
        "Bulut veritabanı henüz ilk verisini bekliyor.";
      gocPaneli.classList.remove("gizli");
      yerelOzetiGoster();
      bulutDurumunuGoster("İlk aktarım gerekli");
      return;
    }

    await ilkBulutVerileriniIndir();
    bulutHazir = true;
    gercekZamanliDinlemeyiBaslat();
    girisKatmani.classList.add("gizli");
    bulutDurumunuGoster(
      "☁️ Bulut bağlı",
      "basarili"
    );
  } catch (error) {
    console.error("Bulut hazırlama hatası:", error);
    girisHata.textContent = hataMesaji(error);
    bulutDurumunuGoster("Bulut hatası", "hata");
  }
}

window.bulutaKaydet = function bulutaKaydet(
  tur,
  veri
) {
  if (
    !bulutHazir ||
    !aktifKullanici ||
    !db
  ) {
    return;
  }

  const kopya = JSON.parse(
    JSON.stringify(veri || {})
  );

  if (kaydetmeZamanlayicilari.has(tur)) {
    clearTimeout(
      kaydetmeZamanlayicilari.get(tur)
    );
  }

  bekleyenVeriler.set(tur, kopya);
  bekleyenIsaretle(tur);
  bulutDurumunuGoster("Kaydediliyor…");

  const timer = setTimeout(
    () => bekleyeniGonder(tur),
    650
  );

  kaydetmeZamanlayicilari.set(
    tur,
    timer
  );
};

// Cari verisi bir işlem (transaction) içinde buluttaki güncel veriyle
// birleştirilerek yazılır: başka cihazın eklediği hareketler ezilmez.
async function belgeyeYaz(tur, kopya) {
  const ref = belge(tur);
  const zaman =
    firebase.firestore.FieldValue.serverTimestamp();

  const birlestirici =
    tur === "cariler" && typeof cariBirlestir === "function"
      ? cariBirlestir
      : tur === "inekler" && typeof inekBirlestir === "function"
        ? inekBirlestir
        : null;

  if (birlestirici) {
    return db.runTransaction(async (islem) => {
      const snapshot = await islem.get(ref);
      const sunucu = snapshot.exists
        ? (snapshot.data() || {}).value
        : {};
      const birlesik = birlestirici(sunucu, kopya);

      islem.set(
        ref,
        {
          value: birlesik,
          updatedAt: zaman,
          updatedBy: aktifKullanici.uid
        },
        {
          merge: true
        }
      );

      return birlesik;
    });
  }

  await ref.set(
    {
      value: kopya,
      updatedAt: zaman,
      updatedBy: aktifKullanici.uid
    },
    {
      merge: true
    }
  );

  return kopya;
}

async function bekleyeniGonder(tur) {
  kaydetmeZamanlayicilari.delete(tur);

  if (!bekleyenVeriler.has(tur) || !db || !aktifKullanici) {
    return;
  }

  const kopya = bekleyenVeriler.get(tur);
  bekleyenVeriler.delete(tur);
  ucustakiYazmalar.set(tur, (ucustakiYazmalar.get(tur) || 0) + 1);

  try {
    const yazilan = await belgeyeYaz(tur, kopya);

    ucustakiYazmalar.set(tur, ucustakiYazmalar.get(tur) - 1);

    if (!yazmaBekliyor(tur)) {
      bekleyenIsaretiniKaldir(tur);

      // Birleştirme başka cihazdan gelen kayıtları da içerebilir;
      // ekranı buluttaki son hâle getir.
      if (tur === "cariler" || tur === "inekler") {
        bulutVerisiniUygula(tur, yazilan);
      }
    }

    bulutDurumunuGoster(
      "☁️ Bulut bağlı",
      "basarili"
    );
  } catch (error) {
    ucustakiYazmalar.set(tur, ucustakiYazmalar.get(tur) - 1);

    console.error(
      `Firestore ${tur} kaydetme hatası:`,
      error
    );

    bulutDurumunuGoster(
      "Kaydedilemedi, tekrar denenecek",
      "hata"
    );

    // Veri bu cihazda duruyor; daha yeni bir kayıt beklemiyorsa
    // aynı veriyi birkaç saniye sonra yeniden dene.
    const izinYok =
      error &&
      String(error.code || "").includes("permission-denied");

    if (izinYok) {
      bulutDurumunuGoster("Kaydetme izni yok", "hata");
    }

    if (!izinYok && !bekleyenVeriler.has(tur) && bulutHazir) {
      bekleyenVeriler.set(tur, kopya);
      kaydetmeZamanlayicilari.set(
        tur,
        setTimeout(() => bekleyeniGonder(tur), 5000)
      );
    }
  }
}

// Uygulama arka plana atılır ya da kapatılırsa bekleyen kayıtları
// 650 ms beklemeden hemen gönder.
function bekleyenleriHemenGonder() {
  Array.from(kaydetmeZamanlayicilari.keys()).forEach((tur) => {
    clearTimeout(kaydetmeZamanlayicilari.get(tur));
    bekleyeniGonder(tur);
  });
}

document.addEventListener("visibilitychange", () => {
  if (document.visibilityState === "hidden") {
    bekleyenleriHemenGonder();
  }
});

window.addEventListener("pagehide", bekleyenleriHemenGonder);

girisFormu.addEventListener(
  "submit",
  async (olay) => {
    olay.preventDefault();
    girisHata.textContent = "";
    girisButonu.disabled = true;
    girisButonu.textContent = "Giriş yapılıyor…";

    try {
      await auth.signInWithEmailAndPassword(
        girisEposta.value.trim(),
        girisSifre.value
      );
    } catch (error) {
      console.error("Giriş hatası:", error);
      girisHata.textContent = hataMesaji(error);
    } finally {
      girisButonu.disabled = false;
      girisButonu.textContent = "Giriş yap";
    }
  }
);

yereliBulutaAktar.addEventListener(
  "click",
  async () => {
    if (!aktifKullanici) {
      return;
    }

    const bilgi = yerelVeriBilgisi();

    if (!bilgi.veriVar) {
      yerelOzetiGoster();
      return;
    }

    const onay = confirm(
      "Bu cihazdaki mevcut sipariş ve cari kayıtları ilk ortak veri olarak Firestore'a aktarılsın mı?"
    );

    if (!onay) {
      return;
    }

    yerelYedekAl();
    yereliBulutaAktar.disabled = true;
    yereliBulutaAktar.textContent =
      "Aktarılıyor…";
    girisHata.textContent = "";

    try {
      // Batch sayesinde üç veri belgesi ve meta kaydı
      // ya birlikte tamamlanır ya da hiçbiri yazılmaz.
      const batch = db.batch();
      const zaman =
        firebase.firestore.FieldValue.serverTimestamp();

      batch.set(
        belge("siparisler"),
        {
          value: bilgi.siparisler,
          updatedAt: zaman,
          updatedBy: aktifKullanici.uid
        }
      );

      batch.set(
        belge("cariler"),
        {
          value: bilgi.cariler,
          updatedAt: zaman,
          updatedBy: aktifKullanici.uid
        }
      );

      batch.set(
        belge("ayarlar"),
        {
          value: bilgi.ayarlar,
          updatedAt: zaman,
          updatedBy: aktifKullanici.uid
        }
      );

      batch.set(
        belge("meta"),
        {
          initialized: true,
          version: 1,
          migratedAt: zaman,
          migratedBy: aktifKullanici.uid
        }
      );

      await batch.commit();

      await bulutOturumunuHazirla(
        aktifKullanici
      );

      bildirimGoster(
        "Eski kayıtlar Firestore'a aktarıldı."
      );
    } catch (error) {
      console.error("İlk aktarım hatası:", error);
      girisHata.textContent =
        "Aktarım tamamlanamadı. Yerel kayıtlar silinmedi. " +
        hataMesaji(error);
      yereliBulutaAktar.disabled = false;
    } finally {
      yereliBulutaAktar.textContent =
        "Bu cihazdaki verileri buluta aktar";
    }
  }
);

cikisButonu.addEventListener(
  "click",
  async () => {
    const onay = confirm(
      "Bu cihazda Firebase hesabından çıkış yapılsın mı?"
    );

    if (!onay) {
      return;
    }

    bulutHazir = false;
    dinleyicileriDurdur();
    await auth.signOut();
  }
);

try {
  if (!window.firebase) {
    throw new Error("Firebase SDK yüklenemedi.");
  }

  firebase.initializeApp(firebaseConfig);
  auth = firebase.auth();
  db = firebase.firestore();

  auth
    .setPersistence(
      firebase.auth.Auth.Persistence.LOCAL
    )
    .catch(
      (error) =>
        console.warn(
          "Auth persistence ayarlanamadı:",
          error
        )
    );

  auth.onAuthStateChanged(
    (kullanici) => {
      if (!kullanici) {
        dinleyicileriDurdur();
        girisEkraniniGoster();
        return;
      }

      bulutOturumunuHazirla(kullanici);
    }
  );
} catch (error) {
  console.error("Firebase başlatma hatası:", error);
  girisHata.textContent =
    "Firebase başlatılamadı. Uygulama dosyalarını ve internet bağlantısını kontrol et.";
  bulutDurumunuGoster("Firebase hatası", "hata");
}
