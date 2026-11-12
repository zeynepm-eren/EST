"use strict";

// Günlük süt siparişleri, WhatsApp mesajları ve haftalık aktarım.

const alanlar = {
  gunler: eleman("#gunler"),
  haftaAraligi: eleman("#haftaAraligi"),
  secilenTarih: eleman("#secilenTarih"),
  tarihGit: eleman("#tarihGit"),

  sabah: eleman("#sabahSiparisleri"),
  aksam: eleman("#aksamSiparisleri"),

  sabahToplam: eleman("#sabahToplam"),
  aksamToplam: eleman("#aksamToplam"),
  haftaToplamLitre: eleman("#haftaToplamLitre"),
  haftaSatisGrafigi: eleman("#haftaSatisGrafigi"),

  sabahHata: eleman("#sabahHata"),
  aksamHata: eleman("#aksamHata"),

  sabahDurum: eleman("#sabahDurum"),
  aksamDurum: eleman("#aksamDurum"),

  ayarPenceresi: eleman("#ayarPenceresi"),
  aliciAdi: eleman("#aliciAdi"),
  telefon: eleman("#telefon"),

  bildirim: eleman("#bildirim"),

  sutcuSabah: eleman("#sutcuSabah"),
  sutcuAksam: eleman("#sutcuAksam"),
  sutcuHata: eleman("#sutcuHata"),
  sutcuGunToplam: eleman("#sutcuGunToplam"),
  sutcuAyAdi: eleman("#sutcuAyAdi"),
  sutcuFiyatMetni: eleman("#sutcuFiyatMetni"),
  sutcuAyLitre: eleman("#sutcuAyLitre"),
  sutcuAyTutar: eleman("#sutcuAyTutar"),
  sutcuFiyatNotu: eleman("#sutcuFiyatNotu"),
  sutcuFiyatPenceresi: eleman("#sutcuFiyatPenceresi"),
  sutcuFiyatAy: eleman("#sutcuFiyatAy"),
  sutcuFiyatGirdi: eleman("#sutcuFiyatGirdi"),
  sutcuFiyatGecmisi: eleman("#sutcuFiyatGecmisi"),
  haftaKirilim: eleman("#haftaKirilim"),

  syncDurum: eleman("#syncDurum"),
  syncHataDetay: eleman("#syncHataDetay")
};


const durum = {
  haftaBaslangici:
    haftaninPazartesisi(new Date()),

  secilenGun:
    pazartesiSirasi(new Date()),

  veriler:
    kayitOku(VERI_ANAHTARI, {}),

  ayarlar:
    kayitOku(
      AYAR_ANAHTARI,
      {
        aliciAdi: "",
        telefon: ""
      }
    )
};


function haftaAnahtari() {
  return tarihAnahtari(
    durum.haftaBaslangici
  );
}

function secilenTarih() {
  return gunEkle(
    durum.haftaBaslangici,
    durum.secilenGun
  );
}

function gunKaydi() {
  const hafta = haftaAnahtari();

  if (!durum.veriler[hafta]) {
    durum.veriler[hafta] = {};
  }

  if (!durum.veriler[hafta][durum.secilenGun]) {
    durum.veriler[hafta][durum.secilenGun] = {
      sabah: "",
      aksam: "",
      sabahDurum: "",
      aksamDurum: ""
    };
  }

  return durum.veriler[hafta][durum.secilenGun];
}

function verileriKaydet() {
  localStorage.setItem(
    VERI_ANAHTARI,
    JSON.stringify(durum.veriler)
  );

  if (typeof window.bulutaKaydet === "function") {
    window.bulutaKaydet(
      "siparisler",
      durum.veriler
    );
  }
}

function siparisVerileriniUygula(yeniVeriler) {
  const temizVeriler =
    yeniVeriler &&
    typeof yeniVeriler === "object" &&
    !Array.isArray(yeniVeriler)
      ? yeniVeriler
      : {};

  if (
    JSON.stringify(temizVeriler) ===
    JSON.stringify(durum.veriler)
  ) {
    return;
  }

  durum.veriler = temizVeriler;

  localStorage.setItem(
    VERI_ANAHTARI,
    JSON.stringify(durum.veriler)
  );

  ekraniGoster();
}

function ayarlariUygula(yeniAyarlar) {
  const kaynak =
    yeniAyarlar && typeof yeniAyarlar === "object"
      ? yeniAyarlar
      : {};

  // Bilinmeyen alanlar (ör. sütçü fiyatları) korunur.
  const temizAyarlar = {
    ...kaynak,
    aliciAdi:
      typeof kaynak.aliciAdi === "string"
        ? kaynak.aliciAdi
        : "",
    telefon:
      typeof kaynak.telefon === "string"
        ? kaynak.telefon
        : "",
    sutcuFiyatlari: sutcuFiyatlariniTemizle(kaynak.sutcuFiyatlari)
  };

  if (
    JSON.stringify(temizAyarlar) ===
    JSON.stringify(durum.ayarlar)
  ) {
    return;
  }

  durum.ayarlar = temizAyarlar;

  localStorage.setItem(
    AYAR_ANAHTARI,
    JSON.stringify(durum.ayarlar)
  );

  if (alanlar.ayarPenceresi.open) {
    alanlar.aliciAdi.value =
      durum.ayarlar.aliciAdi;
    alanlar.telefon.value =
      durum.ayarlar.telefon;
  }

  sutcuGoster();
}

