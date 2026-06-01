# Návod k použití - Apartment Dita

Tento web je vytvořen jako čistě statický. To znamená, že jej stačí nahrát na jakýkoliv webhosting (např. Webzdarma, Wedos) přes FTP a bude okamžitě fungovat.

## Struktura souborů
- `index.html` - Hlavní stránka (Čeština)
- `index-en.html` - Hlavní stránka (Angličtina)
- `index-de.html` - Hlavní stránka (Němčina)
- `galerie.html` - Stránka s fotogalerií
- `css/style.css` - Veškerý vzhled webu
- `js/script.js` - Jednoduchý kód pro fungování fotogalerie (lightbox)
- `icons/` - Složka se SVG ikonkami (vybavení, telefon atd.)
- `images/` - Složka pro vaše budoucí fotografie

## Jak přidat vlastní fotografie
V současné verzi jsou použity náhledové obrázky ze služby Picsum. Pro vložení vlastních fotek postupujte takto:
1. Své fotografie uložte do složky `images/`. Doporučujeme je předem zoptimalizovat (zmenšit rozlišení na max 1920px šířku).
2. V souborech `.html` najděte značky `<img>` s adresou začínající `https://picsum...` a nahraďte ji cestou ke svému souboru, např.:
   `src="./images/moje-kuchyn.jpg"`

## Jak změnit texty
Stačí otevřít příslušný `.html` soubor v libovolném textovém editoru (např. Poznámkový blok, VS Code) a přepsat text mezi značkami, např.:
`<p>Můj nový text o apartmánu</p>`

## Úprava vybavení
V sekci "Vybavení" v `index.html` můžete libovolně přidávat nebo odebírat položky. Každý prvek je tvořen ikonkou a názvem:
```html
<div class="flex items-center gap-4">
    <div class="flex-shrink-0 w-12 h-12 flex items-center justify-center bg-bg-soft rounded-lg text-accent">
        <img src="./icons/bed.svg" alt="Icon">
    </div>
    <span class="font-medium">Název vybavení</span>
</div>
```

## Hosting (Nahrání na web)
Nahrajte celý obsah složky (všechny soubory a složky `css`, `js`, `icons`, `images`) do kořenového adresáře vašeho hostingu (obvykle složka `www` nebo `public_html`).
