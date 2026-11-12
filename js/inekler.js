"use strict";

// İnek Takip: sürü, tohumlama, gebelik, kuruya çıkarma ve doğum takibi.
// Tarih kuralları (Excel çizelgesiyle aynı):
//   gebelik kontrolü = tohumlama + 35 gün
//   tahmini doğum    = tohumlama + 283 gün
//   kuruya çıkarma   = tahmini doğum − 60 gün
// Veriler bulutta "inekler" belgesinde, bu cihazda da yedek olarak tutulur.

const INEK_ANAHTARI = "eren-sut-takip-inekler";
const KONTROL_GUNU = 35;
const DOGUM_GUNU = 283;
const KURU_GUNU = 60;

const inekAlanlar = {
  sayiToplam: eleman("#inekSayiToplam"),
  sayiBekleyen: eleman("#inekSayiBekleyen"),
  sayiYakin: eleman("#inekSayiYakin"),
  gecikenler: eleman("#inekGecikenler"),
  gecikenListesi: eleman("#inekGecikenListesi"),
  yaklasanListesi: eleman("#inekYaklasanListesi"),
  yaklasanSayisi: eleman("#inekYaklasanSayisi"),
  dogumListesi: eleman("#inekDogumListesi"),
  suruSayisi: eleman("#inekSuruSayisi"),
  arama: eleman("#inekArama"),
  filtreler: eleman("#inekFiltreleri"),
  liste: eleman("#inekListesi"),
  silinenKutu: eleman("#silinenHayvanKutusu"),
  silinenSayisi: eleman("#silinenHayvanSayisi"),
  silinenler: eleman("#silinenHayvanlar"),
  csvDosyasi: eleman("#inekCsvDosyasi"),
  aktarSonucu: eleman("#inekAktarSonucu"),

  detayPenceresi: eleman("#hayvanDetayPenceresi"),
  detayUst: eleman("#hayvanDetayUst"),
  detayAd: eleman("#hayvanDetayAd"),
  durumKarti: eleman("#hayvanDurumKarti"),
  gebelikAlani: eleman("#gebelikSonucuAlani"),
  gebelikSoru: eleman("#gebelikSonucuSoru"),
  donemAlani: eleman("#donemAlani"),
  donemAdimlari: eleman("#donemAdimlari"),
  disiIslemleri: eleman("#disiIslemleri"),
  gecmis: eleman("#hayvanGecmisi"),
  bilgiler: eleman("#hayvanBilgileri"),

  tohumlamaPenceresi: eleman("#tohumlamaPenceresi"),
  tohumlamaHayvan: eleman("#tohumlamaHayvan"),
  tohumlamaTarihi: eleman("#tohumlamaTarihi"),
  tohumlamaBoga: eleman("#tohumlamaBoga"),
  tohumlamaOnizleme: eleman("#tohumlamaOnizleme"),

  dogumPenceresi: eleman("#dogumPenceresi"),
  dogumHayvan: eleman("#dogumHayvan"),
  dogumTahmini: eleman("#dogumTahmini"),
  dogumTarihi: eleman("#dogumTarihi"),
  dogumIkiz: eleman("#dogumIkiz"),
  buzagi1Baslik: eleman("#buzagi1Baslik"),
  buzagi1Kupe: eleman("#buzagi1Kupe"),
  buzagi2Kutusu: eleman("#buzagi2Kutusu"),
  buzagi2Kupe: eleman("#buzagi2Kupe"),
  dogumSuruyeEkle: eleman("#dogumSuruyeEkle"),
  dogumSuruyeEkleMetni: eleman("#dogumSuruyeEkleMetni"),
  dogumNot: eleman("#dogumNot"),
  dogumBilgi: eleman("#dogumBilgi"),

  hayvanPenceresi: eleman("#hayvanPenceresi"),
  hayvanBaslik: eleman("#hayvanPenceresiBaslik"),
  hayvanKupe: eleman("#hayvanKupe"),
  hayvanAd: eleman("#hayvanAd"),
  hayvanIrk: eleman("#hayvanIrk"),
  hayvanDogumTarihi: eleman("#hayvanDogumTarihi"),
  hayvanUremeAlani: eleman("#hayvanUremeAlani"),
  hayvanSonDogum: eleman("#hayvanSonDogum"),
  hayvanTohumlamaAlani: eleman("#hayvanTohumlamaAlani"),
  hayvanTohumlama: eleman("#hayvanTohumlama"),
  hayvanBoga: eleman("#hayvanBoga"),
  hayvanOnizleme: eleman("#hayvanOnizleme"),
  hayvanNot: eleman("#hayvanNot")
};

const inekDurum = {
  veriler: inekVerisiniTemizle(kayitOku(INEK_ANAHTARI, {})),
  filtre: "tumu",
  acikHayvanId: "",
  duzenlenenId: "",
  hayvanCinsiyeti: "disi",
  buzagiCinsiyetleri: { 1: "disi", 2: "erkek" }
};

// ===== Yardımcılar =====

