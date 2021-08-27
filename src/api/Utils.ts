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
}
