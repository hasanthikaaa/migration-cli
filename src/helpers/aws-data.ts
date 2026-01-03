import {
    CognitoIdentityProviderClient,
    ListUsersCommand,
} from "@aws-sdk/client-cognito-identity-provider";
import { S3Client, ListObjectsV2Command } from "@aws-sdk/client-s3";
import {
    DynamoDBClient,
    type ScanCommandInput,
} from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, ScanCommand } from "@aws-sdk/lib-dynamodb";
import type {MigrationConfig} from './types.ts';

export const readCognitoData = async (
    userPoolId: string,
    region: string,
    accessKeyId: string,
    secretAccessKey: string
) => {
    console.log("Reading from cognito...");
    const client = new CognitoIdentityProviderClient({
        region,
        credentials: { accessKeyId, secretAccessKey },
    });

    let users: any[] = [];
    let PaginationToken: string | undefined = undefined;

    do {
        //@ts-ignore
        const command = new ListUsersCommand({
            UserPoolId: userPoolId,
            PaginationToken,
        });

        //@ts-ignore
        const response = await client.send(command);
        console.log("users...", response?.Users?.length);
        if (response?.Users) {
            users.push(
                //@ts-ignore
                ...response?.Users.map((u) => {
                    const record: any = { Username: u.Username };
                    //@ts-ignore
                    u.Attributes?.forEach((attr) => {
                        record[attr.Name] = attr.Value;
                    });
                    return record;
                })
            );
        }

        //@ts-ignore
        PaginationToken = response?.PaginationToken;
    } while (PaginationToken);

    return users;
};

export const readS3Data = async (
    bucket: string,
    prefix: string,
    region: string,
    accessKeyId: string,
    secretAccessKey: string
) => {
    console.log("Reading from s3...");
    const client = new S3Client({
        region,
        credentials: { accessKeyId, secretAccessKey },
    });

    let objects: any[] = [];
    let ContinuationToken: string | undefined = undefined;

    do {
        //@ts-ignore
        const command = new ListObjectsV2Command({
            Bucket: bucket,
            Prefix: prefix,
            ContinuationToken,
        });

        //@ts-ignore
        const response = await client.send(command);
        console.log("Contents...", response.Contents?.length);
        if (response.Contents) {
            objects.push(
                //@ts-ignore
                ...response.Contents.map((obj) => ({
                    Key: obj.Key,
                    LastModified: obj.LastModified?.toISOString(),
                    Size: obj.Size,
                }))
            );
        }

        //@ts-ignore
        ContinuationToken = response?.IsTruncated
            ? response.NextContinuationToken
            : undefined;
    } while (ContinuationToken);

    return objects;
};

export const readDynamoData = async (
    tableName: string,
    region: string,
    accessKeyId: string,
    secretAccessKey: string
) => {
    console.log("Reading from dynamodb...");
    const client = new DynamoDBClient({
        region,
        credentials: { accessKeyId, secretAccessKey },
    });

    const docClient = DynamoDBDocumentClient.from(client);

    let items: any[] = [];
    let ExclusiveStartKey: Record<string, any> | undefined = undefined;

    do {
        const input: ScanCommandInput = { TableName: tableName };
        if (ExclusiveStartKey) input.ExclusiveStartKey = ExclusiveStartKey;

        const command = new ScanCommand(input);
        const response = await docClient.send(command);
        console.log("Items...", response?.Items?.length);
        if (response.Items) {
            items.push(...response.Items);
        }

        ExclusiveStartKey = response.LastEvaluatedKey;
    } while (ExclusiveStartKey);

    return items;
};


export const readFromDataSource = async (answers: MigrationConfig) => {
    try {
        const accessKeyId = answers.awsAccessKeyId!;
        const secretAccessKey = answers.awsSecretAccessKey!;
        const region = answers.awsRegion!;

        let data: any[] = [];
        if (answers.source === "cognito") {
            data = await readCognitoData(
                answers.cognitoUserPoolId!,
                region,
                accessKeyId,
                secretAccessKey
            );
        } else if (answers.source === "dynamodb") {
            data = await readDynamoData(
                answers.dynamoTable!,
                region,
                accessKeyId,
                secretAccessKey
            );
        } else if (answers.source === "s3") {
            data = await readS3Data(
                answers.s3Bucket!,
                answers.s3Prefix || "",
                region,
                accessKeyId,
                secretAccessKey
            );
        }
        return data;
    } catch (error) {
        console.log("readFromDataSource-ERROR", error);
        return;
    }
};