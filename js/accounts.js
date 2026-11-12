"use strict";

// Müşteri carileri, süt satışları, ödemeler ve haftalık özet.

const cariAlanlar = {
  secim: eleman("#cariSecimi"),
  bakiye: eleman("#cariBakiye"),
  bakiyeAciklamasi: eleman("#bakiyeAciklamasi"),
  haftaAraligi: eleman("#cariHaftaAraligi"),
  haftaLitre: eleman("#cariHaftaLitre"),
  haftaSatis: eleman("#cariHaftaSatis"),
  haftaOdeme: eleman("#cariHaftaOdeme"),
  litre: eleman("#cariLitre"),
  tutar: eleman("#cariTutar"),
  odeme: eleman("#cariOdeme"),
  tarih: eleman("#cariTarih"),
  aciklama: eleman("#cariAciklama"),
  satisGirdileri: eleman("#satisGirdileri"),
  odemeGirdileri: eleman("#odemeGirdileri"),
  islemBasligi: eleman("#islemBasligi"),
  hareketler: eleman("#cariHareketler"),
  hareketHaftaEtiketi: eleman("#hareketHaftaEtiketi"),
  guncelFiyat: eleman("#cariGuncelFiyat"),
  kartFiyat: eleman("#cariKartFiyat"),
  fiyatPenceresi: eleman("#fiyatPenceresi"),
  fiyatTarih: eleman("#fiyatTarih"),
  yeniLitreFiyati: eleman("#yeniLitreFiyati"),
  fiyatGecmisi: eleman("#fiyatGecmisi"),
  bakiyeAlani: eleman("#bakiyeAlani"),
  haftaBal: eleman("#cariHaftaBal"),
  bal: eleman("#cariBal"),
  balGirdileri: eleman("#balGirdileri"),
  islemMusteriNotu: eleman("#islemMusteriNotu"),
  musteriKarti: eleman("#musteriKarti"),
  musteriArama: eleman("#musteriArama"),
  musteriSayisi: eleman("#musteriSayisi"),
  musteriListesi: eleman("#musteriListesi"),
  silinenMusteriKutusu: eleman("#silinenMusteriKutusu"),
  silinenMusteriSayisi: eleman("#silinenMusteriSayisi"),
  silinenMusteriler: eleman("#silinenMusteriler"),
  ekstrePenceresi: eleman("#ekstrePenceresi"),
  ekstreAd: eleman("#ekstreAd"),
  ekstreBakiye: eleman("#ekstreBakiye"),
  ekstreBakiyeAciklamasi: eleman("#ekstreBakiyeAciklamasi"),
  ekstreSutLitre: eleman("#ekstreSutLitre"),
  ekstreSutTutar: eleman("#ekstreSutTutar"),
  ekstreBal: eleman("#ekstreBal"),
  ekstreOdeme: eleman("#ekstreOdeme"),
  ekstreListesi: eleman("#ekstreListesi")
};

// Hareket türleri: "satis" = süt satışı (eski kayıtlar da bu türde),
// "bal" = bal satışı (TL olarak girilir), "odeme" = müşteriden ödeme.
const SATIS_TURLERI = ["satis", "bal"];

function satisMi(hareket) {
  return SATIS_TURLERI.includes(hareket && hareket.tur);
}


const cariKaydi = kayitOku(
  CARI_ANAHTARI,
  {
    musteriler: [
      {
        id: "ahmet",
        ad: "Ahmet"
      }
    ],
    hareketler: [],
    secilenMusteriId: "ahmet"
  }
);

if (
  !Array.isArray(cariKaydi.musteriler) ||
  cariKaydi.musteriler.length === 0
) {
  cariKaydi.musteriler = [
    {
      id: "ahmet",
      ad: "Ahmet"
    }
  ];
}

if (!Array.isArray(cariKaydi.hareketler)) {
  cariKaydi.hareketler = [];
}

cariKaydi.fiyatGecmisi = fiyatGecmisiniNormalizeEt(
  cariKaydi.fiyatGecmisi
);

cariKaydi.silinenHareketIdleri = diziyeCevir(
  cariKaydi.silinenHareketIdleri
);

cariKaydi.secilenMusteriId = gecerliSecim(
  cariKaydi.musteriler,
  cariKaydi.secilenMusteriId
);

const cariDurum = {
  veriler: cariKaydi,
  islemTuru: "satis",
  ekstreMusteriId: "",
  ekstreFiltre: "hepsi",
  haftaBaslangici:
    haftaninPazartesisi(new Date())
};

function diziyeCevir(deger) {
  return Array.isArray(deger)
    ? deger.slice()
    : [];
}

function musteriAktifMi(musteri) {
  return Boolean(musteri) && !musteri.silindi;
}

function gecerliSecim(musteriler, secim) {
  const aktifler = musteriler.filter(musteriAktifMi);

  if (aktifler.some((musteri) => musteri.id === secim)) {
    return secim;
  }

  return aktifler.length > 0
    ? aktifler[0].id
    : "";
}

function aktifMusteriler() {
  return cariDurum.veriler.musteriler.filter(musteriAktifMi);
}

function silinmisMusteriler() {
  return cariDurum.veriler.musteriler.filter(
    (musteri) => !musteriAktifMi(musteri)
  );
}

function musteriBul(musteriId) {
  return cariDurum.veriler.musteriler.find(
    (musteri) => musteri.id === musteriId
  );
}

function adaGoreSirala(musteriler) {
  return musteriler
    .slice()
    .sort((a, b) =>
      String(a.ad || "").localeCompare(String(b.ad || ""), "tr", {
        sensitivity: "base"
      })
    );
}

