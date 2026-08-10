export interface TranscriptionProvider { transcribe(input:{attachmentId:string;language?:string}):Promise<{text:string;language?:string}> }
