"use strict";

// Uygulamanın bölümleri ve sekmeleri:
// Süt Takip  → Siparişler / İşlem / Müşteriler
// İnek Takip → Yapılacaklar / Sürü
// Uygulama en son açık bırakılan bölümü ve sekmeyi hatırlar.

const BOLUM_ANAHTARI = "eren-sut-takip-bolum";

const bolumDurumu = (() => {
  const varsayilan = {
    bolum: "sut",
    sut: "siparisPaneli",
    inek: "inekYapilacakPaneli"
  };

  try {
    const kayit = JSON.parse(localStorage.getItem(BOLUM_ANAHTARI) || "{}");
    return { ...varsayilan, ...kayit };
  } catch {
    return varsayilan;
  }
})();

function bolumuKaydet() {
  try {
    localStorage.setItem(BOLUM_ANAHTARI, JSON.stringify(bolumDurumu));
  } catch {
    // Tarayıcı depolaması kapalı olabilir.
  }
}

function paneliGoster(panelId) {
  document
    .querySelectorAll("[data-panel]")
    .forEach((sekme) =>
      sekme.classList.toggle("aktif", sekme.dataset.panel === panelId)
    );

  document
    .querySelectorAll(".ana-panel")
    .forEach((panel) =>
      panel.classList.toggle("aktif-panel", panel.id === panelId)
    );

  if (panelId === "islemPaneli" || panelId === "musteriPaneli") {
    cariEkraniniGoster();
  }

  if (
    (panelId === "inekYapilacakPaneli" || panelId === "inekSuruPaneli") &&
    typeof inekEkraniniGoster === "function"
  ) {
    inekEkraniniGoster();
  }
}

function bolumuGoster(bolum) {
  const inekMi = bolum === "inek";

  bolumDurumu.bolum = inekMi ? "inek" : "sut";
  document.body.classList.toggle("inek-bolumu", inekMi);

  document
    .querySelectorAll("[data-bolum]")
    .forEach((buton) =>
      buton.classList.toggle("aktif", buton.dataset.bolum === bolumDurumu.bolum)
    );

  eleman("#sutSekmeleri").classList.toggle("gizli", inekMi);
  eleman("#inekSekmeleri").classList.toggle("gizli", !inekMi);

  paneliGoster(inekMi ? bolumDurumu.inek : bolumDurumu.sut);
  bolumuKaydet();
}

document
  .querySelectorAll("[data-bolum]")
  .forEach((buton) =>
    buton.addEventListener("click", () => {
      bolumuGoster(buton.dataset.bolum);
      window.scrollTo({ top: 0 });
    })
  );

document
  .querySelectorAll("[data-panel]")
  .forEach((buton) =>
    buton.addEventListener("click", () => {
      const panel = buton.dataset.panel;

      if (buton.closest("#inekSekmeleri")) {
        bolumDurumu.inek = panel;
      } else {
        bolumDurumu.sut = panel;
      }

      paneliGoster(panel);
      bolumuKaydet();
    })
  );

bolumuGoster(bolumDurumu.bolum);