// İki cihazın cari verisini kayıp olmadan birleştirir.
// Hareketler kimliğe (id) göre birleşir; silinen hareketlerin kimlikleri
// "silinenHareketIdleri" listesinde tutulur ki başka cihaz geri getirmesin.
// Müşteri ve fiyat kayıtlarında daha yeni güncellenen sürüm kazanır.
function cariBirlestir(sunucuVerisi, yerelVeri) {
  const sunucu =
    sunucuVerisi && typeof sunucuVerisi === "object"
      ? sunucuVerisi
      : {};
  const yerel =
    yerelVeri && typeof yerelVeri === "object"
      ? yerelVeri
      : {};

  function anahtaraGoreBirlestir(sunucuListe, yerelListe, anahtar) {
    const harita = new Map();

    diziyeCevir(sunucuListe).forEach((kayit) => {
      if (kayit && typeof kayit === "object") {
        harita.set(anahtar(kayit), kayit);
      }
    });

    diziyeCevir(yerelListe).forEach((kayit) => {
      if (!kayit || typeof kayit !== "object") {
        return;
      }

      const k = anahtar(kayit);
      const mevcut = harita.get(k);

      if (
        !mevcut ||
        String(kayit.guncellendi || "") >=
          String(mevcut.guncellendi || "")
      ) {
        harita.set(k, kayit);
      }
    });

    return Array.from(harita.values());
  }

  const silinenler = Array.from(
    new Set(
      diziyeCevir(sunucu.silinenHareketIdleri)
        .concat(diziyeCevir(yerel.silinenHareketIdleri))
        .filter(Boolean)
    )
  );
  const silinenKume = new Set(silinenler);

  return {
    ...sunucu,
    ...yerel,
    musteriler: anahtaraGoreBirlestir(
      sunucu.musteriler,
      yerel.musteriler,
      (musteri) => String(musteri.id)
    ),
    hareketler: anahtaraGoreBirlestir(
      sunucu.hareketler,
      yerel.hareketler,
      (hareket) => hareket.id
        ? String(hareket.id)
        : JSON.stringify(hareket)
    ).filter((hareket) => !silinenKume.has(hareket.id)),
    fiyatGecmisi: anahtaraGoreBirlestir(
      sunucu.fiyatGecmisi,
      yerel.fiyatGecmisi,
      (kayit) => String(kayit.tarih)
    ),
    silinenHareketIdleri: silinenler,
    secilenMusteriId:
      yerel.secilenMusteriId ||
      sunucu.secilenMusteriId ||
      ""
  };
}


function tlYaz(miktar) {
  return (
    new Intl.NumberFormat(
      "tr-TR",
      {
        minimumFractionDigits: 0,
        maximumFractionDigits: 2
      }
    ).format(miktar) + " TL"
  );
}


function fiyatGecmisiniNormalizeEt(fiyatGecmisi) {
  const kayitlar = Array.isArray(fiyatGecmisi)
    ? fiyatGecmisi
    : [];

  const tariheGore = new Map();

  kayitlar.forEach((kayit) => {
    const tarih = String(kayit?.tarih || "");
    const fiyat = Number(kayit?.fiyat);

    if (
      /^\d{4}-\d{2}-\d{2}$/.test(tarih) &&
      Number.isFinite(fiyat) &&
      fiyat > 0
    ) {
      const temizKayit = {
        tarih,
        fiyat: Math.round(fiyat * 100) / 100
      };

      if (kayit.guncellendi) {
        temizKayit.guncellendi = String(kayit.guncellendi);
      }

      tariheGore.set(tarih, temizKayit);
    }
  });

  if (!tariheGore.has("1900-01-01")) {
    tariheGore.set("1900-01-01", {
      tarih: "1900-01-01",
      fiyat: VARSAYILAN_LITRE_FIYATI
    });
  }

  return Array.from(tariheGore.values()).sort(
    (a, b) => a.tarih.localeCompare(b.tarih)
  );
}

function tarihtekiLitreFiyati(tarih) {
  const hedefTarih = tarih || tarihAnahtari(new Date());
  let fiyat = VARSAYILAN_LITRE_FIYATI;

  cariDurum.veriler.fiyatGecmisi.forEach(
    (kayit) => {
      if (kayit.tarih <= hedefTarih) {
        fiyat = Number(kayit.fiyat) || fiyat;
      }
    }
  );

  return fiyat;
}

function hareketBirimFiyati(hareket) {
  const kayitliFiyat = Number(hareket.birimFiyat);

  if (Number.isFinite(kayitliFiyat) && kayitliFiyat > 0) {
    return kayitliFiyat;
  }

  const litre = Number(hareket.litre);
  const tutar = Number(hareket.tutar);

  if (
    Number.isFinite(litre) && litre > 0 &&
    Number.isFinite(tutar) && tutar > 0
  ) {
    return tutar / litre;
  }

  return tarihtekiLitreFiyati(hareket.tarih);
}

function fiyatEtiketleriniGoster() {
  const bugunFiyati = tarihtekiLitreFiyati(
    tarihAnahtari(new Date())
  );
  const islemTarihi = cariAlanlar.tarih.value ||
    tarihAnahtari(new Date());
  const islemFiyati = tarihtekiLitreFiyati(islemTarihi);

  cariAlanlar.guncelFiyat.textContent =
    `${tlYaz(bugunFiyati)} / L`;
  cariAlanlar.kartFiyat.textContent =
    `${tlYaz(islemFiyati)}/L`;
}

function fiyatGecmisiniGoster() {
  cariAlanlar.fiyatGecmisi.innerHTML = "";

  cariDurum.veriler.fiyatGecmisi
    .slice()
    .sort((a, b) => b.tarih.localeCompare(a.tarih))
    .forEach((kayit) => {
      const satir = document.createElement("div");
      satir.className = "fiyat-gecmisi-satiri";

      const tarih = document.createElement("span");
      tarih.textContent = kayit.tarih === "1900-01-01"
        ? "Başlangıç fiyatı"
        : tarihYaz(
            new Date(`${kayit.tarih}T12:00:00`),
            {
              day: "2-digit",
              month: "2-digit",
              year: "numeric"
            }
          );

      const fiyat = document.createElement("strong");
      fiyat.textContent = `${tlYaz(kayit.fiyat)} / L`;

      satir.appendChild(tarih);
      satir.appendChild(fiyat);
      cariAlanlar.fiyatGecmisi.appendChild(satir);
    });
}

function fiyatPenceresiniAc() {
  const bugun = tarihAnahtari(new Date());
  cariAlanlar.fiyatTarih.value = bugun;
  cariAlanlar.yeniLitreFiyati.value = String(
    tarihtekiLitreFiyati(bugun)
  );
  fiyatGecmisiniGoster();
  cariAlanlar.fiyatPenceresi.showModal();
}

function litreFiyatiniKaydet() {
  const tarih = cariAlanlar.fiyatTarih.value;
  const fiyat = Number(cariAlanlar.yeniLitreFiyati.value);

  if (!tarih) {
    bildirimGoster("Fiyatın geçerli olacağı tarihi seçmelisin.");
    return;
  }

  if (!Number.isFinite(fiyat) || fiyat <= 0) {
    bildirimGoster("Sıfırdan büyük bir litre fiyatı girmelisin.");
    return;
  }

  const duzeltilmisFiyat = Math.round(fiyat * 100) / 100;
  const ayniTarih = cariDurum.veriler.fiyatGecmisi.find(
    (kayit) => kayit.tarih === tarih
  );

  const guncellendi = new Date().toISOString();

  if (ayniTarih) {
    ayniTarih.fiyat = duzeltilmisFiyat;
    ayniTarih.guncellendi = guncellendi;
  } else {
    cariDurum.veriler.fiyatGecmisi.push({
      tarih,
      fiyat: duzeltilmisFiyat,
      guncellendi
    });
  }

  cariDurum.veriler.fiyatGecmisi = fiyatGecmisiniNormalizeEt(
    cariDurum.veriler.fiyatGecmisi
  );

  cariVerileriKaydet();
  fiyatGecmisiniGoster();
  cariEkraniniGoster();
  cariAlanlar.fiyatPenceresi.close();

  bildirimGoster(
    `${tarihYaz(new Date(`${tarih}T12:00:00`), {
      day: "numeric",
      month: "long",
      year: "numeric"
    })} tarihinden itibaren fiyat ${tlYaz(duzeltilmisFiyat)} / L.`
  );
}

