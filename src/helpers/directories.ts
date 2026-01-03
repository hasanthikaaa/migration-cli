import type {MigrationConfig} from './types.ts';
import type CSVHelper from './csv-helper.ts';
import path from 'path';
import fs from 'fs/promises';

export const prepareProjectDirectories = async (
    answers: MigrationConfig,
    data: any[],
    csv: CSVHelper
) => {
    const projectDir = path.join("./src/migrations", answers.projectName);
    const masterDataDir = path.join(projectDir, "masterData");
    const dataDir = path.join(projectDir, "data");
    const logsDir = path.join(projectDir, "logs");
    const batchesDir = path.join(dataDir, "batches");
    const outputDir = path.join(projectDir, "outputs");
    const markerDir = path.join(projectDir, "marker");
    const statsDir = path.join(projectDir, "marker");

    await fs.mkdir(masterDataDir, { recursive: true });
    await fs.mkdir(logsDir, { recursive: true });
    await fs.mkdir(batchesDir, { recursive: true });
    await fs.mkdir(outputDir, { recursive: true });
    await fs.mkdir(markerDir, { recursive: true });
    await fs.mkdir(dataDir, { recursive: true });
    await fs.mkdir(statsDir, { recursive: true });

    const successCSVPath = path.join(logsDir, "success.csv");
    await csv.createFile(successCSVPath);

    const errorCSVPath = path.join(logsDir, "error.csv");
    await csv.createFile(errorCSVPath);

    const markerCSVPath = path.join(markerDir, "marker.csv");
    await csv.createFile(markerCSVPath);

    const headers = Object.keys(data?.[0] || {}).map((k) => ({
        id: k,
        title: k,
    }));

    const masterCsvPath = path.join(masterDataDir, "master-data.csv");
    const masterWriter = await csv.generateCSVInstance(masterCsvPath, headers);
    await csv.createFile(masterCsvPath);
    await csv.writeToCsv(masterWriter, data);
    console.log(`✅ Master CSV created at ${masterCsvPath}`);

    // Copy master CSV
    const copyPath = path.join(dataDir, "master-data-copy.csv");
    await fs.copyFile(masterCsvPath, copyPath);
    console.log(`✅ Master CSV copied to ${copyPath}`);

    return {
        projectDir,
        headers,
        dataDir,
        batchesDir,
        statsDir,
        logsDir,
        outputDir,
        markerDir,
        successCSVPath,
        markerCSVPath,
        errorCSVPath,
    };
};