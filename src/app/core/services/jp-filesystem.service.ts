import { Injectable, signal } from '@angular/core';
import type { JpFileEntry, JpFolderEntry } from '../types/jp-filesystem';

const SEED: JpFileEntry[] = [
  {
    path: '/PARK_OPS/README.TXT',
    name: 'README.TXT',
    kind: 'text',
    content: `JP-OS FILE VAULT v1.0
──────────────────────
Use this archive for park doctrine, species sheets, and
incident retrospectives. All edits are logged to SECURITY.

AUTHORIZED PERSONNEL ONLY.`,
    readonly: true,
  },
  {
    path: '/PARK_OPS/FENCE_PROTOCOL.TXT',
    name: 'FENCE_PROTOCOL.TXT',
    kind: 'text',
    content: `PERIMETER FENCE — OPERATOR PROTOCOL
1. Never raise voltage above 95% without grid head approval.
2. After HARD REBOOT verify all segments before opening gates.
3. Report intermittent states within 2 ticks.`,
  },
  {
    path: '/PARK_OPS/MAIL_CONTACTS.TXT',
    name: 'MAIL_CONTACTS.TXT',
    kind: 'text',
    content: `JP-OS MAIL — AUTHORIZED CONTACT REGISTRY
Revision: 4.0.5-alpha  |  Maintained by: R.ARNOLD / Security

Use this list before opening INGEN MAIL. If the sender address is not
listed below (exact match), treat the message as UNTRUSTED.

────────────────────────────────────────────────────────────────
 TIER A — PARK COMMAND (always safe to open)
────────────────────────────────────────────────────────────────
  J.HAMMOND          Executive oversight, policy
  R.ARNOLD           Chief engineer, perimeter / grid directives
  I.MALCOLM          Risk & containment advisory (secondary)

────────────────────────────────────────────────────────────────
 TIER B — JP-OS INTERNAL (automated, safe)
────────────────────────────────────────────────────────────────
  JP-OS.REPORTER     Scheduled status digests (tick reports)
  JP-OS.ALERT        Rare automated escalation (verify on grid)

────────────────────────────────────────────────────────────────
 TIER C — OPERATIONS STAFF (safe if exact spelling)
────────────────────────────────────────────────────────────────
  D.NAISH            Veterinary / specimen welfare
  R.TEMBO            Maintenance scheduling
  L.GRANT            Visitor services liaison
  E.SATTALER         Field genetics log (BIO cross-post)
  H.WU               Systems analyst (JP-OS patches)
  M.CRON             Night shift supervisor
  B.GENNARO          Legal / liability notices (secondary)

────────────────────────────────────────────────────────────────
 UNTRUSTED / UNKNOWN SENDERS
────────────────────────────────────────────────────────────────
  UNKNOWN, ???, blank From, or any address NOT in Tier A–C:
    • Do NOT open attachments.
    • You may DELETE unread to quarantine.
    • A small fraction of untrusted mail carries MAIL-BUS payloads
      (system anomalies). When in doubt: delete, or HARD REBOOT after
      accidental open — reboot clears software infection only.

  SPOOF WARNING — these are NOT authorized (common forgeries):
    J.HAMM0ND, J-HAMMOND, INGEN-SYS, JP-0S, SECURITY-UPDATE

────────────────────────────────────────────────────────────────
 OPERATOR CHECKLIST
────────────────────────────────────────────────────────────────
  1. Match From field to this document (character-for-character).
  2. If unsure — compare subject with grid / SECURITY before acting.
  3. Trusted mail never requires executable attachments.
  4. See FENCE_PROTOCOL.TXT for post-reboot perimeter checks.

— END REGISTRY —`,
    readonly: true,
  },
  {
    path: '/INGEN/MISSION_BRIEF.TXT',
    name: 'MISSION_BRIEF.TXT',
    kind: 'text',
    content: `INGEN MISSION BRIEF — NUBLAR
Objective: contain assets, preserve visitor throughput,
maintain illusion of control.

"If the fences fail, the money fails." — Board memo`,
    readonly: true,
  },
  {
    path: '/BIO/SPECIES_VELOCIRAPTOR.TXT',
    name: 'SPECIES_VELOCIRAPTOR.TXT',
    kind: 'text',
    content: `ASSET: Velociraptor antirrhopus
Intelligence: HIGH — pattern tests show gate timing recall.
Stress triggers: pack separation, low fence voltage.
Note: Do not assume "stable" means safe.`,
  },
  {
    path: '/BIO/SPECIES_TREX.TXT',
    name: 'SPECIES_TREX.TXT',
    kind: 'text',
    content: `ASSET: Tyrannosaurus rex
Sector: Predator West
Bite force telemetry exceeds all benchmarks.
Recommend double fence segment and patrol overlap.`,
  },
  {
    path: '/MEDIA/SITE_MAP.PNG',
    name: 'SITE_MAP.PNG',
    kind: 'image',
    content: '/jp-data/site-map.svg',
    readonly: true,
  },
  {
    path: '/MEDIA/GATE_CAM_LOOP.VID',
    name: 'GATE_CAM_LOOP.VID',
    kind: 'video',
    content: '/jp-data/gate-cam',
    readonly: true,
  },
  {
    path: '/LOGS/OPERATOR_NOTES.TXT',
    name: 'OPERATOR_NOTES.TXT',
    kind: 'text',
    content: `Shift notes:
- Check mail for Hammond directives.
- Tour runs only when perimeter nominal.
- Before opening mail: read PARK_OPS/MAIL_CONTACTS.TXT`,
  },
];