function cariVerileriKaydet() {
  localStorage.setItem(
    CARI_ANAHTARI,
    JSON.stringify(cariDurum.veriler)
  );

  if (typeof window.bulutaKaydet === "function") {
    window.bulutaKaydet(
      "cariler",
      cariDurum.veriler
    );
  }
}

function cariTercihiniKaydet() {
  localStorage.setItem(
    CARI_ANAHTARI,
    JSON.stringify(cariDurum.veriler)
  );
}

function cariVerileriniUygula(yeniVeriler) {
  const kaynak =
    yeniVeriler &&
    typeof yeniVeriler === "object" &&
    !Array.isArray(yeniVeriler)
      ? yeniVeriler
      : {};

  const musteriler = Array.isArray(kaynak.musteriler)
    ? kaynak.musteriler.slice()
    : [];
  const hareketler = Array.isArray(kaynak.hareketler)
    ? kaynak.hareketler.slice()
    : [];

  if (musteriler.length === 0) {
    musteriler.push({
      id: "ahmet",
      ad: "Ahmet"
    });
  }

  const oncekiSecim =
    cariDurum.veriler.secilenMusteriId;

  const secilenMusteriId = gecerliSecim(
    musteriler,
    oncekiSecim ||
      (typeof kaynak.secilenMusteriId === "string"
        ? kaynak.secilenMusteriId
        : "")
  );

  // Bilinmeyen alanlar da korunur; böylece ileride eklenen
  // alanlar eski/yeni sürümler arasında kaybolmaz.
  const temizVeriler = {
    ...kaynak,
    musteriler,
    hareketler,
    secilenMusteriId,
    fiyatGecmisi: fiyatGecmisiniNormalizeEt(
      kaynak.fiyatGecmisi
    ),
    silinenHareketIdleri: diziyeCevir(
      kaynak.silinenHareketIdleri
    )
  };

  const mevcutPaylasilan = {
    musteriler: cariDurum.veriler.musteriler,
    hareketler: cariDurum.veriler.hareketler,
    fiyatGecmisi: cariDurum.veriler.fiyatGecmisi,
    silinenHareketIdleri: cariDurum.veriler.silinenHareketIdleri
  };

  const yeniPaylasilan = {
    musteriler: temizVeriler.musteriler,
    hareketler: temizVeriler.hareketler,
    fiyatGecmisi: temizVeriler.fiyatGecmisi,
    silinenHareketIdleri: temizVeriler.silinenHareketIdleri
  };

  if (
    JSON.stringify(mevcutPaylasilan) ===
    JSON.stringify(yeniPaylasilan)
  ) {
    return;
  }

  cariDurum.veriler = temizVeriler;

  localStorage.setItem(
    CARI_ANAHTARI,
    JSON.stringify(cariDurum.veriler)
  );

  cariEkraniniGoster();
}

function secilenCariMusterisi() {
  const musteri = musteriBul(
    cariDurum.veriler.secilenMusteriId
  );

  return musteriAktifMi(musteri)
    ? musteri
    : undefined;
}

function cariHareketDegeri(hareket) {
  return hareket.tur === "odeme"
    ? -Math.abs(Number(hareket.tutar) || 0)
    : Math.abs(Number(hareket.tutar) || 0);
}

function musteriBakiyesi(musteriId, tarihSiniri) {
  return cariDurum.veriler.hareketler
    .filter(
      (hareket) =>
        hareket.musteriId === musteriId &&
        (!tarihSiniri ||
          hareket.tarih <= tarihSiniri)
    )
    .reduce(
      (toplam, hareket) =>
        toplam + cariHareketDegeri(hareket),
      0
    );
}

function cariBakiyesi(tarihSiniri) {
  return musteriBakiyesi(
    cariDurum.veriler.secilenMusteriId,
    tarihSiniri
  );
}

function bakiyeMetni(bakiye) {
  if (Math.abs(bakiye) < 0.005) {
    return {
      aciklama: "Hesap kapalı",
      tutar: "0 TL",
      tur: "kapali"
    };
  }

  return bakiye > 0
    ? {
        aciklama: "Borcu",
        tutar: tlYaz(bakiye),
        tur: "borc"
      }
    : {
        aciklama: "Alacaklı",
        tutar: tlYaz(Math.abs(bakiye)),
        tur: "alacak"
      };
}

function hareketEtiketi(hareket) {
  if (hareket.tur === "satis") {
    return `🥛 ${litreYaz(Number(hareket.litre) || 0)} L süt × ${tlYaz(hareketBirimFiyati(hareket))}`;
  }

  if (hareket.tur === "bal") {
    return "🍯 Bal satışı";
  }

  return "💵 Ödeme";
}

function hareketTutarMetni(hareket) {
  const tutar = Math.abs(Number(hareket.tutar) || 0);

  return `${hareket.tur === "odeme" ? "−" : "+"}${tlYaz(tutar)}`;
}

function cariSecimleriniGoster() {
  cariAlanlar.secim.innerHTML = "";

  const musteriler = adaGoreSirala(aktifMusteriler());

  if (musteriler.length === 0) {
    const secenek = document.createElement("option");
    secenek.value = "";
    secenek.textContent = "Önce müşteri ekle";
    cariAlanlar.secim.appendChild(secenek);
    cariAlanlar.secim.value = "";
    return;
  }

  musteriler
    .forEach(
      (musteri) => {
        const secenek =
          document.createElement("option");

        secenek.value = musteri.id;
        secenek.textContent = musteri.ad;

        cariAlanlar.secim.appendChild(
          secenek
        );
      }
    );

  cariAlanlar.secim.value =
    cariDurum.veriler.secilenMusteriId;
}

