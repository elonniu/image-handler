# Image Handler

## 1. What is this?

This is a demo for image processing using AWS Lambda.

## 2. How to use it?

### 2.2 Requirements
- `node -v` >= v16.16.0
- `npm -v` >= 9.6.6

### 2.1 Install the dependencies

```bash
npm install
```

### 2.2 Deploy the stack

```bash
npm run deploy --stage <stage> --region <region>
```

### 2.3 Get API Gateway URL from the output

```bash
Deployed:
API
ApiEndpoint: https://{your-api-url}
```

### 2.4 Test the API Gateway URL

### 2.4.1 Sync

```bash
curl --location 'https://{your-api-url}' \
--header 'Content-Type: application/json' \
--data '{
    "InvocationType": "RequestResponse",
    "Url": "https://{your-image-url}",
    "Width": 1000,
    "Height": 1000,
    "Quality": 50,
    "Format": "jpeg"
}'
```

### 2.4.2 Queue

```bash
curl --location 'https://{your-api-url}' \
--header 'Content-Type: application/json' \
--data '{
    "InvocationType": "Queue",
    "Url": "https://{your-image-url}",
    "Width": 1000,
    "Height": 1000,
    "Quality": 50,
    "Format": "jpeg"
}'
```

## 3. What are the benefits of using serverless to process images?

- Pay as you go: only pay for the time your code is running
- No server management: no need to worry about the infrastructure
- No idle time: no need to worry about the idle time
- Easy to develop/deploy/test/debug
- Easy to scale, Auto scaling: scale up and scale down
- Easy to integrate with other services: API Gateway, S3, SQS, SNS, DynamoDB, etc.
- Native support for many invoke methods: Sync, Async, Http, Event, Stream, CLI, SDK, etc.
- Native support for many languages: Node.js, Python, Java, C#, Go, etc.
- Native support for DLQ: Dead Letter Queue
- Native support for logging/monitoring: CloudWatch
- Native support for tracing: X-Ray
- Native support for security: IAM, KMS, VPC, etc.
- Native support for versioning: version control
- Native support for ESM settings: batch size, retry, etc.

# 4. How to compute the cost?

- https://aws.amazon.com/lambda/pricing/

# 5. How to get cost-effective / high performance?

- Optimize the bootstrap time for cold start
- Use the right memory size
- Use the right timeout
- Use the right provisioned concurrency
- Use the right service/trigger settings
- Use the right language
- Use the right library
- Use the right region/latency
