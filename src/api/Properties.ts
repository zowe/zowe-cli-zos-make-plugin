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

import * as path from "path";
import * as fs from "fs";
import { IZosMakeProperties } from "./interfaces/IZosMakeProperties";
import { ImperativeError, ImperativeExpect } from "@zowe/imperative";

export class Properties {
    public static readonly PROPERTIES_FILE: string = "zos-make.json";
    public static readonly PROPERTIES_FILE_ENV: string = "ZOS_MAKE_PROP";

    /**
     * Returns the file path to project properties. The path is either the
     * directory where the command was issued OR can be specified via the
     * environment variable ZOS_MAKE_PROP.
     */
    public static get path(): string {
        return path.join(process.cwd(), (process.env[Properties.PROPERTIES_FILE_ENV] == null) ?
            Properties.PROPERTIES_FILE : process.env[Properties.PROPERTIES_FILE_ENV]);
    }

    /**
     * Write the properties to the local project directory.
     * @param properties The properties object to serialize to disk.
     */
    public static write(properties: IZosMakeProperties) {
        fs.writeFileSync(Properties.path, JSON.stringify(properties, null, 2));
    }

    /**
     * Check if the properties file exists.
     */
    public static exists(): boolean {
        return fs.existsSync(Properties.path);
    }

    /**
     * Get the project properties.
     * @returns the project properties
     */
    public static get get(): IZosMakeProperties {
        if (Properties.mProperties == null) {
            try {
                if (fs.existsSync(Properties.path)) {
                    Properties.mProperties = JSON.parse(fs.readFileSync(Properties.path).toString());
                    Properties.validate(Properties.mProperties);
                } else {
                    throw new Error(`zos-make.json properties file does not exist. Run "zowe zos-make init".`);
                }
            } catch (err) {
                throw new ImperativeError({ msg: `Failed to load project properties (zos-make.json).`, additionalDetails: err.message });
            }
        }
        return Properties.mProperties;
    }

    /**
     * Do some simple validation of the properties.
     * @param properties The properties file to validate.
     */
    public static validate(properties: IZosMakeProperties) {
        ImperativeExpect.keysToBeDefinedAndNonBlank(properties, ["sshProfile"], "You must supply the 'sshProfile' property " +
            "(the name of the zowe-cli SSH profile to use).");
        ImperativeExpect.keysToBeOfType(properties, "string", ["sshProfile"], "The 'sshProfile' must be a string " +
            "(the name of the zowe-cli SSH profile to use).");

        ImperativeExpect.keysToBeDefinedAndNonBlank(properties, ["zosmfProfile"], "You must supply the 'zosmfProfile' property " +
            "(the name of the zowe-cli z/OSMF profile to use).");
        ImperativeExpect.keysToBeOfType(properties, "string", ["zosmfProfile"], "The 'zosmfProfile' must be a string " +
            "(the name of the zowe-cli z/OSMF profile to use).");

        ImperativeExpect.keysToBeDefinedAndNonBlank(properties, ["localSrcDir"], "You must supply the 'localSrcDir' property " +
            "(the local project directory for your z/OS source files).");
        ImperativeExpect.keysToBeOfType(properties, "string", ["localSrcDir"], "The 'localSrcDir' must be a string " +
            "(the local project directory for your z/OS source files).");

        ImperativeExpect.keysToBeDefinedAndNonBlank(properties, ["localOutDir"], "You must supply the 'localOutDir' property " +
            "(the local project directory for output files).");
        ImperativeExpect.keysToBeOfType(properties, "string", ["localOutDir"], "The 'localOutDir' must be a string " +
            "(the local project directory for output files).");

        ImperativeExpect.keysToBeDefinedAndNonBlank(properties, ["remoteProjectRoot"], "You must supply the 'remoteProjectRoot' property " +
            "(the fully qualified USS path for the root of the z/OS project).");
        ImperativeExpect.keysToBeOfType(properties, "string", ["remoteProjectRoot"], "The 'remoteProjectRoot' must be a string " +
            "(the fully qualified USS path for the root of the z/OS project).");

        if (properties.remoteListingsDir != null) {
            ImperativeExpect.keysToBeOfType(properties, "string", ["remoteListingsDir"], "The 'remoteListingsDir' must be a string " +
                "(the remote USS project directory containing listings).");
        }

        ImperativeExpect.keysToBeDefined(properties, ["zfs"], "You must supply the 'zfs' property " +
            "(the USS ZFS data-set attributes).");
        ImperativeExpect.keysToBeDefined(properties.zfs, ["name"], "You must supply the 'zfs.name' property " +
            "(the USS ZFS data-set name).");
        ImperativeExpect.keysToBeOfType(properties.zfs, "string", ["name"], "The ZFS data-set name must be a string.");

        if (properties.dataSets != null) {
            ImperativeExpect.keysToBeAnArray(properties, false, ["dataSets"], "The 'dataSets' property must be an array.");
            for (const ds of properties.dataSets) {
                ImperativeExpect.keysToBeDefinedAndNonBlank(ds, ["name"],
                    "For each 'dataSet' property, you must specify 'name' (the data-set name).");
            }
        }

        if (properties.remoteProjectDirs != null) {
            ImperativeExpect.keysToBeAnArray(properties, false, ["remoteProjectDirs"], "The 'remoteProjectDirs' property must be an array.");
            properties.remoteProjectDirs.forEach((dir: string, index: number) => {
                if (typeof dir !== "string") {
                    throw new ImperativeError({ msg: `Entry "${index}" of "remoteProjectDirs" is not a string.` });
                }
            });
        }

        if (properties.keepListings != null) {
            ImperativeExpect.keysToBeOfType(properties, "string", ["keepListings"], "The 'keepListings' property must be a number " +
                "(the number of listing directories to keep).");
        }

        if (properties.makeParms != null) {
            ImperativeExpect.keysToBeOfType(properties, "string", ["makeParms"], "The 'makeParms' property must be a string " +
                "(additional parameters to pass to make).");
        }
    }

    // The read and validated properties file
    private static mProperties: IZosMakeProperties;
}
