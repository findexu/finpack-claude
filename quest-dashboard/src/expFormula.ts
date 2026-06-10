// EXP reward formulas. Single home for every reward number so the dashboard fold
// matches what quest-system awards. Mirrors quest-system
// `skills/quest-system/SKILL.md` -> "## XP system" — keep in sync. Drift between
// these constants and the live profile is caught by the chartData reconciliation
// test (a folded events.log must total to profile.totalExp on a real fixture).

export const EXP = {
  // Per-expedition (awarded by /make-camp). The danger/oath bonuses are flat flags
  // on "any new this expedition", NOT per-count.
  expeditionBase: 5,
  expeditionDanger: 10,
  expeditionOath: 10,
  // Per-quest-complete (awarded by /complete-quest).
  questBase: 100,
  questPerModule: 25,
  questPerExpedition: 10,
  questPerDanger: 15,
  questPerOath: 20,
  questPerSplit: 50,
  questCleanBonus: 75,
  questSpeedBonus: 50,
} as const;

export function expeditionExp(input: { dangers: number; oaths: number }): number {
  return (
    EXP.expeditionBase +
    (input.dangers > 0 ? EXP.expeditionDanger : 0) +
    (input.oaths > 0 ? EXP.expeditionOath : 0)
  );
}

export function questCompleteExp(input: {
  modules: number;
  expeditions: number;
  dangers: number;
  oaths: number;
  splits: number;
  clean: boolean;
  speed: boolean;
}): number {
  return (
    EXP.questBase +
    EXP.questPerModule * input.modules +
    EXP.questPerExpedition * input.expeditions +
    EXP.questPerDanger * input.dangers +
    EXP.questPerOath * input.oaths +
    EXP.questPerSplit * input.splits +
    (input.clean ? EXP.questCleanBonus : 0) +
    (input.speed ? EXP.questSpeedBonus : 0)
  );
}
