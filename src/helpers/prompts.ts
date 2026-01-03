export const prompts = [
    { type: "input", name: "projectName", message: "Enter project name:" },
    {
        type: "rawlist",
        name: "source",
        message: "Select migration source:",
        choices: ["cognito", "s3", "dynamodb"],
    },
    {
        type: "confirm",
        name: "readSource",
        message: "Read from source?",
        default: true,
    },
    {
        type: "input",
        name: "awsInfo",
        message:
            "⚠️ Use permanent AWS credentials. Temporary credentials may expire soon. Press Enter to continue...",
        when: (a: {readSource: boolean}) => a.readSource,
    },
    {
        type: "input",
        name: "awsAccessKeyId",
        message: "Enter AWS Access Key ID:",
        when: (a: {readSource: boolean}) => a.readSource,
    },
    {
        type: "input",
        name: "awsSecretAccessKey",
        message: "Enter AWS Secret Access Key:",
        when: (a: {readSource: boolean}) => a.readSource,
    },
    {
        type: "input",
        name: "awsRegion",
        message: "Enter AWS Region:",
        when: (a: {readSource: boolean}) => a.readSource,
    },
    {
        type: "input",
        name: "cognitoUserPoolId",
        message: "Enter Cognito User Pool ID:",
        when: (a: {readSource: boolean, source: string}) => a.readSource && a.source === "cognito",
    },
    {
        type: "input",
        name: "s3Bucket",
        message: "Enter S3 Bucket Name:",
        when: (a:{readSource: boolean, source: string}) => a.readSource && a.source === "s3",
    },
    {
        type: "input",
        name: "s3Prefix",
        message: "Enter S3 Prefix / Path (optional):",
        when: (a: {readSource: boolean, source: string}) => a.readSource && a.source === "s3",
    },
    {
        type: "input",
        name: "dynamoTable",
        message: "Enter DynamoDB Table Name:",
        when: (a:{readSource: boolean, source: string}) => a.readSource && a.source === "dynamodb",
    },
    {
        type: "input",
        name: "dynamoPartitionKey",
        message: "Enter DynamoDB Partition Key:",
        when: (a: {readSource: boolean, source: string}) => a.readSource && a.source === "dynamodb",
    },
    // @ts-ignore
] as inquirer.prompts.PromptCollection;
