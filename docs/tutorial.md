# Zos Make Plugin Tutorial
This is an in-depth step-by-step tutorial that explains the plugin and the process of creating a project.

## Starting a Project
Once you have the plugin installed. Create a blank directory on your local PC. In this example, we'll create a directory called `zmt`:

```
jason@jason-VirtualBox:~/projects/mainframe$ mkdir zmt
jason@jason-VirtualBox:~/projects/mainframe$ ls -la
total 12
drwxr-xr-x 3 jason jason 4096 Sep  3 09:59 .
drwxr-xr-x 6 jason jason 4096 Sep  3 08:34 ..
drwxr-xr-x 2 jason jason 4096 Sep  3 09:59 zmt
jason@jason-VirtualBox:~/projects/mainframe$ cd zmt
jason@jason-VirtualBox:~/projects/mainframe/zmt$ 
```

### zowe zm init
Once the directory has been created, we can initialize the project with the `zowe zm init` command:

```
jason@jason-VirtualBox:~/projects/mainframe/zmt$ zowe zm init
zowe-cli ZOSMF profile (defaults to mainframe1): 
zowe-cli SSH profile (defaults to mainframe1): 
Local project source directory (defaults to zos-make-src): 
Local output directory (defaults to zos-make-out): 
Remote project USS directory (required): /z/jason/zmt
Data set HLQ (required): JASON.PUBLIC.ZMT
ZFS data set primary in CYLS (defaults to 10): 
ZFS volumes (optional): TSU006
Create a LOADLIB (Y/N - defaults to Y): 
Copy source and make templates (Y/N - defaults to Y): 

Properties written to "/home/jason/projects/mainframe/zmt/zos-make.json"
Review the properties file to ensure correctness.
Run "zowe zos-make setup" to create the z/OS environment.
jason@jason-VirtualBox:~/projects/mainframe/zmt$
```

In our example, most of the defaults were taken. However, we specified the following:
- Our remote project directory root on USS will be `/z/jason/zmt`
- Our LOADLIB and ZFS data-set HLQ will be `JASON.PUBLIC.ZMT`
- We specified `TSU006` as the volume for the ZFS data-set

After the command executes, you will see the following files and directories in your project:
```
jason@jason-VirtualBox:~/projects/mainframe/zmt$ ls -la
total 20
drwxr-xr-x 4 jason jason 4096 Sep  3 10:01 .
drwxr-xr-x 3 jason jason 4096 Sep  3 09:59 ..
-rw-r--r-- 1 jason jason  584 Sep  3 10:01 zos-make.json
drwxr-xr-x 2 jason jason 4096 Sep  3 10:01 zos-make-out
drwxr-xr-x 5 jason jason 4096 Sep  3 10:01 zos-make-src
jason@jason-VirtualBox:~/projects/mainframe/zmt$ 
```

Since we answered "Y" to the init question regarding "Copy souce and make templates", it created and populated `zos-make-src/` with some sample HLASM and Metal C source, as well as a sample `makefile` to build:
```
jason@jason-VirtualBox:~/projects/mainframe/zmt$ cd zos-make-src/
jason@jason-VirtualBox:~/projects/mainframe/zmt/zos-make-src$ ls -la
total 24
drwxr-xr-x 5 jason jason 4096 Sep  3 11:08 .
drwxr-xr-x 4 jason jason 4096 Sep  3 11:08 ..
drwxr-xr-x 2 jason jason 4096 Sep  3 11:08 asmmac
drwxr-xr-x 2 jason jason 4096 Sep  3 11:08 asmpgm
-rw-r--r-- 1 jason jason 3101 Sep  3 11:08 makefile
drwxr-xr-x 2 jason jason 4096 Sep  3 11:08 metalc
```

In addition, in the root of the project it created a `zos-make-out/` directory, which will contain listings, etc. after builds.