function siparisleriOku(metin) {
  const gecerli = [];
  const hataliSatirlar = [];

  const satirlar = metin.split(/\r?\n/);

  satirlar.forEach((hamSatir, sira) => {
    const satir = hamSatir.trim();

    if (!satir) {
      return;
    }

    const sonuc = satir.match(
      /^(.*?)\s+([0-9]+(?:[.,][0-9]+)?)\s*[lL]?\s*$/
    );

    if (!sonuc || !sonuc[1].trim()) {
      hataliSatirlar.push(sira + 1);
      return;
    }

    const isim = sonuc[1].trim();

    const litre = Number(
      sonuc[2].replace(",", ".")
    );

    if (!Number.isFinite(litre)) {
      hataliSatirlar.push(sira + 1);
      return;
    }

    gecerli.push({
      isim,
      litre
    });
  });

  const toplam = gecerli.reduce(
    (sonuc, siparis) =>
      sonuc + siparis.litre,
    0
  );

  return {
    gecerli,
    hataliSatirlar,
    toplam
  };
}

function hataGoster(
  metinAlani,
  hataAlani,
  sonuc
) {
  const hataVar =
    sonuc.hataliSatirlar.length > 0;

  metinAlani.classList.toggle(
    "hatali",
    hataVar
  );

  hataAlani.classList.toggle(
    "gizli",
    !hataVar
  );

  hataAlani.textContent = hataVar
    ? `Litre bilgisi okunamayan satır: ${sonuc.hataliSatirlar.join(", ")}`
    : "";
}

function toplamlariHesapla() {
  const sabahSonuc =
    siparisleriOku(alanlar.sabah.value);

  const aksamSonuc =
    siparisleriOku(alanlar.aksam.value);

  const sabah =
    litreYaz(sabahSonuc.toplam);

  const aksam =
    litreYaz(aksamSonuc.toplam);

  alanlar.sabahToplam.textContent = sabah;
  alanlar.aksamToplam.textContent = aksam;

  hataGoster(
    alanlar.sabah,
    alanlar.sabahHata,
    sabahSonuc
  );

  hataGoster(
    alanlar.aksam,
    alanlar.aksamHata,
    aksamSonuc
  );
}


function gunlukSiparisToplami(gunSirasi) {
  const hafta = durum.veriler[haftaAnahtari()] || {};
  const gun = hafta[gunSirasi] || {};
  const sabah = siparisleriOku(gun.sabah || "").toplam;
  const aksam = siparisleriOku(gun.aksam || "").toplam;
  const sutcu = gunSutcuLitresi(gun);

  return {
    sabah,
    aksam,
    musteri: sabah + aksam,
    sutcu,
    toplam: sabah + aksam + sutcu
  };
}

function grafikCubugu(deger, enYuksek, tur, baslik) {
  const sutun = document.createElement("div");
  sutun.className = `grafik-ikili-sutun ${tur}`;
  sutun.title = baslik;

  const etiket = document.createElement("span");
  etiket.className = "grafik-cubuk-deger";
  etiket.textContent = deger > 0 ? litreYaz(deger) : "0";

  const cubuk = document.createElement("div");
  cubuk.className = "grafik-cubuk";
  cubuk.style.height = deger > 0
    ? `${Math.max(4, (deger / enYuksek) * 100)}%`
    : "2px";

  sutun.appendChild(etiket);
  sutun.appendChild(cubuk);

  return sutun;
}

function haftaSatisGrafiginiGoster() {
  const gunToplamlari = Array.from(
    { length: 7 },
    (_, sira) => gunlukSiparisToplami(sira)
  );
  const enYuksek = Math.max(
    1,
    ...gunToplamlari.map((gun) => Math.max(gun.musteri, gun.sutcu))
  );
  const hafta = gunToplamlari.reduce(
    (toplam, gun) => ({
      musteri: toplam.musteri + gun.musteri,
      sutcu: toplam.sutcu + gun.sutcu
    }),
    { musteri: 0, sutcu: 0 }
  );
  const haftaToplami = hafta.musteri + hafta.sutcu;

  alanlar.haftaToplamLitre.textContent =
    `${litreYaz(haftaToplami)} L`;
  alanlar.haftaKirilim.textContent =
    `Bu hafta: müşteri ${litreYaz(hafta.musteri)} L · sütçü ${litreYaz(hafta.sutcu)} L · toplam ${litreYaz(haftaToplami)} L`;
  alanlar.haftaSatisGrafigi.innerHTML = "";

  gunToplamlari.forEach((gun, sira) => {
    const sutun = document.createElement("div");
    sutun.className = "grafik-sutun";

    if (sira === durum.secilenGun) {
      sutun.classList.add("secili-hafta");
    }

    const toplamEtiketi = document.createElement("span");
    toplamEtiketi.className = "grafik-deger";
    toplamEtiketi.textContent = `${litreYaz(gun.toplam)} L`;

    const cubukAlani = document.createElement("div");
    cubukAlani.className = "grafik-cubuk-alani ikili";
    cubukAlani.appendChild(
      grafikCubugu(gun.musteri, enYuksek, "musteri", `Müşteri ${litreYaz(gun.musteri)} L`)
    );
    cubukAlani.appendChild(
      grafikCubugu(gun.sutcu, enYuksek, "sutcu", `Sütçü ${litreYaz(gun.sutcu)} L`)
    );

    const etiket = document.createElement("span");
    etiket.className = "grafik-etiket";
    etiket.textContent = kisaGunler[sira];

    sutun.title =
      `${gunAdlari[sira]}: toplam ${litreYaz(gun.toplam)} L ` +
      `(müşteri ${litreYaz(gun.musteri)} L, sütçü ${litreYaz(gun.sutcu)} L)`;

    sutun.appendChild(toplamEtiketi);
    sutun.appendChild(cubukAlani);
    sutun.appendChild(etiket);
    alanlar.haftaSatisGrafigi.appendChild(sutun);
  });

  alanlar.haftaSatisGrafigi.setAttribute(
    "aria-label",
    gunToplamlari
      .map(
        (gun, sira) =>
          `${gunAdlari[sira]}: müşteri ${litreYaz(gun.musteri)}, sütçü ${litreYaz(gun.sutcu)}, toplam ${litreYaz(gun.toplam)} litre`
      )
      .join(". ") +
      `. Haftalık toplam ${litreYaz(haftaToplami)} litre.`
  );
}

