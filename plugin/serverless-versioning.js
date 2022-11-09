const {mappingTemplate} = require("../src/mapping-template");
const statusCodeList = require("./statusCode");
const semver = require('semver');

class ServerlessVersioning {
    constructor(serverless, options) {
        this.serverless = serverless

        this.provider = this.serverless.getProvider('aws')
        this.pathMap = {};
        this.explicitVersion = null;

        serverless.configSchemaHandler.defineCustomProperties({
            type: 'object',
            properties: {
                version: {type: 'string'},
            },
            required: ['version'],
        });

        this.stage = serverless.service.provider.stage
        this.apiGatewayName =  serverless.service.service

        this.hooks = {
            'before:deploy:deploy': () => this.postDeploy(),
            // 'after:deploy:deploy': () => this.postDeploy()
        }
    }

    async beforeDeploy() {
        const serviceFunctionNames = this.serverless.service.getAllFunctions();
        const clf = this.serverless.service.provider.compiledCloudFormationTemplate;

        // Check VersionFunction Option
        if (!this.serverless.service.provider.versionFunctions) {
            throw Error("You must enable versionFunctions")
        }

        if (!this.serverless.service.custom?.serverlessAPIVersioning?.version) {
            throw Error("No serverlessAPIVersioning version specified")
        }

        const pathsList = []
        const functions = []
        // 모든 Function 정보 가져오기 + 기존 Api 연결 정보 삭제하기
        for (const functionName of serviceFunctionNames) {
            const _function = this.serverless.service.getFunction(functionName)
            const {
                http: {
                    path,
                }
            } = _function.events[0]
            functions.push(_function)
            pathsList.push(path.split('/'))

            Object.keys(clf.Resources).map((resourceKeyName) => {
                if(/ApiGateway.+/gi.exec(resourceKeyName)) {
                    delete clf.Resources[resourceKeyName];
                }
            });
        }

        // API GW 생성하기
        const ApiGatewayRestApi = {
            ApiGatewayRestApi: {
                Type: 'AWS::ApiGateway::RestApi',
                Properties: {
                    Name: `${this.stage}-${this.apiGatewayName}`
                }
            }
        };

        // pathMap 생성하기
        this.pathMap = this.makePathTreeAll(pathsList);

        // 트리 탐색하며 Path 리소스 생성하기
        const pathProperties = this.makeAllPathResources(this.pathMap);

        const methodProperties = {};
        // Function 별로 Method 리소스 생성하고 할당하기
        for (const functionName of serviceFunctionNames) {
            const _function = this.serverless.service.getFunction(functionName)
            const {
                http: {
                    method,
                    path,
                }
            } = _function.events[0];
            const lastResourceName = `fooPath`; // FIXME
            methodProperties[`${functionName}`] = this.makeMethod(lastResourceName, method, functionName);
        }

        // 권한 할당 하기
        // const permissionProperties = {};
        //
        // for (const functionName of serviceFunctionNames) {
        //     const _function = this.serverless.service.getFunction(functionName)
        //     const {
        //
        //     } = _function.events[0];
        //     permissionProperties[``] = this.makeAlias(functionName);
        // }

        // 버전관리에 필요한 모든 리소스들을 정리
        clf.Resources = {
            ...clf.Resources,
            ...ApiGatewayRestApi,
            ...pathProperties,
            ...methodProperties,
            // ...permissionProperties
        };

        // console.log(JSON.stringify(clf.Resources))
    }

    async postDeploy() {
        // 버전 할당 및 권한 할당은 Lambda 함수 배포 이후에 이루어져야함
        // API 호출로 버전/권한/별칭 생성
        const serviceFunctionNames = this.serverless.service.getAllFunctions();

        for (const functionName of serviceFunctionNames) {
            const result = await this.listVersionForFunction(`${this.apiGatewayName}-${this.stage}-${functionName}`);
            const latestVersion = result[1].Version


            // alias를 만듭니다.
            await this.createAlias(latestVersion, )
        }

        throw new Error("뻐큐");
    }

