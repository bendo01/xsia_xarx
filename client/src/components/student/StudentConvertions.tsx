import { For, Show } from 'solid-js';
import type { StudentConvertionItem } from '~/controllers/academic/student/master/AcademicStudentMasterStudentController';
import { t } from '../../i18n';

const dash = (v: unknown) => (v === null || v === undefined || v === '' ? '-' : String(v));
const num = (v?: number | null) => (v === null || v === undefined ? '-' : Number(v).toLocaleString('id-ID', { maximumFractionDigits: 2 }));

/** Credit conversion records of a transfer student. Renders nothing when empty. */
export default function StudentConvertions(props: { items?: StudentConvertionItem[] | null }) {
    const items = () => props.items ?? [];
    const total = () => items().reduce((sum, c) => sum + (Number(c.transfer_credit) || 0), 0);

    return (
        <Show when={items().length > 0}>
            <div class="bg-white dark:bg-neutral-800 rounded-xs border border-neutral-200 dark:border-neutral-700 shadow-2xs">
                <div class="px-4 py-3 border-b border-neutral-200 dark:border-neutral-700 text-sm font-bold">
                    {t('ad.creditConversion')} ({items().length})
                </div>
                <div class="overflow-x-auto">
                    <table class="w-full text-xs text-left">
                        <thead class="bg-neutral-50 dark:bg-neutral-900/30 text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">
                            <tr>
                                <th class="px-4 py-2.5 font-semibold" colspan="4">{t('ad.originCourse')}</th>
                                <th class="px-4 py-2.5 font-semibold" colspan="4">{t('ad.transferredCourse')}</th>
                            </tr>
                            <tr>
                                <th class="px-4 py-2 font-semibold">{t('ad.convertionCode')}</th>
                                <th class="px-4 py-2 font-semibold">{t('ad.convertionCourse')}</th>
                                <th class="px-4 py-2 font-semibold text-right">{t('ad.convertionCredits')}</th>
                                <th class="px-4 py-2 font-semibold">{t('ad.convertionGrade')}</th>
                                <th class="px-4 py-2 font-semibold">{t('ad.convertionCode')}</th>
                                <th class="px-4 py-2 font-semibold">{t('ad.convertionCourse')}</th>
                                <th class="px-4 py-2 font-semibold text-right">{t('ad.convertionCredits')}</th>
                                <th class="px-4 py-2 font-semibold">{t('ad.convertionGrade')}</th>
                            </tr>
                        </thead>
                        <tbody class="divide-y divide-neutral-100 dark:divide-neutral-700/50">
                            <For each={items()}>
                                {(c) => (
                                    <tr>
                                        <td class="px-4 py-2 font-mono">{dash(c.origin_code)}</td>
                                        <td class="px-4 py-2">{dash(c.origin_name)}</td>
                                        <td class="px-4 py-2 text-right font-mono">{num(c.origin_credit)}</td>
                                        <td class="px-4 py-2 font-mono">{dash(c.origin_grade)}</td>
                                        <td class="px-4 py-2 font-mono">{dash(c.transfer_code)}</td>
                                        <td class="px-4 py-2">{dash(c.transfer_name)}</td>
                                        <td class="px-4 py-2 text-right font-mono">{num(c.transfer_credit)}</td>
                                        <td class="px-4 py-2 font-mono">{dash(c.transfer_grade)}</td>
                                    </tr>
                                )}
                            </For>
                        </tbody>
                        <tfoot class="bg-neutral-50 dark:bg-neutral-900/30 font-semibold">
                            <tr>
                                <td class="px-4 py-2" colspan="6">{t('ad.totalTransferredCredits')}</td>
                                <td class="px-4 py-2 text-right font-mono">{num(total())}</td>
                                <td></td>
                            </tr>
                        </tfoot>
                    </table>
                </div>
            </div>
        </Show>
    );
}
