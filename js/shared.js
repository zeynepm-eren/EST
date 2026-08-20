"use strict";

// Uygulamanın tüm bölümlerinin kullandığı sabitler ve yardımcılar.

const VERI_ANAHTARI = "eren-sut-takip-veriler";
const AYAR_ANAHTARI = "eren-sut-takip-ayarlar";
const SYNC_ANAHTARI = "eren-sut-takip-sync";
const CARI_ANAHTARI = "eren-sut-takip-cariler";
const VARSAYILAN_LITRE_FIYATI = 36;

const gunAdlari = [
  "Pazartesi",
  "Salı",
  "Çarşamba",
  "Perşembe",
  "Cuma",
  "Cumartesi",
  "Pazar"
];

const kisaGunler = [
  "Pzt",
  "Sal",
  "Çar",
  "Per",
  "Cum",
  "Cmt",
  "Paz"
];

const eleman = (secici) => document.querySelector(secici);

function kayitOku(anahtar, varsayilan) {
  try {
    const kayit = localStorage.getItem(anahtar);

    return kayit
      ? JSON.parse(kayit)
      : varsayilan;
  } catch {
    return varsayilan;
  }
}

function pazartesiSirasi(tarih) {
  return (tarih.getDay() + 6) % 7;
}

function haftaninPazartesisi(tarih) {
  const sonuc = new Date(
    tarih.getFullYear(),
    tarih.getMonth(),
    tarih.getDate()
  );

  sonuc.setDate(
    sonuc.getDate() - pazartesiSirasi(sonuc)
  );

  sonuc.setHours(12, 0, 0, 0);

  return sonuc;
}

function gunEkle(tarih, miktar) {
  const sonuc = new Date(tarih);

  sonuc.setDate(
    sonuc.getDate() + miktar
  );

  return sonuc;
}

function tarihAnahtari(tarih) {
  const yil = tarih.getFullYear();

  const ay = String(
    tarih.getMonth() + 1
  ).padStart(2, "0");

  const gun = String(
    tarih.getDate()
  ).padStart(2, "0");

  return `${yil}-${ay}-${gun}`;
}

function tarihYaz(tarih, ayarlar) {
  return new Intl.DateTimeFormat(
    "tr-TR",
    ayarlar
  ).format(tarih);
}

function litreYaz(miktar) {
  return new Intl.NumberFormat(
    "tr-TR",
    {
      maximumFractionDigits: 2
    }
  ).format(miktar);
}

