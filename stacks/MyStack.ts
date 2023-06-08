import {Api, Bucket, Function, Queue, StackContext} from "sst/constructs";
import {lambdaUrl, s3Url} from "sst-helper";
import {ServicePrincipal} from "aws-cdk-lib/aws-iam";
import {Duration} from "aws-cdk-lib";

export function API({stack, app}: StackContext) {
    // create bucket by sst v2
    const bucket = new Bucket(stack, "Bucket", {});

    // create lambda function sst v2
    const imageHandle = new Function(stack, "ImageHandle", {
        handler: "packages/functions/src/imageHandle.handler",
        bind: [bucket],
        runtime: "nodejs16.x",
        memorySize: 4048,
        timeout: 50,
        currentVersionOptions: {
            provisionedConcurrentExecutions: 1,
        }
    });

    // create queue by sst 2
    const queue = new Queue(stack, "Queue", {
        cdk: {
            queue: {
                visibilityTimeout: Duration.seconds(300)
            }
        },
        consumer: {
            cdk: {
                function: imageHandle,
                eventSource: {
                    batchSize: 1,
                    reportBatchItemFailures: false,
                }
            }
        },

    });

    const apiLambda = new Function(stack, "apiLambda", {
            handler: "packages/functions/src/lambda.handler",
            bind: [imageHandle, queue],
        }
    );

    imageHandle.bind([queue]);

    // aws cli to invoke lambda function
    // aws lambda invoke --function-name imageHandle --payload '{"key": "test.jpg"}' response.json

    const api = new Api(stack, "api", {
        routes: {
            "POST /": {cdk: {function: apiLambda}},
        },
    });

    // create permission for lambda invoke lambda by cdk
    imageHandle.addPermission("invokeByLambda", {
        principal: new ServicePrincipal("lambda.amazonaws.com"),
        sourceArn: apiLambda.functionArn
    });

    stack.addOutputs({
        ApiEndpoint: api.url,
        lambda: lambdaUrl(apiLambda, app),
        imageHandle: lambdaUrl(imageHandle, app),
        bucket: s3Url(bucket, app)
    });
}