function yeniKimlik(on) {
  return `${on}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;
}

function simdi() {
  return new Date().toISOString();
}

function bugunAnahtari() {
  return tarihAnahtari(new Date());
}

function tarihNesnesiInek(anahtar) {
  return new Date(`${anahtar}T12:00:00`);
}

function gunEkleAnahtar(anahtar, gun) {
  return tarihAnahtari(gunEkle(tarihNesnesiInek(anahtar), gun));
}

function gunFarki(baslangic, bitis) {
  return Math.round(
    (tarihNesnesiInek(bitis) - tarihNesnesiInek(baslangic)) / 86400000
  );
}

function tarihNoktali(anahtar) {
  if (!anahtar) {
    return "—";
  }

  const [yil, ay, gun] = anahtar.split("-");
  return `${gun}.${ay}.${yil}`;
}

function tarihKisa(anahtar) {
  const tarih = tarihNesnesiInek(anahtar);
  const buYil = new Date().getFullYear() === tarih.getFullYear();

  return tarihYaz(
    tarih,
    buYil
      ? { day: "numeric", month: "short" }
      : { day: "numeric", month: "short", year: "numeric" }
  );
}

function kalanMetni(gun) {
  if (gun === 0) {
    return "bugün";
  }

  return gun > 0
    ? `${gun} gün sonra`
    : `${Math.abs(gun)} gün geçti`;
}

function kucukHarf(metin) {
  return String(metin || "").toLocaleLowerCase("tr-TR").trim();
}

function gecerliTarih(anahtar) {
  return /^\d{4}-\d{2}-\d{2}$/.test(String(anahtar || ""))
    ? anahtar
    : "";
}

// ===== Veri =====

function hayvaniTemizle(hayvan) {
  const h = hayvan && typeof hayvan === "object" ? hayvan : {};

  return {
    ...h,
    id: String(h.id || yeniKimlik("h")),
    kupe: String(h.kupe || "").trim(),
    ad: String(h.ad || "").trim(),
    irk: String(h.irk || "").trim(),
    cinsiyet: h.cinsiyet === "erkek" ? "erkek" : "disi",
    dogumTarihi: gecerliTarih(h.dogumTarihi),
    sonDogum: gecerliTarih(h.sonDogum),
    not: String(h.not || ""),
    tohumlamalar: Array.isArray(h.tohumlamalar)
      ? h.tohumlamalar.filter((t) => t && gecerliTarih(t.tarih))
      : [],
    dogumlar: Array.isArray(h.dogumlar)
      ? h.dogumlar.filter((d) => d && gecerliTarih(d.tarih))
      : []
  };
}

function inekVerisiniTemizle(veri) {
  const kaynak = veri && typeof veri === "object" && !Array.isArray(veri)
    ? veri
    : {};

  return {
    ...kaynak,
    hayvanlar: Array.isArray(kaynak.hayvanlar)
      ? kaynak.hayvanlar.map(hayvaniTemizle)
      : []
  };
}

// İki cihazın verisini birleştirir: hayvanlar kimliğe göre, aynı hayvanda
// en son güncellenen sürüm kazanır. Hayvanlar hiç kalıcı silinmez.
function inekBirlestir(sunucuVerisi, yerelVeri) {
  const sunucu = inekVerisiniTemizle(sunucuVerisi);
  const yerel = inekVerisiniTemizle(yerelVeri);
  const harita = new Map();

  sunucu.hayvanlar.forEach((h) => harita.set(h.id, h));
  yerel.hayvanlar.forEach((h) => {
    const mevcut = harita.get(h.id);

    if (!mevcut || String(h.guncellendi || "") >= String(mevcut.guncellendi || "")) {
      harita.set(h.id, h);
    }
  });

  return {
    ...sunucu,
    ...yerel,
    hayvanlar: Array.from(harita.values())
  };
}

function inekVerileriniUygula(yeniVeri) {
  const temiz = inekVerisiniTemizle(yeniVeri);

  if (JSON.stringify(temiz) === JSON.stringify(inekDurum.veriler)) {
    return;
  }

  inekDurum.veriler = temiz;
  localStorage.setItem(INEK_ANAHTARI, JSON.stringify(temiz));
  inekEkraniniGoster();
}

function inekVerileriKaydet() {
  localStorage.setItem(INEK_ANAHTARI, JSON.stringify(inekDurum.veriler));

  if (typeof window.bulutaKaydet === "function") {
    window.bulutaKaydet("inekler", inekDurum.veriler);
  }
}

function hayvanBul(id) {
  return inekDurum.veriler.hayvanlar.find((h) => h.id === id);
}

function aktifHayvanlar() {
  return inekDurum.veriler.hayvanlar.filter((h) => !h.silindi);
}

function hayvanAdi(h) {
  return h.ad || h.kupe || "Adsız";
}

function hayvaniGuncelle(h) {
  h.guncellendi = simdi();
  inekVerileriKaydet();
  inekEkraniniGoster();
}

// ===== Hesaplar =====

function sonDogumTarihi(h) {
  return [h.sonDogum, ...(h.dogumlar || []).map((d) => d.tarih)]
    .filter(Boolean)
    .sort()
    .pop() || "";
}

// Son doğumdan sonraki en yeni tohumlama, bu dönemin tohumlamasıdır.
function aktifTohumlama(h) {
  const sonDogum = sonDogumTarihi(h);

  return (h.tohumlamalar || [])
    .filter((t) => !sonDogum || t.tarih > sonDogum)
    .sort((a, b) => b.tarih.localeCompare(a.tarih))[0];
}

function donemTarihleri(tohumlamaTarihi) {
  const dogum = gunEkleAnahtar(tohumlamaTarihi, DOGUM_GUNU);

  return {
    kontrol: gunEkleAnahtar(tohumlamaTarihi, KONTROL_GUNU),
    dogum,
    kuru: gunEkleAnahtar(dogum, -KURU_GUNU)
  };
}

function hayvanDurumu(h, bugun = bugunAnahtari()) {
  if (h.cinsiyet === "erkek") {
    return { kod: "erkek", ad: "Erkek", stil: "gri" };
  }

  const t = aktifTohumlama(h);

  if (!t) {
    return {
      kod: "bos",
      ad: (h.tohumlamalar || []).length > 0 || sonDogumTarihi(h) ? "Boş" : "Tohumlama yok",
      stil: "gri"
    };
  }

  const d = donemTarihleri(t.tarih);
  const sonuc = t.sonuc || "bekliyor";

  if (sonuc === "bos") {
    return { kod: "bos", ad: "Boş", stil: "gri", t, d };
  }

  if (sonuc === "bekliyor" && bugun < d.kontrol) {
    const gun = gunFarki(bugun, d.kontrol);
    return {
      kod: "yakin",
      ad: `Kontrol ${gun} gün`,
      stil: "mavi",
      t,
      d
    };
  }

  if (sonuc === "bekliyor") {
    return { kod: "bekliyor", ad: "Sonuç girilmedi", stil: "turuncu", t, d };
  }

  if (bugun > d.dogum) {
    return { kod: "gebe", ad: "Doğum gecikti", stil: "kirmizi", t, d };
  }

  if (t.kuruyaCikti) {
    return { kod: "gebe", ad: "Gebe · kuruda", stil: "mor", t, d };
  }

  if (bugun >= d.kuru) {
    return { kod: "gebe", ad: "Gebe · kuruya çıkar", stil: "kirmizi", t, d };
  }

  return { kod: "gebe", ad: "Gebe", stil: "yesil", t, d };
}

// Hayvanın önümüzdeki işleri (kontrol, kuruya çıkarma, doğum).
function hayvanOlaylari(h, bugun = bugunAnahtari()) {
  const durum = hayvanDurumu(h, bugun);

  if (!durum.t || durum.kod === "bos" || durum.kod === "erkek") {
    return [];
  }

  const { t, d } = durum;
  const olaylar = [];

  if ((t.sonuc || "bekliyor") === "bekliyor") {
    olaylar.push({ tur: "kontrol", tarih: d.kontrol, ad: "Gebelik kontrolü" });
  }

  if (!t.kuruyaCikti) {
    olaylar.push({ tur: "kuru", tarih: d.kuru, ad: "Kuruya çıkar" });
  }

  olaylar.push({ tur: "dogum", tarih: d.dogum, ad: "Tahmini doğum" });

  return olaylar.map((o) => ({ ...o, hayvan: h }));
}

function sonrakiOlayMetni(h, bugun = bugunAnahtari()) {
  const sonraki = hayvanOlaylari(h, bugun)
    .filter((o) => o.tarih >= bugun)
    .sort((a, b) => a.tarih.localeCompare(b.tarih))[0];

  if (!sonraki) {
    return h.cinsiyet === "erkek" ? "" : "Tarih girilmedi";
  }

  const etiket = { kontrol: "Kontrol", kuru: "Kuruya çıkar", dogum: "Doğum" }[sonraki.tur];
  const gun = gunFarki(bugun, sonraki.tarih);
  const ek = sonraki.tur === "dogum" && gun <= 60 ? ` (${gun} gün)` : "";

  return `${etiket}: ${tarihKisa(sonraki.tarih)}${ek}`;
}

// ===== Ekranlar: Yapılacaklar =====

function olaySatiri(o, bugun, ekButon) {
  const satir = document.createElement("button");
  satir.type = "button";
  satir.className = "inek-is";

  const tarih = tarihNesnesiInek(o.tarih);
  const tarihKutusu = document.createElement("span");
  tarihKutusu.className = "inek-is-tarih";
  const gun = document.createElement("strong");
  gun.textContent = String(tarih.getDate());
  const ay = document.createElement("small");
  ay.textContent = tarihYaz(tarih, { month: "short" });
  tarihKutusu.appendChild(gun);
  tarihKutusu.appendChild(ay);

  const ad = document.createElement("span");
  ad.className = "inek-is-ad";
  const adYazi = document.createElement("strong");
  adYazi.textContent = hayvanAdi(o.hayvan);
  const olay = document.createElement("small");
  olay.textContent = o.ad;
  ad.appendChild(adYazi);
  ad.appendChild(olay);

  const kalan = document.createElement("span");
  const fark = gunFarki(bugun, o.tarih);
  kalan.className = `inek-kalan ${o.tur === "dogum" ? "yesil" : o.tur === "kuru" ? "turuncu" : fark <= 3 ? "kirmizi" : ""}`;
  kalan.textContent = ekButon || (fark === 0 ? "bugün" : `${fark} gün`);

  satir.appendChild(tarihKutusu);
  satir.appendChild(ad);
  satir.appendChild(kalan);
  satir.addEventListener("click", () =>
    ekButon === "Doğum kaydı ›"
      ? dogumPenceresiniAc(o.hayvan.id)
      : hayvanDetayiniAc(o.hayvan.id)
  );

  return satir;
}

function bosMesaj(kutu, metin) {
  const bos = document.createElement("div");
  bos.className = "bos-hareket";
  bos.textContent = metin;
  kutu.appendChild(bos);
}

function yapilacaklariGoster() {
  const bugun = bugunAnahtari();
  const hayvanlar = aktifHayvanlar();
  const durumlar = hayvanlar.map((h) => ({ h, d: hayvanDurumu(h, bugun) }));

  inekAlanlar.sayiToplam.textContent = String(hayvanlar.length);
  inekAlanlar.sayiBekleyen.textContent =
    String(durumlar.filter((x) => x.d.kod === "bekliyor").length);
  inekAlanlar.sayiYakin.textContent =
    String(durumlar.filter((x) => x.d.kod === "yakin").length);

  // Gecikenler
  inekAlanlar.gecikenListesi.innerHTML = "";
  const gecikenler = [];

  durumlar.forEach(({ h, d }) => {
    if (!d.t || d.kod === "bos" || d.kod === "erkek") {
      return;
    }

    if (d.d.dogum < bugun) {
      gecikenler.push({ h, metin: "doğum kaydı girilmedi", tarih: d.d.dogum });
    } else if (!d.t.kuruyaCikti && d.d.kuru < bugun) {
      gecikenler.push({ h, metin: "kuruya çıkarma", tarih: d.d.kuru });
    }
  });

  gecikenler
    .sort((a, b) => a.tarih.localeCompare(b.tarih))
    .forEach(({ h, metin, tarih }) => {
      const satir = document.createElement("button");
      satir.type = "button";
      satir.className = "inek-geciken-satiri";
      const sol = document.createElement("span");
      sol.textContent = `${hayvanAdi(h)} · ${metin}`;
      const sag = document.createElement("strong");
      sag.textContent = tarihKisa(tarih);
      satir.appendChild(sol);
      satir.appendChild(sag);
      satir.addEventListener("click", () => hayvanDetayiniAc(h.id));
      inekAlanlar.gecikenListesi.appendChild(satir);
    });

  const bekleyen = durumlar.filter((x) => x.d.kod === "bekliyor").length;

  if (bekleyen > 0) {
    const satir = document.createElement("button");
    satir.type = "button";
    satir.className = "inek-geciken-satiri";
    const sol = document.createElement("span");
    sol.textContent = `${bekleyen} ineğin gebelik sonucu girilmedi`;
    const sag = document.createElement("strong");
    sag.className = "yesil-yazi";
    sag.textContent = "Gir ›";
    satir.appendChild(sol);
    satir.appendChild(sag);
    satir.addEventListener("click", () => {
      inekDurum.filtre = "bekliyor";
      eleman('[data-panel="inekSuruPaneli"]').click();
    });
    inekAlanlar.gecikenListesi.appendChild(satir);
  }

  inekAlanlar.gecikenler.classList.toggle(
    "gizli",
    gecikenler.length === 0 && bekleyen === 0
  );

  // Önümüzdeki 30 gün
  const sinir30 = gunEkleAnahtar(bugun, 30);
  const yaklasan = hayvanlar
    .flatMap((h) => hayvanOlaylari(h, bugun))
    .filter((o) => o.tarih >= bugun && o.tarih <= sinir30)
    .sort((a, b) => a.tarih.localeCompare(b.tarih) || hayvanAdi(a.hayvan).localeCompare(hayvanAdi(b.hayvan), "tr"));

  inekAlanlar.yaklasanListesi.innerHTML = "";
  inekAlanlar.yaklasanSayisi.textContent = yaklasan.length > 0 ? `${yaklasan.length} iş` : "";

  if (yaklasan.length === 0) {
    bosMesaj(inekAlanlar.yaklasanListesi, hayvanlar.length === 0
      ? "Henüz hayvan yok. Sürü sekmesinden ekleyebilir ya da Excel çizelgeni aktarabilirsin."
      : "Önümüzdeki 30 günde iş yok.");
  } else {
    yaklasan.forEach((o) =>
      inekAlanlar.yaklasanListesi.appendChild(olaySatiri(o, bugun))
    );
  }

  // Beklenen doğumlar (60 gün)
  const sinir60 = gunEkleAnahtar(bugun, 60);
  const dogumlar = hayvanlar
    .flatMap((h) => hayvanOlaylari(h, bugun))
    .filter((o) => o.tur === "dogum" && o.tarih <= sinir60)
    .sort((a, b) => a.tarih.localeCompare(b.tarih));

  inekAlanlar.dogumListesi.innerHTML = "";

  if (dogumlar.length === 0) {
    bosMesaj(inekAlanlar.dogumListesi, "Önümüzdeki 60 günde beklenen doğum yok.");
  } else {
    dogumlar.forEach((o) =>
      inekAlanlar.dogumListesi.appendChild(olaySatiri(o, bugun, "Doğum kaydı ›"))
    );
  }
}

// ===== Ekranlar: Sürü =====

const INEK_FILTRELERI = [
  ["tumu", "Tümü", () => true],
  ["bekliyor", "Sonuç bekliyor", (d) => d.kod === "bekliyor"],
  ["yakin", "Kontrol yakın", (d) => d.kod === "yakin"],
  ["gebe", "Gebe", (d) => d.kod === "gebe"],
  ["bos", "Boş", (d) => d.kod === "bos"],
  ["erkek", "Erkek", (d) => d.kod === "erkek"]
];

function hayvanSatiri(h, durum, silinmis) {
  const satir = document.createElement(silinmis ? "div" : "button");
  satir.className = "inek-satiri";

  if (!silinmis) {
    satir.type = "button";
    satir.addEventListener("click", () => hayvanDetayiniAc(h.id));
  }

  const sol = document.createElement("span");
  sol.className = "inek-satir-ad";
  const ad = document.createElement("strong");
  ad.textContent = hayvanAdi(h);
  const alt = document.createElement("small");
  alt.textContent = [h.kupe, h.irk, h.cinsiyet === "erkek" ? "Erkek" : "Dişi"]
    .filter(Boolean)
    .join(" · ");
  sol.appendChild(ad);
  sol.appendChild(alt);

  const sag = document.createElement("span");
  sag.className = "inek-satir-sag";

  if (silinmis) {
    const geriAl = document.createElement("button");
    geriAl.type = "button";
    geriAl.className = "musteri-geri-al";
    geriAl.textContent = "Geri al";
    geriAl.addEventListener("click", () => {
      delete h.silindi;
      hayvaniGuncelle(h);
      bildirimGoster(`${hayvanAdi(h)} geri alındı.`);
    });
    sag.appendChild(geriAl);
  } else {
    const rozet = document.createElement("span");
    rozet.className = `inek-rozet ${durum.stil}`;
    rozet.textContent = durum.ad;
    const sonraki = document.createElement("small");
    sonraki.textContent = sonrakiOlayMetni(h);
    sag.appendChild(rozet);
    sag.appendChild(sonraki);
  }

  satir.appendChild(sol);
  satir.appendChild(sag);

  if (!silinmis) {
    const ok = document.createElement("span");
    ok.className = "musteri-ok";
    ok.setAttribute("aria-hidden", "true");
    ok.textContent = "›";
    satir.appendChild(ok);
  }

  return satir;
}

function suruyuGoster() {
  const bugun = bugunAnahtari();
  const hayvanlar = aktifHayvanlar()
    .map((h) => ({ h, d: hayvanDurumu(h, bugun) }))
    .sort((a, b) => hayvanAdi(a.h).localeCompare(hayvanAdi(b.h), "tr", { sensitivity: "base" }));

  inekAlanlar.suruSayisi.textContent = `(${hayvanlar.length})`;

  // Filtreler: sayısı olmayanlar gizlenir (Tümü hariç).
  inekAlanlar.filtreler.innerHTML = "";
  INEK_FILTRELERI.forEach(([id, ad, kosul]) => {
    const adet = hayvanlar.filter((x) => kosul(x.d)).length;

    if (id !== "tumu" && adet === 0) {
      if (inekDurum.filtre === id) {
        inekDurum.filtre = "tumu";
      }
      return;
    }

    const buton = document.createElement("button");
    buton.type = "button";
    buton.className = "ekstre-filtre-buton";
    buton.dataset.inekFiltre = id;
    buton.textContent = `${ad} ${adet}`;
    buton.classList.toggle("aktif", inekDurum.filtre === id);
    buton.addEventListener("click", () => {
      inekDurum.filtre = id;
      suruyuGoster();
    });
    inekAlanlar.filtreler.appendChild(buton);
  });

  const kosul = (INEK_FILTRELERI.find(([id]) => id === inekDurum.filtre) || INEK_FILTRELERI[0])[2];
  const arama = kucukHarf(inekAlanlar.arama.value);
  const gorunen = hayvanlar.filter(
    (x) =>
      kosul(x.d) &&
      (!arama || kucukHarf(x.h.ad).includes(arama) || kucukHarf(x.h.kupe).includes(arama))
  );

  inekAlanlar.liste.innerHTML = "";

  if (gorunen.length === 0) {
    bosMesaj(inekAlanlar.liste, hayvanlar.length === 0
      ? "Henüz hayvan yok. “+ Hayvan ekle” ile ekleyebilir ya da aşağıdan Excel çizelgeni aktarabilirsin."
      : "Aramaya uyan hayvan yok.");
  } else {
    gorunen.forEach(({ h, d }) => inekAlanlar.liste.appendChild(hayvanSatiri(h, d, false)));
  }

  const silinenler = inekDurum.veriler.hayvanlar.filter((h) => h.silindi);
  inekAlanlar.silinenKutu.classList.toggle("gizli", silinenler.length === 0);
  inekAlanlar.silinenSayisi.textContent = String(silinenler.length);
  inekAlanlar.silinenler.innerHTML = "";
  silinenler.forEach((h) => inekAlanlar.silinenler.appendChild(hayvanSatiri(h, null, true)));
}

function inekEkraniniGoster() {
  yapilacaklariGoster();
  suruyuGoster();

  if (inekAlanlar.detayPenceresi.open) {
    hayvanDetayiniGoster();
  }
}

// ===== Hayvan sayfası =====

function hayvanDetayiniAc(id) {
  inekDurum.acikHayvanId = id;
  hayvanDetayiniGoster();

  if (!inekAlanlar.detayPenceresi.open) {
    inekAlanlar.detayPenceresi.showModal();
  }
}

function satirEkle(kutu, sol, sag, sagSinif) {
  const satir = document.createElement("div");
  satir.className = "inek-bilgi-satiri";
  const a = document.createElement("span");
  a.textContent = sol;
  const b = document.createElement("strong");
  b.textContent = sag;

  if (sagSinif) {
    b.className = sagSinif;
  }

  satir.appendChild(a);
  satir.appendChild(b);
  kutu.appendChild(satir);
  return satir;
}

function donemAdimi(numara, baslik, aciklama, tarih, etiket, etiketSinif, durum) {
  const satir = document.createElement("div");
  satir.className = `donem-adimi ${durum}`;

  const nokta = document.createElement("span");
  nokta.className = "donem-noktasi";
  nokta.textContent = durum === "tamam" ? "✓" : durum === "uyari" ? "!" : String(numara);

  const orta = document.createElement("span");
  orta.className = "donem-orta";
  const b = document.createElement("strong");
  b.textContent = baslik;
  const a = document.createElement("small");
  a.textContent = aciklama;
  orta.appendChild(b);
  orta.appendChild(a);

  const sag = document.createElement("span");
  sag.className = "donem-sag";
  const t = document.createElement("strong");
  t.textContent = tarihNoktali(tarih);
  const e = document.createElement("small");
  e.className = etiketSinif || "";
  e.textContent = etiket;
  sag.appendChild(t);
  sag.appendChild(e);

  satir.appendChild(nokta);
  satir.appendChild(orta);
  satir.appendChild(sag);
  return satir;
}

function hayvanDetayiniGoster() {
  const h = hayvanBul(inekDurum.acikHayvanId);

  if (!h) {
    inekAlanlar.detayPenceresi.close();
    return;
  }

  const bugun = bugunAnahtari();
  const durum = hayvanDurumu(h, bugun);
  const disi = h.cinsiyet !== "erkek";

  inekAlanlar.detayUst.textContent = [h.kupe, h.irk, disi ? "Dişi" : "Erkek"]
    .filter(Boolean)
    .join(" · ");
  inekAlanlar.detayAd.textContent = h.silindi
    ? `${hayvanAdi(h)} (silinmiş)`
    : hayvanAdi(h);

  // Durum kartı
  const aciklamalar = {
    erkek: "Erkek hayvanlarda tohumlama ve doğum takibi yapılmaz.",
    bos: durum.t
      ? "Gebelik sonucu boş. Yeni tohumlama girilene kadar tarih hesaplanmaz."
      : "Bu dönem için tohumlama girilmedi.",
    bekliyor: durum.d
      ? `Tohumlandı (${tarihNoktali(durum.t && durum.t.tarih)}). Gebelik kontrolü sonucunu gir.`
      : "",
    yakin: durum.d ? `Gebelik kontrolü ${tarihNoktali(durum.d.kontrol)} tarihinde.` : "",
    gebe: durum.d
      ? `Kuruya çıkarma ${tarihNoktali(durum.d.kuru)}, tahmini doğum ${tarihNoktali(durum.d.dogum)}.`
      : ""
  };

  inekAlanlar.durumKarti.className = `hayvan-durum ${durum.stil}`;
  inekAlanlar.durumKarti.innerHTML = "";
  const ust = document.createElement("small");
  ust.textContent = "Şu anki durum";
  const baslik = document.createElement("strong");
  baslik.textContent = durum.ad;
  const aciklama = document.createElement("span");
  aciklama.textContent = aciklamalar[durum.kod] || "";
  inekAlanlar.durumKarti.appendChild(ust);
  inekAlanlar.durumKarti.appendChild(baslik);
  inekAlanlar.durumKarti.appendChild(aciklama);

  // Gebelik sonucu
  const t = disi ? aktifTohumlama(h) : null;
  inekAlanlar.gebelikAlani.classList.toggle("gizli", !t || h.silindi);

  if (t) {
    const d = donemTarihleri(t.tarih);
    inekAlanlar.gebelikSoru.textContent = bugun >= d.kontrol
      ? `Kontrol ${tarihNoktali(d.kontrol)} tarihinde yapılmalıydı. Sonuç ne çıktı?`
      : `Kontrol ${tarihNoktali(d.kontrol)} tarihinde. Sonucu o zaman girebilirsin.`;

    document.querySelectorAll("[data-gebelik]").forEach((buton) =>
      buton.classList.toggle("aktif", buton.dataset.gebelik === (t.sonuc || "bekliyor"))
    );
  }

  // Bu dönem
  inekAlanlar.donemAlani.classList.toggle("gizli", !t);
  inekAlanlar.donemAdimlari.innerHTML = "";

  if (t) {
    const d = donemTarihleri(t.tarih);
    const sonuc = t.sonuc || "bekliyor";
    const bos = sonuc === "bos";

    inekAlanlar.donemAdimlari.appendChild(donemAdimi(
      1, "Tohumlama", `Boğa kodu: ${t.bogaKodu || "girilmedi"}`, t.tarih, "yapıldı", "yesil-yazi", "tamam"
    ));
    inekAlanlar.donemAdimlari.appendChild(donemAdimi(
      2, "Gebelik kontrolü", "tohumlamadan 35 gün sonra", d.kontrol,
      sonuc === "bekliyor"
        ? (bugun >= d.kontrol ? "sonuç bekleniyor" : kalanMetni(gunFarki(bugun, d.kontrol)))
        : (sonuc === "gebe" ? "gebe" : "boş"),
      sonuc === "bekliyor" ? "turuncu-yazi" : "yesil-yazi",
      sonuc === "bekliyor" ? (bugun >= d.kontrol ? "uyari" : "") : "tamam"
    ));

    const kuruAdimi = donemAdimi(
      3, "Kuruya çıkarma", "doğumdan 60 gün önce", d.kuru,
      t.kuruyaCikti ? "kuruya çıkarıldı" : kalanMetni(gunFarki(bugun, d.kuru)),
      t.kuruyaCikti ? "yesil-yazi" : (bugun >= d.kuru ? "kirmizi-yazi" : "turuncu-yazi"),
      bos ? "soluk" : (t.kuruyaCikti ? "tamam" : (bugun >= d.kuru ? "uyari" : ""))
    );

    if (!bos) {
      const kuruButonu = document.createElement("button");
      kuruButonu.type = "button";
      kuruButonu.className = "kuru-buton";
      kuruButonu.textContent = t.kuruyaCikti
        ? "İşareti kaldır"
        : "Kuruya çıkarıldı olarak işaretle";
      kuruButonu.addEventListener("click", () => {
        if (t.kuruyaCikti) {
          delete t.kuruyaCikti;
        } else {
          t.kuruyaCikti = bugun;
        }
        hayvaniGuncelle(h);
      });
      kuruAdimi.querySelector(".donem-orta").appendChild(kuruButonu);
    }

    inekAlanlar.donemAdimlari.appendChild(kuruAdimi);
    inekAlanlar.donemAdimlari.appendChild(donemAdimi(
      4, "Tahmini doğum", "tohumlamadan 283 gün sonra", d.dogum,
      kalanMetni(gunFarki(bugun, d.dogum)),
      bugun > d.dogum ? "kirmizi-yazi" : "yesil-yazi",
      bos ? "soluk" : (bugun > d.dogum ? "uyari" : "")
    ));
  }

  inekAlanlar.disiIslemleri.classList.toggle("gizli", !disi || Boolean(h.silindi));

  // Geçmiş
  inekAlanlar.gecmis.innerHTML = "";
  const kayitlar = [
    ...(h.dogumlar || []).map((d) => ({ tur: "dogum", tarih: d.tarih, kayit: d })),
    ...(h.tohumlamalar || []).map((x) => ({ tur: "tohumlama", tarih: x.tarih, kayit: x }))
  ];

  if (h.sonDogum && !(h.dogumlar || []).some((d) => d.tarih === h.sonDogum)) {
    kayitlar.push({ tur: "eskiDogum", tarih: h.sonDogum });
  }

  kayitlar.sort((a, b) => b.tarih.localeCompare(a.tarih));

  if (kayitlar.length === 0) {
    bosMesaj(inekAlanlar.gecmis, "Henüz kayıt yok.");
  }

  kayitlar.forEach((k) => {
    const satir = document.createElement("div");
    satir.className = "gecmis-satiri";
    const sol = document.createElement("span");
    const b = document.createElement("strong");
    const a = document.createElement("small");

    if (k.tur === "tohumlama") {
      b.textContent = `Tohumlama · ${tarihNoktali(k.tarih)}`;
      const sonucAdi = { gebe: "gebe", bos: "boş", bekliyor: "sonuç girilmedi" }[k.kayit.sonuc || "bekliyor"];
      a.textContent = [k.kayit.bogaKodu ? `Boğa: ${k.kayit.bogaKodu}` : "", sonucAdi].filter(Boolean).join(" · ");
    } else if (k.tur === "dogum") {
      b.textContent = `Doğum · ${tarihNoktali(k.tarih)}${(k.kayit.buzagilar || []).length > 1 ? " · ikiz" : ""}`;
      a.textContent = (k.kayit.buzagilar || [])
        .map((bz) =>
          `${bz.cinsiyet === "erkek" ? "♂ Erkek" : bz.cinsiyet === "disi" ? "♀ Dişi" : "cinsiyet girilmedi"}${bz.kupe ? ` (${bz.kupe})` : ""}`
        )
        .join(", ") + (k.kayit.not ? ` · ${k.kayit.not}` : "");
    } else {
      b.textContent = `Doğum · ${tarihNoktali(k.tarih)}`;
      a.textContent = "Buzağı bilgisi girilmedi";
    }

    sol.appendChild(b);
    sol.appendChild(a);
    satir.appendChild(sol);

    if (k.tur !== "eskiDogum" && !h.silindi) {
      const sil = document.createElement("button");
      sil.type = "button";
      sil.className = "hareket-sil";
      sil.textContent = "×";
      sil.setAttribute("aria-label", "Kaydı sil");
      sil.addEventListener("click", () => {
        if (!confirm(`${b.textContent} kaydı silinsin mi?${k.tur === "dogum" ? "\n\nBu doğumla sürüye eklenen buzağılar silinmez." : ""}`)) {
          return;
        }

        if (k.tur === "tohumlama") {
          h.tohumlamalar = h.tohumlamalar.filter((x) => x.id !== k.kayit.id);
        } else {
          h.dogumlar = h.dogumlar.filter((x) => x.id !== k.kayit.id);
        }

        hayvaniGuncelle(h);
      });
      satir.appendChild(sil);
    }

    inekAlanlar.gecmis.appendChild(satir);
  });

  // Bilgiler
  inekAlanlar.bilgiler.innerHTML = "";
  satirEkle(inekAlanlar.bilgiler, "Küpe no", h.kupe || "—");
  satirEkle(inekAlanlar.bilgiler, "Irk", h.irk || "—");
  satirEkle(inekAlanlar.bilgiler, "Cinsiyet", disi ? "Dişi" : "Erkek");

  if (h.dogumTarihi) {
    satirEkle(inekAlanlar.bilgiler, "Doğum tarihi", tarihNoktali(h.dogumTarihi));
  }

  const anne = h.anneId ? hayvanBul(h.anneId) : null;

  if (anne) {
    const satir = satirEkle(inekAlanlar.bilgiler, "Annesi", hayvanAdi(anne), "baglanti-yazi");
    satir.addEventListener("click", () => hayvanDetayiniAc(anne.id));
  }

  aktifHayvanlar()
    .filter((y) => y.anneId === h.id)
    .forEach((y) => {
      const satir = satirEkle(
        inekAlanlar.bilgiler,
        "Yavrusu",
        `${hayvanAdi(y)} · ${y.cinsiyet === "erkek" ? "♂" : "♀"}`,
        "baglanti-yazi"
      );
      satir.addEventListener("click", () => hayvanDetayiniAc(y.id));
    });

  satirEkle(inekAlanlar.bilgiler, "Not", h.not || "—");

  eleman("#hayvanSilButonu").textContent = h.silindi ? "Geri al" : "Hayvanı sil";
}

// ===== Tohumlama =====

function tarihOnizlemesi(kutu, tohumlamaTarihi) {
  kutu.innerHTML = "";

  if (!gecerliTarih(tohumlamaTarihi)) {
    return;
  }

  const d = donemTarihleri(tohumlamaTarihi);
  const baslik = document.createElement("span");
  baslik.className = "onizleme-baslik";
  baslik.textContent = "Otomatik hesaplanır";
  kutu.appendChild(baslik);
  satirEkle(kutu, "Gebelik kontrolü (+35)", tarihNoktali(d.kontrol));
  satirEkle(kutu, "Kuruya çıkarma (doğumdan −60)", tarihNoktali(d.kuru));
  satirEkle(kutu, "Tahmini doğum (+283)", tarihNoktali(d.dogum));
}

function tohumlamaPenceresiniAc() {
  const h = hayvanBul(inekDurum.acikHayvanId);

  if (!h) {
    return;
  }

  inekAlanlar.tohumlamaHayvan.textContent = `${hayvanAdi(h)}${h.kupe ? ` · ${h.kupe}` : ""}`;
  inekAlanlar.tohumlamaTarihi.value = bugunAnahtari();
  inekAlanlar.tohumlamaBoga.value = "";
  tarihOnizlemesi(inekAlanlar.tohumlamaOnizleme, inekAlanlar.tohumlamaTarihi.value);
  inekAlanlar.tohumlamaPenceresi.showModal();
}

function tohumlamayiKaydet() {
  const h = hayvanBul(inekDurum.acikHayvanId);
  const tarih = inekAlanlar.tohumlamaTarihi.value;

  if (!h || !gecerliTarih(tarih)) {
    bildirimGoster("Tohumlama tarihini seç.");
    return;
  }

  h.tohumlamalar = h.tohumlamalar || [];
  h.tohumlamalar.push({
    id: yeniKimlik("t"),
    tarih,
    bogaKodu: inekAlanlar.tohumlamaBoga.value.trim(),
    sonuc: "bekliyor",
    eklendi: simdi()
  });

  inekAlanlar.tohumlamaPenceresi.close();
  hayvaniGuncelle(h);
  bildirimGoster(`${hayvanAdi(h)} için tohumlama kaydedildi.`);
}

// ===== Doğum =====

function dogumPenceresiniGuncelle() {
  const ikiz = inekAlanlar.dogumIkiz.checked;
  const suru = inekAlanlar.dogumSuruyeEkle.checked;

  inekAlanlar.buzagi2Kutusu.classList.toggle("gizli", !ikiz);
  inekAlanlar.buzagi1Baslik.textContent = ikiz ? "1. buzağı" : "Buzağı";
  inekAlanlar.dogumSuruyeEkleMetni.textContent = ikiz
    ? "Buzağıları sürüye ayrı hayvan olarak ekle"
    : "Buzağıyı sürüye ayrı hayvan olarak ekle";

  document.querySelectorAll(".kupe-notu").forEach((not) => {
    not.textContent = suru ? "(sürüye eklemek için gerekli)" : "(isteğe bağlı)";
  });

  document.querySelectorAll("[data-buzagi]").forEach((buton) =>
    buton.classList.toggle(
      "aktif",
      inekDurum.buzagiCinsiyetleri[buton.dataset.buzagi] === buton.dataset.cinsiyet
    )
  );

  const h = hayvanBul(inekDurum.acikHayvanId);
  const ad = h ? hayvanAdi(h) : "";
  inekAlanlar.dogumBilgi.textContent = suru
    ? `Kaydedince ${ikiz ? "iki buzağı" : "buzağı"} kendi küpe no ve cinsiyetiyle sürüye eklenir, annesi ${ad} olarak görünür. ${ad} için bu dönem kapanır.`
    : `Kaydedince buzağı bilgileri ${ad} hayvanının geçmişinde görünür. Bu dönem kapanır.`;
}

function dogumPenceresiniAc(id) {
  if (id) {
    inekDurum.acikHayvanId = id;
  }

  const h = hayvanBul(inekDurum.acikHayvanId);

  if (!h) {
    return;
  }

  const bugun = bugunAnahtari();
  const t = aktifTohumlama(h);
  const tahmini = t ? donemTarihleri(t.tarih).dogum : "";

  inekAlanlar.dogumHayvan.textContent = hayvanAdi(h);
  inekAlanlar.dogumTahmini.textContent = tahmini
    ? `${h.kupe ? `${h.kupe} · ` : ""}tahmini doğum ${tarihNoktali(tahmini)}`
    : h.kupe;
  inekAlanlar.dogumTarihi.value = tahmini && tahmini <= bugun ? tahmini : bugun;
  inekAlanlar.dogumIkiz.checked = false;
  inekAlanlar.dogumSuruyeEkle.checked = true;
  inekAlanlar.buzagi1Kupe.value = "";
  inekAlanlar.buzagi2Kupe.value = "";
  inekAlanlar.dogumNot.value = "";
  inekDurum.buzagiCinsiyetleri = { 1: "disi", 2: "erkek" };
  dogumPenceresiniGuncelle();

  if (!inekAlanlar.dogumPenceresi.open) {
    inekAlanlar.dogumPenceresi.showModal();
  }
}

function kupeKullaniliyor(kupe, haricId) {
  const aranan = kucukHarf(kupe);
  return inekDurum.veriler.hayvanlar.find(
    (h) => h.id !== haricId && kucukHarf(h.kupe) === aranan
  );
}

function dogumuKaydet() {
  const anne = hayvanBul(inekDurum.acikHayvanId);
  const tarih = inekAlanlar.dogumTarihi.value;
  const ikiz = inekAlanlar.dogumIkiz.checked;
  const suru = inekAlanlar.dogumSuruyeEkle.checked;

  if (!anne || !gecerliTarih(tarih)) {
    bildirimGoster("Doğum tarihini seç.");
    return;
  }

  const buzagilar = [1, ...(ikiz ? [2] : [])].map((sira) => ({
    cinsiyet: inekDurum.buzagiCinsiyetleri[sira],
    kupe: inekAlanlar[`buzagi${sira}Kupe`].value.trim()
  }));

  if (suru) {
    const eksik = buzagilar.findIndex((b) => !b.kupe);

    if (eksik >= 0) {
      bildirimGoster(`${ikiz ? `${eksik + 1}. buzağının` : "Buzağının"} küpe numarasını yaz ya da "sürüye ekle"yi kapat.`);
      return;
    }

    if (ikiz && kucukHarf(buzagilar[0].kupe) === kucukHarf(buzagilar[1].kupe)) {
      bildirimGoster("İki buzağının küpe numarası aynı olamaz.");
      return;
    }

    const kullanilan = buzagilar.find((b) => kupeKullaniliyor(b.kupe));

    if (kullanilan) {
      bildirimGoster(`${kullanilan.kupe} küpe numarası sürüde zaten var.`);
      return;
    }
  }

  const zaman = simdi();

  if (suru) {
    buzagilar.forEach((b) => {
      const yavru = hayvaniTemizle({
        id: yeniKimlik("h"),
        kupe: b.kupe,
        ad: "",
        irk: anne.irk,
        cinsiyet: b.cinsiyet,
        dogumTarihi: tarih,
        anneId: anne.id,
        olusturuldu: zaman,
        guncellendi: zaman
      });
      inekDurum.veriler.hayvanlar.push(yavru);
      b.hayvanId = yavru.id;
    });
  }

  // Doğum yaptıysa bu dönemin tohumlaması gebe sayılır.
  const t = aktifTohumlama(anne);

  if (t && (t.sonuc || "bekliyor") === "bekliyor" && t.tarih < tarih) {
    t.sonuc = "gebe";
  }

  anne.dogumlar = anne.dogumlar || [];
  anne.dogumlar.push({
    id: yeniKimlik("d"),
    tarih,
    buzagilar,
    not: inekAlanlar.dogumNot.value.trim(),
    eklendi: zaman
  });

  inekAlanlar.dogumPenceresi.close();
  hayvaniGuncelle(anne);
  bildirimGoster(`${hayvanAdi(anne)} doğumu kaydedildi${suru ? `, ${buzagilar.length} buzağı sürüye eklendi` : ""}.`);
}

// ===== Hayvan ekle / düzenle =====

function cinsiyetSeciminiGoster() {
  const erkek = inekDurum.hayvanCinsiyeti === "erkek";

  document.querySelectorAll("[data-hayvan-cinsiyet]").forEach((buton) =>
    buton.classList.toggle("aktif", buton.dataset.hayvanCinsiyet === inekDurum.hayvanCinsiyeti)
  );

  inekAlanlar.hayvanUremeAlani.classList.toggle("gizli", erkek);
}

function hayvanPenceresiniAc(id) {
  const h = id ? hayvanBul(id) : null;

  inekDurum.duzenlenenId = h ? h.id : "";
  inekDurum.hayvanCinsiyeti = h ? h.cinsiyet : "disi";
  inekAlanlar.hayvanBaslik.textContent = h ? "Bilgileri düzenle" : "Yeni hayvan";
  inekAlanlar.hayvanKupe.value = h ? h.kupe : "";
  inekAlanlar.hayvanAd.value = h ? h.ad : "";
  inekAlanlar.hayvanIrk.value = h ? h.irk : "";
  inekAlanlar.hayvanDogumTarihi.value = h ? h.dogumTarihi : "";
  inekAlanlar.hayvanSonDogum.value = h ? h.sonDogum : "";
  inekAlanlar.hayvanTohumlama.value = "";
  inekAlanlar.hayvanBoga.value = "";
  inekAlanlar.hayvanNot.value = h ? h.not : "";

  // Düzenlemede tohumlama hayvan sayfasındaki "+ Tohumlama" ile eklenir.
  inekAlanlar.hayvanTohumlamaAlani.classList.toggle("gizli", Boolean(h));
  tarihOnizlemesi(inekAlanlar.hayvanOnizleme, "");
  cinsiyetSeciminiGoster();
  inekAlanlar.hayvanPenceresi.showModal();
}

function hayvaniKaydet() {
  const kupe = inekAlanlar.hayvanKupe.value.trim();
  const ad = inekAlanlar.hayvanAd.value.trim();

  if (!kupe && !ad) {
    bildirimGoster("Küpe numarası ya da ad yazmalısın.");
    return;
  }

  const ayni = kupe ? kupeKullaniliyor(kupe, inekDurum.duzenlenenId) : null;

  if (ayni) {
    bildirimGoster(
      ayni.silindi
        ? `${kupe} silinen hayvanlarda kayıtlı; Sürü'nün altından geri alabilirsin.`
        : `${kupe} küpe numarası zaten ${hayvanAdi(ayni)} için kayıtlı.`
    );
    return;
  }

  const erkek = inekDurum.hayvanCinsiyeti === "erkek";
  const zaman = simdi();
  let h = hayvanBul(inekDurum.duzenlenenId);

  if (!h) {
    h = hayvaniTemizle({ id: yeniKimlik("h"), olusturuldu: zaman });
    inekDurum.veriler.hayvanlar.push(h);

    const tohumlama = inekAlanlar.hayvanTohumlama.value;

    if (!erkek && gecerliTarih(tohumlama)) {
      h.tohumlamalar.push({
        id: yeniKimlik("t"),
        tarih: tohumlama,
        bogaKodu: inekAlanlar.hayvanBoga.value.trim(),
        sonuc: "bekliyor",
        eklendi: zaman
      });
    }
  }

  h.kupe = kupe;
  h.ad = ad;
  h.irk = inekAlanlar.hayvanIrk.value.trim();
  h.cinsiyet = erkek ? "erkek" : "disi";
  h.dogumTarihi = gecerliTarih(inekAlanlar.hayvanDogumTarihi.value);
  h.sonDogum = erkek ? "" : gecerliTarih(inekAlanlar.hayvanSonDogum.value);
  h.not = inekAlanlar.hayvanNot.value.trim();

  inekAlanlar.hayvanPenceresi.close();
  hayvaniGuncelle(h);
  bildirimGoster(`${hayvanAdi(h)} kaydedildi.`);
}

