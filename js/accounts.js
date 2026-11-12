"use strict";

// Müşteri carileri: İşlem sekmesi (süt, bal, ödeme girişi) ve
// Müşteriler sekmesi (liste, toplam alacak, hesap dökümü).

const cariAlanlar = {
  secim: eleman("#cariSecimi"),
  bakiye: eleman("#cariBakiye"),
  bakiyeAciklamasi: eleman("#bakiyeAciklamasi"),
  litre: eleman("#cariLitre"),
  tutar: eleman("#cariTutar"),
  odeme: eleman("#cariOdeme"),
  tarih: eleman("#cariTarih"),
  aciklama: eleman("#cariAciklama"),
  satisGirdileri: eleman("#satisGirdileri"),
  odemeGirdileri: eleman("#odemeGirdileri"),
  islemBasligi: eleman("#islemBasligi"),
  guncelFiyat: eleman("#cariGuncelFiyat"),
  fiyatPenceresi: eleman("#fiyatPenceresi"),
  fiyatTarih: eleman("#fiyatTarih"),
  yeniLitreFiyati: eleman("#yeniLitreFiyati"),
  fiyatGecmisi: eleman("#fiyatGecmisi"),
  bakiyeAlani: eleman("#bakiyeAlani"),
  bal: eleman("#cariBal"),
  balGirdileri: eleman("#balGirdileri"),
  kaydet: eleman("#cariKaydet"),
  sonAlimNotu: eleman("#sonAlimNotu"),
  notEkleButonu: eleman("#notEkleButonu"),
  notAlani: eleman("#notAlani"),
  bugunListesi: eleman("#bugunListesi"),
  bugunSayisi: eleman("#bugunSayisi"),
  toplamAlacak: eleman("#toplamAlacak"),
  alacakAciklamasi: eleman("#alacakAciklamasi"),
  musteriArama: eleman("#musteriArama"),
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
  ekstreListesi: eleman("#ekstreListesi"),
  paylasPenceresi: eleman("#paylasPenceresi"),
  paylasAd: eleman("#paylasAd"),
  paylasTelefon: eleman("#paylasTelefon"),
  paylasOzelTarih: eleman("#paylasOzelTarih"),
  paylasBaslangic: eleman("#paylasBaslangic"),
  paylasBitis: eleman("#paylasBitis"),
  paylasMesaj: eleman("#paylasMesaj"),
  paylasUyari: eleman("#paylasUyari")
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
  ekstreDonem: "tumu",
  paylasDonem: "buay",
  musteriSiralama: (() => {
    try {
      return localStorage.getItem("eren-sut-takip-siralama") || "borc";
    } catch {
      return "borc";
    }
  })(),
  litreDoldurulanMusteri: "",
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
  cariAlanlar.guncelFiyat.textContent =
    `Süt ${tlYaz(bugunFiyati)} / L`;
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
}

// Müşterinin en son süt alımı (tarih, sonra giriş saatine göre).
function sonSutHareketi(musteriId) {
  return cariDurum.veriler.hareketler
    .filter(
      (hareket) =>
        hareket.musteriId === musteriId &&
        hareket.tur === "satis" &&
        Number(hareket.litre) > 0
    )
    .sort(
      (a, b) =>
        String(b.tarih || "").localeCompare(String(a.tarih || "")) ||
        String(b.createdAt || "").localeCompare(String(a.createdAt || ""))
    )[0];
}