#### zos-make.json
`zowe zm init` created the following properties based on the questions:
```
jason@jason-VirtualBox:~/projects/mainframe/zmt$ cat zos-make.json 
{
  "sshProfile": "mainframe1",
  "zosmfProfile": "mainframe1",
  "localSrcDir": "zos-make-src",
  "localOutDir": "zos-make-out",
  "remoteProjectRoot": "/z/jason/zmt",
  "remoteListingsDir": "out/listings",
  "zfs": {
    "name": "JASON.PUBLIC.ZMT.PUBLIC.ZOSMAKE.ZFS",
    "cylsPri": 10,
    "volumes": [
      "TSU006"
    ]
  },
  "dataSets": [
    {
      "name": "JASON.PUBLIC.ZMT.ZOSMAKE.LOADLIB",
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
      "dataSet": "JASON.PUBLIC.ZMT.ZOSMAKE.LOADLIB",
      "remoteDir": "out/loadlib/"
    }
  ]
}
```

See [IZosMakeProperties.ts](../src/api/interfaces/IZosMakeProperties.ts) for a full explanation of all properties.

There is no need to customize the properties further, the defaults, etc. are fine. 

### zowe zm setup
The setup command uses the project properties (`zos-make.json`) to create the project workspace on USS:
```
jason@jason-VirtualBox:~/projects/mainframe/zmt$ zowe zm setup
Project z/OS setup complete.
```

The setup command performs the following:
1. Creates a ZFS (`zfs.name` in `zos-make.json`) on z/OS (e.g. `JASON.PUBLIC.ZMT.PUBLIC.ZOSMAKE.ZFS`)
2. Creates the remote project root directory (`remoteProjectRoot` in `zos-make.json`) on USS (e.g. `/z/jason/zmt`)
3. Mounts the ZFS to our remote project root
4. Creates some other directories for the project within our ZFS and mountpoint
5. Creates the LOADLIB dataset (`dataSets` in `zos-make.json`)

Once the command completes, we should see the following data sets on z/OS:
```
jason@jason-VirtualBox:~/projects/mainframe/zmt$ zowe files ls ds "jason.public.zmt"
JASON.PUBLIC.ZMT.PUBLIC.ZOSMAKE.ZFS
JASON.PUBLIC.ZMT.PUBLIC.ZOSMAKE.ZFS.DATA
JASON.PUBLIC.ZMT.ZOSMAKE.LOADLIB
```

If we SSH into USS, we should see that the directory is mounted to the ZFS and some additional directories were created:
```
jason@jason-VirtualBox:~/projects/mainframe/zmt$ ssh jason@mainframe1
jason@mainframe1's password: 
 - - - - - - - - - - - - - - - - - - - - - - - - - - - 
 - Improve performance by preventing the propagation - 
 - of TSO/E or ISPF STEPLIBs                         - 
 - - - - - - - - - - - - - - - - - - - - - - - - - - - 
-------------------------------------------------------
 *    Welcome to UNIX System Services                 *
-------------------------------------------------------
bash-4.2$ cd /z/jason/zmt
bash-4.2$ df .
Mounted on     Filesystem                Avail/Total    Files      Status    
/z/jason/zmt (JASON.PUBLIC.ZMT.PUBLIC.ZOSMAKE.ZFS) 14030/14400    4294967289 Available
bash-4.2$ ls -la
total 56
drwxr-xr-x   3 JASON    ESDGRP      8192 Sep  3 11:15 .
drwxrwxrwx  18 STCSYS   SUDOGRP    12288 Sep  3 11:20 ..
drwxr-xr-x   4 JASON    ESDGRP      8192 Sep  3 11:15 out
bash-4.2$ 
```

### zowe zm upload
Now we can upload our source with `zowe zm upload`:
```
jason@jason-VirtualBox:~/projects/mainframe/zmt$ zowe zm upload
All source files uploaded.
```

All files from `localSrcDir` (`zos-make-src/`) are now uploaded to `<remoteProjectRoot>/src` (`/z/jason/zmt/src`). 

