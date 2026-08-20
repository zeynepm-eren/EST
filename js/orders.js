"use strict";

// Günlük süt siparişleri, WhatsApp mesajları ve haftalık aktarım.

const alanlar = {
  gunler: eleman("#gunler"),
  haftaAraligi: eleman("#haftaAraligi"),
  secilenTarih: eleman("#secilenTarih"),

  sabah: eleman("#sabahSiparisleri"),
  aksam: eleman("#aksamSiparisleri"),

  sabahToplam: eleman("#sabahToplam"),
  aksamToplam: eleman("#aksamToplam"),
  ozetSabah: eleman("#ozetSabah"),
  ozetAksam: eleman("#ozetAksam"),
  gunlukToplam: eleman("#gunlukToplam"),
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

  const genel =
    litreYaz(
      sabahSonuc.toplam +
      aksamSonuc.toplam
    );

  alanlar.sabahToplam.textContent = sabah;
  alanlar.aksamToplam.textContent = aksam;

  alanlar.ozetSabah.textContent = sabah;
  alanlar.ozetAksam.textContent = aksam;

  alanlar.gunlukToplam.textContent = genel;

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

  return {
    sabah,
    aksam,
    toplam: sabah + aksam
  };
}

function haftaSatisGrafiginiGoster() {
  const gunToplamlari = Array.from(
    { length: 7 },
    (_, sira) => gunlukSiparisToplami(sira)
  );
  const enYuksek = Math.max(
    1,
    ...gunToplamlari.map((gun) => gun.toplam)
  );
  const haftaToplami = gunToplamlari.reduce(
    (toplam, gun) => toplam + gun.toplam,
    0
  );

  alanlar.haftaToplamLitre.textContent =
    `${litreYaz(haftaToplami)} L`;
  alanlar.haftaSatisGrafigi.innerHTML = "";

  gunToplamlari.forEach((gun, sira) => {
    const sutun = document.createElement("div");
    sutun.className = "grafik-sutun";

    if (sira === durum.secilenGun) {
      sutun.classList.add("secili-hafta");
    }

    const deger = document.createElement("span");
    deger.className = "grafik-deger";
    deger.textContent = `${litreYaz(gun.toplam)} L`;

    const cubukAlani = document.createElement("div");
    cubukAlani.className = "grafik-cubuk-alani";

    const cubuk = document.createElement("div");
    cubuk.className = "grafik-cubuk";
    cubuk.style.height = gun.toplam > 0
      ? `${Math.max(6, (gun.toplam / enYuksek) * 100)}%`
      : "2px";

    cubukAlani.appendChild(cubuk);

    const etiket = document.createElement("span");
    etiket.className = "grafik-etiket";
    etiket.textContent = kisaGunler[sira];

    sutun.title =
      `${gunAdlari[sira]}: ${litreYaz(gun.toplam)} L ` +
      `(sabah ${litreYaz(gun.sabah)} L, akşam ${litreYaz(gun.aksam)} L)`;

    sutun.appendChild(deger);
    sutun.appendChild(cubukAlani);
    sutun.appendChild(etiket);
    alanlar.haftaSatisGrafigi.appendChild(sutun);
  });

  alanlar.haftaSatisGrafigi.setAttribute(
    "aria-label",
    gunToplamlari
      .map(
        (gun, sira) =>
          `${gunAdlari[sira]} ${litreYaz(gun.toplam)} litre`
      )
      .join(", ") +
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

      delete durum.veriler[
        haftaAnahtari()
      ][durum.secilenGun];

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

