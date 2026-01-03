#!/usr/bin/env node
import inquirer from 'inquirer';
import {prompts} from './helpers/prompts.ts';
import {validateAWS} from './helpers/aws-validations.ts';
import type {MigrationConfig} from './helpers/types.ts';
import {readFromDataSource} from './helpers/aws-data.ts';
import CSVHelper from './helpers/csv-helper.ts';
import {prepareProjectDirectories} from './helpers/directories.ts';
import {splitIntoBatches, statFile} from './helpers/helper.ts';

export const newMigration = async () => {
    try{
        const answers = await inquirer.prompt(prompts) as MigrationConfig;
        await validateAWS(answers);

        const data = (await readFromDataSource(
            answers as MigrationConfig
        )) as unknown as any[];

        const csv = new CSVHelper();

        const dir = await prepareProjectDirectories(answers, data, csv);

        const { statsRecords } = await splitIntoBatches(
            data,
            dir?.batchesDir,
            csv,
            dir?.headers
        );

        // Step 8: Stats CSV
        await statFile(dir?.statsDir, csv, statsRecords);

        return {dir, csv, statsRecords}
    }catch (error){
        console.log('init-ERROR', error);
        process.exit(1)
    }
}