### zowe zm make
Now that our source has been uploaded, we can build with `zowe zm make`:
```
jason@jason-VirtualBox:~/projects/mainframe/zmt$ zowe zm make
[ZM-MAKE]
[ZM-MAKE] $ cd /z/jason/zmt/src && make
[ZM-MAKE] as -madata -mrent -mmachine=ZSERIES-5 -a=../out/listings/sample.asm.lst -Iasmmac  -ISYS1.MACLIB  -ISYS1.MODGEN  
[ZM-MAKE] -IASMA.SASMMAC2  -ICBC.SCCNSAM  -ICEE.SCEEMAC -o ../out/sample.o asmpgm/sample.asm
[ZM-MAKE]  Assembler Done No Statements Flagged
[ZM-MAKE] ld -bRMODE=ANY -V -o ../out/loadlib/sample ../out/sample.o > ../out/listings/sample.bind.lst
[ZM-MAKE]  IEW2278I B352 INVOCATION PARAMETERS -
[ZM-MAKE]           TERM=YES,PRINT=NO,MSGLEVEL=4,STORENX=NEVER,RMODE=ANY,LIST=NOIMP,XREF=
[ZM-MAKE]           YES,MAP=YES,PRINT=YES,MSGLEVEL=0
[ZM-MAKE]  IEW2008I 0F03 PROCESSING COMPLETED.  RETURN CODE =  0.
[ZM-MAKE] as -madata -mrent -mmachine=ZSERIES-5 -a=../out/listings/metalcwrapper.asm.lst -Iasmmac  -ISYS1.MACLIB  -ISYS1.MODGEN  
[ZM-MAKE] -IASMA.SASMMAC2  -ICBC.SCCNSAM  -ICEE.SCEEMAC -o ../out/metalcwrapper.o asmpgm/metalcwrapper.asm
[ZM-MAKE]  Assembler Done No Statements Flagged
[ZM-MAKE] xlc -W "c,metal, langlvl(extended), sscom, nolongname, inline, genasm, inlrpt, csect, nose, list, optimize(2), list, 
[ZM-MAKE] showinc, showmacro, source, aggregate" -S -qnosearch -qsource -qlist=../out/listings/wto.c.lst -I/usr/include/metal -o 
[ZM-MAKE] ../out/wto.s metalc/wto.c
[ZM-MAKE] as -madata -mrent -mmachine=ZSERIES-5 -a=../out/listings/wto.asm.lst -Iasmmac  -ISYS1.MACLIB  -ISYS1.MODGEN  
[ZM-MAKE] -IASMA.SASMMAC2  -ICBC.SCCNSAM  -ICEE.SCEEMAC -o ../out/wto.o ../out/wto.s
[ZM-MAKE]  Assembler Done No Statements Flagged
[ZM-MAKE] ld -bRMODE=ANY -V -eTESTMTLC -o ../out/loadlib/wto ../out/metalcwrapper.o ../out/wto.o > ../out/listings/wto.bind.lst
[ZM-MAKE]  IEW2278I B352 INVOCATION PARAMETERS -
[ZM-MAKE]           TERM=YES,PRINT=NO,MSGLEVEL=4,STORENX=NEVER,RMODE=ANY,LIST=NOIMP,XREF=
[ZM-MAKE]           YES,MAP=YES,PRINT=YES,MSGLEVEL=0
[ZM-MAKE]  IEW2008I 0F03 PROCESSING COMPLETED.  RETURN CODE =  0.
[ZM-MAKE]
[ZM-LIST] Make output: "/home/jason/projects/mainframe/zmt/zos-make-out/listings/makefile_date_2019-9-3_time_11-30-29_817ms/make.output.txt"
[ZM-LIST] Listings: "/home/jason/projects/mainframe/zmt/zos-make-out/listings/makefile_date_2019-9-3_time_11-30-29_817ms"
```