// ===== Excel (CSV) çizelgesinden aktarma =====

function csvSatirlari(metin) {
  const temiz = metin.replace(/^﻿/, "");
  const ilkSatir = temiz.split(/\r?\n/).find((s) => s.trim()) || "";
  const ayrac = (ilkSatir.match(/;/g) || []).length >= (ilkSatir.match(/,/g) || []).length ? ";" : ",";
  const satirlar = [];
  let satir = [];
  let hucre = "";
  let tirnak = false;

  for (let i = 0; i < temiz.length; i++) {
    const c = temiz[i];

    if (tirnak) {
      if (c === '"' && temiz[i + 1] === '"') {
        hucre += '"';
        i++;
      } else if (c === '"') {
        tirnak = false;
      } else {
        hucre += c;
      }
    } else if (c === '"') {
      tirnak = true;
    } else if (c === ayrac) {
      satir.push(hucre);
      hucre = "";
    } else if (c === "\n" || c === "\r") {
      if (c === "\r" && temiz[i + 1] === "\n") {
        i++;
      }
      satir.push(hucre);
      satirlar.push(satir);
      satir = [];
      hucre = "";
    } else {
      hucre += c;
    }
  }

  if (hucre || satir.length) {
    satir.push(hucre);
    satirlar.push(satir);
  }

  return satirlar.map((s) => s.map((h) => h.trim()));
}

