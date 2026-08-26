/** Stage names, shared by the wizard chrome, the ledger and the stats page. */
import type { LifebookStage } from '../types';

export const STAGE_LABEL: Record<LifebookStage, string> = {
  vision: 'The life you want',
  current: 'The life you have',
  reflect: 'How you operate',
  self_image: 'What you appear to believe',
  becoming: 'Who you would have to be',
  blueprint: 'The work',
};

export const STAGE_ORDER: LifebookStage[] = [
  'vision', 'current', 'reflect', 'self_image', 'becoming', 'blueprint',
];
