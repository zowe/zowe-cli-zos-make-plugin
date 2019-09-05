# z/OS Make Zowe CLI Plugin

Use case: I have mainframe source code (C/C++, HLASM, COBOL, etc.) off platform in GitHub, BitBucket, my PC, or some other version control. I would like to use my preferred editor to code and quickly build my source on z/OS as I make changes. 

## Overview

The z/OS make plugin manages the details of creating a USS workspace (ZFS and directories) and allows you to build your project source (HLASM, C/C++, COBOL, PLI, etc.) on USS with `make` using your custom `makefile`. The plugin strives to emulate a local build experience by automating and hiding mainframe details allowing you to focus on writing code. 

The plugin is "project centric". Meaning, you create and customize (via the `zowe zm init` command) a `zos-make.json` properties file that describes some simple details for each project (e.g. the remote USS directory to use for the project).

To get started, read through the README and checkout a detailed walkthrough in the [tutorial](./docs/tutorial.md).

You can install the plugin from npm using:
```
zowe plugins install @zowe/zos-make-for-zowe-cli@latest
```

## Building and Installing the zos-make Plugin from Source
After you've cloned this project, navigate to the project directory and perform the following:
1. `npm install`
2. `npm run build`
3. `zowe plugins install .` 

The plugin should now be installed into Zowe CLI.

## Prerequisites
### Local (Your PC)
- A Zowe-CLI z/OSMF profile
- A Zowe-CLI SSH profile (hostname must match the z/OSMF hostname)
### Remote (Mainframe)
- You must have a USS segment for your TSO ID
- You must have SSH connectivity to the mainframe LPAR
- The `make` binary must be available and in your SSH users PATH 
- The included sample `makefile` uses the `xlc`, `as`, and `ld` command line compilers/linkers on USS

## Getting Started
Once you have the plugin installed, you can start a blank project OR start using the plugin for an existing project. Customize the `zos-make.json` file to suit your needs. Either way, the process is the same: 

Step | Command/Action | Description
---|---|---
1 | `zowe zm init` | Prompts you to answer some simple questions to configure the project. Once completed, a `zos-make.json` properties file will be created in the directory where the command was issued (your project directory). 
2 | Review/Customize `zos-make.json` | Make sure that the properties file looks correct for your project before continuing. 
3 | `zowe zm setup` | This step will create the project workspace on USS (creates a ZFS and mount point, mounts the ZFS, creates project directories, etc.)
4 | `zowe zm upload` | Uploads your source from your local project (`localSrcDr`) to `<remoteProjectRoot>/src`
5 | `zowe zm make` | Executes `make` on the `makefile` on USS (`<remoteProjectRoot>/src`) to build the project

If requested, `zowe zm init` will copy an example `makefile` and example HLASM/C source files to get you started.

## Making Code Changes

Use `zowe zm watch` to upload and `make` as files are changed in your `localSrcDir`. This is the fastest and most seamless way to build your source as you code.

Use the `--copy` option on `zowe zm watch` to have executables (load modules) copied to your LOADLIB after make completes with a exit code of 0.

## Viewing Listings
If you have configured the `remoteListingsDir` in your `zos-make.json` to point to the directory where the `makefile` commands place listings, the plugin will automatically download them after a build (`zowe zm make` or `zowe zm watch`). Listings are downloaded to a time/date stamped directory in the `<localOutDir>/listings` directory. 

For example, if you choose to copy the sample `makefile` during `zowe zm init`, the commands in the `makefile` place the listings in `<remoteProjectDir>/out/listings`:
```
OUTPUTDIR=../out
LISTINGSDIR=$(OUTPUTDIR)/listings

# Assemble the sample program
$(OUTPUTDIR)/sample.o: $(ASMSOURCE)/sample.asm
	$(ASM) $(ASMFLAGS) -a=$(LISTINGSDIR)/sample.asm.lst $(ASMINCLUDE) -o $@ $^
```
The `remoteListingsDir` property is set to the relative directory `out/listings`. When a build completes, the plugin will automatically download listings in `<remoteProjectDir>/out/listings` to `<localOutDir>/listings` (in a date/time stamped folder). The plugin keeps a default of 5 local listing directories (this is configurable).

