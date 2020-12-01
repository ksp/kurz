# Kurzovitý grafík z úloh

Veřejné preview je dostupné na adrese https://ksp.vsq.cz/kurz. Automaticky se nasazuje nová verze při každém commitu do masteru. Aktuálně nasazená verze je:
![Aktuální verze](https://ksp.vsq.cz/build/build_id.svg)

Veřejná verze https://ksp.mff.cuni.cz/kurz. Na interní testweb se také automaticky nasazuje verze z masteru. 

## Spuštění pro vývoj

**Závislosti:** Dotnet Core SDK, ASP.NET Core Runtime a Yarn (package manager pro JavaScript)

* Windows: [Yarn](https://classic.yarnpkg.com/en/docs/install/#windows-stable) a [dotnet](https://docs.microsoft.com/en-us/dotnet/core/install/windows?tabs=net50)
* Arch: `pacman -S dotnet-sdk yarn aspnet-runtime`

```
cd frontend/
yarn install
yarn dev
```

* **uživatel:** http://localhost:5000/kurz
* **editor:** http://localhost:5000/editor.html

## Vývoj

Frontend je napsaný ve Svelte, tady je (slušný) tutoriál: https://svelte.dev/tutorial/basics.
Pokud se nekamarádíte s JavaScriptem, existuje série knížek **You Don't Know JS (Yet)** pomocí které si můžete tento problém opravit.
Taky používáme TypeScript (typy do Javascriptu) a D3 (magická knihovna na něco s daty a SVG).

Vývojový server je magická proxy napsaná v ASP.NET Core. Na produkci se nepoužívá, tam backend dělá tradiční KSP web.

## Editace úloh

Velmi oceníme příspěvky do souboru tasks.json, kde jsou definované všechny zobrazované úlohy a texty.
Chtěli bychom nějak inteligentně roztřídit většinu historických ůloh v KSPčku a navíc přidat další materiál (třeba seriály předělané na open-data).
Na editaci máme napsaný editor, můžete jej použít buď lokálně a nebo hostovaný na našem serveru.

* Lokálně si můžete spustit server podle návodu výše. Editor je na http://ksp.localhost:5000/editor.html. Editace rovnou mění soubor tasks.json, který pak commitnete do gitu a vyrobíte PR.
* Na Vaškově serveru https://ksp.vsq.cz/editor.html. Změněný soubor si můžete stáhnout kliknutím na tlačítko "Stáhnout data lokálně", pak ho můžete commitnout do gitu.
