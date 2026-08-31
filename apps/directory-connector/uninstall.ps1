$root=Split-Path -Parent $PSCommandPath; $winsw=Join-Path $root 'winsw.exe'; if(Test-Path $winsw){& $winsw stop; & $winsw uninstall}
