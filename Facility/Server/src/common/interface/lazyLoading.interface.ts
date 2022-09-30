export interface LazyLoadingInterface {
  loadByKey(key: string, leafType: string, header): any;
  loadByLabel(label: string, header): any;
}
