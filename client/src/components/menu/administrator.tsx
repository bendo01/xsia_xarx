import { A } from '@solidjs/router';
import { t } from '../../i18n';

export default function MenuAdministrator() {
    return (
        <div class="w-full space-y-2 pb-6">
            {/* Dashboard Link */}
            <A 
                href="/administrator/dashboard" 
                activeClass="bg-blue-600/15 text-blue-600 dark:text-blue-400 font-semibold"
                class="flex items-center gap-x-2.5 py-2 px-2.5 text-xs font-semibold rounded-xl text-neutral-800 dark:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
            >
                <svg class="size-4 shrink-0 text-blue-600 dark:text-blue-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <rect width="7" height="9" x="3" y="3" rx="1"/>
                    <rect width="7" height="5" x="14" y="3" rx="1"/>
                    <rect width="7" height="9" x="14" y="12" rx="1"/>
                    <rect width="7" height="5" x="3" y="16" rx="1"/>
                </svg>
                <span>{t('menu.administrator.adminDashboard')}</span>
            </A>

            {/* Tree Menu Models Exactly Matching server/tree_menu.md */}
            <div class="pt-1 border-t border-neutral-200 dark:border-neutral-800">
                <div class="px-2 py-1 flex items-center justify-between text-[10px] font-bold uppercase tracking-wider text-neutral-400 dark:text-neutral-500 font-mono">
                    <span>{t('menu.administrator.modelsTree')}</span>
                    <span>{t('menu.administrator.entitiesCount', { count: 241 })}</span>
                </div>
                <ul class="space-y-1 mt-1">
    <li>
      <details class="group animated-details" open>
        <summary class="list-none [&::-webkit-details-marker]:hidden cursor-pointer w-full text-start flex items-center justify-between py-1.5 px-2 text-xs font-bold text-neutral-800 dark:text-neutral-200 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors font-mono">
          <div class="flex items-center gap-2 truncate">
            <svg class="size-3 text-neutral-400 group-open:rotate-90 transition-transform shrink-0" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="m9 18 6-6-6-6"/></svg>
            <span class="truncate">{t('menu.administrator.tree.academic')}</span>
          </div>
        </summary>
        <div class="w-full details-anim-content">
          <ul class="pt-0.5 ps-2.5 space-y-0.5 border-s border-neutral-200 dark:border-neutral-700 ms-2.5 my-0.5">
            <li>
              <details class="group animated-details">
                <summary class="list-none [&::-webkit-details-marker]:hidden cursor-pointer w-full text-start flex items-center justify-between py-1 px-2 text-xs font-medium text-neutral-700 dark:text-neutral-300 rounded-md hover:bg-neutral-100 dark:hover:bg-neutral-800/80 transition-colors font-mono">
                  <div class="flex items-center gap-2 truncate">
                    <svg class="size-3 text-neutral-400 group-open:rotate-90 transition-transform shrink-0" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="m9 18 6-6-6-6"/></svg>
                    <span class="truncate">{t('menu.administrator.tree.campaign')}</span>
                  </div>
                </summary>
                <div class="w-full details-anim-content">
                  <ul class="pt-0.5 ps-2.5 space-y-0.5 border-s border-neutral-200 dark:border-neutral-700 ms-2.5 my-0.5">
                    <li>
                      <details class="group animated-details">
                        <summary class="list-none [&::-webkit-details-marker]:hidden cursor-pointer w-full text-start flex items-center justify-between py-1 px-2 text-xs font-medium text-neutral-700 dark:text-neutral-300 rounded-md hover:bg-neutral-100 dark:hover:bg-neutral-800/80 transition-colors font-mono">
                          <div class="flex items-center gap-2 truncate">
                            <svg class="size-3 text-neutral-400 group-open:rotate-90 transition-transform shrink-0" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="m9 18 6-6-6-6"/></svg>
                            <span class="truncate">{t('menu.administrator.tree.reference')}</span>
                          </div>
                        </summary>
                        <div class="w-full details-anim-content">
                          <ul class="pt-0.5 ps-2.5 space-y-0.5 border-s border-neutral-200 dark:border-neutral-700 ms-2.5 my-0.5">
                            <li>
                              <A href="/administrator/academic/campaign/reference/attend-type" class="flex items-center gap-2 py-1 px-2 text-xs text-neutral-600 dark:text-neutral-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-neutral-800/60 rounded-md transition-colors font-mono">
                                <span class="size-1 rounded-full bg-neutral-400 dark:bg-neutral-500 shrink-0"></span>
                                <span class="truncate">{t('menu.administrator.tree.attendTypes')}</span>
                              </A>
                            </li>
                            <li>
                              <A href="/administrator/academic/campaign/reference/calendar-category" class="flex items-center gap-2 py-1 px-2 text-xs text-neutral-600 dark:text-neutral-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-neutral-800/60 rounded-md transition-colors font-mono">
                                <span class="size-1 rounded-full bg-neutral-400 dark:bg-neutral-500 shrink-0"></span>
                                <span class="truncate">{t('menu.administrator.tree.calendarCategories')}</span>
                              </A>
                            </li>
                            <li>
                              <A href="/administrator/academic/campaign/reference/encounter-category" class="flex items-center gap-2 py-1 px-2 text-xs text-neutral-600 dark:text-neutral-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-neutral-800/60 rounded-md transition-colors font-mono">
                                <span class="size-1 rounded-full bg-neutral-400 dark:bg-neutral-500 shrink-0"></span>
                                <span class="truncate">{t('menu.administrator.tree.encounterCategories')}</span>
                              </A>
                            </li>
                            <li>
                              <A href="/administrator/academic/campaign/reference/implementation" class="flex items-center gap-2 py-1 px-2 text-xs text-neutral-600 dark:text-neutral-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-neutral-800/60 rounded-md transition-colors font-mono">
                                <span class="size-1 rounded-full bg-neutral-400 dark:bg-neutral-500 shrink-0"></span>
                                <span class="truncate">{t('menu.administrator.tree.implementations')}</span>
                              </A>
                            </li>
                            <li>
                              <A href="/administrator/academic/campaign/reference/scope" class="flex items-center gap-2 py-1 px-2 text-xs text-neutral-600 dark:text-neutral-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-neutral-800/60 rounded-md transition-colors font-mono">
                                <span class="size-1 rounded-full bg-neutral-400 dark:bg-neutral-500 shrink-0"></span>
                                <span class="truncate">{t('menu.administrator.tree.scopes')}</span>
                              </A>
                            </li>
                            <li>
                              <A href="/administrator/academic/campaign/reference/substance" class="flex items-center gap-2 py-1 px-2 text-xs text-neutral-600 dark:text-neutral-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-neutral-800/60 rounded-md transition-colors font-mono">
                                <span class="size-1 rounded-full bg-neutral-400 dark:bg-neutral-500 shrink-0"></span>
                                <span class="truncate">{t('menu.administrator.tree.substances')}</span>
                              </A>
                            </li>
                          </ul>
                        </div>
                      </details>
                    </li>
                    <li>
                      <details class="group animated-details">
                        <summary class="list-none [&::-webkit-details-marker]:hidden cursor-pointer w-full text-start flex items-center justify-between py-1 px-2 text-xs font-medium text-neutral-700 dark:text-neutral-300 rounded-md hover:bg-neutral-100 dark:hover:bg-neutral-800/80 transition-colors font-mono">
                          <div class="flex items-center gap-2 truncate">
                            <svg class="size-3 text-neutral-400 group-open:rotate-90 transition-transform shrink-0" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="m9 18 6-6-6-6"/></svg>
                            <span class="truncate">{t('menu.administrator.tree.transaction')}</span>
                          </div>
                        </summary>
                        <div class="w-full details-anim-content">
                          <ul class="pt-0.5 ps-2.5 space-y-0.5 border-s border-neutral-200 dark:border-neutral-700 ms-2.5 my-0.5">
                            <li>
                              <A href="/administrator/academic/campaign/transaction/activity" class="flex items-center gap-2 py-1 px-2 text-xs text-neutral-600 dark:text-neutral-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-neutral-800/60 rounded-md transition-colors font-mono">
                                <span class="size-1 rounded-full bg-neutral-400 dark:bg-neutral-500 shrink-0"></span>
                                <span class="truncate">{t('menu.administrator.tree.activities')}</span>
                              </A>
                            </li>
                            <li>
                              <A href="/administrator/academic/campaign/transaction/calendar-detail" class="flex items-center gap-2 py-1 px-2 text-xs text-neutral-600 dark:text-neutral-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-neutral-800/60 rounded-md transition-colors font-mono">
                                <span class="size-1 rounded-full bg-neutral-400 dark:bg-neutral-500 shrink-0"></span>
                                <span class="truncate">{t('menu.administrator.tree.calendarDetails')}</span>
                              </A>
                            </li>
                            <li>
                              <A href="/administrator/academic/campaign/transaction/calendar" class="flex items-center gap-2 py-1 px-2 text-xs text-neutral-600 dark:text-neutral-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-neutral-800/60 rounded-md transition-colors font-mono">
                                <span class="size-1 rounded-full bg-neutral-400 dark:bg-neutral-500 shrink-0"></span>
                                <span class="truncate">{t('menu.administrator.tree.calendars')}</span>
                              </A>
                            </li>
                            <li>
                              <A href="/administrator/academic/campaign/transaction/class-code" class="flex items-center gap-2 py-1 px-2 text-xs text-neutral-600 dark:text-neutral-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-neutral-800/60 rounded-md transition-colors font-mono">
                                <span class="size-1 rounded-full bg-neutral-400 dark:bg-neutral-500 shrink-0"></span>
                                <span class="truncate">{t('menu.administrator.tree.classCodes')}</span>
                              </A>
                            </li>
                            <li>
                              <A href="/administrator/academic/campaign/transaction/grade" class="flex items-center gap-2 py-1 px-2 text-xs text-neutral-600 dark:text-neutral-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-neutral-800/60 rounded-md transition-colors font-mono">
                                <span class="size-1 rounded-full bg-neutral-400 dark:bg-neutral-500 shrink-0"></span>
                                <span class="truncate">{t('menu.administrator.tree.grades')}</span>
                              </A>
                            </li>
                            <li>
                              <A href="/administrator/academic/campaign/transaction/schedule" class="flex items-center gap-2 py-1 px-2 text-xs text-neutral-600 dark:text-neutral-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-neutral-800/60 rounded-md transition-colors font-mono">
                                <span class="size-1 rounded-full bg-neutral-400 dark:bg-neutral-500 shrink-0"></span>
                                <span class="truncate">{t('menu.administrator.tree.schedules')}</span>
                              </A>
                            </li>
                            <li>
                              <A href="/administrator/academic/campaign/transaction/teach-decree" class="flex items-center gap-2 py-1 px-2 text-xs text-neutral-600 dark:text-neutral-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-neutral-800/60 rounded-md transition-colors font-mono">
                                <span class="size-1 rounded-full bg-neutral-400 dark:bg-neutral-500 shrink-0"></span>
                                <span class="truncate">{t('menu.administrator.tree.teachDecrees')}</span>
                              </A>
                            </li>
                            <li>
                              <A href="/administrator/academic/campaign/transaction/teach-evaluation" class="flex items-center gap-2 py-1 px-2 text-xs text-neutral-600 dark:text-neutral-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-neutral-800/60 rounded-md transition-colors font-mono">
                                <span class="size-1 rounded-full bg-neutral-400 dark:bg-neutral-500 shrink-0"></span>
                                <span class="truncate">{t('menu.administrator.tree.teachEvaluations')}</span>
                              </A>
                            </li>
                            <li>
                              <A href="/administrator/academic/campaign/transaction/teach-lecturer" class="flex items-center gap-2 py-1 px-2 text-xs text-neutral-600 dark:text-neutral-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-neutral-800/60 rounded-md transition-colors font-mono">
                                <span class="size-1 rounded-full bg-neutral-400 dark:bg-neutral-500 shrink-0"></span>
                                <span class="truncate">{t('menu.administrator.tree.teachLecturers')}</span>
                              </A>
                            </li>
                            <li>
                              <A href="/administrator/academic/campaign/transaction/teach" class="flex items-center gap-2 py-1 px-2 text-xs text-neutral-600 dark:text-neutral-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-neutral-800/60 rounded-md transition-colors font-mono">
                                <span class="size-1 rounded-full bg-neutral-400 dark:bg-neutral-500 shrink-0"></span>
                                <span class="truncate">{t('menu.administrator.tree.teaches')}</span>
                              </A>
                            </li>
                          </ul>
                        </div>
                      </details>
                    </li>
                  </ul>
                </div>
              </details>
            </li>
            <li>
              <details class="group animated-details">
                <summary class="list-none [&::-webkit-details-marker]:hidden cursor-pointer w-full text-start flex items-center justify-between py-1 px-2 text-xs font-medium text-neutral-700 dark:text-neutral-300 rounded-md hover:bg-neutral-100 dark:hover:bg-neutral-800/80 transition-colors font-mono">
                  <div class="flex items-center gap-2 truncate">
                    <svg class="size-3 text-neutral-400 group-open:rotate-90 transition-transform shrink-0" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="m9 18 6-6-6-6"/></svg>
                    <span class="truncate">{t('menu.administrator.tree.candidate')}</span>
                  </div>
                </summary>
                <div class="w-full details-anim-content">
                  <ul class="pt-0.5 ps-2.5 space-y-0.5 border-s border-neutral-200 dark:border-neutral-700 ms-2.5 my-0.5">
                    <li>
                      <details class="group animated-details">
                        <summary class="list-none [&::-webkit-details-marker]:hidden cursor-pointer w-full text-start flex items-center justify-between py-1 px-2 text-xs font-medium text-neutral-700 dark:text-neutral-300 rounded-md hover:bg-neutral-100 dark:hover:bg-neutral-800/80 transition-colors font-mono">
                          <div class="flex items-center gap-2 truncate">
                            <svg class="size-3 text-neutral-400 group-open:rotate-90 transition-transform shrink-0" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="m9 18 6-6-6-6"/></svg>
                            <span class="truncate">{t('menu.administrator.tree.master')}</span>
                          </div>
                        </summary>
                        <div class="w-full details-anim-content">
                          <ul class="pt-0.5 ps-2.5 space-y-0.5 border-s border-neutral-200 dark:border-neutral-700 ms-2.5 my-0.5">
                            <li>
                              <A href="/administrator/academic/candidate/master/candidate-unit" class="flex items-center gap-2 py-1 px-2 text-xs text-neutral-600 dark:text-neutral-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-neutral-800/60 rounded-md transition-colors font-mono">
                                <span class="size-1 rounded-full bg-neutral-400 dark:bg-neutral-500 shrink-0"></span>
                                <span class="truncate">{t('menu.administrator.tree.candidateUnit')}</span>
                              </A>
                            </li>
                            <li>
                              <A href="/administrator/academic/candidate/master/candidate" class="flex items-center gap-2 py-1 px-2 text-xs text-neutral-600 dark:text-neutral-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-neutral-800/60 rounded-md transition-colors font-mono">
                                <span class="size-1 rounded-full bg-neutral-400 dark:bg-neutral-500 shrink-0"></span>
                                <span class="truncate">{t('menu.administrator.tree.candidates')}</span>
                              </A>
                            </li>
                            <li>
                              <A href="/administrator/academic/candidate/master/exam-class" class="flex items-center gap-2 py-1 px-2 text-xs text-neutral-600 dark:text-neutral-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-neutral-800/60 rounded-md transition-colors font-mono">
                                <span class="size-1 rounded-full bg-neutral-400 dark:bg-neutral-500 shrink-0"></span>
                                <span class="truncate">{t('menu.administrator.tree.examClasses')}</span>
                              </A>
                            </li>
                          </ul>
                        </div>
                      </details>
                    </li>
                    <li>
                      <details class="group animated-details">
                        <summary class="list-none [&::-webkit-details-marker]:hidden cursor-pointer w-full text-start flex items-center justify-between py-1 px-2 text-xs font-medium text-neutral-700 dark:text-neutral-300 rounded-md hover:bg-neutral-100 dark:hover:bg-neutral-800/80 transition-colors font-mono">
                          <div class="flex items-center gap-2 truncate">
                            <svg class="size-3 text-neutral-400 group-open:rotate-90 transition-transform shrink-0" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="m9 18 6-6-6-6"/></svg>
                            <span class="truncate">{t('menu.administrator.tree.reference')}</span>
                          </div>
                        </summary>
                        <div class="w-full details-anim-content">
                          <ul class="pt-0.5 ps-2.5 space-y-0.5 border-s border-neutral-200 dark:border-neutral-700 ms-2.5 my-0.5">
                            <li>
                              <A href="/administrator/academic/candidate/reference/document-type" class="flex items-center gap-2 py-1 px-2 text-xs text-neutral-600 dark:text-neutral-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-neutral-800/60 rounded-md transition-colors font-mono">
                                <span class="size-1 rounded-full bg-neutral-400 dark:bg-neutral-500 shrink-0"></span>
                                <span class="truncate">{t('menu.administrator.tree.documentTypes')}</span>
                              </A>
                            </li>
                            <li>
                              <A href="/administrator/academic/candidate/reference/phase" class="flex items-center gap-2 py-1 px-2 text-xs text-neutral-600 dark:text-neutral-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-neutral-800/60 rounded-md transition-colors font-mono">
                                <span class="size-1 rounded-full bg-neutral-400 dark:bg-neutral-500 shrink-0"></span>
                                <span class="truncate">{t('menu.administrator.tree.phases')}</span>
                              </A>
                            </li>
                            <li>
                              <A href="/administrator/academic/candidate/reference/registration-category" class="flex items-center gap-2 py-1 px-2 text-xs text-neutral-600 dark:text-neutral-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-neutral-800/60 rounded-md transition-colors font-mono">
                                <span class="size-1 rounded-full bg-neutral-400 dark:bg-neutral-500 shrink-0"></span>
                                <span class="truncate">{t('menu.administrator.tree.registrationCategories')}</span>
                              </A>
                            </li>
                            <li>
                              <A href="/administrator/academic/candidate/reference/registration-type" class="flex items-center gap-2 py-1 px-2 text-xs text-neutral-600 dark:text-neutral-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-neutral-800/60 rounded-md transition-colors font-mono">
                                <span class="size-1 rounded-full bg-neutral-400 dark:bg-neutral-500 shrink-0"></span>
                                <span class="truncate">{t('menu.administrator.tree.registrationTypes')}</span>
                              </A>
                            </li>
                          </ul>
                        </div>
                      </details>
                    </li>
                    <li>
                      <details class="group animated-details">
                        <summary class="list-none [&::-webkit-details-marker]:hidden cursor-pointer w-full text-start flex items-center justify-between py-1 px-2 text-xs font-medium text-neutral-700 dark:text-neutral-300 rounded-md hover:bg-neutral-100 dark:hover:bg-neutral-800/80 transition-colors font-mono">
                          <div class="flex items-center gap-2 truncate">
                            <svg class="size-3 text-neutral-400 group-open:rotate-90 transition-transform shrink-0" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="m9 18 6-6-6-6"/></svg>
                            <span class="truncate">{t('menu.administrator.tree.transaction')}</span>
                          </div>
                        </summary>
                        <div class="w-full details-anim-content">
                          <ul class="pt-0.5 ps-2.5 space-y-0.5 border-s border-neutral-200 dark:border-neutral-700 ms-2.5 my-0.5">
                            <li>
                              <A href="/administrator/academic/candidate/transaction/candidate-unit-choice" class="flex items-center gap-2 py-1 px-2 text-xs text-neutral-600 dark:text-neutral-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-neutral-800/60 rounded-md transition-colors font-mono">
                                <span class="size-1 rounded-full bg-neutral-400 dark:bg-neutral-500 shrink-0"></span>
                                <span class="truncate">{t('menu.administrator.tree.candidateUnitChoices')}</span>
                              </A>
                            </li>
                            <li>
                              <A href="/administrator/academic/candidate/transaction/document" class="flex items-center gap-2 py-1 px-2 text-xs text-neutral-600 dark:text-neutral-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-neutral-800/60 rounded-md transition-colors font-mono">
                                <span class="size-1 rounded-full bg-neutral-400 dark:bg-neutral-500 shrink-0"></span>
                                <span class="truncate">{t('menu.administrator.tree.documents')}</span>
                              </A>
                            </li>
                            <li>
                              <A href="/administrator/academic/candidate/transaction/exam" class="flex items-center gap-2 py-1 px-2 text-xs text-neutral-600 dark:text-neutral-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-neutral-800/60 rounded-md transition-colors font-mono">
                                <span class="size-1 rounded-full bg-neutral-400 dark:bg-neutral-500 shrink-0"></span>
                                <span class="truncate">{t('menu.administrator.tree.exams')}</span>
                              </A>
                            </li>
                          </ul>
                        </div>
                      </details>
                    </li>
                  </ul>
                </div>
              </details>
            </li>
            <li>
              <details class="group animated-details">
                <summary class="list-none [&::-webkit-details-marker]:hidden cursor-pointer w-full text-start flex items-center justify-between py-1 px-2 text-xs font-medium text-neutral-700 dark:text-neutral-300 rounded-md hover:bg-neutral-100 dark:hover:bg-neutral-800/80 transition-colors font-mono">
                  <div class="flex items-center gap-2 truncate">
                    <svg class="size-3 text-neutral-400 group-open:rotate-90 transition-transform shrink-0" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="m9 18 6-6-6-6"/></svg>
                    <span class="truncate">{t('menu.administrator.tree.course')}</span>
                  </div>
                </summary>
                <div class="w-full details-anim-content">
                  <ul class="pt-0.5 ps-2.5 space-y-0.5 border-s border-neutral-200 dark:border-neutral-700 ms-2.5 my-0.5">
                    <li>
                      <details class="group animated-details">
                        <summary class="list-none [&::-webkit-details-marker]:hidden cursor-pointer w-full text-start flex items-center justify-between py-1 px-2 text-xs font-medium text-neutral-700 dark:text-neutral-300 rounded-md hover:bg-neutral-100 dark:hover:bg-neutral-800/80 transition-colors font-mono">
                          <div class="flex items-center gap-2 truncate">
                            <svg class="size-3 text-neutral-400 group-open:rotate-90 transition-transform shrink-0" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="m9 18 6-6-6-6"/></svg>
                            <span class="truncate">{t('menu.administrator.tree.master')}</span>
                          </div>
                        </summary>
                        <div class="w-full details-anim-content">
                          <ul class="pt-0.5 ps-2.5 space-y-0.5 border-s border-neutral-200 dark:border-neutral-700 ms-2.5 my-0.5">
                            <li>
                              <A href="/administrator/academic/course/master/concentration" class="flex items-center gap-2 py-1 px-2 text-xs text-neutral-600 dark:text-neutral-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-neutral-800/60 rounded-md transition-colors font-mono">
                                <span class="size-1 rounded-full bg-neutral-400 dark:bg-neutral-500 shrink-0"></span>
                                <span class="truncate">{t('menu.administrator.tree.concentrations')}</span>
                              </A>
                            </li>
                            <li>
                              <A href="/administrator/academic/course/master/course-evaluation-planning" class="flex items-center gap-2 py-1 px-2 text-xs text-neutral-600 dark:text-neutral-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-neutral-800/60 rounded-md transition-colors font-mono">
                                <span class="size-1 rounded-full bg-neutral-400 dark:bg-neutral-500 shrink-0"></span>
                                <span class="truncate">{t('menu.administrator.tree.courseEvaluationPlannings')}</span>
                              </A>
                            </li>
                            <li>
                              <A href="/administrator/academic/course/master/course-learn-planning" class="flex items-center gap-2 py-1 px-2 text-xs text-neutral-600 dark:text-neutral-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-neutral-800/60 rounded-md transition-colors font-mono">
                                <span class="size-1 rounded-full bg-neutral-400 dark:bg-neutral-500 shrink-0"></span>
                                <span class="truncate">{t('menu.administrator.tree.courseLearnPlannings')}</span>
                              </A>
                            </li>
                            <li>
                              <A href="/administrator/academic/course/master/course" class="flex items-center gap-2 py-1 px-2 text-xs text-neutral-600 dark:text-neutral-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-neutral-800/60 rounded-md transition-colors font-mono">
                                <span class="size-1 rounded-full bg-neutral-400 dark:bg-neutral-500 shrink-0"></span>
                                <span class="truncate">{t('menu.administrator.tree.courses')}</span>
                              </A>
                            </li>
                            <li>
                              <A href="/administrator/academic/course/master/curriculum-detail" class="flex items-center gap-2 py-1 px-2 text-xs text-neutral-600 dark:text-neutral-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-neutral-800/60 rounded-md transition-colors font-mono">
                                <span class="size-1 rounded-full bg-neutral-400 dark:bg-neutral-500 shrink-0"></span>
                                <span class="truncate">{t('menu.administrator.tree.curriculumDetails')}</span>
                              </A>
                            </li>
                            <li>
                              <A href="/administrator/academic/course/master/curriculum" class="flex items-center gap-2 py-1 px-2 text-xs text-neutral-600 dark:text-neutral-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-neutral-800/60 rounded-md transition-colors font-mono">
                                <span class="size-1 rounded-full bg-neutral-400 dark:bg-neutral-500 shrink-0"></span>
                                <span class="truncate">{t('menu.administrator.tree.curriculums')}</span>
                              </A>
                            </li>
                          </ul>
                        </div>
                      </details>
                    </li>
                    <li>
                      <details class="group animated-details">
                        <summary class="list-none [&::-webkit-details-marker]:hidden cursor-pointer w-full text-start flex items-center justify-between py-1 px-2 text-xs font-medium text-neutral-700 dark:text-neutral-300 rounded-md hover:bg-neutral-100 dark:hover:bg-neutral-800/80 transition-colors font-mono">
                          <div class="flex items-center gap-2 truncate">
                            <svg class="size-3 text-neutral-400 group-open:rotate-90 transition-transform shrink-0" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="m9 18 6-6-6-6"/></svg>
                            <span class="truncate">{t('menu.administrator.tree.reference')}</span>
                          </div>
                        </summary>
                        <div class="w-full details-anim-content">
                          <ul class="pt-0.5 ps-2.5 space-y-0.5 border-s border-neutral-200 dark:border-neutral-700 ms-2.5 my-0.5">
                            <li>
                              <A href="/administrator/academic/course/reference/competence" class="flex items-center gap-2 py-1 px-2 text-xs text-neutral-600 dark:text-neutral-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-neutral-800/60 rounded-md transition-colors font-mono">
                                <span class="size-1 rounded-full bg-neutral-400 dark:bg-neutral-500 shrink-0"></span>
                                <span class="truncate">{t('menu.administrator.tree.competences')}</span>
                              </A>
                            </li>
                            <li>
                              <A href="/administrator/academic/course/reference/course-evaluation-base" class="flex items-center gap-2 py-1 px-2 text-xs text-neutral-600 dark:text-neutral-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-neutral-800/60 rounded-md transition-colors font-mono">
                                <span class="size-1 rounded-full bg-neutral-400 dark:bg-neutral-500 shrink-0"></span>
                                <span class="truncate">{t('menu.administrator.tree.courseEvaluationBases')}</span>
                              </A>
                            </li>
                            <li>
                              <A href="/administrator/academic/course/reference/curriculum-type" class="flex items-center gap-2 py-1 px-2 text-xs text-neutral-600 dark:text-neutral-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-neutral-800/60 rounded-md transition-colors font-mono">
                                <span class="size-1 rounded-full bg-neutral-400 dark:bg-neutral-500 shrink-0"></span>
                                <span class="truncate">{t('menu.administrator.tree.curriculumTypes')}</span>
                              </A>
                            </li>
                            <li>
                              <A href="/administrator/academic/course/reference/encounter-type" class="flex items-center gap-2 py-1 px-2 text-xs text-neutral-600 dark:text-neutral-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-neutral-800/60 rounded-md transition-colors font-mono">
                                <span class="size-1 rounded-full bg-neutral-400 dark:bg-neutral-500 shrink-0"></span>
                                <span class="truncate">{t('menu.administrator.tree.encounterTypes')}</span>
                              </A>
                            </li>
                            <li>
                              <A href="/administrator/academic/course/reference/evaluation-type" class="flex items-center gap-2 py-1 px-2 text-xs text-neutral-600 dark:text-neutral-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-neutral-800/60 rounded-md transition-colors font-mono">
                                <span class="size-1 rounded-full bg-neutral-400 dark:bg-neutral-500 shrink-0"></span>
                                <span class="truncate">{t('menu.administrator.tree.evaluationTypes')}</span>
                              </A>
                            </li>
                            <li>
                              <A href="/administrator/academic/course/reference/group" class="flex items-center gap-2 py-1 px-2 text-xs text-neutral-600 dark:text-neutral-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-neutral-800/60 rounded-md transition-colors font-mono">
                                <span class="size-1 rounded-full bg-neutral-400 dark:bg-neutral-500 shrink-0"></span>
                                <span class="truncate">{t('menu.administrator.tree.groups')}</span>
                              </A>
                            </li>
                            <li>
                              <A href="/administrator/academic/course/reference/semester" class="flex items-center gap-2 py-1 px-2 text-xs text-neutral-600 dark:text-neutral-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-neutral-800/60 rounded-md transition-colors font-mono">
                                <span class="size-1 rounded-full bg-neutral-400 dark:bg-neutral-500 shrink-0"></span>
                                <span class="truncate">{t('menu.administrator.tree.semesters')}</span>
                              </A>
                            </li>
                            <li>
                              <A href="/administrator/academic/course/reference/variety" class="flex items-center gap-2 py-1 px-2 text-xs text-neutral-600 dark:text-neutral-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-neutral-800/60 rounded-md transition-colors font-mono">
                                <span class="size-1 rounded-full bg-neutral-400 dark:bg-neutral-500 shrink-0"></span>
                                <span class="truncate">{t('menu.administrator.tree.varieties')}</span>
                              </A>
                            </li>
                          </ul>
                        </div>
                      </details>
                    </li>
                  </ul>
                </div>
              </details>
            </li>
            <li>
              <details class="group animated-details">
                <summary class="list-none [&::-webkit-details-marker]:hidden cursor-pointer w-full text-start flex items-center justify-between py-1 px-2 text-xs font-medium text-neutral-700 dark:text-neutral-300 rounded-md hover:bg-neutral-100 dark:hover:bg-neutral-800/80 transition-colors font-mono">
                  <div class="flex items-center gap-2 truncate">
                    <svg class="size-3 text-neutral-400 group-open:rotate-90 transition-transform shrink-0" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="m9 18 6-6-6-6"/></svg>
                    <span class="truncate">{t('menu.administrator.tree.general')}</span>
                  </div>
                </summary>
                <div class="w-full details-anim-content">
                  <ul class="pt-0.5 ps-2.5 space-y-0.5 border-s border-neutral-200 dark:border-neutral-700 ms-2.5 my-0.5">
                    <li>
                      <details class="group animated-details">
                        <summary class="list-none [&::-webkit-details-marker]:hidden cursor-pointer w-full text-start flex items-center justify-between py-1 px-2 text-xs font-medium text-neutral-700 dark:text-neutral-300 rounded-md hover:bg-neutral-100 dark:hover:bg-neutral-800/80 transition-colors font-mono">
                          <div class="flex items-center gap-2 truncate">
                            <svg class="size-3 text-neutral-400 group-open:rotate-90 transition-transform shrink-0" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="m9 18 6-6-6-6"/></svg>
                            <span class="truncate">{t('menu.administrator.tree.reference')}</span>
                          </div>
                        </summary>
                        <div class="w-full details-anim-content">
                          <ul class="pt-0.5 ps-2.5 space-y-0.5 border-s border-neutral-200 dark:border-neutral-700 ms-2.5 my-0.5">
                            <li>
                              <A href="/administrator/academic/general/reference/academic-year-category" class="flex items-center gap-2 py-1 px-2 text-xs text-neutral-600 dark:text-neutral-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-neutral-800/60 rounded-md transition-colors font-mono">
                                <span class="size-1 rounded-full bg-neutral-400 dark:bg-neutral-500 shrink-0"></span>
                                <span class="truncate">{t('menu.administrator.tree.academicYearCategories')}</span>
                              </A>
                            </li>
                            <li>
                              <A href="/administrator/academic/general/reference/academic-year" class="flex items-center gap-2 py-1 px-2 text-xs text-neutral-600 dark:text-neutral-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-neutral-800/60 rounded-md transition-colors font-mono">
                                <span class="size-1 rounded-full bg-neutral-400 dark:bg-neutral-500 shrink-0"></span>
                                <span class="truncate">{t('menu.administrator.tree.academicYears')}</span>
                              </A>
                            </li>
                          </ul>
                        </div>
                      </details>
                    </li>
                  </ul>
                </div>
              </details>
            </li>
            <li>
              <details class="group animated-details">
                <summary class="list-none [&::-webkit-details-marker]:hidden cursor-pointer w-full text-start flex items-center justify-between py-1 px-2 text-xs font-medium text-neutral-700 dark:text-neutral-300 rounded-md hover:bg-neutral-100 dark:hover:bg-neutral-800/80 transition-colors font-mono">
                  <div class="flex items-center gap-2 truncate">
                    <svg class="size-3 text-neutral-400 group-open:rotate-90 transition-transform shrink-0" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="m9 18 6-6-6-6"/></svg>
                    <span class="truncate">{t('menu.administrator.tree.lecturer')}</span>
                  </div>
                </summary>
                <div class="w-full details-anim-content">
                  <ul class="pt-0.5 ps-2.5 space-y-0.5 border-s border-neutral-200 dark:border-neutral-700 ms-2.5 my-0.5">
                    <li>
                      <details class="group animated-details">
                        <summary class="list-none [&::-webkit-details-marker]:hidden cursor-pointer w-full text-start flex items-center justify-between py-1 px-2 text-xs font-medium text-neutral-700 dark:text-neutral-300 rounded-md hover:bg-neutral-100 dark:hover:bg-neutral-800/80 transition-colors font-mono">
                          <div class="flex items-center gap-2 truncate">
                            <svg class="size-3 text-neutral-400 group-open:rotate-90 transition-transform shrink-0" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="m9 18 6-6-6-6"/></svg>
                            <span class="truncate">{t('menu.administrator.tree.master')}</span>
                          </div>
                        </summary>
                        <div class="w-full details-anim-content">
                          <ul class="pt-0.5 ps-2.5 space-y-0.5 border-s border-neutral-200 dark:border-neutral-700 ms-2.5 my-0.5">
                            <li>
                              <A href="/administrator/academic/lecturer/master/lecturer" class="flex items-center gap-2 py-1 px-2 text-xs text-neutral-600 dark:text-neutral-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-neutral-800/60 rounded-md transition-colors font-mono">
                                <span class="size-1 rounded-full bg-neutral-400 dark:bg-neutral-500 shrink-0"></span>
                                <span class="truncate">{t('menu.administrator.tree.lecturers')}</span>
                              </A>
                            </li>
                          </ul>
                        </div>
                      </details>
                    </li>
                    <li>
                      <details class="group animated-details">
                        <summary class="list-none [&::-webkit-details-marker]:hidden cursor-pointer w-full text-start flex items-center justify-between py-1 px-2 text-xs font-medium text-neutral-700 dark:text-neutral-300 rounded-md hover:bg-neutral-100 dark:hover:bg-neutral-800/80 transition-colors font-mono">
                          <div class="flex items-center gap-2 truncate">
                            <svg class="size-3 text-neutral-400 group-open:rotate-90 transition-transform shrink-0" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="m9 18 6-6-6-6"/></svg>
                            <span class="truncate">{t('menu.administrator.tree.reference')}</span>
                          </div>
                        </summary>
                        <div class="w-full details-anim-content">
                          <ul class="pt-0.5 ps-2.5 space-y-0.5 border-s border-neutral-200 dark:border-neutral-700 ms-2.5 my-0.5">
                            <li>
                              <A href="/administrator/academic/lecturer/reference/contract" class="flex items-center gap-2 py-1 px-2 text-xs text-neutral-600 dark:text-neutral-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-neutral-800/60 rounded-md transition-colors font-mono">
                                <span class="size-1 rounded-full bg-neutral-400 dark:bg-neutral-500 shrink-0"></span>
                                <span class="truncate">{t('menu.administrator.tree.contracts')}</span>
                              </A>
                            </li>
                            <li>
                              <A href="/administrator/academic/lecturer/reference/group" class="flex items-center gap-2 py-1 px-2 text-xs text-neutral-600 dark:text-neutral-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-neutral-800/60 rounded-md transition-colors font-mono">
                                <span class="size-1 rounded-full bg-neutral-400 dark:bg-neutral-500 shrink-0"></span>
                                <span class="truncate">{t('menu.administrator.tree.groups')}</span>
                              </A>
                            </li>
                            <li>
                              <A href="/administrator/academic/lecturer/reference/rank" class="flex items-center gap-2 py-1 px-2 text-xs text-neutral-600 dark:text-neutral-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-neutral-800/60 rounded-md transition-colors font-mono">
                                <span class="size-1 rounded-full bg-neutral-400 dark:bg-neutral-500 shrink-0"></span>
                                <span class="truncate">{t('menu.administrator.tree.ranks')}</span>
                              </A>
                            </li>
                            <li>
                              <A href="/administrator/academic/lecturer/reference/status" class="flex items-center gap-2 py-1 px-2 text-xs text-neutral-600 dark:text-neutral-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-neutral-800/60 rounded-md transition-colors font-mono">
                                <span class="size-1 rounded-full bg-neutral-400 dark:bg-neutral-500 shrink-0"></span>
                                <span class="truncate">{t('menu.administrator.tree.statuses')}</span>
                              </A>
                            </li>
                          </ul>
                        </div>
                      </details>
                    </li>
                    <li>
                      <details class="group animated-details">
                        <summary class="list-none [&::-webkit-details-marker]:hidden cursor-pointer w-full text-start flex items-center justify-between py-1 px-2 text-xs font-medium text-neutral-700 dark:text-neutral-300 rounded-md hover:bg-neutral-100 dark:hover:bg-neutral-800/80 transition-colors font-mono">
                          <div class="flex items-center gap-2 truncate">
                            <svg class="size-3 text-neutral-400 group-open:rotate-90 transition-transform shrink-0" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="m9 18 6-6-6-6"/></svg>
                            <span class="truncate">{t('menu.administrator.tree.transaction')}</span>
                          </div>
                        </summary>
                        <div class="w-full details-anim-content">
                          <ul class="pt-0.5 ps-2.5 space-y-0.5 border-s border-neutral-200 dark:border-neutral-700 ms-2.5 my-0.5">
                            <li>
                              <A href="/administrator/academic/lecturer/transaction/academic-group" class="flex items-center gap-2 py-1 px-2 text-xs text-neutral-600 dark:text-neutral-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-neutral-800/60 rounded-md transition-colors font-mono">
                                <span class="size-1 rounded-full bg-neutral-400 dark:bg-neutral-500 shrink-0"></span>
                                <span class="truncate">{t('menu.administrator.tree.academicGroups')}</span>
                              </A>
                            </li>
                            <li>
                              <A href="/administrator/academic/lecturer/transaction/academic-rank" class="flex items-center gap-2 py-1 px-2 text-xs text-neutral-600 dark:text-neutral-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-neutral-800/60 rounded-md transition-colors font-mono">
                                <span class="size-1 rounded-full bg-neutral-400 dark:bg-neutral-500 shrink-0"></span>
                                <span class="truncate">{t('menu.administrator.tree.academicRanks')}</span>
                              </A>
                            </li>
                            <li>
                              <A href="/administrator/academic/lecturer/transaction/homebase" class="flex items-center gap-2 py-1 px-2 text-xs text-neutral-600 dark:text-neutral-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-neutral-800/60 rounded-md transition-colors font-mono">
                                <span class="size-1 rounded-full bg-neutral-400 dark:bg-neutral-500 shrink-0"></span>
                                <span class="truncate">{t('menu.administrator.tree.homebases')}</span>
                              </A>
                            </li>
                          </ul>
                        </div>
                      </details>
                    </li>
                  </ul>
                </div>
              </details>
            </li>
            <li>
              <details class="group animated-details">
                <summary class="list-none [&::-webkit-details-marker]:hidden cursor-pointer w-full text-start flex items-center justify-between py-1 px-2 text-xs font-medium text-neutral-700 dark:text-neutral-300 rounded-md hover:bg-neutral-100 dark:hover:bg-neutral-800/80 transition-colors font-mono">
                  <div class="flex items-center gap-2 truncate">
                    <svg class="size-3 text-neutral-400 group-open:rotate-90 transition-transform shrink-0" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="m9 18 6-6-6-6"/></svg>
                    <span class="truncate">{t('menu.administrator.tree.priorLearningRecognition')}</span>
                  </div>
                </summary>
                <div class="w-full details-anim-content">
                  <ul class="pt-0.5 ps-2.5 space-y-0.5 border-s border-neutral-200 dark:border-neutral-700 ms-2.5 my-0.5">
                    <li>
                      <details class="group animated-details">
                        <summary class="list-none [&::-webkit-details-marker]:hidden cursor-pointer w-full text-start flex items-center justify-between py-1 px-2 text-xs font-medium text-neutral-700 dark:text-neutral-300 rounded-md hover:bg-neutral-100 dark:hover:bg-neutral-800/80 transition-colors font-mono">
                          <div class="flex items-center gap-2 truncate">
                            <svg class="size-3 text-neutral-400 group-open:rotate-90 transition-transform shrink-0" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="m9 18 6-6-6-6"/></svg>
                            <span class="truncate">{t('menu.administrator.tree.reference')}</span>
                          </div>
                        </summary>
                        <div class="w-full details-anim-content">
                          <ul class="pt-0.5 ps-2.5 space-y-0.5 border-s border-neutral-200 dark:border-neutral-700 ms-2.5 my-0.5">
                            <li>
                              <A href="/administrator/academic/prior-learning-recognition/reference/evaluator-type" class="flex items-center gap-2 py-1 px-2 text-xs text-neutral-600 dark:text-neutral-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-neutral-800/60 rounded-md transition-colors font-mono">
                                <span class="size-1 rounded-full bg-neutral-400 dark:bg-neutral-500 shrink-0"></span>
                                <span class="truncate">{t('menu.administrator.tree.evaluatorTypes')}</span>
                              </A>
                            </li>
                            <li>
                              <A href="/administrator/academic/prior-learning-recognition/reference/evidence-category" class="flex items-center gap-2 py-1 px-2 text-xs text-neutral-600 dark:text-neutral-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-neutral-800/60 rounded-md transition-colors font-mono">
                                <span class="size-1 rounded-full bg-neutral-400 dark:bg-neutral-500 shrink-0"></span>
                                <span class="truncate">{t('menu.administrator.tree.evidenceCategories')}</span>
                              </A>
                            </li>
                            <li>
                              <A href="/administrator/academic/prior-learning-recognition/reference/evidence-type" class="flex items-center gap-2 py-1 px-2 text-xs text-neutral-600 dark:text-neutral-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-neutral-800/60 rounded-md transition-colors font-mono">
                                <span class="size-1 rounded-full bg-neutral-400 dark:bg-neutral-500 shrink-0"></span>
                                <span class="truncate">{t('menu.administrator.tree.evidenceTypes')}</span>
                              </A>
                            </li>
                            <li>
                              <A href="/administrator/academic/prior-learning-recognition/reference/professionalism" class="flex items-center gap-2 py-1 px-2 text-xs text-neutral-600 dark:text-neutral-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-neutral-800/60 rounded-md transition-colors font-mono">
                                <span class="size-1 rounded-full bg-neutral-400 dark:bg-neutral-500 shrink-0"></span>
                                <span class="truncate">{t('menu.administrator.tree.professionalisms')}</span>
                              </A>
                            </li>
                          </ul>
                        </div>
                      </details>
                    </li>
                    <li>
                      <details class="group animated-details">
                        <summary class="list-none [&::-webkit-details-marker]:hidden cursor-pointer w-full text-start flex items-center justify-between py-1 px-2 text-xs font-medium text-neutral-700 dark:text-neutral-300 rounded-md hover:bg-neutral-100 dark:hover:bg-neutral-800/80 transition-colors font-mono">
                          <div class="flex items-center gap-2 truncate">
                            <svg class="size-3 text-neutral-400 group-open:rotate-90 transition-transform shrink-0" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="m9 18 6-6-6-6"/></svg>
                            <span class="truncate">{t('menu.administrator.tree.transaction')}</span>
                          </div>
                        </summary>
                        <div class="w-full details-anim-content">
                          <ul class="pt-0.5 ps-2.5 space-y-0.5 border-s border-neutral-200 dark:border-neutral-700 ms-2.5 my-0.5">
                            <li>
                              <A href="/administrator/academic/prior-learning-recognition/transaction/decree" class="flex items-center gap-2 py-1 px-2 text-xs text-neutral-600 dark:text-neutral-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-neutral-800/60 rounded-md transition-colors font-mono">
                                <span class="size-1 rounded-full bg-neutral-400 dark:bg-neutral-500 shrink-0"></span>
                                <span class="truncate">{t('menu.administrator.tree.decrees')}</span>
                              </A>
                            </li>
                            <li>
                              <A href="/administrator/academic/prior-learning-recognition/transaction/evaluation-detail" class="flex items-center gap-2 py-1 px-2 text-xs text-neutral-600 dark:text-neutral-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-neutral-800/60 rounded-md transition-colors font-mono">
                                <span class="size-1 rounded-full bg-neutral-400 dark:bg-neutral-500 shrink-0"></span>
                                <span class="truncate">{t('menu.administrator.tree.evaluationDetails')}</span>
                              </A>
                            </li>
                            <li>
                              <A href="/administrator/academic/prior-learning-recognition/transaction/evaluation" class="flex items-center gap-2 py-1 px-2 text-xs text-neutral-600 dark:text-neutral-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-neutral-800/60 rounded-md transition-colors font-mono">
                                <span class="size-1 rounded-full bg-neutral-400 dark:bg-neutral-500 shrink-0"></span>
                                <span class="truncate">{t('menu.administrator.tree.evaluations')}</span>
                              </A>
                            </li>
                            <li>
                              <A href="/administrator/academic/prior-learning-recognition/transaction/evaluator" class="flex items-center gap-2 py-1 px-2 text-xs text-neutral-600 dark:text-neutral-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-neutral-800/60 rounded-md transition-colors font-mono">
                                <span class="size-1 rounded-full bg-neutral-400 dark:bg-neutral-500 shrink-0"></span>
                                <span class="truncate">{t('menu.administrator.tree.evaluators')}</span>
                              </A>
                            </li>
                            <li>
                              <A href="/administrator/academic/prior-learning-recognition/transaction/recognition" class="flex items-center gap-2 py-1 px-2 text-xs text-neutral-600 dark:text-neutral-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-neutral-800/60 rounded-md transition-colors font-mono">
                                <span class="size-1 rounded-full bg-neutral-400 dark:bg-neutral-500 shrink-0"></span>
                                <span class="truncate">{t('menu.administrator.tree.recognitions')}</span>
                              </A>
                            </li>
                          </ul>
                        </div>
                      </details>
                    </li>
                  </ul>
                </div>
              </details>
            </li>
            <li>
              <details class="group animated-details">
                <summary class="list-none [&::-webkit-details-marker]:hidden cursor-pointer w-full text-start flex items-center justify-between py-1 px-2 text-xs font-medium text-neutral-700 dark:text-neutral-300 rounded-md hover:bg-neutral-100 dark:hover:bg-neutral-800/80 transition-colors font-mono">
                  <div class="flex items-center gap-2 truncate">
                    <svg class="size-3 text-neutral-400 group-open:rotate-90 transition-transform shrink-0" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="m9 18 6-6-6-6"/></svg>
                    <span class="truncate">{t('menu.administrator.tree.student')}</span>
                  </div>
                </summary>
                <div class="w-full details-anim-content">
                  <ul class="pt-0.5 ps-2.5 space-y-0.5 border-s border-neutral-200 dark:border-neutral-700 ms-2.5 my-0.5">
                    <li>
                      <details class="group animated-details">
                        <summary class="list-none [&::-webkit-details-marker]:hidden cursor-pointer w-full text-start flex items-center justify-between py-1 px-2 text-xs font-medium text-neutral-700 dark:text-neutral-300 rounded-md hover:bg-neutral-100 dark:hover:bg-neutral-800/80 transition-colors font-mono">
                          <div class="flex items-center gap-2 truncate">
                            <svg class="size-3 text-neutral-400 group-open:rotate-90 transition-transform shrink-0" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="m9 18 6-6-6-6"/></svg>
                            <span class="truncate">{t('menu.administrator.tree.adviser')}</span>
                          </div>
                        </summary>
                        <div class="w-full details-anim-content">
                          <ul class="pt-0.5 ps-2.5 space-y-0.5 border-s border-neutral-200 dark:border-neutral-700 ms-2.5 my-0.5">
                            <li>
                              <A href="/administrator/academic/student/adviser/counsellor" class="flex items-center gap-2 py-1 px-2 text-xs text-neutral-600 dark:text-neutral-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-neutral-800/60 rounded-md transition-colors font-mono">
                                <span class="size-1 rounded-full bg-neutral-400 dark:bg-neutral-500 shrink-0"></span>
                                <span class="truncate">{t('menu.administrator.tree.counsellors')}</span>
                              </A>
                            </li>
                            <li>
                              <A href="/administrator/academic/student/adviser/decree" class="flex items-center gap-2 py-1 px-2 text-xs text-neutral-600 dark:text-neutral-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-neutral-800/60 rounded-md transition-colors font-mono">
                                <span class="size-1 rounded-full bg-neutral-400 dark:bg-neutral-500 shrink-0"></span>
                                <span class="truncate">{t('menu.administrator.tree.decrees')}</span>
                              </A>
                            </li>
                          </ul>
                        </div>
                      </details>
                    </li>
                    <li>
                      <details class="group animated-details">
                        <summary class="list-none [&::-webkit-details-marker]:hidden cursor-pointer w-full text-start flex items-center justify-between py-1 px-2 text-xs font-medium text-neutral-700 dark:text-neutral-300 rounded-md hover:bg-neutral-100 dark:hover:bg-neutral-800/80 transition-colors font-mono">
                          <div class="flex items-center gap-2 truncate">
                            <svg class="size-3 text-neutral-400 group-open:rotate-90 transition-transform shrink-0" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="m9 18 6-6-6-6"/></svg>
                            <span class="truncate">{t('menu.administrator.tree.campaign')}</span>
                          </div>
                        </summary>
                        <div class="w-full details-anim-content">
                          <ul class="pt-0.5 ps-2.5 space-y-0.5 border-s border-neutral-200 dark:border-neutral-700 ms-2.5 my-0.5">
                            <li>
                              <A href="/administrator/academic/student/campaign/convertion" class="flex items-center gap-2 py-1 px-2 text-xs text-neutral-600 dark:text-neutral-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-neutral-800/60 rounded-md transition-colors font-mono">
                                <span class="size-1 rounded-full bg-neutral-400 dark:bg-neutral-500 shrink-0"></span>
                                <span class="truncate">{t('menu.administrator.tree.convertions')}</span>
                              </A>
                            </li>
                            <li>
                              <A href="/administrator/academic/student/campaign/detail-activity" class="flex items-center gap-2 py-1 px-2 text-xs text-neutral-600 dark:text-neutral-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-neutral-800/60 rounded-md transition-colors font-mono">
                                <span class="size-1 rounded-full bg-neutral-400 dark:bg-neutral-500 shrink-0"></span>
                                <span class="truncate">{t('menu.administrator.tree.detailActivities')}</span>
                              </A>
                            </li>
                            <li>
                              <A href="/administrator/academic/student/campaign/detail-activity-evaluation-component" class="flex items-center gap-2 py-1 px-2 text-xs text-neutral-600 dark:text-neutral-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-neutral-800/60 rounded-md transition-colors font-mono">
                                <span class="size-1 rounded-full bg-neutral-400 dark:bg-neutral-500 shrink-0"></span>
                                <span class="truncate">{t('menu.administrator.tree.detailActivityEvaluationComponents')}</span>
                              </A>
                            </li>
                            <li>
                              <A href="/administrator/academic/student/campaign/student-activity" class="flex items-center gap-2 py-1 px-2 text-xs text-neutral-600 dark:text-neutral-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-neutral-800/60 rounded-md transition-colors font-mono">
                                <span class="size-1 rounded-full bg-neutral-400 dark:bg-neutral-500 shrink-0"></span>
                                <span class="truncate">{t('menu.administrator.tree.studentActivities')}</span>
                              </A>
                            </li>
                          </ul>
                        </div>
                      </details>
                    </li>
                    <li>
                      <details class="group animated-details">
                        <summary class="list-none [&::-webkit-details-marker]:hidden cursor-pointer w-full text-start flex items-center justify-between py-1 px-2 text-xs font-medium text-neutral-700 dark:text-neutral-300 rounded-md hover:bg-neutral-100 dark:hover:bg-neutral-800/80 transition-colors font-mono">
                          <div class="flex items-center gap-2 truncate">
                            <svg class="size-3 text-neutral-400 group-open:rotate-90 transition-transform shrink-0" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="m9 18 6-6-6-6"/></svg>
                            <span class="truncate">{t('menu.administrator.tree.finalAssignment')}</span>
                          </div>
                        </summary>
                        <div class="w-full details-anim-content">
                          <ul class="pt-0.5 ps-2.5 space-y-0.5 border-s border-neutral-200 dark:border-neutral-700 ms-2.5 my-0.5">
                            <li>
                              <details class="group animated-details">
                                <summary class="list-none [&::-webkit-details-marker]:hidden cursor-pointer w-full text-start flex items-center justify-between py-1 px-2 text-xs font-medium text-neutral-700 dark:text-neutral-300 rounded-md hover:bg-neutral-100 dark:hover:bg-neutral-800/80 transition-colors font-mono">
                                  <div class="flex items-center gap-2 truncate">
                                    <svg class="size-3 text-neutral-400 group-open:rotate-90 transition-transform shrink-0" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="m9 18 6-6-6-6"/></svg>
                                    <span class="truncate">{t('menu.administrator.tree.reference')}</span>
                                  </div>
                                </summary>
                                <div class="w-full details-anim-content">
                                  <ul class="pt-0.5 ps-2.5 space-y-0.5 border-s border-neutral-200 dark:border-neutral-700 ms-2.5 my-0.5">
                                    <li>
                                      <A href="/administrator/academic/student/final-assignment/reference/adviser-category" class="flex items-center gap-2 py-1 px-2 text-xs text-neutral-600 dark:text-neutral-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-neutral-800/60 rounded-md transition-colors font-mono">
                                        <span class="size-1 rounded-full bg-neutral-400 dark:bg-neutral-500 shrink-0"></span>
                                        <span class="truncate">{t('menu.administrator.tree.adviserCategories')}</span>
                                      </A>
                                    </li>
                                    <li>
                                      <A href="/administrator/academic/student/final-assignment/reference/approval-type" class="flex items-center gap-2 py-1 px-2 text-xs text-neutral-600 dark:text-neutral-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-neutral-800/60 rounded-md transition-colors font-mono">
                                        <span class="size-1 rounded-full bg-neutral-400 dark:bg-neutral-500 shrink-0"></span>
                                        <span class="truncate">{t('menu.administrator.tree.approvalTypes')}</span>
                                      </A>
                                    </li>
                                    <li>
                                      <A href="/administrator/academic/student/final-assignment/reference/category" class="flex items-center gap-2 py-1 px-2 text-xs text-neutral-600 dark:text-neutral-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-neutral-800/60 rounded-md transition-colors font-mono">
                                        <span class="size-1 rounded-full bg-neutral-400 dark:bg-neutral-500 shrink-0"></span>
                                        <span class="truncate">{t('menu.administrator.tree.categories')}</span>
                                      </A>
                                    </li>
                                    <li>
                                      <A href="/administrator/academic/student/final-assignment/reference/requirement" class="flex items-center gap-2 py-1 px-2 text-xs text-neutral-600 dark:text-neutral-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-neutral-800/60 rounded-md transition-colors font-mono">
                                        <span class="size-1 rounded-full bg-neutral-400 dark:bg-neutral-500 shrink-0"></span>
                                        <span class="truncate">{t('menu.administrator.tree.requirements')}</span>
                                      </A>
                                    </li>
                                    <li>
                                      <A href="/administrator/academic/student/final-assignment/reference/stage" class="flex items-center gap-2 py-1 px-2 text-xs text-neutral-600 dark:text-neutral-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-neutral-800/60 rounded-md transition-colors font-mono">
                                        <span class="size-1 rounded-full bg-neutral-400 dark:bg-neutral-500 shrink-0"></span>
                                        <span class="truncate">{t('menu.administrator.tree.stages')}</span>
                                      </A>
                                    </li>
                                    <li>
                                      <A href="/administrator/academic/student/final-assignment/reference/variety" class="flex items-center gap-2 py-1 px-2 text-xs text-neutral-600 dark:text-neutral-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-neutral-800/60 rounded-md transition-colors font-mono">
                                        <span class="size-1 rounded-full bg-neutral-400 dark:bg-neutral-500 shrink-0"></span>
                                        <span class="truncate">{t('menu.administrator.tree.varieties')}</span>
                                      </A>
                                    </li>
                                  </ul>
                                </div>
                              </details>
                            </li>
                            <li>
                              <details class="group animated-details">
                                <summary class="list-none [&::-webkit-details-marker]:hidden cursor-pointer w-full text-start flex items-center justify-between py-1 px-2 text-xs font-medium text-neutral-700 dark:text-neutral-300 rounded-md hover:bg-neutral-100 dark:hover:bg-neutral-800/80 transition-colors font-mono">
                                  <div class="flex items-center gap-2 truncate">
                                    <svg class="size-3 text-neutral-400 group-open:rotate-90 transition-transform shrink-0" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="m9 18 6-6-6-6"/></svg>
                                    <span class="truncate">{t('menu.administrator.tree.transaction')}</span>
                                  </div>
                                </summary>
                                <div class="w-full details-anim-content">
                                  <ul class="pt-0.5 ps-2.5 space-y-0.5 border-s border-neutral-200 dark:border-neutral-700 ms-2.5 my-0.5">
                                    <li>
                                      <A href="/administrator/academic/student/final-assignment/transaction/adviser" class="flex items-center gap-2 py-1 px-2 text-xs text-neutral-600 dark:text-neutral-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-neutral-800/60 rounded-md transition-colors font-mono">
                                        <span class="size-1 rounded-full bg-neutral-400 dark:bg-neutral-500 shrink-0"></span>
                                        <span class="truncate">{t('menu.administrator.tree.advisers')}</span>
                                      </A>
                                    </li>
                                    <li>
                                      <A href="/administrator/academic/student/final-assignment/transaction/evaluation-detail" class="flex items-center gap-2 py-1 px-2 text-xs text-neutral-600 dark:text-neutral-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-neutral-800/60 rounded-md transition-colors font-mono">
                                        <span class="size-1 rounded-full bg-neutral-400 dark:bg-neutral-500 shrink-0"></span>
                                        <span class="truncate">{t('menu.administrator.tree.evaluationDetails')}</span>
                                      </A>
                                    </li>
                                    <li>
                                      <A href="/administrator/academic/student/final-assignment/transaction/evaluation-summary" class="flex items-center gap-2 py-1 px-2 text-xs text-neutral-600 dark:text-neutral-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-neutral-800/60 rounded-md transition-colors font-mono">
                                        <span class="size-1 rounded-full bg-neutral-400 dark:bg-neutral-500 shrink-0"></span>
                                        <span class="truncate">{t('menu.administrator.tree.evaluationSummaries')}</span>
                                      </A>
                                    </li>
                                    <li>
                                      <A href="/administrator/academic/student/final-assignment/transaction/final-assignment-decree" class="flex items-center gap-2 py-1 px-2 text-xs text-neutral-600 dark:text-neutral-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-neutral-800/60 rounded-md transition-colors font-mono">
                                        <span class="size-1 rounded-full bg-neutral-400 dark:bg-neutral-500 shrink-0"></span>
                                        <span class="truncate">{t('menu.administrator.tree.finalAssignmentDecrees')}</span>
                                      </A>
                                    </li>
                                    <li>
                                      <A href="/administrator/academic/student/final-assignment/transaction/prerequisite" class="flex items-center gap-2 py-1 px-2 text-xs text-neutral-600 dark:text-neutral-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-neutral-800/60 rounded-md transition-colors font-mono">
                                        <span class="size-1 rounded-full bg-neutral-400 dark:bg-neutral-500 shrink-0"></span>
                                        <span class="truncate">{t('menu.administrator.tree.prerequisites')}</span>
                                      </A>
                                    </li>
                                    <li>
                                      <A href="/administrator/academic/student/final-assignment/transaction/schedule" class="flex items-center gap-2 py-1 px-2 text-xs text-neutral-600 dark:text-neutral-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-neutral-800/60 rounded-md transition-colors font-mono">
                                        <span class="size-1 rounded-full bg-neutral-400 dark:bg-neutral-500 shrink-0"></span>
                                        <span class="truncate">{t('menu.administrator.tree.schedules')}</span>
                                      </A>
                                    </li>
                                    <li>
                                      <A href="/administrator/academic/student/final-assignment/transaction/submission" class="flex items-center gap-2 py-1 px-2 text-xs text-neutral-600 dark:text-neutral-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-neutral-800/60 rounded-md transition-colors font-mono">
                                        <span class="size-1 rounded-full bg-neutral-400 dark:bg-neutral-500 shrink-0"></span>
                                        <span class="truncate">{t('menu.administrator.tree.submissions')}</span>
                                      </A>
                                    </li>
                                  </ul>
                                </div>
                              </details>
                            </li>
                          </ul>
                        </div>
                      </details>
                    </li>
                    <li>
                      <details class="group animated-details">
                        <summary class="list-none [&::-webkit-details-marker]:hidden cursor-pointer w-full text-start flex items-center justify-between py-1 px-2 text-xs font-medium text-neutral-700 dark:text-neutral-300 rounded-md hover:bg-neutral-100 dark:hover:bg-neutral-800/80 transition-colors font-mono">
                          <div class="flex items-center gap-2 truncate">
                            <svg class="size-3 text-neutral-400 group-open:rotate-90 transition-transform shrink-0" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="m9 18 6-6-6-6"/></svg>
                            <span class="truncate">{t('menu.administrator.tree.master')}</span>
                          </div>
                        </summary>
                        <div class="w-full details-anim-content">
                          <ul class="pt-0.5 ps-2.5 space-y-0.5 border-s border-neutral-200 dark:border-neutral-700 ms-2.5 my-0.5">
                            <li>
                              <A href="/administrator/academic/student/master/image" class="flex items-center gap-2 py-1 px-2 text-xs text-neutral-600 dark:text-neutral-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-neutral-800/60 rounded-md transition-colors font-mono">
                                <span class="size-1 rounded-full bg-neutral-400 dark:bg-neutral-500 shrink-0"></span>
                                <span class="truncate">{t('menu.administrator.tree.images')}</span>
                              </A>
                            </li>
                            <li>
                              <A href="/administrator/academic/student/master/student" class="flex items-center gap-2 py-1 px-2 text-xs text-neutral-600 dark:text-neutral-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-neutral-800/60 rounded-md transition-colors font-mono">
                                <span class="size-1 rounded-full bg-neutral-400 dark:bg-neutral-500 shrink-0"></span>
                                <span class="truncate">{t('menu.administrator.tree.students')}</span>
                              </A>
                            </li>
                          </ul>
                        </div>
                      </details>
                    </li>
                    <li>
                      <details class="group animated-details">
                        <summary class="list-none [&::-webkit-details-marker]:hidden cursor-pointer w-full text-start flex items-center justify-between py-1 px-2 text-xs font-medium text-neutral-700 dark:text-neutral-300 rounded-md hover:bg-neutral-100 dark:hover:bg-neutral-800/80 transition-colors font-mono">
                          <div class="flex items-center gap-2 truncate">
                            <svg class="size-3 text-neutral-400 group-open:rotate-90 transition-transform shrink-0" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="m9 18 6-6-6-6"/></svg>
                            <span class="truncate">{t('menu.administrator.tree.reference')}</span>
                          </div>
                        </summary>
                        <div class="w-full details-anim-content">
                          <ul class="pt-0.5 ps-2.5 space-y-0.5 border-s border-neutral-200 dark:border-neutral-700 ms-2.5 my-0.5">
                            <li>
                              <A href="/administrator/academic/student/reference/finance" class="flex items-center gap-2 py-1 px-2 text-xs text-neutral-600 dark:text-neutral-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-neutral-800/60 rounded-md transition-colors font-mono">
                                <span class="size-1 rounded-full bg-neutral-400 dark:bg-neutral-500 shrink-0"></span>
                                <span class="truncate">{t('menu.administrator.tree.finances')}</span>
                              </A>
                            </li>
                            <li>
                              <A href="/administrator/academic/student/reference/registration" class="flex items-center gap-2 py-1 px-2 text-xs text-neutral-600 dark:text-neutral-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-neutral-800/60 rounded-md transition-colors font-mono">
                                <span class="size-1 rounded-full bg-neutral-400 dark:bg-neutral-500 shrink-0"></span>
                                <span class="truncate">{t('menu.administrator.tree.registrations')}</span>
                              </A>
                            </li>
                            <li>
                              <A href="/administrator/academic/student/reference/resign-status" class="flex items-center gap-2 py-1 px-2 text-xs text-neutral-600 dark:text-neutral-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-neutral-800/60 rounded-md transition-colors font-mono">
                                <span class="size-1 rounded-full bg-neutral-400 dark:bg-neutral-500 shrink-0"></span>
                                <span class="truncate">{t('menu.administrator.tree.resignStatuses')}</span>
                              </A>
                            </li>
                            <li>
                              <A href="/administrator/academic/student/reference/selection-type" class="flex items-center gap-2 py-1 px-2 text-xs text-neutral-600 dark:text-neutral-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-neutral-800/60 rounded-md transition-colors font-mono">
                                <span class="size-1 rounded-full bg-neutral-400 dark:bg-neutral-500 shrink-0"></span>
                                <span class="truncate">{t('menu.administrator.tree.selectionTypes')}</span>
                              </A>
                            </li>
                            <li>
                              <A href="/administrator/academic/student/reference/status" class="flex items-center gap-2 py-1 px-2 text-xs text-neutral-600 dark:text-neutral-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-neutral-800/60 rounded-md transition-colors font-mono">
                                <span class="size-1 rounded-full bg-neutral-400 dark:bg-neutral-500 shrink-0"></span>
                                <span class="truncate">{t('menu.administrator.tree.statuses')}</span>
                              </A>
                            </li>
                          </ul>
                        </div>
                      </details>
                    </li>
                  </ul>
                </div>
              </details>
            </li>
            <li>
              <details class="group animated-details">
                <summary class="list-none [&::-webkit-details-marker]:hidden cursor-pointer w-full text-start flex items-center justify-between py-1 px-2 text-xs font-medium text-neutral-700 dark:text-neutral-300 rounded-md hover:bg-neutral-100 dark:hover:bg-neutral-800/80 transition-colors font-mono">
                  <div class="flex items-center gap-2 truncate">
                    <svg class="size-3 text-neutral-400 group-open:rotate-90 transition-transform shrink-0" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="m9 18 6-6-6-6"/></svg>
                    <span class="truncate">{t('menu.administrator.tree.survey')}</span>
                  </div>
                </summary>
                <div class="w-full details-anim-content">
                  <ul class="pt-0.5 ps-2.5 space-y-0.5 border-s border-neutral-200 dark:border-neutral-700 ms-2.5 my-0.5">
                    <li>
                      <details class="group animated-details">
                        <summary class="list-none [&::-webkit-details-marker]:hidden cursor-pointer w-full text-start flex items-center justify-between py-1 px-2 text-xs font-medium text-neutral-700 dark:text-neutral-300 rounded-md hover:bg-neutral-100 dark:hover:bg-neutral-800/80 transition-colors font-mono">
                          <div class="flex items-center gap-2 truncate">
                            <svg class="size-3 text-neutral-400 group-open:rotate-90 transition-transform shrink-0" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="m9 18 6-6-6-6"/></svg>
                            <span class="truncate">{t('menu.administrator.tree.master')}</span>
                          </div>
                        </summary>
                        <div class="w-full details-anim-content">
                          <ul class="pt-0.5 ps-2.5 space-y-0.5 border-s border-neutral-200 dark:border-neutral-700 ms-2.5 my-0.5">
                            <li>
                              <A href="/administrator/academic/survey/master/answer" class="flex items-center gap-2 py-1 px-2 text-xs text-neutral-600 dark:text-neutral-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-neutral-800/60 rounded-md transition-colors font-mono">
                                <span class="size-1 rounded-full bg-neutral-400 dark:bg-neutral-500 shrink-0"></span>
                                <span class="truncate">{t('menu.administrator.tree.answers')}</span>
                              </A>
                            </li>
                            <li>
                              <A href="/administrator/academic/survey/master/bundle-question" class="flex items-center gap-2 py-1 px-2 text-xs text-neutral-600 dark:text-neutral-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-neutral-800/60 rounded-md transition-colors font-mono">
                                <span class="size-1 rounded-full bg-neutral-400 dark:bg-neutral-500 shrink-0"></span>
                                <span class="truncate">{t('menu.administrator.tree.bundleQuestion')}</span>
                              </A>
                            </li>
                            <li>
                              <A href="/administrator/academic/survey/master/bundle" class="flex items-center gap-2 py-1 px-2 text-xs text-neutral-600 dark:text-neutral-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-neutral-800/60 rounded-md transition-colors font-mono">
                                <span class="size-1 rounded-full bg-neutral-400 dark:bg-neutral-500 shrink-0"></span>
                                <span class="truncate">{t('menu.administrator.tree.bundles')}</span>
                              </A>
                            </li>
                            <li>
                              <A href="/administrator/academic/survey/master/question" class="flex items-center gap-2 py-1 px-2 text-xs text-neutral-600 dark:text-neutral-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-neutral-800/60 rounded-md transition-colors font-mono">
                                <span class="size-1 rounded-full bg-neutral-400 dark:bg-neutral-500 shrink-0"></span>
                                <span class="truncate">{t('menu.administrator.tree.questions')}</span>
                              </A>
                            </li>
                          </ul>
                        </div>
                      </details>
                    </li>
                    <li>
                      <details class="group animated-details">
                        <summary class="list-none [&::-webkit-details-marker]:hidden cursor-pointer w-full text-start flex items-center justify-between py-1 px-2 text-xs font-medium text-neutral-700 dark:text-neutral-300 rounded-md hover:bg-neutral-100 dark:hover:bg-neutral-800/80 transition-colors font-mono">
                          <div class="flex items-center gap-2 truncate">
                            <svg class="size-3 text-neutral-400 group-open:rotate-90 transition-transform shrink-0" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="m9 18 6-6-6-6"/></svg>
                            <span class="truncate">{t('menu.administrator.tree.reference')}</span>
                          </div>
                        </summary>
                        <div class="w-full details-anim-content">
                          <ul class="pt-0.5 ps-2.5 space-y-0.5 border-s border-neutral-200 dark:border-neutral-700 ms-2.5 my-0.5">
                            <li>
                              <A href="/administrator/academic/survey/reference/bundle-category" class="flex items-center gap-2 py-1 px-2 text-xs text-neutral-600 dark:text-neutral-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-neutral-800/60 rounded-md transition-colors font-mono">
                                <span class="size-1 rounded-full bg-neutral-400 dark:bg-neutral-500 shrink-0"></span>
                                <span class="truncate">{t('menu.administrator.tree.bundleCategories')}</span>
                              </A>
                            </li>
                            <li>
                              <A href="/administrator/academic/survey/reference/question-variety" class="flex items-center gap-2 py-1 px-2 text-xs text-neutral-600 dark:text-neutral-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-neutral-800/60 rounded-md transition-colors font-mono">
                                <span class="size-1 rounded-full bg-neutral-400 dark:bg-neutral-500 shrink-0"></span>
                                <span class="truncate">{t('menu.administrator.tree.questionVarieties')}</span>
                              </A>
                            </li>
                          </ul>
                        </div>
                      </details>
                    </li>
                    <li>
                      <details class="group animated-details">
                        <summary class="list-none [&::-webkit-details-marker]:hidden cursor-pointer w-full text-start flex items-center justify-between py-1 px-2 text-xs font-medium text-neutral-700 dark:text-neutral-300 rounded-md hover:bg-neutral-100 dark:hover:bg-neutral-800/80 transition-colors font-mono">
                          <div class="flex items-center gap-2 truncate">
                            <svg class="size-3 text-neutral-400 group-open:rotate-90 transition-transform shrink-0" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="m9 18 6-6-6-6"/></svg>
                            <span class="truncate">{t('menu.administrator.tree.transaction')}</span>
                          </div>
                        </summary>
                        <div class="w-full details-anim-content">
                          <ul class="pt-0.5 ps-2.5 space-y-0.5 border-s border-neutral-200 dark:border-neutral-700 ms-2.5 my-0.5">
                            <li>
                              <A href="/administrator/academic/survey/transaction/conduct" class="flex items-center gap-2 py-1 px-2 text-xs text-neutral-600 dark:text-neutral-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-neutral-800/60 rounded-md transition-colors font-mono">
                                <span class="size-1 rounded-full bg-neutral-400 dark:bg-neutral-500 shrink-0"></span>
                                <span class="truncate">{t('menu.administrator.tree.conducts')}</span>
                              </A>
                            </li>
                            <li>
                              <A href="/administrator/academic/survey/transaction/respond" class="flex items-center gap-2 py-1 px-2 text-xs text-neutral-600 dark:text-neutral-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-neutral-800/60 rounded-md transition-colors font-mono">
                                <span class="size-1 rounded-full bg-neutral-400 dark:bg-neutral-500 shrink-0"></span>
                                <span class="truncate">{t('menu.administrator.tree.responds')}</span>
                              </A>
                            </li>
                          </ul>
                        </div>
                      </details>
                    </li>
                  </ul>
                </div>
              </details>
            </li>
          </ul>
        </div>
      </details>
    </li>
    <li>
      <details class="group animated-details" open>
        <summary class="list-none [&::-webkit-details-marker]:hidden cursor-pointer w-full text-start flex items-center justify-between py-1.5 px-2 text-xs font-bold text-neutral-800 dark:text-neutral-200 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors font-mono">
          <div class="flex items-center gap-2 truncate">
            <svg class="size-3 text-neutral-400 group-open:rotate-90 transition-transform shrink-0" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="m9 18 6-6-6-6"/></svg>
            <span class="truncate">{t('menu.administrator.tree.auth')}</span>
          </div>
        </summary>
        <div class="w-full details-anim-content">
          <ul class="pt-0.5 ps-2.5 space-y-0.5 border-s border-neutral-200 dark:border-neutral-700 ms-2.5 my-0.5">
            <li>
              <A href="/administrator/auth/permission" class="flex items-center gap-2 py-1 px-2 text-xs text-neutral-600 dark:text-neutral-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-neutral-800/60 rounded-md transition-colors font-mono">
                <span class="size-1 rounded-full bg-neutral-400 dark:bg-neutral-500 shrink-0"></span>
                <span class="truncate">{t('menu.administrator.tree.permission')}</span>
              </A>
            </li>
            <li>
              <A href="/administrator/auth/permission-role" class="flex items-center gap-2 py-1 px-2 text-xs text-neutral-600 dark:text-neutral-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-neutral-800/60 rounded-md transition-colors font-mono">
                <span class="size-1 rounded-full bg-neutral-400 dark:bg-neutral-500 shrink-0"></span>
                <span class="truncate">{t('menu.administrator.tree.permissionRole')}</span>
              </A>
            </li>
            <li>
              <A href="/administrator/auth/role" class="flex items-center gap-2 py-1 px-2 text-xs text-neutral-600 dark:text-neutral-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-neutral-800/60 rounded-md transition-colors font-mono">
                <span class="size-1 rounded-full bg-neutral-400 dark:bg-neutral-500 shrink-0"></span>
                <span class="truncate">{t('menu.administrator.tree.role')}</span>
              </A>
            </li>
            <li>
              <A href="/administrator/auth/user" class="flex items-center gap-2 py-1 px-2 text-xs text-neutral-600 dark:text-neutral-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-neutral-800/60 rounded-md transition-colors font-mono">
                <span class="size-1 rounded-full bg-neutral-400 dark:bg-neutral-500 shrink-0"></span>
                <span class="truncate">{t('menu.administrator.tree.user')}</span>
              </A>
            </li>
            <li>
              <A href="/administrator/auth/verification" class="flex items-center gap-2 py-1 px-2 text-xs text-neutral-600 dark:text-neutral-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-neutral-800/60 rounded-md transition-colors font-mono">
                <span class="size-1 rounded-full bg-neutral-400 dark:bg-neutral-500 shrink-0"></span>
                <span class="truncate">{t('menu.administrator.tree.verification')}</span>
              </A>
            </li>
          </ul>
        </div>
      </details>
    </li>
    <li>
      <details class="group animated-details" open>
        <summary class="list-none [&::-webkit-details-marker]:hidden cursor-pointer w-full text-start flex items-center justify-between py-1.5 px-2 text-xs font-bold text-neutral-800 dark:text-neutral-200 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors font-mono">
          <div class="flex items-center gap-2 truncate">
            <svg class="size-3 text-neutral-400 group-open:rotate-90 transition-transform shrink-0" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="m9 18 6-6-6-6"/></svg>
            <span class="truncate">{t('menu.administrator.tree.building')}</span>
          </div>
        </summary>
        <div class="w-full details-anim-content">
          <ul class="pt-0.5 ps-2.5 space-y-0.5 border-s border-neutral-200 dark:border-neutral-700 ms-2.5 my-0.5">
            <li>
              <details class="group animated-details">
                <summary class="list-none [&::-webkit-details-marker]:hidden cursor-pointer w-full text-start flex items-center justify-between py-1 px-2 text-xs font-medium text-neutral-700 dark:text-neutral-300 rounded-md hover:bg-neutral-100 dark:hover:bg-neutral-800/80 transition-colors font-mono">
                  <div class="flex items-center gap-2 truncate">
                    <svg class="size-3 text-neutral-400 group-open:rotate-90 transition-transform shrink-0" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="m9 18 6-6-6-6"/></svg>
                    <span class="truncate">{t('menu.administrator.tree.master')}</span>
                  </div>
                </summary>
                <div class="w-full details-anim-content">
                  <ul class="pt-0.5 ps-2.5 space-y-0.5 border-s border-neutral-200 dark:border-neutral-700 ms-2.5 my-0.5">
                    <li>
                      <A href="/administrator/building/master/building" class="flex items-center gap-2 py-1 px-2 text-xs text-neutral-600 dark:text-neutral-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-neutral-800/60 rounded-md transition-colors font-mono">
                        <span class="size-1 rounded-full bg-neutral-400 dark:bg-neutral-500 shrink-0"></span>
                        <span class="truncate">{t('menu.administrator.tree.buildings')}</span>
                      </A>
                    </li>
                    <li>
                      <A href="/administrator/building/master/room" class="flex items-center gap-2 py-1 px-2 text-xs text-neutral-600 dark:text-neutral-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-neutral-800/60 rounded-md transition-colors font-mono">
                        <span class="size-1 rounded-full bg-neutral-400 dark:bg-neutral-500 shrink-0"></span>
                        <span class="truncate">{t('menu.administrator.tree.rooms')}</span>
                      </A>
                    </li>
                  </ul>
                </div>
              </details>
            </li>
            <li>
              <details class="group animated-details">
                <summary class="list-none [&::-webkit-details-marker]:hidden cursor-pointer w-full text-start flex items-center justify-between py-1 px-2 text-xs font-medium text-neutral-700 dark:text-neutral-300 rounded-md hover:bg-neutral-100 dark:hover:bg-neutral-800/80 transition-colors font-mono">
                  <div class="flex items-center gap-2 truncate">
                    <svg class="size-3 text-neutral-400 group-open:rotate-90 transition-transform shrink-0" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="m9 18 6-6-6-6"/></svg>
                    <span class="truncate">{t('menu.administrator.tree.reference')}</span>
                  </div>
                </summary>
                <div class="w-full details-anim-content">
                  <ul class="pt-0.5 ps-2.5 space-y-0.5 border-s border-neutral-200 dark:border-neutral-700 ms-2.5 my-0.5">
                    <li>
                      <A href="/administrator/building/reference/category" class="flex items-center gap-2 py-1 px-2 text-xs text-neutral-600 dark:text-neutral-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-neutral-800/60 rounded-md transition-colors font-mono">
                        <span class="size-1 rounded-full bg-neutral-400 dark:bg-neutral-500 shrink-0"></span>
                        <span class="truncate">{t('menu.administrator.tree.categories')}</span>
                      </A>
                    </li>
                    <li>
                      <A href="/administrator/building/reference/condition" class="flex items-center gap-2 py-1 px-2 text-xs text-neutral-600 dark:text-neutral-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-neutral-800/60 rounded-md transition-colors font-mono">
                        <span class="size-1 rounded-full bg-neutral-400 dark:bg-neutral-500 shrink-0"></span>
                        <span class="truncate">{t('menu.administrator.tree.conditions')}</span>
                      </A>
                    </li>
                    <li>
                      <A href="/administrator/building/reference/room-type" class="flex items-center gap-2 py-1 px-2 text-xs text-neutral-600 dark:text-neutral-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-neutral-800/60 rounded-md transition-colors font-mono">
                        <span class="size-1 rounded-full bg-neutral-400 dark:bg-neutral-500 shrink-0"></span>
                        <span class="truncate">{t('menu.administrator.tree.roomTypes')}</span>
                      </A>
                    </li>
                    <li>
                      <A href="/administrator/building/reference/variety" class="flex items-center gap-2 py-1 px-2 text-xs text-neutral-600 dark:text-neutral-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-neutral-800/60 rounded-md transition-colors font-mono">
                        <span class="size-1 rounded-full bg-neutral-400 dark:bg-neutral-500 shrink-0"></span>
                        <span class="truncate">{t('menu.administrator.tree.varieties')}</span>
                      </A>
                    </li>
                  </ul>
                </div>
              </details>
            </li>
          </ul>
        </div>
      </details>
    </li>
    <li>
      <div class="flex items-center gap-x-2 py-1 px-2 text-xs font-mono text-neutral-400 dark:text-neutral-500">
        <span class="size-1.5 rounded-full bg-neutral-300 dark:bg-neutral-600"></span>
        <span>{t('menu.administrator.tree.burn')}</span>
      </div>
    </li>
    <li>
      <div class="flex items-center gap-x-2 py-1 px-2 text-xs font-mono text-neutral-400 dark:text-neutral-500">
        <span class="size-1.5 rounded-full bg-neutral-300 dark:bg-neutral-600"></span>
        <span>{t('menu.administrator.tree.chart')}</span>
      </div>
    </li>
    <li>
      <details class="group animated-details">
        <summary class="list-none [&::-webkit-details-marker]:hidden cursor-pointer w-full text-start flex items-center justify-between py-1.5 px-2 text-xs font-bold text-neutral-800 dark:text-neutral-200 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors font-mono">
          <div class="flex items-center gap-2 truncate">
            <svg class="size-3 text-neutral-400 group-open:rotate-90 transition-transform shrink-0" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="m9 18 6-6-6-6"/></svg>
            <span class="truncate">{t('menu.administrator.tree.contact')}</span>
          </div>
        </summary>
        <div class="w-full details-anim-content">
          <ul class="pt-0.5 ps-2.5 space-y-0.5 border-s border-neutral-200 dark:border-neutral-700 ms-2.5 my-0.5">
            <li>
              <details class="group animated-details">
                <summary class="list-none [&::-webkit-details-marker]:hidden cursor-pointer w-full text-start flex items-center justify-between py-1 px-2 text-xs font-medium text-neutral-700 dark:text-neutral-300 rounded-md hover:bg-neutral-100 dark:hover:bg-neutral-800/80 transition-colors font-mono">
                  <div class="flex items-center gap-2 truncate">
                    <svg class="size-3 text-neutral-400 group-open:rotate-90 transition-transform shrink-0" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="m9 18 6-6-6-6"/></svg>
                    <span class="truncate">{t('menu.administrator.tree.master')}</span>
                  </div>
                </summary>
                <div class="w-full details-anim-content">
                  <ul class="pt-0.5 ps-2.5 space-y-0.5 border-s border-neutral-200 dark:border-neutral-700 ms-2.5 my-0.5">
                    <li>
                      <A href="/administrator/contact/master/electronic-mail" class="flex items-center gap-2 py-1 px-2 text-xs text-neutral-600 dark:text-neutral-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-neutral-800/60 rounded-md transition-colors font-mono">
                        <span class="size-1 rounded-full bg-neutral-400 dark:bg-neutral-500 shrink-0"></span>
                        <span class="truncate">{t('menu.administrator.tree.electronicMails')}</span>
                      </A>
                    </li>
                    <li>
                      <A href="/administrator/contact/master/phone" class="flex items-center gap-2 py-1 px-2 text-xs text-neutral-600 dark:text-neutral-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-neutral-800/60 rounded-md transition-colors font-mono">
                        <span class="size-1 rounded-full bg-neutral-400 dark:bg-neutral-500 shrink-0"></span>
                        <span class="truncate">{t('menu.administrator.tree.phones')}</span>
                      </A>
                    </li>
                    <li>
                      <A href="/administrator/contact/master/residence" class="flex items-center gap-2 py-1 px-2 text-xs text-neutral-600 dark:text-neutral-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-neutral-800/60 rounded-md transition-colors font-mono">
                        <span class="size-1 rounded-full bg-neutral-400 dark:bg-neutral-500 shrink-0"></span>
                        <span class="truncate">{t('menu.administrator.tree.residences')}</span>
                      </A>
                    </li>
                    <li>
                      <A href="/administrator/contact/master/website" class="flex items-center gap-2 py-1 px-2 text-xs text-neutral-600 dark:text-neutral-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-neutral-800/60 rounded-md transition-colors font-mono">
                        <span class="size-1 rounded-full bg-neutral-400 dark:bg-neutral-500 shrink-0"></span>
                        <span class="truncate">{t('menu.administrator.tree.websites')}</span>
                      </A>
                    </li>
                  </ul>
                </div>
              </details>
            </li>
            <li>
              <details class="group animated-details">
                <summary class="list-none [&::-webkit-details-marker]:hidden cursor-pointer w-full text-start flex items-center justify-between py-1 px-2 text-xs font-medium text-neutral-700 dark:text-neutral-300 rounded-md hover:bg-neutral-100 dark:hover:bg-neutral-800/80 transition-colors font-mono">
                  <div class="flex items-center gap-2 truncate">
                    <svg class="size-3 text-neutral-400 group-open:rotate-90 transition-transform shrink-0" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="m9 18 6-6-6-6"/></svg>
                    <span class="truncate">{t('menu.administrator.tree.reference')}</span>
                  </div>
                </summary>
                <div class="w-full details-anim-content">
                  <ul class="pt-0.5 ps-2.5 space-y-0.5 border-s border-neutral-200 dark:border-neutral-700 ms-2.5 my-0.5">
                    <li>
                      <A href="/administrator/contact/reference/electronic-mail-type" class="flex items-center gap-2 py-1 px-2 text-xs text-neutral-600 dark:text-neutral-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-neutral-800/60 rounded-md transition-colors font-mono">
                        <span class="size-1 rounded-full bg-neutral-400 dark:bg-neutral-500 shrink-0"></span>
                        <span class="truncate">{t('menu.administrator.tree.electronicMailTypes')}</span>
                      </A>
                    </li>
                    <li>
                      <A href="/administrator/contact/reference/phone-type" class="flex items-center gap-2 py-1 px-2 text-xs text-neutral-600 dark:text-neutral-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-neutral-800/60 rounded-md transition-colors font-mono">
                        <span class="size-1 rounded-full bg-neutral-400 dark:bg-neutral-500 shrink-0"></span>
                        <span class="truncate">{t('menu.administrator.tree.phoneTypes')}</span>
                      </A>
                    </li>
                    <li>
                      <A href="/administrator/contact/reference/residence-type" class="flex items-center gap-2 py-1 px-2 text-xs text-neutral-600 dark:text-neutral-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-neutral-800/60 rounded-md transition-colors font-mono">
                        <span class="size-1 rounded-full bg-neutral-400 dark:bg-neutral-500 shrink-0"></span>
                        <span class="truncate">{t('menu.administrator.tree.residenceTypes')}</span>
                      </A>
                    </li>
                    <li>
                      <A href="/administrator/contact/reference/website-type" class="flex items-center gap-2 py-1 px-2 text-xs text-neutral-600 dark:text-neutral-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-neutral-800/60 rounded-md transition-colors font-mono">
                        <span class="size-1 rounded-full bg-neutral-400 dark:bg-neutral-500 shrink-0"></span>
                        <span class="truncate">{t('menu.administrator.tree.websiteTypes')}</span>
                      </A>
                    </li>
                  </ul>
                </div>
              </details>
            </li>
          </ul>
        </div>
      </details>
    </li>
    <li>
      <details class="group animated-details">
        <summary class="list-none [&::-webkit-details-marker]:hidden cursor-pointer w-full text-start flex items-center justify-between py-1.5 px-2 text-xs font-bold text-neutral-800 dark:text-neutral-200 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors font-mono">
          <div class="flex items-center gap-2 truncate">
            <svg class="size-3 text-neutral-400 group-open:rotate-90 transition-transform shrink-0" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="m9 18 6-6-6-6"/></svg>
            <span class="truncate">{t('menu.administrator.tree.document')}</span>
          </div>
        </summary>
        <div class="w-full details-anim-content">
          <ul class="pt-0.5 ps-2.5 space-y-0.5 border-s border-neutral-200 dark:border-neutral-700 ms-2.5 my-0.5">
            <li>
              <details class="group animated-details">
                <summary class="list-none [&::-webkit-details-marker]:hidden cursor-pointer w-full text-start flex items-center justify-between py-1 px-2 text-xs font-medium text-neutral-700 dark:text-neutral-300 rounded-md hover:bg-neutral-100 dark:hover:bg-neutral-800/80 transition-colors font-mono">
                  <div class="flex items-center gap-2 truncate">
                    <svg class="size-3 text-neutral-400 group-open:rotate-90 transition-transform shrink-0" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="m9 18 6-6-6-6"/></svg>
                    <span class="truncate">{t('menu.administrator.tree.reference')}</span>
                  </div>
                </summary>
                <div class="w-full details-anim-content">
                  <ul class="pt-0.5 ps-2.5 space-y-0.5 border-s border-neutral-200 dark:border-neutral-700 ms-2.5 my-0.5">
                    <li>
                      <A href="/administrator/document/reference/archive-type" class="flex items-center gap-2 py-1 px-2 text-xs text-neutral-600 dark:text-neutral-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-neutral-800/60 rounded-md transition-colors font-mono">
                        <span class="size-1 rounded-full bg-neutral-400 dark:bg-neutral-500 shrink-0"></span>
                        <span class="truncate">{t('menu.administrator.tree.archiveTypes')}</span>
                      </A>
                    </li>
                  </ul>
                </div>
              </details>
            </li>
            <li>
              <details class="group animated-details">
                <summary class="list-none [&::-webkit-details-marker]:hidden cursor-pointer w-full text-start flex items-center justify-between py-1 px-2 text-xs font-medium text-neutral-700 dark:text-neutral-300 rounded-md hover:bg-neutral-100 dark:hover:bg-neutral-800/80 transition-colors font-mono">
                  <div class="flex items-center gap-2 truncate">
                    <svg class="size-3 text-neutral-400 group-open:rotate-90 transition-transform shrink-0" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="m9 18 6-6-6-6"/></svg>
                    <span class="truncate">{t('menu.administrator.tree.transaction')}</span>
                  </div>
                </summary>
                <div class="w-full details-anim-content">
                  <ul class="pt-0.5 ps-2.5 space-y-0.5 border-s border-neutral-200 dark:border-neutral-700 ms-2.5 my-0.5">
                    <li>
                      <A href="/administrator/document/transaction/archive" class="flex items-center gap-2 py-1 px-2 text-xs text-neutral-600 dark:text-neutral-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-neutral-800/60 rounded-md transition-colors font-mono">
                        <span class="size-1 rounded-full bg-neutral-400 dark:bg-neutral-500 shrink-0"></span>
                        <span class="truncate">{t('menu.administrator.tree.archives')}</span>
                      </A>
                    </li>
                  </ul>
                </div>
              </details>
            </li>
          </ul>
        </div>
      </details>
    </li>
    <li>
      <details class="group animated-details">
        <summary class="list-none [&::-webkit-details-marker]:hidden cursor-pointer w-full text-start flex items-center justify-between py-1.5 px-2 text-xs font-bold text-neutral-800 dark:text-neutral-200 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors font-mono">
          <div class="flex items-center gap-2 truncate">
            <svg class="size-3 text-neutral-400 group-open:rotate-90 transition-transform shrink-0" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="m9 18 6-6-6-6"/></svg>
            <span class="truncate">{t('menu.administrator.tree.feeder')}</span>
          </div>
        </summary>
        <div class="w-full details-anim-content">
          <ul class="pt-0.5 ps-2.5 space-y-0.5 border-s border-neutral-200 dark:border-neutral-700 ms-2.5 my-0.5">
            <li>
              <details class="group animated-details">
                <summary class="list-none [&::-webkit-details-marker]:hidden cursor-pointer w-full text-start flex items-center justify-between py-1 px-2 text-xs font-medium text-neutral-700 dark:text-neutral-300 rounded-md hover:bg-neutral-100 dark:hover:bg-neutral-800/80 transition-colors font-mono">
                  <div class="flex items-center gap-2 truncate">
                    <svg class="size-3 text-neutral-400 group-open:rotate-90 transition-transform shrink-0" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="m9 18 6-6-6-6"/></svg>
                    <span class="truncate">{t('menu.administrator.tree.akumulasi')}</span>
                  </div>
                </summary>
                <div class="w-full details-anim-content">
                  <ul class="pt-0.5 ps-2.5 space-y-0.5 border-s border-neutral-200 dark:border-neutral-700 ms-2.5 my-0.5">
                    <li>
                      <A href="/administrator/feeder/akumulasi/estimasi" class="flex items-center gap-2 py-1 px-2 text-xs text-neutral-600 dark:text-neutral-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-neutral-800/60 rounded-md transition-colors font-mono">
                        <span class="size-1 rounded-full bg-neutral-400 dark:bg-neutral-500 shrink-0"></span>
                        <span class="truncate">{t('menu.administrator.tree.estimasi')}</span>
                      </A>
                    </li>
                    <li>
                      <A href="/administrator/feeder/akumulasi/jumlah-data" class="flex items-center gap-2 py-1 px-2 text-xs text-neutral-600 dark:text-neutral-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-neutral-800/60 rounded-md transition-colors font-mono">
                        <span class="size-1 rounded-full bg-neutral-400 dark:bg-neutral-500 shrink-0"></span>
                        <span class="truncate">{t('menu.administrator.tree.jumlahData')}</span>
                      </A>
                    </li>
                  </ul>
                </div>
              </details>
            </li>
            <li>
              <details class="group animated-details">
                <summary class="list-none [&::-webkit-details-marker]:hidden cursor-pointer w-full text-start flex items-center justify-between py-1 px-2 text-xs font-medium text-neutral-700 dark:text-neutral-300 rounded-md hover:bg-neutral-100 dark:hover:bg-neutral-800/80 transition-colors font-mono">
                  <div class="flex items-center gap-2 truncate">
                    <svg class="size-3 text-neutral-400 group-open:rotate-90 transition-transform shrink-0" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="m9 18 6-6-6-6"/></svg>
                    <span class="truncate">{t('menu.administrator.tree.akun')}</span>
                  </div>
                </summary>
                <div class="w-full details-anim-content">
                  <ul class="pt-0.5 ps-2.5 space-y-0.5 border-s border-neutral-200 dark:border-neutral-700 ms-2.5 my-0.5">
                    <li>
                      <A href="/administrator/feeder/akun/kredential" class="flex items-center gap-2 py-1 px-2 text-xs text-neutral-600 dark:text-neutral-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-neutral-800/60 rounded-md transition-colors font-mono">
                        <span class="size-1 rounded-full bg-neutral-400 dark:bg-neutral-500 shrink-0"></span>
                        <span class="truncate">{t('menu.administrator.tree.kredential')}</span>
                      </A>
                    </li>
                  </ul>
                </div>
              </details>
            </li>
            <li>
              <details class="group animated-details">
                <summary class="list-none [&::-webkit-details-marker]:hidden cursor-pointer w-full text-start flex items-center justify-between py-1 px-2 text-xs font-medium text-neutral-700 dark:text-neutral-300 rounded-md hover:bg-neutral-100 dark:hover:bg-neutral-800/80 transition-colors font-mono">
                  <div class="flex items-center gap-2 truncate">
                    <svg class="size-3 text-neutral-400 group-open:rotate-90 transition-transform shrink-0" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="m9 18 6-6-6-6"/></svg>
                    <span class="truncate">{t('menu.administrator.tree.master')}</span>
                  </div>
                </summary>
                <div class="w-full details-anim-content">
                  <ul class="pt-0.5 ps-2.5 space-y-0.5 border-s border-neutral-200 dark:border-neutral-700 ms-2.5 my-0.5">
                    <li>
                      <A href="/administrator/feeder/master/aktifitas-kuliah-mahasiswa" class="flex items-center gap-2 py-1 px-2 text-xs text-neutral-600 dark:text-neutral-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-neutral-800/60 rounded-md transition-colors font-mono">
                        <span class="size-1 rounded-full bg-neutral-400 dark:bg-neutral-500 shrink-0"></span>
                        <span class="truncate">{t('menu.administrator.tree.aktifitasKuliahMahasiswa')}</span>
                      </A>
                    </li>
                    <li>
                      <A href="/administrator/feeder/master/aktifitas-mahasiswa" class="flex items-center gap-2 py-1 px-2 text-xs text-neutral-600 dark:text-neutral-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-neutral-800/60 rounded-md transition-colors font-mono">
                        <span class="size-1 rounded-full bg-neutral-400 dark:bg-neutral-500 shrink-0"></span>
                        <span class="truncate">{t('menu.administrator.tree.aktifitasMahasiswa')}</span>
                      </A>
                    </li>
                    <li>
                      <A href="/administrator/feeder/master/aktifitas-mengajar-dosen" class="flex items-center gap-2 py-1 px-2 text-xs text-neutral-600 dark:text-neutral-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-neutral-800/60 rounded-md transition-colors font-mono">
                        <span class="size-1 rounded-full bg-neutral-400 dark:bg-neutral-500 shrink-0"></span>
                        <span class="truncate">{t('menu.administrator.tree.aktifitasMengajarDosen')}</span>
                      </A>
                    </li>
                    <li>
                      <A href="/administrator/feeder/master/anggota-aktifitas-mahasiswa" class="flex items-center gap-2 py-1 px-2 text-xs text-neutral-600 dark:text-neutral-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-neutral-800/60 rounded-md transition-colors font-mono">
                        <span class="size-1 rounded-full bg-neutral-400 dark:bg-neutral-500 shrink-0"></span>
                        <span class="truncate">{t('menu.administrator.tree.anggotaAktifitasMahasiswa')}</span>
                      </A>
                    </li>
                    <li>
                      <A href="/administrator/feeder/master/bidang-minat-perguruan-tinggi" class="flex items-center gap-2 py-1 px-2 text-xs text-neutral-600 dark:text-neutral-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-neutral-800/60 rounded-md transition-colors font-mono">
                        <span class="size-1 rounded-full bg-neutral-400 dark:bg-neutral-500 shrink-0"></span>
                        <span class="truncate">{t('menu.administrator.tree.bidangMinatPerguruanTinggi')}</span>
                      </A>
                    </li>
                    <li>
                      <A href="/administrator/feeder/master/bimbing-mahasiswa" class="flex items-center gap-2 py-1 px-2 text-xs text-neutral-600 dark:text-neutral-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-neutral-800/60 rounded-md transition-colors font-mono">
                        <span class="size-1 rounded-full bg-neutral-400 dark:bg-neutral-500 shrink-0"></span>
                        <span class="truncate">{t('menu.administrator.tree.bimbingMahasiswa')}</span>
                      </A>
                    </li>
                    <li>
                      <A href="/administrator/feeder/master/biodata-dosen" class="flex items-center gap-2 py-1 px-2 text-xs text-neutral-600 dark:text-neutral-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-neutral-800/60 rounded-md transition-colors font-mono">
                        <span class="size-1 rounded-full bg-neutral-400 dark:bg-neutral-500 shrink-0"></span>
                        <span class="truncate">{t('menu.administrator.tree.biodataDosen')}</span>
                      </A>
                    </li>
                    <li>
                      <A href="/administrator/feeder/master/biodata-mahasiswa" class="flex items-center gap-2 py-1 px-2 text-xs text-neutral-600 dark:text-neutral-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-neutral-800/60 rounded-md transition-colors font-mono">
                        <span class="size-1 rounded-full bg-neutral-400 dark:bg-neutral-500 shrink-0"></span>
                        <span class="truncate">{t('menu.administrator.tree.biodataMahasiswa')}</span>
                      </A>
                    </li>
                    <li>
                      <A href="/administrator/feeder/master/detail-nilai-perkuliahan-kelas" class="flex items-center gap-2 py-1 px-2 text-xs text-neutral-600 dark:text-neutral-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-neutral-800/60 rounded-md transition-colors font-mono">
                        <span class="size-1 rounded-full bg-neutral-400 dark:bg-neutral-500 shrink-0"></span>
                        <span class="truncate">{t('menu.administrator.tree.detailNilaiPerkuliahanKelas')}</span>
                      </A>
                    </li>
                    <li>
                      <A href="/administrator/feeder/master/dosen" class="flex items-center gap-2 py-1 px-2 text-xs text-neutral-600 dark:text-neutral-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-neutral-800/60 rounded-md transition-colors font-mono">
                        <span class="size-1 rounded-full bg-neutral-400 dark:bg-neutral-500 shrink-0"></span>
                        <span class="truncate">{t('menu.administrator.tree.dosen')}</span>
                      </A>
                    </li>
                    <li>
                      <A href="/administrator/feeder/master/dosen-pembimbing" class="flex items-center gap-2 py-1 px-2 text-xs text-neutral-600 dark:text-neutral-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-neutral-800/60 rounded-md transition-colors font-mono">
                        <span class="size-1 rounded-full bg-neutral-400 dark:bg-neutral-500 shrink-0"></span>
                        <span class="truncate">{t('menu.administrator.tree.dosenPembimbing')}</span>
                      </A>
                    </li>
                    <li>
                      <A href="/administrator/feeder/master/dosen-pengajar-kelas-kuliah" class="flex items-center gap-2 py-1 px-2 text-xs text-neutral-600 dark:text-neutral-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-neutral-800/60 rounded-md transition-colors font-mono">
                        <span class="size-1 rounded-full bg-neutral-400 dark:bg-neutral-500 shrink-0"></span>
                        <span class="truncate">{t('menu.administrator.tree.dosenPengajarKelasKuliah')}</span>
                      </A>
                    </li>
                    <li>
                      <A href="/administrator/feeder/master/fakultas" class="flex items-center gap-2 py-1 px-2 text-xs text-neutral-600 dark:text-neutral-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-neutral-800/60 rounded-md transition-colors font-mono">
                        <span class="size-1 rounded-full bg-neutral-400 dark:bg-neutral-500 shrink-0"></span>
                        <span class="truncate">{t('menu.administrator.tree.fakultas')}</span>
                      </A>
                    </li>
                    <li>
                      <A href="/administrator/feeder/master/hitung-transkrip-angkatan-mahasiswa" class="flex items-center gap-2 py-1 px-2 text-xs text-neutral-600 dark:text-neutral-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-neutral-800/60 rounded-md transition-colors font-mono">
                        <span class="size-1 rounded-full bg-neutral-400 dark:bg-neutral-500 shrink-0"></span>
                        <span class="truncate">{t('menu.administrator.tree.hitungTranskripAngkatanMahasiswa')}</span>
                      </A>
                    </li>
                    <li>
                      <A href="/administrator/feeder/master/kartu-rencana-studi-mahasiswa" class="flex items-center gap-2 py-1 px-2 text-xs text-neutral-600 dark:text-neutral-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-neutral-800/60 rounded-md transition-colors font-mono">
                        <span class="size-1 rounded-full bg-neutral-400 dark:bg-neutral-500 shrink-0"></span>
                        <span class="truncate">{t('menu.administrator.tree.kartuRencanaStudiMahasiswa')}</span>
                      </A>
                    </li>
                    <li>
                      <A href="/administrator/feeder/master/kelas-kuliah" class="flex items-center gap-2 py-1 px-2 text-xs text-neutral-600 dark:text-neutral-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-neutral-800/60 rounded-md transition-colors font-mono">
                        <span class="size-1 rounded-full bg-neutral-400 dark:bg-neutral-500 shrink-0"></span>
                        <span class="truncate">{t('menu.administrator.tree.kelasKuliah')}</span>
                      </A>
                    </li>
                    <li>
                      <A href="/administrator/feeder/master/komponen-evaluasi-kelas" class="flex items-center gap-2 py-1 px-2 text-xs text-neutral-600 dark:text-neutral-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-neutral-800/60 rounded-md transition-colors font-mono">
                        <span class="size-1 rounded-full bg-neutral-400 dark:bg-neutral-500 shrink-0"></span>
                        <span class="truncate">{t('menu.administrator.tree.komponenEvaluasiKelas')}</span>
                      </A>
                    </li>
                    <li>
                      <A href="/administrator/feeder/master/konsistensi-data" class="flex items-center gap-2 py-1 px-2 text-xs text-neutral-600 dark:text-neutral-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-neutral-800/60 rounded-md transition-colors font-mono">
                        <span class="size-1 rounded-full bg-neutral-400 dark:bg-neutral-500 shrink-0"></span>
                        <span class="truncate">{t('menu.administrator.tree.konsistensiData')}</span>
                      </A>
                    </li>
                    <li>
                      <A href="/administrator/feeder/master/konversi-kampus-merdeka" class="flex items-center gap-2 py-1 px-2 text-xs text-neutral-600 dark:text-neutral-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-neutral-800/60 rounded-md transition-colors font-mono">
                        <span class="size-1 rounded-full bg-neutral-400 dark:bg-neutral-500 shrink-0"></span>
                        <span class="truncate">{t('menu.administrator.tree.konversiKampusMerdeka')}</span>
                      </A>
                    </li>
                    <li>
                      <A href="/administrator/feeder/master/kurikulum" class="flex items-center gap-2 py-1 px-2 text-xs text-neutral-600 dark:text-neutral-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-neutral-800/60 rounded-md transition-colors font-mono">
                        <span class="size-1 rounded-full bg-neutral-400 dark:bg-neutral-500 shrink-0"></span>
                        <span class="truncate">{t('menu.administrator.tree.kurikulum')}</span>
                      </A>
                    </li>
                    <li>
                      <A href="/administrator/feeder/master/mahasiswa" class="flex items-center gap-2 py-1 px-2 text-xs text-neutral-600 dark:text-neutral-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-neutral-800/60 rounded-md transition-colors font-mono">
                        <span class="size-1 rounded-full bg-neutral-400 dark:bg-neutral-500 shrink-0"></span>
                        <span class="truncate">{t('menu.administrator.tree.mahasiswa')}</span>
                      </A>
                    </li>
                    <li>
                      <A href="/administrator/feeder/master/mahasiswa-bimbingan-dosen" class="flex items-center gap-2 py-1 px-2 text-xs text-neutral-600 dark:text-neutral-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-neutral-800/60 rounded-md transition-colors font-mono">
                        <span class="size-1 rounded-full bg-neutral-400 dark:bg-neutral-500 shrink-0"></span>
                        <span class="truncate">{t('menu.administrator.tree.mahasiswaBimbinganDosen')}</span>
                      </A>
                    </li>
                    <li>
                      <A href="/administrator/feeder/master/mahasiswa-lulusan-dropout" class="flex items-center gap-2 py-1 px-2 text-xs text-neutral-600 dark:text-neutral-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-neutral-800/60 rounded-md transition-colors font-mono">
                        <span class="size-1 rounded-full bg-neutral-400 dark:bg-neutral-500 shrink-0"></span>
                        <span class="truncate">{t('menu.administrator.tree.mahasiswaLulusanDropout')}</span>
                      </A>
                    </li>
                    <li>
                      <A href="/administrator/feeder/master/matakuliah" class="flex items-center gap-2 py-1 px-2 text-xs text-neutral-600 dark:text-neutral-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-neutral-800/60 rounded-md transition-colors font-mono">
                        <span class="size-1 rounded-full bg-neutral-400 dark:bg-neutral-500 shrink-0"></span>
                        <span class="truncate">{t('menu.administrator.tree.matakuliah')}</span>
                      </A>
                    </li>
                    <li>
                      <A href="/administrator/feeder/master/matakuliah-kurikulum" class="flex items-center gap-2 py-1 px-2 text-xs text-neutral-600 dark:text-neutral-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-neutral-800/60 rounded-md transition-colors font-mono">
                        <span class="size-1 rounded-full bg-neutral-400 dark:bg-neutral-500 shrink-0"></span>
                        <span class="truncate">{t('menu.administrator.tree.matakuliahKurikulum')}</span>
                      </A>
                    </li>
                    <li>
                      <A href="/administrator/feeder/master/nilai-perkuliahan-kelas" class="flex items-center gap-2 py-1 px-2 text-xs text-neutral-600 dark:text-neutral-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-neutral-800/60 rounded-md transition-colors font-mono">
                        <span class="size-1 rounded-full bg-neutral-400 dark:bg-neutral-500 shrink-0"></span>
                        <span class="truncate">{t('menu.administrator.tree.nilaiPerkuliahanKelas')}</span>
                      </A>
                    </li>
                    <li>
                      <A href="/administrator/feeder/master/nilai-transfer-pendidikan-mahasiswa" class="flex items-center gap-2 py-1 px-2 text-xs text-neutral-600 dark:text-neutral-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-neutral-800/60 rounded-md transition-colors font-mono">
                        <span class="size-1 rounded-full bg-neutral-400 dark:bg-neutral-500 shrink-0"></span>
                        <span class="truncate">{t('menu.administrator.tree.nilaiTransferPendidikanMahasiswa')}</span>
                      </A>
                    </li>
                    <li>
                      <A href="/administrator/feeder/master/penugasan-dosen" class="flex items-center gap-2 py-1 px-2 text-xs text-neutral-600 dark:text-neutral-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-neutral-800/60 rounded-md transition-colors font-mono">
                        <span class="size-1 rounded-full bg-neutral-400 dark:bg-neutral-500 shrink-0"></span>
                        <span class="truncate">{t('menu.administrator.tree.penugasanDosen')}</span>
                      </A>
                    </li>
                    <li>
                      <A href="/administrator/feeder/master/perguruan-tinggi" class="flex items-center gap-2 py-1 px-2 text-xs text-neutral-600 dark:text-neutral-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-neutral-800/60 rounded-md transition-colors font-mono">
                        <span class="size-1 rounded-full bg-neutral-400 dark:bg-neutral-500 shrink-0"></span>
                        <span class="truncate">{t('menu.administrator.tree.perguruanTinggi')}</span>
                      </A>
                    </li>
                    <li>
                      <A href="/administrator/feeder/master/periode-aktif" class="flex items-center gap-2 py-1 px-2 text-xs text-neutral-600 dark:text-neutral-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-neutral-800/60 rounded-md transition-colors font-mono">
                        <span class="size-1 rounded-full bg-neutral-400 dark:bg-neutral-500 shrink-0"></span>
                        <span class="truncate">{t('menu.administrator.tree.periodeAktif')}</span>
                      </A>
                    </li>
                    <li>
                      <A href="/administrator/feeder/master/periode-perkuliahan" class="flex items-center gap-2 py-1 px-2 text-xs text-neutral-600 dark:text-neutral-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-neutral-800/60 rounded-md transition-colors font-mono">
                        <span class="size-1 rounded-full bg-neutral-400 dark:bg-neutral-500 shrink-0"></span>
                        <span class="truncate">{t('menu.administrator.tree.periodePerkuliahan')}</span>
                      </A>
                    </li>
                    <li>
                      <A href="/administrator/feeder/master/perkuliahan-mahasiswa" class="flex items-center gap-2 py-1 px-2 text-xs text-neutral-600 dark:text-neutral-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-neutral-800/60 rounded-md transition-colors font-mono">
                        <span class="size-1 rounded-full bg-neutral-400 dark:bg-neutral-500 shrink-0"></span>
                        <span class="truncate">{t('menu.administrator.tree.perkuliahanMahasiswa')}</span>
                      </A>
                    </li>
                    <li>
                      <A href="/administrator/feeder/master/peserta-kelas-kuliah" class="flex items-center gap-2 py-1 px-2 text-xs text-neutral-600 dark:text-neutral-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-neutral-800/60 rounded-md transition-colors font-mono">
                        <span class="size-1 rounded-full bg-neutral-400 dark:bg-neutral-500 shrink-0"></span>
                        <span class="truncate">{t('menu.administrator.tree.pesertaKelasKuliah')}</span>
                      </A>
                    </li>
                    <li>
                      <A href="/administrator/feeder/master/prestasi-mahasiswa" class="flex items-center gap-2 py-1 px-2 text-xs text-neutral-600 dark:text-neutral-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-neutral-800/60 rounded-md transition-colors font-mono">
                        <span class="size-1 rounded-full bg-neutral-400 dark:bg-neutral-500 shrink-0"></span>
                        <span class="truncate">{t('menu.administrator.tree.prestasiMahasiswa')}</span>
                      </A>
                    </li>
                    <li>
                      <A href="/administrator/feeder/master/profil-perguruan-tinggi" class="flex items-center gap-2 py-1 px-2 text-xs text-neutral-600 dark:text-neutral-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-neutral-800/60 rounded-md transition-colors font-mono">
                        <span class="size-1 rounded-full bg-neutral-400 dark:bg-neutral-500 shrink-0"></span>
                        <span class="truncate">{t('menu.administrator.tree.profilPerguruanTinggi')}</span>
                      </A>
                    </li>
                    <li>
                      <A href="/administrator/feeder/master/program-studi" class="flex items-center gap-2 py-1 px-2 text-xs text-neutral-600 dark:text-neutral-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-neutral-800/60 rounded-md transition-colors font-mono">
                        <span class="size-1 rounded-full bg-neutral-400 dark:bg-neutral-500 shrink-0"></span>
                        <span class="truncate">{t('menu.administrator.tree.programStudi')}</span>
                      </A>
                    </li>
                    <li>
                      <A href="/administrator/feeder/master/rencana-evaluasi" class="flex items-center gap-2 py-1 px-2 text-xs text-neutral-600 dark:text-neutral-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-neutral-800/60 rounded-md transition-colors font-mono">
                        <span class="size-1 rounded-full bg-neutral-400 dark:bg-neutral-500 shrink-0"></span>
                        <span class="truncate">{t('menu.administrator.tree.rencanaEvaluasi')}</span>
                      </A>
                    </li>
                    <li>
                      <A href="/administrator/feeder/master/rencana-pembelajaran" class="flex items-center gap-2 py-1 px-2 text-xs text-neutral-600 dark:text-neutral-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-neutral-800/60 rounded-md transition-colors font-mono">
                        <span class="size-1 rounded-full bg-neutral-400 dark:bg-neutral-500 shrink-0"></span>
                        <span class="truncate">{t('menu.administrator.tree.rencanaPembelajaran')}</span>
                      </A>
                    </li>
                    <li>
                      <A href="/administrator/feeder/master/riwayat-fungsional-dosen" class="flex items-center gap-2 py-1 px-2 text-xs text-neutral-600 dark:text-neutral-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-neutral-800/60 rounded-md transition-colors font-mono">
                        <span class="size-1 rounded-full bg-neutral-400 dark:bg-neutral-500 shrink-0"></span>
                        <span class="truncate">{t('menu.administrator.tree.riwayatFungsionalDosen')}</span>
                      </A>
                    </li>
                    <li>
                      <A href="/administrator/feeder/master/riwayat-nilai-mahasiswa" class="flex items-center gap-2 py-1 px-2 text-xs text-neutral-600 dark:text-neutral-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-neutral-800/60 rounded-md transition-colors font-mono">
                        <span class="size-1 rounded-full bg-neutral-400 dark:bg-neutral-500 shrink-0"></span>
                        <span class="truncate">{t('menu.administrator.tree.riwayatNilaiMahasiswa')}</span>
                      </A>
                    </li>
                    <li>
                      <A href="/administrator/feeder/master/riwayat-pangkat-dosen" class="flex items-center gap-2 py-1 px-2 text-xs text-neutral-600 dark:text-neutral-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-neutral-800/60 rounded-md transition-colors font-mono">
                        <span class="size-1 rounded-full bg-neutral-400 dark:bg-neutral-500 shrink-0"></span>
                        <span class="truncate">{t('menu.administrator.tree.riwayatPangkatDosen')}</span>
                      </A>
                    </li>
                    <li>
                      <A href="/administrator/feeder/master/riwayat-pendidikan-dosen" class="flex items-center gap-2 py-1 px-2 text-xs text-neutral-600 dark:text-neutral-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-neutral-800/60 rounded-md transition-colors font-mono">
                        <span class="size-1 rounded-full bg-neutral-400 dark:bg-neutral-500 shrink-0"></span>
                        <span class="truncate">{t('menu.administrator.tree.riwayatPendidikanDosen')}</span>
                      </A>
                    </li>
                    <li>
                      <A href="/administrator/feeder/master/riwayat-pendidikan-mahasiswa" class="flex items-center gap-2 py-1 px-2 text-xs text-neutral-600 dark:text-neutral-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-neutral-800/60 rounded-md transition-colors font-mono">
                        <span class="size-1 rounded-full bg-neutral-400 dark:bg-neutral-500 shrink-0"></span>
                        <span class="truncate">{t('menu.administrator.tree.riwayatPendidikanMahasiswa')}</span>
                      </A>
                    </li>
                    <li>
                      <A href="/administrator/feeder/master/riwayat-penelitian-dosen" class="flex items-center gap-2 py-1 px-2 text-xs text-neutral-600 dark:text-neutral-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-neutral-800/60 rounded-md transition-colors font-mono">
                        <span class="size-1 rounded-full bg-neutral-400 dark:bg-neutral-500 shrink-0"></span>
                        <span class="truncate">{t('menu.administrator.tree.riwayatPenelitianDosen')}</span>
                      </A>
                    </li>
                    <li>
                      <A href="/administrator/feeder/master/riwayat-sertifikasi-dosen" class="flex items-center gap-2 py-1 px-2 text-xs text-neutral-600 dark:text-neutral-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-neutral-800/60 rounded-md transition-colors font-mono">
                        <span class="size-1 rounded-full bg-neutral-400 dark:bg-neutral-500 shrink-0"></span>
                        <span class="truncate">{t('menu.administrator.tree.riwayatSertifikasiDosen')}</span>
                      </A>
                    </li>
                    <li>
                      <A href="/administrator/feeder/master/skala-nilai-program-studi" class="flex items-center gap-2 py-1 px-2 text-xs text-neutral-600 dark:text-neutral-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-neutral-800/60 rounded-md transition-colors font-mono">
                        <span class="size-1 rounded-full bg-neutral-400 dark:bg-neutral-500 shrink-0"></span>
                        <span class="truncate">{t('menu.administrator.tree.skalaNilaiProgramStudi')}</span>
                      </A>
                    </li>
                    <li>
                      <A href="/administrator/feeder/master/substansi-matakuliah" class="flex items-center gap-2 py-1 px-2 text-xs text-neutral-600 dark:text-neutral-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-neutral-800/60 rounded-md transition-colors font-mono">
                        <span class="size-1 rounded-full bg-neutral-400 dark:bg-neutral-500 shrink-0"></span>
                        <span class="truncate">{t('menu.administrator.tree.substansiMatakuliah')}</span>
                      </A>
                    </li>
                    <li>
                      <A href="/administrator/feeder/master/transkrip-mahasiswa" class="flex items-center gap-2 py-1 px-2 text-xs text-neutral-600 dark:text-neutral-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-neutral-800/60 rounded-md transition-colors font-mono">
                        <span class="size-1 rounded-full bg-neutral-400 dark:bg-neutral-500 shrink-0"></span>
                        <span class="truncate">{t('menu.administrator.tree.transkripMahasiswa')}</span>
                      </A>
                    </li>
                    <li>
                      <A href="/administrator/feeder/master/uji-mahasiswa" class="flex items-center gap-2 py-1 px-2 text-xs text-neutral-600 dark:text-neutral-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-neutral-800/60 rounded-md transition-colors font-mono">
                        <span class="size-1 rounded-full bg-neutral-400 dark:bg-neutral-500 shrink-0"></span>
                        <span class="truncate">{t('menu.administrator.tree.ujiMahasiswa')}</span>
                      </A>
                    </li>
                  </ul>
                </div>
              </details>
            </li>
            <li>
              <details class="group animated-details">
                <summary class="list-none [&::-webkit-details-marker]:hidden cursor-pointer w-full text-start flex items-center justify-between py-1 px-2 text-xs font-medium text-neutral-700 dark:text-neutral-300 rounded-md hover:bg-neutral-100 dark:hover:bg-neutral-800/80 transition-colors font-mono">
                  <div class="flex items-center gap-2 truncate">
                    <svg class="size-3 text-neutral-400 group-open:rotate-90 transition-transform shrink-0" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="m9 18 6-6-6-6"/></svg>
                    <span class="truncate">{t('menu.administrator.tree.referensi')}</span>
                  </div>
                </summary>
                <div class="w-full details-anim-content">
                  <ul class="pt-0.5 ps-2.5 space-y-0.5 border-s border-neutral-200 dark:border-neutral-700 ms-2.5 my-0.5">
                    <li>
                      <A href="/administrator/feeder/referensi/agama" class="flex items-center gap-2 py-1 px-2 text-xs text-neutral-600 dark:text-neutral-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-neutral-800/60 rounded-md transition-colors font-mono">
                        <span class="size-1 rounded-full bg-neutral-400 dark:bg-neutral-500 shrink-0"></span>
                        <span class="truncate">{t('menu.administrator.tree.agama')}</span>
                      </A>
                    </li>
                    <li>
                      <A href="/administrator/feeder/referensi/alat-transportasi" class="flex items-center gap-2 py-1 px-2 text-xs text-neutral-600 dark:text-neutral-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-neutral-800/60 rounded-md transition-colors font-mono">
                        <span class="size-1 rounded-full bg-neutral-400 dark:bg-neutral-500 shrink-0"></span>
                        <span class="truncate">{t('menu.administrator.tree.alatTransportasi')}</span>
                      </A>
                    </li>
                    <li>
                      <A href="/administrator/feeder/referensi/bentuk-pendidikan" class="flex items-center gap-2 py-1 px-2 text-xs text-neutral-600 dark:text-neutral-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-neutral-800/60 rounded-md transition-colors font-mono">
                        <span class="size-1 rounded-full bg-neutral-400 dark:bg-neutral-500 shrink-0"></span>
                        <span class="truncate">{t('menu.administrator.tree.bentukPendidikan')}</span>
                      </A>
                    </li>
                    <li>
                      <A href="/administrator/feeder/referensi/ikatan-kerja-sumber-daya-manusia" class="flex items-center gap-2 py-1 px-2 text-xs text-neutral-600 dark:text-neutral-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-neutral-800/60 rounded-md transition-colors font-mono">
                        <span class="size-1 rounded-full bg-neutral-400 dark:bg-neutral-500 shrink-0"></span>
                        <span class="truncate">{t('menu.administrator.tree.ikatanKerjaSumberDayaManusia')}</span>
                      </A>
                    </li>
                    <li>
                      <A href="/administrator/feeder/referensi/jabatan-fungsional" class="flex items-center gap-2 py-1 px-2 text-xs text-neutral-600 dark:text-neutral-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-neutral-800/60 rounded-md transition-colors font-mono">
                        <span class="size-1 rounded-full bg-neutral-400 dark:bg-neutral-500 shrink-0"></span>
                        <span class="truncate">{t('menu.administrator.tree.jabatanFungsional')}</span>
                      </A>
                    </li>
                    <li>
                      <A href="/administrator/feeder/referensi/jalur-masuk" class="flex items-center gap-2 py-1 px-2 text-xs text-neutral-600 dark:text-neutral-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-neutral-800/60 rounded-md transition-colors font-mono">
                        <span class="size-1 rounded-full bg-neutral-400 dark:bg-neutral-500 shrink-0"></span>
                        <span class="truncate">{t('menu.administrator.tree.jalurMasuk')}</span>
                      </A>
                    </li>
                    <li>
                      <A href="/administrator/feeder/referensi/jenis-aktifitas-mahasiswa" class="flex items-center gap-2 py-1 px-2 text-xs text-neutral-600 dark:text-neutral-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-neutral-800/60 rounded-md transition-colors font-mono">
                        <span class="size-1 rounded-full bg-neutral-400 dark:bg-neutral-500 shrink-0"></span>
                        <span class="truncate">{t('menu.administrator.tree.jenisAktifitasMahasiswa')}</span>
                      </A>
                    </li>
                    <li>
                      <A href="/administrator/feeder/referensi/jenis-evaluasi" class="flex items-center gap-2 py-1 px-2 text-xs text-neutral-600 dark:text-neutral-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-neutral-800/60 rounded-md transition-colors font-mono">
                        <span class="size-1 rounded-full bg-neutral-400 dark:bg-neutral-500 shrink-0"></span>
                        <span class="truncate">{t('menu.administrator.tree.jenisEvaluasi')}</span>
                      </A>
                    </li>
                    <li>
                      <A href="/administrator/feeder/referensi/jenis-keluar" class="flex items-center gap-2 py-1 px-2 text-xs text-neutral-600 dark:text-neutral-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-neutral-800/60 rounded-md transition-colors font-mono">
                        <span class="size-1 rounded-full bg-neutral-400 dark:bg-neutral-500 shrink-0"></span>
                        <span class="truncate">{t('menu.administrator.tree.jenisKeluar')}</span>
                      </A>
                    </li>
                    <li>
                      <A href="/administrator/feeder/referensi/jenis-pendaftaran" class="flex items-center gap-2 py-1 px-2 text-xs text-neutral-600 dark:text-neutral-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-neutral-800/60 rounded-md transition-colors font-mono">
                        <span class="size-1 rounded-full bg-neutral-400 dark:bg-neutral-500 shrink-0"></span>
                        <span class="truncate">{t('menu.administrator.tree.jenisPendaftaran')}</span>
                      </A>
                    </li>
                    <li>
                      <A href="/administrator/feeder/referensi/jenis-prestasi" class="flex items-center gap-2 py-1 px-2 text-xs text-neutral-600 dark:text-neutral-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-neutral-800/60 rounded-md transition-colors font-mono">
                        <span class="size-1 rounded-full bg-neutral-400 dark:bg-neutral-500 shrink-0"></span>
                        <span class="truncate">{t('menu.administrator.tree.jenisPrestasi')}</span>
                      </A>
                    </li>
                    <li>
                      <A href="/administrator/feeder/referensi/jenis-satuan-manajemen-sumberdaya" class="flex items-center gap-2 py-1 px-2 text-xs text-neutral-600 dark:text-neutral-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-neutral-800/60 rounded-md transition-colors font-mono">
                        <span class="size-1 rounded-full bg-neutral-400 dark:bg-neutral-500 shrink-0"></span>
                        <span class="truncate">{t('menu.administrator.tree.jenisSatuanManajemenSumberdaya')}</span>
                      </A>
                    </li>
                    <li>
                      <A href="/administrator/feeder/referensi/jenis-sertifikasi" class="flex items-center gap-2 py-1 px-2 text-xs text-neutral-600 dark:text-neutral-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-neutral-800/60 rounded-md transition-colors font-mono">
                        <span class="size-1 rounded-full bg-neutral-400 dark:bg-neutral-500 shrink-0"></span>
                        <span class="truncate">{t('menu.administrator.tree.jenisSertifikasi')}</span>
                      </A>
                    </li>
                    <li>
                      <A href="/administrator/feeder/referensi/jenis-substansi" class="flex items-center gap-2 py-1 px-2 text-xs text-neutral-600 dark:text-neutral-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-neutral-800/60 rounded-md transition-colors font-mono">
                        <span class="size-1 rounded-full bg-neutral-400 dark:bg-neutral-500 shrink-0"></span>
                        <span class="truncate">{t('menu.administrator.tree.jenisSubstansi')}</span>
                      </A>
                    </li>
                    <li>
                      <A href="/administrator/feeder/referensi/jenis-tinggal" class="flex items-center gap-2 py-1 px-2 text-xs text-neutral-600 dark:text-neutral-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-neutral-800/60 rounded-md transition-colors font-mono">
                        <span class="size-1 rounded-full bg-neutral-400 dark:bg-neutral-500 shrink-0"></span>
                        <span class="truncate">{t('menu.administrator.tree.jenisTinggal')}</span>
                      </A>
                    </li>
                    <li>
                      <A href="/administrator/feeder/referensi/jenjang-pendidikan" class="flex items-center gap-2 py-1 px-2 text-xs text-neutral-600 dark:text-neutral-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-neutral-800/60 rounded-md transition-colors font-mono">
                        <span class="size-1 rounded-full bg-neutral-400 dark:bg-neutral-500 shrink-0"></span>
                        <span class="truncate">{t('menu.administrator.tree.jenjangPendidikan')}</span>
                      </A>
                    </li>
                    <li>
                      <A href="/administrator/feeder/referensi/kategori-kegiatan" class="flex items-center gap-2 py-1 px-2 text-xs text-neutral-600 dark:text-neutral-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-neutral-800/60 rounded-md transition-colors font-mono">
                        <span class="size-1 rounded-full bg-neutral-400 dark:bg-neutral-500 shrink-0"></span>
                        <span class="truncate">{t('menu.administrator.tree.kategoriKegiatan')}</span>
                      </A>
                    </li>
                    <li>
                      <A href="/administrator/feeder/referensi/kebutuhan-khusus" class="flex items-center gap-2 py-1 px-2 text-xs text-neutral-600 dark:text-neutral-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-neutral-800/60 rounded-md transition-colors font-mono">
                        <span class="size-1 rounded-full bg-neutral-400 dark:bg-neutral-500 shrink-0"></span>
                        <span class="truncate">{t('menu.administrator.tree.kebutuhanKhusus')}</span>
                      </A>
                    </li>
                    <li>
                      <A href="/administrator/feeder/referensi/lembaga-pengangkat" class="flex items-center gap-2 py-1 px-2 text-xs text-neutral-600 dark:text-neutral-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-neutral-800/60 rounded-md transition-colors font-mono">
                        <span class="size-1 rounded-full bg-neutral-400 dark:bg-neutral-500 shrink-0"></span>
                        <span class="truncate">{t('menu.administrator.tree.lembagaPengangkat')}</span>
                      </A>
                    </li>
                    <li>
                      <A href="/administrator/feeder/referensi/level-wilayah" class="flex items-center gap-2 py-1 px-2 text-xs text-neutral-600 dark:text-neutral-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-neutral-800/60 rounded-md transition-colors font-mono">
                        <span class="size-1 rounded-full bg-neutral-400 dark:bg-neutral-500 shrink-0"></span>
                        <span class="truncate">{t('menu.administrator.tree.levelWilayah')}</span>
                      </A>
                    </li>
                    <li>
                      <A href="/administrator/feeder/referensi/negara" class="flex items-center gap-2 py-1 px-2 text-xs text-neutral-600 dark:text-neutral-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-neutral-800/60 rounded-md transition-colors font-mono">
                        <span class="size-1 rounded-full bg-neutral-400 dark:bg-neutral-500 shrink-0"></span>
                        <span class="truncate">{t('menu.administrator.tree.negara')}</span>
                      </A>
                    </li>
                    <li>
                      <A href="/administrator/feeder/referensi/pangkat-golongan" class="flex items-center gap-2 py-1 px-2 text-xs text-neutral-600 dark:text-neutral-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-neutral-800/60 rounded-md transition-colors font-mono">
                        <span class="size-1 rounded-full bg-neutral-400 dark:bg-neutral-500 shrink-0"></span>
                        <span class="truncate">{t('menu.administrator.tree.pangkatGolongan')}</span>
                      </A>
                    </li>
                    <li>
                      <A href="/administrator/feeder/referensi/pekerjaan" class="flex items-center gap-2 py-1 px-2 text-xs text-neutral-600 dark:text-neutral-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-neutral-800/60 rounded-md transition-colors font-mono">
                        <span class="size-1 rounded-full bg-neutral-400 dark:bg-neutral-500 shrink-0"></span>
                        <span class="truncate">{t('menu.administrator.tree.pekerjaan')}</span>
                      </A>
                    </li>
                    <li>
                      <A href="/administrator/feeder/referensi/pembiayaan" class="flex items-center gap-2 py-1 px-2 text-xs text-neutral-600 dark:text-neutral-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-neutral-800/60 rounded-md transition-colors font-mono">
                        <span class="size-1 rounded-full bg-neutral-400 dark:bg-neutral-500 shrink-0"></span>
                        <span class="truncate">{t('menu.administrator.tree.pembiayaan')}</span>
                      </A>
                    </li>
                    <li>
                      <A href="/administrator/feeder/referensi/penghasilan" class="flex items-center gap-2 py-1 px-2 text-xs text-neutral-600 dark:text-neutral-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-neutral-800/60 rounded-md transition-colors font-mono">
                        <span class="size-1 rounded-full bg-neutral-400 dark:bg-neutral-500 shrink-0"></span>
                        <span class="truncate">{t('menu.administrator.tree.penghasilan')}</span>
                      </A>
                    </li>
                    <li>
                      <A href="/administrator/feeder/referensi/periode-lampau" class="flex items-center gap-2 py-1 px-2 text-xs text-neutral-600 dark:text-neutral-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-neutral-800/60 rounded-md transition-colors font-mono">
                        <span class="size-1 rounded-full bg-neutral-400 dark:bg-neutral-500 shrink-0"></span>
                        <span class="truncate">{t('menu.administrator.tree.periodeLampau')}</span>
                      </A>
                    </li>
                    <li>
                      <A href="/administrator/feeder/referensi/semester" class="flex items-center gap-2 py-1 px-2 text-xs text-neutral-600 dark:text-neutral-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-neutral-800/60 rounded-md transition-colors font-mono">
                        <span class="size-1 rounded-full bg-neutral-400 dark:bg-neutral-500 shrink-0"></span>
                        <span class="truncate">{t('menu.administrator.tree.semester')}</span>
                      </A>
                    </li>
                    <li>
                      <A href="/administrator/feeder/referensi/status-keaktifan-pegawai" class="flex items-center gap-2 py-1 px-2 text-xs text-neutral-600 dark:text-neutral-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-neutral-800/60 rounded-md transition-colors font-mono">
                        <span class="size-1 rounded-full bg-neutral-400 dark:bg-neutral-500 shrink-0"></span>
                        <span class="truncate">{t('menu.administrator.tree.statusKeaktifanPegawai')}</span>
                      </A>
                    </li>
                    <li>
                      <A href="/administrator/feeder/referensi/status-kepegawaian" class="flex items-center gap-2 py-1 px-2 text-xs text-neutral-600 dark:text-neutral-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-neutral-800/60 rounded-md transition-colors font-mono">
                        <span class="size-1 rounded-full bg-neutral-400 dark:bg-neutral-500 shrink-0"></span>
                        <span class="truncate">{t('menu.administrator.tree.statusKepegawaian')}</span>
                      </A>
                    </li>
                    <li>
                      <A href="/administrator/feeder/referensi/status-mahasiswa" class="flex items-center gap-2 py-1 px-2 text-xs text-neutral-600 dark:text-neutral-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-neutral-800/60 rounded-md transition-colors font-mono">
                        <span class="size-1 rounded-full bg-neutral-400 dark:bg-neutral-500 shrink-0"></span>
                        <span class="truncate">{t('menu.administrator.tree.statusMahasiswa')}</span>
                      </A>
                    </li>
                    <li>
                      <A href="/administrator/feeder/referensi/tahun-ajaran" class="flex items-center gap-2 py-1 px-2 text-xs text-neutral-600 dark:text-neutral-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-neutral-800/60 rounded-md transition-colors font-mono">
                        <span class="size-1 rounded-full bg-neutral-400 dark:bg-neutral-500 shrink-0"></span>
                        <span class="truncate">{t('menu.administrator.tree.tahunAjaran')}</span>
                      </A>
                    </li>
                    <li>
                      <A href="/administrator/feeder/referensi/tingkat-prestasi" class="flex items-center gap-2 py-1 px-2 text-xs text-neutral-600 dark:text-neutral-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-neutral-800/60 rounded-md transition-colors font-mono">
                        <span class="size-1 rounded-full bg-neutral-400 dark:bg-neutral-500 shrink-0"></span>
                        <span class="truncate">{t('menu.administrator.tree.tingkatPrestasi')}</span>
                      </A>
                    </li>
                    <li>
                      <A href="/administrator/feeder/referensi/wilayah" class="flex items-center gap-2 py-1 px-2 text-xs text-neutral-600 dark:text-neutral-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-neutral-800/60 rounded-md transition-colors font-mono">
                        <span class="size-1 rounded-full bg-neutral-400 dark:bg-neutral-500 shrink-0"></span>
                        <span class="truncate">{t('menu.administrator.tree.wilayah')}</span>
                      </A>
                    </li>
                  </ul>
                </div>
              </details>
            </li>
            <li>
              <details class="group animated-details">
                <summary class="list-none [&::-webkit-details-marker]:hidden cursor-pointer w-full text-start flex items-center justify-between py-1 px-2 text-xs font-medium text-neutral-700 dark:text-neutral-300 rounded-md hover:bg-neutral-100 dark:hover:bg-neutral-800/80 transition-colors font-mono">
                  <div class="flex items-center gap-2 truncate">
                    <svg class="size-3 text-neutral-400 group-open:rotate-90 transition-transform shrink-0" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="m9 18 6-6-6-6"/></svg>
                    <span class="truncate">{t('menu.administrator.tree.rekapitulasi')}</span>
                  </div>
                </summary>
                <div class="w-full details-anim-content">
                  <ul class="pt-0.5 ps-2.5 space-y-0.5 border-s border-neutral-200 dark:border-neutral-700 ms-2.5 my-0.5">
                    <li>
                      <A href="/administrator/feeder/rekapitulasi/indeks-prestasi-sementara-mahasiswa" class="flex items-center gap-2 py-1 px-2 text-xs text-neutral-600 dark:text-neutral-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-neutral-800/60 rounded-md transition-colors font-mono">
                        <span class="size-1 rounded-full bg-neutral-400 dark:bg-neutral-500 shrink-0"></span>
                        <span class="truncate">{t('menu.administrator.tree.indeksPrestasiSementaraMahasiswa')}</span>
                      </A>
                    </li>
                    <li>
                      <A href="/administrator/feeder/rekapitulasi/jumlah-dosen" class="flex items-center gap-2 py-1 px-2 text-xs text-neutral-600 dark:text-neutral-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-neutral-800/60 rounded-md transition-colors font-mono">
                        <span class="size-1 rounded-full bg-neutral-400 dark:bg-neutral-500 shrink-0"></span>
                        <span class="truncate">{t('menu.administrator.tree.jumlahDosen')}</span>
                      </A>
                    </li>
                    <li>
                      <A href="/administrator/feeder/rekapitulasi/jumlah-mahasiswa" class="flex items-center gap-2 py-1 px-2 text-xs text-neutral-600 dark:text-neutral-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-neutral-800/60 rounded-md transition-colors font-mono">
                        <span class="size-1 rounded-full bg-neutral-400 dark:bg-neutral-500 shrink-0"></span>
                        <span class="truncate">{t('menu.administrator.tree.jumlahMahasiswa')}</span>
                      </A>
                    </li>
                    <li>
                      <A href="/administrator/feeder/rekapitulasi/kartu-hasil-studi-mahasiswa" class="flex items-center gap-2 py-1 px-2 text-xs text-neutral-600 dark:text-neutral-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-neutral-800/60 rounded-md transition-colors font-mono">
                        <span class="size-1 rounded-full bg-neutral-400 dark:bg-neutral-500 shrink-0"></span>
                        <span class="truncate">{t('menu.administrator.tree.kartuHasilStudiMahasiswa')}</span>
                      </A>
                    </li>
                    <li>
                      <A href="/administrator/feeder/rekapitulasi/kartu-rencana-studi-mahasiswa" class="flex items-center gap-2 py-1 px-2 text-xs text-neutral-600 dark:text-neutral-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-neutral-800/60 rounded-md transition-colors font-mono">
                        <span class="size-1 rounded-full bg-neutral-400 dark:bg-neutral-500 shrink-0"></span>
                        <span class="truncate">{t('menu.administrator.tree.kartuRencanaStudiMahasiswa')}</span>
                      </A>
                    </li>
                    <li>
                      <A href="/administrator/feeder/rekapitulasi/laporan" class="flex items-center gap-2 py-1 px-2 text-xs text-neutral-600 dark:text-neutral-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-neutral-800/60 rounded-md transition-colors font-mono">
                        <span class="size-1 rounded-full bg-neutral-400 dark:bg-neutral-500 shrink-0"></span>
                        <span class="truncate">{t('menu.administrator.tree.laporan')}</span>
                      </A>
                    </li>
                  </ul>
                </div>
              </details>
            </li>
          </ul>
        </div>
      </details>
    </li>
    <li>
      <details class="group animated-details">
        <summary class="list-none [&::-webkit-details-marker]:hidden cursor-pointer w-full text-start flex items-center justify-between py-1.5 px-2 text-xs font-bold text-neutral-800 dark:text-neutral-200 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors font-mono">
          <div class="flex items-center gap-2 truncate">
            <svg class="size-3 text-neutral-400 group-open:rotate-90 transition-transform shrink-0" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="m9 18 6-6-6-6"/></svg>
            <span class="truncate">{t('menu.administrator.tree.general')}</span>
          </div>
        </summary>
        <div class="w-full details-anim-content">
          <ul class="pt-0.5 ps-2.5 space-y-0.5 border-s border-neutral-200 dark:border-neutral-700 ms-2.5 my-0.5">
            <li>
              <div class="flex items-center gap-x-2 py-1 px-2 text-xs font-mono text-neutral-400 dark:text-neutral-500">
                <span class="size-1.5 rounded-full bg-neutral-300 dark:bg-neutral-600"></span>
                <span>{t('menu.administrator.tree.reference')}</span>
              </div>
            </li>
          </ul>
        </div>
      </details>
    </li>
    <li>
      <details class="group animated-details" open>
        <summary class="list-none [&::-webkit-details-marker]:hidden cursor-pointer w-full text-start flex items-center justify-between py-1.5 px-2 text-xs font-bold text-neutral-800 dark:text-neutral-200 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors font-mono">
          <div class="flex items-center gap-2 truncate">
            <svg class="size-3 text-neutral-400 group-open:rotate-90 transition-transform shrink-0" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="m9 18 6-6-6-6"/></svg>
            <span class="truncate">{t('menu.administrator.tree.institution')}</span>
          </div>
        </summary>
        <div class="w-full details-anim-content">
          <ul class="pt-0.5 ps-2.5 space-y-0.5 border-s border-neutral-200 dark:border-neutral-700 ms-2.5 my-0.5">
            <li>
              <details class="group animated-details">
                <summary class="list-none [&::-webkit-details-marker]:hidden cursor-pointer w-full text-start flex items-center justify-between py-1 px-2 text-xs font-medium text-neutral-700 dark:text-neutral-300 rounded-md hover:bg-neutral-100 dark:hover:bg-neutral-800/80 transition-colors font-mono">
                  <div class="flex items-center gap-2 truncate">
                    <svg class="size-3 text-neutral-400 group-open:rotate-90 transition-transform shrink-0" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="m9 18 6-6-6-6"/></svg>
                    <span class="truncate">{t('menu.administrator.tree.master')}</span>
                  </div>
                </summary>
                <div class="w-full details-anim-content">
                  <ul class="pt-0.5 ps-2.5 space-y-0.5 border-s border-neutral-200 dark:border-neutral-700 ms-2.5 my-0.5">
                    <li>
                      <A href="/administrator/institution/master/employee" class="flex items-center gap-2 py-1 px-2 text-xs text-neutral-600 dark:text-neutral-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-neutral-800/60 rounded-md transition-colors font-mono">
                        <span class="size-1 rounded-full bg-neutral-400 dark:bg-neutral-500 shrink-0"></span>
                        <span class="truncate">{t('menu.administrator.tree.employees')}</span>
                      </A>
                    </li>
                    <li>
                      <A href="/administrator/institution/master/institution" class="flex items-center gap-2 py-1 px-2 text-xs text-neutral-600 dark:text-neutral-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-neutral-800/60 rounded-md transition-colors font-mono">
                        <span class="size-1 rounded-full bg-neutral-400 dark:bg-neutral-500 shrink-0"></span>
                        <span class="truncate">{t('menu.administrator.tree.institutions')}</span>
                      </A>
                    </li>
                    <li>
                      <A href="/administrator/institution/master/staff" class="flex items-center gap-2 py-1 px-2 text-xs text-neutral-600 dark:text-neutral-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-neutral-800/60 rounded-md transition-colors font-mono">
                        <span class="size-1 rounded-full bg-neutral-400 dark:bg-neutral-500 shrink-0"></span>
                        <span class="truncate">{t('menu.administrator.tree.staffes')}</span>
                      </A>
                    </li>
                    <li>
                      <A href="/administrator/institution/master/unit" class="flex items-center gap-2 py-1 px-2 text-xs text-neutral-600 dark:text-neutral-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-neutral-800/60 rounded-md transition-colors font-mono">
                        <span class="size-1 rounded-full bg-neutral-400 dark:bg-neutral-500 shrink-0"></span>
                        <span class="truncate">{t('menu.administrator.tree.units')}</span>
                      </A>
                    </li>
                  </ul>
                </div>
              </details>
            </li>
            <li>
              <details class="group animated-details">
                <summary class="list-none [&::-webkit-details-marker]:hidden cursor-pointer w-full text-start flex items-center justify-between py-1 px-2 text-xs font-medium text-neutral-700 dark:text-neutral-300 rounded-md hover:bg-neutral-100 dark:hover:bg-neutral-800/80 transition-colors font-mono">
                  <div class="flex items-center gap-2 truncate">
                    <svg class="size-3 text-neutral-400 group-open:rotate-90 transition-transform shrink-0" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="m9 18 6-6-6-6"/></svg>
                    <span class="truncate">{t('menu.administrator.tree.reference')}</span>
                  </div>
                </summary>
                <div class="w-full details-anim-content">
                  <ul class="pt-0.5 ps-2.5 space-y-0.5 border-s border-neutral-200 dark:border-neutral-700 ms-2.5 my-0.5">
                    <li>
                      <A href="/administrator/institution/reference/category" class="flex items-center gap-2 py-1 px-2 text-xs text-neutral-600 dark:text-neutral-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-neutral-800/60 rounded-md transition-colors font-mono">
                        <span class="size-1 rounded-full bg-neutral-400 dark:bg-neutral-500 shrink-0"></span>
                        <span class="truncate">{t('menu.administrator.tree.categories')}</span>
                      </A>
                    </li>
                    <li>
                      <A href="/administrator/institution/reference/position-type" class="flex items-center gap-2 py-1 px-2 text-xs text-neutral-600 dark:text-neutral-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-neutral-800/60 rounded-md transition-colors font-mono">
                        <span class="size-1 rounded-full bg-neutral-400 dark:bg-neutral-500 shrink-0"></span>
                        <span class="truncate">{t('menu.administrator.tree.positionType')}</span>
                      </A>
                    </li>
                    <li>
                      <A href="/administrator/institution/reference/unit-type" class="flex items-center gap-2 py-1 px-2 text-xs text-neutral-600 dark:text-neutral-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-neutral-800/60 rounded-md transition-colors font-mono">
                        <span class="size-1 rounded-full bg-neutral-400 dark:bg-neutral-500 shrink-0"></span>
                        <span class="truncate">{t('menu.administrator.tree.unitTypes')}</span>
                      </A>
                    </li>
                    <li>
                      <A href="/administrator/institution/reference/variety" class="flex items-center gap-2 py-1 px-2 text-xs text-neutral-600 dark:text-neutral-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-neutral-800/60 rounded-md transition-colors font-mono">
                        <span class="size-1 rounded-full bg-neutral-400 dark:bg-neutral-500 shrink-0"></span>
                        <span class="truncate">{t('menu.administrator.tree.varieties')}</span>
                      </A>
                    </li>
                  </ul>
                </div>
              </details>
            </li>
          </ul>
        </div>
      </details>
    </li>
    <li>
      <details class="group animated-details">
        <summary class="list-none [&::-webkit-details-marker]:hidden cursor-pointer w-full text-start flex items-center justify-between py-1.5 px-2 text-xs font-bold text-neutral-800 dark:text-neutral-200 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors font-mono">
          <div class="flex items-center gap-2 truncate">
            <svg class="size-3 text-neutral-400 group-open:rotate-90 transition-transform shrink-0" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="m9 18 6-6-6-6"/></svg>
            <span class="truncate">{t('menu.administrator.tree.literate')}</span>
          </div>
        </summary>
        <div class="w-full details-anim-content">
          <ul class="pt-0.5 ps-2.5 space-y-0.5 border-s border-neutral-200 dark:border-neutral-700 ms-2.5 my-0.5">
            <li>
              <A href="/administrator/literate" end class="flex items-center gap-2 py-1 px-2 text-xs text-neutral-600 dark:text-neutral-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-neutral-800/60 rounded-md transition-colors font-mono">
                <span class="size-1 rounded-full bg-blue-500 shrink-0"></span>
                <span class="truncate">{t('menu.administrator.tree.overview')}</span>
              </A>
            </li>
            <li>
              <A href="/administrator/literate/category" class="flex items-center gap-2 py-1 px-2 text-xs text-neutral-600 dark:text-neutral-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-neutral-800/60 rounded-md transition-colors font-mono">
                <span class="size-1 rounded-full bg-neutral-400 dark:bg-neutral-500 shrink-0"></span>
                <span class="truncate">{t('menu.administrator.tree.categories')}</span>
              </A>
            </li>
            <li>
              <A href="/administrator/literate/education" class="flex items-center gap-2 py-1 px-2 text-xs text-neutral-600 dark:text-neutral-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-neutral-800/60 rounded-md transition-colors font-mono">
                <span class="size-1 rounded-full bg-neutral-400 dark:bg-neutral-500 shrink-0"></span>
                <span class="truncate">{t('menu.administrator.tree.educations')}</span>
              </A>
            </li>
            <li>
              <A href="/administrator/literate/group" class="flex items-center gap-2 py-1 px-2 text-xs text-neutral-600 dark:text-neutral-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-neutral-800/60 rounded-md transition-colors font-mono">
                <span class="size-1 rounded-full bg-neutral-400 dark:bg-neutral-500 shrink-0"></span>
                <span class="truncate">{t('menu.administrator.tree.groups')}</span>
              </A>
            </li>
            <li>
              <A href="/administrator/literate/level" class="flex items-center gap-2 py-1 px-2 text-xs text-neutral-600 dark:text-neutral-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-neutral-800/60 rounded-md transition-colors font-mono">
                <span class="size-1 rounded-full bg-neutral-400 dark:bg-neutral-500 shrink-0"></span>
                <span class="truncate">{t('menu.administrator.tree.levels')}</span>
              </A>
            </li>
            <li>
              <A href="/administrator/literate/variety" class="flex items-center gap-2 py-1 px-2 text-xs text-neutral-600 dark:text-neutral-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-neutral-800/60 rounded-md transition-colors font-mono">
                <span class="size-1 rounded-full bg-neutral-400 dark:bg-neutral-500 shrink-0"></span>
                <span class="truncate">{t('menu.administrator.tree.varieties')}</span>
              </A>
            </li>
          </ul>
        </div>
      </details>
    </li>
    <li>
      <details class="group animated-details">
        <summary class="list-none [&::-webkit-details-marker]:hidden cursor-pointer w-full text-start flex items-center justify-between py-1.5 px-2 text-xs font-bold text-neutral-800 dark:text-neutral-200 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors font-mono">
          <div class="flex items-center gap-2 truncate">
            <svg class="size-3 text-neutral-400 group-open:rotate-90 transition-transform shrink-0" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="m9 18 6-6-6-6"/></svg>
            <span class="truncate">{t('menu.administrator.tree.location')}</span>
          </div>
        </summary>
        <div class="w-full details-anim-content">
          <ul class="pt-0.5 ps-2.5 space-y-0.5 border-s border-neutral-200 dark:border-neutral-700 ms-2.5 my-0.5">
            <li>
              <A href="/administrator/location" end class="flex items-center gap-2 py-1 px-2 text-xs text-neutral-600 dark:text-neutral-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-neutral-800/60 rounded-md transition-colors font-mono">
                <span class="size-1 rounded-full bg-blue-500 shrink-0"></span>
                <span class="truncate">{t('menu.administrator.tree.overview')}</span>
              </A>
            </li>
            <li>
              <A href="/administrator/location/continent" class="flex items-center gap-2 py-1 px-2 text-xs text-neutral-600 dark:text-neutral-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-neutral-800/60 rounded-md transition-colors font-mono">
                <span class="size-1 rounded-full bg-neutral-400 dark:bg-neutral-500 shrink-0"></span>
                <span class="truncate">{t('menu.administrator.tree.continents')}</span>
              </A>
            </li>
            <li>
              <A href="/administrator/location/country" class="flex items-center gap-2 py-1 px-2 text-xs text-neutral-600 dark:text-neutral-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-neutral-800/60 rounded-md transition-colors font-mono">
                <span class="size-1 rounded-full bg-neutral-400 dark:bg-neutral-500 shrink-0"></span>
                <span class="truncate">{t('menu.administrator.tree.countries')}</span>
              </A>
            </li>
            <li>
              <A href="/administrator/location/province" class="flex items-center gap-2 py-1 px-2 text-xs text-neutral-600 dark:text-neutral-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-neutral-800/60 rounded-md transition-colors font-mono">
                <span class="size-1 rounded-full bg-neutral-400 dark:bg-neutral-500 shrink-0"></span>
                <span class="truncate">{t('menu.administrator.tree.provinces')}</span>
              </A>
            </li>
            <li>
              <A href="/administrator/location/regency" class="flex items-center gap-2 py-1 px-2 text-xs text-neutral-600 dark:text-neutral-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-neutral-800/60 rounded-md transition-colors font-mono">
                <span class="size-1 rounded-full bg-neutral-400 dark:bg-neutral-500 shrink-0"></span>
                <span class="truncate">{t('menu.administrator.tree.regencies')}</span>
              </A>
            </li>
            <li>
              <A href="/administrator/location/regency-type" class="flex items-center gap-2 py-1 px-2 text-xs text-neutral-600 dark:text-neutral-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-neutral-800/60 rounded-md transition-colors font-mono">
                <span class="size-1 rounded-full bg-neutral-400 dark:bg-neutral-500 shrink-0"></span>
                <span class="truncate">{t('menu.administrator.tree.regencyTypes')}</span>
              </A>
            </li>
            <li>
              <A href="/administrator/location/region" class="flex items-center gap-2 py-1 px-2 text-xs text-neutral-600 dark:text-neutral-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-neutral-800/60 rounded-md transition-colors font-mono">
                <span class="size-1 rounded-full bg-neutral-400 dark:bg-neutral-500 shrink-0"></span>
                <span class="truncate">{t('menu.administrator.tree.regions')}</span>
              </A>
            </li>
            <li>
              <A href="/administrator/location/sub-district" class="flex items-center gap-2 py-1 px-2 text-xs text-neutral-600 dark:text-neutral-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-neutral-800/60 rounded-md transition-colors font-mono">
                <span class="size-1 rounded-full bg-neutral-400 dark:bg-neutral-500 shrink-0"></span>
                <span class="truncate">{t('menu.administrator.tree.subDistricts')}</span>
              </A>
            </li>
            <li>
              <A href="/administrator/location/village" class="flex items-center gap-2 py-1 px-2 text-xs text-neutral-600 dark:text-neutral-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-neutral-800/60 rounded-md transition-colors font-mono">
                <span class="size-1 rounded-full bg-neutral-400 dark:bg-neutral-500 shrink-0"></span>
                <span class="truncate">{t('menu.administrator.tree.villages')}</span>
              </A>
            </li>
          </ul>
        </div>
      </details>
    </li>
    <li>
      <div class="flex items-center gap-x-2 py-1 px-2 text-xs font-mono text-neutral-400 dark:text-neutral-500">
        <span class="size-1.5 rounded-full bg-neutral-300 dark:bg-neutral-600"></span>
        <span>{t('menu.administrator.tree.payment')}</span>
      </div>
    </li>
    <li>
      <details class="group animated-details" open>
        <summary class="list-none [&::-webkit-details-marker]:hidden cursor-pointer w-full text-start flex items-center justify-between py-1.5 px-2 text-xs font-bold text-neutral-800 dark:text-neutral-200 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors font-mono">
          <div class="flex items-center gap-2 truncate">
            <svg class="size-3 text-neutral-400 group-open:rotate-90 transition-transform shrink-0" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="m9 18 6-6-6-6"/></svg>
            <span class="truncate">{t('menu.administrator.tree.person')}</span>
          </div>
        </summary>
        <div class="w-full details-anim-content">
          <ul class="pt-0.5 ps-2.5 space-y-0.5 border-s border-neutral-200 dark:border-neutral-700 ms-2.5 my-0.5">
            <li>
              <A href="/administrator/person/history" class="flex items-center gap-2 py-1 px-2 text-xs text-neutral-600 dark:text-neutral-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-neutral-800/60 rounded-md transition-colors font-mono">
                <span class="size-1 rounded-full bg-neutral-400 dark:bg-neutral-500 shrink-0"></span>
                <span class="truncate">{t('menu.administrator.tree.history')}</span>
              </A>
            </li>
            <li>
              <details class="group animated-details">
                <summary class="list-none [&::-webkit-details-marker]:hidden cursor-pointer w-full text-start flex items-center justify-between py-1 px-2 text-xs font-medium text-neutral-700 dark:text-neutral-300 rounded-md hover:bg-neutral-100 dark:hover:bg-neutral-800/80 transition-colors font-mono">
                  <div class="flex items-center gap-2 truncate">
                    <svg class="size-3 text-neutral-400 group-open:rotate-90 transition-transform shrink-0" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="m9 18 6-6-6-6"/></svg>
                    <span class="truncate">{t('menu.administrator.tree.master')}</span>
                  </div>
                </summary>
                <div class="w-full details-anim-content">
                  <ul class="pt-0.5 ps-2.5 space-y-0.5 border-s border-neutral-200 dark:border-neutral-700 ms-2.5 my-0.5">
                    <li>
                      <A href="/administrator/person/master/biodata" class="flex items-center gap-2 py-1 px-2 text-xs text-neutral-600 dark:text-neutral-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-neutral-800/60 rounded-md transition-colors font-mono">
                        <span class="size-1 rounded-full bg-neutral-400 dark:bg-neutral-500 shrink-0"></span>
                        <span class="truncate">{t('menu.administrator.tree.biodata')}</span>
                      </A>
                    </li>
                    <li>
                      <A href="/administrator/person/master/individual" class="flex items-center gap-2 py-1 px-2 text-xs text-neutral-600 dark:text-neutral-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-neutral-800/60 rounded-md transition-colors font-mono">
                        <span class="size-1 rounded-full bg-neutral-400 dark:bg-neutral-500 shrink-0"></span>
                        <span class="truncate">{t('menu.administrator.tree.individual')}</span>
                      </A>
                    </li>
                  </ul>
                </div>
              </details>
            </li>
            <li>
              <details class="group animated-details">
                <summary class="list-none [&::-webkit-details-marker]:hidden cursor-pointer w-full text-start flex items-center justify-between py-1 px-2 text-xs font-medium text-neutral-700 dark:text-neutral-300 rounded-md hover:bg-neutral-100 dark:hover:bg-neutral-800/80 transition-colors font-mono">
                  <div class="flex items-center gap-2 truncate">
                    <svg class="size-3 text-neutral-400 group-open:rotate-90 transition-transform shrink-0" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="m9 18 6-6-6-6"/></svg>
                    <span class="truncate">{t('menu.administrator.tree.reference')}</span>
                  </div>
                </summary>
                <div class="w-full details-anim-content">
                  <ul class="pt-0.5 ps-2.5 space-y-0.5 border-s border-neutral-200 dark:border-neutral-700 ms-2.5 my-0.5">
                    <li>
                      <A href="/administrator/person/reference/age-classification" class="flex items-center gap-2 py-1 px-2 text-xs text-neutral-600 dark:text-neutral-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-neutral-800/60 rounded-md transition-colors font-mono">
                        <span class="size-1 rounded-full bg-neutral-400 dark:bg-neutral-500 shrink-0"></span>
                        <span class="truncate">{t('menu.administrator.tree.ageClassification')}</span>
                      </A>
                    </li>
                    <li>
                      <A href="/administrator/person/reference/blood-type" class="flex items-center gap-2 py-1 px-2 text-xs text-neutral-600 dark:text-neutral-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-neutral-800/60 rounded-md transition-colors font-mono">
                        <span class="size-1 rounded-full bg-neutral-400 dark:bg-neutral-500 shrink-0"></span>
                        <span class="truncate">{t('menu.administrator.tree.bloodType')}</span>
                      </A>
                    </li>
                    <li>
                      <A href="/administrator/person/reference/eye-color" class="flex items-center gap-2 py-1 px-2 text-xs text-neutral-600 dark:text-neutral-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-neutral-800/60 rounded-md transition-colors font-mono">
                        <span class="size-1 rounded-full bg-neutral-400 dark:bg-neutral-500 shrink-0"></span>
                        <span class="truncate">{t('menu.administrator.tree.eyeColor')}</span>
                      </A>
                    </li>
                    <li>
                      <A href="/administrator/person/reference/gender" class="flex items-center gap-2 py-1 px-2 text-xs text-neutral-600 dark:text-neutral-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-neutral-800/60 rounded-md transition-colors font-mono">
                        <span class="size-1 rounded-full bg-neutral-400 dark:bg-neutral-500 shrink-0"></span>
                        <span class="truncate">{t('menu.administrator.tree.gender')}</span>
                      </A>
                    </li>
                    <li>
                      <A href="/administrator/person/reference/hair-color" class="flex items-center gap-2 py-1 px-2 text-xs text-neutral-600 dark:text-neutral-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-neutral-800/60 rounded-md transition-colors font-mono">
                        <span class="size-1 rounded-full bg-neutral-400 dark:bg-neutral-500 shrink-0"></span>
                        <span class="truncate">{t('menu.administrator.tree.hairColor')}</span>
                      </A>
                    </li>
                    <li>
                      <A href="/administrator/person/reference/hair-type" class="flex items-center gap-2 py-1 px-2 text-xs text-neutral-600 dark:text-neutral-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-neutral-800/60 rounded-md transition-colors font-mono">
                        <span class="size-1 rounded-full bg-neutral-400 dark:bg-neutral-500 shrink-0"></span>
                        <span class="truncate">{t('menu.administrator.tree.hairType')}</span>
                      </A>
                    </li>
                    <li>
                      <A href="/administrator/person/reference/identification-type" class="flex items-center gap-2 py-1 px-2 text-xs text-neutral-600 dark:text-neutral-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-neutral-800/60 rounded-md transition-colors font-mono">
                        <span class="size-1 rounded-full bg-neutral-400 dark:bg-neutral-500 shrink-0"></span>
                        <span class="truncate">{t('menu.administrator.tree.identificationType')}</span>
                      </A>
                    </li>
                    <li>
                      <A href="/administrator/person/reference/income" class="flex items-center gap-2 py-1 px-2 text-xs text-neutral-600 dark:text-neutral-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-neutral-800/60 rounded-md transition-colors font-mono">
                        <span class="size-1 rounded-full bg-neutral-400 dark:bg-neutral-500 shrink-0"></span>
                        <span class="truncate">{t('menu.administrator.tree.income')}</span>
                      </A>
                    </li>
                    <li>
                      <A href="/administrator/person/reference/marital-status" class="flex items-center gap-2 py-1 px-2 text-xs text-neutral-600 dark:text-neutral-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-neutral-800/60 rounded-md transition-colors font-mono">
                        <span class="size-1 rounded-full bg-neutral-400 dark:bg-neutral-500 shrink-0"></span>
                        <span class="truncate">{t('menu.administrator.tree.maritalStatus')}</span>
                      </A>
                    </li>
                    <li>
                      <A href="/administrator/person/reference/occupation" class="flex items-center gap-2 py-1 px-2 text-xs text-neutral-600 dark:text-neutral-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-neutral-800/60 rounded-md transition-colors font-mono">
                        <span class="size-1 rounded-full bg-neutral-400 dark:bg-neutral-500 shrink-0"></span>
                        <span class="truncate">{t('menu.administrator.tree.occupation')}</span>
                      </A>
                    </li>
                    <li>
                      <A href="/administrator/person/reference/profession" class="flex items-center gap-2 py-1 px-2 text-xs text-neutral-600 dark:text-neutral-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-neutral-800/60 rounded-md transition-colors font-mono">
                        <span class="size-1 rounded-full bg-neutral-400 dark:bg-neutral-500 shrink-0"></span>
                        <span class="truncate">{t('menu.administrator.tree.profession')}</span>
                      </A>
                    </li>
                    <li>
                      <A href="/administrator/person/reference/relative-type" class="flex items-center gap-2 py-1 px-2 text-xs text-neutral-600 dark:text-neutral-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-neutral-800/60 rounded-md transition-colors font-mono">
                        <span class="size-1 rounded-full bg-neutral-400 dark:bg-neutral-500 shrink-0"></span>
                        <span class="truncate">{t('menu.administrator.tree.relativeType')}</span>
                      </A>
                    </li>
                    <li>
                      <A href="/administrator/person/reference/religion" class="flex items-center gap-2 py-1 px-2 text-xs text-neutral-600 dark:text-neutral-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-neutral-800/60 rounded-md transition-colors font-mono">
                        <span class="size-1 rounded-full bg-neutral-400 dark:bg-neutral-500 shrink-0"></span>
                        <span class="truncate">{t('menu.administrator.tree.religion')}</span>
                      </A>
                    </li>
                  </ul>
                </div>
              </details>
            </li>
          </ul>
        </div>
      </details>
    </li>
                </ul>
            </div>
        </div>
    );
}
