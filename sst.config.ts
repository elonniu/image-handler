import {SSTConfig} from "sst";
import {API} from "./stacks/MyStack";
import {RemovalPolicy} from "aws-cdk-lib";

export default {
    config(_input) {
        return {
            name: "image-handler",
            region: "ap-southeast-1",
        };
    },
    stacks(app) {
        app.setDefaultRemovalPolicy(RemovalPolicy.DESTROY);
        app.setDefaultFunctionProps({
            runtime: "nodejs16.x",
            architecture: "arm_64",
        });
        app.stack(API);
    }
} satisfies SSTConfig;
