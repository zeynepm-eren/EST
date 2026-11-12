"use strict";

// Uygulamanın ana sekmeleri: Siparişler / İşlem / Müşteriler.

document
  .querySelectorAll("[data-panel]")
  .forEach(
    (buton) => {
      buton.addEventListener(
        "click",
        () => {
          document
            .querySelectorAll("[data-panel]")
            .forEach(
              (sekme) =>
                sekme.classList.toggle(
                  "aktif",
                  sekme === buton
                )
            );

          document
            .querySelectorAll(".ana-panel")
            .forEach(
              (panel) =>
                panel.classList.toggle(
                  "aktif-panel",
                  panel.id ===
                    buton.dataset.panel
                )
            );

          if (
            buton.dataset.panel === "islemPaneli" ||
            buton.dataset.panel === "musteriPaneli"
          ) {
            cariEkraniniGoster();
          }
        }
      );
    }
  );

