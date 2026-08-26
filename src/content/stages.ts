/** Stage names, shared by the wizard chrome, the ledger and the stats page. */
import type { LifebookStage } from '../types';

export const STAGE_LABEL: Record<LifebookStage, string> = {
  vision: 'The life you want',
  goals: 'What you are actually doing',
  pairs: 'Where they collide',
  mirror: 'The map',
  current: 'The life you have',
  reflect: 'How you operate',
  self_image: 'What you appear to believe',
  becoming: 'Who you would have to be',
  blueprint: 'The work',
};

/**
 * Two acts.
 *
 * The first is the short form: ten minutes, and it ends on a picture of your
 * own life you have never seen. Someone who stops there has had their money's
 * worth. The second opens only for whoever looks at that picture and asks why
 * it is shaped like that — which is a much smaller number of people, and the
 * ones worth building the rest for.
 */
export const ACT_ONE: LifebookStage[] = ['vision', 'goals', 'pairs', 'mirror'];
export const ACT_TWO: LifebookStage[] = ['current', 'reflect', 'self_image', 'becoming', 'blueprint'];
export const STAGE_ORDER: LifebookStage[] = [...ACT_ONE, ...ACT_TWO];

/**
 * Short form. Six goals is fifteen pairs, which rates in about ninety seconds;
 * twelve goals is sixty-six, which is a different product. The full matrix is
 * still there for anyone who wants it — it is just not what a stranger meets.
 */
export const MIN_GOALS = 5;
export const MAX_GOALS = 7;
