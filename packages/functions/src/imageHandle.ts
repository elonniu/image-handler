import axios from "axios";
import sharp from "sharp";
import {Bucket} from "sst/node/bucket";
import {S3} from "aws-sdk";
import {int} from "aws-sdk/clients/datapipeline";

export const handler = async (event: any, context: any) => {

    const {InvocationType, Url, Key, Width, Height, Quality, Records} = event;

    console.log(event);

    if (Url || InvocationType === 'Event') {
        const image = await compress(Url, Key, Width, Height, Quality);
        console.log({
            event,
            image,
        });

        return {
            statusCode: 200,
            body: JSON.stringify({
                event,
                image,
            }, null, 2),
        };
    }

    // for event.Records
    if (Records) {
        for (const record of Records) {
            const {body} = record;
            const {Url, Key, Width, Height, Quality} = JSON.parse(body);
            const image = await compress(Url, Key, Width, Height, Quality);

            console.log(image);
        }
    }

    return {
        statusCode: 200,
        body: JSON.stringify({
            event,
        }, null, 2),
    };

}


export const compress = async (url: string, Key: string, Width: int, Height: int, Quality: int) => {

    // record getimage latency
    const startTime = new Date().getTime();
    const data = await getImage(url);
    const endTime = new Date().getTime();

    const downloadImageLatencyMS = endTime - startTime;

    // get response.data size in mb
    const beforeByteLength = data.byteLength;
    //record compress latency
    const startTime2 = new Date().getTime();
    const compress = await compressImage(data, Width, Height, Quality);
    const endTime2 = new Date().getTime();
    const compressImageLatencyMS = endTime2 - startTime2;

    const afterByteLength = compress.byteLength;

    const imageUrl = await uploadImage(compress, Key);

    // get compress ratio
    const compressRatio = afterByteLength / beforeByteLength;

    // make beforeByteLength afterByteLength to mb
    const beforeMB = (beforeByteLength / 1024 / 1024).toFixed(2);
    const afterMB = (afterByteLength / 1024 / 1024).toFixed(2);
    return {
        downloadImageLatencyMS,
        compressImageLatencyMS,
        beforeByteLength,
        compressRatio,
        afterByteLength,
        beforeMB,
        afterMB,
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

// create compressImage function
export const compressImage = async (data: Buffer, Width: int, Height: int, Quality: int) => {

    // what's the sharp quality default value?
    return await sharp(data)
        .resize(Width, Height, {
            fit: 'inside',
            withoutEnlargement: true,
        })
        .jpeg({quality: Quality})
        .toBuffer();
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
