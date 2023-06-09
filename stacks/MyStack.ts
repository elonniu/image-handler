import {Api, Bucket, Function, Queue, StackContext} from "sst/constructs";
import {lambdaUrl, s3Url} from "sst-helper";
import {Duration} from "aws-cdk-lib";

export function API({stack, app}: StackContext) {
    // create bucket by sst v2
    const bucket = new Bucket(stack, "Bucket", {});

    const apiLambda = new Function(stack, "apiLambda", {
            handler: "packages/functions/src/lambda.handler",
            bind: [bucket],
            memorySize: 4048,
            timeout: 300,
            currentVersionOptions: {
                provisionedConcurrentExecutions: 1,
            }
        }
    );

    // create queue by sst 2
    const queue = new Queue(stack, "Queue", {
        cdk: {
            queue: {
                visibilityTimeout: Duration.seconds(300)
            }
        },
        consumer: {
            cdk: {
                function: apiLambda,
                eventSource: {
                    batchSize: 1,
                    reportBatchItemFailures: false,
                }
            }
        },

    });

    // create queue by sst 2
    const queueResult = new Queue(stack, "QueueResult", {
        cdk: {
            queue: {
                visibilityTimeout: Duration.seconds(300)
            }
        },
        consumer: "packages/functions/src/result.handler",
    });

    apiLambda.bind([queue, queueResult]);

    const api = new Api(stack, "api", {
        routes: {
            "POST /": {cdk: {function: apiLambda}},
        },
    });

    stack.addOutputs({
        ApiEndpoint: api.url,
        lambda: lambdaUrl(apiLambda, stack),
        bucket: s3Url(bucket, stack)
    });
}
