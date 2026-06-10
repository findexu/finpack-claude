// The quest-name leaf: the last non-empty segment of a quest folder path. Shared by
// the state manager (phase/XP keying) and the character sheet (active-quest identity).
export function leafName(questFolderPath: string): string {
  const parts = questFolderPath.split("/").filter((part) => part !== "");
  return parts.length > 0 ? parts[parts.length - 1] : questFolderPath;
}