const FOLDERS: JpFolderEntry[] = [
  { path: '/', name: 'JP-OS', children: ['/PARK_OPS', '/INGEN', '/BIO', '/MEDIA', '/LOGS'] },
  {
    path: '/PARK_OPS',
    name: 'PARK_OPS',
    children: [
      '/PARK_OPS/README.TXT',
      '/PARK_OPS/FENCE_PROTOCOL.TXT',
      '/PARK_OPS/MAIL_CONTACTS.TXT',
    ],
  },
  {
    path: '/INGEN',
    name: 'INGEN',
    children: ['/INGEN/MISSION_BRIEF.TXT'],
  },
  {
    path: '/BIO',
    name: 'BIO',
    children: ['/BIO/SPECIES_VELOCIRAPTOR.TXT', '/BIO/SPECIES_TREX.TXT'],
  },
  {
    path: '/MEDIA',
    name: 'MEDIA',
    children: ['/MEDIA/SITE_MAP.PNG', '/MEDIA/GATE_CAM_LOOP.VID'],
  },
  { path: '/LOGS', name: 'LOGS', children: ['/LOGS/OPERATOR_NOTES.TXT'] },
];

@Injectable({ providedIn: 'root' })
export class JpFilesystemService {
  private readonly files = signal<Record<string, JpFileEntry>>(
    Object.fromEntries(SEED.map((f) => [f.path, { ...f }])),
  );

  readonly rootFolders = FOLDERS;

  listFolder(path: string): { folders: JpFolderEntry[]; files: JpFileEntry[] } {
    const folder = FOLDERS.find((f) => f.path === path);
    if (!folder) {
      return { folders: [], files: [] };
    }
    const map = this.files();
    const files: JpFileEntry[] = [];
    const folders: JpFolderEntry[] = [];
    for (const child of folder.children) {
      const file = map[child];
      if (file) {
        files.push(file);
      } else {
        const sub = FOLDERS.find((f) => f.path === child);
        if (sub) {
          folders.push(sub);
        }
      }
    }
    return {
      folders,
      files: files.sort((a, b) => a.name.localeCompare(b.name)),
    };
  }

  getFile(path: string): JpFileEntry | null {
    return this.files()[path] ?? null;
  }

  saveText(path: string, content: string): boolean {
    const file = this.files()[path];
    if (!file || file.kind !== 'text' || file.readonly) {
      return false;
    }
    this.files.update((prev) => ({
      ...prev,
      [path]: { ...file, content },
    }));
    return true;
  }
}