function csvTarihi(metin) {
  const m = String(metin || "").trim().match(/^(\d{1,2})[./-](\d{1,2})[./-](\d{4})$/);

  if (!m) {
    return gecerliTarih(String(metin || "").trim());
  }

  return `${m[3]}-${m[2].padStart(2, "0")}-${m[1].padStart(2, "0")}`;
}

function csvdenHayvanlar(metin) {
  const satirlar = csvSatirlari(metin);
  const baslikSirasi = satirlar.findIndex((s) => s.some((h) => kucukHarf(h).includes("küpe")));

  if (baslikSirasi < 0) {
    throw new Error("Dosyada “Küpe” başlıklı sütun bulunamadı.");
  }

  const basliklar = satirlar[baslikSirasi].map(kucukHarf);
  const sutun = (...anahtarlar) =>
    basliklar.findIndex((b) => anahtarlar.some((a) => b.includes(a)));

  const s = {
    kupe: sutun("küpe"),
    ad: sutun("inek adı", "adı", "isim"),
    irk: sutun("ırk", "irk"),
    cinsiyet: sutun("cinsiyet"),
    sonDogum: sutun("son doğum"),
    tohumlama: sutun("tohumlama tarihi"),
    boga: sutun("sperma", "boğa"),
    durum: sutun("gebelik durumu"),
    not: sutun("not")
  };

  const hucre = (satir, i) => (i >= 0 ? String(satir[i] || "").trim() : "");

  return satirlar
    .slice(baslikSirasi + 1)
    .filter((satir) => hucre(satir, s.kupe) || hucre(satir, s.ad))
    .map((satir) => {
      const cinsiyetMetni = kucukHarf(hucre(satir, s.cinsiyet));
      const durumMetni = kucukHarf(hucre(satir, s.durum));
      const tohumlama = csvTarihi(hucre(satir, s.tohumlama));
      const zaman = simdi();

      return hayvaniTemizle({
        id: yeniKimlik("h"),
        kupe: hucre(satir, s.kupe),
        ad: hucre(satir, s.ad),
        irk: hucre(satir, s.irk),
        cinsiyet: cinsiyetMetni.startsWith("e") ? "erkek" : "disi",
        sonDogum: csvTarihi(hucre(satir, s.sonDogum)),
        not: hucre(satir, s.not),
        tohumlamalar: tohumlama
          ? [{
              id: yeniKimlik("t"),
              tarih: tohumlama,
              bogaKodu: hucre(satir, s.boga),
              sonuc: durumMetni.includes("gebe")
                ? "gebe"
                : (durumMetni.includes("boş") || durumMetni.includes("bos") ? "bos" : "bekliyor"),
              eklendi: zaman
            }]
          : [],
        olusturuldu: zaman,
        guncellendi: zaman
      });
    });
}

