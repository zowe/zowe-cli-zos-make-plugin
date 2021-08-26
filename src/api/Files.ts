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

import * as fs from "fs";
const mkdirp = require("mkdirp");
import * as path from "path";
import { ImperativeError } from "@zowe/imperative";
import { Properties } from "./Properties";
const rimraf = require("rimraf");

export class Files {

    // Constants and defaults for local and remote directories, files, etc.
    public static readonly SRC_DIR: string = "src";
    public static readonly MAKE_FILENAME: string = "make";
    public static readonly TEMPLATES_DIR: string = "templates";
    public static readonly LOCAL_PROJECT_DEFAULT_SRC: string = "zos-make-src";
    public static readonly LOCAL_PROJECT_DEFAULT_OUT: string = "zos-make-out";
    public static readonly OUT_DIR: string = "out";
    public static readonly LISTINGS_DIR: string = "listings";
    public static readonly LOADLIB_DIR: string = "loadlib";
    public static readonly DEFAULT_LISTINGS_KEEP: number = 5;
    public static readonly MAKE_OUTPUT_FILE: string = "make.output.txt";

    /**
     * Returns the path where the make output should be stored for this build.
     * The make output is the stdout/stderr from the USS make command.
     * @param outputDir The base output directory. Normally created with
     *                  "createLocalListingsDir()"
     */
    public static buildLocalMakeOutputFilePath(outputDir: string): string {
        return path.join(outputDir, Files.MAKE_OUTPUT_FILE);
    }

    /**
     * Wrapper for fs.writeFileSync.
     * @param contents The file contents.
     * @param filepath The file path.
     */
    public static writeFile(contents: string, filepath: string) {
        fs.writeFileSync(filepath, contents);
    }

    /**
     * Helper to create all the local project directories based on the input
     * properties file.
     */
    public static createLocalProjectDirs() {
        Files.createLocalOutputDir();
        Files.createLocalSrcDir();
    }

    /**
     * Given a full filepath, create the base directory.
     * @param fullPath
     */
    public static createFileDirs(fullPath: string) {
        const dir: string = path.dirname(fullPath);
        mkdirp.sync(dir);
    }

    /**
     * Create the directory and any sub directories
     * @param dir The directory path.
     */
    public static createDir(dir: string) {
        mkdirp.sync(dir);
    }

    /**
     * Given an input directory, return all directories within that directory.
     * @param dir The input directory to list all containing directories.
     */
    public static localLsDirs(dir: string): string[] {
        const isDirectory = (source: fs.PathLike) => fs.lstatSync(source).isDirectory();
        return fs.readdirSync(dir).map((name) => path.join(dir, name)).filter(isDirectory);
    }

    /**
     * To keep the listing directory from growing exponentially, remove the
     * oldest listings based on the number to "keep".
     * @param keep The number of listing directories to keep.
     */
    public static cleanOldLocalListings(keep: number) {
        if (isNaN(keep)) {
            throw new ImperativeError({msg: `"keep" input is not a number.`});
        }
        if (keep <= 0) {
            throw new ImperativeError({msg: `"keep" must be a positive number`});
        }
        const dirs: string[] = Files.localLsDirs(Files.localListingsDir);
        const stats: any = [];
        dirs.forEach((dir) => {
            stats.push({ stats: fs.statSync(dir), dir });
        });
        stats.sort((a: any, b: any) => {
            return (a.stats.ctime < b.stats.ctime) ? -1 : (a.stats.ctime > b.stats.ctime) ? 1 : 0;
        });
        const sorted: string[] = [];
        stats.forEach((stat: any) => {
            sorted.push(stat.dir);
        });
        if (sorted.length > keep) {
            const remove: number = sorted.length - keep;
            for (let i = 0; i < remove; i++) {
                const dir = stats.shift();
                rimraf.sync(dir.dir);
            }
        }
    }

    /**
     * Creates a new local listings directory in localOutputDir/listings with
     * a date/time stamp.
     */
    public static createLocalListingsDir(): string {
        const date = new Date();
        const dir = `makefile_date_${date.getFullYear()}-${date.getMonth() + 1}-${date.getDate()}_` +
            `time_${date.getHours()}-${date.getMinutes()}-${date.getSeconds()}_${date.getMilliseconds()}ms`;
        const fullpath = path.join(Files.localListingsDir, dir);
        Files.createDir(fullpath);
        return fullpath;
    }