function gunleriGoster() {
  alanlar.gunler.innerHTML = "";

  const bugun = new Date();

  for (let sira = 0; sira < 7; sira++) {
    const tarih = gunEkle(
      durum.haftaBaslangici,
      sira
    );

    const buton =
      document.createElement("button");

    buton.className = "gun";

    if (sira === durum.secilenGun) {
      buton.classList.add("secili");
    }

    if (
      tarihAnahtari(tarih) ===
      tarihAnahtari(bugun)
    ) {
      buton.classList.add("bugun");
    }

    buton.innerHTML = `
      <span>${kisaGunler[sira]}</span>
      <strong>${tarih.getDate()}</strong>
    `;

    buton.addEventListener(
      "click",
      () => {
        durum.secilenGun = sira;
        ekraniGoster();
      }
    );

    alanlar.gunler.appendChild(buton);
  }
}

function haftaBilgisiniGoster() {
  const haftaSonu = gunEkle(
    durum.haftaBaslangici,
    6
  );

  alanlar.haftaAraligi.textContent =
    `${tarihYaz(
      durum.haftaBaslangici,
      {
        day: "numeric",
        month: "short"
      }
    )} – ${tarihYaz(
      haftaSonu,
      {
        day: "numeric",
        month: "short",
        year: "numeric"
      }
    )}`;
}

function alanlariGoster() {
  const kayit = gunKaydi();

  alanlar.sabah.value =
    kayit.sabah || "";

  alanlar.aksam.value =
    kayit.aksam || "";

  alanlar.sabahDurum.textContent =
    kayit.sabahDurum || "";

  alanlar.aksamDurum.textContent =
    kayit.aksamDurum || "";

  alanlar.tarihGit.value = tarihAnahtari(secilenTarih());

  alanlar.secilenTarih.textContent =
    tarihYaz(
      secilenTarih(),
      {
        weekday: "long",
        day: "numeric",
        month: "long",
        year: "numeric"
      }
    );

  toplamlariHesapla();
}

function ekraniGoster() {
  haftaBilgisiniGoster();
  gunleriGoster();
  alanlariGoster();
  sutcuGoster();
  haftaSatisGrafiginiGoster();
  senkronDurumunuGoster();
}

function mesajOlustur(donem) {
  const kayit = gunKaydi();

  const sabahMi =
    donem === "sabah";

  const sonuc =
    siparisleriOku(kayit[donem]);

  const baslik = sabahMi
    ? "☀️ SABAH SÜT AYRIMI"
    : "🌙 AKŞAM SÜT AYRIMI";

  const tarih =
    `${gunAdlari[durum.secilenGun].toLocaleUpperCase("tr-TR")} • ` +
    tarihYaz(
      secilenTarih(),
      {
        day: "numeric",
        month: "long",
        year: "numeric"
      }
    );

  const siparisler =
    sonuc.gecerli.length > 0
      ? sonuc.gecerli
          .map(
            (siparis) =>
              `${siparis.isim} ${litreYaz(siparis.litre)} L`
          )
          .join("\n")
      : "Sipariş yok";

  return (
    `${baslik}\n` +
    `${tarih}\n\n` +
    `${siparisler}\n\n` +
    `Toplam: ${litreYaz(sonuc.toplam)} L`
  );
}

function gunMesajiOlustur(gunSirasi, donem) {
  const tarih = gunEkle(
    durum.haftaBaslangici,
    gunSirasi
  );

  const hafta = haftaAnahtari();
  const gunVerisi = durum.veriler[hafta]
    && durum.veriler[hafta][gunSirasi];

  const metin = gunVerisi
    ? (gunVerisi[donem] || "")
    : "";

  const sonuc = siparisleriOku(metin);

  const sabahMi = donem === "sabah";

  const baslik = sabahMi
    ? "☀️ SABAH SÜT AYRIMI"
    : "🌙 AKŞAM SÜT AYRIMI";

  const tarihMetni =
    `${gunAdlari[gunSirasi].toLocaleUpperCase("tr-TR")} • ` +
    tarihYaz(
      tarih,
      {
        day: "numeric",
        month: "long",
        year: "numeric"
      }
    );

  const siparisler =
    sonuc.gecerli.length > 0
      ? sonuc.gecerli
          .map(
            (siparis) =>
              `${siparis.isim} ${litreYaz(siparis.litre)} L`
          )
          .join("\n")
      : "Sipariş yok";

  return {
    message:
      `${baslik}\n` +
      `${tarihMetni}\n\n` +
      `${siparisler}\n\n` +
      `Toplam: ${litreYaz(sonuc.toplam)} L`,
    rawOrders: metin,
    total: sonuc.toplam,
    hataliSatirlar: sonuc.hataliSatirlar
  };
}

