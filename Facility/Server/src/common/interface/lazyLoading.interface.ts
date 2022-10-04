export interface LazyLoadingInterface {
  loadByKey(
    key: string,
    leafType: string,
    rootFilters: object,
    childerenFilters: object,
    childrensChildFilter: object,
    header,
  ): any;
  loadByLabel(label: string, rootFilters: object, childerenFilters: object, childrensChildFilter: object, header): any;
  loadByPath(
    path: string[],
    label: string,
    rootFilters: object,
    childerenFilters: object,
    childrensChildFilter: object,
  );
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
