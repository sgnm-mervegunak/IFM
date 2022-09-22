import { CustomTreeError } from './custom.error.enum';

export function has_children_error(params) {
  return {
    message: 'This node has children, you can not delete it..',
    code: CustomTreeError.HAS_CHILDREN,
    params: params,
  };
}

export function wrong_parent_error(params) {
  return {
    message: 'This node cannot be added below the specified node',
    code: CustomTreeError.WRONG_PARENT,
    params: params,
  };
}

export function node_not_found(params) {
  return {
    message: 'Node not found',
    code: CustomTreeError.NODE_NOT_FOUND,
    params: params,
  };
}

export function null_value(params) {
  return {
    message: 'Value can not be null',
    code: CustomTreeError.NULL_VALUE,
    params: params,
  };
}

export function not_unique(params) {
  return {
    message: 'Uniqueness error',
    code: CustomTreeError.NOT_UNIQUE,
    params: params,
  };
}

export function has_not_reference_key() {
  return {
    message: 'not have reference key',
    code: CustomTreeError.HAS_NOT_REFERENCE_KEY,
  };
}
