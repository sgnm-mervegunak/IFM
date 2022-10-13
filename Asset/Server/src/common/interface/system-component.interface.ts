export interface SystemComponentInterface<T> {
  create(data: T | any, header): any;
  delete(_parent_id: string, _children_ids: string[], header): any;
}
