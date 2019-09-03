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

/**
 * File system list entry, This is documented in the z/OSMF REST API guide.
 */
export interface IUSSFileSystemListEntry {
    name: string;
    mountpoint: string;
    fstname: string;
    status: string;
    mode: string[];
    dev: number;
    fstype: number;
    bsize: number;
    bavail: number;
    blocks: number;
    sysname: string;
    readibc: number;
    writeibc: number;
    diribc: number;
}
