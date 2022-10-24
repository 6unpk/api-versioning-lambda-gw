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
yarn
```

### Run with test

```
yarn run deploy
```
