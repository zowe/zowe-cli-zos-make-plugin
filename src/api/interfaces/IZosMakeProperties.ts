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

import { IZfsAttributes } from "./IZfsAttributes";
import { IDatasetAttributes } from "./IDatasetAttributes";
import { IZosMakeCopy } from "./IZosMakeCopy";

/**
 * z/OS make properties mapping.
 */
export interface IZosMakeProperties {
    /**
     * The z/OSMF profile name to use for the project. The profile must already
     * exist and must "point to" the same system as the "sshProfile".
     */
    zosmfProfile: string;
    /**
     * The SSH profile name to use for the project. The profile must already
     * exist and must "point to" the same system as the "zosmfProfile".
     */
    sshProfile: string;
    /**
     * The local project directory containing the z/OS source to build using
     * make. The default is "zos-make-src". The make file should exist in the
     * root of this directory.
     */
    localSrcDir: string;
    /**
     * The local project output directory. This directory should be git ignored
     * and will contain any output, temporary, etc. files that zos-make needs
     * for work.
     */
    localOutDir: string;
    /**
     * The USS project directory that will be created via "mkdir -p". Once
     * created, the project ZFS will be mounted against this directory. Source
     * files will be uploaded to this directory/zfs for make.
     */
    remoteProjectRoot: string;
    /**
     * The attributes for the ZFS to create. The ZFS serves as the mount
     * filesystem for "remoteProjectDir".
     */
    zfs: IZfsAttributes;
    /**
     * Additional directories to be created in the "remoteProjectDir". All
     * directories will be created relative to "remoteProjectDir". It will
     * not create absolute directories.
     */
    remoteProjectDirs?: string[];
    /**
     * Data-sets to create for the project. For example, a LOADLIB. You can
     * reference the data-sets created in your make file for output objects,
     * load modules, etc.
     */
    dataSets?: IDatasetAttributes[];
    /**
     * If the option is specified, copies build artifacts/files from the USS
     * project directory specified to the data-set specified. This is useful
     * if you want move obj-code, modules, or even source files from USS
     * to data-sets.
     */
    copy?: IZosMakeCopy[];
    /**
     * The remote listings directory. Expected to be a relative directory
     * in the "remoteProjectDir". If this property is specified, after make,
     * The listings will be retrieved to the "localOutDir/listings" local
     * project directory.
     */
    remoteListingsDir?: string;
    /**
     * The number of listings directories to keep. The listings directories
     * will be removed based on their creation time, so the newest "keep" number
     * of listing directories will be present in the output directory. The
     * default is 5.
     */
    keepListings?: number;
    /**
     * Additional parameters to add after "make". Use this to specify additional
     * environment variables, targets, etc. If make parameters are specified on
     * the command line, those will take precedence over these.
     */
    makeParms?: string;
}
