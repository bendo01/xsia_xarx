import { useNavigate } from '@solidjs/router';
import { onSettled } from 'solid-js';

import { t } from '../../../i18n';
import { CHANGE_PASSWORD_PATH } from '../../../lib/menu';

// The old client rendered its change-password page here; it now lives at one shared address.
// The link is the no-JavaScript fallback for the client-side redirect.
export default function ResetPasswordPage() {
  const navigate = useNavigate();
  onSettled(() => {
    navigate(CHANGE_PASSWORD_PATH, { replace: true });
  });
  return <p class="text-sm"><a href={CHANGE_PASSWORD_PATH} class="text-primary hover:underline">{t('au.ubahKataSandi')}</a></p>;
}
