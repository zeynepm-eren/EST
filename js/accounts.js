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
  fiyatGecmisi: eleman("#fiyatGecmisi")
};


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

if (
  !cariKaydi.secilenMusteriId ||
  !cariKaydi.musteriler.some(
    (musteri) =>
      musteri.id === cariKaydi.secilenMusteriId
  )
) {
  cariKaydi.secilenMusteriId =
    cariKaydi.musteriler[0].id;
}

const cariDurum = {
  veriler: cariKaydi,
  islemTuru: "satis",
  haftaBaslangici:
    haftaninPazartesisi(new Date())
};


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
      tariheGore.set(tarih, {
        tarih,
        fiyat: Math.round(fiyat * 100) / 100
      });
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

  if (ayniTarih) {
    ayniTarih.fiyat = duzeltilmisFiyat;
  } else {
    cariDurum.veriler.fiyatGecmisi.push({
      tarih,
      fiyat: duzeltilmisFiyat
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

  let secilenMusteriId =
    typeof kaynak.secilenMusteriId === "string"
      ? kaynak.secilenMusteriId
      : "";

  if (
    oncekiSecim &&
    musteriler.some(
      (musteri) => musteri.id === oncekiSecim
    )
  ) {
    secilenMusteriId = oncekiSecim;
  } else if (
    !secilenMusteriId ||
    !musteriler.some(
      (musteri) => musteri.id === secilenMusteriId
    )
  ) {
    secilenMusteriId = musteriler[0].id;
  }

  const temizVeriler = {
    musteriler,
    hareketler,
    secilenMusteriId,
    fiyatGecmisi: fiyatGecmisiniNormalizeEt(
      kaynak.fiyatGecmisi
    )
  };

  const mevcutPaylasilan = {
    musteriler: cariDurum.veriler.musteriler,
    hareketler: cariDurum.veriler.hareketler,
    fiyatGecmisi: cariDurum.veriler.fiyatGecmisi
  };

  const yeniPaylasilan = {
    musteriler: temizVeriler.musteriler,
    hareketler: temizVeriler.hareketler,
    fiyatGecmisi: temizVeriler.fiyatGecmisi
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
  return cariDurum.veriler.musteriler.find(
    (musteri) =>
      musteri.id ===
      cariDurum.veriler.secilenMusteriId
  );
}

function cariHareketDegeri(hareket) {
  return hareket.tur === "odeme"
    ? -Math.abs(Number(hareket.tutar) || 0)
    : Math.abs(Number(hareket.tutar) || 0);
}

function cariBakiyesi(tarihSiniri) {
  return cariDurum.veriler.hareketler
    .filter(
      (hareket) =>
        hareket.musteriId ===
          cariDurum.veriler.secilenMusteriId &&
        (!tarihSiniri ||
          hareket.tarih <= tarihSiniri)
    )
    .reduce(
      (toplam, hareket) =>
        toplam + cariHareketDegeri(hareket),
      0
    );
}

function cariSecimleriniGoster() {
  cariAlanlar.secim.innerHTML = "";

  cariDurum.veriler.musteriler
    .slice()
    .sort(
      (a, b) =>
        a.ad.localeCompare(b.ad, "tr")
    )
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
    .filter(
      (hareket) => hareket.tur === "satis"
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
  const satisMi =
    cariDurum.islemTuru === "satis";

  cariAlanlar.satisGirdileri.classList.toggle(
    "gizli",
    !satisMi
  );

  cariAlanlar.odemeGirdileri.classList.toggle(
    "gizli",
    satisMi
  );

  cariAlanlar.islemBasligi.textContent = satisMi
    ? "Süt satışı ekle"
    : "Ödeme ekle";

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

          ad.textContent = hareket.tur === "satis"
            ? `${litreYaz(hareket.litre)} L süt × ${tlYaz(hareketBirimFiyati(hareket))}`
            : "Ödeme";

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
            `hareket-tutar ${hareket.tur}`;
          tutar.textContent =
            `${hareket.tur === "odeme" ? "−" : "+"}${tlYaz(Math.abs(hareket.tutar))}`;

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
    hareket.tutar = litre * birimFiyat;
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
  cariAlanlar.odeme.value = "0";
  cariAlanlar.aciklama.value = "";

  cariVerileriKaydet();
  cariEkraniniGoster();

  bildirimGoster(
    cariDurum.islemTuru === "satis"
      ? "Süt satışı cari hesaba işlendi."
      : "Ödeme cari hesaba işlendi."
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

  cariVerileriKaydet();
  cariEkraniniGoster();
  bildirimGoster("Cari hareketi silindi.");
}

function yeniCariEkle() {
  const ad = prompt("Yeni cari adı:");

  if (!ad || !ad.trim()) {
    return;
  }

  const temizAd = ad.trim();
  const ayniMusteri =
    cariDurum.veriler.musteriler.find(
      (musteri) =>
        musteri.ad.toLocaleLowerCase("tr-TR") ===
        temizAd.toLocaleLowerCase("tr-TR")
    );

  if (ayniMusteri) {
    cariDurum.veriler.secilenMusteriId =
      ayniMusteri.id;
    cariVerileriKaydet();
    cariEkraniniGoster();
    bildirimGoster("Bu cari zaten kayıtlı.");
    return;
  }

  const musteri = {
    id:
      `m-${Date.now().toString(36)}-` +
      Math.random().toString(36).slice(2, 6),
    ad: temizAd
  };

  cariDurum.veriler.musteriler.push(musteri);
  cariDurum.veriler.secilenMusteriId =
    musteri.id;

  cariVerileriKaydet();
  cariEkraniniGoster();
  bildirimGoster(`${temizAd} carisi eklendi.`);
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

cariVerileriKaydet();
cariEkraniniGoster();