function cariBakiyesiniGoster() {
  const bakiye = cariBakiyesi();

  if (!secilenCariMusterisi()) {
    cariAlanlar.bakiyeAciklamasi.textContent =
      "Müşteri seçilmedi";
    cariAlanlar.bakiye.textContent = "—";
    return;
  }

  if (bakiye > 0) {
    cariAlanlar.bakiyeAciklamasi.textContent =
      "Müşterinin güncel borcu";
    cariAlanlar.bakiye.textContent =
      tlYaz(bakiye);
    return;
  }

  if (bakiye < 0) {
    cariAlanlar.bakiyeAciklamasi.textContent =
      "Müşteri alacaklı";
    cariAlanlar.bakiye.textContent =
      tlYaz(Math.abs(bakiye));
    return;
  }

  cariAlanlar.bakiyeAciklamasi.textContent =
    "Hesap kapalı";
  cariAlanlar.bakiye.textContent = "0 TL";
}

function cariHaftaSinirlari() {
  return {
    baslangic: tarihAnahtari(
      cariDurum.haftaBaslangici
    ),
    bitis: tarihAnahtari(
      gunEkle(
        cariDurum.haftaBaslangici,
        6
      )
    )
  };
}

function cariHaftaHareketleri() {
  const sinirlar = cariHaftaSinirlari();

  return cariDurum.veriler.hareketler.filter(
    (hareket) =>
      hareket.musteriId ===
        cariDurum.veriler.secilenMusteriId &&
      hareket.tarih >= sinirlar.baslangic &&
      hareket.tarih <= sinirlar.bitis
  );
}

