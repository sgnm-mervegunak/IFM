export interface SystemComponentInterface<T> {
  create(data: T | any, header): any;
}
