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

import { Files } from "../api/Files";
import { ZosmfSession, SshSession, Upload, Create } from "@zowe/cli";
import { Uss } from "../api/Uss";
import { IHandlerResponseApi, ImperativeError } from "@zowe/imperative";
import { MsgConstants } from "./MsgConstants";
import { Properties } from "../api/Properties";
import { Zfs } from "../api/Zfs";
import * as path from "path";
const Wrap = require("word-wrap");

/**
 * Common handler utils
 */
export class HandlerUtils {

    /**
     * Perform make on USS an retrive listings.
     * @param zosmfSession The z/OSMF session object for the APIs.
     * @param sshSession The SSH session object for the APIs.
     * @param makeTxtWrap The wrap width for make output
     * @param response The response object for the handler (console APIs).
     * @param makeParms Any additional parameters for make.
     */
    public static async make(zosmfSession: ZosmfSession, sshSession: SshSession, makeTxtWrap: number,
        response: IHandlerResponseApi["console"], makeParms?: string, maxConcurrent?: number): Promise<number> {

        // Check if its mounted.
        if (!(await Zfs.isMounted(zosmfSession, Properties.get.zfs.name, Properties.get.remoteProjectRoot))) {
            throw new ImperativeError({ msg: `Project ZFS and directory not mounted. Run "zowe zm setup".` });
        }

        // If the listings directory is present, clear it out before make
        if (Properties.get.remoteListingsDir != null) {
            const dir: string = Files.buildRemoteProjectDir(Properties.get.remoteListingsDir);
            await Uss.rmFilesInDir(zosmfSession, dir);
        }

        // Issue make
        let makeout: string = "";
        response.log(`${MsgConstants.tagZmMake}`);
        const rc: any = await Uss.make(sshSession, Files.remoteSrcDir, (output: string) => {
            output.split("\n").forEach((line: string) => {
                makeout += HandlerUtils.consoleMakeMsg(response, line, makeTxtWrap);
            });
        }, makeParms || Properties.get.makeParms);
        response.log(`${MsgConstants.tagZmMake}`);

        // Create the output directory and save the make output
        const outputDir = Files.createLocalListingsDir();
        const makeOutputPath = Files.buildLocalMakeOutputFilePath(outputDir);
        Files.writeFile(makeout, makeOutputPath);
        response.log(`${MsgConstants.tagZmList} Make output: "${makeOutputPath}"`);

        // Retrieve all the listings to the output directory.
        if (Properties.get.remoteListingsDir != null) {
            Files.cleanOldLocalListings((Properties.get.keepListings != null) ?
                Properties.get.keepListings : Files.DEFAULT_LISTINGS_KEEP);
            await Uss.cpDirToLocal(zosmfSession, Files.buildRemoteProjectDir(Properties.get.remoteListingsDir), outputDir);
            response.log(`${MsgConstants.tagZmList} Listings: "${outputDir}"`, maxConcurrent);
        }

        return rc;
    }

    /**
     * If the properties dictates it, copy files after make succeeds.
     * @param zosmfSession The z/OSMF session object for the APIs.
     * @param sshSession The SSH session object for the APIs.
     * @param response The response object for the handler (console APIs).
     */
    public static async copy(zosmfSession: ZosmfSession, sshSession: SshSession, response: IHandlerResponseApi["console"]) {
        if (Properties.get.copy != null) {
            for (const copy of Properties.get.copy) {
                const copied: number = await Uss.cpDirToDataset(sshSession, zosmfSession, Files.buildRemoteProjectDir(copy.remoteDir), copy.dataSet);
                response.log(`${MsgConstants.tagZmCopy} "${copied}" file(s) copied to "${copy.dataSet}".`);
            }
        }
    }

    /**
     * Given the full path of the LOCAL source file. Create the remote directories
     * recursively in the "src" directory as needed.
     * @param zosmfSession The z/OSMF session API object.
     * @param localFullPath The local file source path.
     */
    public static async createRemoteSrcFileDirs(zosmfSession: ZosmfSession, localFullPath: string) {
        if (!localFullPath.startsWith(Files.remoteSrcDir)) {
            throw new ImperativeError({
                msg: `Create directories failed.`,
                additionalDetails: `Request to upload "${localFullPath}", ` +
                    `but the directory does not exist with in the source directory "${Files.remoteSrcDir}"`
            });
        }
        const dir = path.posix.dirname(localFullPath);
        if (!(await Upload.isDirectoryExist(zosmfSession as any, dir))) {
            const relativeSrcDirs: string = path.posix.normalize(path.posix.dirname(localFullPath.substring(Files.remoteSrcDir.length)));
            const segments: string[] = relativeSrcDirs.split(path.posix.sep).filter((value: string) => {
                return (value.trim().length > 0);
            });
            let chkdir: string = path.posix.normalize(Files.remoteSrcDir + path.posix.sep);
            for (const seg of segments) {
                chkdir += (seg + path.posix.sep);
                chkdir = path.posix.normalize(chkdir);
                if (!(await Upload.isDirectoryExist(zosmfSession as any, chkdir))) {
                    await Create.uss(zosmfSession as any, chkdir, "directory");
                }
            }
        }
    }

    /**
     * Print make output with tag/color.
     * @param msg The output from the make command.
     */
    private static consoleMakeMsg(response: IHandlerResponseApi["console"], msg: string, wrap: number): string {
        let output: string = "";
        if (msg.trim().length !== 0) {
            const txt = `${msg.replace(/\s+$/, "")}\n`;
            const wrapped = Wrap(txt, { width: wrap, trim: false, indent: "" });
            wrapped.split("\n").forEach((m: string) => {
                response.log(`${MsgConstants.tagZmMake} ${m}`);
                output += `${m}\n`;
            });
        }
        return output;
    }
}
