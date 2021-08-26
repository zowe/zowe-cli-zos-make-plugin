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

import {ICommandHandler, IHandlerParameters, Logger} from "@zowe/imperative";

export default class HealthHandler implements ICommandHandler {

    /**
   * This was added to satisfy the warning checks for plugins.
   * It does nothing at the moment.
   * @param params
   */
    public async process(params: IHandlerParameters): Promise<void> {
        Logger.getImperativeLogger().debug("Invoked health check handler");
    }
}
