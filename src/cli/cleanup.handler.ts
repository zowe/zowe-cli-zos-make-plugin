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
    ICommandHandler,
    IHandlerParameters,
    ITaskWithStatus,
    TaskStage,
    IProfileLoaded,
    Imperative,
    TaskProgress
} from "@zowe/imperative";
import { ZosmfSession, Delete } from "@zowe/cli";
import { Zfs } from "../api/Zfs";
import { DataSet } from "../api/DataSet";
import { Properties } from "../api/Properties";

export default class CleanupHandler implements ICommandHandler {
    public static readonly SIXTY_PERCENT: number = 60;

    /**
     * Performs cleanup by unmounting the ZFS and deleting any datasets that were created.
     * @param params handler parameters from imperative
     */
    public async process(params: IHandlerParameters): Promise<void> {

        // Load the profile and create the sessions
        const status: ITaskWithStatus = {
            statusMessage: "Cleaning up...",
            percentComplete: 0,
            stageName: TaskStage.IN_PROGRESS
        };
        params.response.progress.startBar({ task: status });
        const zosmfLoadResp: IProfileLoaded = await Imperative.api.profileManager("zosmf").load({ name: Properties.get.zosmfProfile });
        const zosmfSession = ZosmfSession.createBasicZosmfSession(zosmfLoadResp.profile);

        // Unmount the data-set
        status.percentComplete = TaskProgress.FOURTY_PERCENT;
        status.statusMessage = `Unmount ${Properties.get.zfs.name}`;
        if ((await Zfs.isMounted(zosmfSession, Properties.get.zfs.name, Properties.get.remoteProjectRoot))) {
            await Zfs.unmount(zosmfSession, Properties.get.zfs.name);
        }

        // Delete the zfs
        status.percentComplete = CleanupHandler.SIXTY_PERCENT;
        status.statusMessage = `Deleting ${Properties.get.zfs.name}`;
        if ((await DataSet.exists(zosmfSession, Properties.get.zfs.name))) {
            await Zfs.delete(zosmfSession, Properties.get.zfs.name);
        }

        // Delete any datasets
        if (Properties.get.dataSets != null) {
            status.percentComplete = TaskProgress.EIGHTY_PERCENT;
            for (const ds of Properties.get.dataSets) {
                status.statusMessage = `Deleting ${ds.name}`;
                if ((await DataSet.exists(zosmfSession, ds.name))) {
                    await Delete.dataSet(zosmfSession, ds.name);
                }
            }
        }

        // Give positive response
        params.response.progress.endBar();
        params.response.console.log(`z/OS make environment cleaned.`);
    }
}
