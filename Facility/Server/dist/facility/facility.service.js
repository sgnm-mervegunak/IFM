"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.FacilityService = void 0;
const common_1 = require("@nestjs/common");
const fs_1 = require("fs");
const repository_enum_1 = require("../common/const/repository.enum");
const objectId_check_1 = require("../common/func/objectId.check");
let FacilityService = class FacilityService {
    constructor(facilityRepository) {
        this.facilityRepository = facilityRepository;
    }
    findAll(query) {
        return this.facilityRepository.findAll(query);
    }
    async findOne(id) {
        return this.facilityRepository.findOneById(id);
    }
    create(createFacilityDto) {
        return this.facilityRepository.create(createFacilityDto);
    }
    async update(id, updateFacilityDto) {
        (0, objectId_check_1.checkObjectIddİsValid)(id);
        return this.facilityRepository.update(id, updateFacilityDto);
    }
    async remove(id) {
        const facility = await this.findOne(id);
        return facility.remove();
    }
    async createAll(file) {
        const fs = require('fs');
        const csv = require('csv-parser');
        try {
            fs;
            (0, fs_1.createReadStream)(file.path)
                .pipe(csv())
                .on('data', (data) => {
                let adrarray = [];
                let addressarray = [];
                addressarray = data.adress.split(";");
                let j = 1;
                let o = {};
                let a = [];
                for (let i = 0; i < addressarray.length; i++) {
                    if (j < 5) {
                        a.push(addressarray[i]);
                        j = j + 1;
                    }
                    else {
                        o = { "title": a[0], "country": a[1], "city": a[2], "adress": a[3] };
                        adrarray.push(o);
                        o = {};
                        a = [];
                        a.push(addressarray[i]);
                        j = 2;
                    }
                }
                if (a.length == 4) {
                    o = { "title": a[0], "country": a[1], "city": a[2], "adress": a[3] };
                    adrarray.push(o);
                }
                else if (a.length == 3) {
                    o = { "title": a[0], "country": a[1], "city": a[2] };
                    adrarray.push(o);
                }
                else if (a.length == 2) {
                    o = { "title": a[0], "country": a[1] };
                    adrarray.push(o);
                }
                else if (a.length == 1) {
                    o = { "title": a[0] };
                    adrarray.push(o);
                }
                const dto = {
                    facility_name: data.facility_name,
                    locations: data.locations,
                    brand_name: data.brand_name,
                    type_of_facility: data.type_of_facility,
                    classifications: {},
                    label: data.label.split(";"),
                    updatedAt: new Date(),
                    address: adrarray,
                };
                this.facilityRepository.create(dto);
            });
            return 'success';
        }
        catch (_a) {
            return 'failed';
        }
    }
};
FacilityService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, common_1.Inject)(repository_enum_1.RepositoryEnums.FACILITY)),
    __metadata("design:paramtypes", [Object])
], FacilityService);
exports.FacilityService = FacilityService;
//# sourceMappingURL=facility.service.js.map