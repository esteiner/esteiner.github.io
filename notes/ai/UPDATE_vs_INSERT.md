Update vs Insert
===

### Prompt

`When the cellar key for a bottle (SoukaiBottle) is updated the resulting sparql-update request doesn't contain a 'DELETE DATA' command resulting in two entries for the cellar of the changed bottle. Why is this? `

### Response

```
● Root cause: the bottle's url is set to a fragment-only string in setId()

  In SoukaiBottlesStorageRepository.ts:196-205, deserialisation does:

  private setId(soukaiModel: SolidModel, entry: any): void {
      const relativeId: string = this.relativeId(entry["@id"]);
      soukaiModel["@id"] = relativeId;
      soukaiModel.url = relativeId;           // e.g. "#bottle-abc"
  }
  private relativeId(absoluteId: string): string {
      return absoluteId.substring(this.bottlesDocumentUrl.length, absoluteId.length);
  }

  So after loading, each SoukaiBottle.url is a fragment like #bottle-abc, not the absolute IRI https://.../bottles#bottle-abc that the file actually contains.

  Why this kills the DELETE
  
  The DELETE clause in soukai-solid's PATCH is produced in SolidClient.processUpdatePropertyOperations (node_modules/soukai-solid/src/solid/SolidClient.ts:614-628):

  // Properties that are going to be updated have to be deleted or they'll end up duplicated.
  const updateOperations = operations.filter(
      (operation) =>
          operation.type === OperationTypes.UpdateProperty &&
          operation.propertyType !== RDFResourcePropertyType.Type &&
          document.hasProperty(operation.propertyResourceUrl as string, operation.propertyName),
  ) as UpdatePropertyOperation[];

  for (const operation of updateOperations) {
      ...
      operations.push(new RemovePropertyOperation(operation.propertyResourceUrl, operation.propertyName));
  }

  Only when document.hasProperty(propertyResourceUrl, propertyName) is true does a synthetic RemovePropertyOperation get added, which later becomes the DELETE DATA clause in updateNonContainerDocumentWithSparql (SolidClient.ts:393-427).

  The flow for setCellar is:
  
  1. setCellar sets cellarUrl → bottle is dirty.
  2. SolidModel.getDirtyEngineDocumentUpdates (models/SolidModel.ts:1601+) emits $updateItems: { $where: { '@id': bottle.url }, $update: { cellarUrl: <new> } }. bottle.url is "#bottle-abc".
  3. SolidEngine.extractJsonLDGraphItemsUpdate (engines/SolidEngine.ts:390-414) builds UpdatePropertyOperation with propertyResourceUrl = "#bottle-abc".
  4. In processUpdatePropertyOperations, document.hasProperty("#bottle-abc", "https://schema.org/cellar") returns false, because RDFDocument.resourcesIndex is keyed by absolute subject IRIs (RDFDocument.ts:101-114, 136-137).
  5. No RemovePropertyOperation is queued → no DELETE DATA.

  The INSERT part still works because RDFResourceProperty.toTurtle(...) is called with the document URL as base, so the relative #bottle-abc resolves to the absolute IRI on serialisation — a brand-new triple gets inserted while the old one stays untouched. Hence the duplicate schema:cellar entries.

  Why you may not notice it for other fields
  
  The same bug applies to every scalar field on bottles (e.g. rating). It only manifests when an existing value is being replaced:

  - addBottles (KellermeisterService.ts:267) sets cellarUrl on a freshly-created bottle that has no prior schema:cellar triple → INSERT only is correct.
  - disposeBottleToAltglass2 and transferBottles (KellermeisterService.ts:281, 297) mutate a loaded bottle that already has a schema:cellar triple → duplicate.

  Fix

  Stop fragment-stripping in setId. Set soukaiModel.url to the absolute IRI (entry["@id"]) — that's what Soukai-Solid's own deserialization does and what the document's resourcesIndex uses for lookup. If you want the IDs displayed as relative elsewhere, do that conversion at the view layer, not on the model.

  A minimal change in SoukaiBottlesStorageRepository.ts:196-201:
  
  private setId(soukaiModel: SolidModel, entry: any): void {
      soukaiModel["@id"] = entry["@id"];
      soukaiModel.url   = entry["@id"];
  }
  
  (and remove relativeId if it becomes unused). Worth verifying the belongsToMany bottleUrls and the productUrl reference still resolve correctly after the change — they should, since they were already storing absolute URLs in the file.

✻ Baked for 4m 45s

❯ apply the fix to setId                                                                                                                                                                                                                                                                                                  

● Update(src/infrastructure/soukai/SoukaiBottlesStorageRepository.ts)
  ⎿  Added 2 lines, removed 7 lines
      194      }
      195  
      196      private setId(soukaiModel: SolidModel, entry: any): void {
      197 -        const relativeId: string = this.relativeId(entry["@id"]);                                                                                                                                                                                                                                       
      197          // @ts-ignore
❯ apply the fix to setId                                                                                                                                                                                                                                                                                                  

● Update(src/infrastructure/soukai/SoukaiBottlesStorageRepository.ts)
  ⎿  Added 2 lines, removed 7 lines
      194      }
      195  
      196      private setId(soukaiModel: SolidModel, entry: any): void {
      197 -        const relativeId: string = this.relativeId(entry["@id"]);                                                                                                                                                                                                                                       
      197          // @ts-ignore
      199 -        soukaiModel["@id"] = relativeId;                                                                                                                                                                                                                                                                
      200 -        soukaiModel.url = relativeId;                                                                                                                                                                                                                                                                   
      198 +        soukaiModel["@id"] = entry["@id"];                                                                                                                                                                                                                                                              
      199 +        soukaiModel.url = entry["@id"];                                                                                                                                                                                                                                                                 
      200      }
      201  
      203 -    private relativeId(absoluteId: string): string {                                                                                                                                                                                                                                                    
      204 -        return absoluteId.substring(this.bottlesDocumentUrl.length, absoluteId.length);                                                                                                                                                                                                                 
      205 -    }                                                                                                                                                                                                                                                                                                   
      206 -                                                                                                                                                                                                                                                                                                        
      202      private hasType(entry: any, typeUri: string): boolean {
      203          //console.log("hasType: ", entry["@type"]);
      204          return (

● Now let me verify nothing else relies on the relative form.

  Searched for 2 patterns (ctrl+o to expand)

● Done. setId now keeps the absolute IRI on the model, and the unused relativeId helper is gone. bottlesDocumentUrl stays because deserializeSellerInto (line 111) still passes it as the base URL when calling newFromJsonLD.

  Worth a quick smoke test of the transfer/dispose flows to confirm the PATCH now contains a DELETE DATA for the prior schema:cellar triple.

```