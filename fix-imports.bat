@echo off
setlocal enabledelayedexpansion

echo Fixing import paths...

for /r %%f in (*.ts *.tsx) do (
    powershell -Command "(Get-Content '%%f' -Raw) -replace 'from \"\.\.\/lib\/supabase\"', 'from \"../src/lib/supabase\"' -replace 'from \"\.\.\/lib\/utils\"', 'from \"../src/lib/utils\"' -replace 'from \"\.\.\/\.\.\/lib\/supabase\"', 'from \"../../src/lib/supabase\"' -replace 'from \"\.\.\/\.\.\/lib\/utils\"', 'from \"../../src/lib/utils\"' -replace \"from '\.\.\/lib\/supabase'\", \"from '../src/lib/supabase'\" -replace \"from '\.\.\/lib\/utils'\", \"from '../src/lib/utils'\" -replace \"from '\.\.\/\.\.\/lib\/supabase'\", \"from '../../src/lib/supabase'\" -replace \"from '\.\.\/\.\.\/lib\/utils'\", \"from '../../src/lib/utils'\" | Set-Content '%%f' -NoNewline"
)

echo Done!
