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

import { IZosMakeProperties } from "./interfaces/IZosMakeProperties";
import { IZfsAttributes } from "./interfaces/IZfsAttributes";
import { IDatasetAttributes } from "./interfaces/IDatasetAttributes";

export class Defaults {

    // Default attributes for z/OS load library
    public static readonly LOADLIB_ATTRIBUTES: IDatasetAttributes = {
        name: "ZOSMAKE.LOADLIB",
        dsorg: "PO",
        alcunit: "CYL",
        primary: 10,
        secondary: 10,
        recfm: "U",
        blksize: 27998,
        lrecl: 27998,
        dirblk: 100
    };

    // Default attributes for the USS project ZFS
    public static readonly ZFS_ATTRIBUTES: IZfsAttributes = {
        name: "ZOSMAKE.ZFS",
        cylsPri: 10
    };

    // Default set of properties for a project
    public static readonly PROPERTIES: IZosMakeProperties = {
        sshProfile: "sshProfileName",
        zosmfProfile: "zosmfProfileName",
        localSrcDir: "zos-make-src",
        localOutDir: "zos-make-out",
        remoteProjectRoot: "/u/zosmake",
        remoteListingsDir: "out/listings",
        zfs: Defaults.ZFS_ATTRIBUTES,
        dataSets: [Defaults.LOADLIB_ATTRIBUTES]
    };
}
