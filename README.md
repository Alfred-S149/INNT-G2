# INNT-G2 - Riskbase
Riskbase er et AI-understøttet beslutningsstøttesystem til pre-screening af nye ejendomsprojekter. Applikationen hjælper projektudviklere med at omsætte ustruktureret prospectmateriale til et struktureret beslutningsgrundlag, hvor dealbreakers og informationshuller bliver synlige tidligt.

Denne mappe indeholder frontenden, som er bygget i Next.js. Den er en del af et samlet Riskbase-projekt (et såkaldt monorepo), hvor flere dele af systemet ligger i samme repository.

## Demovideo

https://github.com/user-attachments/assets/573cd778-3a97-4dc8-b011-364cb32eb5eb

## Teknologi
 
- **Next.js** – frontend og navigation mellem siderne
- **Supabase** – relationel database, hvor skemaer, felter og øvrige data gemmes
- **Tailwind CSS + shadcn** – styling og UI-komponenter (styling ligger adskilt fra logikken)
- **Bun + Turborepo** – installation og kørsel af projektet
Fremadrettet skal der kobles en FastAPI-server på, som håndterer ekstraktion og parsing af prospectmateriale.
 
## Sådan kører du projektet
 
**1. Installer Bun**
 
Projektet bruger [Bun](https://bun.sh) (version 1.3.5). Node skal ikke installeres separat.
 
**2. Installer afhængigheder**
 
Kør kommandoen fra projektets rodmappe (ikke inde i `apps/web`):
 
```bash
bun install
```
 
**3. Tilføj adgang til databasen**
 
Applikationen henter og gemmer data i Supabase. For at køre projektet lokalt kræves en unik API-nøgle til Supabase-databasen. Nøglen er af sikkerhedshensyn **ikke** delt i dette GitHub-repository, og uden den kan applikationen starte, men ikke vise eller gemme data.
 
Har du fået adgang, opretter du en fil med navnet `.env.local` i `apps/web` og indsætter nøglerne:
 
```bash
NEXT_PUBLIC_SUPABASE_URL=<din-supabase-url>
NEXT_PUBLIC_SUPABASE_ANON_KEY=<din-api-nøgle>
```
 
**4. Start applikationen**
 
Stadig fra rodmappen:
 
```bash
bun run dev: prod
```
 
Åbn derefter [http://localhost:3000](http://localhost:3000) i browseren.
 
