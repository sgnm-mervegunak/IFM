import { AscendingEnum } from 'sgnm-neo4j/dist/constant/pagination.enum';

export const fieldSorter = (fields, orderBy: AscendingEnum) => (a, b) =>
  fields
    .map((o) => {
      let dir = 1;
      if (orderBy === AscendingEnum.DESCANDING) {
        dir = -1;
      }
      return a[o] > b[o] ? dir : a[o] < b[o] ? -dir : 0;
    })
    .reduce((p, n) => (p ? p : n), 0);
