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
 * Mount options for the mount command. Besides name, the rest are documented
 * in the z/OSMF guides.
 */
export interface IZfsMountOptions {
    /**
     * The name of the ZFS to mount.
     */
    name: string;
    /**
     * The USS directory to mount the ZFS.
     */
    "mount-point": string;
    /**
     * The file system type.
     */
    "fs-type": string;
    /**
     * readonly or readwrite.
     */
    mode: "rdonly" | "rdwr";
}
