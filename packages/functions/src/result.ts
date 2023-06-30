import console from "console";

export const handler = async (event: any, context: any) => {
    const {Records} = event;

    for (const record of Records) {
        const {body} = record;

        console.log(JSON.parse(body));
    }

    return {};
}
