import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { FacilityStructureNotFountException } from '../../common/notFoundExceptions/not.found.exception';
import { Neo4jService, assignDtoPropToEntity, createDynamicCyperObject, node_not_found } from 'sgnm-neo4j/dist';
import { RelationName } from 'src/common/const/relation.name.enum';
import { CreateJointSpaceDto } from '../dto/create.jointspace.dto';
import { JointSpace } from '../entities/jointspace.entity';
import * as moment from 'moment';
import { JointSpaceAndZoneInterface } from 'src/common/interface/joint.space.zone.interface';

@Injectable()
export class JointSpaceRepository implements JointSpaceAndZoneInterface<any> {
  constructor(private readonly neo4jService: Neo4jService) {}
  async findOneByRealm(key: string, realm: string) {
    const buildingNode = await this.neo4jService.findChildrensByLabelsOneLevel(
      ['FacilityStructure'],
      { isDeleted: false, realm },
      [],
      { isDeleted: false, isActive: true, key },
    );

    if (!buildingNode.length) {
      throw new FacilityStructureNotFountException(realm);
    }
    let tree = await this.neo4jService.findByLabelAndFiltersWithTreeStructure(
      ['Building'],
      { key, isDeleted: false },
      [],
      {
        isDeleted: false,
      },
    );

    if (!Object.keys(tree.root).length) {
      throw new FacilityStructureNotFountException(realm);
    }
    tree = await this.neo4jService.changeObjectChildOfPropToChildren(tree);

    tree.root.children = tree.root.children.filter(
      (item: any) =>
        item._type === 'JointSpaces' || item._type === 'Floor' || item._type === 'Block' || item._type === 'Space',
    );

    return tree;
  }

  async create(createJointSpaceDto: CreateJointSpaceDto) {
    try {
      const { nodeKeys } = createJointSpaceDto;

      const spaceNodes = [];
      const jointSpaceNodes = [];
      const parentNodes = [];

      //get all nodes by key and their parent building node
      await Promise.all(
        nodeKeys.map(async (key) => {
          const node = await this.neo4jService.findByOrLabelsAndFilters(['Space', 'JointSpace'], {
            isDeleted: false,
            key,
            isActive: true,
          });
          if (!node.length) {
            throw new HttpException(node_not_found, HttpStatus.NOT_FOUND);
          }
          //checkt type and has active merged relationship
          if (node[0].get('n').labels[0] === 'Space') {
            if (node[0].get('n').properties.isBlocked === true) {
              throw new HttpException('Node is already in joint space', HttpStatus.BAD_REQUEST);
            } else {
              spaceNodes.push(node[0].get('n'));
            }
          }
          //check type and has active merged relationship and updateJointSpace property
          if (node[0].get('n').labels[0] === 'JointSpace') {
            jointSpaceNodes.push(node[0].get('n'));

            const mergedNodes = await this.neo4jService.findChildrenNodesByLabelsAndRelationName(
              ['JointSpace'],
              { key },
              ['Space'],
              { isActive: true, isDeleted: false },
              'MERGEDJS',
            );
            mergedNodes.map((mergedNode) => {
              spaceNodes.push(mergedNode.get('children'));
            });
          }

          const parentStructure = await this.neo4jService.findChildrenNodesByLabelsAndRelationName(
            ['Building'],
            { isDeleted: false },
            [],
            { key: key },
            'PARENT_OF',
          );
          parentNodes.push(parentStructure[0].get('parent'));
        }),
      );
      //check every node's building parent is same
      parentNodes.map((element) => {
        if (parentNodes[0].properties.Name !== element.properties.Name) {
          throw new HttpException('Building must be same', HttpStatus.BAD_REQUEST);
        }
      });

      await Promise.all(
        jointSpaceNodes.map(async (element) => {
          await this.neo4jService.updateByIdAndFilter(element.identity.low, {
            isActive: false,
            isDeleted: true,
            jointEndDate: moment().format('YYYY-MM-DD HH:mm:ss'),
          });
        }),
      );

      const jointSpacesNode = await this.neo4jService.findChildrensByLabelsOneLevel(
        ['Building'],
        { key: parentNodes[0].properties.key, isDeleted: false },
        ['JointSpaces'],
        { isActive: true, isDeleted: false },
      );
      let jointSpaceTitle = '';

      spaceNodes.forEach((element, index) => {
        if (index + 1 === spaceNodes.length) {
          jointSpaceTitle = jointSpaceTitle + element.name;
        } else {
          jointSpaceTitle = jointSpaceTitle + element.name + ',';
        }
      });
      createJointSpaceDto['jointSpaceTitle'] = jointSpaceTitle;

      //create new JointSpace node and add relations to relating JointSpaces node and space nodes
      const jointSpaceEntity = new JointSpace();
      const jointSpaceObject = assignDtoPropToEntity(jointSpaceEntity, createJointSpaceDto);
      delete jointSpaceObject['nodeKeys'];
      const jointSpace = await this.neo4jService.createNode(jointSpaceObject, ['JointSpace']);
      await this.neo4jService.addRelations(jointSpace.identity.low, jointSpacesNode[0].get('children').identity.low);
      spaceNodes.map(async (element) => {
        console.log(element);
        await this.neo4jService.updateByIdAndFilter(element.identity.low, { isDeleted: false }, [], {
          isBlocked: true,
        });
        await this.neo4jService.addRelationWithRelationName(
          element.identity.low,
          jointSpace.identity.low,
          RelationName.MERGEDJS,
        );
      });

      return jointSpace.properties;
    } catch (error) {
      if (error.response?.code) {
        throw new HttpException({ message: error.response?.message, code: error.response?.code }, HttpStatus.NOT_FOUND);
      } else {
        throw new HttpException(error, HttpStatus.INTERNAL_SERVER_ERROR);
      }
    }
  }

