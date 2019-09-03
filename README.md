# z/OS Make Zowe CLI Plugin

The z/OS make plugin manages the details of creating a USS workspace (ZFS and directories) and building your project source (HLASM, C/C++, COBOL, PLI, etc.) on USS with `make`. The plugin strives to emulate a local build experience by automating and hiding mainframe details, allowing you to focus on writing your z/OS code. 

The plugin is "project centric". Meaning, you create and customize (via the `zowe zm init` command) a `zos-make.json` properties file that describes some simple details for each project (e.g. the projects remote root directory). 

To get started read through the README. For a detailed walkthrough, checkout the [tutorial](./docs/tutorial.md).

## Building and Installing from Source
1. `npm install`
2. `npm run build`
3. `zowe plugins install .` (from the root of the project)

## Prerequisites
### Local (Your PC)
- A Zowe-CLI z/OSMF profile
- A Zowe-CLI SSH profile (hostname must match the z/OSMF hostname)
### Remote (Mainframe)
- You must have a USS segment for your TSO ID
- You must have SSH connectivity to the mainframe LPAR
- The `make` binary must be available and in your SSH users PATH 

## Getting Started
Once you have the plugin installed, you can start a blank project OR start using the plugin for an existing project. Customize the `zos-make.json` file to suit your needs. Either way, the process is the same: 

Step | Command/Action | Description
---|---|---
1 | `zowe zm init` | Prompts you to answer some simple questions to configure the project. Once completed, a `zos-make.json` properties file will be created in the directory where the command was issued (your project directory). 
2 | Review `zos-make.json` | Make sure that the properties file looks correct for your project before continuing. 
3 | `zowe zm setup` | This step will create the project workspace on USS (creates a ZFS and mount point, mounts the ZFS, creates project directories, etc.)
4 | `zowe zm upload` | Uploads your source from your local project (`localSrcDr`) to `<remoteProjectRoot>/src`
5 | `zowe zm make` | Executes `make` on the `makefile` on USS (`<remoteProjectRoot>/src`) to build the project

If requested, the `init` command will copy an example `makefile` and example HLASM/C source files to get you started.

### Making Code Changes

Use `zowe zm watch` to upload and `make` as files are changed in your `localSrcDir`.

### Cleaning up 

Use `zowe zm cleanup` to cleanup z/OS environment when you're finished coding.

## zos-make.json Properties File

The properties file configures the behavior of the CLI plugin.

**Example:**
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

The example properties file creates a project on USS with ZFS `JASON.PUBLIC.ZOSMAKE.ZFS` that is mounted to `/z/jason/zosmake` during `zowe zm setup`. 

Source files contained in the local projects `localSrcDir` are uploaded to USS during `zowe zm upload` or `zowe zm watch`. 

In the makefile sample, the compilers place listings in the `remoteListingsDir` (resolves to `/z/tucj02/zosmake/out/listings`). By having this property specified, the plugin will download any listings produced after `make` is executed to the local `<localOutDir>/listings` project directory.

The `dataSets` property instructs the plugin to create the specified data-sets during `setup`.

The `copy` property instructs the plugin to copy any artifacts placed in `/z/jason/zosmake/out/loadlib` after a successful `make` to `JASON.PUBLIC.ZOSMAKE.LOADLIB`. You can also configure you makefile to output artifacts directly to z/OS data-sets.

See [IZosMakeProperties.ts](src/api/interfaces/IZosMakeProperties.ts) for a full explanation of all properties.
