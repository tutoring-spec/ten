# Google Apps Script — Integrazione completa Google Workspace

Progetto Apps Script che connette **Google Drive**, **Sheets**, **Docs**, **Slides**, **Gmail**, **Calendar** e **Tasks** in un unico script riutilizzabile.

## Struttura file

| File | Contenuto |
|------|-----------|
| `appsscript.json` | Manifest: OAuth scope e servizi avanzati abilitati |
| `Config.gs` | Costanti globali (nome cartella root, email report, ecc.) |
| `Code.gs` | Entry point, menu UI, demo completa, trigger giornaliero |
| `DriveService.gs` | Crea/cerca/condivide file e cartelle su Drive |
| `SheetsService.gs` | Crea spreadsheet, legge/scrive dati |
| `DocsService.gs` | Crea documenti, aggiunge testo, esporta PDF |
| `SlidesService.gs` | Crea presentazioni, aggiunge slide, esporta PDF |
| `GmailService.gs` | Cerca/invia email, gestisce allegati Drive |
| `CalendarService.gs` | Elenca/crea/aggiorna/elimina eventi |
| `TasksService.gs` | Gestisce Google Tasks (liste, creazione, completamento) |
| `LogService.gs` | Log persistente su Spreadsheet |

## Come iniziare

### 1. Crea il progetto su Apps Script

1. Vai su [script.google.com](https://script.google.com)
2. Crea un **Nuovo progetto**
3. Copia i file `.gs` nell'editor (o usa `clasp push` se hai installato [clasp](https://github.com/google/clasp))
4. Copia `appsscript.json` nella sezione **Impostazioni progetto → Mostra file manifest**

### 2. Abilita i servizi avanzati

In Apps Script Editor: **Servizi → +** e abilita:
- Google Drive API v3
- Gmail API v1
- Google Calendar API v3
- Google Sheets API v4
- Google Docs API v1
- Google Slides API v1
- Google Forms API v1
- Tasks API v1

### 3. Esegui la demo

Lancia `runFullDemo()` dall'editor. Lo script:
1. Crea un file `.txt` su Drive
2. Crea uno Spreadsheet con dati di esempio
3. Crea un Google Doc
4. Crea una Presentazione
5. Aggiunge un evento in Calendar per domani
6. Invia un'email di riepilogo a te stesso

### 4. Installa il trigger giornaliero (opzionale)

Esegui `installDailyTrigger()` **una sola volta**: ogni mattina alle 8:00 riceverai un'email con gli eventi del giorno.

## Utilizzo tramite clasp (consigliato)

```bash
npm install -g @google/clasp
clasp login
clasp create --title "GoogleIntegration" --type standalone
clasp push
```

## Personalizzazione

Modifica `Config.gs` per cambiare:
- `ROOT_FOLDER_NAME` — nome della cartella radice su Drive
- `REPORT_EMAIL` — indirizzo a cui inviare i report automatici
- `DRIVE_MAX_RESULTS` — numero massimo di risultati nelle ricerche