function dosyaMetniniOku(dosya, kodlama) {
  return new Promise((coz, reddet) => {
    const okuyucu = new FileReader();
    okuyucu.onload = () => coz(String(okuyucu.result || ""));
    okuyucu.onerror = () => reddet(okuyucu.error);
    okuyucu.readAsText(dosya, kodlama);
  });
}

async function csvAktar(dosya) {
  inekAlanlar.aktarSonucu.textContent = "Okunuyor…";

  try {
    let metin = await dosyaMetniniOku(dosya, "utf-8");

    // Türkçe Excel bazen CSV'yi Windows-1254 ile kaydeder.
    if (metin.includes("�")) {
      metin = await dosyaMetniniOku(dosya, "windows-1254");
    }

    const yeniler = csvdenHayvanlar(metin);
    let eklenen = 0;
    let atlanan = 0;

    yeniler.forEach((h) => {
      if (h.kupe && kupeKullaniliyor(h.kupe)) {
        atlanan++;
        return;
      }

      inekDurum.veriler.hayvanlar.push(h);
      eklenen++;
    });

    if (eklenen > 0) {
      inekVerileriKaydet();
      inekEkraniniGoster();
    }

    inekAlanlar.aktarSonucu.textContent =
      `${eklenen} hayvan eklendi${atlanan ? `, ${atlanan} hayvan zaten kayıtlı olduğu için atlandı` : ""}.`;
    bildirimGoster(`${eklenen} hayvan aktarıldı.`);
  } catch (hata) {
    inekAlanlar.aktarSonucu.textContent =
      `Aktarılamadı: ${hata && hata.message ? hata.message : "dosya okunamadı"}`;
  } finally {
    inekAlanlar.csvDosyasi.value = "";
  }
}