The `zowe zm make` command runs `make` against the `<remoteProjectRoot>/src` (`/z/jason/zmt/src`) directory on USS, displays the output at your terminal, downloads the output to a time/date stamped directory, and downloads all listings to the same time/date stamped directory.

Results in the time/date stamped directory:
```
jason@jason-VirtualBox:~/projects/mainframe/zmt$ cd zos-make-out/listings/makefile_date_2019-9-3_time_11-30-29_817ms/
jason@jason-VirtualBox:~/projects/mainframe/zmt/zos-make-out/listings/makefile_date_2019-9-3_time_11-30-29_817ms$ ls -la
total 1032
drwxr-xr-x 2 jason jason   4096 Sep  3 11:30 .
drwxr-xr-x 3 jason jason   4096 Sep  3 11:30 ..
-rw-r--r-- 1 jason jason   1655 Sep  3 11:30 make.output.txt
-rw-r--r-- 1 jason jason  59362 Sep  3 11:30 metalcwrapper.asm.lst
-rw-r--r-- 1 jason jason 787116 Sep  3 11:30 sample.asm.lst
-rw-r--r-- 1 jason jason  22204 Sep  3 11:30 sample.bind.lst
-rw-r--r-- 1 jason jason  36046 Sep  3 11:30 wto.asm.lst
-rw-r--r-- 1 jason jason  23180 Sep  3 11:30 wto.bind.lst
-rw-r--r-- 1 jason jason 104968 Sep  3 11:30 wto.c.lst

```

### zowe zm watch
To make code changes, you can use `zowe zm watch --copy`. The command watches for changes to files and directories in `localSrcDir` (`zos-make-src/`). When a change is detected (e.g. file saved), the file is uploaded and `make` is run:
```
jason@jason-VirtualBox:~/projects/mainframe/zmt$ zowe zm watch --copy
[ZM-INFO] Watching src for changes...
[ZM-INFO] "/home/jason/projects/mainframe/zmt/zos-make-src/asmpgm/sample.asm" changed.
[ZM-MAKE]
[ZM-MAKE] $ cd /z/jason/zmt/src && make
[ZM-MAKE] as -madata -mrent -mmachine=ZSERIES-5 -a=../out/listings/sample.asm.lst -Iasmmac  -ISYS1.MACLIB  -ISYS1.MODGEN  
[ZM-MAKE] -IASMA.SASMMAC2  -ICBC.SCCNSAM  -ICEE.SCEEMAC -o ../out/sample.o asmpgm/sample.asm
[ZM-MAKE]                                                21 fail
[ZM-MAKE]  ASMA142E Operation code not complete on first record
[ZM-MAKE]  ASMA435I Record 20 in /z/jason/zmt/src/asmpgm/sample.asm on volume:
[ZM-MAKE]  Assembler Done      1 Statement  Flagged /   8 was Highest Severity Code
[ZM-MAKE] FSUM3401 The assemble step ended with rc = 8.
[ZM-MAKE] FSUM8226 make: Error code 16
[ZM-MAKE]
[ZM-LIST] Make output: "/home/jason/projects/mainframe/zmt/zos-make-out/listings/makefile_date_2019-9-3_time_11-38-41_721ms/make.output.txt"
[ZM-LIST] Listings: "/home/jason/projects/mainframe/zmt/zos-make-out/listings/makefile_date_2019-9-3_time_11-38-41_721ms"
[ZM-FAIL] 
[ZM-FAIL] Make failed with exit code "255". Review [ZM-MAKE] output above.
[ZM-FAIL]
```

In the above example, we made a change on line 21 of `zos-make-src/asmpgm/sample.asm` and saved the file. It was uploaded and rebuilt, which resulted in a syntax error.

