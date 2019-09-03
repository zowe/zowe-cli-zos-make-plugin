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

import { ZosmfSession, ZosmfRestClient } from "@zowe/cli";
import { IZfsAttributes } from "./interfaces/IZfsAttributes";
import { ImperativeExpect } from "@zowe/imperative";
import { IZfsMountOptions } from "./interfaces/IZfsMountOptions";
import { IUSSFileSystemList } from "./interfaces/IUSSFileSystemList";
import * as path from "path";

export class Zfs {
    public static ZFS_RESOURCE: string = "/zosmf/restfiles/mfs/zfs";
    public static MOUNT_RESOURCE: string = "/zosmf/restfiles/mfs";

    /**
     * List ZFS file systems.
     * @param session The z/OSMF session API object.
     * @param zfs The ZFS name.
     */
    public static async list(session: ZosmfSession, zfs: string): Promise<IUSSFileSystemList> {
        ImperativeExpect.toBeDefinedAndNonBlank(zfs, "ZFS Name", "You must specify the ZFS data-set name");
        const response: IUSSFileSystemList = await ZosmfRestClient.getExpectJSON(session as any, this.buildFsnameURI(zfs), []);
        return response;
    }

    /**
     * Creates a ZFS file system. The filesystem will be formatted and ready to
     * use when the API returns.
     * @param session The z/OSMF session object for the API.
     * @param attributes The ZFS attributes. See the interface for details.
     */
    public static async create(session: ZosmfSession, attributes: IZfsAttributes) {
        ImperativeExpect.keysToBeDefinedAndNonBlank(attributes, ["name"],
            "Property 'name' is required for the ZFS attributes.");
        const json = { ...attributes };
        delete json.name;
        const payload: string = JSON.stringify(json);
        const contentLen: number = payload.length;
        await ZosmfRestClient.postExpectString(session as any,
            this.buildZFSURI(attributes.name), [{ "Content-Length": contentLen }], payload);
    }

    /**
     * Mount a ZFS to a USS directory.
     * @param session The z/OSMF session for the API request.
     * @param options The options. See the interface for details.
     */
    public static async mount(session: ZosmfSession, options: IZfsMountOptions) {
        ImperativeExpect.keysToBeDefinedAndNonBlank(options, ["name"],
            "Property 'name' is required for the ZFS mount.");
        ImperativeExpect.keysToBeDefinedAndNonBlank(options, ["mount-point"],
            "Property 'mount-point' is required for the ZFS mount.");
        ImperativeExpect.toBeOneOf(options.mode, ["rdonly", "rdwr"],
            "Property 'mode' is required and must be rdonly or rdwr.");
        const json: any = { ...options };
        delete json.name;
        json.action = "mount";
        const payload: string = JSON.stringify(json);
        const contentLen: number = payload.length;
        await ZosmfRestClient.putExpectString(session as any,
            this.buildMFSURI(options.name), [{ "Content-Length": contentLen }], payload);
    }

    public static async unmount(session: ZosmfSession, zfs: string) {
        ImperativeExpect.toNotBeNullOrUndefined(zfs, "ZFS data-set name is required for unmount.");
        const json: any = {action: "unmount"};
        const payload: string = JSON.stringify(json);
        const contentLen: number = payload.length;
        await ZosmfRestClient.putExpectString(session as any,
            this.buildMFSURI(zfs), [{ "Content-Length": contentLen }], payload);
    }

    /**
     * Check if a ZFS filesystem is mounted to a particular directory.
     * @param session The z/OSMF Session API object.
     * @param zfs The ZFS to check.
     * @param dir The directory to check.
     */
    public static async isMounted(session: ZosmfSession, zfs: string, dir: string): Promise<boolean> {
        let normalDir = path.posix.normalize(dir);
        normalDir = (normalDir.endsWith(path.posix.sep)) ? normalDir : normalDir + path.posix.sep;
        let mounted: boolean = false;
        let zfsList: IUSSFileSystemList;
        try {
            zfsList = await Zfs.list(session, zfs);
            for (const entry of zfsList.items) {
                const entryDir: string = (entry.mountpoint.endsWith(path.posix.sep)) ? entry.mountpoint : entry.mountpoint + path.posix.sep;
                // Straight equality won't work in all cases here, some directories can be mounted via
                // /tmp/test for example, but the actual directory resolves to /SYSTEM/tmp/test. This
                // Check isn't 100% foolproof, but it's good enough
                if (entry.name.toUpperCase() === zfs.toUpperCase() && entryDir.endsWith(normalDir)) {
                    mounted = true;
                    break;
                }
            }
        } catch (err) {
            if (err.errorCode.toString() !== "404") {
                throw err;
            }
        }
        return mounted;
    }

    /**
     * Delete a ZFS.
     * @param session The z/OSMF session object for the API.
     * @param zfs The name of the data set.
     */
    public static async delete(session: ZosmfSession, zfs: string) {
        ImperativeExpect.toNotBeNullOrUndefined(zfs, "ZFS data-set name is required for delete.");
        await ZosmfRestClient.deleteExpectString(session as any, this.buildZFSURI(zfs));
    }

    /**
     * Builds the z/OSMF USS files API resource.
     * @param zfs The ZFS data set name.
     */
    private static buildZFSURI(zfs: string): string {
        return `${this.ZFS_RESOURCE}/${zfs.toUpperCase()}`;
    }

    /**
     * Builds the z/OSMF USS mount API resource.
     * @param zfs The ZFS data set name.
     */
    private static buildMFSURI(zfs: string) {
        return `${this.MOUNT_RESOURCE}/${zfs.toUpperCase()}`;
    }

    /**
     * Builds the z/OSMF USS list filesystems by ZFS API.
     * @param zfs The ZFS data set name.
     */
    private static buildFsnameURI(zfs: string) {
        return `${this.MOUNT_RESOURCE}/?fsname=${zfs.toUpperCase()}`;
    }
}
