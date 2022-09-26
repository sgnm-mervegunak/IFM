import { SpaceType } from '../const/space.type.enum';
import { virtualProps, updateKafkaTopicArray, createKafkaTopicArray } from '../const/virtual.node.properties';

export async function avaiableUpdateVirtualPropsGetter(dto) {
  console.log(dto);
  const existVİrtualNodePropsInDtoArray = Object.keys(dto).filter((key) => {
    if (virtualProps.includes(key)) {
      return key;
    }
  });

  const finalObject = [];
  for (let i = 0; i < updateKafkaTopicArray.length; i++) {
    const arr = Object.entries(updateKafkaTopicArray[i])
      .map((prop) => {
        if (!Array.isArray(prop[1]) && existVİrtualNodePropsInDtoArray.includes(prop[1])) {
          console.log(prop);
          if (prop[1] === 'space') {
            switch (dto.spaceType) {
              case SpaceType.SPACE:
                updateKafkaTopicArray[i]['url'] = 'STRUCTURE_URL';

                break;
              case SpaceType.JOINTSPACE:
                updateKafkaTopicArray[i]['url'] = 'JOINTSPACE_URL';

                break;

              default:
                break;
            }
          }
          updateKafkaTopicArray[i]['newParentKey'] = dto[prop[1]];

          return updateKafkaTopicArray[i];
        }
      })
      .filter((valid) => {
        if (valid !== undefined) {
          return valid;
        }
      });
    if (arr.length > 0) {
      finalObject.push(arr[0]);
    }
  }

  return finalObject;
}

export function avaiableCreateVirtualPropsGetter(dto) {
  const existVİrtualNodePropsInDtoArray = Object.keys(dto).filter((key) => {
    if (virtualProps.includes(key)) {
      return key;
    }
  });

  const finalObject = [];
  for (let i = 0; i < createKafkaTopicArray.length; i++) {
    const arr = Object.entries(createKafkaTopicArray[i])
      .map((prop) => {
        if (!Array.isArray(prop[1]) && existVİrtualNodePropsInDtoArray.includes(prop[1])) {
          if (prop[1] === 'space') {
            switch (dto.spaceType) {
              case SpaceType.SPACE:
                createKafkaTopicArray[i]['url'] = 'STRUCTURE_URL';

                break;
              case SpaceType.JOINTSPACE:
                createKafkaTopicArray[i]['url'] = 'JOINTSPACE_URL';

                break;

              default:
                break;
            }
          }
          createKafkaTopicArray[i]['referenceKey'] = dto[prop[1]];
          return createKafkaTopicArray[i];
        }
      })
      .filter((valid) => {
        if (valid !== undefined) {
          return valid;
        }
      });
    if (arr.length > 0) {
      finalObject.push(arr[0]);
    }
  }

  return finalObject;
}