  async update(_id: string, updateFacilityStructureDto) {
    const updateFacilityStructureDtoWithoutLabelsAndParentId = {};
    Object.keys(updateFacilityStructureDto).forEach((element) => {
      if (element != 'labels' && element != 'parentId') {
        updateFacilityStructureDtoWithoutLabelsAndParentId[element] = updateFacilityStructureDto[element];
      }
    });
    const dynamicObject = createDynamicCyperObject(updateFacilityStructureDtoWithoutLabelsAndParentId);
    const updatedNode = await this.neo4jService.updateById(_id, dynamicObject);
    if (!updatedNode) {
      throw new FacilityStructureNotFountException(_id);
    }
    const result = {
      id: updatedNode['identity'].low,
      labels: updatedNode['labels'],
      properties: updatedNode['properties'],
    };
    if (updateFacilityStructureDto['labels'] && updateFacilityStructureDto['labels'].length > 0) {
      await this.neo4jService.removeLabel(_id, result['labels']);
      await this.neo4jService.updateLabel(_id, updateFacilityStructureDto['labels']);
    }
    return result;
  }

  async delete(key: string) {
    const node = await this.neo4jService.findByLabelAndFilters(['JointSpace'], {
      isDeleted: false,
      key,
      isActive: true,
    });
    if (!node.length) {
      throw new HttpException('Node not found', HttpStatus.NOT_FOUND);
    }

    const mergedNodes = await this.neo4jService.findChildrenNodesByLabelsAndRelationName(
      ['Space'],
      { isActive: true, isDeleted: false },
      ['JointSpace'],
      { key, isDeleted: false },
      'MERGEDJS',
    );

    mergedNodes.map(async (mergedNode) => {
      console.log(mergedNode);
      await this.neo4jService.updateByIdAndFilter(mergedNode.get('parent').identity.low, {}, [], { isBlocked: false });
    });

    //check type and has active merged relationship and updateJointSpace property

    const deletedNode = await this.neo4jService.updateById(node[0].get('n').identity.low, {
      isActive: false,
      isDeleted: true,
      jointEndDate: moment().format('YYYY-MM-DD HH:mm:ss'),
    });

    return deletedNode.properties;
  }

  async findOneNodeByKey(key: string) {
    const node = await this.neo4jService.findByLabelAndFilters([], { key }, ['Virtual']);
    if (!node.length) {
      throw new FacilityStructureNotFountException(key);
    }
    return node;
  }

  async findOneFirstLevelByRealm(label: string, realm: string) {
    let node = await this.neo4jService.findByRealmWithTreeStructureOneLevel(label, realm);
    if (!node) {
      throw new FacilityStructureNotFountException(realm);
    }
    node = await this.neo4jService.changeObjectChildOfPropToChildren(node);

    return node['root']['children'];
  }
}
