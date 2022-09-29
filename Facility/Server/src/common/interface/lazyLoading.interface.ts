export interface LazyLoadingInterface {
  loadByKey(key: string, leafType: string, header): any;
  loadByLabel(key: string, header): any;
}
