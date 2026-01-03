import path from "path";
import fs from "fs/promises";
import type {MigrationConfig} from './types.ts';
import type CSVHelper from './csv-helper.ts';
import type { IHeaders } from './csv-helper.ts';

export const chunkArray = <T>(arr: T[], chunkSize: number): T[][] => {
    const chunks: T[][] = [];
    for (let i = 0; i < arr.length; i += chunkSize) {
        chunks.push(arr.slice(i, i + chunkSize));
    }
    return chunks;
};

export const saveConfigFile = async (
    config: MigrationConfig,
    dirPath: string
) => {
    const filePath = path.join(dirPath, "migration.config.json");
    try {
        await fs.mkdir(dirPath, { recursive: true });
        await fs.writeFile(filePath, JSON.stringify(config, null, 2), "utf-8");
        console.log(`✅ Config file created at: ${filePath}`);
    } catch (err) {
        console.error("❌ Failed to save config file:", err);
        throw err;
    }
};


export const splitIntoBatches = async (
    data: any[],
    batchDir: string,
    csv: CSVHelper,
    headers: IHeaders[]
) => {
    const batchSize = 50;
    const batches = chunkArray(data, batchSize);
    const statsRecords: { type: string; count: number }[] = [
        { type: "totalRecords", count: data.length },
    ];

    for (let i = 0; i < batches.length; i++) {
        try {
            const batchCsvPath = path.join(batchDir, `batch_${i + 1}.csv`);
            await csv.createFile(batchCsvPath);

            const batchData = batches[i] as any[];
            const batchFileName = path.join(batchDir, `batch_${i + 1}.csv`);

            const batchWriter = await csv.generateCSVInstance(batchFileName, headers);
            await csv.writeToCsv(batchWriter, batchData);

            statsRecords.push({ type: `batch_${i + 1}`, count: batchData.length });
            console.log(
                `✅ Batch ${i + 1} CSV created with ${batchData.length} records`
            );
        } catch (err: any) {
            console.error(`❌ Error creating batch ${i + 1}:`, err);
        }
    }
    return { statsRecords };
};

export const writeLog = async (logPath: string, message: string) => {
    await fs.appendFile(logPath, `${new Date().toISOString()} - ${message}\n`);
};

export const statFile = async (
    statDir: string,
    csv: CSVHelper,
    statsRecords: any[]
) => {
    try {
        const statFilePath = path.join(statDir, "migration-stats.csv");
        const statWriter = await csv.generateCSVInstance(statFilePath, [
            { id: "type", title: "Type" },
            { id: "count", title: "Count" },
        ]);
        await csv.writeToCsv(statWriter, statsRecords);
        console.log(`✅ Stats CSV created at ${statFilePath}`);
    } catch (error) {
        console.log("statFile-ERROR", error);
        return;
    }
};