function haftayiDogrula() {
  const hatalar = [];
  const hafta = haftaAnahtari();

  for (let sira = 0; sira < 7; sira++) {
    const gunVerisi = durum.veriler[hafta]
      && durum.veriler[hafta][sira];

    ["sabah", "aksam"].forEach(
      (donem) => {
        const metin = gunVerisi
          ? (gunVerisi[donem] || "")
          : "";

        const sonuc = siparisleriOku(metin);

        if (sonuc.hataliSatirlar.length > 0) {
          const donemAdi = donem === "sabah"
            ? "Sabah"
            : "Akşam";

          hatalar.push(
            `${gunAdlari[sira]} ${donemAdi}: satır ${sonuc.hataliSatirlar.join(", ")}`
          );
        }
      }
    );
  }

  return hatalar;
}

function haftaPayloadOlustur() {
  const gunler = [];

  for (let sira = 0; sira < 7; sira++) {
    const tarih = gunEkle(
      durum.haftaBaslangici,
      sira
    );

    const sabah =
      gunMesajiOlustur(sira, "sabah");

    const aksam =
      gunMesajiOlustur(sira, "aksam");

    gunler.push({
      date: tarihAnahtari(tarih),
      dayName: gunAdlari[sira],
      morning: {
        period: "sabah",
        rawOrders: sabah.rawOrders,
        total: sabah.total,
        message: sabah.message
      },
      evening: {
        period: "aksam",
        rawOrders: aksam.rawOrders,
        total: aksam.total,
        message: aksam.message
      }
    });
  }

  return {
    version: 1,
    weekStart: tarihAnahtari(
      durum.haftaBaslangici
    ),
    createdAt: new Date().toISOString(),
    days: gunler
  };
}

function veriHashiOlustur() {
  const hafta = haftaAnahtari();
  const haftaVerisi =
    durum.veriler[hafta] || {};

  let kaynak = hafta + "|";

  for (let sira = 0; sira < 7; sira++) {
    const gun = haftaVerisi[sira] || {};

    kaynak +=
      (gun.sabah || "") + "§" +
      (gun.aksam || "") + "§";
  }

  let hash = 5381;

  for (let i = 0; i < kaynak.length; i++) {
    hash =
      ((hash << 5) + hash) +
      kaynak.charCodeAt(i);

    hash = hash & hash;
  }

  return String(Math.abs(hash));
}

function senkronDurumunuGoster() {
  const hafta = haftaAnahtari();

  const sync =
    kayitOku(SYNC_ANAHTARI, {});

  if (
    sync.haftaAnahtari !== hafta ||
    !sync.zamanDamgasi
  ) {
    alanlar.syncDurum.textContent =
      "⚠️ Bu hafta otomasyona kaydedilmedi";

    alanlar.syncDurum.className =
      "sync-durum uyari";

    return;
  }

  const mevcutHash = veriHashiOlustur();

  if (mevcutHash !== sync.veriHashi) {
    alanlar.syncDurum.textContent =
      "⚠️ Sipariş değişti, otomasyona tekrar kaydet";

    alanlar.syncDurum.className =
      "sync-durum uyari";

    return;
  }

  const saat = tarihYaz(
    new Date(sync.zamanDamgasi),
    {
      hour: "2-digit",
      minute: "2-digit"
    }
  );

  alanlar.syncDurum.textContent =
    `☁️ Aktarılmak üzere gönderildi: ${saat}`;

  alanlar.syncDurum.className =
    "sync-durum basarili";
}

function syncGonderildiKaydet() {
  const sync = {
    haftaAnahtari: haftaAnahtari(),
    veriHashi: veriHashiOlustur(),
    zamanDamgasi: new Date().toISOString()
  };

  localStorage.setItem(
    SYNC_ANAHTARI,
    JSON.stringify(sync)
  );
}

async function panoyaKopyalaFallback(metin) {
  try {
    await navigator.clipboard.writeText(
      metin
    );
  } catch {
    const geciciAlan =
      document.createElement("textarea");

    geciciAlan.value = metin;

    document.body.appendChild(
      geciciAlan
    );

    geciciAlan.select();

    document.execCommand("copy");

    geciciAlan.remove();
  }
}

async function shortcutAc() {
  alanlar.syncHataDetay.classList.add(
    "gizli"
  );

  const hatalar = haftayiDogrula();

  if (hatalar.length > 0) {
    alanlar.syncHataDetay.textContent =
      "Hatalı satırlar:\n" +
      hatalar.join("\n");

    alanlar.syncHataDetay.classList.remove(
      "gizli"
    );

    bildirimGoster(
      "Önce hatalı satırları düzelt."
    );

    return;
  }

  const payload =
    haftaPayloadOlustur();

  const payloadText =
    JSON.stringify(payload);

  const iosKullanici =
    /iPad|iPhone|iPod/.test(
      navigator.userAgent
    );

  if (iosKullanici) {
    const shortcutUrl =
      "shortcuts://run-shortcut" +
      "?name=" +
        encodeURIComponent(
          "Süt Haftasını Kaydet"
        ) +
      "&input=text" +
      "&text=" +
        encodeURIComponent(payloadText);

    syncGonderildiKaydet();
    senkronDurumunuGoster();

    bildirimGoster(
      "Kestirmeler açılıyor. Haftalık dosyalar kaydedilecek."
    );

    window.location.href = shortcutUrl;
    return;
  }

  await panoyaKopyalaFallback(
    payloadText
  );

  syncGonderildiKaydet();
  senkronDurumunuGoster();

  bildirimGoster(
    "Hafta verisi panoya kopyalandı."
  );
}

