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
 * Properties for copying USS files to data-sets
 */
export interface IZosMakeCopy {
    /**
     * The destination data set for the copy. The data-set must exist.
     */
    dataSet: string;
    /**
     * The relative USS project directory (from "remoteProjectDir"). You
     * cannot specify an absolute directory.
     */
    remoteDir: string;
}
