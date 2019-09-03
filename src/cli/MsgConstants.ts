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

import { TextUtils } from "@zowe/imperative";

export class MsgConstants {
    public static readonly ZM_MAKE: string = "ZM-MAKE";
    public static readonly ZM_INFO: string = "ZM-INFO";
    public static readonly ZM_FAIL: string = "ZM-FAIL";
    public static readonly ZM_LIST: string = "ZM-LIST";
    public static readonly ZM_COPY: string = "ZM-COPY";
    public static readonly ZM_WARN: string = "ZM-WARN";

    /**
     * Message [ZM-WARN] tag.
     */
    public static get tagZmWarn(): string {
        return `[${TextUtils.chalk.yellow(MsgConstants.ZM_WARN)}]`;
    }

    /**
     * Message [ZM-MAKE] tag.
     */
    public static get tagZmMake(): string {
        return `[${TextUtils.chalk.magenta(MsgConstants.ZM_MAKE)}]`;
    }

    /**
     * Message [ZM-INFO] tag.
     */
    public static get tagZmInfo(): string {
        return `[${TextUtils.chalk.green(MsgConstants.ZM_INFO)}]`;
    }

    /**
     * Message [ZM-FAIL] tag.
     */
    public static get tagZmFail(): string {
        return `[${TextUtils.chalk.red(MsgConstants.ZM_FAIL)}]`;
    }

    /**
     * Message [ZM-LIST] tag.
     */
    public static get tagZmList(): string {
        return `[${TextUtils.chalk.cyan(MsgConstants.ZM_LIST)}]`;
    }

    /**
     * Message [ZM-COPY] tag.
     */
    public static get tagZmCopy(): string {
        return `[${TextUtils.chalk.blue(MsgConstants.ZM_COPY)}]`;
    }
}
