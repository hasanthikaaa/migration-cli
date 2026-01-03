export interface MigrationConfig {
    projectName: string;
    source: string;
    readSource: boolean;
    awsAccessKeyId?: string;
    awsSecretAccessKey?: string;
    awsRegion?: string;
    cognitoUserPoolId?: string;
    s3Bucket?: string;
    s3Prefix?: string;
    dynamoTable?: string;
    dynamoPartitionKey?: string;
}
