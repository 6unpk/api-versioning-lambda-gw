# api-versioning-with-aws-lambda

AWS API Gateway 와 AWS Lambda 를 이용해 API 버전관리를 구현하는 예제입니다.

## How to

버전관리 구현을 위한 구현 전략은 크게 다음과 같습니다.

1. HTTP Proxy Lambda
2. Lambda Integration 을 Custom 으로 설정하기
3. API Gateway Stage 이용하기

### 공통 사전조건

위의 구현 방식들은 모두 AWS Lambda 의 versionFunction 기능을 활용하는 방식입니다. 

이와 관련한 자세한 내용은 다음 공식 문서를 참조하세요

https://docs.aws.amazon.com/ko_kr/lambda/latest/dg/configuration-versions.html

### 1. HTTP Proxy Lambda


### 2. Lambda Integration 을 Custom 으로 설정하기


### 3. API Gateway Stage 이용하기


## Test

### Prerequisite
```
npm install
```

### Run with test

```
npm run deploy
```

버전관리를 실제로 테스트 하려면 두가지 값을 바꿉니다.

버전 정보를 변경합니다.

```yaml
custom:
  serverlessAPIVersioning:
    version: '0.0.8' # -> 0.0.9
```

또는 ts 파일인 경우 다음과 같이 수정합니다.

```typescript
    custom: { // 버전을 지정한다.
      serverlessAPIVersioning: {
        version: '0.0.8' // -> 0.0.9
      }
    }
```

`npm run deploy` 실행 후 API Gateway 콘솔에서 확인해봅시다.
