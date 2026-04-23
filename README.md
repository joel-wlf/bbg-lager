# BBG Lager

Lagerverwaltungssystem für das Kinder- und Jugendcamp der BBGBEW. Eine Progressive Web App zur Verwaltung, Suche und Buchung von Lagerartikeln.

## Features

- **Artikelverwaltung** – Artikel anlegen, bearbeiten und löschen mit Bildupload
- **Kistenverwaltung** – Lagerboxen mit Regalplatz und Inhalt verwalten
- **Entnahmen** – Artikelausleihen beantragen und verfolgen
- **Anfragen** – Anfragen einsehen und bearbeiten
- **Öffentliche Suche** – Lagerbestand ohne Login durchsuchen und Artikel buchen, inkl. Buchungskonflikterkennung
- **Inventur** – Geführter Inventurprozess mit Bereichsauswahl und Swipe-Bestätigung
- **Regalansicht** – Visuelle 3D-Darstellung des Lagerregals
- **PWA** – Installierbar auf Mobilgeräten

## Stack

- **Frontend**: React 19, TypeScript, Vite
- **UI**: Tailwind CSS 4, shadcn/ui, Radix UI
- **Backend**: [PocketBase](https://pocketbase.io) (gehostet auf Railway)
- **Deployment**: Vercel

## Entwicklung

```bash
npm install
npm run dev
```

Die App läuft dann unter `http://localhost:5173`.

### Weitere Befehle

```bash
npm run build    # Produktions-Build
npm run preview  # Build lokal vorschauen
npm run lint     # ESLint ausführen
```

## Konfiguration

Der PocketBase-Backend-URL ist in `src/lib/pocketbase.ts` hinterlegt. Für eine eigene Instanz diesen Wert anpassen.

## Deployment

Das Frontend wird automatisch über **Vercel** deployed. Das `vercel.json` leitet alle Anfragen auf `index.html` um (SPA-Routing).
