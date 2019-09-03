/*
* This program and the accompanying materials are made available under the terms of the
* Eclipse Public License v2.0 which accompanies this distribution, and is available at
* https://www.eclipse.org/legal/epl-v20.html
*
* SPDX-License-Identifier: EPL-2.0
*
* Copyright Contributors to the Zowe Project.
*
*/

import { ICommandHandler, IHandlerParameters, ImperativeError, Imperative, IProfileLoaded } from "@zowe/imperative";
import { Properties } from "../api/Properties";
import * as readline from "readline";
import { IZosMakeProperties } from "../api/interfaces/IZosMakeProperties";
import { IDatasetAttributes } from "../api/interfaces/IDatasetAttributes";
import { Defaults } from "../api/Defaults";
import { Files } from "../api/Files";

export default class InitHandler implements ICommandHandler {

    /**
     * The init handler prompts the user to input information about the project.
     * After init is completed, a project properties file (zos-make.json) is created.
     * @param params handler parameters from imperative
     */
    public async process(params: IHandlerParameters): Promise<void> {

        // Protect agaisnt overwritting an existing project.
        if (params.arguments.overwrite === false && Properties.exists()) {
            throw new ImperativeError({
                msg: "Init could not be completed.",
                additionalDetails: "'zos-make.json' properties file exists in the current project and --overwrite is false."
            });
        }

        // Create the readline (read from stdin) interface.
        const rl = readline.createInterface({
            input: process.stdin,
            output: process.stdout
        });

        try {
            // Ensure that there is a z/OSMF profile
            const zosmfDefault = Imperative.api.profileManager("zosmf").getDefaultProfileName();
            if (zosmfDefault == null) {
                throw new ImperativeError({ msg: `You must have at least one zosmf profile to initialize a zos-make project.` });
            }

            // Ensure that there is an SSH profile
            const sshDefault = Imperative.api.profileManager("ssh").getDefaultProfileName();
            if (sshDefault == null) {
                throw new ImperativeError({ msg: `You must have at least one ssh profile to initialize a zos-make project.` });
            }

            // Prompt for the z/OSMF profile to use
            const zosmfProfile: string = await this.ask(rl, `zowe-cli ZOSMF profile (defaults to ${zosmfDefault}): `) || zosmfDefault;

            // Prompt for the SSH profile to use
            const sshProfile: string = await this.ask(rl, `zowe-cli SSH profile (defaults to ${sshDefault}): `) || sshDefault;

            // Load both profiles
            const zosmfContents: IProfileLoaded = await Imperative.api.profileManager("zosmf").load({ name: zosmfProfile });
            const sshContents: IProfileLoaded = await Imperative.api.profileManager("ssh").load({ name: sshProfile });

            // Check if their hostnames match
            if (zosmfContents.profile.host !== sshContents.profile.host) {
                params.response.console.log(`Warning!!! Host names in the SSH (${sshContents.profile.host}) ` +
                    `and ZOSMF (${zosmfContents.profile.host}) profiles do not match!`);
                params.response.console.log(`Warning!!! Unpredictable results may occurr if the host LPAR differs.`);
            }

            // Prompt for the local source dir
            const localSrcDefault: string = Files.LOCAL_PROJECT_DEFAULT_SRC;
            const localSrcDir: string = await this.ask(rl, `Local project source directory (defaults to ${localSrcDefault}): `) || localSrcDefault;

            // Prompt for the local source dir
            const localOutDefault: string = Files.LOCAL_PROJECT_DEFAULT_OUT;
            const localOutDir: string = await this.ask(rl, `Local output directory (defaults to ${localOutDefault}): `) || localOutDefault;

            // Prompt for the remote project dir
            let remoteProjectDir: string = "";
            while (remoteProjectDir === "") {
                remoteProjectDir = await this.ask(rl, `Remote project USS directory (required): `);
            }

            // Prompt for ZFS name
            let dataSetHLQ: string = "";
            while (dataSetHLQ === "") {
                dataSetHLQ = await this.ask(rl, `Data set HLQ (required): `);
            }

            // Prompt for ZFS cyls
            const zfsSizeDefault: string = "10";
            const zfsSize: string = await this.ask(rl, `ZFS data set primary in CYLS (defaults to ${zfsSizeDefault}): `) || zfsSizeDefault;

            // Prompt for ZFS volumes
            const zfsVolumes: string = await this.ask(rl, `ZFS volumes (optional): `);

            // Prompt to create loadlib?
            const createLoadLibDefault: string = "Y";
            const createLoadLib: string = await this.ask(rl, `Create a LOADLIB (Y/N - defaults to Y): `) || createLoadLibDefault;
            const defaultLoadLib: IDatasetAttributes = { ...Defaults.LOADLIB_ATTRIBUTES };
            defaultLoadLib.name = `${dataSetHLQ.toUpperCase()}.${defaultLoadLib.name}`;

            // Prompt to copy templates?
            const copyTemplatesDefault: string = "Y";
            const copyTemplates: string = await this.ask(rl, `Copy source and make templates (Y/N - defaults to Y): `) || copyTemplatesDefault;

            // Build the properties file.
            let properties: IZosMakeProperties = {
                sshProfile,
                zosmfProfile,
                localSrcDir,
                localOutDir,
                remoteProjectRoot: remoteProjectDir,
                zfs: {
                    name: `${dataSetHLQ.toUpperCase()}.PUBLIC.ZOSMAKE.ZFS`,
                    cylsPri: (zfsSize.trim() === "") ? parseInt(zfsSizeDefault, 10) : parseInt(zfsSize, 10),
                    volumes: (zfsVolumes.trim() === "") ? undefined : zfsVolumes.toUpperCase().split(" ")
                },
                dataSets: [(createLoadLib.trim() === createLoadLibDefault) ? defaultLoadLib : undefined]
            };

            // Add anything else from the defaults
            properties = { ...Defaults.PROPERTIES, ...properties };

            // Remove anything that is undefined
            if (properties.dataSets === undefined) {
                delete properties.dataSets;
            }
            if (properties.zfs.volumes === undefined) {
                delete properties.zfs.volumes;
            }

            // If the loadlib was specified, then add the copy property to the config
            if (createLoadLib === "Y") {
                properties.copy = [
                    {
                        dataSet: defaultLoadLib.name,
                        remoteDir: "out/loadlib/"
                    }
                ];
            }

            // Write properties file
            Properties.write(properties);

            // Create the project directories and copy the templates if asked.
            Files.createLocalProjectDirs();
            if (copyTemplates.trim() === copyTemplatesDefault) {
                Files.copySrcTemplatesToLocalProject();
            }

            // Give the user some feedback
            params.response.console.log(`\nProperties written to "${Properties.path}"`);
            params.response.console.log(`Review the properties file to ensure correctness.`);
            params.response.console.log(`Run "zowe zos-make setup" to create the z/OS environment.`);
        } catch (e) {
            throw e;
        } finally {
            // Close the readline
            rl.close();
        }
    }

    /**
     * Ask the user a question and obtain a response.
     * @param rl The readline interface object that was previously created.
     * @param question The question to ask.
     */
    private ask(rl: readline.ReadLine, question: string): Promise<string> {
        return new Promise<string>((answered) => {
            rl.question(question, (answer: string) => {
                answered((answer == null || answer.trim() === "") ? "" : answer);
            });
        });
    }
}
