// Deutsche Bezeichnungen und Erklärungen für den Optionskatalog (options.ts).
// Ein Test prüft, dass jede Option hier einen Eintrag hat.

import type { CategoryId } from "../options";

export const categoriesDe: Record<CategoryId, { label: string; blurb: string }> = {
  essentials: { label: "Grundlagen", blurb: "Die Optionen, die fast jede Synchronisation braucht." },
  files: { label: "Dateien & Ordner", blurb: "Was kopiert wird und wie Verzeichnisse behandelt werden." },
  links: { label: "Links", blurb: "Symbolische und harte Links." },
  meta: { label: "Rechte & Metadaten", blurb: "Besitzer, Rechte, Zeitstempel, ACLs und xattrs." },
  compare: { label: "Vergleichen & überspringen", blurb: "Wie rsync entscheidet, ob eine Datei aktualisiert werden muss." },
  delete: { label: "Löschen", blurb: "Dateien auf der Empfängerseite entfernen." },
  backup: { label: "Sicherungen & Snapshots", blurb: "Alte Versionen behalten und inkrementelle Snapshots erstellen." },
  transfer: { label: "Übertragung", blurb: "Teilübertragungen, temporäre Dateien und direktes Aktualisieren." },
  perf: { label: "Tempo & Kompression", blurb: "Kompression, Bandbreite und Speicherlimits." },
  filters: { label: "Dateien filtern", blurb: "Ein-/Ausschlusslisten und Dateilisten." },
  remote: { label: "Remote & Netzwerk", blurb: "SSH, Daemon-Verbindungen und Netzwerk." },
  output: { label: "Ausgabe & Protokoll", blurb: "Was rsync während der Ausführung meldet." },
  advanced: { label: "Erweitert", blurb: "Batch-Modus, Protokoll-Feinheiten und Zeitlimits." },
};

const infoFlags =
  "BACKUP, COPY, DEL, FLIST, MISC, MOUNT, NAME, NONREG, PROGRESS, REMOVE, SKIP, STATS, SYMSAFE (Stufe anhängen, z. B. NAME2)";
const debugFlags =
  "ACL, BACKUP, BIND, CHDIR, CONNECT, CMD, DEL, DELTASUM, DUP, EXIT, FILTER, FLIST, FUZZY, GENR, HASH, HLINK, ICONV, IO, NSTR, OWN, PROTO, RECV, SEND, TIME";

