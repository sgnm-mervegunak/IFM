export interface LazyLoadingInterface {
  loadByKey(key: string, leafType: string, header): any;
  loadByLabel(label: string, header): any;
  loadClassification(label: string, header): any;
  getClassificationRootAndChildrenByLanguageAndRealm(realm: string, language: string): any;
  loadClassificationWithPath(path: string[], realm: string, language: string): any;
  loadClassificationByIsActive(label: string, header, isActive: boolean): any;
  getClassificationRootAndChildrenByLanguageAndRealmAndIsActive(
    realm: string,
    language: string,
    isActive: boolean,
  ): any;
  loadClassificationWithPathByIsActive(path: string[], realm: string, language: string, isActive: boolean): any;
}
