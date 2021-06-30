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
    ConnectionPropsForSessCfg, ICommandHandler, IHandlerParameters, ImperativeError,
    ISession, Session
} from "@zowe/imperative";
import { SshSession, ZosmfSession } from "@zowe/cli";
import { HandlerUtils } from "./HandlerUtils";
import { MsgConstants } from "./MsgConstants";

export default class MakeHandler implements ICommandHandler {
    private static readonly ERR_MSG: string = `Make failed`;

    // The wrap column for output text
    private mWrap: number = 120;

    // Additional parameters for make passed from the commandline.
    private mMakeParms: string;

    // Set the max concurrent downloads for listings
    private mMaxConcurrent: number;

    /**
     * Uses the SSH capabilities to submit make and get the response.
     * @param params handler parameters from imperative
     */
    public process(params: IHandlerParameters): Promise<void> {
        return new Promise<void>((resolve, reject) => {
            this.mMakeParms = params.arguments.makeparms;
            this.mMaxConcurrent = params.arguments.maxConcurrentListings;
            this.performMake(params).then(() => {
                resolve();
            }).catch((err) => {
                if (err instanceof ImperativeError) {
                    if (err.message === MakeHandler.ERR_MSG) {
                        reject();
                    } else {
                        reject(err);
                    }
                }
            });
        });
    }

    /**
     * Async version of the handler.
     * @param params Handler parameters.
     */
    private async performMake(params: IHandlerParameters) {
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

        // Perform make
        const rc = await HandlerUtils.make(zosmfSession, sshSession, this.mWrap, params.response.console, this.mMakeParms, this.mMaxConcurrent);

        // Throw an error if make failed
        if (rc !== 0) {
            process.exitCode = 1;
            params.response.console.log(`${MsgConstants.tagZmFail} Make failed with exit code "${rc}". ` +
                `Review ${MsgConstants.tagZmMake} output above.`);
            throw new ImperativeError({ msg: MakeHandler.ERR_MSG });
        }

        // Copy files to library if requested
        if (params.arguments.copy) {
            await HandlerUtils.copy(zosmfSession, sshSession, params.response.console);
        }
    }
}
