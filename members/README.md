# Raccolta riservata — preparazione, non ancora attiva

Questa modifica è una bozza da collegare al progetto Supabase di Magda. Non unire né presentare la raccolta come privata prima dei controlli indicati sotto. Il sito pubblico attuale continua a funzionare.

## Configurazione del servizio

1. Creare/selezionare un progetto Supabase di proprietà dell'utente. Eseguire `members/schema.sql` e verificare che il bucket `portfolio-private` sia privato e senza altre policy permissive.
2. Abilitare l'accesso email e la conferma dell'indirizzo. Impostare Site URL `https://mbmphotoart.github.io` e consentire soltanto i redirect esatti `/accesso.html` e `/accesso-en.html` sullo stesso dominio.
3. Configurare un mittente SMTP proprio prima dell'apertura al pubblico: il servizio email di test non è adatto all'iscrizione pubblica. Impostare limiti di invio e protezione anti-abuso nel servizio.
4. Modello email per conferma iscrizione e magic link: usare un link a `{{ .RedirectTo }}?token_hash={{ .TokenHash }}&type=email`. Il destinatario conferma cliccando; il client verifica il token sul server e lo rimuove dalla barra degli indirizzi. Non attivare tracciamento dei link nell'email.
5. Nel file `member-config.js` inserire esclusivamente URL progetto e chiave pubblicabile. Nessuna chiave `service_role` nel frontend o nel repository.
6. Distribuire la funzione `manage-members`; assegnarle `PORTFOLIO_OWNER_UID` dell'account verificato della proprietaria e `SITE_ORIGIN`. La chiave di servizio resta nei segreti del server. Solo questo UUID può elencare gli iscritti e revocare/riattivare accessi.

## Trasferimento immagini e attivazione

La galleria usa un catalogo e immagini scaricati tramite endpoint autenticati, mai semplici URL pubblici o URL firmati riutilizzabili. L'accesso dipende dall'email confermata e da `portfolio_members.active`. La revoca impedisce nuove richieste; i byte già scaricati non sono recuperabili dal dispositivo del visitatore.

Eseguire `python members/prepare_release.py` da un checkout completo della versione corrente del sito. Il comando costruisce `.members-release/`, sceglie 18 delle 36 Top per la parte pubblica e prepara il catalogo completo. Non modifica gli originali.

Caricare in `portfolio-private` `catalogue.json` e tutte le immagini elencate in `upload-manifest.json`, conservandone i percorsi. Prima di eliminare le copie pubbliche, verificare conteggio, dimensioni e checksum di ogni oggetto caricato e fare un backup privato completo. Il manifest di caricamento NON è un file per la pubblicazione.

Attenzione: le foto sono state pubblicate in un repository pubblico. Rimuovere i file dall'ultima versione non elimina le copie presenti nella cronologia Git. Prima di dichiarare privata la raccolta occorre rendere privata anche la sorgente storica e adottare un hosting che non esponga questi file, oppure una migrazione approvata della pubblicazione. Verificare anche vecchi indirizzi, cache e asset condivisi con Mostra e Concorsi. Copie già scaricate da terzi non sono revocabili. Non riscrivere la cronologia né cancellare il repository automaticamente.

La distribuzione finale mantiene pubbliche copertina, 18 Top e le altre pagine. Le foto usate anche da Mostra o Concorsi rimangono necessariamente pubbliche in quelle pagine: il piano di migrazione le elenca come eccezioni. La raccolta completa conserva le 521 immagini e le categorie originali, in ordine per data di scatto; le immagini senza data verificabile seguono quelle datate.

## Verifiche obbligatorie prima dell'attivazione

- Utente anonimo: accesso al catalogo e a ogni foto privata negato dal server; nessun URL riservato nel codice HTML della Home.
- Utente registrato ma email non confermata: download negato.
- Utente con email confermata: catalogo, categorie, pagine, foto ingrandita e logout funzionano.
- Utente revocato: download negato anche usando il precedente token di accesso; l'amministrazione deve rimanere inaccessibile agli altri iscritti.
- Verificare link email scaduto/usato, invii ripetuti, rete assente, account esistente, accesso da un altro dispositivo, IT/EN, leggibilità e navigazione da telefono/iPad.
- Verificare la consegna reale delle email. Non usare solo un test simulato per dichiarare il sistema attivo.
- Inserire un'informativa privacy coerente con conservazione e fornitori effettivamente scelti; email raccolte per accesso, senza iscrizione automatica a newsletter.

Documentazione ufficiale: https://supabase.com/docs/guides/auth/auth-email-passwordless e https://supabase.com/docs/guides/storage/security/access-control .
