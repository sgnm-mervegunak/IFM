import { CustomAssetError } from './custom.error.enum';

export function has_children_error(params) {
  return {
    message: 'This node has children, you can not delete it..',
    code: CustomAssetError.HAS_CHILDREN,
    params: params,
  };
}

export function wrong_parent_error() {
  return {
    message: 'This node cannot be added below the specified node',
    code: CustomAssetError.WRONG_PARENT,
  };
}

export function node_not_found() {
  return {
    message: 'Node not found',
    code: CustomAssetError.NODE_NOT_FOUND,
  };
}

export function other_microservice_errors(message) {
  return {
    message,
    code: CustomAssetError.OTHER_MICROSERVICE_ERROR,
  };
}
