import { LazyLoadingPathDto } from '../dto/lazy.loading.path.dto';
import { LazyLoadingPathByKeyDto } from '../dto/lazy.loading.path.key.dto ';

export interface SystemLazyLoadingInterface {
  getPath(lazyLoadingPathDto: LazyLoadingPathDto, header): any;
  findRootByRealm(header): any;
  findChildrensByKey(key: string, leafType: string, header);
  getPathByKey(lazyLoadingPathByKeyDto: LazyLoadingPathByKeyDto, header);
  findChildrensByKeyAndFilterIt(key: string, leafType: string, header, filterKey: string);
}
