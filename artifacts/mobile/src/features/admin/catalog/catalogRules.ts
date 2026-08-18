export type StationProgramConfig = { usesPrograms?: boolean | null };

export function canManagePrograms(station: StationProgramConfig | null | undefined): boolean {
  return station?.usesPrograms !== false;
}

export function normalizeProductProgram(station: StationProgramConfig | null | undefined, programId?: string | null): string | null {
  if (!canManagePrograms(station)) return null;
  return programId?.trim() || null;
}