    // resources: {
    //   Resources: { }
    // } 에 Path 리소스 할당하기
    makeAllPathResources(pathMap) {
        const pathResources = {};

        const traverse = (obj, name, rootName) =>  {
            if (Object.keys(obj).length === 0) return;
            Object.keys(obj).forEach((keyName) => {
                pathResources[`${name}Path`] = this.makePath(keyName, rootName);
                traverse(obj[name], keyName, name);
            });
        }

        Object.keys(pathMap).forEach((pathName) => {
            traverse(pathMap, pathName, null);
        })

        return pathResources;
    }

    // PathMap 에 리소스 트리를 할당합니다
    // e.g) { foo: { bar: { } }}
    makePathTreeAll(pathsList) {
        let pathMap = {};

        function makePathTree(obj, paths) {
            if (paths.length === 0 ) return {};
            const firstElement = paths[0];
            if (typeof obj[firstElement] === "undefined")
                obj[firstElement] = {};
            makePathTree(obj[firstElement], paths.slice(1, paths.length));
            return obj;
        }

        for (const paths of pathsList) {
            pathMap = makePathTree(pathMap, paths);
        }

        return pathMap;
    }

    makePath(pathName, rootPathName) {
        return {
            Type: 'AWS::ApiGateway::Resource',
            Properties: {
                ParentId: {
                    ...(rootPathName === null ? {
                        'Fn::GetAtt': [
                            'ApiGatewayRestApi',
                            'RootResourceId'
                        ]
                    } : {
                        Ref: rootPathName
                    })
                },
                PathPart: pathName,
                RestApiId: {
                    Ref: 'ApiGatewayRestApi'
                }
            }
        }
    }

    makeMethod(resourceName, httpMethod, functionName) { // resourceID
        const stage = this.stage;
        const apiGatewayName = this.apiGatewayName;

        return {
            Type: 'AWS::ApiGateway::Method',
            Properties: {
                RestApiId: {
                    Ref: 'ApiGatewayRestApi'
                },
                ResourceId: {
                    Ref: resourceName
                },
                HttpMethod: httpMethod.toUpperCase(),
                    AuthorizationType: 'NONE',
                    MethodResponses:
                        statusCodeList.map((statusCode) => (
                            {
                                StatusCode: statusCode
                            }
                        )),
                    Integration: {
                    Type: 'AWS',
                        IntegrationHttpMethod: 'POST',
                        RequestTemplates: {
                        'application/json': mappingTemplate
                    },
                    Uri: {
                        'Fn::Sub': `arn:aws:apigateway:\${AWS::Region}:lambda:path/2015-03-31/functions/arn:aws:lambda:\${AWS::Region}:\${AWS::AccountId}:function:${apiGatewayName}-${stage}-${functionName}:{version}/invocations`
                    },
                    IntegrationResponses:
                        statusCodeList.map((statusCode) => (
                            {
                                StatusCode: statusCode
                            }
                        ))
                }
            }
        }
    }

    makePermission(functionName) {
        const stage = this.stage;
        const apiGatewayName = this.apiGatewayName;
        return {
            Type: 'AWS::Lambda::Permission',
            Properties: {
                Action: 'lambda:InvokeFunction',
                FunctionName: `${apiGatewayName}-${stage}-${functionName}:9`,
                Principal: 'apigateway.amazonaws.com',
                SourceArn: {
                    'Fn::Sub': 'arn:aws:execute-api:${AWS::Region}:${AWS::AccountId}:${ApiGatewayRestApi}/*/*'
                }
            }
        }
    }

    listVersionForFunction(functionName) {
        const params = {
            FunctionName: functionName
        };

        return this.makeLambdaRequest('listVersionsByFunction', params, r => r.Versions)
            .catch(e => {
                //ignore if function not deployed
                if (e.providerError && e.providerError.statusCode === 404) return [];
                else throw e;
            });
    }

    createAlias(functionVersion, version) {
        const params = {
            "FunctionVersion": functionVersion,
            "Name": version
        }

        return this.makeLambdaRequest('createAlias', params, r => r)
    }

    makeLambdaRequest(action, params, responseMapping) {
        const results = [];
        const responseHandler = response => {
            Array.prototype.push.apply(results, responseMapping(response));

            if (response.NextMarker) {
                return this.provider.request('Lambda', action, Object.assign({}, params, { Marker: response.NextMarker }))
                    .then(responseHandler);
            } else {
                return results;
            }
        };

        return this.provider.request('Lambda', action, params)
            .then(responseHandler);
    }
}

module.exports = ServerlessVersioning;
