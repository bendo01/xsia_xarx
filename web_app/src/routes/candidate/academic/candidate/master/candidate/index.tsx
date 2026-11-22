import { t } from '../../../../../../i18n';

/** Fallback landing when the account has no candidate record yet (mirrors the old client's placeholder). */
export default function CandidateHome() {
  return <p class="p-6 text-sm text-muted-foreground-1">{t('cn.pageUnderConstruction')}</p>;
}