// ===== Olaylar =====

eleman("#hayvanDetayKapat").addEventListener("click", () =>
  inekAlanlar.detayPenceresi.close()
);

inekAlanlar.detayPenceresi.addEventListener("click", (olay) => {
  if (olay.target === inekAlanlar.detayPenceresi) {
    inekAlanlar.detayPenceresi.close();
  }
});

document.querySelectorAll("[data-gebelik]").forEach((buton) =>
  buton.addEventListener("click", () => {
    const h = hayvanBul(inekDurum.acikHayvanId);
    const t = h && aktifTohumlama(h);

    if (!t) {
      return;
    }

    t.sonuc = buton.dataset.gebelik;
    hayvaniGuncelle(h);
  })
);

eleman("#tohumlamaEkleButonu").addEventListener("click", tohumlamaPenceresiniAc);
eleman("#tohumlamaKaydet").addEventListener("click", tohumlamayiKaydet);
inekAlanlar.tohumlamaTarihi.addEventListener("change", () =>
  tarihOnizlemesi(inekAlanlar.tohumlamaOnizleme, inekAlanlar.tohumlamaTarihi.value)
);

eleman("#dogumEkleButonu").addEventListener("click", () => dogumPenceresiniAc());
eleman("#dogumKaydet").addEventListener("click", dogumuKaydet);
inekAlanlar.dogumIkiz.addEventListener("change", dogumPenceresiniGuncelle);
inekAlanlar.dogumSuruyeEkle.addEventListener("change", dogumPenceresiniGuncelle);
document.querySelectorAll("[data-buzagi]").forEach((buton) =>
  buton.addEventListener("click", () => {
    inekDurum.buzagiCinsiyetleri[buton.dataset.buzagi] = buton.dataset.cinsiyet;
    dogumPenceresiniGuncelle();
  })
);

