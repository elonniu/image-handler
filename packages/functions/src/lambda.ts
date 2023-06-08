import {ApiHandler} from "sst/node/api";
import {Lambda, SQS} from "aws-sdk";
import {Function} from "sst/node/function";
import {Queue} from "sst/node/queue";
import {jsonParseRecursive} from "sst-helper";

export const handler = ApiHandler(async (_evt) => {

    const body = JSON.parse(_evt.body || "{}");
    const {Url, InvocationType, Width, Height, Quality} = body;

    // generate unique filename
    const Uuid = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
    const Key = `${Uuid}-${Width}x${Height}.jpg`;

    // check required body fields
    if (!Url || !Key || !InvocationType || !Width || !Height || !Quality) {
        return {
            statusCode: 400,
            contentType: "application/json",
            body: JSON.stringify({
                error: "Url, Key, InvocationType, Width, Height, Quality are required",
            }, null, 2),
        };
    }

    const event = {InvocationType, Url, Key, Width, Height, Quality};

    // InvocationType must be in ["Event", "RequestResponse", "Queue"]
    if (!["Event", "RequestResponse", "Queue"].includes(InvocationType)) {
        return {
            statusCode: 400,
            contentType: "application/json",
            body: JSON.stringify({
                error: "InvocationType must be in ['Event', 'RequestResponse', 'Queue']",
            }, null, 2),
        };
    }


    try {
        if (InvocationType === "Queue") {
            // put record into sqs queue
            const sqs = new SQS();
            const result = await sqs.sendMessage({
                QueueUrl: Queue.Queue.queueUrl,
                MessageBody: JSON.stringify(event),
            }).promise();

            return {event, result};
        }

        // use aws sdk invoke lambda function asynchronously
        const lambda = new Lambda();
        const result = await lambda.invoke({
            FunctionName: Function.ImageHandle.functionName,
            InvocationType,
            Payload: JSON.stringify(event)
        }).promise();

        jsonParseRecursive(result);
        jsonParseRecursive(result);

        return {event, result};

    } catch (e) {
        return {event, error: e.message};
    }


});