/** [Bezeichnung, Erklärung] je Option-ID. */
export const optionsDe: Record<string, [string, string]> = {
  // Grundlagen
  archive: ["Archivmodus", "Rekursiv kopieren und fast alles erhalten: Symlinks, Rechte, Zeiten, Gruppe, Besitzer und Gerätedateien. Entspricht -rlptgoD (ohne -A, -X, -U, -N, -H)."],
  verbose: ["Ausführlich", "Mehr Ausgaben. Jede Stufe liefert mehr Details (-v, -vv, -vvv …)."],
  "dry-run": ["Probelauf", "Zeigt, was übertragen würde, ohne etwas zu ändern. Am besten mit „Änderungen auflisten“ oder „Ausführlich“ kombinieren."],
  "human-readable": ["Lesbare Zahlen", "Zahlen in lesbarer Form ausgeben. Stufe 2 verwendet Potenzen von 1024."],
  compress: ["Komprimieren", "Dateidaten während der Übertragung komprimieren. Hilfreich bei langsamen Netzen, bei lokalen Kopien nur Mehraufwand."],
  delete: ["Überzählige Dateien löschen", "Dateien im Ziel löschen, die es in der Quelle nicht gibt (Spiegeln). Vorher immer einen Probelauf machen."],
  progress: ["Fortschritt pro Datei", "Fortschritt für jede einzelne Datei anzeigen. Den Gesamtfortschritt zeigt grysync automatisch."],
  partial: ["Teilübertragungen behalten", "Teilweise übertragene Dateien behalten, damit ein abgebrochener Lauf schneller fortgesetzt werden kann."],
  stats: ["Statistik", "Am Ende eine Zusammenfassung der Übertragung ausgeben."],
  "itemize-changes": ["Änderungen auflisten", "Für jede geänderte Datei eine Kurzbeschreibung der Änderung ausgeben (z. B. >f.st......). Stufe 2 listet auch unveränderte Dateien."],

  // Dateien & Ordner
  recursive: ["Rekursiv", "Verzeichnisse rekursiv kopieren."],
  dirs: ["Verzeichnisse ohne Rekursion", "Verzeichnisse selbst übertragen, aber nicht ihren Inhalt (außer der Name endet auf /. oder einen Schrägstrich)."],
  "old-dirs": ["Altes --dirs-Verhalten", "Wie --dirs, funktioniert aber mit älteren rsync-Versionen auf der Gegenseite (nutzt den --no-r-Trick)."],
  relative: ["Relative Pfadnamen", "Vollständige Pfadnamen übertragen; mit /./ in der Quelle legst du fest, wo der relative Teil beginnt."],
  "no-implied-dirs": ["Keine impliziten Verzeichnisse", "Mit --relative die übergeordneten Verzeichnisse nicht mit übertragen."],
  mkpath: ["Zielpfad anlegen", "Alle fehlenden Teile des Zielpfads anlegen."],
  "one-file-system": ["Im Dateisystem bleiben", "Beim Durchlaufen keine Dateisystemgrenzen überschreiten. Stufe 2 überspringt auch Einhängepunkte."],
  "prune-empty-dirs": ["Leere Verzeichnisse weglassen", "Ketten leerer Verzeichnisse aus der Dateiliste entfernen."],
  existing: ["Nur vorhandene Dateien aktualisieren", "Keine neuen Dateien im Ziel anlegen (Alias --ignore-non-existing)."],
  "ignore-existing": ["Vorhandene Dateien überspringen", "Dateien, die im Ziel schon existieren, nicht aktualisieren."],
  "remove-source-files": ["Quelldateien entfernen (verschieben)", "Dateien nach erfolgreicher Übertragung in der Quelle löschen. Verzeichnisse bleiben erhalten."],
  "max-size": ["Maximale Dateigröße", "Keine Dateien übertragen, die größer als SIZE sind (Suffixe K, M, G; +1/-1 für exakte Grenzen)."],
  "min-size": ["Minimale Dateigröße", "Keine Dateien übertragen, die kleiner als SIZE sind."],
  sparse: ["Sparse-Dateien", "Folgen von Nullbytes im Ziel als Lücken (Holes) anlegen."],
  preallocate: ["Vorab reservieren", "Speicherplatz für die Zieldatei vor dem Schreiben reservieren (weniger Fragmentierung)."],
  "copy-devices": ["Geräteinhalte kopieren", "Den Inhalt von Gerätedateien wie normale Dateien kopieren."],
  "write-devices": ["In Geräte schreiben", "Daten in vorhandene Gerätedateien im Ziel schreiben, statt sie zu ersetzen."],

  // Links
  links: ["Symlinks als Symlinks kopieren", "Symbolische Links im Ziel neu anlegen."],
  "copy-links": ["Symlinks folgen", "Symlinks durch die Dateien oder Verzeichnisse ersetzen, auf die sie zeigen."],
  "copy-unsafe-links": ["Unsicheren Symlinks folgen", "Nur Symlinks folgen, die aus dem übertragenen Baum hinauszeigen."],
  "safe-links": ["Unsichere Symlinks ignorieren", "Symlinks überspringen, die aus dem übertragenen Baum hinauszeigen."],
  "munge-links": ["Symlinks entschärfen", "Symlinks so speichern, dass sie nicht benutzbar sind (für nicht vertrauenswürdige Daten)."],
  "copy-dirlinks": ["Symlinks auf Verzeichnisse folgen", "Symlinks auf Verzeichnisse in echte Verzeichnisse umwandeln."],
  "keep-dirlinks": ["Verzeichnis-Symlinks im Ziel behalten", "Symlinks auf Verzeichnisse im Ziel wie echte Verzeichnisse behandeln."],
  "hard-links": ["Hardlinks erhalten", "Hart verlinkte Dateien erkennen und neu anlegen. Braucht bei großen Bäumen viel Speicher."],

  // Rechte & Metadaten
  perms: ["Rechte erhalten", "Zugriffsrechte im Ziel an die Quelle angleichen."],
  executability: ["Ausführbarkeit erhalten", "Nur das Ausführen-Bit übernehmen (wenn --perms aus ist)."],
  chmod: ["Rechte ändern", "chmod-artige Änderungen auf übertragene Dateien anwenden. D = Verzeichnisse, F = Dateien."],
  acls: ["ACLs erhalten", "Zugriffssteuerungslisten übernehmen (schließt --perms ein)."],
  xattrs: ["Erweiterte Attribute erhalten", "Erweiterte Attribute übernehmen. Stufe 2 kopiert als root auch System-Attribute."],
  owner: ["Besitzer erhalten", "Den Dateibesitzer übernehmen (erfordert Superuser-Rechte im Ziel)."],
  group: ["Gruppe erhalten", "Die Dateigruppe übernehmen."],
  devices: ["Gerätedateien erhalten", "Zeichen- und Blockgeräte neu anlegen (erfordert Superuser-Rechte)."],
  specials: ["Spezialdateien erhalten", "Named Sockets und FIFOs neu anlegen."],
  times: ["Änderungszeiten erhalten", "Änderungszeiten übernehmen. Ohne diese Option wird beim nächsten Lauf jede Datei erneut geprüft."],
  atimes: ["Zugriffszeiten erhalten", "Zugriffszeiten übernehmen."],
  "open-noatime": ["Zugriffszeiten nicht verändern", "Dateien mit O_NOATIME öffnen, damit das Lesen ihre Zugriffszeit nicht ändert."],
  crtimes: ["Erstellungszeiten erhalten", "Erstellungszeiten von Dateien übernehmen (sofern unterstützt)."],
  "omit-dir-times": ["Verzeichniszeiten auslassen", "Änderungszeiten von Verzeichnissen nicht übernehmen."],
  "omit-link-times": ["Symlink-Zeiten auslassen", "Änderungszeiten von Symlinks nicht übernehmen."],
  super: ["Empfänger als Superuser", "Superuser-Aktionen versuchen, auch ohne root zu sein."],
  "fake-super": ["Superuser simulieren", "Privilegierte Attribute in xattrs speichern, statt sie anzuwenden."],
  "numeric-ids": ["Numerische Benutzer-/Gruppen-IDs", "Numerische IDs übertragen, statt Benutzer- und Gruppennamen abzugleichen."],
  usermap: ["Benutzerzuordnung", "Benutzernamen oder -IDs im Ziel umsetzen (VON:NACH,…)."],
  groupmap: ["Gruppenzuordnung", "Gruppennamen oder -IDs im Ziel umsetzen (VON:NACH,…)."],
  chown: ["Besitzer ändern", "Besitzer und/oder Gruppe aller Dateien setzen (BENUTZER:GRUPPE)."],
  "copy-as": ["Kopieren als Benutzer", "Das Kopieren im Ziel als angegebener Benutzer ausführen (erfordert root)."],
  iconv: ["Zeichensatz der Dateinamen umwandeln", "Dateinamen zwischen Zeichensätzen umwandeln (LOKAL,ENTFERNT oder '.' für die Locale)."],

  // Vergleichen & überspringen
  checksum: ["Per Prüfsumme vergleichen", "Anhand von Prüfsummen statt Änderungszeit und Größe entscheiden, was aktualisiert wird. Langsam, aber gründlich."],
  update: ["Neuere Dateien im Ziel überspringen", "Dateien, die im Ziel neuer sind, nicht überschreiben."],
  "ignore-times": ["Zeiten ignorieren", "Dateien auch übertragen, wenn Größe und Zeit übereinstimmen."],
  "size-only": ["Nur Größe vergleichen", "Dateien mit gleicher Größe überspringen, Änderungszeiten werden ignoriert."],
  "modify-window": ["Zeittoleranz", "Änderungszeiten als gleich ansehen, wenn sie höchstens so viele Sekunden abweichen (1 für FAT)."],
  fuzzy: ["Ähnliche Basisdateien", "Fehlt die Zieldatei, eine ähnliche Datei als Grundlage suchen. Stufe 2 sucht auch in compare-dest-Verzeichnissen."],
  "checksum-choice": ["Prüfsummen-Algorithmus", "Den Prüfsummen-Algorithmus für die Übertragung und --checksum wählen."],
  "checksum-seed": ["Prüfsummen-Startwert", "Startwert für Block-/Dateiprüfsummen festlegen (für reproduzierbare Batch-Dateien)."],
  "ignore-missing-args": ["Fehlende Quellangaben ignorieren", "Nicht vorhandene Quellangaben stillschweigend überspringen."],
  "delete-missing-args": ["Fehlende Quellangaben löschen", "Das Gegenstück nicht vorhandener Quellangaben im Ziel löschen."],

  // Löschen
  "delete-before": ["Vor der Übertragung löschen", "Überzählige Dateien vor der Übertragung löschen (schließt --delete ein)."],
  "delete-during": ["Während der Übertragung löschen", "Überzählige Dateien schrittweise während der Übertragung löschen (Alias --del)."],
  "delete-delay": ["Danach löschen, währenddessen ermitteln", "Zu löschende Dateien während der Übertragung finden und danach löschen."],
  "delete-after": ["Nach der Übertragung löschen", "Überzählige Dateien nach der Übertragung löschen."],
  "delete-excluded": ["Ausgeschlossene Dateien löschen", "Auch Dateien im Ziel löschen, die durch Filterregeln ausgeschlossen sind."],
  "ignore-errors": ["Trotz E/A-Fehlern löschen", "Auch löschen, wenn beim Sender E/A-Fehler aufgetreten sind."],
  force: ["Löschen von Verzeichnissen erzwingen", "Ein nicht leeres Verzeichnis löschen, wenn es durch etwas anderes als ein Verzeichnis ersetzt wird."],
  "max-delete": ["Maximale Anzahl Löschungen", "Nicht mehr als so viele Dateien löschen (ein Sicherheitsnetz beim Spiegeln)."],

  // Sicherungen & Snapshots
  backup: ["Sicherungskopien anlegen", "Dateien, die ersetzt oder gelöscht würden, umbenennen statt sie zu verlieren."],
  "backup-dir": ["Sicherungsverzeichnis", "Sicherungskopien in diesem Verzeichnis ablegen (schließt --backup ein)."],
  suffix: ["Sicherungs-Endung", "Endung für Sicherungskopien (Standard ~ ohne --backup-dir)."],
  "link-dest": ["Hardlinks auf Verzeichnis", "Unveränderte Dateien als Hardlink auf dieses Verzeichnis anlegen – der klassische Weg für inkrementelle Snapshots. Bis zu 20 Verzeichnisse."],
  "compare-dest": ["Mit Verzeichnis vergleichen", "Dateien überspringen, die in diesem Verzeichnis identisch vorliegen."],
  "copy-dest": ["Aus Verzeichnis kopieren", "Wie compare-dest, kopiert unveränderte Dateien aber lokal aus diesem Verzeichnis."],

  // Übertragung
  "partial-dir": ["Verzeichnis für Teilübertragungen", "Teilweise übertragene Dateien in diesem Verzeichnis aufbewahren (schließt --partial ein)."],
  "delay-updates": ["Aktualisierungen verzögern", "Alle aktualisierten Dateien erst am Ende an ihren Platz bringen – für eine möglichst atomare Aktualisierung."],
  inplace: ["Dateien direkt aktualisieren", "Änderungen direkt in die Zieldateien schreiben. Schneller bei großen Dateien, aber ein Abbruch hinterlässt sie inkonsistent."],
  append: ["Daten anhängen", "Daten an kürzere Dateien anhängen, in der Annahme, dass der vorhandene Teil identisch ist."],
  "append-verify": ["Anhängen und prüfen", "Wie --append, prüft aber die ganze Datei mit einer Prüfsumme."],
  "whole-file": ["Ganze Dateien kopieren", "Den Delta-Algorithmus abschalten (Standard bei lokalen Kopien)."],
  "temp-dir": ["Temporäres Verzeichnis", "Temporäre Dateien im Ziel in diesem Verzeichnis anlegen."],
  fsync: ["fsync für jede Datei", "Jede geschriebene Datei auf den Datenträger schreiben lassen, bevor es weitergeht."],
  "block-size": ["Blockgröße", "Eine feste Blockgröße für den Delta-Algorithmus erzwingen."],

  // Tempo & Kompression
  "compress-choice": ["Kompressionsalgorithmus", "Den Kompressionsalgorithmus wählen. „Komprimieren“ zusätzlich einschalten."],
  "compress-level": ["Kompressionsstufe", "Kompressionsstufe. Der Bereich hängt vom Algorithmus ab (zstd: -131072…22)."],
  "skip-compress": ["Nicht komprimierte Endungen", "Durch Schrägstriche getrennte Liste von Dateiendungen, die nicht komprimiert werden."],
  bwlimit: ["Bandbreitenbegrenzung", "Die Bandbreite begrenzen (standardmäßig KiB/s; Suffixe erlaubt)."],
  "max-alloc": ["Speicherlimit pro Anforderung", "Das Limit für einzelne Speicheranforderungen ändern."],

  // Dateien filtern
  "cvs-exclude": ["CVS-artige Ausschlüsse", "Dateien so ignorieren, wie CVS es tut (.git gehört nicht dazu; dafür eine Regel anlegen)."],
  "exclude-from": ["Ausschlussmuster aus Datei", "Ausschlussmuster aus einer Datei lesen."],
  "include-from": ["Einschlussmuster aus Datei", "Einschlussmuster aus einer Datei lesen."],
  "files-from": ["Dateiliste aus Datei", "Genau die in dieser Datei aufgeführten Dateien übertragen (relativ zur Quelle)."],
  from0: ["NUL-getrennte Listen", "Dateien, die von *-from-Optionen gelesen werden, sind durch NUL-Zeichen getrennt."],
  "filter-merge-dir": [".rsync-filter pro Verzeichnis", "-F liest .rsync-filter-Dateien in jedem Verzeichnis; -FF schließt diese Dateien zusätzlich von der Übertragung aus."],

  // Remote & Netzwerk
  rsh: ["Remote-Shell", "Befehl für die Remote-Shell. Überschreibt die SSH-Einstellungen von Quelle und Ziel."],
  "rsync-path": ["rsync-Pfad auf der Gegenseite", "Programm, das auf der Gegenseite gestartet wird, z. B. ein eigener Pfad oder `sudo rsync`."],
  "remote-option": ["Option nur für die Gegenseite", "Eine Option nur an die Gegenseite senden."],
  "secluded-args": ["Abgeschirmte Argumente", "Dateinamen über das Protokoll statt über die Befehlszeile der Remote-Shell senden (früher --protect-args)."],
  "old-args": ["Alte Argumentaufteilung", "Das Verhalten vor 3.2.4 beim Aufteilen entfernter Argumente wiederherstellen."],
  "trust-sender": ["Dem Sender vertrauen", "Zusätzliche Sicherheitsprüfungen der vom Sender empfangenen Dateiliste abschalten."],
  timeout: ["E/A-Zeitlimit", "Abbrechen, wenn so viele Sekunden lang keine Daten übertragen werden."],
  contimeout: ["Verbindungs-Zeitlimit", "Zeitlimit für den Verbindungsaufbau zu einem rsync-Daemon."],
  address: ["Bind-Adresse", "Ausgehende Sockets an diese Adresse binden."],
  port: ["Daemon-Port", "Einen anderen Port für den rsync-Daemon verwenden."],
  sockopts: ["Socket-Optionen", "Eigene TCP-Socket-Optionen."],
  "blocking-io": ["Blockierende E/A", "Blockierende E/A für die Remote-Shell verwenden."],
  "password-file": ["Daemon-Passwortdatei", "Das Daemon-Passwort aus einer Datei lesen."],
  "early-input": ["Early-Input-Datei", "Bis zu 5K Daten an das early-exec-Skript des Daemons senden."],
  "no-motd": ["Daemon-Begrüßung unterdrücken", "Die Begrüßungsnachricht (MOTD) des Daemons nicht anzeigen."],
  ipv4: ["IPv4 bevorzugen", "IPv4 verwenden."],
  ipv6: ["IPv6 bevorzugen", "IPv6 verwenden."],

  // Ausgabe & Protokoll
  quiet: ["Still", "Meldungen außer Fehlern unterdrücken."],
  info: ["Info-Flags", `Fein abgestufte Informationsausgabe: ${infoFlags}.`],
  debug: ["Debug-Flags", `Fein abgestufte Debug-Ausgabe: ${debugFlags}.`],
  stderr: ["stderr-Modus", "Wohin rsync Fehler schreibt: e = nur Fehler, a = alle Meldungen, c = der Client entscheidet."],
  "out-format": ["Ausgabeformat", "Format der Ausgabezeilen pro Datei (siehe „log format“ in rsyncd.conf)."],
  "log-file": ["Logdatei", "Protokollieren, was rsync tut."],
  "log-file-format": ["Logdatei-Format", "Format der Zeilen in der Logdatei."],
  "8-bit-output": ["8-Bit-Ausgabe", "Zeichen mit gesetztem höchstem Bit in der Ausgabe nicht maskieren."],
  "list-only": ["Nur auflisten", "Die Quelldateien auflisten, statt sie zu kopieren."],
  outbuf: ["Ausgabepufferung", "Ausgabepufferung: keine, zeilenweise oder blockweise."],

  // Erweitert
  "stop-after": ["Stoppen nach", "Das Kopieren nach so vielen Minuten beenden (Alias --time-limit)."],
  "stop-at": ["Stoppen um", "Das Kopieren zu diesem Zeitpunkt beenden (J-M-TTh:m)."],
  "write-batch": ["Batch-Datei schreiben", "Die Übertragung als Batch-Datei zum späteren Abspielen aufzeichnen."],
  "only-write-batch": ["Nur Batch-Datei schreiben", "Wie --write-batch, aber ohne das Ziel zu verändern."],
  "read-batch": ["Batch-Datei lesen", "Eine zuvor mit --write-batch geschriebene Batch-Datei anwenden."],
  protocol: ["Protokollversion erzwingen", "Eine ältere Protokollversion erzwingen (für alte rsync-Versionen)."],
  "no-inc-recursive": ["Inkrementelle Rekursion abschalten", "Zuerst die komplette Dateiliste aufbauen. Ergibt exakte Summen in der Fortschrittsanzeige, startet aber langsamer."],
};

/** Deutsche Bezeichnungen für Auswahlwerte, falls sie sich vom Wert unterscheiden. */
export const choicesDe: Record<string, Record<string, string>> = {
  stderr: { errors: "nur Fehler", all: "alle", client: "Client" },
  outbuf: { N: "keine", L: "Zeile", B: "Block" },
};

/** Deutsche Platzhalter: „e.g.“ und Einheiten übersetzen. */
export function placeholderDe(placeholder: string): string {
  return placeholder
    .replace(/^e\.g\. /, "z. B. ")
    .replace(/^seconds$/, "Sekunden")
    .replace(/^minutes$/, "Minuten")
    .replace(/^number$/, "Zahl")
    .replace(/^optional$/, "optional");
}
