import {S3, SQS} from "aws-sdk";
import {Queue} from "sst/node/queue";
import {jsonParseRecursive} from "sst-helper";
import {int} from "aws-sdk/clients/datapipeline";
import sharp from "sharp";
import axios from "axios";
import {Bucket} from "sst/node/bucket";

export const handler = async (event: any, context: any) => {

    console.log(event);

    if (event.body) {
        return await apiHandler(event, context);
    }

    const {Url, Key, Width, Height, Quality, Records} = event;

    // From Event
    if (Url) {
        const image = await compress(Url, Key, Width, Height, Quality);
        console.log(image);

        return {};
    }

    // From SQS
    if (Records) {
        for (const record of Records) {
            const {body} = record;
            const {Url, Key, Width, Height, Quality} = JSON.parse(body);
            const image = await compress(Url, Key, Width, Height, Quality);
            console.log(image);
        }
    }

    return {};
}

export const apiHandler = async (_evt: any, context: any) => {
    const body = JSON.parse(_evt.body || "[]");
    const {Url, InvocationType, Width, Height, Quality} = body;

    // generate unique filename4
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

    // InvocationType must be in ["RequestResponse", "Queue"]
    if (!["RequestResponse", "Queue"].includes(InvocationType)) {
        return {
            statusCode: 400,
            contentType: "application/json",
            body: JSON.stringify({
                error: "InvocationType must be in ['RequestResponse', 'Queue']",
            }, null, 2),
        };
    }


    try {
        if (InvocationType === "Queue") {
            // put record into sqs queue
            const sqs = new SQS();
            // send message batch
            const result = await sqs.sendMessageBatch({
                QueueUrl: Queue.Queue.queueUrl,
                Entries: [
                    {
                        Id: "1",
                        MessageBody: JSON.stringify(event),
                    },
                    {
                        Id: "2",
                        MessageBody: JSON.stringify(event),
                    },
                ]
            }).promise();

            return {result};
        }

        // use aws sdk invoke lambda function synchronously
        const result = await compress(Url, Key, Width, Height, Quality);

        jsonParseRecursive(result);
        jsonParseRecursive(result);

        return {result};

    } catch (e) {
        return {
            statusCode: 400,
            contentType: "application/json",
            body: JSON.stringify({
                error: e.message
            }, null, 2),
        };
    }


}


export const compress = async (url: string, Key: string, Width: int, Height: int, Quality: int) => {

    // record getimage latency
    const startTime = new Date().getTime();
    const originalImage = await getImage(url);
    const endTime = new Date().getTime();

    const downloadImageLatencyMS = endTime - startTime;

    // get response.data size in mb
    const originalByteLength = originalImage.byteLength;
    //record compress latency
    const startTime2 = new Date().getTime();

    const originalImageMeta = await sharp(originalImage).metadata();

    const compressedImage = await sharp(originalImage)
        .resize(Width, Height, {
            fit: 'inside',
            withoutEnlargement: true,
        })
        .jpeg({quality: Quality})
        .toBuffer();

    const endTime2 = new Date().getTime();
    const compressImageLatencyMS = endTime2 - startTime2;

    const compressedByteLength = compressedImage.byteLength;

    const imageUrl = await uploadImage(compressedImage, Key);

    // get compress ratio
    const compressRatio = compressedByteLength / originalByteLength;

    // get image resolution
    const compressedImageMeta = await sharp(compressedImage).metadata();

    // make beforeByteLength afterByteLength to mb
    const originalMB = (originalByteLength / 1024 / 1024).toFixed(2) + ' MB';
    const compressedMB = (compressedByteLength / 1024 / 1024).toFixed(2) + ' MB';

    return {
        downloadImageLatencyMS,
        compressImageLatencyMS,
        originalByteLength,
        compressedByteLength,
        compressRatio,
        originalMB,
        compressedMB,
        originalImageMeta,
        compressedImageMeta,
        imageUrl
    };
}

// create getImage function
export const getImage = async (url: string) => {
    const response = await axios.get(url, {
        responseType: 'arraybuffer'
    });

    return response.data;
}

//create uploadImage function
export const uploadImage = async (imageBuffer: Buffer, Key: string) => {
    const s3 = new S3();
    const upload = s3.upload({
        Bucket: Bucket.Bucket.bucketName,
        Key,
        Body: imageBuffer,
        ContentType: 'image/jpeg',
        ContentDisposition: 'inline',
    })
    await upload.promise();
    return s3.getSignedUrl('getObject', {
        Bucket: Bucket.Bucket.bucketName,
        Key,
        Expires: 60 * 60 * 24 * 365 * 10,
    });
}
