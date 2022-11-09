import {Serverless} from "serverless/aws";


const serverlessConfiguration: Serverless = {
    frameworkVersion: '3',
    service: 'api-versioning',
    plugins: [
        'serverless-webpack',
        './plugin/serverless-versioning'
    ],
    package: {
      exclude: [
          'node_modules/**'
      ],
    },
    custom: { // 버전을 지정한다.
      serverlessAPIVersioning: {
        version: '0.0.8'
      }
    },
    provider: {
        name: 'aws',
        runtime: 'nodejs16.x',
        lambdaHashingVersion: 20201221,
        stage: 'dev',
        versionFunctions: true, // This is Important
        region: 'ap-northeast-2',
        endpointType: 'regional',
        logRetentionInDays: 14,
        apiGateway: {

        }
    },
    functions: {
        echo: {
            handler: 'src/handlers/echo.main',
            events: [
                {
                    http: {
                        method: 'get',
                        path: '/foo',
                        integration: 'lambda',
                    }
                }
            ]
        }
    },

    // For Custom Lambda Integration (Test Only)
    // resources: {
    //     Resources: {
    //         ApiGatewayRestApi: {
    //           Type: 'AWS::ApiGateway::RestApi',
    //           Properties: {
    //               Name: 'api-versioning'
    //           }
    //         },
    //         EchoPath: {
    //             Type: 'AWS::ApiGateway::Resource',
    //             Properties: {
    //                 ParentId: {
    //                     'Fn::GetAtt': [
    //                         'ApiGatewayRestApi',
    //                         'RootResourceId'
    //                     ]
    //                 },
    //                 PathPart: 'echo',
    //                 RestApiId: {
    //                     Ref: 'ApiGatewayRestApi'
    //                 }
    //             }
    //         },
    //         BarPath: {
    //           Type: 'AWS::ApiGateway::Resource',
    //           Properties: {
    //               ParentId: {
    //                   Ref: 'EchoPath'
    //               },
    //               PathPart: 'bar',
    //               RestApiId: {
    //                   Ref: 'ApiGatewayRestApi'
    //               }
    //           }
    //         },
    //         GetEcho: {
    //             Type: 'AWS::ApiGateway::Method',
    //             Properties: {
    //                 RestApiId: {
    //                     Ref: 'ApiGatewayRestApi'
    //                 },
    //                 ResourceId: {
    //                     Ref: 'BarPath'
    //                 },
    //                 HttpMethod: 'GET',
    //                 AuthorizationType: 'NONE',
    //                 MethodResponses: [
    //                     {
    //                         StatusCode: 200
    //                     }
    //                 ],
    //                 Integration: {
    //                     Type: 'AWS',
    //                     IntegrationHttpMethod: 'POST',
    //                     RequestTemplates: {
    //                       'application/json': mappingTemplate
    //                     },
    //                     Uri: {
    //                         'Fn::Sub': 'arn:aws:apigateway:${AWS::Region}:lambda:path/2015-03-31/functions/arn:aws:lambda:${AWS::Region}:${AWS::AccountId}:function:api-versioning-dev-echo:{version}/invocations'
    //                     },
    //                     IntegrationResponses: [
    //                         {
    //                             StatusCode: 200
    //                         }
    //                     ]
    //                 }
    //             }
    //         },
            // Cloudformation 배포시 DependsOn 설정이 안걸려서 배포가 안된다...
            // LambdaVersion: {
            //     Type: 'AWS::Lambda::Version',
            //     Properties: {
            //         FunctionName: 'api-versioning-dev-echo',
            //     },
            //     DependsOn: 'api-versioning-dev'
            // },
            // LambdaAlias: {
            //     Type: 'AWS::Lambda::Alias',
            //     Properties: {
            //         FunctionName: 'api-versioning-dev-echo',
            //         FunctionVersion: {
            //             'Fn::GetAtt': 'LambdaVersion.Version'
            //         },
            //         Name: 'v1_0_0'
            //     },
            //     DependsOn: 'api-versioning-dev'
            // },
            // LambdaInvokeVersionPermission: {
            //     Type: 'AWS::Lambda::Permission',
            //     Properties: {
            //         Action: 'lambda:InvokeFunction',
            //         FunctionName: 'api-versioning-dev-echo:1',
            //         Principal: 'apigateway.amazonaws.com',
            //         SourceArn: {
            //             'Fn::Sub': 'arn:aws:execute-api:${AWS::Region}:${AWS::AccountId}:${ApiGatewayRestApi}/*/*'
            //         }
            //     }
            // },
        // }
    // }
}

export = serverlessConfiguration
