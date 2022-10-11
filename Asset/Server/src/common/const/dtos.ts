import { AscendingEnum } from "./pagination.enum";

export type queryObjectType = {
  skip: number;
  limit: number;
  orderBy: AscendingEnum;
  orderByColumn?: string;
}
