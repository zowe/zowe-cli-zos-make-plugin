# Generic xlc compiler
CC=xlc

# C++ Specified (note big C)
CXX=xlC

# HLASM assembler
ASM=as

# The binder
LD=ld

# Source directories 
ASMSOURCE=asmpgm
ASMMAC=asmmac
MTLCSOURCE=metalc

# Output directories. The basic template/sample assumes that you are placing 
# output "stuff"... objects, load modules, etc. in USS. You can however, change
# the targets and outputs to be MVS data-sets by using the //"'MY.DATASET'" 
# notation. 
OUTPUTDIR=../out
LISTINGSDIR=$(OUTPUTDIR)/listings
LOADLIBDIR=$(OUTPUTDIR)/loadlib

# Common compiler Flags for metal C
MTLOPTS = metal,\
 langlvl(extended),\
 sscom,\
 nolongname,\
 inline,\
 genasm,\
 inlrpt,\
 csect,\
 nose,\
 list,\
 optimize(2),\
 list,\
 showinc,\
 showmacro,\
 source,\
 aggregate
MTLCFLAG = -W "c,$(MTLOPTS)" -S -qnosearch -qsource

# HLASM macro libraries 
ASMINCLUDE = -I$(ASMMAC) \
 -ISYS1.MACLIB \
 -ISYS1.MODGEN \
 -IASMA.SASMMAC2 \
 -ICBC.SCCNSAM \
 -ICEE.SCEEMAC

# Metal C includes
MTLINCLUDE= -I/usr/include/metal

# HLASM Assembler and linker flags
ASMFLAGS = -madata -mrent -mmachine=ZSERIES-5
LINKERFLAGS= -bRMODE=ANY

################################################################################
# Build all the samples.                                                       #
################################################################################
all: $(LOADLIBDIR)/sample \
	$(LOADLIBDIR)/wto

################################################################################
# Link-edit (bind)                                                             #
################################################################################

# Bind the Metal C program with the wrapper
$(LOADLIBDIR)/wto: $(OUTPUTDIR)/metalcwrapper.o $(OUTPUTDIR)/wto.o
	$(LD) $(LINKERFLAGS) -V -eTESTMTLC -o $@ $^ > $(LISTINGSDIR)/wto.bind.lst

# Invoke the binder to create an executable for the sample
$(LOADLIBDIR)/sample: $(OUTPUTDIR)/sample.o
	$(LD) $(LINKERFLAGS) -V -o $@ $^ > $(LISTINGSDIR)/sample.bind.lst

################################################################################
# Compile Metal C to HLASM                                                     #
################################################################################ 

# Compile the Metal C program to HLASM
$(OUTPUTDIR)/wto.s: $(MTLCSOURCE)/wto.c
	$(CC) $(MTLCFLAG) -qlist=$(LISTINGSDIR)/wto.c.lst $(MTLINCLUDE) -o $@ $^

################################################################################
# Assemble HLASM                                                               #
################################################################################ 

# Assemble the sample program
$(OUTPUTDIR)/sample.o: $(ASMSOURCE)/sample.asm
	$(ASM) $(ASMFLAGS) -a=$(LISTINGSDIR)/sample.asm.lst $(ASMINCLUDE) -o $@ $^

# Assemble the metal c wrapper
$(OUTPUTDIR)/metalcwrapper.o: $(ASMSOURCE)/metalcwrapper.asm
	$(ASM) $(ASMFLAGS) -a=$(LISTINGSDIR)/metalcwrapper.asm.lst $(ASMINCLUDE) -o $@ $^

# Assemble the metal c program
$(OUTPUTDIR)/wto.o: $(OUTPUTDIR)/wto.s
	$(ASM) $(ASMFLAGS) -a=$(LISTINGSDIR)/wto.asm.lst $(ASMINCLUDE) -o $@ $^