## Copying modules to a LOADLIB
You can instruct the plugin to create data sets during `zowe zm setup` by specifying an array of their attributes on the `dataSets` property in your `zos-make.json`. During `zowe zm init`, you'll be asked if you would like to create a LOADLIB (defaults to Y - yes). If you choose to create a LOADLIB, an additional property will be added to your `zos-make.json` config:
```
  "copy": [
    {
      "dataSet": "JASON.PUBLIC.ZOSMAKE.LOADLIB",
      "remoteDir": "out/loadlib/"
    }
  ]
```
The `copy` property instructs the plugin to copy any artifacts/files found at `<remoteProjectRoot>/out/loadlib` after a successful build (`zowe zm make` or `zowe zm watch --copy`) to the data set specified. In this case, the `makefile` is configured to place executables at `<remoteProjectRoot>/out/loadlib` and the `copy` property causes those executables (load modules) to be placed in the specified LOADLIB (`JASON.PUBLIC.ZOSMAKE.LOADLIB`).

Additionally, you can specify any remote project directory and any compatible data set in the `copy` array. For example, maybe you'd like to keep object code or listings in another data-set. 

The `copy` property is convenient, but you can also direct the commands in your `makefile` to output directly to data-sets. 

## Cleaning up 

Use `zowe zm cleanup` to cleanup z/OS environment when you're finished coding. This is a destructive command that will delete the ZFS and other data-sets specified in your `zos-make.json` config. Be aware of what you have specified. 

## zos-make.json Properties File Example

The properties file configures the behavior of the zos-make plugin. See [IZosMakeProperties.ts](src/api/interfaces/IZosMakeProperties.ts) for a full explanation of all properties.

**Example properties created from defaults during "zowe zm init":**
```
{
  "sshProfile": "mainframe1",
  "zosmfProfile": "mainframe1",
  "localSrcDir": "zos-make-src",
  "localOutDir": "zos-make-out",
  "remoteProjectRoot": "/z/jason/zosmake",
  "remoteListingsDir": "out/listings",
  "zfs": {
    "name": "JASON.PUBLIC.ZOSMAKE.ZFS",
    "cylsPri": 10,
    "volumes": [
      "TSU006"
    ]
  },
  "dataSets": [
    {
      "name": "JASON.PUBLIC.ZOSMAKE.LOADLIB",
      "dsorg": "PO",
      "alcunit": "CYL",
      "primary": 10,
      "secondary": 10,
      "recfm": "U",
      "blksize": 27998,
      "lrecl": 27998,
      "dirblk": 100
    }
  ],
  "copy": [
    {
      "dataSet": "JASON.PUBLIC.ZOSMAKE.LOADLIB",
      "remoteDir": "out/loadlib/"
    }
  ]
}
```

The above example properties will cause `zowe zm setup` to create a workspace on USS with ZFS `JASON.PUBLIC.ZOSMAKE.ZFS` (`zfs.name`) that is mounted to `/z/jason/zosmake` (`remoteProjectRoot`) during `zowe zm setup`. 

Source files and directories contained in the local projects `zos-make-src/` (`localSrcDir`) directory are uploaded to USS during `zowe zm upload` or `zowe zm watch` (as you save changes). 

In the `zos-make-src/makefile` (copied during `zowe zm init` by request), the compilers are configured to place listings at `/z/jason/zosmake/out/listings`. The plugin will download any listings produced after `zowe zm make` or `zowe zm watch` to the local `zos-make-out/listings` project directory.

The `dataSets` property instructs the plugin to create the LOADLIB data set `JASON.PUBLIC.ZOSMAKE.LOADLIB` during `zowe zm init`. 

The `copy` property instructs the plugin to copy any artifacts placed in `/z/jason/zosmake/out/loadlib` after a successful `zowe zm make` or `zowe zm watch --copy` to `JASON.PUBLIC.ZOSMAKE.LOADLIB`.

For a detailed walkthrough, checkout the [tutorial](./docs/tutorial.md).
