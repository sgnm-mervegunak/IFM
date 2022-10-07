export interface LazyLoadingInterface {
  loadByKey(
    key: string,
    leafType: string,
    rootFilters: object,
    childerenFilters: object,
    childrensChildFilter: object,
    excluted_labels_for_children: string[],
    header,
  ): any;
  loadByLabel(
    label: string,
    leafType: string,
    rootFilters: object,
    childerenFilters: object,
    childrensChildFilter: object,
    excluted_labels_for_children: string[],
    header,
  ): any;
  loadByPath(
    path: string[],
    label: string,
    leafType: string,
    rootFilters: object,
    childerenFilters: object,
    childrensChildFilter: object,
    excluded_labels_for_parent: string[],
    excluded_labels_for_children: string[],
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