function cariHaftasiniGoster() {
  const haftaSonu = gunEkle(
    cariDurum.haftaBaslangici,
    6
  );

  const aralik =
    `${tarihYaz(
      cariDurum.haftaBaslangici,
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

  cariAlanlar.haftaAraligi.textContent =
    aralik;

  cariAlanlar.hareketHaftaEtiketi.textContent =
    aralik;

  const hareketler = cariHaftaHareketleri();

  const litre = hareketler
    .filter(
      (hareket) => hareket.tur === "satis"
    )
    .reduce(
      (toplam, hareket) =>
        toplam + (Number(hareket.litre) || 0),
      0
    );

  const satis = hareketler
    .filter(satisMi)
    .reduce(
      (toplam, hareket) =>
        toplam + (Number(hareket.tutar) || 0),
      0
    );

  const bal = hareketler
    .filter(
      (hareket) => hareket.tur === "bal"
    )
    .reduce(
      (toplam, hareket) =>
        toplam + (Number(hareket.tutar) || 0),
      0
    );

  const odeme = hareketler
    .filter(
      (hareket) => hareket.tur === "odeme"
    )
    .reduce(
      (toplam, hareket) =>
        toplam + (Number(hareket.tutar) || 0),
      0
    );

  cariAlanlar.haftaLitre.textContent =
    `${litreYaz(litre)} L`;
  cariAlanlar.haftaBal.textContent =
    tlYaz(bal);
  cariAlanlar.haftaSatis.textContent =
    tlYaz(satis);
  cariAlanlar.haftaOdeme.textContent =
    tlYaz(odeme);
}

function cariTutariniGoster() {
  const litre = Math.max(
    0,
    Number(cariAlanlar.litre.value) || 0
  );

  const tarih = cariAlanlar.tarih.value ||
    tarihAnahtari(new Date());
  const birimFiyat = tarihtekiLitreFiyati(tarih);

  cariAlanlar.tutar.textContent =
    tlYaz(litre * birimFiyat);
  cariAlanlar.kartFiyat.textContent =
    `${tlYaz(birimFiyat)}/L`;
}

function cariIslemTurunuGoster() {
  const tur = cariDurum.islemTuru;

  cariAlanlar.satisGirdileri.classList.toggle(
    "gizli",
    tur !== "satis"
  );

  cariAlanlar.balGirdileri.classList.toggle(
    "gizli",
    tur !== "bal"
  );

  cariAlanlar.odemeGirdileri.classList.toggle(
    "gizli",
    tur !== "odeme"
  );

  cariAlanlar.kartFiyat.classList.toggle(
    "gizli",
    tur !== "satis"
  );

  const basliklar = {
    satis: "Süt satışı ekle",
    bal: "Bal satışı ekle",
    odeme: "Ödeme ekle"
  };

  cariAlanlar.islemBasligi.textContent =
    basliklar[tur] || basliklar.satis;

  const musteri = secilenCariMusterisi();

  cariAlanlar.islemMusteriNotu.textContent = musteri
    ? `Müşteri: ${musteri.ad}`
    : "Önce müşteri ekle veya seç.";

  document
    .querySelectorAll("[data-islem-turu]")
    .forEach(
      (buton) => {
        buton.classList.toggle(
          "aktif",
          buton.dataset.islemTuru ===
            cariDurum.islemTuru
        );
      }
    );
}

function cariHareketleriGoster() {
  cariAlanlar.hareketler.innerHTML = "";

  const hareketler = cariHaftaHareketleri()
    .slice()
    .sort(
      (a, b) =>
        b.tarih.localeCompare(a.tarih) ||
        String(a.createdAt || "").localeCompare(
          String(b.createdAt || "")
        )
    );

  if (hareketler.length === 0) {
    const bosAlan =
      document.createElement("div");

    bosAlan.className = "bos-hareket";
    bosAlan.textContent =
      "Bu hafta için henüz cari hareket yok.";

    cariAlanlar.hareketler.appendChild(
      bosAlan
    );
    return;
  }

  const gunler = new Map();

  hareketler.forEach(
    (hareket) => {
      if (!gunler.has(hareket.tarih)) {
        gunler.set(hareket.tarih, []);
      }

      gunler.get(hareket.tarih).push(hareket);
    }
  );

  gunler.forEach(
    (gunHareketleri, tarih) => {
      const gunKarti =
        document.createElement("section");
      gunKarti.className = "hareket-gunu";

      const tarihBasligi =
        document.createElement("div");
      tarihBasligi.className = "hareket-tarih";
      tarihBasligi.textContent = tarihYaz(
        new Date(`${tarih}T12:00:00`),
        {
          weekday: "long",
          day: "2-digit",
          month: "2-digit",
          year: "numeric"
        }
      );

      gunKarti.appendChild(tarihBasligi);

      gunHareketleri.forEach(
        (hareket) => {
          const satir =
            document.createElement("div");
          satir.className = "hareket-satiri";

          const bilgi =
            document.createElement("div");
          bilgi.className = "hareket-bilgi";

          const ad =
            document.createElement("strong");

          ad.textContent = hareketEtiketi(hareket);

          bilgi.appendChild(ad);

          if (hareket.aciklama) {
            const aciklama =
              document.createElement("small");
            aciklama.textContent =
              hareket.aciklama;
            bilgi.appendChild(aciklama);
          }

          const tutar =
            document.createElement("div");
          tutar.className =
            `hareket-tutar ${hareket.tur === "odeme" ? "odeme" : "satis"}`;
          tutar.textContent =
            hareketTutarMetni(hareket);

          const sil =
            document.createElement("button");
          sil.type = "button";
          sil.className = "hareket-sil";
          sil.textContent = "×";
          sil.title = "Hareketi sil";
          sil.setAttribute(
            "aria-label",
            "Cari hareketini sil"
          );
          sil.addEventListener(
            "click",
            () => cariHareketSil(hareket.id)
          );

          satir.appendChild(bilgi);
          satir.appendChild(tutar);
          satir.appendChild(sil);
          gunKarti.appendChild(satir);
        }
      );

      const gunBakiyesi =
        document.createElement("div");
      gunBakiyesi.className = "gun-bakiyesi";

      const bakiyeMetni =
        document.createElement("span");
      bakiyeMetni.textContent =
        "İşlem sonrası bakiye";

      const bakiyeTutari =
        document.createElement("strong");
      const bakiye = cariBakiyesi(tarih);
      bakiyeTutari.textContent = bakiye < 0
        ? `−${tlYaz(Math.abs(bakiye))}`
        : tlYaz(bakiye);

      gunBakiyesi.appendChild(bakiyeMetni);
      gunBakiyesi.appendChild(bakiyeTutari);
      gunKarti.appendChild(gunBakiyesi);
      cariAlanlar.hareketler.appendChild(gunKarti);
    }
  );
}

function cariEkraniniGoster() {
  cariSecimleriniGoster();
  cariBakiyesiniGoster();
  cariHaftasiniGoster();
  fiyatEtiketleriniGoster();
  cariTutariniGoster();
  cariIslemTurunuGoster();
  cariHareketleriGoster();
  musteriListesiniGoster();

  if (cariAlanlar.ekstrePenceresi.open) {
    ekstreyiGoster();
  }
}

function musteriOzeti(musteriId) {
  const ozet = {
    sutLitre: 0,
    sutTutar: 0,
    bal: 0,
    odeme: 0,
    hareketSayisi: 0,
    sonTarih: ""
  };

  cariDurum.veriler.hareketler.forEach((hareket) => {
    if (hareket.musteriId !== musteriId) {
      return;
    }

    const tutar = Math.abs(Number(hareket.tutar) || 0);

    ozet.hareketSayisi++;

    if (String(hareket.tarih || "") > ozet.sonTarih) {
      ozet.sonTarih = String(hareket.tarih || "");
    }

    if (hareket.tur === "satis") {
      ozet.sutLitre += Number(hareket.litre) || 0;
      ozet.sutTutar += tutar;
    } else if (hareket.tur === "bal") {
      ozet.bal += tutar;
    } else if (hareket.tur === "odeme") {
      ozet.odeme += tutar;
    }
  });

  return ozet;
}

function musteriSatiriOlustur(musteri, silinmis) {
  const satir = document.createElement("div");
  satir.className = "musteri-satiri";

  if (
    !silinmis &&
    musteri.id === cariDurum.veriler.secilenMusteriId
  ) {
    satir.classList.add("secili");
  }

  const ozet = musteriOzeti(musteri.id);
  const bakiye = bakiyeMetni(musteriBakiyesi(musteri.id));

  const adButonu = document.createElement("button");
  adButonu.type = "button";
  adButonu.className = "musteri-ad-buton";
  adButonu.title = `${musteri.ad} hesap dökümü`;

  const ad = document.createElement("strong");
  ad.textContent = musteri.ad;

  const rozetler = document.createElement("span");
  rozetler.className = "musteri-rozetler";

  if (ozet.sutTutar > 0) {
    const rozet = document.createElement("span");
    rozet.className = "rozet sut";
    rozet.textContent = "🥛 Süt";
    rozetler.appendChild(rozet);
  }

  if (ozet.bal > 0) {
    const rozet = document.createElement("span");
    rozet.className = "rozet bal";
    rozet.textContent = "🍯 Bal";
    rozetler.appendChild(rozet);
  }

  if (ozet.hareketSayisi === 0) {
    const rozet = document.createElement("span");
    rozet.className = "rozet bos";
    rozet.textContent = "Henüz hareket yok";
    rozetler.appendChild(rozet);
  }

  adButonu.appendChild(ad);
  adButonu.appendChild(rozetler);
  adButonu.addEventListener("click", () =>
    musteriEkstresiniAc(musteri.id)
  );

  const bakiyeAlani = document.createElement("div");
  bakiyeAlani.className = `musteri-bakiye ${bakiye.tur}`;

  const bakiyeEtiketi = document.createElement("small");
  bakiyeEtiketi.textContent = bakiye.aciklama;

  const bakiyeTutari = document.createElement("strong");
  bakiyeTutari.textContent = bakiye.tutar;

  bakiyeAlani.appendChild(bakiyeEtiketi);
  bakiyeAlani.appendChild(bakiyeTutari);

  satir.appendChild(adButonu);
  satir.appendChild(bakiyeAlani);

  const islemButonu = document.createElement("button");
  islemButonu.type = "button";

  if (silinmis) {
    islemButonu.className = "musteri-geri-al";
    islemButonu.textContent = "Geri al";
    islemButonu.setAttribute(
      "aria-label",
      `${musteri.ad} müşterisini geri al`
    );
    islemButonu.addEventListener("click", () =>
      musteriGeriAl(musteri.id)
    );
  } else {
    islemButonu.className = "hareket-sil";
    islemButonu.textContent = "×";
    islemButonu.title = "Müşteriyi sil";
    islemButonu.setAttribute(
      "aria-label",
      `${musteri.ad} müşterisini sil`
    );
    islemButonu.addEventListener("click", () =>
      musteriSil(musteri.id)
    );
  }

  satir.appendChild(islemButonu);

  return satir;
}

function musteriListesiniGoster() {
  const arama = cariAlanlar.musteriArama.value
    .trim()
    .toLocaleLowerCase("tr-TR");

  const aktifler = adaGoreSirala(aktifMusteriler());
  const gorunenler = aktifler.filter((musteri) =>
    String(musteri.ad || "")
      .toLocaleLowerCase("tr-TR")
      .includes(arama)
  );

  cariAlanlar.musteriSayisi.textContent =
    `(${aktifler.length})`;
  cariAlanlar.musteriListesi.innerHTML = "";

  if (gorunenler.length === 0) {
    const bos = document.createElement("div");
    bos.className = "bos-hareket";
    bos.textContent = aktifler.length === 0
      ? "Henüz müşteri yok. “+ Müşteri ekle” ile başlayabilirsin."
      : "Aramaya uyan müşteri yok.";
    cariAlanlar.musteriListesi.appendChild(bos);
  } else {
    gorunenler.forEach((musteri) =>
      cariAlanlar.musteriListesi.appendChild(
        musteriSatiriOlustur(musteri, false)
      )
    );
  }

  const silinenler = adaGoreSirala(silinmisMusteriler());

  cariAlanlar.silinenMusteriKutusu.classList.toggle(
    "gizli",
    silinenler.length === 0
  );
  cariAlanlar.silinenMusteriSayisi.textContent =
    String(silinenler.length);
  cariAlanlar.silinenMusteriler.innerHTML = "";

  silinenler.forEach((musteri) =>
    cariAlanlar.silinenMusteriler.appendChild(
      musteriSatiriOlustur(musteri, true)
    )
  );
}

function musteriSil(musteriId) {
  const musteri = musteriBul(musteriId);

  if (!musteriAktifMi(musteri)) {
    return;
  }

  const bakiye = musteriBakiyesi(musteriId);
  const bakiyeUyarisi = Math.abs(bakiye) >= 0.005
    ? `\n\nDikkat: ${musteri.ad} hesabında ${bakiye > 0 ? "borç" : "alacak"} var (${tlYaz(Math.abs(bakiye))}).`
    : "";

  const onay = confirm(
    `${musteri.ad} müşteri listesinden silinsin mi?` +
    "\n\nGeçmiş satış ve ödeme kayıtları silinmez; " +
    "“Silinen müşteriler” bölümünden istediğin zaman geri alabilirsin." +
    bakiyeUyarisi
  );

  if (!onay) {
    return;
  }

  musteri.silindi = true;
  musteri.silinmeTarihi = new Date().toISOString();
  musteri.guncellendi = musteri.silinmeTarihi;

  cariDurum.veriler.secilenMusteriId = gecerliSecim(
    cariDurum.veriler.musteriler,
    cariDurum.veriler.secilenMusteriId
  );

  if (cariDurum.ekstreMusteriId === musteriId) {
    cariAlanlar.ekstrePenceresi.close();
  }

  cariVerileriKaydet();
  cariEkraniniGoster();
  bildirimGoster(`${musteri.ad} listeden kaldırıldı.`);
}

function musteriGeriAl(musteriId) {
  const musteri = musteriBul(musteriId);

  if (!musteri || musteriAktifMi(musteri)) {
    return;
  }

  delete musteri.silindi;
  delete musteri.silinmeTarihi;
  musteri.guncellendi = new Date().toISOString();

  cariDurum.veriler.secilenMusteriId = musteri.id;

  cariVerileriKaydet();
  cariEkraniniGoster();
  bildirimGoster(`${musteri.ad} geri alındı.`);
}

function musteriEkstresiniAc(musteriId) {
  const musteri = musteriBul(musteriId);

  if (!musteri) {
    return;
  }

  if (
    musteriAktifMi(musteri) &&
    cariDurum.veriler.secilenMusteriId !== musteriId
  ) {
    cariDurum.veriler.secilenMusteriId = musteriId;
    cariTercihiniKaydet();
    cariEkraniniGoster();
  }

  cariDurum.ekstreMusteriId = musteriId;
  cariDurum.ekstreFiltre = "hepsi";
  ekstreyiGoster();

  if (!cariAlanlar.ekstrePenceresi.open) {
    cariAlanlar.ekstrePenceresi.showModal();
  }

  cariAlanlar.ekstreListesi.scrollTop = 0;
}

function ekstreyiGoster() {
  const musteriId = cariDurum.ekstreMusteriId;
  const musteri = musteriBul(musteriId);

  if (!musteri) {
    if (cariAlanlar.ekstrePenceresi.open) {
      cariAlanlar.ekstrePenceresi.close();
    }
    return;
  }

  const silinmis = !musteriAktifMi(musteri);

  cariAlanlar.ekstreAd.textContent = silinmis
    ? `${musteri.ad} (silinmiş)`
    : musteri.ad;

  const bakiye = bakiyeMetni(musteriBakiyesi(musteriId));
  cariAlanlar.ekstreBakiyeAciklamasi.textContent =
    bakiye.tur === "borc"
      ? "Müşterinin güncel borcu"
      : bakiye.tur === "alacak"
        ? "Müşteri alacaklı"
        : "Hesap kapalı";
  cariAlanlar.ekstreBakiye.textContent = bakiye.tutar;

  const ozet = musteriOzeti(musteriId);
  cariAlanlar.ekstreSutLitre.textContent =
    `${litreYaz(ozet.sutLitre)} L`;
  cariAlanlar.ekstreSutTutar.textContent =
    tlYaz(ozet.sutTutar);
  cariAlanlar.ekstreBal.textContent = tlYaz(ozet.bal);
  cariAlanlar.ekstreOdeme.textContent = tlYaz(ozet.odeme);

  document
    .querySelectorAll("[data-ekstre-filtre]")
    .forEach((buton) => {
      buton.classList.toggle(
        "aktif",
        buton.dataset.ekstreFiltre === cariDurum.ekstreFiltre
      );
    });

  eleman("#ekstreIslemEkle").classList.toggle("gizli", silinmis);
  eleman("#ekstreMusteriSil").textContent = silinmis
    ? "Müşteriyi geri al"
    : "Müşteriyi sil";

  // Bakiyeyi tarih sırasıyla biriktir, sonra en yeniden eskiye göster.
  const sirali = cariDurum.veriler.hareketler
    .filter((hareket) => hareket.musteriId === musteriId)
    .slice()
    .sort(
      (a, b) =>
        String(a.tarih || "").localeCompare(String(b.tarih || "")) ||
        String(a.createdAt || "").localeCompare(String(b.createdAt || ""))
    );

  let yuruyenBakiye = 0;
  const bakiyeli = sirali.map((hareket) => {
    yuruyenBakiye += cariHareketDegeri(hareket);
    return {
      hareket,
      bakiye: yuruyenBakiye
    };
  });

  const gorunenler = bakiyeli
    .filter(
      ({ hareket }) =>
        cariDurum.ekstreFiltre === "hepsi" ||
        hareket.tur === cariDurum.ekstreFiltre
    )
    .reverse();

  cariAlanlar.ekstreListesi.innerHTML = "";

  if (gorunenler.length === 0) {
    const bos = document.createElement("div");
    bos.className = "bos-hareket";
    bos.textContent = sirali.length === 0
      ? "Bu müşteri için henüz kayıt yok."
      : "Bu türde kayıt yok.";
    cariAlanlar.ekstreListesi.appendChild(bos);
    return;
  }

  let sonAy = "";

  gorunenler.forEach(({ hareket, bakiye: satirBakiyesi }) => {
    const tarih = new Date(`${hareket.tarih}T12:00:00`);
    const ay = String(hareket.tarih || "").slice(0, 7);

    if (ay !== sonAy) {
      sonAy = ay;
      const ayBasligi = document.createElement("div");
      ayBasligi.className = "ekstre-ay";
      ayBasligi.textContent = Number.isNaN(tarih.getTime())
        ? "Tarihsiz"
        : tarihYaz(tarih, { month: "long", year: "numeric" });
      cariAlanlar.ekstreListesi.appendChild(ayBasligi);
    }

    const satir = document.createElement("div");
    satir.className = `ekstre-satiri ${hareket.tur === "odeme" ? "odeme" : "satis"}`;

    const tarihAlani = document.createElement("div");
    tarihAlani.className = "ekstre-tarih";

    if (Number.isNaN(tarih.getTime())) {
      tarihAlani.textContent = "—";
    } else {
      const gun = document.createElement("strong");
      gun.textContent = String(tarih.getDate());
      const gunAdi = document.createElement("small");
      gunAdi.textContent = tarihYaz(tarih, { weekday: "short" });
      tarihAlani.appendChild(gun);
      tarihAlani.appendChild(gunAdi);
    }

    const bilgi = document.createElement("div");
    bilgi.className = "hareket-bilgi";

    const baslik = document.createElement("strong");
    baslik.textContent = hareketEtiketi(hareket);
    bilgi.appendChild(baslik);

    if (hareket.aciklama) {
      const aciklama = document.createElement("small");
      aciklama.textContent = hareket.aciklama;
      bilgi.appendChild(aciklama);
    }

    const tutarAlani = document.createElement("div");
    tutarAlani.className = "ekstre-tutar";

    const tutar = document.createElement("strong");
    tutar.className =
      `hareket-tutar ${hareket.tur === "odeme" ? "odeme" : "satis"}`;
    tutar.textContent = hareketTutarMetni(hareket);

    const kalan = document.createElement("small");
    kalan.textContent = `Bakiye ${satirBakiyesi < 0 ? "−" : ""}${tlYaz(Math.abs(satirBakiyesi))}`;

    tutarAlani.appendChild(tutar);
    tutarAlani.appendChild(kalan);

    satir.appendChild(tarihAlani);
    satir.appendChild(bilgi);
    satir.appendChild(tutarAlani);

    if (!silinmis) {
      const sil = document.createElement("button");
      sil.type = "button";
      sil.className = "hareket-sil";
      sil.textContent = "×";
      sil.title = "Hareketi sil";
      sil.setAttribute("aria-label", "Cari hareketini sil");
      sil.addEventListener("click", () => cariHareketSil(hareket.id));
      satir.appendChild(sil);
    }

    cariAlanlar.ekstreListesi.appendChild(satir);
  });
}

function cariHareketKaydet() {
  const musteri = secilenCariMusterisi();
  const tarih = cariAlanlar.tarih.value;

  if (!musteri || !tarih) {
    bildirimGoster(
      "Müşteri ve tarih seçmelisin."
    );
    return;
  }

  const hareket = {
    id:
      `${Date.now().toString(36)}-` +
      Math.random().toString(36).slice(2, 8),
    musteriId: musteri.id,
    tur: cariDurum.islemTuru,
    tarih,
    aciklama:
      cariAlanlar.aciklama.value.trim(),
    createdAt: new Date().toISOString()
  };

  if (cariDurum.islemTuru === "satis") {
    const litre = Number(
      cariAlanlar.litre.value
    );

    if (!Number.isFinite(litre) || litre <= 0) {
      bildirimGoster(
        "Sıfırdan büyük bir litre girmelisin."
      );
      return;
    }

    const birimFiyat = tarihtekiLitreFiyati(tarih);

    hareket.litre = litre;
    hareket.birimFiyat = birimFiyat;
    hareket.tutar = Math.round(litre * birimFiyat * 100) / 100;
  } else if (cariDurum.islemTuru === "bal") {
    const balTutari = Number(
      cariAlanlar.bal.value
    );

    if (!Number.isFinite(balTutari) || balTutari <= 0) {
      bildirimGoster(
        "Sıfırdan büyük bir bal satış tutarı girmelisin."
      );
      return;
    }

    hareket.tutar = Math.round(balTutari * 100) / 100;
  } else {
    const odeme = Number(
      cariAlanlar.odeme.value
    );

    if (!Number.isFinite(odeme) || odeme <= 0) {
      bildirimGoster(
        "Sıfırdan büyük bir ödeme girmelisin."
      );
      return;
    }

    hareket.tutar = odeme;
  }

  cariDurum.veriler.hareketler.push(
    hareket
  );

  cariDurum.haftaBaslangici =
    haftaninPazartesisi(
      new Date(`${tarih}T12:00:00`)
    );

  cariAlanlar.litre.value = "0";
  cariAlanlar.bal.value = "0";
  cariAlanlar.odeme.value = "0";
  cariAlanlar.aciklama.value = "";

  cariVerileriKaydet();
  cariEkraniniGoster();

  const mesajlar = {
    satis: "Süt satışı cari hesaba işlendi.",
    bal: "Bal satışı cari hesaba işlendi.",
    odeme: "Ödeme cari hesaba işlendi."
  };

  bildirimGoster(
    `${musteri.ad}: ${mesajlar[cariDurum.islemTuru] || mesajlar.odeme}`
  );
}

function cariHareketSil(hareketId) {
  const hareket =
    cariDurum.veriler.hareketler.find(
      (kayit) => kayit.id === hareketId
    );

  if (!hareket) {
    return;
  }

  const onay = confirm(
    "Bu cari hareketi silinsin mi?"
  );

  if (!onay) {
    return;
  }

  cariDurum.veriler.hareketler =
    cariDurum.veriler.hareketler.filter(
      (kayit) => kayit.id !== hareketId
    );

  // Silinen hareketi işaretle ki başka bir cihazın eski kopyası
  // birleştirme sırasında onu geri getirmesin.
  cariDurum.veriler.silinenHareketIdleri = diziyeCevir(
    cariDurum.veriler.silinenHareketIdleri
  );

  if (!cariDurum.veriler.silinenHareketIdleri.includes(hareketId)) {
    cariDurum.veriler.silinenHareketIdleri.push(hareketId);
  }

  cariVerileriKaydet();
  cariEkraniniGoster();
  bildirimGoster("Cari hareketi silindi.");
}

function yeniCariEkle() {
  const ad = prompt("Yeni müşteri adı:");

  if (!ad || !ad.trim()) {
    return;
  }

  const temizAd = ad.trim().replace(/\s+/g, " ");
  const ayniMusteri =
    cariDurum.veriler.musteriler.find(
      (musteri) =>
        String(musteri.ad || "").toLocaleLowerCase("tr-TR") ===
        temizAd.toLocaleLowerCase("tr-TR")
    );

  if (ayniMusteri && !musteriAktifMi(ayniMusteri)) {
    const geriAl = confirm(
      `“${ayniMusteri.ad}” adında daha önce silinmiş bir müşteri var.` +
      "\n\nEski kayıtlarıyla birlikte geri alınsın mı?"
    );

    if (geriAl) {
      musteriGeriAl(ayniMusteri.id);
    }

    return;
  }

  if (ayniMusteri) {
    cariDurum.veriler.secilenMusteriId =
      ayniMusteri.id;
    cariTercihiniKaydet();
    cariEkraniniGoster();
    bildirimGoster("Bu müşteri zaten kayıtlı.");
    return;
  }

  const musteri = {
    id:
      `m-${Date.now().toString(36)}-` +
      Math.random().toString(36).slice(2, 6),
    ad: temizAd,
    olusturuldu: new Date().toISOString()
  };

  cariDurum.veriler.musteriler.push(musteri);
  cariDurum.veriler.secilenMusteriId =
    musteri.id;

  cariVerileriKaydet();
  cariEkraniniGoster();
  bildirimGoster(`${temizAd} müşterisi eklendi.`);
}


document
  .querySelectorAll("[data-islem-turu]")
  .forEach(
    (buton) => {
      buton.addEventListener(
        "click",
        () => {
          cariDurum.islemTuru =
            buton.dataset.islemTuru;
          cariIslemTurunuGoster();
        }
      );
    }
  );

document
  .querySelectorAll("[data-litre]")
  .forEach(
    (buton) => {
      buton.addEventListener(
        "click",
        () => {
          const mevcut = Number(
            cariAlanlar.litre.value
          ) || 0;

          const degisim = Number(
            buton.dataset.litre
          ) || 0;

          const yeniDeger = Math.max(
            0,
            Math.round(
              (mevcut + degisim) * 100
            ) / 100
          );

          cariAlanlar.litre.value =
            String(yeniDeger);

          cariTutariniGoster();
        }
      );
    }
  );

cariAlanlar.litre.addEventListener(
  "input",
  cariTutariniGoster
);

cariAlanlar.tarih.addEventListener(
  "change",
  () => {
    fiyatEtiketleriniGoster();
    cariTutariniGoster();
  }
);

cariAlanlar.secim.addEventListener(
  "change",
  () => {
    cariDurum.veriler.secilenMusteriId =
      cariAlanlar.secim.value;
    cariTercihiniKaydet();
    cariEkraniniGoster();
  }
);

eleman("#yeniCari").addEventListener(
  "click",
  yeniCariEkle
);

eleman("#musteriEkleButonu").addEventListener(
  "click",
  yeniCariEkle
);

cariAlanlar.musteriArama.addEventListener(
  "input",
  musteriListesiniGoster
);

cariAlanlar.bakiyeAlani.addEventListener("click", () => {
  const musteri = secilenCariMusterisi();

  if (musteri) {
    musteriEkstresiniAc(musteri.id);
  }
});

eleman("#ekstreKapat").addEventListener("click", () =>
  cariAlanlar.ekstrePenceresi.close()
);

cariAlanlar.ekstrePenceresi.addEventListener("click", (olay) => {
  // Pencerenin dışına (arka plana) dokununca kapat.
  if (olay.target === cariAlanlar.ekstrePenceresi) {
    cariAlanlar.ekstrePenceresi.close();
  }
});

document
  .querySelectorAll("[data-ekstre-filtre]")
  .forEach((buton) => {
    buton.addEventListener("click", () => {
      cariDurum.ekstreFiltre = buton.dataset.ekstreFiltre;
      ekstreyiGoster();
    });
  });

eleman("#ekstreIslemEkle").addEventListener("click", () => {
  const musteri = musteriBul(cariDurum.ekstreMusteriId);

  if (!musteriAktifMi(musteri)) {
    return;
  }

  cariDurum.veriler.secilenMusteriId = musteri.id;
  cariTercihiniKaydet();
  cariAlanlar.ekstrePenceresi.close();
  cariEkraniniGoster();
  cariAlanlar.islemBasligi
    .closest(".kart")
    .scrollIntoView({ behavior: "smooth", block: "start" });
});

eleman("#ekstreMusteriSil").addEventListener("click", () => {
  const musteri = musteriBul(cariDurum.ekstreMusteriId);

  if (!musteri) {
    return;
  }

  if (musteriAktifMi(musteri)) {
    musteriSil(musteri.id);
  } else {
    musteriGeriAl(musteri.id);
  }
});

try {
  if (localStorage.getItem("eren-sut-takip-musteri-karti") === "kapali") {
    cariAlanlar.musteriKarti.open = false;
  }
} catch {
  // Tarayıcı depolaması kapalı olabilir.
}

cariAlanlar.musteriKarti.addEventListener("toggle", () => {
  try {
    localStorage.setItem(
      "eren-sut-takip-musteri-karti",
      cariAlanlar.musteriKarti.open ? "acik" : "kapali"
    );
  } catch {
    // Tarayıcı depolaması kapalı olabilir.
  }
});

eleman("#cariKaydet").addEventListener(
  "click",
  cariHareketKaydet
);

eleman("#fiyatDegistirButonu").addEventListener(
  "click",
  fiyatPenceresiniAc
);

eleman("#fiyatiKaydet").addEventListener(
  "click",
  litreFiyatiniKaydet
);

eleman("#cariOncekiHafta")
  .addEventListener(
    "click",
    () => {
      cariDurum.haftaBaslangici =
        gunEkle(
          cariDurum.haftaBaslangici,
          -7
        );
      cariEkraniniGoster();
    }
  );

eleman("#cariSonrakiHafta")
  .addEventListener(
    "click",
    () => {
      cariDurum.haftaBaslangici =
        gunEkle(
          cariDurum.haftaBaslangici,
          7
        );
      cariEkraniniGoster();
    }
  );

eleman("#cariBuHafta")
  .addEventListener(
    "click",
    () => {
      cariDurum.haftaBaslangici =
        haftaninPazartesisi(new Date());
      cariEkraniniGoster();
    }
  );

cariAlanlar.tarih.value =
  tarihAnahtari(new Date());
cariAlanlar.fiyatTarih.value =
  tarihAnahtari(new Date());

// Açılışta yalnızca bu cihaza yaz; buluta açılışta hiçbir şey gönderilmez.
cariTercihiniKaydet();
cariEkraniniGoster();