    // "ussDir"/src/
    public static get remoteSrcDir(): string {
        return path.posix.normalize(`${Properties.get.remoteProjectRoot}/src`);
    }

    // "ussProjectOutDir"/
    public static get remoteOutDir(): string {
        return path.posix.normalize(`${Properties.get.remoteProjectRoot}/${Files.OUT_DIR}`);
    }

    // "remoteOutDir"/listings
    public static get remoteListingsDir(): string {
        return path.posix.normalize(`${Files.remoteOutDir}/${Files.LISTINGS_DIR}`);
    }

    // "remoteOutDir"/loadlib
    public static get remoteLoadlibDir(): string {
        return path.posix.normalize(`${Files.remoteOutDir}/${Files.LOADLIB_DIR}`);
    }

    // create "outDir"/
    public static createLocalOutputDir() {
        Files.createDir(Files.localOutputDir);
    }

    // create "srcDir"/
    public static createLocalSrcDir() {
        Files.createDir(Files.localSrcDir);
    }

    // "srcDir"/
    public static get localSrcDir(): string {
        return path.join(process.cwd(), Properties.get.localSrcDir);
    }

    // "outDir"/
    public static get localOutputDir(): string {
        return path.join(process.cwd(), Properties.get.localOutDir);
    }

    // "localOutDir"/listings
    public static get localListingsDir(): string {
        return path.join(Files.localOutputDir, Files.LISTINGS_DIR);
    }

    /**
     * Copies the source templates (C, HLASM, etc.) contained in the plugin
     * as a starting point/sample to the users local project.
     */
    public static copySrcTemplatesToLocalProject() {
        const srcTemplatesDir: string = path.join(__dirname, "..", "..", Files.TEMPLATES_DIR, Files.SRC_DIR);
        const files: string[] = Files.recursiveReaddir(srcTemplatesDir);
        files.forEach((file: string) => {
            const relative: string = file.split(srcTemplatesDir)[1];
            const projectFile: string = path.join(Files.localSrcDir, relative);
            Files.createFileDirs(projectFile);
            fs.copyFileSync(file, projectFile);
        });
    }

    /**
     * Given a local source file, convert the path to the remote file.
     * @param localFile The local z/OS source file to convert to the remote path.
     */
    public static convertToRemoteSrcFilePath(localFile: string): string {
        let file: string = localFile;
        if (file.indexOf(process.cwd()) < 0) {
            file = path.normalize(path.join(process.cwd(), localFile));
        }
        if (!fs.existsSync(file)) {
            throw new ImperativeError({ msg: `File "${file}" does not exist.` });
        }
        if (file.indexOf(Files.localSrcDir) !== 0) {
            throw new ImperativeError({ msg: `File "${file}" is not a source file.` });
        }
        let relative: string = file.split(Files.localSrcDir)[1];
        relative = relative.split("\\").join("/");
        return path.posix.normalize(path.posix.join(Files.remoteSrcDir, relative));
    }

    /**
     * Wrapper for fs.readFileSync
     * @param filepath The path of the file to read.
     */
    public static readFileSync(filepath: string): string {
        let contents: string = "";
        try {
            contents = fs.readFileSync(filepath).toString();
        } catch (err) {
            throw new ImperativeError({ msg: `Error reading file.`, additionalDetails: err.message });
        }
        return contents;
    }

    public static recursiveReaddir(dir: string, filelist: string[] = []) {
        fs.readdirSync(dir).forEach((file) => {
            filelist = fs.statSync(path.join(dir, file)).isDirectory()
                ? Files.recursiveReaddir(path.join(dir, file), filelist)
                : filelist.concat(path.join(dir, file));
        });
        return filelist;
    }

    /**
     * Construct a remote project directory: "remoteProjectRoot"/dir
     * @param dir The relative remote dir.
     */
    public static buildRemoteProjectDir(dir: string) {
        return path.posix.normalize(`${Properties.get.remoteProjectRoot}/${dir}`);
    }
}