// Müşteri değişince süt litresini son alımıyla doldurur.
// Aynı müşteriye kayıt girildikten sonra alan 0'a döner ve tekrar
// doldurulmaz; böylece aynı satış yanlışlıkla iki kez girilmez.
function sonAlimiGoster() {
  const musteri = secilenCariMusterisi();
  const son = musteri ? sonSutHareketi(musteri.id) : undefined;

  if (
    musteri &&
    cariDurum.litreDoldurulanMusteri !== musteri.id
  ) {
    cariAlanlar.litre.value = son
      ? String(Number(son.litre))
      : "0";

    // Kayıtlar buluttan henüz gelmemiş olabilir; son alım bulunana
    // kadar bu müşteriyi "dolduruldu" saymıyoruz.
    if (son) {
      cariDurum.litreDoldurulanMusteri = musteri.id;
    }
  }

  cariAlanlar.sonAlimNotu.textContent = son
    ? `Son alımı: ${litreYaz(Number(son.litre))} L (${tarihYaz(new Date(`${son.tarih}T12:00:00`), { day: "numeric", month: "long" })})`
    : "";
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

  const basliklar = {
    satis: "Süt satışı ekle",
    bal: "Bal satışı ekle",
    odeme: "Ödeme ekle"
  };

  cariAlanlar.islemBasligi.textContent =
    basliklar[tur] || basliklar.satis;

  const musteri = secilenCariMusterisi();

  cariAlanlar.kaydet.textContent = musteri
    ? `${musteri.ad} hesabına işle`
    : "Önce müşteri ekle";
  cariAlanlar.kaydet.disabled = !musteri;

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

function hareketGunu(hareket) {
  const zaman = new Date(String(hareket.createdAt || ""));

  return Number.isNaN(zaman.getTime())
    ? ""
    : tarihAnahtari(zaman);
}

// Bugün (bu cihazda veya başka cihazda) girilen kayıtlar, en yeni üstte.
function bugunGirilenleriGoster() {
  const bugun = tarihAnahtari(new Date());
  const kayitlar = cariDurum.veriler.hareketler
    .filter((hareket) => hareketGunu(hareket) === bugun)
    .slice()
    .sort((a, b) =>
      String(b.createdAt || "").localeCompare(String(a.createdAt || ""))
    );

  cariAlanlar.bugunSayisi.textContent = kayitlar.length > 0
    ? `${kayitlar.length} kayıt`
    : "";
  cariAlanlar.bugunListesi.innerHTML = "";

  if (kayitlar.length === 0) {
    const bos = document.createElement("div");
    bos.className = "bos-hareket";
    bos.textContent = "Bugün henüz kayıt girilmedi.";
    cariAlanlar.bugunListesi.appendChild(bos);
    return;
  }

  kayitlar.forEach((hareket) => {
    const musteri = musteriBul(hareket.musteriId);
    const satir = document.createElement("div");
    satir.className = "hareket-satiri";

    const bilgi = document.createElement("div");
    bilgi.className = "hareket-bilgi";

    const ad = document.createElement("strong");
    ad.textContent = musteri ? musteri.ad : "Bilinmeyen müşteri";

    const ayrinti = document.createElement("small");
    const tarihNotu = hareket.tarih !== bugun && hareket.tarih
      ? ` · ${tarihYaz(new Date(`${hareket.tarih}T12:00:00`), { day: "numeric", month: "short" })} tarihli`
      : "";
    ayrinti.textContent =
      `${hareketEtiketi(hareket)}${hareket.aciklama ? ` · ${hareket.aciklama}` : ""}${tarihNotu}`;

    bilgi.appendChild(ad);
    bilgi.appendChild(ayrinti);

    const tutar = document.createElement("div");
    tutar.className =
      `hareket-tutar ${hareket.tur === "odeme" ? "odeme" : "satis"}`;
    tutar.textContent = hareketTutarMetni(hareket);

    const sil = document.createElement("button");
    sil.type = "button";
    sil.className = "hareket-sil";
    sil.textContent = "×";
    sil.title = "Kaydı sil";
    sil.setAttribute("aria-label", "Kaydı sil");
    sil.addEventListener("click", () => cariHareketSil(hareket.id));

    satir.appendChild(bilgi);
    satir.appendChild(tutar);
    satir.appendChild(sil);
    cariAlanlar.bugunListesi.appendChild(satir);
  });
}

function toplamAlacagiGoster() {
  const aktifler = aktifMusteriler();
  let toplam = 0;
  let borclu = 0;

  aktifler.forEach((musteri) => {
    const bakiye = musteriBakiyesi(musteri.id);

    if (bakiye >= 0.005) {
      toplam += bakiye;
      borclu++;
    }
  });

  cariAlanlar.toplamAlacak.textContent = tlYaz(toplam);
  cariAlanlar.alacakAciklamasi.textContent =
    `${aktifler.length} müşteri · ${borclu} müşterinin borcu var`;
}

function cariEkraniniGoster() {
  cariSecimleriniGoster();
  cariBakiyesiniGoster();
  fiyatEtiketleriniGoster();
  sonAlimiGoster();
  cariTutariniGoster();
  cariIslemTurunuGoster();
  bugunGirilenleriGoster();
  toplamAlacagiGoster();
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
  // Aktif müşteride satırın tamamı tek düğme: dokununca döküm açılır.
  // Silme düğmesi yanlışlıkla basılmasın diye sadece dökümde.
  const satir = document.createElement(silinmis ? "div" : "button");
  satir.className = "musteri-satiri";

  if (!silinmis) {
    satir.type = "button";
    satir.classList.add("musteri-satir-buton");
    satir.title = `${musteri.ad} hesap dökümü`;
    satir.addEventListener("click", () =>
      musteriEkstresiniAc(musteri.id)
    );
  }

  const ozet = musteriOzeti(musteri.id);
  const bakiye = bakiyeMetni(musteriBakiyesi(musteri.id));

  const adAlani = document.createElement(silinmis ? "button" : "span");
  adAlani.className = "musteri-ad-buton";

  if (silinmis) {
    adAlani.type = "button";
    adAlani.title = `${musteri.ad} hesap dökümü`;
    adAlani.addEventListener("click", () =>
      musteriEkstresiniAc(musteri.id)
    );
  }

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

  adAlani.appendChild(ad);
  adAlani.appendChild(rozetler);

  const bakiyeAlani = document.createElement("span");
  bakiyeAlani.className = `musteri-bakiye ${bakiye.tur}`;

  const bakiyeEtiketi = document.createElement("small");
  bakiyeEtiketi.textContent = bakiye.aciklama;

  const bakiyeTutari = document.createElement("strong");
  bakiyeTutari.textContent = bakiye.tutar;

  bakiyeAlani.appendChild(bakiyeEtiketi);
  bakiyeAlani.appendChild(bakiyeTutari);

  satir.appendChild(adAlani);
  satir.appendChild(bakiyeAlani);

  if (silinmis) {
    const geriAl = document.createElement("button");
    geriAl.type = "button";
    geriAl.className = "musteri-geri-al";
    geriAl.textContent = "Geri al";
    geriAl.setAttribute(
      "aria-label",
      `${musteri.ad} müşterisini geri al`
    );
    geriAl.addEventListener("click", () =>
      musteriGeriAl(musteri.id)
    );
    satir.appendChild(geriAl);
  } else {
    const ok = document.createElement("span");
    ok.className = "musteri-ok";
    ok.setAttribute("aria-hidden", "true");
    ok.textContent = "›";
    satir.appendChild(ok);
  }

  return satir;
}

function sonHareketTarihi(musteriId) {
  return cariDurum.veriler.hareketler.reduce(
    (enYeni, hareket) =>
      hareket.musteriId === musteriId &&
      String(hareket.tarih || "") > enYeni
        ? String(hareket.tarih || "")
        : enYeni,
    ""
  );
}

function musterileriSirala(musteriler) {
  const alfabetik = adaGoreSirala(musteriler);

  if (cariDurum.musteriSiralama === "az") {
    return alfabetik;
  }

  if (cariDurum.musteriSiralama === "son") {
    return alfabetik
      .map((musteri) => ({ musteri, tarih: sonHareketTarihi(musteri.id) }))
      .sort((a, b) => b.tarih.localeCompare(a.tarih))
      .map(({ musteri }) => musteri);
  }

  return alfabetik
    .map((musteri) => ({ musteri, bakiye: musteriBakiyesi(musteri.id) }))
    .sort((a, b) => b.bakiye - a.bakiye)
    .map(({ musteri }) => musteri);
}

function musteriListesiniGoster() {
  const arama = cariAlanlar.musteriArama.value
    .trim()
    .toLocaleLowerCase("tr-TR");

  const aktifler = musterileriSirala(aktifMusteriler());
  const gorunenler = aktifler.filter((musteri) =>
    String(musteri.ad || "")
      .toLocaleLowerCase("tr-TR")
      .includes(arama)
  );

  document
    .querySelectorAll("[data-siralama]")
    .forEach((buton) =>
      buton.classList.toggle(
        "aktif",
        buton.dataset.siralama === cariDurum.musteriSiralama
      )
    );

  cariAlanlar.musteriListesi.innerHTML = "";

  if (gorunenler.length === 0) {
    const bos = document.createElement("div");
    bos.className = "bos-hareket";
    bos.textContent = aktifler.length === 0
      ? "Henüz müşteri yok. “+ Ekle” ile başlayabilirsin."
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
  cariDurum.ekstreDonem = "tumu";
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

  const bugun = new Date();
  const donemBaslangici = cariDurum.ekstreDonem === "hafta"
    ? tarihAnahtari(haftaninPazartesisi(bugun))
    : cariDurum.ekstreDonem === "ay"
      ? tarihAnahtari(new Date(bugun.getFullYear(), bugun.getMonth(), 1, 12))
      : "";

  document
    .querySelectorAll("[data-ekstre-donem]")
    .forEach((buton) =>
      buton.classList.toggle(
        "aktif",
        buton.dataset.ekstreDonem === cariDurum.ekstreDonem
      )
    );

  const gorunenler = bakiyeli
    .filter(
      ({ hareket }) =>
        (cariDurum.ekstreFiltre === "hepsi" ||
          hareket.tur === cariDurum.ekstreFiltre) &&
        String(hareket.tarih || "") >= donemBaslangici
    )
    .reverse();

  cariAlanlar.ekstreListesi.innerHTML = "";

  if (gorunenler.length === 0) {
    const bos = document.createElement("div");
    bos.className = "bos-hareket";
    bos.textContent = sirali.length === 0
      ? "Bu müşteri için henüz kayıt yok."
      : "Bu dönemde veya türde kayıt yok.";
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
    // Kuruş altı yuvarlama farkları "−0 TL" gibi görünmesin.
    const gosterilenBakiye = Math.abs(satirBakiyesi) < 0.005
      ? 0
      : satirBakiyesi;
    kalan.textContent = `Bakiye ${gosterilenBakiye < 0 ? "−" : ""}${tlYaz(Math.abs(gosterilenBakiye))}`;

    tutarAlani.appendChild(tutar);
    tutarAlani.appendChild(kalan);

    // Silme düğmesi tarihin solunda; silinmiş müşteride boş yer tutucu.
    if (silinmis) {
      const bosluk = document.createElement("span");
      bosluk.setAttribute("aria-hidden", "true");
      satir.appendChild(bosluk);
    } else {
      const sil = document.createElement("button");
      sil.type = "button";
      sil.className = "hareket-sil";
      sil.textContent = "×";
      sil.title = "Hareketi sil";
      sil.setAttribute("aria-label", "Cari hareketini sil");
      sil.addEventListener("click", () => cariHareketSil(hareket.id));
      satir.appendChild(sil);
    }

    satir.appendChild(tarihAlani);
    satir.appendChild(bilgi);
    satir.appendChild(tutarAlani);

    cariAlanlar.ekstreListesi.appendChild(satir);
  });
}

// ===== Hesap dökümünü WhatsApp'tan gönderme =====

function telefonuDuzenle(metin) {
  let rakamlar = String(metin || "").replace(/\D/g, "");

  if (rakamlar.startsWith("00")) {
    rakamlar = rakamlar.slice(2);
  }

  // 05xx… → 905xx…, 5xx… → 905xx…
  if (rakamlar.length === 11 && rakamlar.startsWith("0")) {
    rakamlar = `90${rakamlar.slice(1)}`;
  } else if (rakamlar.length === 10 && rakamlar.startsWith("5")) {
    rakamlar = `90${rakamlar}`;
  }

  return rakamlar;
}

function tarihNesnesi(anahtar) {
  return new Date(`${anahtar}T12:00:00`);
}

function donemSinirlari(donem, musteriId) {
  const bugun = new Date();
  const yil = bugun.getFullYear();
  const ay = bugun.getMonth();
  const bugunAnahtari = tarihAnahtari(bugun);

  const tarihler = cariDurum.veriler.hareketler
    .filter((hareket) => hareket.musteriId === musteriId)
    .map((hareket) => String(hareket.tarih || ""))
    .filter(Boolean)
    .sort();

  const enYeni = tarihler.length > 0
    ? tarihler[tarihler.length - 1]
    : bugunAnahtari;
  const sonTarih = enYeni > bugunAnahtari
    ? enYeni
    : bugunAnahtari;

  if (donem === "gecenay") {
    return {
      baslangic: tarihAnahtari(new Date(yil, ay - 1, 1, 12)),
      bitis: tarihAnahtari(new Date(yil, ay, 0, 12))
    };
  }

  if (donem === "son3ay") {
    return {
      baslangic: tarihAnahtari(
        new Date(yil, ay - 3, bugun.getDate() + 1, 12)
      ),
      bitis: sonTarih
    };
  }

  if (donem === "tumu") {
    return {
      baslangic: tarihler[0] || bugunAnahtari,
      bitis: sonTarih
    };
  }

  if (donem === "ozel") {
    const baslangic =
      cariAlanlar.paylasBaslangic.value ||
      tarihAnahtari(new Date(yil, ay, 1, 12));
    const bitis =
      cariAlanlar.paylasBitis.value || bugunAnahtari;

    return baslangic <= bitis
      ? { baslangic, bitis }
      : { baslangic: bitis, bitis: baslangic };
  }

  return {
    baslangic: tarihAnahtari(new Date(yil, ay, 1, 12)),
    bitis: sonTarih
  };
}

function bakiyeCumlesi(bakiye, bitis) {
  const bugun = tarihAnahtari(new Date());
  const tarihNotu = bitis < bugun
    ? ` (${tarihYaz(tarihNesnesi(bitis), { day: "numeric", month: "long", year: "numeric" })} itibarıyla)`
    : "";

  if (Math.abs(bakiye) < 0.005) {
    return `✅ *Hesabınız kapalı, borcunuz yok.*${tarihNotu}`;
  }

  return bakiye > 0
    ? `*Kalan borcunuz: ${tlYaz(bakiye)}*${tarihNotu}`
    : `*Alacağınız: ${tlYaz(Math.abs(bakiye))}*${tarihNotu}`;
}

function ekstreMesajiOlustur(musteriId, baslangic, bitis) {
  const musteri = musteriBul(musteriId);

  const sirali = cariDurum.veriler.hareketler
    .filter((hareket) => hareket.musteriId === musteriId)
    .slice()
    .sort(
      (a, b) =>
        String(a.tarih || "").localeCompare(String(b.tarih || "")) ||
        String(a.createdAt || "").localeCompare(String(b.createdAt || ""))
    );

  const devreden = sirali
    .filter((hareket) => String(hareket.tarih || "") < baslangic)
    .reduce((toplam, hareket) => toplam + cariHareketDegeri(hareket), 0);

  const donemHareketleri = sirali.filter(
    (hareket) =>
      String(hareket.tarih || "") >= baslangic &&
      String(hareket.tarih || "") <= bitis
  );

  const ozet = {
    sutLitre: 0,
    sutTutar: 0,
    bal: 0,
    odeme: 0
  };

  let bakiye = devreden;

  const satirlar = donemHareketleri.map((hareket) => {
    const tutar = Math.abs(Number(hareket.tutar) || 0);
    bakiye += cariHareketDegeri(hareket);

    let aciklama;

    if (hareket.tur === "satis") {
      const litre = Number(hareket.litre) || 0;
      ozet.sutLitre += litre;
      ozet.sutTutar += tutar;
      aciklama = `🥛 ${litreYaz(litre)} L süt × ${tlYaz(hareketBirimFiyati(hareket))}`;
    } else if (hareket.tur === "bal") {
      ozet.bal += tutar;
      aciklama = "🍯 Bal";
    } else {
      ozet.odeme += tutar;
      aciklama = "💵 Ödeme";
    }

    const tarih = tarihNesnesi(hareket.tarih);
    const tarihMetni = Number.isNaN(tarih.getTime())
      ? "—"
      : `${String(tarih.getDate()).padStart(2, "0")}.${String(tarih.getMonth() + 1).padStart(2, "0")}`;
    const not = hareket.aciklama
      ? ` (${hareket.aciklama})`
      : "";

    return `${tarihMetni} · ${aciklama} · ${hareket.tur === "odeme" ? "−" : "+"}${tlYaz(tutar)}${not}`;
  });

  const tarihAraligi =
    `${tarihYaz(tarihNesnesi(baslangic), { day: "numeric", month: "long", year: "numeric" })} – ` +
    `${tarihYaz(tarihNesnesi(bitis), { day: "numeric", month: "long", year: "numeric" })}`;

  const parcalar = [
    "🧾 *HESAP DÖKÜMÜ*",
    `👤 ${musteri ? musteri.ad : ""}`,
    `📅 ${tarihAraligi}`,
    ""
  ];

  if (Math.abs(devreden) >= 0.005) {
    parcalar.push(
      `Önceki dönemden devreden: ${devreden < 0 ? "−" : ""}${tlYaz(Math.abs(devreden))}`,
      ""
    );
  }

  if (satirlar.length === 0) {
    parcalar.push("Bu dönemde alım veya ödeme yok.");
  } else {
    parcalar.push(...satirlar);
  }

  const toplamlar = [];

  if (ozet.sutTutar > 0) {
    toplamlar.push(`🥛 Süt: ${litreYaz(ozet.sutLitre)} L – ${tlYaz(ozet.sutTutar)}`);
  }

  if (ozet.bal > 0) {
    toplamlar.push(`🍯 Bal: ${tlYaz(ozet.bal)}`);
  }

  if (ozet.odeme > 0) {
    toplamlar.push(`💵 Ödeme: ${tlYaz(ozet.odeme)}`);
  }

  if (toplamlar.length > 0) {
    parcalar.push("", "*Dönem toplamı*", ...toplamlar);
  }

  parcalar.push(
    "",
    bakiyeCumlesi(bakiye, bitis),
    "",
    "Teşekkür ederiz 🙏",
    "Eren Süt"
  );

  return {
    mesaj: parcalar.join("\n"),
    hareketSayisi: satirlar.length
  };
}

function paylasMesajiniYenile() {
  const musteriId = cariDurum.ekstreMusteriId;
  const sinirlar = donemSinirlari(cariDurum.paylasDonem, musteriId);

  document
    .querySelectorAll("[data-donem]")
    .forEach((buton) =>
      buton.classList.toggle(
        "aktif",
        buton.dataset.donem === cariDurum.paylasDonem
      )
    );

  cariAlanlar.paylasOzelTarih.classList.toggle(
    "gizli",
    cariDurum.paylasDonem !== "ozel"
  );

  if (cariDurum.paylasDonem === "ozel") {
    cariAlanlar.paylasBaslangic.value = sinirlar.baslangic;
    cariAlanlar.paylasBitis.value = sinirlar.bitis;
  }

  const sonuc = ekstreMesajiOlustur(
    musteriId,
    sinirlar.baslangic,
    sinirlar.bitis
  );

  cariAlanlar.paylasMesaj.value = sonuc.mesaj;
  cariAlanlar.paylasUyari.textContent = sonuc.hareketSayisi > 60
    ? `Mesajda ${sonuc.hareketSayisi} hareket var; uzun gelirse daha kısa bir dönem seçebilirsin.`
    : "";
}

function paylasPenceresiniAc() {
  const musteri = musteriBul(cariDurum.ekstreMusteriId);

  if (!musteri) {
    return;
  }

  cariAlanlar.paylasAd.textContent = musteri.ad;
  cariAlanlar.paylasTelefon.value = musteri.telefon || "";
  cariDurum.paylasDonem = "buay";
  paylasMesajiniYenile();
  cariAlanlar.paylasPenceresi.showModal();
}

function paylasTelefonunuKaydet() {
  const musteri = musteriBul(cariDurum.ekstreMusteriId);

  if (!musteri) {
    return "";
  }

  const telefon = telefonuDuzenle(cariAlanlar.paylasTelefon.value);

  if (telefon !== (musteri.telefon || "")) {
    if (telefon) {
      musteri.telefon = telefon;
    } else {
      delete musteri.telefon;
    }

    musteri.guncellendi = new Date().toISOString();
    cariVerileriKaydet();
  }

  cariAlanlar.paylasTelefon.value = telefon;

  return telefon;
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

  // Kayıttan sonra alan 0'da kalsın; aynı satış yanlışlıkla
  // ikinci kez girilmesin.
  cariAlanlar.litre.value = "0";
  cariDurum.litreDoldurulanMusteri = musteri.id;
  cariAlanlar.bal.value = "0";
  cariAlanlar.odeme.value = "0";
  cariAlanlar.aciklama.value = "";
  cariAlanlar.notAlani.classList.add("gizli");
  cariAlanlar.notEkleButonu.textContent = "+ Not ekle";

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

eleman("#ekstreIslemEkle").addEventListener("click", () => {
  const musteri = musteriBul(cariDurum.ekstreMusteriId);

  if (!musteriAktifMi(musteri)) {
    return;
  }

  cariDurum.veriler.secilenMusteriId = musteri.id;
  cariTercihiniKaydet();
  cariAlanlar.ekstrePenceresi.close();
  cariEkraniniGoster();

  const islemSekmesi = document.querySelector('[data-panel="islemPaneli"]');

  if (islemSekmesi) {
    islemSekmesi.click();
  }

  window.scrollTo({ top: 0, behavior: "smooth" });
});

eleman("#ekstrePaylas").addEventListener(
  "click",
  paylasPenceresiniAc
);

eleman("#paylasKapat").addEventListener("click", () =>
  cariAlanlar.paylasPenceresi.close()
);

cariAlanlar.paylasPenceresi.addEventListener("click", (olay) => {
  if (olay.target === cariAlanlar.paylasPenceresi) {
    cariAlanlar.paylasPenceresi.close();
  }
});

document
  .querySelectorAll("[data-donem]")
  .forEach((buton) => {
    buton.addEventListener("click", () => {
      cariDurum.paylasDonem = buton.dataset.donem;
      paylasMesajiniYenile();
    });
  });

[cariAlanlar.paylasBaslangic, cariAlanlar.paylasBitis].forEach((alan) =>
  alan.addEventListener("change", paylasMesajiniYenile)
);

cariAlanlar.paylasTelefon.addEventListener(
  "change",
  paylasTelefonunuKaydet
);

eleman("#paylasWhatsApp").addEventListener("click", () => {
  const telefon = paylasTelefonunuKaydet();
  const mesaj = encodeURIComponent(cariAlanlar.paylasMesaj.value);
  const adres = telefon
    ? `https://wa.me/${telefon}?text=${mesaj}`
    : `https://wa.me/?text=${mesaj}`;

  window.open(adres, "_blank", "noopener");
});

eleman("#paylasKopyala").addEventListener("click", async () => {
  await panoyaKopyalaFallback(cariAlanlar.paylasMesaj.value);
  bildirimGoster("Hesap dökümü panoya kopyalandı.");
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

document
  .querySelectorAll("[data-siralama]")
  .forEach((buton) => {
    buton.addEventListener("click", () => {
      cariDurum.musteriSiralama = buton.dataset.siralama;

      try {
        localStorage.setItem(
          "eren-sut-takip-siralama",
          cariDurum.musteriSiralama
        );
      } catch {
        // Tarayıcı depolaması kapalı olabilir.
      }

      musteriListesiniGoster();
    });
  });

document
  .querySelectorAll("[data-ekstre-donem]")
  .forEach((buton) => {
    buton.addEventListener("click", () => {
      cariDurum.ekstreDonem = buton.dataset.ekstreDonem;
      ekstreyiGoster();
    });
  });

cariAlanlar.notEkleButonu.addEventListener("click", () => {
  cariAlanlar.notAlani.classList.remove("gizli");
  cariAlanlar.notEkleButonu.textContent = "Not açık";
  cariAlanlar.aciklama.focus();
});

cariAlanlar.tarih.value =
  tarihAnahtari(new Date());
cariAlanlar.fiyatTarih.value =
  tarihAnahtari(new Date());

// Açılışta yalnızca bu cihaza yaz; buluta açılışta hiçbir şey gönderilmez.
cariTercihiniKaydet();
cariEkraniniGoster();

