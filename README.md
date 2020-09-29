# Kurzovity grafik uloh

Preview: https://ksp.exyi.cz, credentials jsou stejné jako na testwebu. Automaticky nasazené z master branche

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
Pokud se nakamarádíte s Javascriptem, existuje série knížek **You Don't Know JS (Yet)**.
Taky používáme TypeScript (typy do Javascriptu) a D3 (magická knihovna na něco s daty a SVG)

Server je magická proxy napsaná v ASP.NET Core - na produkci by neměla být potřeba, když KSP web přesvědčíme k tomu:

* vrátit /tasks.json
* POSTem uložit /tasks.json, když jsem org (vlastně ani není potřeba)
* vrátit /grafik v té KSP template (je to html obsahující jeden `div`, `link` a `script`)
* soubory z frontend/public/ (stačí ten javascript a css)