function bildirimGoster(metin) {
  alanlar.bildirim.textContent = metin;

  alanlar.bildirim.classList.add(
    "goster"
  );

  clearTimeout(
    bildirimGoster.zamanlayici
  );

  bildirimGoster.zamanlayici =
    setTimeout(
      () => {
        alanlar.bildirim.classList.remove(
          "goster"
        );
      },
      2200
    );
}

function durumuIsaretle(
  donem,
  aciklama
) {
  const kayit = gunKaydi();

  const saat =
    tarihYaz(
      new Date(),
      {
        hour: "2-digit",
        minute: "2-digit"
      }
    );

  const metin =
    `${aciklama}: ${saat}`;

  kayit[`${donem}Durum`] = metin;

  verileriKaydet();

  if (donem === "sabah") {
    alanlar.sabahDurum.textContent =
      metin;
  } else {
    alanlar.aksamDurum.textContent =
      metin;
  }
}

async function mesajiKopyala(donem) {
  const sonuc =
    siparisleriOku(
      gunKaydi()[donem]
    );

  if (
    sonuc.hataliSatirlar.length > 0
  ) {
    bildirimGoster(
      "Önce hatalı satırları düzelt."
    );

    return;
  }

  const mesaj =
    mesajOlustur(donem);

  try {
    await navigator.clipboard.writeText(
      mesaj
    );
  } catch {
    const geciciAlan =
      document.createElement("textarea");

    geciciAlan.value = mesaj;

    document.body.appendChild(
      geciciAlan
    );

    geciciAlan.select();

    document.execCommand("copy");

    geciciAlan.remove();
  }

  durumuIsaretle(
    donem,
    "Mesaj kopyalandı"
  );

  bildirimGoster(
    "Mesaj panoya kopyalandı."
  );
}

function whatsAppAc(donem) {
  const sonuc =
    siparisleriOku(
      gunKaydi()[donem]
    );

  if (
    sonuc.hataliSatirlar.length > 0
  ) {
    bildirimGoster(
      "Önce hatalı satırları düzelt."
    );

    return;
  }

  const telefon =
    durum.ayarlar.telefon
      .replace(/\D/g, "");

  const mesaj =
    encodeURIComponent(
      mesajOlustur(donem)
    );

  const adres = telefon
    ? `https://wa.me/${telefon}?text=${mesaj}`
    : `https://wa.me/?text=${mesaj}`;

  durumuIsaretle(
    donem,
    "WhatsApp açıldı"
  );

  window.open(
    adres,
    "_blank",
    "noopener"
  );
}


alanlar.sabah.addEventListener(
  "input",
  () => {
    const kayit = gunKaydi();

    kayit.sabah =
      alanlar.sabah.value;

    kayit.sabahDurum = "";

    alanlar.sabahDurum.textContent =
      "";

    verileriKaydet();
    toplamlariHesapla();
    haftaSatisGrafiginiGoster();
    senkronDurumunuGoster();
  }
);

alanlar.aksam.addEventListener(
  "input",
  () => {
    const kayit = gunKaydi();

    kayit.aksam =
      alanlar.aksam.value;

    kayit.aksamDurum = "";

    alanlar.aksamDurum.textContent =
      "";

    verileriKaydet();
    toplamlariHesapla();
    haftaSatisGrafiginiGoster();
    senkronDurumunuGoster();
  }
);

// Takvimden tarih seçince doğrudan o güne git.
const tarihGit = alanlar.tarihGit;

tarihGit.addEventListener("click", () => {
  // Bilgisayarda alanın herhangi bir yerine tıklayınca takvim açılsın.
  try {
    tarihGit.showPicker();
  } catch {
    // Desteklemeyen tarayıcıda alan kendi takvimini açar.
  }
});

tarihGit.addEventListener("change", () => {
  if (!tarihGit.value) {
    return;
  }

  const secilen = new Date(`${tarihGit.value}T12:00:00`);

  if (Number.isNaN(secilen.getTime())) {
    return;
  }

  durum.haftaBaslangici = haftaninPazartesisi(secilen);
  durum.secilenGun = pazartesiSirasi(secilen);
  ekraniGoster();
});

// ===== Sipariş yazarken isim önerisi =====
// İsimler cari müşteri listesinden ve daha önce siparişlere yazılmış
// satırlardan gelir; en sık yazılanlar başta. Dokununca satırın başına
// "İsim " yazılır, litreyi sen yazarsın.

function bilinenIsimler() {
  // Öneriler sadece müşteri listesindeki (cari) isimlerden gelir.
  if (typeof aktifMusteriler !== "function") {
    return [];
  }

  return aktifMusteriler()
    .map((musteri) => {
      const ad = String(musteri.ad || "").trim().replace(/\s+/g, " ");

      return {
        ad,
        anahtar: ad.toLocaleLowerCase("tr-TR"),
        sayi: 0
      };
    })
    .filter((isim) => isim.ad);
}

