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

import { ZosmfSession, IJob, SubmitJobs } from "@zowe/cli";
import { Files } from "..";

export class Jobs {
    /**
     * Submits a local JCL file and downloads the output to the project
     * spool output directory.
     * @param session The session object for submitting the JCL.
     * @param filepath The file path to the JCL.
     */
    public static async submitLocalFile(session: ZosmfSession, filepath: string, spoolDir: string): Promise<IJob> {
        const jcl: string = Files.readFileSync(filepath);
        const response = await SubmitJobs.submitJclString(session as any, jcl, {
            jclSource: undefined,
            directory: spoolDir
        });
        return response as IJob;
    }
}
