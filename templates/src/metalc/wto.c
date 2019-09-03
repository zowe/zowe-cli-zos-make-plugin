#include <string.h>     
              
void WRITEMSG(int lenMsg, char *msg)   
{                                             
                                              
   struct WTO_Parm                            
   {                                          
      short    int len;                       
      short    int mcsflags;                  
      unsigned char message[100];             
   };                                         
                                              
   unsigned char wrkArea[512];                
   struct WTO_Parm Msg;                       
                                              
   memset(&Msg,0,sizeof(Msg));                
                                              
   Msg.len           = lenMsg+4;                
   Msg.mcsflags      = 0;                     
   strcpy(Msg.message,msg);                   
                                            
     __asm(" WTO  MF=(E,(%0))"  
     :                                                    
     : "r"(&Msg)                      // input  definition
     : "r0","r1","r14","r15");        //  clobber list    
 
 }
 