function satirParcasi(alan) {
  const imlec = typeof alan.selectionStart === "number"
    ? alan.selectionStart
    : alan.value.length;
  const once = alan.value.slice(0, imlec);
  const satirBasi = once.lastIndexOf("\n") + 1;

  return {
    satirBasi,
    imlec,
    parca: once.slice(satirBasi)
  };
}

function isimOnerileriniBul(parca) {
  const aranan = parca.trimStart().toLocaleLowerCase("tr-TR");

  if (!aranan.trim() || /\d/.test(aranan)) {
    return [];
  }

  return bilinenIsimler()
    .filter((isim) => {
      if (isim.anahtar === aranan.trim()) {
        return false;
      }

      return (
        isim.anahtar.startsWith(aranan) ||
        isim.anahtar.split(" ").some((kelime) => kelime.startsWith(aranan.trim()))
      );
    })
    .sort((a, b) => {
      const aBas = a.anahtar.startsWith(aranan) ? 0 : 1;
      const bBas = b.anahtar.startsWith(aranan) ? 0 : 1;

      return (
        aBas - bBas ||
        b.sayi - a.sayi ||
        a.ad.localeCompare(b.ad, "tr")
      );
    })
    .slice(0, 6);
}

function isimOnerileriniGizle(kutu) {
  kutu.classList.add("gizli");
  kutu.innerHTML = "";
}

function isimiYerlestir(alan, kutu, ad) {
  const { satirBasi, imlec } = satirParcasi(alan);
  const sonra = alan.value.slice(imlec);
  // İmleçten sonra aynı kelimenin devamı varsa onu da değiştir.
  const kelimeDevami = (sonra.match(/^[^\s\d]*/) || [""])[0];
  const kalan = sonra.slice(kelimeDevami.length).replace(/^ /, "");

  alan.value = `${alan.value.slice(0, satirBasi)}${ad} ${kalan}`;

  const konum = satirBasi + ad.length + 1;
  alan.focus();
  alan.setSelectionRange(konum, konum);
  isimOnerileriniGizle(kutu);

  // Kaydetme ve toplamlar normal yazmadaki gibi çalışsın.
  alan.dispatchEvent(new Event("input", { bubbles: true }));
}

function isimOnerileriniGoster(alan, kutu) {
  if (alan.selectionStart !== alan.selectionEnd) {
    isimOnerileriniGizle(kutu);
    return;
  }

  const oneriler = isimOnerileriniBul(satirParcasi(alan).parca);

  if (oneriler.length === 0) {
    isimOnerileriniGizle(kutu);
    return;
  }

  kutu.innerHTML = "";

  const baslik = document.createElement("div");
  baslik.className = "isim-onerileri-baslik";
  baslik.textContent = "Müşteri listesinden";
  kutu.appendChild(baslik);

  oneriler.forEach((isim) => {
    const satir = document.createElement("button");
    satir.type = "button";
    satir.className = "isim-oneri-satiri";
    satir.textContent = isim.ad;

    // Dokunuş kutudan odağı almasın; klavye açık kalsın.
    satir.addEventListener("pointerdown", (olay) => {
      olay.preventDefault();
      isimiYerlestir(alan, kutu, isim.ad);
    });

    kutu.appendChild(satir);
  });

  kutu.classList.remove("gizli");
}

[
  [alanlar.sabah, eleman("#sabahOnerileri")],
  [alanlar.aksam, eleman("#aksamOnerileri")]
].forEach(([alan, kutu]) => {
  ["input", "click", "keyup"].forEach((olayAdi) =>
    alan.addEventListener(olayAdi, (olay) => {
      if (olayAdi === "keyup" && !/^Arrow|Home|End/.test(olay.key)) {
        return;
      }

      isimOnerileriniGoster(alan, kutu);
    })
  );

  alan.addEventListener("blur", () => {
    setTimeout(() => {
      if (document.activeElement !== alan) {
        isimOnerileriniGizle(kutu);
      }
    }, 150);
  });
});

// ===== Sütçü: günlük sabah/akşam litre, aylık fiyat ve tutar =====
// Litreler günün kaydında (sutcuSabah, sutcuAksam), aylık fiyatlar
// ayarlarda (sutcuFiyatlari: { "2026-11": 26.5 }) tutulur.

const VARSAYILAN_SUTCU_FIYATI = 26.5;

function sutcuFiyatlariniTemizle(fiyatlar) {
  const temiz = {};

  if (fiyatlar && typeof fiyatlar === "object" && !Array.isArray(fiyatlar)) {
    Object.entries(fiyatlar).forEach(([ay, fiyat]) => {
      const sayi = Number(fiyat);

      if (/^\d{4}-\d{2}$/.test(ay) && Number.isFinite(sayi) && sayi > 0) {
        temiz[ay] = Math.round(sayi * 100) / 100;
      }
    });
  }

  return temiz;
}

function ayAnahtari(tarih) {
  return tarihAnahtari(tarih).slice(0, 7);
}

function ayAdi(ay) {
  return tarihYaz(new Date(`${ay}-01T12:00:00`), {
    month: "long",
    year: "numeric"
  });
}

function sayiyaCevir(metin) {
  const temiz = String(metin || "").trim().replace(",", ".");

  if (!temiz) {
    return 0;
  }

  const sayi = Number(temiz);

  return Number.isFinite(sayi) && sayi >= 0
    ? sayi
    : NaN;
}

function gunSutcuLitresi(gun) {
  return (
    (Number(gun && gun.sutcuSabah) || 0) +
    (Number(gun && gun.sutcuAksam) || 0)
  );
}

