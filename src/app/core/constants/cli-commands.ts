/** Deterministic CLI manifest — parser-friendly */
export interface CliCommandDef {
  name: string;
  usage: string;
  summary: string;
}

export const CLI_COMMANDS: readonly CliCommandDef[] = [
  { name: 'help', usage: 'help', summary: 'List available commands' },
  { name: 'status', usage: 'status', summary: 'Park stability and phase' },
  { name: 'fence', usage: 'fence reset [ID]', summary: 'Queue fence reset' },
  { name: 'cam', usage: 'cam reboot [ID]', summary: 'Queue camera reboot' },
  { name: 'dino', usage: 'dino track [ID]', summary: 'Derived specimen telemetry' },
  { name: 'power', usage: 'power reroute [ZONE]', summary: 'Queue power reroute' },
] as const;

export const CLI_HELP_LINES: readonly string[] = [
  'JP-OS COMMAND SET (limited):',
  ...CLI_COMMANDS.map((c) => `  ${c.usage.padEnd(22)} — ${c.summary}`),
] as const;
