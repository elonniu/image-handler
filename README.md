# Image Handler

## 1. What are the benefits of using serverless to process images?
- Pay as you go: only pay for the time your code is running
- No server management: no need to worry about the infrastructure
- No idle time: no need to worry about the idle time
- Easy to develop/deploy/test/debug
- Easy to scale, Auto scaling: scale up and scale down
- Easy to integrate with other services: API Gateway, S3, SQS, SNS, DynamoDB, etc.
- Native support for many invoke methods: Sync, Async, Http, Event, Stream
- Native support for many languages: Node.js, Python, Java, C#, Go, etc.
- Native support for DLQ: Dead Letter Queue
- Native support for logging/monitoring: CloudWatch
- Native support for tracing: X-Ray
- Native support for security: IAM, KMS, VPC, etc.
- Native support for versioning: version control

# 2. How to compute the cost?
- https://aws.amazon.com/lambda/pricing/

# 3. How to get cost effective / high performance?
- Optimize the bootstrap time for cold start
- Use the right memory size
- Use the right timeout
- Use the right provisioned concurrency
- Use the right trigger settings
- Use the right language
- Use the right library
- Use the right service
- Use the right region/latency