When we correct the syntax error, the build should succeed, and because of the `--copy` option, load modules are copied to the LOADLIB:
```
jason@jason-VirtualBox:~/projects/mainframe/zmt$ zowe zm watch --copy
[ZM-INFO] Watching src for changes...
[ZM-INFO] "/home/jason/projects/mainframe/zmt/zos-make-src/asmpgm/sample.asm" changed.
[ZM-MAKE]
[ZM-MAKE] $ cd /z/jason/zmt/src && make
[ZM-MAKE] as -madata -mrent -mmachine=ZSERIES-5 -a=../out/listings/sample.asm.lst -Iasmmac  -ISYS1.MACLIB  -ISYS1.MODGEN  
[ZM-MAKE] -IASMA.SASMMAC2  -ICBC.SCCNSAM  -ICEE.SCEEMAC -o ../out/sample.o asmpgm/sample.asm
[ZM-MAKE]                                                21 fail
[ZM-MAKE]  ASMA142E Operation code not complete on first record
[ZM-MAKE]  ASMA435I Record 20 in /z/jason/zmt/src/asmpgm/sample.asm on volume:
[ZM-MAKE]  Assembler Done      1 Statement  Flagged /   8 was Highest Severity Code
[ZM-MAKE] FSUM3401 The assemble step ended with rc = 8.
[ZM-MAKE] FSUM8226 make: Error code 16
[ZM-MAKE]
[ZM-LIST] Make output: "/home/jason/projects/mainframe/zmt/zos-make-out/listings/makefile_date_2019-9-3_time_11-41-58_676ms/make.output.txt"
[ZM-LIST] Listings: "/home/jason/projects/mainframe/zmt/zos-make-out/listings/makefile_date_2019-9-3_time_11-41-58_676ms"
[ZM-FAIL] 
[ZM-FAIL] Make failed with exit code "255". Review [ZM-MAKE] output above.
[ZM-FAIL] 
[ZM-INFO] "/home/jason/projects/mainframe/zmt/zos-make-src/asmpgm/sample.asm" changed.
[ZM-MAKE]
[ZM-MAKE] $ cd /z/jason/zmt/src && make
[ZM-MAKE] as -madata -mrent -mmachine=ZSERIES-5 -a=../out/listings/sample.asm.lst -Iasmmac  -ISYS1.MACLIB  -ISYS1.MODGEN  
[ZM-MAKE] -IASMA.SASMMAC2  -ICBC.SCCNSAM  -ICEE.SCEEMAC -o ../out/sample.o asmpgm/sample.asm
[ZM-MAKE]  Assembler Done No Statements Flagged
[ZM-MAKE] ld -bRMODE=ANY -V -o ../out/loadlib/sample ../out/sample.o > ../out/listings/sample.bind.lst
[ZM-MAKE]  IEW2278I B352 INVOCATION PARAMETERS -
[ZM-MAKE]           TERM=YES,PRINT=NO,MSGLEVEL=4,STORENX=NEVER,RMODE=ANY,LIST=NOIMP,XREF=
[ZM-MAKE]           YES,MAP=YES,PRINT=YES,MSGLEVEL=0
[ZM-MAKE]  IEW2008I 0F03 PROCESSING COMPLETED.  RETURN CODE =  0.
[ZM-MAKE]
[ZM-LIST] Make output: "/home/jason/projects/mainframe/zmt/zos-make-out/listings/makefile_date_2019-9-3_time_11-42-8_328ms/make.output.txt"
[ZM-LIST] Listings: "/home/jason/projects/mainframe/zmt/zos-make-out/listings/makefile_date_2019-9-3_time_11-42-8_328ms"
[ZM-INFO] 
[ZM-INFO] Make succeeded.
[ZM-INFO] 
[ZM-COPY] "2" file(s) copied to "JASON.PUBLIC.ZMT.ZOSMAKE.LOADLIB".
```

### zowe zm cleanup
When we are finished with our changes, we can cleanup the z/OS workspace with `zowe zm cleanup`:
```
jason@jason-VirtualBox:~/projects/mainframe/zmt$ zowe zm cleanup -c
z/OS make environment cleaned.
```

