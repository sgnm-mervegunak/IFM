"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AppModule = void 0;
const common_1 = require("@nestjs/common");
const mongoose_1 = require("@nestjs/mongoose");
const facility_module_1 = require("./facility/facility.module");
const config_1 = require("@nestjs/config");
const keyclock_module_1 = require("./facility/keyclock.module");
const classification_module_1 = require("./classification/classification.module");
const connection_enum_1 = require("./common/const/connection.enum");
const apploggermiddleware_1 = require("./common/interceptors/apploggermiddleware");
const nestjs_i18n_1 = require("nestjs-i18n");
const path = require("path");
const core_1 = require("@nestjs/core");
const exception_filter_1 = require("./common/exceptionFilters/exception.filter");
const messagebroker_module_1 = require("./messagebroker/messagebroker.module");
const Joi = require("joi");
let AppModule = class AppModule {
    configure(consumer) {
        consumer.apply(apploggermiddleware_1.AppLoggerMiddleware).forRoutes("*");
    }
};
AppModule = __decorate([
    (0, common_1.Module)({
        imports: [
            facility_module_1.FacilityModule,
            keyclock_module_1.KeycloakModule,
            nestjs_i18n_1.I18nModule.forRoot({
                fallbackLanguage: "tr",
                fallbacks: {
                    en: "en",
                    tr: "tr",
                },
                parser: nestjs_i18n_1.I18nJsonParser,
                parserOptions: {
                    path: path.join(__dirname, "/i18n/"),
                },
            }),
            mongoose_1.MongooseModule.forRootAsync({
                connectionName: connection_enum_1.ConnectionEnums.FACILITY,
                useFactory: (config) => ({
                    uri: config.get("DATABASE_LINK"),
                    dbName: config.get("FACILITY_DB_NAME"),
                    user: config.get("DB_USER"),
                    pass: config.get("DB_PASS"),
                }),
                inject: [config_1.ConfigService],
            }),
            mongoose_1.MongooseModule.forRootAsync({
                connectionName: connection_enum_1.ConnectionEnums.CLASSIFICATION,
                useFactory: (config) => ({
                    uri: config.get("DATABASE_LINK"),
                    dbName: config.get("CLASSIFICATION_DB_NAME"),
                    user: config.get("DB_USER"),
                    pass: config.get("DB_PASS"),
                }),
                inject: [config_1.ConfigService],
            }),
            config_1.ConfigModule.forRoot({
                isGlobal: true,
                validationSchema: Joi.object({
                    DATABASE_LINK: Joi.string().required(),
                }),
            }),
            classification_module_1.ClassificationModule,
            messagebroker_module_1.MessagebrokerModule,
        ],
        providers: [
            {
                provide: core_1.APP_FILTER,
                useClass: exception_filter_1.HttpExceptionFilter,
            },
        ],
    })
], AppModule);
exports.AppModule = AppModule;
//# sourceMappingURL=app.module.js.map