# Antitesi Pizzeria - Sito Web

Sito web ufficiale di Antitesi Pizzeria, Frascati.

## Struttura File

```
antitesi-website/
├── index.html          # Pagina principale
├── styles.css          # Stili CSS
├── script.js           # JavaScript interattivo
├── assets/
│   ├── images/         # Immagini (da aggiungere)
│   │   ├── hero-frascati.jpg
│   │   ├── filosofia.jpg
│   │   ├── locale-1.jpg ... locale-4.jpg
│   │   ├── pizza-hero.jpg
│   │   └── menu/       # Foto pizze per il menu
│   ├── icons/
│   │   └── favicon.svg
│   └── fonts/          # (Google Fonts via CDN)
└── README.md
```

## Immagini Richieste

### Hero
- `hero-frascati.jpg` - Scorcio vintage del centro storico di Frascati (1920x1080 min)

### Filosofia
- `filosofia.jpg` - Foto evocativa (impasto, mani del pizzaiolo, o interno locale)

### Il Locale (Gallery)
- `locale-1.jpg` - Sala principale (foto grande)
- `locale-2.jpg` - Dettaglio interno
- `locale-3.jpg` - Vista centro storico
- `locale-4.jpg` - Atmosfera serale

### La Pizza
- `pizza-hero.jpg` - Una bella pizza fotografata (la signature idealmente)

### Menu (cartella menu/)
- `margherita.jpg`
- `marinara.jpg`
- `bufala.jpg`
- `diavola.jpg`
- `antitesi.jpg` (signature)
- `cacio-pepe.jpg`
- `mortadella.jpg`
- `fritto-misto.jpg`
- `supplì.jpg`
- `tiramisu.jpg`
- `nutella.jpg`

### Formato Immagini Consigliato
- **Formato**: JPG (ottimizzato per web)
- **Dimensioni**:
  - Hero: 1920x1080 px
  - Gallery/Menu: 800x600 px minimo
  - Ottimizzare con TinyPNG o simili
- **Peso**: < 200KB per immagine

## Come Modificare

### Testi
Aprire `index.html` con un editor di testo e cercare le sezioni:
- Filosofia: cerca `filosofia-quote` e `filosofia-desc`
- Menu: cerca `menu-item` per ogni pizza
- Contatti: cerca `prenota-section` e `contatti-section`

### Colori
Modificare le variabili CSS in `styles.css`:
```css
:root {
    --color-bronze: #b87333;    /* Colore principale */
    --color-gold: #d4af37;      /* Accenti oro */
    --color-green: #4a5d23;     /* Verde piante */
}
```

### Menu Prezzi
Cercare in `index.html` le classi `menu-item-price` e modificare i valori.

## Deployment

1. Caricare tutti i file sul server web
2. Assicurarsi che le immagini siano nella cartella `assets/images/`
3. Verificare che il file `menu-antitesi.pdf` sia presente in `assets/`

## Integrazione Prenotazioni

Il pulsante "Prenota" attualmente punta al numero di telefono.
Per integrare con il sistema di prenotazione online, modificare in `index.html`:

```html
<!-- Da: -->
<a href="tel:+393408854176" class="btn btn-primary">

<!-- A: -->
<a href="https://prenotazioni.antitesipizzeria.it" class="btn btn-primary">
```

## Browser Supportati

- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+
- Mobile browsers moderni

## Crediti

Design e sviluppo: 2024
Palette colori: ispirata all'interior design del locale Antitesi
