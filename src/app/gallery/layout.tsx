import type { Metadata } from "next";
import type { ReactNode } from "react";

export const metadata: Metadata = {
  title: "Galeria zdjęć z pokazów lotniczych | AirShow Gallery",
  description:
    "Zdjęcia z pokazów lotniczych, air show i imprez lotniczych. Przeglądaj galerie samolotów, zespołów akrobacyjnych i lotnictwa.",
  alternates: { canonical: "/gallery" },
};

export default function GalleryLayout({ children }: { children: ReactNode }) {
  return (
    <div className="gallery-route">
      <style>{`
        /* Gallery-only mobile polish. Nie zmienia homepage ani innych tras. */
        .gallery-route { min-width: 0; }

        /* Telefon: zdjęcia mają zajmować możliwie dużo szerokości,
           ale nadal zachowują naturalne proporcje. */
        @media (max-width: 767px) {
          .gallery-route .masonry {
            columns: 2 !important;
            column-gap: 6px !important;
            width: 100% !important;
          }

          .gallery-route .m-item {
            margin-bottom: 6px !important;
            border-radius: 7px !important;
            background: transparent !important;
          }

          .gallery-route .m-item img {
            display: block !important;
            width: 100% !important;
            height: auto !important;
            transform: none !important;
            transition: none !important;
            border-radius: inherit !important;
            object-fit: contain !important;
          }

          .gallery-route .m-overlay,
          .gallery-route .m-caption {
            display: none !important;
          }
        }

        /* Duże tap-targety i wygodniejsze otwieranie zdjęcia na telefonie. */
        @media (max-width: 767px) and (pointer: coarse) {
          .gallery-route .m-item {
            -webkit-tap-highlight-color: transparent;
          }

          .gallery-route .m-item:active {
            opacity: .88;
          }

          .gallery-route .lb {
            padding: max(8px, env(safe-area-inset-top)) 8px max(8px, env(safe-area-inset-bottom)) !important;
            background: rgba(0,0,0,.985) !important;
            overscroll-behavior: contain !important;
          }

          .gallery-route .lb-img {
            width: auto !important;
            max-width: calc(100vw - 20px) !important;
            max-height: calc(100dvh - 150px) !important;
            height: auto !important;
            object-fit: contain !important;
            border-radius: 5px !important;
            box-shadow: 0 18px 55px rgba(0,0,0,.52) !important;
          }

          .gallery-route .lb-close,
          .gallery-route .lb-prev,
          .gallery-route .lb-next {
            min-width: 44px !important;
            min-height: 44px !important;
          }

          .gallery-route .lb-close {
            top: max(10px, env(safe-area-inset-top) + 4px) !important;
            right: 10px !important;
          }

          .gallery-route .lb-counter {
            top: max(11px, env(safe-area-inset-top) + 5px) !important;
            padding: 8px 11px !important;
            font-size: 10px !important;
          }

          .gallery-route .lb-prev,
          .gallery-route .lb-next {
            opacity: .68 !important;
            width: 42px !important;
            height: 58px !important;
          }

          .gallery-route .lb-prev { left: 4px !important; }
          .gallery-route .lb-next { right: 4px !important; }

          .gallery-route .lb-bar {
            left: 7px !important;
            right: 7px !important;
            bottom: max(7px, env(safe-area-inset-bottom)) !important;
            padding: 10px 11px !important;
            min-height: 50px !important;
            border-radius: 14px !important;
            gap: 8px !important;
            background: rgba(12,12,12,.78) !important;
            -webkit-backdrop-filter: blur(16px);
            backdrop-filter: blur(16px);
          }

          .gallery-route .lb-bar > div:first-child {
            min-width: 0 !important;
          }

          .gallery-route .lb-bar p {
            white-space: nowrap !important;
            overflow: hidden !important;
            text-overflow: ellipsis !important;
          }

          .gallery-route .lb-bar a {
            max-width: 44px !important;
            min-width: 44px !important;
            width: 44px !important;
            height: 40px !important;
            padding: 0 !important;
            justify-content: center !important;
            overflow: hidden !important;
            font-size: 0 !important;
          }

          .gallery-route .lb-bar a svg {
            flex: 0 0 auto !important;
            width: 15px !important;
            height: 15px !important;
          }
        }

        @media (prefers-reduced-motion: reduce) {
          .gallery-route .m-item img,
          .gallery-route .lb {
            animation: none !important;
            transition: none !important;
          }
        }
      `}</style>
      {children}
    </div>
  );
}
