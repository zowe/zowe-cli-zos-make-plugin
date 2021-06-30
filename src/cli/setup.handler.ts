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
    ConnectionPropsForSessCfg, ICommandHandler, IHandlerParameters, ISession,
    ITaskWithStatus, Session, TaskStage, TaskProgress
} from "@zowe/imperative";
import { Files } from "../api/Files";
import { ZosmfSession, SshSession } from "@zowe/cli";
import { Zfs } from "../api/Zfs";
import { Uss } from "../api/Uss";
import { DataSet } from "../api/DataSet";
import { Properties } from "../api/Properties";

export default class SetupHandler implements ICommandHandler {
    public static SIXTY_PERCENT: number = 60;

    /**
     * Performs project setup on z/OS by creating project directories on USS,
     * creating the project ZFS, and creating any data-sets requested.
     * @param params handler parameters from imperative
     */
    public async process(params: IHandlerParameters): Promise<void> {

        // Start the progress bar and load the profiles/create sessions
        const task: ITaskWithStatus = { percentComplete: 0, statusMessage: "Loading profiles", stageName: TaskStage.IN_PROGRESS };
        params.response.progress.startBar({ task });

        // create session for zosmf
        let sessCfg: ISession = ZosmfSession.createSessCfgFromArgs(params.arguments);
        let sessCfgWithCreds = await ConnectionPropsForSessCfg.addPropsOrPrompt<ISession>(
            sessCfg, params.arguments, {parms: params}
        );
        const zosmfSession = new Session(sessCfgWithCreds);

        // create session for ssh
        sessCfg = SshSession.createSshSessCfgFromArgs(params.arguments);
        sessCfgWithCreds = await ConnectionPropsForSessCfg.addPropsOrPrompt<ISession>(
            sessCfg, params.arguments, {parms: params}
        );
        const sshSession = new SshSession(sessCfgWithCreds);

        // Create the ZFS
        task.percentComplete = TaskProgress.TWENTY_PERCENT;
        task.statusMessage = `Creating ZFS "${Properties.get.zfs.name.toUpperCase()}"`;
        if (!(await DataSet.exists(zosmfSession, Properties.get.zfs.name))) {
            await Zfs.create(zosmfSession, Properties.get.zfs);
        }

        // Create the root project directory
        task.percentComplete = TaskProgress.FOURTY_PERCENT;
        task.statusMessage = "Creating root project USS directory";
        await Uss.mkdirp(sshSession, Properties.get.remoteProjectRoot);

        // Mount the ZFS
        task.percentComplete = SetupHandler.SIXTY_PERCENT;
        task.statusMessage = `Mounting ZFS`;
        if (!(await Zfs.isMounted(zosmfSession, Properties.get.zfs.name, Properties.get.remoteProjectRoot))) {
            await Zfs.mount(zosmfSession, {
                "name": Properties.get.zfs.name,
                "fs-type": "ZFS",
                "mode": "rdwr",
                "mount-point": Properties.get.remoteProjectRoot
            });
        }

        // Create other project directories
        task.percentComplete = TaskProgress.SEVENTY_PERCENT;
        task.statusMessage = "Creating additional USS project directories";
        await Uss.mkdirp(sshSession, Files.remoteOutDir);
        await Uss.mkdirp(sshSession, Files.remoteListingsDir);
        await Uss.mkdirp(sshSession, Files.remoteLoadlibDir);
        if (Properties.get.remoteProjectDirs != null) {
            for (const dir of Properties.get.remoteProjectDirs) {
                await Uss.mkdirp(sshSession, Files.buildRemoteProjectDir(dir));
            }
        }

        // Create any of the requested data-sets.
        task.percentComplete = TaskProgress.EIGHTY_PERCENT;
        for (const ds of Properties.get.dataSets) {
            task.statusMessage = `Creating "${ds.name}"`;
            if (!(await DataSet.exists(zosmfSession, ds.name))) {
                await DataSet.create(zosmfSession, ds);
            }
        }

        // End bar and give a confirmation message.
        params.response.progress.endBar();
        params.response.console.log("Project z/OS setup complete.");
    }
}
