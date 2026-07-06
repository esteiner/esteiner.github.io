

Beim Umbuchen einer einzelnen Flasche wir ein Request mit der Methode `PATCH` und dem folgenden Payload an den Pod Server geschickt:

```
DELETE DATA { <#1781d231-8199-4059-b8b9-988acb991425> <https://schema.org/cellar> <https://sonjaedwin.datapod.igrant.io/private/kellermeister/cellars/cellarWork#it> .
<#1781d231-8199-4059-b8b9-988acb991425-metadata> <https://vocab.noeldemartin.com/crdt/updatedAt> "2026-04-21T11:24:05.435Z"^^<http://www.w3.org/2001/XMLSchema#dateTime> . } ; 
INSERT DATA { <#1781d231-8199-4059-b8b9-988acb991425> <https://schema.org/cellar> <https://sonjaedwin.datapod.igrant.io/private/kellermeister/cellars/621d36b3-0483-4d7d-ac3c-d5173a47e8e5#it> .
<#1781d231-8199-4059-b8b9-988acb991425-metadata> <https://vocab.noeldemartin.com/crdt/updatedAt> "2026-04-21T20:12:19.893Z"^^<http://www.w3.org/2001/XMLSchema#dateTime> . }
```

Der Payload besteht also aus 2 Operationen: dem Löschen des Werts und dem neuen Setzen des Werts für das `cellar` Property (und den `updatedAt` Metadaten) einer Flasche.