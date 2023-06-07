import {Api, Bucket, Function, Queue, StackContext} from "sst/constructs";
import {lambdaUrl, s3Url} from "sst-helper";
import {ServicePrincipal} from "aws-cdk-lib/aws-iam";

export function API({stack, app}: StackContext) {
    // create bucket by sst v2
    const bucket = new Bucket(stack, "Bucket", {});

    // create lambda function sst v2
    const imageHandle = new Function(stack, "ImageHandle", {
        functionName: "imageHandle",
        handler: "packages/functions/src/imageHandle.handler",
        bind: [bucket]
    });

    // create queue by sst 2
    const queue = new Queue(stack, "Queue", {
        consumer: {
            function: imageHandle,
            cdk: {
                eventSource: {
                    batchSize: 1,
                    reportBatchItemFailures: false,
                }
            }
        },

    });


    imageHandle.bind([queue]);

    // aws cli to invoke lambda function
    // aws lambda invoke --function-name imageHandle --payload '{"key": "test.jpg"}' response.json

    const api = new Api(stack, "api", {
        defaults: {
            function: {
                bind: [bucket, imageHandle, queue],
            }
        },
        routes: {
            "POST /": "packages/functions/src/lambda.handler",
        },
    });

    // create permission for lambda invoke lambda by cdk
    imageHandle.addPermission("invokeByLambda", {
        principal: new ServicePrincipal("lambda.amazonaws.com"),
        sourceArn: api.getFunction("POST /").functionArn
    });

    stack.addOutputs({
        ApiEndpoint: api.url,
        lambda: lambdaUrl(api.getFunction("POST /"), app),
        imageHandle: lambdaUrl(imageHandle, app),
        bucket: s3Url(bucket, app)
    });
}