// O ayın fiyatı; girilmemişse önceki en yakın ayın fiyatı.
function sutcuFiyati(ay) {
  const fiyatlar = sutcuFiyatlariniTemizle(
    durum.ayarlar && durum.ayarlar.sutcuFiyatlari
  );

  if (fiyatlar[ay]) {
    return { fiyat: fiyatlar[ay], kaynakAy: ay };
  }

  const onceki = Object.keys(fiyatlar)
    .filter((digerAy) => digerAy < ay)
    .sort()
    .pop();

  return onceki
    ? { fiyat: fiyatlar[onceki], kaynakAy: onceki }
    : { fiyat: VARSAYILAN_SUTCU_FIYATI, kaynakAy: "" };
}

function ayinSutcuLitresi(ay) {
  let toplam = 0;

  Object.entries(durum.veriler || {}).forEach(([haftaBasi, hafta]) => {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(haftaBasi) || !hafta) {
      return;
    }

    const pazartesi = new Date(`${haftaBasi}T12:00:00`);

    Object.entries(hafta).forEach(([sira, gun]) => {
      const tarih = gunEkle(pazartesi, Number(sira));

      if (ayAnahtari(tarih) === ay) {
        toplam += gunSutcuLitresi(gun);
      }
    });
  });

  return toplam;
}

function sutcuGoster() {
  const hafta = durum.veriler[haftaAnahtari()] || {};
  const gun = hafta[durum.secilenGun] || {};

  [
    [alanlar.sutcuSabah, gun.sutcuSabah],
    [alanlar.sutcuAksam, gun.sutcuAksam]
  ].forEach(([alan, deger]) => {
    // Yazılan alanın içeriğine dokunma.
    if (document.activeElement !== alan) {
      alan.value = Number(deger) > 0
        ? litreYaz(Number(deger))
        : "";
      alan.classList.remove("hatali");
    }
  });

  alanlar.sutcuGunToplam.textContent = litreYaz(gunSutcuLitresi(gun));

  const ay = ayAnahtari(secilenTarih());
  const { fiyat, kaynakAy } = sutcuFiyati(ay);
  const litre = ayinSutcuLitresi(ay);
  const tutar = Math.round(litre * fiyat * 100) / 100;

  alanlar.sutcuAyAdi.textContent = ayAdi(ay);
  alanlar.sutcuFiyatMetni.textContent =
    `${litreYaz(fiyat)} TL / L`;
  alanlar.sutcuAyLitre.textContent = `${litreYaz(litre)} L`;
  alanlar.sutcuAyTutar.textContent =
    `${new Intl.NumberFormat("tr-TR", { maximumFractionDigits: 2 }).format(tutar)} TL`;
  alanlar.sutcuFiyatNotu.textContent = kaynakAy === ay
    ? `${litreYaz(litre)} L × ${litreYaz(fiyat)} TL`
    : kaynakAy
      ? `${ayAdi(ay)} için fiyat girilmedi; ${ayAdi(kaynakAy)} fiyatı kullanılıyor.`
      : "Henüz fiyat girilmedi; 26,5 TL kullanılıyor.";
}

function sutcuLitresiniKaydet(donem, alan) {
  const sayi = sayiyaCevir(alan.value);
  const gecersiz = Number.isNaN(sayi);

  alan.classList.toggle("hatali", gecersiz);
  alanlar.sutcuHata.classList.toggle(
    "gizli",
    !alanlar.sutcuSabah.classList.contains("hatali") &&
      !alanlar.sutcuAksam.classList.contains("hatali")
  );

  if (gecersiz) {
    return;
  }

  const kayit = gunKaydi();
  // 0 da kaydedilir: bulut "birleştirerek" yazdığı için alanı silmek
  // eski değerin geri gelmesine yol açardı.
  kayit[donem] = Math.round(sayi * 100) / 100;

  verileriKaydet();
  sutcuGoster();
  haftaSatisGrafiginiGoster();
}

alanlar.sutcuSabah.addEventListener("input", () =>
  sutcuLitresiniKaydet("sutcuSabah", alanlar.sutcuSabah)
);

alanlar.sutcuAksam.addEventListener("input", () =>
  sutcuLitresiniKaydet("sutcuAksam", alanlar.sutcuAksam)
);

[alanlar.sutcuSabah, alanlar.sutcuAksam].forEach((alan) =>
  alan.addEventListener("blur", () => {
    if (!alan.classList.contains("hatali")) {
      sutcuGoster();
    }
  })
);

function sutcuFiyatGecmisiniGoster() {
  const fiyatlar = sutcuFiyatlariniTemizle(durum.ayarlar.sutcuFiyatlari);
  const aylar = Object.keys(fiyatlar).sort().reverse();

  alanlar.sutcuFiyatGecmisi.innerHTML = "";

  if (aylar.length === 0) {
    const satir = document.createElement("div");
    satir.className = "fiyat-gecmisi-satiri";
    satir.textContent = "Henüz fiyat girilmedi (varsayılan 26,5 TL).";
    alanlar.sutcuFiyatGecmisi.appendChild(satir);
    return;
  }

  aylar.forEach((ay) => {
    const satir = document.createElement("div");
    satir.className = "fiyat-gecmisi-satiri";

    const ad = document.createElement("span");
    ad.textContent = ayAdi(ay);

    const fiyat = document.createElement("strong");
    fiyat.textContent = `${litreYaz(fiyatlar[ay])} TL / L`;

    satir.appendChild(ad);
    satir.appendChild(fiyat);
    alanlar.sutcuFiyatGecmisi.appendChild(satir);
  });
}

