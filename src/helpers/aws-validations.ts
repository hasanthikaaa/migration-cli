import { STSClient, GetCallerIdentityCommand } from "@aws-sdk/client-sts";
import { S3Client, HeadBucketCommand } from "@aws-sdk/client-s3";
import { DynamoDBClient, DescribeTableCommand } from "@aws-sdk/client-dynamodb";
import {
    CognitoIdentityProviderClient,
    DescribeUserPoolCommand,
} from "@aws-sdk/client-cognito-identity-provider";
import type {MigrationConfig} from './types.ts';

export const validateAWSCredentials = async (
    accessKeyId: string,
    secretAccessKey: string,
    region: string
) => {
    try {
        const stsClient = new STSClient({
            region,
            credentials: { accessKeyId, secretAccessKey },
        });
        await stsClient.send(new GetCallerIdentityCommand({}));
        return { valid: true };
    } catch (err: any) {
        return { valid: false, message: `Invalid AWS credentials: ${err.message}` };
    }
};

export const checkCognitoUserPool = async (
    userPoolId: string,
    region: string,
    accessKeyId: string,
    secretAccessKey: string
) => {
    try {
        const client = new CognitoIdentityProviderClient({
            region,
            credentials: { accessKeyId, secretAccessKey },
        });
        await client.send(new DescribeUserPoolCommand({ UserPoolId: userPoolId }));
        return { exists: true };
    } catch (err: any) {
        return {
            exists: false,
            message: `Cognito User Pool not found or credentials invalid: ${err.message}`,
        };
    }
};

export const checkS3Bucket = async (
    bucketName: string,
    region: string,
    accessKeyId: string,
    secretAccessKey: string
) => {
    try {
        const client = new S3Client({
            region,
            credentials: { accessKeyId, secretAccessKey },
        });
        await client.send(new HeadBucketCommand({ Bucket: bucketName }));
        return { exists: true };
    } catch (err: any) {
        return {
            exists: false,
            message: `S3 bucket not found or credentials invalid: ${err.message}`,
        };
    }
};

export const checkDynamoTable = async (
    tableName: string,
    region: string,
    accessKeyId: string,
    secretAccessKey: string
) => {
    try {
        const client = new DynamoDBClient({
            region,
            credentials: { accessKeyId, secretAccessKey },
        });
        await client.send(new DescribeTableCommand({ TableName: tableName }));
        return { exists: true };
    } catch (err: any) {
        return {
            exists: false,
            message: `DynamoDB table not found or credentials invalid: ${err.message}`,
        };
    }
};

export const validateAWS = async (answers: MigrationConfig) => {
    if (answers.readSource) {
        const { awsAccessKeyId, awsSecretAccessKey, awsRegion, source } = answers;

        console.log("Validating AWS credentials...");
        const credCheck = await validateAWSCredentials(
            awsAccessKeyId!,
            awsSecretAccessKey!,
            awsRegion!
        );
        if (!credCheck.valid) {
            console.error(`❌ ${credCheck.message}`);
            process.exit(1);
        }

        let resourceCheck;
        if (source === "cognito") {
            resourceCheck = await checkCognitoUserPool(
                answers.cognitoUserPoolId!,
                awsRegion!,
                awsAccessKeyId!,
                awsSecretAccessKey!
            );
        } else if (source === "s3") {
            resourceCheck = await checkS3Bucket(
                answers.s3Bucket!,
                awsRegion!,
                awsAccessKeyId!,
                awsSecretAccessKey!
            );
        } else if (source === "dynamodb") {
            resourceCheck = await checkDynamoTable(
                answers.dynamoTable!,
                awsRegion!,
                awsAccessKeyId!,
                awsSecretAccessKey!
            );
        }

        if (resourceCheck && !resourceCheck.exists) {
            console.error(`❌ ${resourceCheck.message}`);
            process.exit(1);
        }

        console.log("✅ AWS credentials and resource validated!");
    }
};