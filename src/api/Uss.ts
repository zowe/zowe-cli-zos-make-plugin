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

import { SshSession, Shell, ZosmfSession, List, IZosFilesResponse, Delete, Download } from "@zowe/cli";
import { ImperativeError } from "@zowe/imperative";
import { DataSet } from "./DataSet";
import * as path from "path";
import { Utils } from "./Utils";

export class Uss {
    // Hard coded max to speed up the retrieve, but not overload with TSO address spaces
    public static MaxConcurrentDownloads: number = 6;  // eslint-disable-line @typescript-eslint/no-magic-numbers

    // List of directories that should never be rm. Used as a "just in case" check
    public static INVALID_RM_DIRS: string[] = [
        "",
        "/",
        "/bin",
        "/boot",
        "/dev",
        "/etc",
        "/tmp",
        "/sys",
        "/lib",
        "/opt",
        "/root",
        "/proc",
        "/sbin",
        "/usr",
        "/usr/doc",
        "/usr/info",
        "/usr/lib",
        "/var"
    ];

    /**
     * Submits a the mkdir -p command to create a USS directory. The directory
     * is expected to be the absolute path.
     * @param session The session for the API.
     * @param dir The absolute path.
     */
    public static async mkdirp(session: SshSession, dir: string) {
        let stdout: string = "";
        const rc = await Shell.executeSsh(session, `mkdir -p ${dir}`, (data: string) => {
            stdout += data;
        });
        if (rc !== 0) {
            throw new ImperativeError({ msg: `USS mkdir -p command failed.`, additionalDetails: stdout });
        }
    }

    /**
     * Copy the files from a remote USS directory to a local directory. Only
     * copies files and ignores any directories, etc.
     * @param session The z/OSMF session object for the API.
     * @param remoteDir The remote USS directory containing the the files.
     * @param localDir The local directory to copy the files.
     * @param maxConcurrent The max number of concurrent downloads for the listings.
     */
    public static async cpDirToLocal(session: ZosmfSession, remoteDir: string, localDir: string, maxConcurrent = Uss.MaxConcurrentDownloads) {
        const lsDir: string = Uss.dirUrl(remoteDir);
        const response: IZosFilesResponse = await List.fileList(session as any, lsDir);
        if (response.success !== true) {
            throw new ImperativeError({ msg: `USS ls failed.`, additionalDetails: response.commandResponse });
        }

        // Build a list of listing files to download
        const listings: any[] = [];
        for (const entry of response.apiResponse.items) {
            if (entry.mode.startsWith("-")) {
                const remotePath: string = path.posix.normalize(`${lsDir}/${entry.name}`);
                const localPath: string = path.join(localDir, entry.name);
                listings.push({
                    remotePath,
                    localPath
                });
            }
        }

        // Function to create the download promise for asyncPool
        const dlPromise = (dl: { remotePath: string, localPath: string }) => {
            return Download.ussFile(session as any, dl.remotePath, { file: dl.localPath });
        };

        // Await the download pool
        if (maxConcurrent === 0) {
            await Promise.all(listings.map(dlPromise));
        } else {
            await Utils.asyncPool(maxConcurrent, listings, dlPromise);
        }
    }

    /**
     * Accepts the input directory and issues make command.
     * @param session The session for the SSH API.
     * @param dir The directory with the makefile.
     * @param stdoutHandler The stdout handler.
     */
    public static async make(session: SshSession, dir: string, stdoutHandler: (data: string) => void, parms?: string) {
        return Shell.executeSsh(session, `cd ${dir} && make ${(parms != null) ? parms : ""}`, stdoutHandler);
    }

