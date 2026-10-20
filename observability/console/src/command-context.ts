/** UI completion ownership only; never cancels/retries a committed server write. */
export class CommandContext {
 private context:readonly unknown[]=[];private epoch=0;private sequence=0;
 update(context:readonly unknown[]){if(context.length!==this.context.length||context.some((value,index)=>value!==this.context[index])){this.context=[...context];this.epoch++;}}
 begin(){const epoch=this.epoch,sequence=++this.sequence;return()=>epoch===this.epoch&&sequence===this.sequence;}
 invalidate(){this.epoch++;}
}