eleman("#hayvanEkleButonu").addEventListener("click", () => hayvanPenceresiniAc(""));
eleman("#hayvanDuzenleButonu").addEventListener("click", () =>
  hayvanPenceresiniAc(inekDurum.acikHayvanId)
);
eleman("#hayvanKaydet").addEventListener("click", hayvaniKaydet);
document.querySelectorAll("[data-hayvan-cinsiyet]").forEach((buton) =>
  buton.addEventListener("click", () => {
    inekDurum.hayvanCinsiyeti = buton.dataset.hayvanCinsiyet;
    cinsiyetSeciminiGoster();
  })
);
inekAlanlar.hayvanTohumlama.addEventListener("change", () =>
  tarihOnizlemesi(inekAlanlar.hayvanOnizleme, inekAlanlar.hayvanTohumlama.value)
);

eleman("#hayvanSilButonu").addEventListener("click", () => {
  const h = hayvanBul(inekDurum.acikHayvanId);

  if (!h) {
    return;
  }

  if (h.silindi) {
    delete h.silindi;
    hayvaniGuncelle(h);
    return;
  }

  const onay = confirm(
    `${hayvanAdi(h)} sürüden silinsin mi?\n\nKayıtları silinmez; Sürü'nün altındaki “Silinen hayvanlar” bölümünden geri alabilirsin.`
  );

  if (!onay) {
    return;
  }

  h.silindi = simdi();
  inekAlanlar.detayPenceresi.close();
  hayvaniGuncelle(h);
  bildirimGoster(`${hayvanAdi(h)} sürüden kaldırıldı.`);
});

inekAlanlar.arama.addEventListener("input", suruyuGoster);

inekAlanlar.csvDosyasi.addEventListener("change", () => {
  const dosya = inekAlanlar.csvDosyasi.files && inekAlanlar.csvDosyasi.files[0];

  if (dosya) {
    csvAktar(dosya);
  }
});

inekEkraniniGoster();
