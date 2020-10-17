# Kurzovity grafik uloh

Veřejné preview je dostupné na adrese https://ksp.vsq.cz/grafik. Automaticky se nasazuje nová verze při každém commitu do masteru. Aktuálně nasazená verze je:
![Aktuální verze](https://ksp.vsq.cz/build/build_id.svg)

## Spuštění pro vývoj

**Závislosti (Arch packages):** dotnet-sdk, yarn, aspnet-runtime

```
cd frontend/
yarn dev
```

* **uživatel:** http://localhost:5000/grafik
* **editor:** http://localhost:5000/grafik.html#editor

## Vývoj

Frontend je napsaný ve Svelte, tady je (slušný) tutoriál: https://svelte.dev/tutorial/basics.
Pokud se nekamarádíte s JavaScriptem, existuje série knížek **You Don't Know JS (Yet)**.
Taky používáme TypeScript (typy do Javascriptu) a D3 (magická knihovna na něco s daty a SVG)

## Integrace do KSPího webu

Vývojový server je magická proxy napsaná v ASP.NET Core. Na produkci není potřeba, když KSP web přesvědčíme k tomu:

* vrátit /tasks.json
* vrátit /grafik v té KSP template (je to html obsahující jeden `div`, `link` a `script`)
* soubory z frontend/public/ (stačí ten JavaScript a CSS)

Zároveň by se pro provoz webové aplikace hodilo přidat tato API. Aktuálně data získáváme všelijakými hacky:

* seznam úloh ze cvičiště a získané body
* HTML/text zadání a řešení jedné konkrétní úlohy
* API odevzdávátka
* Na stránce je potřeba zjistit jestli je uživatel přihlášený

Dále bychom potřebovali web rozšířit o novou funkcionalitu:

* definice opendatovek, co jsou technicky akorát ve cvičišti a nejsou ideálně na webu vůbec vidět
