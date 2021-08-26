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

import * as Handlebars from "handlebars";
import { Properties } from "../api/Properties";
import { Imperative, IProfileLoaded, ISession, Session } from "@zowe/imperative";
import { SshSession } from "@zowe/cli";

export class Utils {
    /**
     * Accepts the template and the properties and returns the rendered string.
     * @param properties Properties to use in the render
     * @param template The template string
     */
    public static render(properties: any, template: string): string {
        const templateRenderer: Handlebars.TemplateDelegate = Handlebars.compile(template, { noEscape: true });
        return templateRenderer(properties);
    }

    /**
     * Execute multiple promises in a pool with a maximum number of promises
     * executing at once
     * @param poolLimit - limit of how many promises should execute at once
     * @param array - array of objects to convert to promises with iteratorFn
     * @param iteratorFn - the function that turns an entry in the array into a promise
     */
    public static asyncPool(poolLimit: number, array: any[],
        iteratorFn: (item: any, array: any[]) => Promise<any>): Promise<any> {
        let i = 0;
        const ret: any[] = [];
        const executing: any[] = [];
        const enqueue: any = () => {
            if (i === array.length) {
                return Promise.resolve();
            }
            const item = array[i++];
            const p = Promise.resolve().then(() => iteratorFn(item, array));
            ret.push(p);
            const e: any = p.then(() => executing.splice(executing.indexOf(e), 1));
            executing.push(e);
            let r = Promise.resolve();
            if (executing.length >= poolLimit) {
                r = Promise.race(executing);
            }
            return r.then(() => enqueue());
        };
        return enqueue().then(() => Promise.all(ret));
    }

    /**
     * Create a zosmf session from profile properties.
     * @returns A zosmf session
     */
    public static async createZosmfSession(): Promise<Session> {
        // Todo:
        // This plugin does not define its connection properties as command line
        // arguments (as is the Zowe convention). So createSessCfgFromArgs
        // does not pick up values from the profile. We should define command-
        // line arguments, but for now, we just use profileManager.load
        // to get the needed properties and put them into sessCfg by hand.
        // Once command-line args are defined:
        //      - Add a parmaeter (like cmdHndlrParms: IHandlerParameters) to this function.
        //      - Then the following code can be used instead:
        //
        // const sessCfg: ISession = ZosmfSession.createSessCfgFromArgs(cmdHndlrParms.arguments);
        // const sessCfgWithCreds = await ConnectionPropsForSessCfg.addPropsOrPrompt<ISession>(
        //    sessCfg, cmdHndlrParms.arguments, {parms: cmdHndlrParms, doPrompting: false}
        // );
        // return new Session(sessCfgWithCreds);

        const profMgrLoad: IProfileLoaded = await Imperative.api.profileManager("zosmf")
            .load({ name: Properties.get.zosmfProfile });
        const sessCfg: ISession = {};
        sessCfg.hostname           = profMgrLoad.profile.host;
        sessCfg.port               = profMgrLoad.profile.port;
        sessCfg.user               = profMgrLoad.profile.user;
        sessCfg.password           = profMgrLoad.profile.password;
        sessCfg.rejectUnauthorized = profMgrLoad.profile.rejectUnauthorized;
        sessCfg.protocol           = profMgrLoad.profile.protocol;
        sessCfg.type               = "basic";
        return new Session(sessCfg);
    }

    /**
     * Create a SSH session from profile properties.
     * @returns A zosmf session
     */
    public static async createSshSession(): Promise<SshSession> {
        // Todo: See Todo from createZosmfSession.
        // Use SshSession.createSshSessCfgFromArgs instead.
        const profMgrLoad: IProfileLoaded = await Imperative.api.profileManager("ssh")
            .load({ name: Properties.get.sshProfile });
        const sessCfg: ISession = {};
        sessCfg.hostname           = profMgrLoad.profile.host;
        sessCfg.port               = profMgrLoad.profile.port;
        sessCfg.user               = profMgrLoad.profile.user;
        sessCfg.password           = profMgrLoad.profile.password;
        sessCfg.rejectUnauthorized = profMgrLoad.profile.rejectUnauthorized;
        sessCfg.protocol           = profMgrLoad.profile.protocol;
        sessCfg.type               = "basic";
        return new SshSession(sessCfg);
    }
}
