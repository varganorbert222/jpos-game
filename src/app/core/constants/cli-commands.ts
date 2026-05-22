import {
  TERMINAL_COMMAND_DEFS,
  TERMINAL_HELP_LINES,
} from '../../../simulation/terminal-manifest';

/** Deterministic CLI manifest — shared with terminal parser */
export interface CliCommandDef {
  name: string;
  usage: string;
  summary: string;
}

export const CLI_COMMANDS: readonly CliCommandDef[] = TERMINAL_COMMAND_DEFS;
export const CLI_HELP_LINES: readonly string[] = TERMINAL_HELP_LINES;