    /**
     * Remote any files in the specified directory.
     * @param zosmfSession The z/OSMF session object for the API.
     * @param dir The remote directory to rm the files.
     */
    public static async rmFilesInDir(zosmfSession: ZosmfSession, dir: string) {
        const lsDir: string = Uss.dirUrl(dir);
        Uss.checkDoNotDelete(lsDir);
        const response: IZosFilesResponse = await List.fileList(zosmfSession as any, lsDir);
        if (response.success !== true) {
            throw new ImperativeError({ msg: `USS ls failed.`, additionalDetails: response.commandResponse });
        }
        for (const entry of response.apiResponse.items) {
            if (entry.mode.startsWith("-")) {
                const rmpath = path.posix.normalize(`${dir}/${entry.name}`);
                await Delete.ussFile(zosmfSession as any, rmpath, false);
            }
        }
    }

    /**
     * As a saftey/sanity check, we'll make sure that a request to delete an
     * "important" directory is never made.
     * @param dir Directory with no trailing slash
     */
    public static checkDoNotDelete(dir: string) {
        Uss.INVALID_RM_DIRS.forEach((invalid) => {
            if (dir.trim() === invalid) {
                throw new ImperativeError({msg: `Will not remove directory: "${dir}"`});
            }
        });
    }

    /**
     * Copy files from a uss dir to a dataset. Non-recursive. Skips any
     * directories that might show up in the ls.
     * @param session The SSH session object for the API.
     * @param zosmfSession The z/OSMF Session object for the API.
     * @param dir The USS directory expected to contain the load modules (only)
     * @param ds The loadlib dataset.
     */
    public static async cpDirToDataset(session: SshSession, zosmfSession: ZosmfSession, dir: string, ds: string): Promise<number> {
        if (!(await DataSet.exists(zosmfSession, ds))) {
            throw new ImperativeError({ msg: `cp to data set error.`, additionalDetails: `"${ds}" does not exist.` });
        }
        const lsDir: string = Uss.dirUrl(dir);
        const response: IZosFilesResponse = await List.fileList(zosmfSession as any, lsDir);
        if (response.success !== true) {
            throw new ImperativeError({ msg: `USS ls failed.`, additionalDetails: response.commandResponse });
        }
        let count = 0;
        for (const entry of response.apiResponse.items) {
            if (entry.mode.startsWith("-")) {
                const filepath = path.posix.normalize(`${dir}/${entry.name}`);
                await Uss.cp(session, filepath, `//"'${ds}'"`);
                count++;
            }
        }
        return count;
    }

    /**
     * Issues an ls command against the directory specified.
     * @param dir The directory to list files.
     * @param session The SSH session for the API.
     */
    public static async ls(session: SshSession, dir: string): Promise<string[]> {
        let stdout: string = "";
        const cmd: string = `ls ${dir}`;
        const rc = await Shell.executeSsh(session, cmd, (data: string) => {
            stdout += data;
        });
        if (rc !== 0) {
            throw new ImperativeError({ msg: `USS ls command failed.`, additionalDetails: stdout });
        }

        const files: string[] = [];
        stdout.split("\n").forEach((line: string) => {
            if (line.indexOf(cmd) < 0 && line.trim().length !== 0) {
                line.split(" ").forEach((file: string) => {
                    files.push(file.trim());
                });
            }
        });

        return files;
    }

    /**
     * Copy a USS file using the CP command.
     * @param session The SSH session.
     * @param src The source file to copy.
     * @param dest The destination file.
     */
    public static async cp(session: SshSession, src: string, dest: string) {
        let stdout: string = "";
        const rc = await Shell.executeSsh(session, `cp ${src} ${dest}`, (data: string) => {
            stdout += data;
        });
        if (rc !== 0) {
            throw new ImperativeError({ msg: `USS cp command failed.`, additionalDetails: stdout });
        }
    }

    /**
     * We cannot provide a trailing slash for the z/OSMF APIs, this function
     * checks and removes if necessary.
     * @param dir The dir to check.
     */
    public static dirUrl(dir: string): string {
        return (dir.endsWith(path.posix.sep)) ? dir.substr(0, dir.length - 1) : dir;
    }
}
