"""Package scoped source for Preview; do not copy dirty secrets or unrelated edits."""
from pathlib import Path
import hashlib, io, json, re, subprocess, tarfile

root = Path(__file__).resolve().parent.parent
excluded = {'apps/api/src/ai/ai-gateway.service.ts', 'docs/JUPITER_WEBSITE_TRAINING_PAGE_PROMPT_FA.md'}
tracked = subprocess.check_output(['git','ls-files','-z'],cwd=root).decode().split('\0')
added = subprocess.check_output(['git','ls-files','--others','--exclude-standard','-z'],cwd=root).decode().split('\0')
allow_added = {
    'apps/web/src/requestKey.ts','apps/web/src/requestKey.test.ts',
    'apps/api/migrations/074_first_login_password.sql',
    'apps/api/src/auth/temporary-password.ts',
    'apps/api/src/organization-applications/verification-readiness.ts',
    'apps/api/src/organization/setup-provisioning.ts',
    'apps/api/test/goal070-onboarding.integration.spec.ts',
    'apps/api/test/verification-readiness.spec.ts',
    'apps/web/src/FirstLoginPasswordChange.tsx','apps/web/src/SlaPolicyEditor.tsx',
    'apps/web/src/VerificationDeliveryHealth.tsx','apps/web/src/authenticationResult.ts',
    'apps/web/src/onboardingExperience.test.tsx','apps/web/src/onboardingExperience.ts',
    'apps/web/src/workspaceState.test.ts','apps/web/src/workspaceState.ts',
    'docs/GOAL_070_EVIDENCE.md','scripts/goal070-isolated-api-tests.mjs',
    'scripts/goal070-preview-state.py','scripts/goal070-package-preview.py',
}
missing = allow_added - set(tracked) - set(added)
if missing:
    raise RuntimeError('Expected source files missing: '+','.join(sorted(missing)))
destination=root/'.local/goal070/source-preview.tar.gz'
destination.parent.mkdir(parents=True,exist_ok=True)
manifest={}
with tarfile.open(destination,'w:gz') as archive:
    for name in sorted(set(tracked)-{''} | allow_added):
        path=Path(name)
        if path.is_absolute() or '..' in path.parts or any(part in {'securedata','.local','node_modules','tmp','output'} for part in path.parts):
            raise RuntimeError('Unsafe tracked path: '+name)
        # User-owned unrelated changes are exported from HEAD, never overwritten.
        data=subprocess.check_output(['git','show','HEAD:'+name],cwd=root) if name in excluded else (root/path).read_bytes()
        if re.search(rb'(?m)^-----BEGIN (?:OPENSSH |RSA )?PRIVATE KEY-----\r?\n[A-Za-z0-9+/=]{32,}',data):
            raise RuntimeError('Private key pattern in source')
        info=tarfile.TarInfo(name);info.size=len(data);info.mode=0o755 if name.endswith('.sh') else 0o644
        archive.addfile(info,io.BytesIO(data));manifest[name]=hashlib.sha256(data).hexdigest()
summary={'sourceHead':subprocess.check_output(['git','rev-parse','HEAD'],cwd=root,text=True).strip(),'archiveSha256':hashlib.sha256(destination.read_bytes()).hexdigest(),'files':manifest,'excludedDirtyPaths':sorted(excluded)}
(destination.parent/'source-manifest.json').write_text(json.dumps(summary,indent=2),encoding='utf-8')
print(json.dumps({'sourceHead':summary['sourceHead'],'archiveSha256':summary['archiveSha256'],'files':len(manifest),'excludedDirtyPaths':summary['excludedDirtyPaths'],'destination':str(destination)}))
