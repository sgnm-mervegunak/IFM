/**
 * Crud Interface for Endpoints
 */
export interface InfraInterface {
  /**
   * Create method  for Repository
   */
  create();

  /**
   * FindOneById method for Repository
   */
  createConstraints();

  importClassificationFromExcel(file: Express.Multer.File, language: string);
}
