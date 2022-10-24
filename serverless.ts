import {Serverless} from "serverless/aws";
import {mappingTemplate} from "./src/mapping-template";


const serverlessConfiguration: Serverless = {
    frameworkVersion: '3',
    service: 'api-versioning',
    plugins: [
        'serverless-webpack',
    ],
    package: {
      exclude: [
          'node_modules/**'
      ],
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

    // For Custom Lambda Integration
    resources: {
        Resources: {
            ApiGatewayRestApi: {
              Type: 'AWS::ApiGateway::RestApi',
              Properties: {
                  Name: 'api-versioning'
              }
            },
            EchoPath: {
                Type: 'AWS::ApiGateway::Resource',
                Properties: {
                    ParentId: {
                        'Fn::GetAtt': [
                            'ApiGatewayRestApi',
                            'RootResourceId'
                        ]
                    },
                    PathPart: 'echo',
                    RestApiId: {
                        Ref: 'ApiGatewayRestApi'
                    }
                }
            },
            BarPath: {
              Type: 'AWS::ApiGateway::Resource',
              Properties: {
                  ParentId: {
                      Ref: 'EchoPath'
                  },
                  PathPart: 'bar',
                  RestApiId: {
                      Ref: 'ApiGatewayRestApi'
                  }
              }
            },
            GetEcho: {
                Type: 'AWS::ApiGateway::Method',
                Properties: {
                    RestApiId: {
                        Ref: 'ApiGatewayRestApi'
                    },
                    ResourceId: {
                        Ref: 'BarPath'
                    },
                    HttpMethod: 'GET',
                    AuthorizationType: 'NONE',
                    MethodResponses: [
                        {
                            StatusCode: 200
                        }
                    ],
                    Integration: {
                        Type: 'AWS',
                        IntegrationHttpMethod: 'POST',
                        RequestTemplates: {
                          'application/json': mappingTemplate
                        },
                        Uri: {
                            'Fn::Sub': 'arn:aws:apigateway:${AWS::Region}:lambda:path/2015-03-31/functions/arn:aws:lambda:${AWS::Region}:${AWS::AccountId}:function:api-versioning-dev-echo:{version}/invocations'
                        },
                        IntegrationResponses: [
                            {
                                StatusCode: 200
                            }
                        ]
                    }
                }
            },
            LambdaInvokeVersionPermission: {
                Type: 'AWS::Lambda::Permission',
                Properties: {
                    Action: 'lambda:InvokeFunction',
                    FunctionName: 'api-versioning-dev-echo:9',
                    Principal: 'apigateway.amazonaws.com',
                    SourceArn: {
                        'Fn::Sub': 'arn:aws:execute-api:${AWS::Region}:${AWS::AccountId}:${ApiGatewayRestApi}/*/*'
                    }
                }
            }
        }
    }
}

export = serverlessConfiguration
