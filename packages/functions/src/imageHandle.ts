import axios from "axios";
import sharp from "sharp";
import {Bucket} from "sst/node/bucket";
import {S3} from "aws-sdk";
import {int} from "aws-sdk/clients/datapipeline";

export const handler = async (event: any, context: any) => {

    const {InvocationType, Url, Key, Width, Height, Records} = event;

    console.log(event);

    if (Url || InvocationType === 'Event') {
        const image = await compressImage(Url, Width, Height);
        const imageUrl = await uploadImage(image, Key);

        console.log({
            event,
            imageUrl,
        });

        return {
            statusCode: 200,
            body: JSON.stringify({
                event,
                imageUrl,
            }, null, 2),
        };
    }

    // for event.Records
    if (Records) {
        for (const record of Records) {
            const {body} = record;
            const {Url, Key, Width, Height} = JSON.parse(body);
            const image = await compressImage(Url, Width, Height);
            const imageUrl = await uploadImage(image, Key);

            console.log({
                event,
                imageUrl,
            });
        }
    }

    return {
        statusCode: 200,
        body: JSON.stringify({
            event,
        }, null, 2),
    };

}


// create compressImage function
export const compressImage = async (url: string, Width: int, Height: int) => {
    const response = await axios.get(url, {
        responseType: 'arraybuffer'
    });

    return await sharp(response.data)
        .resize(Width, Height, {
            fit: 'inside',
            withoutEnlargement: true
        })
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