eleman("#sutcuFiyatButonu").addEventListener("click", () => {
  const ay = ayAnahtari(secilenTarih());

  alanlar.sutcuFiyatAy.value = ay;
  alanlar.sutcuFiyatGirdi.value = litreYaz(sutcuFiyati(ay).fiyat);
  sutcuFiyatGecmisiniGoster();
  alanlar.sutcuFiyatPenceresi.showModal();
});

alanlar.sutcuFiyatAy.addEventListener("change", () => {
  if (/^\d{4}-\d{2}$/.test(alanlar.sutcuFiyatAy.value)) {
    alanlar.sutcuFiyatGirdi.value =
      litreYaz(sutcuFiyati(alanlar.sutcuFiyatAy.value).fiyat);
  }
});

eleman("#sutcuFiyatKaydet").addEventListener("click", () => {
  const ay = alanlar.sutcuFiyatAy.value;
  const fiyat = sayiyaCevir(alanlar.sutcuFiyatGirdi.value);

  if (!/^\d{4}-\d{2}$/.test(ay)) {
    bildirimGoster("Fiyatın geçerli olacağı ayı seç.");
    return;
  }

  if (!(fiyat > 0)) {
    bildirimGoster("Sıfırdan büyük bir litre fiyatı yaz.");
    return;
  }

  durum.ayarlar = {
    ...durum.ayarlar,
    sutcuFiyatlari: {
      ...sutcuFiyatlariniTemizle(durum.ayarlar.sutcuFiyatlari),
      [ay]: Math.round(fiyat * 100) / 100
    }
  };

  localStorage.setItem(
    AYAR_ANAHTARI,
    JSON.stringify(durum.ayarlar)
  );

  if (typeof window.bulutaKaydet === "function") {
    window.bulutaKaydet("ayarlar", durum.ayarlar);
  }

  alanlar.sutcuFiyatPenceresi.close();
  sutcuGoster();
  bildirimGoster(`${ayAdi(ay)} sütçü fiyatı ${litreYaz(fiyat)} TL / L.`);
});

eleman("#oncekiHafta")
  .addEventListener(
    "click",
    () => {
      durum.haftaBaslangici =
        gunEkle(
          durum.haftaBaslangici,
          -7
        );

      ekraniGoster();
    }
  );

eleman("#sonrakiHafta")
  .addEventListener(
    "click",
    () => {
      durum.haftaBaslangici =
        gunEkle(
          durum.haftaBaslangici,
          7
        );

      ekraniGoster();
    }
  );

eleman("#buHafta")
  .addEventListener(
    "click",
    () => {
      durum.haftaBaslangici =
        haftaninPazartesisi(
          new Date()
        );

      durum.secilenGun =
        pazartesiSirasi(
          new Date()
        );

      ekraniGoster();
    }
  );

document
  .querySelectorAll("[data-kopyala]")
  .forEach(
    (buton) => {
      buton.addEventListener(
        "click",
        () => {
          mesajiKopyala(
            buton.dataset.kopyala
          );
        }
      );
    }
  );

document
  .querySelectorAll("[data-whatsapp]")
  .forEach(
    (buton) => {
      buton.addEventListener(
        "click",
        () => {
          whatsAppAc(
            buton.dataset.whatsapp
          );
        }
      );
    }
  );

eleman("#gunuTemizle")
  .addEventListener(
    "click",
    () => {
      const onay = confirm(
        `${gunAdlari[durum.secilenGun]} günü için sabah ve akşam siparişleri silinsin mi?`
      );

      if (!onay) {
        return;
      }

      // Günü silmek yerine boşaltıyoruz: bulut kaydı "merge" ile
      // yapıldığı için silinen anahtar bulutta kalıp geri geliyordu.
      const kayit = gunKaydi();
      kayit.sabah = "";
      kayit.aksam = "";
      kayit.sabahDurum = "";
      kayit.aksamDurum = "";

      verileriKaydet();
      alanlariGoster();
      haftaSatisGrafiginiGoster();
      senkronDurumunuGoster();

      bildirimGoster(
        "Günün siparişleri temizlendi."
      );
    }
  );

eleman("#ayarButonu")
  .addEventListener(
    "click",
    () => {
      alanlar.aliciAdi.value =
        durum.ayarlar.aliciAdi || "";

      alanlar.telefon.value =
        durum.ayarlar.telefon || "";

      alanlar.ayarPenceresi.showModal();
    }
  );

eleman("#ayarlariKaydet")
  .addEventListener(
    "click",
    (olay) => {
      olay.preventDefault();

      durum.ayarlar = {
        ...durum.ayarlar,
        aliciAdi:
          alanlar.aliciAdi.value.trim(),

        telefon:
          alanlar.telefon.value.replace(
            /\D/g,
            ""
          )
      };

      localStorage.setItem(
        AYAR_ANAHTARI,
        JSON.stringify(durum.ayarlar)
      );

      if (typeof window.bulutaKaydet === "function") {
        window.bulutaKaydet(
          "ayarlar",
          durum.ayarlar
        );
      }

      alanlar.ayarPenceresi.close();

      bildirimGoster(
        "Ayarlar kaydedildi."
      );
    }
  );

eleman("#otomasyonaKaydet")
  .addEventListener(
    "click",
    () => {
      shortcutAc();
    }
  );


ekraniGoster();

