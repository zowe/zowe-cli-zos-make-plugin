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

import {
    ICommandHandler, IHandlerParameters, ImperativeError, ITaskWithStatus, TaskStage
} from "@zowe/imperative";
import { Upload } from "@zowe/cli";
import { Files } from "../api/Files";
import { Utils } from "../api/Utils";
import * as path from "path";
import { Properties } from "../api/Properties";
import { Zfs } from "../api/Zfs";
import { HandlerUtils } from "./HandlerUtils";

export default class UploadHandler implements ICommandHandler {

    /**
     * Uploads source from your local project directory (indicated in zos-make.json)
     * to the remote projected directory (indicated in zos-make.json)
     * @param params handler parameters from imperative
     */
    public async process(params: IHandlerParameters): Promise<void> {

        // Load the profile and create the sessions
        const status: ITaskWithStatus = {
            statusMessage: "Uploading all files",
            percentComplete: 0,
            stageName: TaskStage.IN_PROGRESS
        };
        params.response.progress.startBar({task: status});

        const zosmfSession = await Utils.createZosmfSession();

        // Make sure that its mounted.
        if (!(await Zfs.isMounted(zosmfSession, Properties.get.zfs.name, Properties.get.remoteProjectRoot))) {
            throw new ImperativeError({msg: `Project ZFS and directory not mounted. Run "zowe zm setup".`});
        }

        // Upload everything
        if (params.arguments.srcFiles == null) {
            // I don't know why, but their handler had this code for the absolute path
            const inputDir: string = (path.isAbsolute(Files.localSrcDir) ? Files.localSrcDir : path.resolve(Files.localSrcDir));
            await Upload.dirToUSSDirRecursive(zosmfSession, inputDir, Files.remoteSrcDir, { task: status, maxConcurrentRequests: 5 });
        } else {
            for (const srcFile of params.arguments.srcFiles) {
                const file: string = Files.convertToRemoteSrcFilePath(srcFile);
                await HandlerUtils.createRemoteSrcFileDirs(zosmfSession, file);
                await Upload.fileToUSSFile(zosmfSession, srcFile, file);
            }
        }

        // Give positive response
        params.response.progress.endBar();
        params.response.console.log(`All source files uploaded.`);
    }
}
