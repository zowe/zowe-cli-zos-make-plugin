TESTMTLC CSECT ,                                     
TESTMTLC AMODE 31                                    
TESTMTLC RMODE ANY                                   
*=====================================================================*
*        Equates                                                      *
*=====================================================================*
         COPY  #EQUS                   Copy the equates
         COPY  #RCODES                 Copy return/reason code equates
         COPY  #REGS                   Copy register equates
*                     
         Print Gen                                   
         J     @OFFSET                               
         DC    AL2(8)                                
         DC    CL8'TESTMTLC'                         
         DC    CL9'&SYSDATE'                         
         DC    CL6'&SYSTIME'                         
@OFFSET  DS    0H                                    
         Save  (14,12)                               
         LR    R12,R15                               
         Using TESTMTLC,R12                          
*                                              
         LGFI  R3,65536*2                            
         STORAGE OBTAIN,LENGTH=(R3),LOC=31           
         St    R13,4(,R1)                            
         LR    R13,R1             Point to our DSA   
         Using DSA,R13                               
         St    R0,0(,R1)          Save DSA Length    
LAB0100  DS    0H 
                                      
         LR    R2,R13             Calculate NAB      
         AHI   R2,DSALen          Move past end of this storage    
         ST    R2,8(,R13)         Addr of Next Available Byte (NAB)
*	                                                                   
         MVC   message,=CL100'Test Message WTO'                    
         LA    R3,message                                          
         ST    R3,Parm2                                            
         LHI   R4,L'message                                        
         ST    R4,Parm1                                            
*                                                           
         LA    R1,parmList                                         
         L     R15,=V(WRITEMSG)                                    
         BASR  R14,R15                                             
*                                                       
         L     R13,4(,R13)        Restore Caller's DSA Pointer     
         L     R14,12(R13)        Restore R14                      
         LM    R0,R12,20(R13)                                      
         BR    R14                Return to Caller 
DSA      DSECT ,      
SaveArea DS    18F       
message  DS    CL100     
parmList DS    0FD       
Parm1    DS    F         
Parm2    DS    F         
DSALen   EQU   *-DSA 
         END   TESTMTLC  