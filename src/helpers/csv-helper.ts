import { createObjectCsvWriter } from "csv-writer";
import type { CsvWriter } from "csv-writer/src/lib/csv-writer.js";
import type { ObjectMap } from "csv-writer/src/lib/lang/object.js";
import path from "path";
import fs from "fs/promises";
import fsSync from "fs";
import { parse } from "csv-parse";

export interface IHeaders {
    id: string;
    title: string;
}

class CSVHelper {
    public async createDirectory(dirPath: string): Promise<void> {
        await fs.mkdir(dirPath, { recursive: true });
    }

    private async ensureDirectoryExists(filePath: string): Promise<void> {
        const dir = path.dirname(filePath);
        try {
            await fs.mkdir(dir, { recursive: true });
        } catch (err) {
            console.error(`Failed to create directory ${dir}:`, err);
            throw err;
        }
    }

    public async createFile(filePath: string): Promise<void> {
        if (!fsSync.existsSync(filePath)) {
            await fs.writeFile(filePath, "");
        }
    }

    public async writeToCsv(
        csvWriter: CsvWriter<ObjectMap<any>>,
        records: any[]
    ) {
        try {
            await csvWriter.writeRecords(records);
            console.log("CSV file written successfully");
        } catch (error) {
            console.log("writeToCsv-ERROR", error);
            return;
        }
    }

    public async generateCSVInstance(outputPath: string, headers: IHeaders[]) {
        return createObjectCsvWriter({
            path: outputPath,
            header: headers,
            fieldDelimiter: ',',
            recordDelimiter: '\n',
            alwaysQuote:  false
        });
    }

    public validateRecords(records: any[], headers: IHeaders[]): void {
        if (!records.length) return;

        const headerKeys = headers.map((h) => h.id);
        const recordKeys = Object.keys(records[0]);

        const missingKeys = headerKeys.filter((key) => !recordKeys.includes(key));

        if (missingKeys.length) {
            throw new Error(
                `CSV validation failed. Missing keys: ${missingKeys.join(", ")}`
            );
        }
    }

    public async readCSV<T = Record<string, string>>(
        filePath: string,
        options: {
            columns?: boolean;
            skipEmptyLines?: boolean;
        } = { columns: true, skipEmptyLines: true }
    ): Promise<T[]> {
        return new Promise((resolve, reject) => {
            const records: T[] = [];

            fsSync
                .createReadStream(filePath)
                .pipe(parse(options))
                .on("data", (row) => records.push(row))
                .on("end", () => resolve(records))
                .on("error", reject);
        });
    }

    public async appendToCSV<T extends Record<string, any>>(
        outputPath: string,
        headers: IHeaders[],
        records: T[]
    ): Promise<void> {
        if (!records.length) return;

        this.validateRecords(records, headers);
        const writer = await this.generateCSVInstance(outputPath, headers);
        await this.writeToCsv(writer, records);
    }
}

export default CSVHelper;
