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

import { ICommandHandler, IHandlerParameters, IProfileLoaded, Imperative, IHandlerResponseApi } from "@zowe/imperative";
import { Files } from "../api/Files";
import { ZosmfSession, Upload, SshSession } from "@zowe/cli";
import { HandlerUtils } from "./HandlerUtils";
import { Properties } from "../api/Properties";
import { MsgConstants } from "./MsgConstants";
const Wrap = require("word-wrap");
const chokidar = require("chokidar");

export default class WatchHandler implements ICommandHandler {

    // z/OSMF Session object for helper functions
    private mZosmfSession: any;

    // SSH Session object for helper functions
    private mSshSession: any;

    // Console API for helper functions
    private mConsole: IHandlerResponseApi["console"];

    // The wrap column for output text
    private mWrap: number = 120;  // eslint-disable-line @typescript-eslint/no-magic-numbers

    // The input copy parameter.
    private mCopy: boolean = false;

    // Additional parameters for make passed from the commandline.
    private mMakeParms: string;

    /**
     * Establish a file watcher for all z/OS source files, when a change occurs,
     * it will re-upload the file, run make, and deploy the loadmodules to the
     * LOADLIB.
     * @param params Command handler parameters.
     */
    public process(params: IHandlerParameters): Promise<void> {
        return new Promise<void>((resolve, reject) => {
            this.mCopy = params.arguments.copy;
            this.mWrap = params.arguments.wrap;
            this.mConsole = params.response.console;
            this.mMakeParms = params.arguments.makeParms;
            Imperative.api.profileManager("zosmf").load({ name: Properties.get.zosmfProfile })
                .then((zosmfLoadResp: IProfileLoaded) => {
                    this.mZosmfSession = ZosmfSession.createBasicZosmfSession(zosmfLoadResp.profile);
                    Imperative.api.profileManager("ssh").load({ name: Properties.get.sshProfile }).then((sshLoadResp: IProfileLoaded) => {
                        this.mSshSession = SshSession.createBasicSshSession(sshLoadResp.profile);
                        this.consoleInfoMsg(`Watching src for changes...`);
                        this.watchSrc();
                    }).catch((err) => {
                        reject(err);
                    });
                }).catch((err) => {
                    reject(err);
                });
        });
    }

    /**
     * Establish the watcher on the all the source
     */
    private watchSrc() {
        const watcher = chokidar.watch(Files.localSrcDir, {
            persistent: true,
            ignoreInitial: true
        });
        watcher
            .on("add", (path: string) => this.performBuild(path, "added"))
            .on("change", (path: string) => this.performBuild(path, "changed"))
            .on("unlink", (path: string) => this.deleteFile(path));
    }

    // TODO: Implement the delete
    private async deleteFile(localSrcFile: string) {
        this.consoleWarnMsg("Delete function not implemented. Manually delete renamed or deleted files on USS.");
    }

    /**
     * When a file changes, perform the build and deploy.
     * @param localSrcFile The file that changed and must be uploaded.
     * @param action The string describing what happened to the file
     *               (changed, added, deleted, etc)
     */
    private async performBuild(localSrcFile: string, action: string) {
        try {
            this.consoleInfoMsg(`"${localSrcFile}" ${action}.`);
            const file: string = Files.convertToRemoteSrcFilePath(localSrcFile);
            await HandlerUtils.createRemoteSrcFileDirs(this.mZosmfSession, file);
            await Upload.fileToUSSFile(this.mZosmfSession, localSrcFile, file);
            await this.build();
        } catch (err) {
            this.consoleErrMsg(`Make Build Error:`);
            this.consoleErrMsg(err.message);
        }
    }

    /**
     * Builds the source on z/OS using "make". Returns true if make succeeded
     * with a zero return code.
     */
    private async build() {
        try {
            const rc = await HandlerUtils.make(this.mZosmfSession, this.mSshSession, this.mWrap, this.mConsole, this.mMakeParms);
            if (rc !== 0) {
                this.consoleErrMsg("");
                this.consoleErrMsg(`Make failed with exit code "${rc}". Review ${MsgConstants.tagZmMake} output above.`);
                this.consoleErrMsg("");
            } else {
                this.consoleInfoMsg("");
                this.consoleInfoMsg(`Make succeeded.`);
                this.consoleInfoMsg("");
                if (this.mCopy) {
                    await HandlerUtils.copy(this.mZosmfSession, this.mSshSession, this.mConsole);
                }
            }
        } catch (err) {
            this.consoleErrMsg(`Make Severe Error`);
            this.consoleErrMsg(err.message);
        }
    }

    /**
     * Print message with info tag/color.
     * @param msg The message text.
     */
    private consoleInfoMsg(msg: string) {
        const wrapped = Wrap(msg, { width: this.mWrap, trim: false, indent: "" });
        wrapped.split("\n").forEach((m: string) => {
            this.mConsole.log(`${MsgConstants.tagZmInfo} ${m}`);
        });
    }

    /**
     * Print message with error tag/color.
     * @param msg The message text.
     */
    private consoleErrMsg(msg: string) {
        const wrapped = Wrap(msg, { width: this.mWrap, trim: false, indent: "" });
        wrapped.split("\n").forEach((m: string) => {
            this.mConsole.error(`${MsgConstants.tagZmFail} ${m}`);
        });
    }

    /**
     * Print message with warn tag/color.
     * @param msg The message text.
     */
    private consoleWarnMsg(msg: string) {
        const wrapped = Wrap(msg, { width: this.mWrap, trim: false, indent: "" });
        wrapped.split("\n").forEach((m: string) => {
            this.mConsole.error(`${MsgConstants.tagZmWarn} ${m}`);
        });
    }
}
