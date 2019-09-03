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
 * The ZFS attributes. These are documented in the z/OSMF REST API guide,
 * except for name.
 */
export interface IZfsAttributes {
    /**
     * The file system data-set name.
     */
    name: string;
    owner?: number;
    group?: number;
    perms?: number;
    cylsPri?: number;
    cylsSec?: number;
    storageClass?: string;
    managementClass?: string;
    dataClass?: string;
    volumes?: string[];
}
