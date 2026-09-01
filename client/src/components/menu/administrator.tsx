import { A } from '@solidjs/router';
import { t } from '../../i18n';

export default function MenuAdministrator() {
    return (
        <div class="w-full space-y-2 pb-6">
            {/* Dashboard Link */}
            <A 
                href="/dashboard/administrator" 
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
            <span class="truncate">academic</span>
          </div>
        </summary>
        <div class="w-full details-anim-content">
          <ul class="pt-0.5 ps-2.5 space-y-0.5 border-s border-neutral-200 dark:border-neutral-700 ms-2.5 my-0.5">
            <li>
              <details class="group animated-details">
                <summary class="list-none [&::-webkit-details-marker]:hidden cursor-pointer w-full text-start flex items-center justify-between py-1 px-2 text-xs font-medium text-neutral-700 dark:text-neutral-300 rounded-md hover:bg-neutral-100 dark:hover:bg-neutral-800/80 transition-colors font-mono">
                  <div class="flex items-center gap-2 truncate">
                    <svg class="size-3 text-neutral-400 group-open:rotate-90 transition-transform shrink-0" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="m9 18 6-6-6-6"/></svg>
                    <span class="truncate">campaign</span>
                  </div>
                </summary>
                <div class="w-full details-anim-content">
                  <ul class="pt-0.5 ps-2.5 space-y-0.5 border-s border-neutral-200 dark:border-neutral-700 ms-2.5 my-0.5">
                    <li>
                      <details class="group animated-details">
                        <summary class="list-none [&::-webkit-details-marker]:hidden cursor-pointer w-full text-start flex items-center justify-between py-1 px-2 text-xs font-medium text-neutral-700 dark:text-neutral-300 rounded-md hover:bg-neutral-100 dark:hover:bg-neutral-800/80 transition-colors font-mono">
                          <div class="flex items-center gap-2 truncate">
                            <svg class="size-3 text-neutral-400 group-open:rotate-90 transition-transform shrink-0" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="m9 18 6-6-6-6"/></svg>
                            <span class="truncate">reference</span>
                          </div>
                        </summary>
                        <div class="w-full details-anim-content">
                          <ul class="pt-0.5 ps-2.5 space-y-0.5 border-s border-neutral-200 dark:border-neutral-700 ms-2.5 my-0.5">
                            <li>
                              <A href="/academic/campaign/reference/attend-type" class="flex items-center gap-2 py-1 px-2 text-xs text-neutral-600 dark:text-neutral-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-neutral-800/60 rounded-md transition-colors font-mono">
                                <span class="size-1 rounded-full bg-neutral-400 dark:bg-neutral-500 shrink-0"></span>
                                <span class="truncate">attend_types</span>
                              </A>
                            </li>
                            <li>
                              <A href="/academic/campaign/reference/calendar-category" class="flex items-center gap-2 py-1 px-2 text-xs text-neutral-600 dark:text-neutral-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-neutral-800/60 rounded-md transition-colors font-mono">
                                <span class="size-1 rounded-full bg-neutral-400 dark:bg-neutral-500 shrink-0"></span>
                                <span class="truncate">calendar_categories</span>
                              </A>
                            </li>
                            <li>
                              <A href="/academic/campaign/reference/encounter-category" class="flex items-center gap-2 py-1 px-2 text-xs text-neutral-600 dark:text-neutral-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-neutral-800/60 rounded-md transition-colors font-mono">
                                <span class="size-1 rounded-full bg-neutral-400 dark:bg-neutral-500 shrink-0"></span>
                                <span class="truncate">encounter_categories</span>
                              </A>
                            </li>
                            <li>
                              <A href="/academic/campaign/reference/implementation" class="flex items-center gap-2 py-1 px-2 text-xs text-neutral-600 dark:text-neutral-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-neutral-800/60 rounded-md transition-colors font-mono">
                                <span class="size-1 rounded-full bg-neutral-400 dark:bg-neutral-500 shrink-0"></span>
                                <span class="truncate">implementations</span>
                              </A>
                            </li>
                            <li>
                              <A href="/academic/campaign/reference/scope" class="flex items-center gap-2 py-1 px-2 text-xs text-neutral-600 dark:text-neutral-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-neutral-800/60 rounded-md transition-colors font-mono">
                                <span class="size-1 rounded-full bg-neutral-400 dark:bg-neutral-500 shrink-0"></span>
                                <span class="truncate">scopes</span>
                              </A>
                            </li>
                            <li>
                              <A href="/academic/campaign/reference/substance" class="flex items-center gap-2 py-1 px-2 text-xs text-neutral-600 dark:text-neutral-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-neutral-800/60 rounded-md transition-colors font-mono">
                                <span class="size-1 rounded-full bg-neutral-400 dark:bg-neutral-500 shrink-0"></span>
                                <span class="truncate">substances</span>
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
                            <span class="truncate">transaction</span>
                          </div>
                        </summary>
                        <div class="w-full details-anim-content">
                          <ul class="pt-0.5 ps-2.5 space-y-0.5 border-s border-neutral-200 dark:border-neutral-700 ms-2.5 my-0.5">
                            <li>
                              <A href="/academic/campaign/transaction/activity" class="flex items-center gap-2 py-1 px-2 text-xs text-neutral-600 dark:text-neutral-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-neutral-800/60 rounded-md transition-colors font-mono">
                                <span class="size-1 rounded-full bg-neutral-400 dark:bg-neutral-500 shrink-0"></span>
                                <span class="truncate">activities</span>
                              </A>
                            </li>
                            <li>
                              <A href="/academic/campaign/transaction/calendar-detail" class="flex items-center gap-2 py-1 px-2 text-xs text-neutral-600 dark:text-neutral-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-neutral-800/60 rounded-md transition-colors font-mono">
                                <span class="size-1 rounded-full bg-neutral-400 dark:bg-neutral-500 shrink-0"></span>
                                <span class="truncate">calendar_details</span>
                              </A>
                            </li>
                            <li>
                              <A href="/academic/campaign/transaction/calendar" class="flex items-center gap-2 py-1 px-2 text-xs text-neutral-600 dark:text-neutral-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-neutral-800/60 rounded-md transition-colors font-mono">
                                <span class="size-1 rounded-full bg-neutral-400 dark:bg-neutral-500 shrink-0"></span>
                                <span class="truncate">calendars</span>
                              </A>
                            </li>
                            <li>
                              <A href="/academic/campaign/transaction/class-code" class="flex items-center gap-2 py-1 px-2 text-xs text-neutral-600 dark:text-neutral-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-neutral-800/60 rounded-md transition-colors font-mono">
                                <span class="size-1 rounded-full bg-neutral-400 dark:bg-neutral-500 shrink-0"></span>
                                <span class="truncate">class_codes</span>
                              </A>
                            </li>
                            <li>
                              <A href="/academic/campaign/transaction/grade" class="flex items-center gap-2 py-1 px-2 text-xs text-neutral-600 dark:text-neutral-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-neutral-800/60 rounded-md transition-colors font-mono">
                                <span class="size-1 rounded-full bg-neutral-400 dark:bg-neutral-500 shrink-0"></span>
                                <span class="truncate">grades</span>
                              </A>
                            </li>
                            <li>
                              <A href="/academic/campaign/transaction/schedule" class="flex items-center gap-2 py-1 px-2 text-xs text-neutral-600 dark:text-neutral-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-neutral-800/60 rounded-md transition-colors font-mono">
                                <span class="size-1 rounded-full bg-neutral-400 dark:bg-neutral-500 shrink-0"></span>
                                <span class="truncate">schedules</span>
                              </A>
                            </li>
                            <li>
                              <A href="/academic/campaign/transaction/teach-decree" class="flex items-center gap-2 py-1 px-2 text-xs text-neutral-600 dark:text-neutral-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-neutral-800/60 rounded-md transition-colors font-mono">
                                <span class="size-1 rounded-full bg-neutral-400 dark:bg-neutral-500 shrink-0"></span>
                                <span class="truncate">teach_decrees</span>
                              </A>
                            </li>
                            <li>
                              <A href="/academic/campaign/transaction/teach-evaluation" class="flex items-center gap-2 py-1 px-2 text-xs text-neutral-600 dark:text-neutral-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-neutral-800/60 rounded-md transition-colors font-mono">
                                <span class="size-1 rounded-full bg-neutral-400 dark:bg-neutral-500 shrink-0"></span>
                                <span class="truncate">teach_evaluations</span>
                              </A>
                            </li>
                            <li>
                              <A href="/academic/campaign/transaction/teach-lecturer" class="flex items-center gap-2 py-1 px-2 text-xs text-neutral-600 dark:text-neutral-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-neutral-800/60 rounded-md transition-colors font-mono">
                                <span class="size-1 rounded-full bg-neutral-400 dark:bg-neutral-500 shrink-0"></span>
                                <span class="truncate">teach_lecturers</span>
                              </A>
                            </li>
                            <li>
                              <A href="/academic/campaign/transaction/teach" class="flex items-center gap-2 py-1 px-2 text-xs text-neutral-600 dark:text-neutral-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-neutral-800/60 rounded-md transition-colors font-mono">
                                <span class="size-1 rounded-full bg-neutral-400 dark:bg-neutral-500 shrink-0"></span>
                                <span class="truncate">teaches</span>
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
                    <span class="truncate">candidate</span>
                  </div>
                </summary>
                <div class="w-full details-anim-content">
                  <ul class="pt-0.5 ps-2.5 space-y-0.5 border-s border-neutral-200 dark:border-neutral-700 ms-2.5 my-0.5">
                    <li>
                      <details class="group animated-details">
                        <summary class="list-none [&::-webkit-details-marker]:hidden cursor-pointer w-full text-start flex items-center justify-between py-1 px-2 text-xs font-medium text-neutral-700 dark:text-neutral-300 rounded-md hover:bg-neutral-100 dark:hover:bg-neutral-800/80 transition-colors font-mono">
                          <div class="flex items-center gap-2 truncate">
                            <svg class="size-3 text-neutral-400 group-open:rotate-90 transition-transform shrink-0" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="m9 18 6-6-6-6"/></svg>
                            <span class="truncate">master</span>
                          </div>
                        </summary>
                        <div class="w-full details-anim-content">
                          <ul class="pt-0.5 ps-2.5 space-y-0.5 border-s border-neutral-200 dark:border-neutral-700 ms-2.5 my-0.5">
                            <li>
                              <A href="/academic/candidate/master/candidate-unit" class="flex items-center gap-2 py-1 px-2 text-xs text-neutral-600 dark:text-neutral-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-neutral-800/60 rounded-md transition-colors font-mono">
                                <span class="size-1 rounded-full bg-neutral-400 dark:bg-neutral-500 shrink-0"></span>
                                <span class="truncate">candidate_unit</span>
                              </A>
                            </li>
                            <li>
                              <A href="/academic/candidate/master/candidate" class="flex items-center gap-2 py-1 px-2 text-xs text-neutral-600 dark:text-neutral-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-neutral-800/60 rounded-md transition-colors font-mono">
                                <span class="size-1 rounded-full bg-neutral-400 dark:bg-neutral-500 shrink-0"></span>
                                <span class="truncate">candidates</span>
                              </A>
                            </li>
                            <li>
                              <A href="/academic/candidate/master/exam-class" class="flex items-center gap-2 py-1 px-2 text-xs text-neutral-600 dark:text-neutral-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-neutral-800/60 rounded-md transition-colors font-mono">
                                <span class="size-1 rounded-full bg-neutral-400 dark:bg-neutral-500 shrink-0"></span>
                                <span class="truncate">exam_classes</span>
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
                            <span class="truncate">reference</span>
                          </div>
                        </summary>
                        <div class="w-full details-anim-content">
                          <ul class="pt-0.5 ps-2.5 space-y-0.5 border-s border-neutral-200 dark:border-neutral-700 ms-2.5 my-0.5">
                            <li>
                              <A href="/academic/candidate/reference/document-type" class="flex items-center gap-2 py-1 px-2 text-xs text-neutral-600 dark:text-neutral-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-neutral-800/60 rounded-md transition-colors font-mono">
                                <span class="size-1 rounded-full bg-neutral-400 dark:bg-neutral-500 shrink-0"></span>
                                <span class="truncate">document_types</span>
                              </A>
                            </li>
                            <li>
                              <A href="/academic/candidate/reference/phase" class="flex items-center gap-2 py-1 px-2 text-xs text-neutral-600 dark:text-neutral-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-neutral-800/60 rounded-md transition-colors font-mono">
                                <span class="size-1 rounded-full bg-neutral-400 dark:bg-neutral-500 shrink-0"></span>
                                <span class="truncate">phases</span>
                              </A>
                            </li>
                            <li>
                              <A href="/academic/candidate/reference/registration-category" class="flex items-center gap-2 py-1 px-2 text-xs text-neutral-600 dark:text-neutral-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-neutral-800/60 rounded-md transition-colors font-mono">
                                <span class="size-1 rounded-full bg-neutral-400 dark:bg-neutral-500 shrink-0"></span>
                                <span class="truncate">registration_categories</span>
                              </A>
                            </li>
                            <li>
                              <A href="/academic/candidate/reference/registration-type" class="flex items-center gap-2 py-1 px-2 text-xs text-neutral-600 dark:text-neutral-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-neutral-800/60 rounded-md transition-colors font-mono">
                                <span class="size-1 rounded-full bg-neutral-400 dark:bg-neutral-500 shrink-0"></span>
                                <span class="truncate">registration_types</span>
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
                            <span class="truncate">transaction</span>
                          </div>
                        </summary>
                        <div class="w-full details-anim-content">
                          <ul class="pt-0.5 ps-2.5 space-y-0.5 border-s border-neutral-200 dark:border-neutral-700 ms-2.5 my-0.5">
                            <li>
                              <A href="/academic/candidate/transaction/candidate-unit-choice" class="flex items-center gap-2 py-1 px-2 text-xs text-neutral-600 dark:text-neutral-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-neutral-800/60 rounded-md transition-colors font-mono">
                                <span class="size-1 rounded-full bg-neutral-400 dark:bg-neutral-500 shrink-0"></span>
                                <span class="truncate">candidate_unit_choices</span>
                              </A>
                            </li>
                            <li>
                              <A href="/academic/candidate/transaction/document" class="flex items-center gap-2 py-1 px-2 text-xs text-neutral-600 dark:text-neutral-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-neutral-800/60 rounded-md transition-colors font-mono">
                                <span class="size-1 rounded-full bg-neutral-400 dark:bg-neutral-500 shrink-0"></span>
                                <span class="truncate">documents</span>
                              </A>
                            </li>
                            <li>
                              <A href="/academic/candidate/transaction/exam" class="flex items-center gap-2 py-1 px-2 text-xs text-neutral-600 dark:text-neutral-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-neutral-800/60 rounded-md transition-colors font-mono">
                                <span class="size-1 rounded-full bg-neutral-400 dark:bg-neutral-500 shrink-0"></span>
                                <span class="truncate">exams</span>
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
                    <span class="truncate">course</span>
                  </div>
                </summary>
                <div class="w-full details-anim-content">
                  <ul class="pt-0.5 ps-2.5 space-y-0.5 border-s border-neutral-200 dark:border-neutral-700 ms-2.5 my-0.5">
                    <li>
                      <details class="group animated-details">
                        <summary class="list-none [&::-webkit-details-marker]:hidden cursor-pointer w-full text-start flex items-center justify-between py-1 px-2 text-xs font-medium text-neutral-700 dark:text-neutral-300 rounded-md hover:bg-neutral-100 dark:hover:bg-neutral-800/80 transition-colors font-mono">
                          <div class="flex items-center gap-2 truncate">
                            <svg class="size-3 text-neutral-400 group-open:rotate-90 transition-transform shrink-0" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="m9 18 6-6-6-6"/></svg>
                            <span class="truncate">master</span>
                          </div>
                        </summary>
                        <div class="w-full details-anim-content">
                          <ul class="pt-0.5 ps-2.5 space-y-0.5 border-s border-neutral-200 dark:border-neutral-700 ms-2.5 my-0.5">
                            <li>
                              <A href="/academic/course/master/concentration" class="flex items-center gap-2 py-1 px-2 text-xs text-neutral-600 dark:text-neutral-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-neutral-800/60 rounded-md transition-colors font-mono">
                                <span class="size-1 rounded-full bg-neutral-400 dark:bg-neutral-500 shrink-0"></span>
                                <span class="truncate">concentrations</span>
                              </A>
                            </li>
                            <li>
                              <A href="/academic/course/master/course-evaluation-planning" class="flex items-center gap-2 py-1 px-2 text-xs text-neutral-600 dark:text-neutral-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-neutral-800/60 rounded-md transition-colors font-mono">
                                <span class="size-1 rounded-full bg-neutral-400 dark:bg-neutral-500 shrink-0"></span>
                                <span class="truncate">course_evaluation_plannings</span>
                              </A>
                            </li>
                            <li>
                              <A href="/academic/course/master/course-learn-planning" class="flex items-center gap-2 py-1 px-2 text-xs text-neutral-600 dark:text-neutral-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-neutral-800/60 rounded-md transition-colors font-mono">
                                <span class="size-1 rounded-full bg-neutral-400 dark:bg-neutral-500 shrink-0"></span>
                                <span class="truncate">course_learn_plannings</span>
                              </A>
                            </li>
                            <li>
                              <A href="/academic/course/master/course" class="flex items-center gap-2 py-1 px-2 text-xs text-neutral-600 dark:text-neutral-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-neutral-800/60 rounded-md transition-colors font-mono">
                                <span class="size-1 rounded-full bg-neutral-400 dark:bg-neutral-500 shrink-0"></span>
                                <span class="truncate">courses</span>
                              </A>
                            </li>
                            <li>
                              <A href="/academic/course/master/curriculum-detail" class="flex items-center gap-2 py-1 px-2 text-xs text-neutral-600 dark:text-neutral-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-neutral-800/60 rounded-md transition-colors font-mono">
                                <span class="size-1 rounded-full bg-neutral-400 dark:bg-neutral-500 shrink-0"></span>
                                <span class="truncate">curriculum_details</span>
                              </A>
                            </li>
                            <li>
                              <A href="/academic/course/master/curriculum" class="flex items-center gap-2 py-1 px-2 text-xs text-neutral-600 dark:text-neutral-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-neutral-800/60 rounded-md transition-colors font-mono">
                                <span class="size-1 rounded-full bg-neutral-400 dark:bg-neutral-500 shrink-0"></span>
                                <span class="truncate">curriculums</span>
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
                            <span class="truncate">reference</span>
                          </div>
                        </summary>
                        <div class="w-full details-anim-content">
                          <ul class="pt-0.5 ps-2.5 space-y-0.5 border-s border-neutral-200 dark:border-neutral-700 ms-2.5 my-0.5">
                            <li>
                              <A href="/academic/course/reference/competence" class="flex items-center gap-2 py-1 px-2 text-xs text-neutral-600 dark:text-neutral-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-neutral-800/60 rounded-md transition-colors font-mono">
                                <span class="size-1 rounded-full bg-neutral-400 dark:bg-neutral-500 shrink-0"></span>
                                <span class="truncate">competences</span>
                              </A>
                            </li>
                            <li>
                              <A href="/academic/course/reference/course-evaluation-base" class="flex items-center gap-2 py-1 px-2 text-xs text-neutral-600 dark:text-neutral-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-neutral-800/60 rounded-md transition-colors font-mono">
                                <span class="size-1 rounded-full bg-neutral-400 dark:bg-neutral-500 shrink-0"></span>
                                <span class="truncate">course_evaluation_bases</span>
                              </A>
                            </li>
                            <li>
                              <A href="/academic/course/reference/curriculum-type" class="flex items-center gap-2 py-1 px-2 text-xs text-neutral-600 dark:text-neutral-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-neutral-800/60 rounded-md transition-colors font-mono">
                                <span class="size-1 rounded-full bg-neutral-400 dark:bg-neutral-500 shrink-0"></span>
                                <span class="truncate">curriculum_types</span>
                              </A>
                            </li>
                            <li>
                              <A href="/academic/course/reference/encounter-type" class="flex items-center gap-2 py-1 px-2 text-xs text-neutral-600 dark:text-neutral-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-neutral-800/60 rounded-md transition-colors font-mono">
                                <span class="size-1 rounded-full bg-neutral-400 dark:bg-neutral-500 shrink-0"></span>
                                <span class="truncate">encounter_types</span>
                              </A>
                            </li>
                            <li>
                              <A href="/academic/course/reference/evaluation-type" class="flex items-center gap-2 py-1 px-2 text-xs text-neutral-600 dark:text-neutral-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-neutral-800/60 rounded-md transition-colors font-mono">
                                <span class="size-1 rounded-full bg-neutral-400 dark:bg-neutral-500 shrink-0"></span>
                                <span class="truncate">evaluation_types</span>
                              </A>
                            </li>
                            <li>
                              <A href="/academic/course/reference/group" class="flex items-center gap-2 py-1 px-2 text-xs text-neutral-600 dark:text-neutral-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-neutral-800/60 rounded-md transition-colors font-mono">
                                <span class="size-1 rounded-full bg-neutral-400 dark:bg-neutral-500 shrink-0"></span>
                                <span class="truncate">groups</span>
                              </A>
                            </li>
                            <li>
                              <A href="/academic/course/reference/semester" class="flex items-center gap-2 py-1 px-2 text-xs text-neutral-600 dark:text-neutral-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-neutral-800/60 rounded-md transition-colors font-mono">
                                <span class="size-1 rounded-full bg-neutral-400 dark:bg-neutral-500 shrink-0"></span>
                                <span class="truncate">semesters</span>
                              </A>
                            </li>
                            <li>
                              <A href="/academic/course/reference/variety" class="flex items-center gap-2 py-1 px-2 text-xs text-neutral-600 dark:text-neutral-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-neutral-800/60 rounded-md transition-colors font-mono">
                                <span class="size-1 rounded-full bg-neutral-400 dark:bg-neutral-500 shrink-0"></span>
                                <span class="truncate">varieties</span>
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
                    <span class="truncate">general</span>
                  </div>
                </summary>
                <div class="w-full details-anim-content">
                  <ul class="pt-0.5 ps-2.5 space-y-0.5 border-s border-neutral-200 dark:border-neutral-700 ms-2.5 my-0.5">
                    <li>
                      <details class="group animated-details">
                        <summary class="list-none [&::-webkit-details-marker]:hidden cursor-pointer w-full text-start flex items-center justify-between py-1 px-2 text-xs font-medium text-neutral-700 dark:text-neutral-300 rounded-md hover:bg-neutral-100 dark:hover:bg-neutral-800/80 transition-colors font-mono">
                          <div class="flex items-center gap-2 truncate">
                            <svg class="size-3 text-neutral-400 group-open:rotate-90 transition-transform shrink-0" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="m9 18 6-6-6-6"/></svg>
                            <span class="truncate">reference</span>
                          </div>
                        </summary>
                        <div class="w-full details-anim-content">
                          <ul class="pt-0.5 ps-2.5 space-y-0.5 border-s border-neutral-200 dark:border-neutral-700 ms-2.5 my-0.5">
                            <li>
                              <A href="/academic/general/reference/academic-year-category" class="flex items-center gap-2 py-1 px-2 text-xs text-neutral-600 dark:text-neutral-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-neutral-800/60 rounded-md transition-colors font-mono">
                                <span class="size-1 rounded-full bg-neutral-400 dark:bg-neutral-500 shrink-0"></span>
                                <span class="truncate">academic_year_categories</span>
                              </A>
                            </li>
                            <li>
                              <A href="/academic/general/reference/academic-year" class="flex items-center gap-2 py-1 px-2 text-xs text-neutral-600 dark:text-neutral-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-neutral-800/60 rounded-md transition-colors font-mono">
                                <span class="size-1 rounded-full bg-neutral-400 dark:bg-neutral-500 shrink-0"></span>
                                <span class="truncate">academic_years</span>
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
                    <span class="truncate">lecturer</span>
                  </div>
                </summary>
                <div class="w-full details-anim-content">
                  <ul class="pt-0.5 ps-2.5 space-y-0.5 border-s border-neutral-200 dark:border-neutral-700 ms-2.5 my-0.5">
                    <li>
                      <details class="group animated-details">
                        <summary class="list-none [&::-webkit-details-marker]:hidden cursor-pointer w-full text-start flex items-center justify-between py-1 px-2 text-xs font-medium text-neutral-700 dark:text-neutral-300 rounded-md hover:bg-neutral-100 dark:hover:bg-neutral-800/80 transition-colors font-mono">
                          <div class="flex items-center gap-2 truncate">
                            <svg class="size-3 text-neutral-400 group-open:rotate-90 transition-transform shrink-0" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="m9 18 6-6-6-6"/></svg>
                            <span class="truncate">master</span>
                          </div>
                        </summary>
                        <div class="w-full details-anim-content">
                          <ul class="pt-0.5 ps-2.5 space-y-0.5 border-s border-neutral-200 dark:border-neutral-700 ms-2.5 my-0.5">
                            <li>
                              <A href="/academic/lecturer/master/lecturer" class="flex items-center gap-2 py-1 px-2 text-xs text-neutral-600 dark:text-neutral-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-neutral-800/60 rounded-md transition-colors font-mono">
                                <span class="size-1 rounded-full bg-neutral-400 dark:bg-neutral-500 shrink-0"></span>
                                <span class="truncate">lecturers</span>
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
                            <span class="truncate">reference</span>
                          </div>
                        </summary>
                        <div class="w-full details-anim-content">
                          <ul class="pt-0.5 ps-2.5 space-y-0.5 border-s border-neutral-200 dark:border-neutral-700 ms-2.5 my-0.5">
                            <li>
                              <A href="/academic/lecturer/reference/contract" class="flex items-center gap-2 py-1 px-2 text-xs text-neutral-600 dark:text-neutral-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-neutral-800/60 rounded-md transition-colors font-mono">
                                <span class="size-1 rounded-full bg-neutral-400 dark:bg-neutral-500 shrink-0"></span>
                                <span class="truncate">contracts</span>
                              </A>
                            </li>
                            <li>
                              <A href="/academic/lecturer/reference/group" class="flex items-center gap-2 py-1 px-2 text-xs text-neutral-600 dark:text-neutral-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-neutral-800/60 rounded-md transition-colors font-mono">
                                <span class="size-1 rounded-full bg-neutral-400 dark:bg-neutral-500 shrink-0"></span>
                                <span class="truncate">groups</span>
                              </A>
                            </li>
                            <li>
                              <A href="/academic/lecturer/reference/rank" class="flex items-center gap-2 py-1 px-2 text-xs text-neutral-600 dark:text-neutral-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-neutral-800/60 rounded-md transition-colors font-mono">
                                <span class="size-1 rounded-full bg-neutral-400 dark:bg-neutral-500 shrink-0"></span>
                                <span class="truncate">ranks</span>
                              </A>
                            </li>
                            <li>
                              <A href="/academic/lecturer/reference/status" class="flex items-center gap-2 py-1 px-2 text-xs text-neutral-600 dark:text-neutral-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-neutral-800/60 rounded-md transition-colors font-mono">
                                <span class="size-1 rounded-full bg-neutral-400 dark:bg-neutral-500 shrink-0"></span>
                                <span class="truncate">statuses</span>
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
                            <span class="truncate">transaction</span>
                          </div>
                        </summary>
                        <div class="w-full details-anim-content">
                          <ul class="pt-0.5 ps-2.5 space-y-0.5 border-s border-neutral-200 dark:border-neutral-700 ms-2.5 my-0.5">
                            <li>
                              <A href="/academic/lecturer/transaction/academic-group" class="flex items-center gap-2 py-1 px-2 text-xs text-neutral-600 dark:text-neutral-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-neutral-800/60 rounded-md transition-colors font-mono">
                                <span class="size-1 rounded-full bg-neutral-400 dark:bg-neutral-500 shrink-0"></span>
                                <span class="truncate">academic_groups</span>
                              </A>
                            </li>
                            <li>
                              <A href="/academic/lecturer/transaction/academic-rank" class="flex items-center gap-2 py-1 px-2 text-xs text-neutral-600 dark:text-neutral-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-neutral-800/60 rounded-md transition-colors font-mono">
                                <span class="size-1 rounded-full bg-neutral-400 dark:bg-neutral-500 shrink-0"></span>
                                <span class="truncate">academic_ranks</span>
                              </A>
                            </li>
                            <li>
                              <A href="/academic/lecturer/transaction/homebase" class="flex items-center gap-2 py-1 px-2 text-xs text-neutral-600 dark:text-neutral-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-neutral-800/60 rounded-md transition-colors font-mono">
                                <span class="size-1 rounded-full bg-neutral-400 dark:bg-neutral-500 shrink-0"></span>
                                <span class="truncate">homebases</span>
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
                    <span class="truncate">prior_learning_recognition</span>
                  </div>
                </summary>
                <div class="w-full details-anim-content">
                  <ul class="pt-0.5 ps-2.5 space-y-0.5 border-s border-neutral-200 dark:border-neutral-700 ms-2.5 my-0.5">
                    <li>
                      <details class="group animated-details">
                        <summary class="list-none [&::-webkit-details-marker]:hidden cursor-pointer w-full text-start flex items-center justify-between py-1 px-2 text-xs font-medium text-neutral-700 dark:text-neutral-300 rounded-md hover:bg-neutral-100 dark:hover:bg-neutral-800/80 transition-colors font-mono">
                          <div class="flex items-center gap-2 truncate">
                            <svg class="size-3 text-neutral-400 group-open:rotate-90 transition-transform shrink-0" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="m9 18 6-6-6-6"/></svg>
                            <span class="truncate">reference</span>
                          </div>
                        </summary>
                        <div class="w-full details-anim-content">
                          <ul class="pt-0.5 ps-2.5 space-y-0.5 border-s border-neutral-200 dark:border-neutral-700 ms-2.5 my-0.5">
                            <li>
                              <A href="/academic/prior-learning-recognition/reference/evaluator-type" class="flex items-center gap-2 py-1 px-2 text-xs text-neutral-600 dark:text-neutral-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-neutral-800/60 rounded-md transition-colors font-mono">
                                <span class="size-1 rounded-full bg-neutral-400 dark:bg-neutral-500 shrink-0"></span>
                                <span class="truncate">evaluator_types</span>
                              </A>
                            </li>
                            <li>
                              <A href="/academic/prior-learning-recognition/reference/evidence-category" class="flex items-center gap-2 py-1 px-2 text-xs text-neutral-600 dark:text-neutral-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-neutral-800/60 rounded-md transition-colors font-mono">
                                <span class="size-1 rounded-full bg-neutral-400 dark:bg-neutral-500 shrink-0"></span>
                                <span class="truncate">evidence_categories</span>
                              </A>
                            </li>
                            <li>
                              <A href="/academic/prior-learning-recognition/reference/evidence-type" class="flex items-center gap-2 py-1 px-2 text-xs text-neutral-600 dark:text-neutral-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-neutral-800/60 rounded-md transition-colors font-mono">
                                <span class="size-1 rounded-full bg-neutral-400 dark:bg-neutral-500 shrink-0"></span>
                                <span class="truncate">evidence_types</span>
                              </A>
                            </li>
                            <li>
                              <A href="/academic/prior-learning-recognition/reference/professionalism" class="flex items-center gap-2 py-1 px-2 text-xs text-neutral-600 dark:text-neutral-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-neutral-800/60 rounded-md transition-colors font-mono">
                                <span class="size-1 rounded-full bg-neutral-400 dark:bg-neutral-500 shrink-0"></span>
                                <span class="truncate">professionalisms</span>
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
                            <span class="truncate">transaction</span>
                          </div>
                        </summary>
                        <div class="w-full details-anim-content">
                          <ul class="pt-0.5 ps-2.5 space-y-0.5 border-s border-neutral-200 dark:border-neutral-700 ms-2.5 my-0.5">
                            <li>
                              <A href="/academic/prior-learning-recognition/transaction/decree" class="flex items-center gap-2 py-1 px-2 text-xs text-neutral-600 dark:text-neutral-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-neutral-800/60 rounded-md transition-colors font-mono">
                                <span class="size-1 rounded-full bg-neutral-400 dark:bg-neutral-500 shrink-0"></span>
                                <span class="truncate">decrees</span>
                              </A>
                            </li>
                            <li>
                              <A href="/academic/prior-learning-recognition/transaction/evaluation-detail" class="flex items-center gap-2 py-1 px-2 text-xs text-neutral-600 dark:text-neutral-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-neutral-800/60 rounded-md transition-colors font-mono">
                                <span class="size-1 rounded-full bg-neutral-400 dark:bg-neutral-500 shrink-0"></span>
                                <span class="truncate">evaluation_details</span>
                              </A>
                            </li>
                            <li>
                              <A href="/academic/prior-learning-recognition/transaction/evaluation" class="flex items-center gap-2 py-1 px-2 text-xs text-neutral-600 dark:text-neutral-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-neutral-800/60 rounded-md transition-colors font-mono">
                                <span class="size-1 rounded-full bg-neutral-400 dark:bg-neutral-500 shrink-0"></span>
                                <span class="truncate">evaluations</span>
                              </A>
                            </li>
                            <li>
                              <A href="/academic/prior-learning-recognition/transaction/evaluator" class="flex items-center gap-2 py-1 px-2 text-xs text-neutral-600 dark:text-neutral-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-neutral-800/60 rounded-md transition-colors font-mono">
                                <span class="size-1 rounded-full bg-neutral-400 dark:bg-neutral-500 shrink-0"></span>
                                <span class="truncate">evaluators</span>
                              </A>
                            </li>
                            <li>
                              <A href="/academic/prior-learning-recognition/transaction/recognition" class="flex items-center gap-2 py-1 px-2 text-xs text-neutral-600 dark:text-neutral-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-neutral-800/60 rounded-md transition-colors font-mono">
                                <span class="size-1 rounded-full bg-neutral-400 dark:bg-neutral-500 shrink-0"></span>
                                <span class="truncate">recognitions</span>
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
                    <span class="truncate">student</span>
                  </div>
                </summary>
                <div class="w-full details-anim-content">
                  <ul class="pt-0.5 ps-2.5 space-y-0.5 border-s border-neutral-200 dark:border-neutral-700 ms-2.5 my-0.5">
                    <li>
                      <details class="group animated-details">
                        <summary class="list-none [&::-webkit-details-marker]:hidden cursor-pointer w-full text-start flex items-center justify-between py-1 px-2 text-xs font-medium text-neutral-700 dark:text-neutral-300 rounded-md hover:bg-neutral-100 dark:hover:bg-neutral-800/80 transition-colors font-mono">
                          <div class="flex items-center gap-2 truncate">
                            <svg class="size-3 text-neutral-400 group-open:rotate-90 transition-transform shrink-0" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="m9 18 6-6-6-6"/></svg>
                            <span class="truncate">adviser</span>
                          </div>
                        </summary>
                        <div class="w-full details-anim-content">
                          <ul class="pt-0.5 ps-2.5 space-y-0.5 border-s border-neutral-200 dark:border-neutral-700 ms-2.5 my-0.5">
                            <li>
                              <A href="/academic/student/adviser/counsellor" class="flex items-center gap-2 py-1 px-2 text-xs text-neutral-600 dark:text-neutral-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-neutral-800/60 rounded-md transition-colors font-mono">
                                <span class="size-1 rounded-full bg-neutral-400 dark:bg-neutral-500 shrink-0"></span>
                                <span class="truncate">counsellors</span>
                              </A>
                            </li>
                            <li>
                              <A href="/academic/student/adviser/decree" class="flex items-center gap-2 py-1 px-2 text-xs text-neutral-600 dark:text-neutral-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-neutral-800/60 rounded-md transition-colors font-mono">
                                <span class="size-1 rounded-full bg-neutral-400 dark:bg-neutral-500 shrink-0"></span>
                                <span class="truncate">decrees</span>
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
                            <span class="truncate">campaign</span>
                          </div>
                        </summary>
                        <div class="w-full details-anim-content">
                          <ul class="pt-0.5 ps-2.5 space-y-0.5 border-s border-neutral-200 dark:border-neutral-700 ms-2.5 my-0.5">
                            <li>
                              <A href="/academic/student/campaign/convertion" class="flex items-center gap-2 py-1 px-2 text-xs text-neutral-600 dark:text-neutral-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-neutral-800/60 rounded-md transition-colors font-mono">
                                <span class="size-1 rounded-full bg-neutral-400 dark:bg-neutral-500 shrink-0"></span>
                                <span class="truncate">convertions</span>
                              </A>
                            </li>
                            <li>
                              <A href="/academic/student/campaign/detail-activity" class="flex items-center gap-2 py-1 px-2 text-xs text-neutral-600 dark:text-neutral-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-neutral-800/60 rounded-md transition-colors font-mono">
                                <span class="size-1 rounded-full bg-neutral-400 dark:bg-neutral-500 shrink-0"></span>
                                <span class="truncate">detail_activities</span>
                              </A>
                            </li>
                            <li>
                              <A href="/academic/student/campaign/detail-activity-evaluation-component" class="flex items-center gap-2 py-1 px-2 text-xs text-neutral-600 dark:text-neutral-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-neutral-800/60 rounded-md transition-colors font-mono">
                                <span class="size-1 rounded-full bg-neutral-400 dark:bg-neutral-500 shrink-0"></span>
                                <span class="truncate">detail_activity_evaluation_components</span>
                              </A>
                            </li>
                            <li>
                              <A href="/academic/student/campaign/student-activity" class="flex items-center gap-2 py-1 px-2 text-xs text-neutral-600 dark:text-neutral-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-neutral-800/60 rounded-md transition-colors font-mono">
                                <span class="size-1 rounded-full bg-neutral-400 dark:bg-neutral-500 shrink-0"></span>
                                <span class="truncate">student_activities</span>
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
                            <span class="truncate">final_assignment</span>
                          </div>
                        </summary>
                        <div class="w-full details-anim-content">
                          <ul class="pt-0.5 ps-2.5 space-y-0.5 border-s border-neutral-200 dark:border-neutral-700 ms-2.5 my-0.5">
                            <li>
                              <details class="group animated-details">
                                <summary class="list-none [&::-webkit-details-marker]:hidden cursor-pointer w-full text-start flex items-center justify-between py-1 px-2 text-xs font-medium text-neutral-700 dark:text-neutral-300 rounded-md hover:bg-neutral-100 dark:hover:bg-neutral-800/80 transition-colors font-mono">
                                  <div class="flex items-center gap-2 truncate">
                                    <svg class="size-3 text-neutral-400 group-open:rotate-90 transition-transform shrink-0" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="m9 18 6-6-6-6"/></svg>
                                    <span class="truncate">reference</span>
                                  </div>
                                </summary>
                                <div class="w-full details-anim-content">
                                  <ul class="pt-0.5 ps-2.5 space-y-0.5 border-s border-neutral-200 dark:border-neutral-700 ms-2.5 my-0.5">
                                    <li>
                                      <A href="/academic/student/final-assignment/reference/adviser-category" class="flex items-center gap-2 py-1 px-2 text-xs text-neutral-600 dark:text-neutral-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-neutral-800/60 rounded-md transition-colors font-mono">
                                        <span class="size-1 rounded-full bg-neutral-400 dark:bg-neutral-500 shrink-0"></span>
                                        <span class="truncate">adviser_categories</span>
                                      </A>
                                    </li>
                                    <li>
                                      <A href="/academic/student/final-assignment/reference/approval-type" class="flex items-center gap-2 py-1 px-2 text-xs text-neutral-600 dark:text-neutral-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-neutral-800/60 rounded-md transition-colors font-mono">
                                        <span class="size-1 rounded-full bg-neutral-400 dark:bg-neutral-500 shrink-0"></span>
                                        <span class="truncate">approval_types</span>
                                      </A>
                                    </li>
                                    <li>
                                      <A href="/academic/student/final-assignment/reference/category" class="flex items-center gap-2 py-1 px-2 text-xs text-neutral-600 dark:text-neutral-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-neutral-800/60 rounded-md transition-colors font-mono">
                                        <span class="size-1 rounded-full bg-neutral-400 dark:bg-neutral-500 shrink-0"></span>
                                        <span class="truncate">categories</span>
                                      </A>
                                    </li>
                                    <li>
                                      <A href="/academic/student/final-assignment/reference/requirement" class="flex items-center gap-2 py-1 px-2 text-xs text-neutral-600 dark:text-neutral-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-neutral-800/60 rounded-md transition-colors font-mono">
                                        <span class="size-1 rounded-full bg-neutral-400 dark:bg-neutral-500 shrink-0"></span>
                                        <span class="truncate">requirements</span>
                                      </A>
                                    </li>
                                    <li>
                                      <A href="/academic/student/final-assignment/reference/stage" class="flex items-center gap-2 py-1 px-2 text-xs text-neutral-600 dark:text-neutral-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-neutral-800/60 rounded-md transition-colors font-mono">
                                        <span class="size-1 rounded-full bg-neutral-400 dark:bg-neutral-500 shrink-0"></span>
                                        <span class="truncate">stages</span>
                                      </A>
                                    </li>
                                    <li>
                                      <A href="/academic/student/final-assignment/reference/variety" class="flex items-center gap-2 py-1 px-2 text-xs text-neutral-600 dark:text-neutral-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-neutral-800/60 rounded-md transition-colors font-mono">
                                        <span class="size-1 rounded-full bg-neutral-400 dark:bg-neutral-500 shrink-0"></span>
                                        <span class="truncate">varieties</span>
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
                                    <span class="truncate">transaction</span>
                                  </div>
                                </summary>
                                <div class="w-full details-anim-content">
                                  <ul class="pt-0.5 ps-2.5 space-y-0.5 border-s border-neutral-200 dark:border-neutral-700 ms-2.5 my-0.5">
                                    <li>
                                      <A href="/academic/student/final-assignment/transaction/adviser" class="flex items-center gap-2 py-1 px-2 text-xs text-neutral-600 dark:text-neutral-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-neutral-800/60 rounded-md transition-colors font-mono">
                                        <span class="size-1 rounded-full bg-neutral-400 dark:bg-neutral-500 shrink-0"></span>
                                        <span class="truncate">advisers</span>
                                      </A>
                                    </li>
                                    <li>
                                      <A href="/academic/student/final-assignment/transaction/evaluation-detail" class="flex items-center gap-2 py-1 px-2 text-xs text-neutral-600 dark:text-neutral-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-neutral-800/60 rounded-md transition-colors font-mono">
                                        <span class="size-1 rounded-full bg-neutral-400 dark:bg-neutral-500 shrink-0"></span>
                                        <span class="truncate">evaluation_details</span>
                                      </A>
                                    </li>
                                    <li>
                                      <A href="/academic/student/final-assignment/transaction/evaluation-summary" class="flex items-center gap-2 py-1 px-2 text-xs text-neutral-600 dark:text-neutral-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-neutral-800/60 rounded-md transition-colors font-mono">
                                        <span class="size-1 rounded-full bg-neutral-400 dark:bg-neutral-500 shrink-0"></span>
                                        <span class="truncate">evaluation_summaries</span>
                                      </A>
                                    </li>
                                    <li>
                                      <A href="/academic/student/final-assignment/transaction/final-assignment-decree" class="flex items-center gap-2 py-1 px-2 text-xs text-neutral-600 dark:text-neutral-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-neutral-800/60 rounded-md transition-colors font-mono">
                                        <span class="size-1 rounded-full bg-neutral-400 dark:bg-neutral-500 shrink-0"></span>
                                        <span class="truncate">final_assignment_decrees</span>
                                      </A>
                                    </li>
                                    <li>
                                      <A href="/academic/student/final-assignment/transaction/prerequisite" class="flex items-center gap-2 py-1 px-2 text-xs text-neutral-600 dark:text-neutral-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-neutral-800/60 rounded-md transition-colors font-mono">
                                        <span class="size-1 rounded-full bg-neutral-400 dark:bg-neutral-500 shrink-0"></span>
                                        <span class="truncate">prerequisites</span>
                                      </A>
                                    </li>
                                    <li>
                                      <A href="/academic/student/final-assignment/transaction/schedule" class="flex items-center gap-2 py-1 px-2 text-xs text-neutral-600 dark:text-neutral-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-neutral-800/60 rounded-md transition-colors font-mono">
                                        <span class="size-1 rounded-full bg-neutral-400 dark:bg-neutral-500 shrink-0"></span>
                                        <span class="truncate">schedules</span>
                                      </A>
                                    </li>
                                    <li>
                                      <A href="/academic/student/final-assignment/transaction/submission" class="flex items-center gap-2 py-1 px-2 text-xs text-neutral-600 dark:text-neutral-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-neutral-800/60 rounded-md transition-colors font-mono">
                                        <span class="size-1 rounded-full bg-neutral-400 dark:bg-neutral-500 shrink-0"></span>
                                        <span class="truncate">submissions</span>
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
                            <span class="truncate">master</span>
                          </div>
                        </summary>
                        <div class="w-full details-anim-content">
                          <ul class="pt-0.5 ps-2.5 space-y-0.5 border-s border-neutral-200 dark:border-neutral-700 ms-2.5 my-0.5">
                            <li>
                              <A href="/academic/student/master/image" class="flex items-center gap-2 py-1 px-2 text-xs text-neutral-600 dark:text-neutral-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-neutral-800/60 rounded-md transition-colors font-mono">
                                <span class="size-1 rounded-full bg-neutral-400 dark:bg-neutral-500 shrink-0"></span>
                                <span class="truncate">images</span>
                              </A>
                            </li>
                            <li>
                              <A href="/academic/student/master/student" class="flex items-center gap-2 py-1 px-2 text-xs text-neutral-600 dark:text-neutral-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-neutral-800/60 rounded-md transition-colors font-mono">
                                <span class="size-1 rounded-full bg-neutral-400 dark:bg-neutral-500 shrink-0"></span>
                                <span class="truncate">students</span>
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
                            <span class="truncate">reference</span>
                          </div>
                        </summary>
                        <div class="w-full details-anim-content">
                          <ul class="pt-0.5 ps-2.5 space-y-0.5 border-s border-neutral-200 dark:border-neutral-700 ms-2.5 my-0.5">
                            <li>
                              <A href="/academic/student/reference/finance" class="flex items-center gap-2 py-1 px-2 text-xs text-neutral-600 dark:text-neutral-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-neutral-800/60 rounded-md transition-colors font-mono">
                                <span class="size-1 rounded-full bg-neutral-400 dark:bg-neutral-500 shrink-0"></span>
                                <span class="truncate">finances</span>
                              </A>
                            </li>
                            <li>
                              <A href="/academic/student/reference/registration" class="flex items-center gap-2 py-1 px-2 text-xs text-neutral-600 dark:text-neutral-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-neutral-800/60 rounded-md transition-colors font-mono">
                                <span class="size-1 rounded-full bg-neutral-400 dark:bg-neutral-500 shrink-0"></span>
                                <span class="truncate">registrations</span>
                              </A>
                            </li>
                            <li>
                              <A href="/academic/student/reference/resign-status" class="flex items-center gap-2 py-1 px-2 text-xs text-neutral-600 dark:text-neutral-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-neutral-800/60 rounded-md transition-colors font-mono">
                                <span class="size-1 rounded-full bg-neutral-400 dark:bg-neutral-500 shrink-0"></span>
                                <span class="truncate">resign_statuses</span>
                              </A>
                            </li>
                            <li>
                              <A href="/academic/student/reference/selection-type" class="flex items-center gap-2 py-1 px-2 text-xs text-neutral-600 dark:text-neutral-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-neutral-800/60 rounded-md transition-colors font-mono">
                                <span class="size-1 rounded-full bg-neutral-400 dark:bg-neutral-500 shrink-0"></span>
                                <span class="truncate">selection_types</span>
                              </A>
                            </li>
                            <li>
                              <A href="/academic/student/reference/status" class="flex items-center gap-2 py-1 px-2 text-xs text-neutral-600 dark:text-neutral-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-neutral-800/60 rounded-md transition-colors font-mono">
                                <span class="size-1 rounded-full bg-neutral-400 dark:bg-neutral-500 shrink-0"></span>
                                <span class="truncate">statuses</span>
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
                    <span class="truncate">survey</span>
                  </div>
                </summary>
                <div class="w-full details-anim-content">
                  <ul class="pt-0.5 ps-2.5 space-y-0.5 border-s border-neutral-200 dark:border-neutral-700 ms-2.5 my-0.5">
                    <li>
                      <details class="group animated-details">
                        <summary class="list-none [&::-webkit-details-marker]:hidden cursor-pointer w-full text-start flex items-center justify-between py-1 px-2 text-xs font-medium text-neutral-700 dark:text-neutral-300 rounded-md hover:bg-neutral-100 dark:hover:bg-neutral-800/80 transition-colors font-mono">
                          <div class="flex items-center gap-2 truncate">
                            <svg class="size-3 text-neutral-400 group-open:rotate-90 transition-transform shrink-0" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="m9 18 6-6-6-6"/></svg>
                            <span class="truncate">master</span>
                          </div>
                        </summary>
                        <div class="w-full details-anim-content">
                          <ul class="pt-0.5 ps-2.5 space-y-0.5 border-s border-neutral-200 dark:border-neutral-700 ms-2.5 my-0.5">
                            <li>
                              <A href="/academic/survey/master/answer" class="flex items-center gap-2 py-1 px-2 text-xs text-neutral-600 dark:text-neutral-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-neutral-800/60 rounded-md transition-colors font-mono">
                                <span class="size-1 rounded-full bg-neutral-400 dark:bg-neutral-500 shrink-0"></span>
                                <span class="truncate">answers</span>
                              </A>
                            </li>
                            <li>
                              <A href="/academic/survey/master/bundle-question" class="flex items-center gap-2 py-1 px-2 text-xs text-neutral-600 dark:text-neutral-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-neutral-800/60 rounded-md transition-colors font-mono">
                                <span class="size-1 rounded-full bg-neutral-400 dark:bg-neutral-500 shrink-0"></span>
                                <span class="truncate">bundle_question</span>
                              </A>
                            </li>
                            <li>
                              <A href="/academic/survey/master/bundle" class="flex items-center gap-2 py-1 px-2 text-xs text-neutral-600 dark:text-neutral-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-neutral-800/60 rounded-md transition-colors font-mono">
                                <span class="size-1 rounded-full bg-neutral-400 dark:bg-neutral-500 shrink-0"></span>
                                <span class="truncate">bundles</span>
                              </A>
                            </li>
                            <li>
                              <A href="/academic/survey/master/question" class="flex items-center gap-2 py-1 px-2 text-xs text-neutral-600 dark:text-neutral-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-neutral-800/60 rounded-md transition-colors font-mono">
                                <span class="size-1 rounded-full bg-neutral-400 dark:bg-neutral-500 shrink-0"></span>
                                <span class="truncate">questions</span>
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
                            <span class="truncate">reference</span>
                          </div>
                        </summary>
                        <div class="w-full details-anim-content">
                          <ul class="pt-0.5 ps-2.5 space-y-0.5 border-s border-neutral-200 dark:border-neutral-700 ms-2.5 my-0.5">
                            <li>
                              <A href="/academic/survey/reference/bundle-category" class="flex items-center gap-2 py-1 px-2 text-xs text-neutral-600 dark:text-neutral-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-neutral-800/60 rounded-md transition-colors font-mono">
                                <span class="size-1 rounded-full bg-neutral-400 dark:bg-neutral-500 shrink-0"></span>
                                <span class="truncate">bundle_categories</span>
                              </A>
                            </li>
                            <li>
                              <A href="/academic/survey/reference/question-variety" class="flex items-center gap-2 py-1 px-2 text-xs text-neutral-600 dark:text-neutral-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-neutral-800/60 rounded-md transition-colors font-mono">
                                <span class="size-1 rounded-full bg-neutral-400 dark:bg-neutral-500 shrink-0"></span>
                                <span class="truncate">question_varieties</span>
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
                            <span class="truncate">transaction</span>
                          </div>
                        </summary>
                        <div class="w-full details-anim-content">
                          <ul class="pt-0.5 ps-2.5 space-y-0.5 border-s border-neutral-200 dark:border-neutral-700 ms-2.5 my-0.5">
                            <li>
                              <A href="/academic/survey/transaction/conduct" class="flex items-center gap-2 py-1 px-2 text-xs text-neutral-600 dark:text-neutral-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-neutral-800/60 rounded-md transition-colors font-mono">
                                <span class="size-1 rounded-full bg-neutral-400 dark:bg-neutral-500 shrink-0"></span>
                                <span class="truncate">conducts</span>
                              </A>
                            </li>
                            <li>
                              <A href="/academic/survey/transaction/respond" class="flex items-center gap-2 py-1 px-2 text-xs text-neutral-600 dark:text-neutral-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-neutral-800/60 rounded-md transition-colors font-mono">
                                <span class="size-1 rounded-full bg-neutral-400 dark:bg-neutral-500 shrink-0"></span>
                                <span class="truncate">responds</span>
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
            <span class="truncate">auth</span>
          </div>
        </summary>
        <div class="w-full details-anim-content">
          <ul class="pt-0.5 ps-2.5 space-y-0.5 border-s border-neutral-200 dark:border-neutral-700 ms-2.5 my-0.5">
            <li>
              <A href="/auth/permission" class="flex items-center gap-2 py-1 px-2 text-xs text-neutral-600 dark:text-neutral-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-neutral-800/60 rounded-md transition-colors font-mono">
                <span class="size-1 rounded-full bg-neutral-400 dark:bg-neutral-500 shrink-0"></span>
                <span class="truncate">permission</span>
              </A>
            </li>
            <li>
              <A href="/auth/permission-role" class="flex items-center gap-2 py-1 px-2 text-xs text-neutral-600 dark:text-neutral-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-neutral-800/60 rounded-md transition-colors font-mono">
                <span class="size-1 rounded-full bg-neutral-400 dark:bg-neutral-500 shrink-0"></span>
                <span class="truncate">permission_role</span>
              </A>
            </li>
            <li>
              <A href="/auth/role" class="flex items-center gap-2 py-1 px-2 text-xs text-neutral-600 dark:text-neutral-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-neutral-800/60 rounded-md transition-colors font-mono">
                <span class="size-1 rounded-full bg-neutral-400 dark:bg-neutral-500 shrink-0"></span>
                <span class="truncate">role</span>
              </A>
            </li>
            <li>
              <A href="/auth/user" class="flex items-center gap-2 py-1 px-2 text-xs text-neutral-600 dark:text-neutral-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-neutral-800/60 rounded-md transition-colors font-mono">
                <span class="size-1 rounded-full bg-neutral-400 dark:bg-neutral-500 shrink-0"></span>
                <span class="truncate">user</span>
              </A>
            </li>
            <li>
              <A href="/auth/verification" class="flex items-center gap-2 py-1 px-2 text-xs text-neutral-600 dark:text-neutral-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-neutral-800/60 rounded-md transition-colors font-mono">
                <span class="size-1 rounded-full bg-neutral-400 dark:bg-neutral-500 shrink-0"></span>
                <span class="truncate">verification</span>
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
            <span class="truncate">building</span>
          </div>
        </summary>
        <div class="w-full details-anim-content">
          <ul class="pt-0.5 ps-2.5 space-y-0.5 border-s border-neutral-200 dark:border-neutral-700 ms-2.5 my-0.5">
            <li>
              <details class="group animated-details">
                <summary class="list-none [&::-webkit-details-marker]:hidden cursor-pointer w-full text-start flex items-center justify-between py-1 px-2 text-xs font-medium text-neutral-700 dark:text-neutral-300 rounded-md hover:bg-neutral-100 dark:hover:bg-neutral-800/80 transition-colors font-mono">
                  <div class="flex items-center gap-2 truncate">
                    <svg class="size-3 text-neutral-400 group-open:rotate-90 transition-transform shrink-0" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="m9 18 6-6-6-6"/></svg>
                    <span class="truncate">master</span>
                  </div>
                </summary>
                <div class="w-full details-anim-content">
                  <ul class="pt-0.5 ps-2.5 space-y-0.5 border-s border-neutral-200 dark:border-neutral-700 ms-2.5 my-0.5">
                    <li>
                      <A href="/building/master/building" class="flex items-center gap-2 py-1 px-2 text-xs text-neutral-600 dark:text-neutral-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-neutral-800/60 rounded-md transition-colors font-mono">
                        <span class="size-1 rounded-full bg-neutral-400 dark:bg-neutral-500 shrink-0"></span>
                        <span class="truncate">buildings</span>
                      </A>
                    </li>
                    <li>
                      <A href="/building/master/room" class="flex items-center gap-2 py-1 px-2 text-xs text-neutral-600 dark:text-neutral-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-neutral-800/60 rounded-md transition-colors font-mono">
                        <span class="size-1 rounded-full bg-neutral-400 dark:bg-neutral-500 shrink-0"></span>
                        <span class="truncate">rooms</span>
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
                    <span class="truncate">reference</span>
                  </div>
                </summary>
                <div class="w-full details-anim-content">
                  <ul class="pt-0.5 ps-2.5 space-y-0.5 border-s border-neutral-200 dark:border-neutral-700 ms-2.5 my-0.5">
                    <li>
                      <A href="/building/reference/category" class="flex items-center gap-2 py-1 px-2 text-xs text-neutral-600 dark:text-neutral-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-neutral-800/60 rounded-md transition-colors font-mono">
                        <span class="size-1 rounded-full bg-neutral-400 dark:bg-neutral-500 shrink-0"></span>
                        <span class="truncate">categories</span>
                      </A>
                    </li>
                    <li>
                      <A href="/building/reference/condition" class="flex items-center gap-2 py-1 px-2 text-xs text-neutral-600 dark:text-neutral-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-neutral-800/60 rounded-md transition-colors font-mono">
                        <span class="size-1 rounded-full bg-neutral-400 dark:bg-neutral-500 shrink-0"></span>
                        <span class="truncate">conditions</span>
                      </A>
                    </li>
                    <li>
                      <A href="/building/reference/room-type" class="flex items-center gap-2 py-1 px-2 text-xs text-neutral-600 dark:text-neutral-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-neutral-800/60 rounded-md transition-colors font-mono">
                        <span class="size-1 rounded-full bg-neutral-400 dark:bg-neutral-500 shrink-0"></span>
                        <span class="truncate">room_types</span>
                      </A>
                    </li>
                    <li>
                      <A href="/building/reference/variety" class="flex items-center gap-2 py-1 px-2 text-xs text-neutral-600 dark:text-neutral-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-neutral-800/60 rounded-md transition-colors font-mono">
                        <span class="size-1 rounded-full bg-neutral-400 dark:bg-neutral-500 shrink-0"></span>
                        <span class="truncate">varieties</span>
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
        <span>burn</span>
      </div>
    </li>
    <li>
      <div class="flex items-center gap-x-2 py-1 px-2 text-xs font-mono text-neutral-400 dark:text-neutral-500">
        <span class="size-1.5 rounded-full bg-neutral-300 dark:bg-neutral-600"></span>
        <span>chart</span>
      </div>
    </li>
    <li>
      <details class="group animated-details">
        <summary class="list-none [&::-webkit-details-marker]:hidden cursor-pointer w-full text-start flex items-center justify-between py-1.5 px-2 text-xs font-bold text-neutral-800 dark:text-neutral-200 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors font-mono">
          <div class="flex items-center gap-2 truncate">
            <svg class="size-3 text-neutral-400 group-open:rotate-90 transition-transform shrink-0" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="m9 18 6-6-6-6"/></svg>
            <span class="truncate">contact</span>
          </div>
        </summary>
        <div class="w-full details-anim-content">
          <ul class="pt-0.5 ps-2.5 space-y-0.5 border-s border-neutral-200 dark:border-neutral-700 ms-2.5 my-0.5">
            <li>
              <details class="group animated-details">
                <summary class="list-none [&::-webkit-details-marker]:hidden cursor-pointer w-full text-start flex items-center justify-between py-1 px-2 text-xs font-medium text-neutral-700 dark:text-neutral-300 rounded-md hover:bg-neutral-100 dark:hover:bg-neutral-800/80 transition-colors font-mono">
                  <div class="flex items-center gap-2 truncate">
                    <svg class="size-3 text-neutral-400 group-open:rotate-90 transition-transform shrink-0" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="m9 18 6-6-6-6"/></svg>
                    <span class="truncate">master</span>
                  </div>
                </summary>
                <div class="w-full details-anim-content">
                  <ul class="pt-0.5 ps-2.5 space-y-0.5 border-s border-neutral-200 dark:border-neutral-700 ms-2.5 my-0.5">
                    <li>
                      <A href="/contact/master/electronic-mail" class="flex items-center gap-2 py-1 px-2 text-xs text-neutral-600 dark:text-neutral-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-neutral-800/60 rounded-md transition-colors font-mono">
                        <span class="size-1 rounded-full bg-neutral-400 dark:bg-neutral-500 shrink-0"></span>
                        <span class="truncate">electronic_mails</span>
                      </A>
                    </li>
                    <li>
                      <A href="/contact/master/phone" class="flex items-center gap-2 py-1 px-2 text-xs text-neutral-600 dark:text-neutral-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-neutral-800/60 rounded-md transition-colors font-mono">
                        <span class="size-1 rounded-full bg-neutral-400 dark:bg-neutral-500 shrink-0"></span>
                        <span class="truncate">phones</span>
                      </A>
                    </li>
                    <li>
                      <A href="/contact/master/residence" class="flex items-center gap-2 py-1 px-2 text-xs text-neutral-600 dark:text-neutral-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-neutral-800/60 rounded-md transition-colors font-mono">
                        <span class="size-1 rounded-full bg-neutral-400 dark:bg-neutral-500 shrink-0"></span>
                        <span class="truncate">residences</span>
                      </A>
                    </li>
                    <li>
                      <A href="/contact/master/website" class="flex items-center gap-2 py-1 px-2 text-xs text-neutral-600 dark:text-neutral-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-neutral-800/60 rounded-md transition-colors font-mono">
                        <span class="size-1 rounded-full bg-neutral-400 dark:bg-neutral-500 shrink-0"></span>
                        <span class="truncate">websites</span>
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
                    <span class="truncate">reference</span>
                  </div>
                </summary>
                <div class="w-full details-anim-content">
                  <ul class="pt-0.5 ps-2.5 space-y-0.5 border-s border-neutral-200 dark:border-neutral-700 ms-2.5 my-0.5">
                    <li>
                      <A href="/contact/reference/electronic-mail-type" class="flex items-center gap-2 py-1 px-2 text-xs text-neutral-600 dark:text-neutral-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-neutral-800/60 rounded-md transition-colors font-mono">
                        <span class="size-1 rounded-full bg-neutral-400 dark:bg-neutral-500 shrink-0"></span>
                        <span class="truncate">electronic_mail_types</span>
                      </A>
                    </li>
                    <li>
                      <A href="/contact/reference/phone-type" class="flex items-center gap-2 py-1 px-2 text-xs text-neutral-600 dark:text-neutral-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-neutral-800/60 rounded-md transition-colors font-mono">
                        <span class="size-1 rounded-full bg-neutral-400 dark:bg-neutral-500 shrink-0"></span>
                        <span class="truncate">phone_types</span>
                      </A>
                    </li>
                    <li>
                      <A href="/contact/reference/residence-type" class="flex items-center gap-2 py-1 px-2 text-xs text-neutral-600 dark:text-neutral-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-neutral-800/60 rounded-md transition-colors font-mono">
                        <span class="size-1 rounded-full bg-neutral-400 dark:bg-neutral-500 shrink-0"></span>
                        <span class="truncate">residence_types</span>
                      </A>
                    </li>
                    <li>
                      <A href="/contact/reference/website-type" class="flex items-center gap-2 py-1 px-2 text-xs text-neutral-600 dark:text-neutral-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-neutral-800/60 rounded-md transition-colors font-mono">
                        <span class="size-1 rounded-full bg-neutral-400 dark:bg-neutral-500 shrink-0"></span>
                        <span class="truncate">website_types</span>
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
            <span class="truncate">document</span>
          </div>
        </summary>
        <div class="w-full details-anim-content">
          <ul class="pt-0.5 ps-2.5 space-y-0.5 border-s border-neutral-200 dark:border-neutral-700 ms-2.5 my-0.5">
            <li>
              <details class="group animated-details">
                <summary class="list-none [&::-webkit-details-marker]:hidden cursor-pointer w-full text-start flex items-center justify-between py-1 px-2 text-xs font-medium text-neutral-700 dark:text-neutral-300 rounded-md hover:bg-neutral-100 dark:hover:bg-neutral-800/80 transition-colors font-mono">
                  <div class="flex items-center gap-2 truncate">
                    <svg class="size-3 text-neutral-400 group-open:rotate-90 transition-transform shrink-0" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="m9 18 6-6-6-6"/></svg>
                    <span class="truncate">reference</span>
                  </div>
                </summary>
                <div class="w-full details-anim-content">
                  <ul class="pt-0.5 ps-2.5 space-y-0.5 border-s border-neutral-200 dark:border-neutral-700 ms-2.5 my-0.5">
                    <li>
                      <A href="/document/reference/archive-type" class="flex items-center gap-2 py-1 px-2 text-xs text-neutral-600 dark:text-neutral-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-neutral-800/60 rounded-md transition-colors font-mono">
                        <span class="size-1 rounded-full bg-neutral-400 dark:bg-neutral-500 shrink-0"></span>
                        <span class="truncate">archive_types</span>
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
                    <span class="truncate">transaction</span>
                  </div>
                </summary>
                <div class="w-full details-anim-content">
                  <ul class="pt-0.5 ps-2.5 space-y-0.5 border-s border-neutral-200 dark:border-neutral-700 ms-2.5 my-0.5">
                    <li>
                      <A href="/document/transaction/archive" class="flex items-center gap-2 py-1 px-2 text-xs text-neutral-600 dark:text-neutral-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-neutral-800/60 rounded-md transition-colors font-mono">
                        <span class="size-1 rounded-full bg-neutral-400 dark:bg-neutral-500 shrink-0"></span>
                        <span class="truncate">archives</span>
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
            <span class="truncate">feeder</span>
          </div>
        </summary>
        <div class="w-full details-anim-content">
          <ul class="pt-0.5 ps-2.5 space-y-0.5 border-s border-neutral-200 dark:border-neutral-700 ms-2.5 my-0.5">
            <li>
              <details class="group animated-details">
                <summary class="list-none [&::-webkit-details-marker]:hidden cursor-pointer w-full text-start flex items-center justify-between py-1 px-2 text-xs font-medium text-neutral-700 dark:text-neutral-300 rounded-md hover:bg-neutral-100 dark:hover:bg-neutral-800/80 transition-colors font-mono">
                  <div class="flex items-center gap-2 truncate">
                    <svg class="size-3 text-neutral-400 group-open:rotate-90 transition-transform shrink-0" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="m9 18 6-6-6-6"/></svg>
                    <span class="truncate">akumulasi</span>
                  </div>
                </summary>
                <div class="w-full details-anim-content">
                  <ul class="pt-0.5 ps-2.5 space-y-0.5 border-s border-neutral-200 dark:border-neutral-700 ms-2.5 my-0.5">
                    <li>
                      <A href="/feeder/akumulasi/estimasi" class="flex items-center gap-2 py-1 px-2 text-xs text-neutral-600 dark:text-neutral-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-neutral-800/60 rounded-md transition-colors font-mono">
                        <span class="size-1 rounded-full bg-neutral-400 dark:bg-neutral-500 shrink-0"></span>
                        <span class="truncate">estimasi</span>
                      </A>
                    </li>
                    <li>
                      <A href="/feeder/akumulasi/jumlah-data" class="flex items-center gap-2 py-1 px-2 text-xs text-neutral-600 dark:text-neutral-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-neutral-800/60 rounded-md transition-colors font-mono">
                        <span class="size-1 rounded-full bg-neutral-400 dark:bg-neutral-500 shrink-0"></span>
                        <span class="truncate">jumlah_data</span>
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
                    <span class="truncate">akun</span>
                  </div>
                </summary>
                <div class="w-full details-anim-content">
                  <ul class="pt-0.5 ps-2.5 space-y-0.5 border-s border-neutral-200 dark:border-neutral-700 ms-2.5 my-0.5">
                    <li>
                      <A href="/feeder/akun/kredential" class="flex items-center gap-2 py-1 px-2 text-xs text-neutral-600 dark:text-neutral-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-neutral-800/60 rounded-md transition-colors font-mono">
                        <span class="size-1 rounded-full bg-neutral-400 dark:bg-neutral-500 shrink-0"></span>
                        <span class="truncate">kredential</span>
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
                    <span class="truncate">master</span>
                  </div>
                </summary>
                <div class="w-full details-anim-content">
                  <ul class="pt-0.5 ps-2.5 space-y-0.5 border-s border-neutral-200 dark:border-neutral-700 ms-2.5 my-0.5">
                    <li>
                      <A href="/feeder/master/aktifitas-kuliah-mahasiswa" class="flex items-center gap-2 py-1 px-2 text-xs text-neutral-600 dark:text-neutral-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-neutral-800/60 rounded-md transition-colors font-mono">
                        <span class="size-1 rounded-full bg-neutral-400 dark:bg-neutral-500 shrink-0"></span>
                        <span class="truncate">aktifitas_kuliah_mahasiswa</span>
                      </A>
                    </li>
                    <li>
                      <A href="/feeder/master/aktifitas-mahasiswa" class="flex items-center gap-2 py-1 px-2 text-xs text-neutral-600 dark:text-neutral-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-neutral-800/60 rounded-md transition-colors font-mono">
                        <span class="size-1 rounded-full bg-neutral-400 dark:bg-neutral-500 shrink-0"></span>
                        <span class="truncate">aktifitas_mahasiswa</span>
                      </A>
                    </li>
                    <li>
                      <A href="/feeder/master/aktifitas-mengajar-dosen" class="flex items-center gap-2 py-1 px-2 text-xs text-neutral-600 dark:text-neutral-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-neutral-800/60 rounded-md transition-colors font-mono">
                        <span class="size-1 rounded-full bg-neutral-400 dark:bg-neutral-500 shrink-0"></span>
                        <span class="truncate">aktifitas_mengajar_dosen</span>
                      </A>
                    </li>
                    <li>
                      <A href="/feeder/master/anggota-aktifitas-mahasiswa" class="flex items-center gap-2 py-1 px-2 text-xs text-neutral-600 dark:text-neutral-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-neutral-800/60 rounded-md transition-colors font-mono">
                        <span class="size-1 rounded-full bg-neutral-400 dark:bg-neutral-500 shrink-0"></span>
                        <span class="truncate">anggota_aktifitas_mahasiswa</span>
                      </A>
                    </li>
                    <li>
                      <A href="/feeder/master/bidang-minat-perguruan-tinggi" class="flex items-center gap-2 py-1 px-2 text-xs text-neutral-600 dark:text-neutral-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-neutral-800/60 rounded-md transition-colors font-mono">
                        <span class="size-1 rounded-full bg-neutral-400 dark:bg-neutral-500 shrink-0"></span>
                        <span class="truncate">bidang_minat_perguruan_tinggi</span>
                      </A>
                    </li>
                    <li>
                      <A href="/feeder/master/bimbing-mahasiswa" class="flex items-center gap-2 py-1 px-2 text-xs text-neutral-600 dark:text-neutral-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-neutral-800/60 rounded-md transition-colors font-mono">
                        <span class="size-1 rounded-full bg-neutral-400 dark:bg-neutral-500 shrink-0"></span>
                        <span class="truncate">bimbing_mahasiswa</span>
                      </A>
                    </li>
                    <li>
                      <A href="/feeder/master/biodata-dosen" class="flex items-center gap-2 py-1 px-2 text-xs text-neutral-600 dark:text-neutral-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-neutral-800/60 rounded-md transition-colors font-mono">
                        <span class="size-1 rounded-full bg-neutral-400 dark:bg-neutral-500 shrink-0"></span>
                        <span class="truncate">biodata_dosen</span>
                      </A>
                    </li>
                    <li>
                      <A href="/feeder/master/biodata-mahasiswa" class="flex items-center gap-2 py-1 px-2 text-xs text-neutral-600 dark:text-neutral-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-neutral-800/60 rounded-md transition-colors font-mono">
                        <span class="size-1 rounded-full bg-neutral-400 dark:bg-neutral-500 shrink-0"></span>
                        <span class="truncate">biodata_mahasiswa</span>
                      </A>
                    </li>
                    <li>
                      <A href="/feeder/master/detail-nilai-perkuliahan-kelas" class="flex items-center gap-2 py-1 px-2 text-xs text-neutral-600 dark:text-neutral-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-neutral-800/60 rounded-md transition-colors font-mono">
                        <span class="size-1 rounded-full bg-neutral-400 dark:bg-neutral-500 shrink-0"></span>
                        <span class="truncate">detail_nilai_perkuliahan_kelas</span>
                      </A>
                    </li>
                    <li>
                      <A href="/feeder/master/dosen" class="flex items-center gap-2 py-1 px-2 text-xs text-neutral-600 dark:text-neutral-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-neutral-800/60 rounded-md transition-colors font-mono">
                        <span class="size-1 rounded-full bg-neutral-400 dark:bg-neutral-500 shrink-0"></span>
                        <span class="truncate">dosen</span>
                      </A>
                    </li>
                    <li>
                      <A href="/feeder/master/dosen-pembimbing" class="flex items-center gap-2 py-1 px-2 text-xs text-neutral-600 dark:text-neutral-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-neutral-800/60 rounded-md transition-colors font-mono">
                        <span class="size-1 rounded-full bg-neutral-400 dark:bg-neutral-500 shrink-0"></span>
                        <span class="truncate">dosen_pembimbing</span>
                      </A>
                    </li>
                    <li>
                      <A href="/feeder/master/dosen-pengajar-kelas-kuliah" class="flex items-center gap-2 py-1 px-2 text-xs text-neutral-600 dark:text-neutral-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-neutral-800/60 rounded-md transition-colors font-mono">
                        <span class="size-1 rounded-full bg-neutral-400 dark:bg-neutral-500 shrink-0"></span>
                        <span class="truncate">dosen_pengajar_kelas_kuliah</span>
                      </A>
                    </li>
                    <li>
                      <A href="/feeder/master/fakultas" class="flex items-center gap-2 py-1 px-2 text-xs text-neutral-600 dark:text-neutral-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-neutral-800/60 rounded-md transition-colors font-mono">
                        <span class="size-1 rounded-full bg-neutral-400 dark:bg-neutral-500 shrink-0"></span>
                        <span class="truncate">fakultas</span>
                      </A>
                    </li>
                    <li>
                      <A href="/feeder/master/hitung-transkrip-angkatan-mahasiswa" class="flex items-center gap-2 py-1 px-2 text-xs text-neutral-600 dark:text-neutral-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-neutral-800/60 rounded-md transition-colors font-mono">
                        <span class="size-1 rounded-full bg-neutral-400 dark:bg-neutral-500 shrink-0"></span>
                        <span class="truncate">hitung_transkrip_angkatan_mahasiswa</span>
                      </A>
                    </li>
                    <li>
                      <A href="/feeder/master/kartu-rencana-studi-mahasiswa" class="flex items-center gap-2 py-1 px-2 text-xs text-neutral-600 dark:text-neutral-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-neutral-800/60 rounded-md transition-colors font-mono">
                        <span class="size-1 rounded-full bg-neutral-400 dark:bg-neutral-500 shrink-0"></span>
                        <span class="truncate">kartu_rencana_studi_mahasiswa</span>
                      </A>
                    </li>
                    <li>
                      <A href="/feeder/master/kelas-kuliah" class="flex items-center gap-2 py-1 px-2 text-xs text-neutral-600 dark:text-neutral-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-neutral-800/60 rounded-md transition-colors font-mono">
                        <span class="size-1 rounded-full bg-neutral-400 dark:bg-neutral-500 shrink-0"></span>
                        <span class="truncate">kelas_kuliah</span>
                      </A>
                    </li>
                    <li>
                      <A href="/feeder/master/komponen-evaluasi-kelas" class="flex items-center gap-2 py-1 px-2 text-xs text-neutral-600 dark:text-neutral-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-neutral-800/60 rounded-md transition-colors font-mono">
                        <span class="size-1 rounded-full bg-neutral-400 dark:bg-neutral-500 shrink-0"></span>
                        <span class="truncate">komponen_evaluasi_kelas</span>
                      </A>
                    </li>
                    <li>
                      <A href="/feeder/master/konsistensi-data" class="flex items-center gap-2 py-1 px-2 text-xs text-neutral-600 dark:text-neutral-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-neutral-800/60 rounded-md transition-colors font-mono">
                        <span class="size-1 rounded-full bg-neutral-400 dark:bg-neutral-500 shrink-0"></span>
                        <span class="truncate">konsistensi_data</span>
                      </A>
                    </li>
                    <li>
                      <A href="/feeder/master/konversi-kampus-merdeka" class="flex items-center gap-2 py-1 px-2 text-xs text-neutral-600 dark:text-neutral-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-neutral-800/60 rounded-md transition-colors font-mono">
                        <span class="size-1 rounded-full bg-neutral-400 dark:bg-neutral-500 shrink-0"></span>
                        <span class="truncate">konversi_kampus_merdeka</span>
                      </A>
                    </li>
                    <li>
                      <A href="/feeder/master/kurikulum" class="flex items-center gap-2 py-1 px-2 text-xs text-neutral-600 dark:text-neutral-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-neutral-800/60 rounded-md transition-colors font-mono">
                        <span class="size-1 rounded-full bg-neutral-400 dark:bg-neutral-500 shrink-0"></span>
                        <span class="truncate">kurikulum</span>
                      </A>
                    </li>
                    <li>
                      <A href="/feeder/master/mahasiswa" class="flex items-center gap-2 py-1 px-2 text-xs text-neutral-600 dark:text-neutral-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-neutral-800/60 rounded-md transition-colors font-mono">
                        <span class="size-1 rounded-full bg-neutral-400 dark:bg-neutral-500 shrink-0"></span>
                        <span class="truncate">mahasiswa</span>
                      </A>
                    </li>
                    <li>
                      <A href="/feeder/master/mahasiswa-bimbingan-dosen" class="flex items-center gap-2 py-1 px-2 text-xs text-neutral-600 dark:text-neutral-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-neutral-800/60 rounded-md transition-colors font-mono">
                        <span class="size-1 rounded-full bg-neutral-400 dark:bg-neutral-500 shrink-0"></span>
                        <span class="truncate">mahasiswa_bimbingan_dosen</span>
                      </A>
                    </li>
                    <li>
                      <A href="/feeder/master/mahasiswa-lulusan-dropout" class="flex items-center gap-2 py-1 px-2 text-xs text-neutral-600 dark:text-neutral-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-neutral-800/60 rounded-md transition-colors font-mono">
                        <span class="size-1 rounded-full bg-neutral-400 dark:bg-neutral-500 shrink-0"></span>
                        <span class="truncate">mahasiswa_lulusan_dropout</span>
                      </A>
                    </li>
                    <li>
                      <A href="/feeder/master/matakuliah" class="flex items-center gap-2 py-1 px-2 text-xs text-neutral-600 dark:text-neutral-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-neutral-800/60 rounded-md transition-colors font-mono">
                        <span class="size-1 rounded-full bg-neutral-400 dark:bg-neutral-500 shrink-0"></span>
                        <span class="truncate">matakuliah</span>
                      </A>
                    </li>
                    <li>
                      <A href="/feeder/master/matakuliah-kurikulum" class="flex items-center gap-2 py-1 px-2 text-xs text-neutral-600 dark:text-neutral-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-neutral-800/60 rounded-md transition-colors font-mono">
                        <span class="size-1 rounded-full bg-neutral-400 dark:bg-neutral-500 shrink-0"></span>
                        <span class="truncate">matakuliah_kurikulum</span>
                      </A>
                    </li>
                    <li>
                      <A href="/feeder/master/nilai-perkuliahan-kelas" class="flex items-center gap-2 py-1 px-2 text-xs text-neutral-600 dark:text-neutral-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-neutral-800/60 rounded-md transition-colors font-mono">
                        <span class="size-1 rounded-full bg-neutral-400 dark:bg-neutral-500 shrink-0"></span>
                        <span class="truncate">nilai_perkuliahan_kelas</span>
                      </A>
                    </li>
                    <li>
                      <A href="/feeder/master/nilai-transfer-pendidikan-mahasiswa" class="flex items-center gap-2 py-1 px-2 text-xs text-neutral-600 dark:text-neutral-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-neutral-800/60 rounded-md transition-colors font-mono">
                        <span class="size-1 rounded-full bg-neutral-400 dark:bg-neutral-500 shrink-0"></span>
                        <span class="truncate">nilai_transfer_pendidikan_mahasiswa</span>
                      </A>
                    </li>
                    <li>
                      <A href="/feeder/master/penugasan-dosen" class="flex items-center gap-2 py-1 px-2 text-xs text-neutral-600 dark:text-neutral-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-neutral-800/60 rounded-md transition-colors font-mono">
                        <span class="size-1 rounded-full bg-neutral-400 dark:bg-neutral-500 shrink-0"></span>
                        <span class="truncate">penugasan_dosen</span>
                      </A>
                    </li>
                    <li>
                      <A href="/feeder/master/perguruan-tinggi" class="flex items-center gap-2 py-1 px-2 text-xs text-neutral-600 dark:text-neutral-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-neutral-800/60 rounded-md transition-colors font-mono">
                        <span class="size-1 rounded-full bg-neutral-400 dark:bg-neutral-500 shrink-0"></span>
                        <span class="truncate">perguruan_tinggi</span>
                      </A>
                    </li>
                    <li>
                      <A href="/feeder/master/periode-aktif" class="flex items-center gap-2 py-1 px-2 text-xs text-neutral-600 dark:text-neutral-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-neutral-800/60 rounded-md transition-colors font-mono">
                        <span class="size-1 rounded-full bg-neutral-400 dark:bg-neutral-500 shrink-0"></span>
                        <span class="truncate">periode_aktif</span>
                      </A>
                    </li>
                    <li>
                      <A href="/feeder/master/periode-perkuliahan" class="flex items-center gap-2 py-1 px-2 text-xs text-neutral-600 dark:text-neutral-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-neutral-800/60 rounded-md transition-colors font-mono">
                        <span class="size-1 rounded-full bg-neutral-400 dark:bg-neutral-500 shrink-0"></span>
                        <span class="truncate">periode_perkuliahan</span>
                      </A>
                    </li>
                    <li>
                      <A href="/feeder/master/perkuliahan-mahasiswa" class="flex items-center gap-2 py-1 px-2 text-xs text-neutral-600 dark:text-neutral-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-neutral-800/60 rounded-md transition-colors font-mono">
                        <span class="size-1 rounded-full bg-neutral-400 dark:bg-neutral-500 shrink-0"></span>
                        <span class="truncate">perkuliahan_mahasiswa</span>
                      </A>
                    </li>
                    <li>
                      <A href="/feeder/master/peserta-kelas-kuliah" class="flex items-center gap-2 py-1 px-2 text-xs text-neutral-600 dark:text-neutral-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-neutral-800/60 rounded-md transition-colors font-mono">
                        <span class="size-1 rounded-full bg-neutral-400 dark:bg-neutral-500 shrink-0"></span>
                        <span class="truncate">peserta_kelas_kuliah</span>
                      </A>
                    </li>
                    <li>
                      <A href="/feeder/master/prestasi-mahasiswa" class="flex items-center gap-2 py-1 px-2 text-xs text-neutral-600 dark:text-neutral-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-neutral-800/60 rounded-md transition-colors font-mono">
                        <span class="size-1 rounded-full bg-neutral-400 dark:bg-neutral-500 shrink-0"></span>
                        <span class="truncate">prestasi_mahasiswa</span>
                      </A>
                    </li>
                    <li>
                      <A href="/feeder/master/profil-perguruan-tinggi" class="flex items-center gap-2 py-1 px-2 text-xs text-neutral-600 dark:text-neutral-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-neutral-800/60 rounded-md transition-colors font-mono">
                        <span class="size-1 rounded-full bg-neutral-400 dark:bg-neutral-500 shrink-0"></span>
                        <span class="truncate">profil_perguruan_tinggi</span>
                      </A>
                    </li>
                    <li>
                      <A href="/feeder/master/program-studi" class="flex items-center gap-2 py-1 px-2 text-xs text-neutral-600 dark:text-neutral-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-neutral-800/60 rounded-md transition-colors font-mono">
                        <span class="size-1 rounded-full bg-neutral-400 dark:bg-neutral-500 shrink-0"></span>
                        <span class="truncate">program_studi</span>
                      </A>
                    </li>
                    <li>
                      <A href="/feeder/master/rencana-evaluasi" class="flex items-center gap-2 py-1 px-2 text-xs text-neutral-600 dark:text-neutral-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-neutral-800/60 rounded-md transition-colors font-mono">
                        <span class="size-1 rounded-full bg-neutral-400 dark:bg-neutral-500 shrink-0"></span>
                        <span class="truncate">rencana_evaluasi</span>
                      </A>
                    </li>
                    <li>
                      <A href="/feeder/master/rencana-pembelajaran" class="flex items-center gap-2 py-1 px-2 text-xs text-neutral-600 dark:text-neutral-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-neutral-800/60 rounded-md transition-colors font-mono">
                        <span class="size-1 rounded-full bg-neutral-400 dark:bg-neutral-500 shrink-0"></span>
                        <span class="truncate">rencana_pembelajaran</span>
                      </A>
                    </li>
                    <li>
                      <A href="/feeder/master/riwayat-fungsional-dosen" class="flex items-center gap-2 py-1 px-2 text-xs text-neutral-600 dark:text-neutral-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-neutral-800/60 rounded-md transition-colors font-mono">
                        <span class="size-1 rounded-full bg-neutral-400 dark:bg-neutral-500 shrink-0"></span>
                        <span class="truncate">riwayat_fungsional_dosen</span>
                      </A>
                    </li>
                    <li>
                      <A href="/feeder/master/riwayat-nilai-mahasiswa" class="flex items-center gap-2 py-1 px-2 text-xs text-neutral-600 dark:text-neutral-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-neutral-800/60 rounded-md transition-colors font-mono">
                        <span class="size-1 rounded-full bg-neutral-400 dark:bg-neutral-500 shrink-0"></span>
                        <span class="truncate">riwayat_nilai_mahasiswa</span>
                      </A>
                    </li>
                    <li>
                      <A href="/feeder/master/riwayat-pangkat-dosen" class="flex items-center gap-2 py-1 px-2 text-xs text-neutral-600 dark:text-neutral-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-neutral-800/60 rounded-md transition-colors font-mono">
                        <span class="size-1 rounded-full bg-neutral-400 dark:bg-neutral-500 shrink-0"></span>
                        <span class="truncate">riwayat_pangkat_dosen</span>
                      </A>
                    </li>
                    <li>
                      <A href="/feeder/master/riwayat-pendidikan-dosen" class="flex items-center gap-2 py-1 px-2 text-xs text-neutral-600 dark:text-neutral-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-neutral-800/60 rounded-md transition-colors font-mono">
                        <span class="size-1 rounded-full bg-neutral-400 dark:bg-neutral-500 shrink-0"></span>
                        <span class="truncate">riwayat_pendidikan_dosen</span>
                      </A>
                    </li>
                    <li>
                      <A href="/feeder/master/riwayat-pendidikan-mahasiswa" class="flex items-center gap-2 py-1 px-2 text-xs text-neutral-600 dark:text-neutral-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-neutral-800/60 rounded-md transition-colors font-mono">
                        <span class="size-1 rounded-full bg-neutral-400 dark:bg-neutral-500 shrink-0"></span>
                        <span class="truncate">riwayat_pendidikan_mahasiswa</span>
                      </A>
                    </li>
                    <li>
                      <A href="/feeder/master/riwayat-penelitian-dosen" class="flex items-center gap-2 py-1 px-2 text-xs text-neutral-600 dark:text-neutral-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-neutral-800/60 rounded-md transition-colors font-mono">
                        <span class="size-1 rounded-full bg-neutral-400 dark:bg-neutral-500 shrink-0"></span>
                        <span class="truncate">riwayat_penelitian_dosen</span>
                      </A>
                    </li>
                    <li>
                      <A href="/feeder/master/riwayat-sertifikasi-dosen" class="flex items-center gap-2 py-1 px-2 text-xs text-neutral-600 dark:text-neutral-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-neutral-800/60 rounded-md transition-colors font-mono">
                        <span class="size-1 rounded-full bg-neutral-400 dark:bg-neutral-500 shrink-0"></span>
                        <span class="truncate">riwayat_sertifikasi_dosen</span>
                      </A>
                    </li>
                    <li>
                      <A href="/feeder/master/skala-nilai-program-studi" class="flex items-center gap-2 py-1 px-2 text-xs text-neutral-600 dark:text-neutral-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-neutral-800/60 rounded-md transition-colors font-mono">
                        <span class="size-1 rounded-full bg-neutral-400 dark:bg-neutral-500 shrink-0"></span>
                        <span class="truncate">skala_nilai_program_studi</span>
                      </A>
                    </li>
                    <li>
                      <A href="/feeder/master/substansi-matakuliah" class="flex items-center gap-2 py-1 px-2 text-xs text-neutral-600 dark:text-neutral-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-neutral-800/60 rounded-md transition-colors font-mono">
                        <span class="size-1 rounded-full bg-neutral-400 dark:bg-neutral-500 shrink-0"></span>
                        <span class="truncate">substansi_matakuliah</span>
                      </A>
                    </li>
                    <li>
                      <A href="/feeder/master/transkrip-mahasiswa" class="flex items-center gap-2 py-1 px-2 text-xs text-neutral-600 dark:text-neutral-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-neutral-800/60 rounded-md transition-colors font-mono">
                        <span class="size-1 rounded-full bg-neutral-400 dark:bg-neutral-500 shrink-0"></span>
                        <span class="truncate">transkrip_mahasiswa</span>
                      </A>
                    </li>
                    <li>
                      <A href="/feeder/master/uji-mahasiswa" class="flex items-center gap-2 py-1 px-2 text-xs text-neutral-600 dark:text-neutral-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-neutral-800/60 rounded-md transition-colors font-mono">
                        <span class="size-1 rounded-full bg-neutral-400 dark:bg-neutral-500 shrink-0"></span>
                        <span class="truncate">uji_mahasiswa</span>
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
                    <span class="truncate">referensi</span>
                  </div>
                </summary>
                <div class="w-full details-anim-content">
                  <ul class="pt-0.5 ps-2.5 space-y-0.5 border-s border-neutral-200 dark:border-neutral-700 ms-2.5 my-0.5">
                    <li>
                      <A href="/feeder/referensi/agama" class="flex items-center gap-2 py-1 px-2 text-xs text-neutral-600 dark:text-neutral-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-neutral-800/60 rounded-md transition-colors font-mono">
                        <span class="size-1 rounded-full bg-neutral-400 dark:bg-neutral-500 shrink-0"></span>
                        <span class="truncate">agama</span>
                      </A>
                    </li>
                    <li>
                      <A href="/feeder/referensi/alat-transportasi" class="flex items-center gap-2 py-1 px-2 text-xs text-neutral-600 dark:text-neutral-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-neutral-800/60 rounded-md transition-colors font-mono">
                        <span class="size-1 rounded-full bg-neutral-400 dark:bg-neutral-500 shrink-0"></span>
                        <span class="truncate">alat_transportasi</span>
                      </A>
                    </li>
                    <li>
                      <A href="/feeder/referensi/bentuk-pendidikan" class="flex items-center gap-2 py-1 px-2 text-xs text-neutral-600 dark:text-neutral-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-neutral-800/60 rounded-md transition-colors font-mono">
                        <span class="size-1 rounded-full bg-neutral-400 dark:bg-neutral-500 shrink-0"></span>
                        <span class="truncate">bentuk_pendidikan</span>
                      </A>
                    </li>
                    <li>
                      <A href="/feeder/referensi/ikatan-kerja-sumber-daya-manusia" class="flex items-center gap-2 py-1 px-2 text-xs text-neutral-600 dark:text-neutral-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-neutral-800/60 rounded-md transition-colors font-mono">
                        <span class="size-1 rounded-full bg-neutral-400 dark:bg-neutral-500 shrink-0"></span>
                        <span class="truncate">ikatan_kerja_sumber_daya_manusia</span>
                      </A>
                    </li>
                    <li>
                      <A href="/feeder/referensi/jabatan-fungsional" class="flex items-center gap-2 py-1 px-2 text-xs text-neutral-600 dark:text-neutral-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-neutral-800/60 rounded-md transition-colors font-mono">
                        <span class="size-1 rounded-full bg-neutral-400 dark:bg-neutral-500 shrink-0"></span>
                        <span class="truncate">jabatan_fungsional</span>
                      </A>
                    </li>
                    <li>
                      <A href="/feeder/referensi/jalur-masuk" class="flex items-center gap-2 py-1 px-2 text-xs text-neutral-600 dark:text-neutral-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-neutral-800/60 rounded-md transition-colors font-mono">
                        <span class="size-1 rounded-full bg-neutral-400 dark:bg-neutral-500 shrink-0"></span>
                        <span class="truncate">jalur_masuk</span>
                      </A>
                    </li>
                    <li>
                      <A href="/feeder/referensi/jenis-aktifitas-mahasiswa" class="flex items-center gap-2 py-1 px-2 text-xs text-neutral-600 dark:text-neutral-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-neutral-800/60 rounded-md transition-colors font-mono">
                        <span class="size-1 rounded-full bg-neutral-400 dark:bg-neutral-500 shrink-0"></span>
                        <span class="truncate">jenis_aktifitas_mahasiswa</span>
                      </A>
                    </li>
                    <li>
                      <A href="/feeder/referensi/jenis-evaluasi" class="flex items-center gap-2 py-1 px-2 text-xs text-neutral-600 dark:text-neutral-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-neutral-800/60 rounded-md transition-colors font-mono">
                        <span class="size-1 rounded-full bg-neutral-400 dark:bg-neutral-500 shrink-0"></span>
                        <span class="truncate">jenis_evaluasi</span>
                      </A>
                    </li>
                    <li>
                      <A href="/feeder/referensi/jenis-keluar" class="flex items-center gap-2 py-1 px-2 text-xs text-neutral-600 dark:text-neutral-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-neutral-800/60 rounded-md transition-colors font-mono">
                        <span class="size-1 rounded-full bg-neutral-400 dark:bg-neutral-500 shrink-0"></span>
                        <span class="truncate">jenis_keluar</span>
                      </A>
                    </li>
                    <li>
                      <A href="/feeder/referensi/jenis-pendaftaran" class="flex items-center gap-2 py-1 px-2 text-xs text-neutral-600 dark:text-neutral-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-neutral-800/60 rounded-md transition-colors font-mono">
                        <span class="size-1 rounded-full bg-neutral-400 dark:bg-neutral-500 shrink-0"></span>
                        <span class="truncate">jenis_pendaftaran</span>
                      </A>
                    </li>
                    <li>
                      <A href="/feeder/referensi/jenis-prestasi" class="flex items-center gap-2 py-1 px-2 text-xs text-neutral-600 dark:text-neutral-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-neutral-800/60 rounded-md transition-colors font-mono">
                        <span class="size-1 rounded-full bg-neutral-400 dark:bg-neutral-500 shrink-0"></span>
                        <span class="truncate">jenis_prestasi</span>
                      </A>
                    </li>
                    <li>
                      <A href="/feeder/referensi/jenis-satuan-manajemen-sumberdaya" class="flex items-center gap-2 py-1 px-2 text-xs text-neutral-600 dark:text-neutral-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-neutral-800/60 rounded-md transition-colors font-mono">
                        <span class="size-1 rounded-full bg-neutral-400 dark:bg-neutral-500 shrink-0"></span>
                        <span class="truncate">jenis_satuan_manajemen_sumberdaya</span>
                      </A>
                    </li>
                    <li>
                      <A href="/feeder/referensi/jenis-sertifikasi" class="flex items-center gap-2 py-1 px-2 text-xs text-neutral-600 dark:text-neutral-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-neutral-800/60 rounded-md transition-colors font-mono">
                        <span class="size-1 rounded-full bg-neutral-400 dark:bg-neutral-500 shrink-0"></span>
                        <span class="truncate">jenis_sertifikasi</span>
                      </A>
                    </li>
                    <li>
                      <A href="/feeder/referensi/jenis-substansi" class="flex items-center gap-2 py-1 px-2 text-xs text-neutral-600 dark:text-neutral-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-neutral-800/60 rounded-md transition-colors font-mono">
                        <span class="size-1 rounded-full bg-neutral-400 dark:bg-neutral-500 shrink-0"></span>
                        <span class="truncate">jenis_substansi</span>
                      </A>
                    </li>
                    <li>
                      <A href="/feeder/referensi/jenis-tinggal" class="flex items-center gap-2 py-1 px-2 text-xs text-neutral-600 dark:text-neutral-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-neutral-800/60 rounded-md transition-colors font-mono">
                        <span class="size-1 rounded-full bg-neutral-400 dark:bg-neutral-500 shrink-0"></span>
                        <span class="truncate">jenis_tinggal</span>
                      </A>
                    </li>
                    <li>
                      <A href="/feeder/referensi/jenjang-pendidikan" class="flex items-center gap-2 py-1 px-2 text-xs text-neutral-600 dark:text-neutral-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-neutral-800/60 rounded-md transition-colors font-mono">
                        <span class="size-1 rounded-full bg-neutral-400 dark:bg-neutral-500 shrink-0"></span>
                        <span class="truncate">jenjang_pendidikan</span>
                      </A>
                    </li>
                    <li>
                      <A href="/feeder/referensi/kategori-kegiatan" class="flex items-center gap-2 py-1 px-2 text-xs text-neutral-600 dark:text-neutral-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-neutral-800/60 rounded-md transition-colors font-mono">
                        <span class="size-1 rounded-full bg-neutral-400 dark:bg-neutral-500 shrink-0"></span>
                        <span class="truncate">kategori_kegiatan</span>
                      </A>
                    </li>
                    <li>
                      <A href="/feeder/referensi/kebutuhan-khusus" class="flex items-center gap-2 py-1 px-2 text-xs text-neutral-600 dark:text-neutral-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-neutral-800/60 rounded-md transition-colors font-mono">
                        <span class="size-1 rounded-full bg-neutral-400 dark:bg-neutral-500 shrink-0"></span>
                        <span class="truncate">kebutuhan_khusus</span>
                      </A>
                    </li>
                    <li>
                      <A href="/feeder/referensi/lembaga-pengangkat" class="flex items-center gap-2 py-1 px-2 text-xs text-neutral-600 dark:text-neutral-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-neutral-800/60 rounded-md transition-colors font-mono">
                        <span class="size-1 rounded-full bg-neutral-400 dark:bg-neutral-500 shrink-0"></span>
                        <span class="truncate">lembaga_pengangkat</span>
                      </A>
                    </li>
                    <li>
                      <A href="/feeder/referensi/level-wilayah" class="flex items-center gap-2 py-1 px-2 text-xs text-neutral-600 dark:text-neutral-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-neutral-800/60 rounded-md transition-colors font-mono">
                        <span class="size-1 rounded-full bg-neutral-400 dark:bg-neutral-500 shrink-0"></span>
                        <span class="truncate">level_wilayah</span>
                      </A>
                    </li>
                    <li>
                      <A href="/feeder/referensi/negara" class="flex items-center gap-2 py-1 px-2 text-xs text-neutral-600 dark:text-neutral-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-neutral-800/60 rounded-md transition-colors font-mono">
                        <span class="size-1 rounded-full bg-neutral-400 dark:bg-neutral-500 shrink-0"></span>
                        <span class="truncate">negara</span>
                      </A>
                    </li>
                    <li>
                      <A href="/feeder/referensi/pangkat-golongan" class="flex items-center gap-2 py-1 px-2 text-xs text-neutral-600 dark:text-neutral-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-neutral-800/60 rounded-md transition-colors font-mono">
                        <span class="size-1 rounded-full bg-neutral-400 dark:bg-neutral-500 shrink-0"></span>
                        <span class="truncate">pangkat_golongan</span>
                      </A>
                    </li>
                    <li>
                      <A href="/feeder/referensi/pekerjaan" class="flex items-center gap-2 py-1 px-2 text-xs text-neutral-600 dark:text-neutral-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-neutral-800/60 rounded-md transition-colors font-mono">
                        <span class="size-1 rounded-full bg-neutral-400 dark:bg-neutral-500 shrink-0"></span>
                        <span class="truncate">pekerjaan</span>
                      </A>
                    </li>
                    <li>
                      <A href="/feeder/referensi/pembiayaan" class="flex items-center gap-2 py-1 px-2 text-xs text-neutral-600 dark:text-neutral-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-neutral-800/60 rounded-md transition-colors font-mono">
                        <span class="size-1 rounded-full bg-neutral-400 dark:bg-neutral-500 shrink-0"></span>
                        <span class="truncate">pembiayaan</span>
                      </A>
                    </li>
                    <li>
                      <A href="/feeder/referensi/penghasilan" class="flex items-center gap-2 py-1 px-2 text-xs text-neutral-600 dark:text-neutral-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-neutral-800/60 rounded-md transition-colors font-mono">
                        <span class="size-1 rounded-full bg-neutral-400 dark:bg-neutral-500 shrink-0"></span>
                        <span class="truncate">penghasilan</span>
                      </A>
                    </li>
                    <li>
                      <A href="/feeder/referensi/periode-lampau" class="flex items-center gap-2 py-1 px-2 text-xs text-neutral-600 dark:text-neutral-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-neutral-800/60 rounded-md transition-colors font-mono">
                        <span class="size-1 rounded-full bg-neutral-400 dark:bg-neutral-500 shrink-0"></span>
                        <span class="truncate">periode_lampau</span>
                      </A>
                    </li>
                    <li>
                      <A href="/feeder/referensi/semester" class="flex items-center gap-2 py-1 px-2 text-xs text-neutral-600 dark:text-neutral-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-neutral-800/60 rounded-md transition-colors font-mono">
                        <span class="size-1 rounded-full bg-neutral-400 dark:bg-neutral-500 shrink-0"></span>
                        <span class="truncate">semester</span>
                      </A>
                    </li>
                    <li>
                      <A href="/feeder/referensi/status-keaktifan-pegawai" class="flex items-center gap-2 py-1 px-2 text-xs text-neutral-600 dark:text-neutral-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-neutral-800/60 rounded-md transition-colors font-mono">
                        <span class="size-1 rounded-full bg-neutral-400 dark:bg-neutral-500 shrink-0"></span>
                        <span class="truncate">status_keaktifan_pegawai</span>
                      </A>
                    </li>
                    <li>
                      <A href="/feeder/referensi/status-kepegawaian" class="flex items-center gap-2 py-1 px-2 text-xs text-neutral-600 dark:text-neutral-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-neutral-800/60 rounded-md transition-colors font-mono">
                        <span class="size-1 rounded-full bg-neutral-400 dark:bg-neutral-500 shrink-0"></span>
                        <span class="truncate">status_kepegawaian</span>
                      </A>
                    </li>
                    <li>
                      <A href="/feeder/referensi/status-mahasiswa" class="flex items-center gap-2 py-1 px-2 text-xs text-neutral-600 dark:text-neutral-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-neutral-800/60 rounded-md transition-colors font-mono">
                        <span class="size-1 rounded-full bg-neutral-400 dark:bg-neutral-500 shrink-0"></span>
                        <span class="truncate">status_mahasiswa</span>
                      </A>
                    </li>
                    <li>
                      <A href="/feeder/referensi/tahun-ajaran" class="flex items-center gap-2 py-1 px-2 text-xs text-neutral-600 dark:text-neutral-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-neutral-800/60 rounded-md transition-colors font-mono">
                        <span class="size-1 rounded-full bg-neutral-400 dark:bg-neutral-500 shrink-0"></span>
                        <span class="truncate">tahun_ajaran</span>
                      </A>
                    </li>
                    <li>
                      <A href="/feeder/referensi/tingkat-prestasi" class="flex items-center gap-2 py-1 px-2 text-xs text-neutral-600 dark:text-neutral-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-neutral-800/60 rounded-md transition-colors font-mono">
                        <span class="size-1 rounded-full bg-neutral-400 dark:bg-neutral-500 shrink-0"></span>
                        <span class="truncate">tingkat_prestasi</span>
                      </A>
                    </li>
                    <li>
                      <A href="/feeder/referensi/wilayah" class="flex items-center gap-2 py-1 px-2 text-xs text-neutral-600 dark:text-neutral-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-neutral-800/60 rounded-md transition-colors font-mono">
                        <span class="size-1 rounded-full bg-neutral-400 dark:bg-neutral-500 shrink-0"></span>
                        <span class="truncate">wilayah</span>
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
                    <span class="truncate">rekapitulasi</span>
                  </div>
                </summary>
                <div class="w-full details-anim-content">
                  <ul class="pt-0.5 ps-2.5 space-y-0.5 border-s border-neutral-200 dark:border-neutral-700 ms-2.5 my-0.5">
                    <li>
                      <A href="/feeder/rekapitulasi/indeks-prestasi-sementara-mahasiswa" class="flex items-center gap-2 py-1 px-2 text-xs text-neutral-600 dark:text-neutral-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-neutral-800/60 rounded-md transition-colors font-mono">
                        <span class="size-1 rounded-full bg-neutral-400 dark:bg-neutral-500 shrink-0"></span>
                        <span class="truncate">indeks_prestasi_sementara_mahasiswa</span>
                      </A>
                    </li>
                    <li>
                      <A href="/feeder/rekapitulasi/jumlah-dosen" class="flex items-center gap-2 py-1 px-2 text-xs text-neutral-600 dark:text-neutral-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-neutral-800/60 rounded-md transition-colors font-mono">
                        <span class="size-1 rounded-full bg-neutral-400 dark:bg-neutral-500 shrink-0"></span>
                        <span class="truncate">jumlah_dosen</span>
                      </A>
                    </li>
                    <li>
                      <A href="/feeder/rekapitulasi/jumlah-mahasiswa" class="flex items-center gap-2 py-1 px-2 text-xs text-neutral-600 dark:text-neutral-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-neutral-800/60 rounded-md transition-colors font-mono">
                        <span class="size-1 rounded-full bg-neutral-400 dark:bg-neutral-500 shrink-0"></span>
                        <span class="truncate">jumlah_mahasiswa</span>
                      </A>
                    </li>
                    <li>
                      <A href="/feeder/rekapitulasi/kartu-hasil-studi-mahasiswa" class="flex items-center gap-2 py-1 px-2 text-xs text-neutral-600 dark:text-neutral-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-neutral-800/60 rounded-md transition-colors font-mono">
                        <span class="size-1 rounded-full bg-neutral-400 dark:bg-neutral-500 shrink-0"></span>
                        <span class="truncate">kartu_hasil_studi_mahasiswa</span>
                      </A>
                    </li>
                    <li>
                      <A href="/feeder/rekapitulasi/kartu-rencana-studi-mahasiswa" class="flex items-center gap-2 py-1 px-2 text-xs text-neutral-600 dark:text-neutral-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-neutral-800/60 rounded-md transition-colors font-mono">
                        <span class="size-1 rounded-full bg-neutral-400 dark:bg-neutral-500 shrink-0"></span>
                        <span class="truncate">kartu_rencana_studi_mahasiswa</span>
                      </A>
                    </li>
                    <li>
                      <A href="/feeder/rekapitulasi/laporan" class="flex items-center gap-2 py-1 px-2 text-xs text-neutral-600 dark:text-neutral-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-neutral-800/60 rounded-md transition-colors font-mono">
                        <span class="size-1 rounded-full bg-neutral-400 dark:bg-neutral-500 shrink-0"></span>
                        <span class="truncate">laporan</span>
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
            <span class="truncate">general</span>
          </div>
        </summary>
        <div class="w-full details-anim-content">
          <ul class="pt-0.5 ps-2.5 space-y-0.5 border-s border-neutral-200 dark:border-neutral-700 ms-2.5 my-0.5">
            <li>
              <div class="flex items-center gap-x-2 py-1 px-2 text-xs font-mono text-neutral-400 dark:text-neutral-500">
                <span class="size-1.5 rounded-full bg-neutral-300 dark:bg-neutral-600"></span>
                <span>reference</span>
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
            <span class="truncate">institution</span>
          </div>
        </summary>
        <div class="w-full details-anim-content">
          <ul class="pt-0.5 ps-2.5 space-y-0.5 border-s border-neutral-200 dark:border-neutral-700 ms-2.5 my-0.5">
            <li>
              <details class="group animated-details">
                <summary class="list-none [&::-webkit-details-marker]:hidden cursor-pointer w-full text-start flex items-center justify-between py-1 px-2 text-xs font-medium text-neutral-700 dark:text-neutral-300 rounded-md hover:bg-neutral-100 dark:hover:bg-neutral-800/80 transition-colors font-mono">
                  <div class="flex items-center gap-2 truncate">
                    <svg class="size-3 text-neutral-400 group-open:rotate-90 transition-transform shrink-0" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="m9 18 6-6-6-6"/></svg>
                    <span class="truncate">master</span>
                  </div>
                </summary>
                <div class="w-full details-anim-content">
                  <ul class="pt-0.5 ps-2.5 space-y-0.5 border-s border-neutral-200 dark:border-neutral-700 ms-2.5 my-0.5">
                    <li>
                      <A href="/institution/master/employee" class="flex items-center gap-2 py-1 px-2 text-xs text-neutral-600 dark:text-neutral-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-neutral-800/60 rounded-md transition-colors font-mono">
                        <span class="size-1 rounded-full bg-neutral-400 dark:bg-neutral-500 shrink-0"></span>
                        <span class="truncate">employees</span>
                      </A>
                    </li>
                    <li>
                      <A href="/institution/master/institution" class="flex items-center gap-2 py-1 px-2 text-xs text-neutral-600 dark:text-neutral-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-neutral-800/60 rounded-md transition-colors font-mono">
                        <span class="size-1 rounded-full bg-neutral-400 dark:bg-neutral-500 shrink-0"></span>
                        <span class="truncate">institutions</span>
                      </A>
                    </li>
                    <li>
                      <A href="/institution/master/staff" class="flex items-center gap-2 py-1 px-2 text-xs text-neutral-600 dark:text-neutral-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-neutral-800/60 rounded-md transition-colors font-mono">
                        <span class="size-1 rounded-full bg-neutral-400 dark:bg-neutral-500 shrink-0"></span>
                        <span class="truncate">staffes</span>
                      </A>
                    </li>
                    <li>
                      <A href="/institution/master/unit" class="flex items-center gap-2 py-1 px-2 text-xs text-neutral-600 dark:text-neutral-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-neutral-800/60 rounded-md transition-colors font-mono">
                        <span class="size-1 rounded-full bg-neutral-400 dark:bg-neutral-500 shrink-0"></span>
                        <span class="truncate">units</span>
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
                    <span class="truncate">reference</span>
                  </div>
                </summary>
                <div class="w-full details-anim-content">
                  <ul class="pt-0.5 ps-2.5 space-y-0.5 border-s border-neutral-200 dark:border-neutral-700 ms-2.5 my-0.5">
                    <li>
                      <A href="/institution/reference/category" class="flex items-center gap-2 py-1 px-2 text-xs text-neutral-600 dark:text-neutral-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-neutral-800/60 rounded-md transition-colors font-mono">
                        <span class="size-1 rounded-full bg-neutral-400 dark:bg-neutral-500 shrink-0"></span>
                        <span class="truncate">categories</span>
                      </A>
                    </li>
                    <li>
                      <A href="/institution/reference/position-type" class="flex items-center gap-2 py-1 px-2 text-xs text-neutral-600 dark:text-neutral-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-neutral-800/60 rounded-md transition-colors font-mono">
                        <span class="size-1 rounded-full bg-neutral-400 dark:bg-neutral-500 shrink-0"></span>
                        <span class="truncate">position_type</span>
                      </A>
                    </li>
                    <li>
                      <A href="/institution/reference/unit-type" class="flex items-center gap-2 py-1 px-2 text-xs text-neutral-600 dark:text-neutral-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-neutral-800/60 rounded-md transition-colors font-mono">
                        <span class="size-1 rounded-full bg-neutral-400 dark:bg-neutral-500 shrink-0"></span>
                        <span class="truncate">unit_types</span>
                      </A>
                    </li>
                    <li>
                      <A href="/institution/reference/variety" class="flex items-center gap-2 py-1 px-2 text-xs text-neutral-600 dark:text-neutral-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-neutral-800/60 rounded-md transition-colors font-mono">
                        <span class="size-1 rounded-full bg-neutral-400 dark:bg-neutral-500 shrink-0"></span>
                        <span class="truncate">varieties</span>
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
            <span class="truncate">literate</span>
          </div>
        </summary>
        <div class="w-full details-anim-content">
          <ul class="pt-0.5 ps-2.5 space-y-0.5 border-s border-neutral-200 dark:border-neutral-700 ms-2.5 my-0.5">
            <li>
              <A href="/literate/category" class="flex items-center gap-2 py-1 px-2 text-xs text-neutral-600 dark:text-neutral-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-neutral-800/60 rounded-md transition-colors font-mono">
                <span class="size-1 rounded-full bg-neutral-400 dark:bg-neutral-500 shrink-0"></span>
                <span class="truncate">categories</span>
              </A>
            </li>
            <li>
              <A href="/literate/education" class="flex items-center gap-2 py-1 px-2 text-xs text-neutral-600 dark:text-neutral-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-neutral-800/60 rounded-md transition-colors font-mono">
                <span class="size-1 rounded-full bg-neutral-400 dark:bg-neutral-500 shrink-0"></span>
                <span class="truncate">educations</span>
              </A>
            </li>
            <li>
              <A href="/literate/group" class="flex items-center gap-2 py-1 px-2 text-xs text-neutral-600 dark:text-neutral-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-neutral-800/60 rounded-md transition-colors font-mono">
                <span class="size-1 rounded-full bg-neutral-400 dark:bg-neutral-500 shrink-0"></span>
                <span class="truncate">groups</span>
              </A>
            </li>
            <li>
              <A href="/literate/level" class="flex items-center gap-2 py-1 px-2 text-xs text-neutral-600 dark:text-neutral-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-neutral-800/60 rounded-md transition-colors font-mono">
                <span class="size-1 rounded-full bg-neutral-400 dark:bg-neutral-500 shrink-0"></span>
                <span class="truncate">levels</span>
              </A>
            </li>
            <li>
              <A href="/literate/variety" class="flex items-center gap-2 py-1 px-2 text-xs text-neutral-600 dark:text-neutral-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-neutral-800/60 rounded-md transition-colors font-mono">
                <span class="size-1 rounded-full bg-neutral-400 dark:bg-neutral-500 shrink-0"></span>
                <span class="truncate">varieties</span>
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
            <span class="truncate">location</span>
          </div>
        </summary>
        <div class="w-full details-anim-content">
          <ul class="pt-0.5 ps-2.5 space-y-0.5 border-s border-neutral-200 dark:border-neutral-700 ms-2.5 my-0.5">
            <li>
              <A href="/location/continent" class="flex items-center gap-2 py-1 px-2 text-xs text-neutral-600 dark:text-neutral-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-neutral-800/60 rounded-md transition-colors font-mono">
                <span class="size-1 rounded-full bg-neutral-400 dark:bg-neutral-500 shrink-0"></span>
                <span class="truncate">continents</span>
              </A>
            </li>
            <li>
              <A href="/location/country" class="flex items-center gap-2 py-1 px-2 text-xs text-neutral-600 dark:text-neutral-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-neutral-800/60 rounded-md transition-colors font-mono">
                <span class="size-1 rounded-full bg-neutral-400 dark:bg-neutral-500 shrink-0"></span>
                <span class="truncate">countries</span>
              </A>
            </li>
            <li>
              <A href="/location/province" class="flex items-center gap-2 py-1 px-2 text-xs text-neutral-600 dark:text-neutral-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-neutral-800/60 rounded-md transition-colors font-mono">
                <span class="size-1 rounded-full bg-neutral-400 dark:bg-neutral-500 shrink-0"></span>
                <span class="truncate">provinces</span>
              </A>
            </li>
            <li>
              <A href="/location/regency" class="flex items-center gap-2 py-1 px-2 text-xs text-neutral-600 dark:text-neutral-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-neutral-800/60 rounded-md transition-colors font-mono">
                <span class="size-1 rounded-full bg-neutral-400 dark:bg-neutral-500 shrink-0"></span>
                <span class="truncate">regencies</span>
              </A>
            </li>
            <li>
              <A href="/location/regency-type" class="flex items-center gap-2 py-1 px-2 text-xs text-neutral-600 dark:text-neutral-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-neutral-800/60 rounded-md transition-colors font-mono">
                <span class="size-1 rounded-full bg-neutral-400 dark:bg-neutral-500 shrink-0"></span>
                <span class="truncate">regency_types</span>
              </A>
            </li>
            <li>
              <A href="/location/region" class="flex items-center gap-2 py-1 px-2 text-xs text-neutral-600 dark:text-neutral-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-neutral-800/60 rounded-md transition-colors font-mono">
                <span class="size-1 rounded-full bg-neutral-400 dark:bg-neutral-500 shrink-0"></span>
                <span class="truncate">regions</span>
              </A>
            </li>
            <li>
              <A href="/location/sub-district" class="flex items-center gap-2 py-1 px-2 text-xs text-neutral-600 dark:text-neutral-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-neutral-800/60 rounded-md transition-colors font-mono">
                <span class="size-1 rounded-full bg-neutral-400 dark:bg-neutral-500 shrink-0"></span>
                <span class="truncate">sub_districts</span>
              </A>
            </li>
            <li>
              <A href="/location/village" class="flex items-center gap-2 py-1 px-2 text-xs text-neutral-600 dark:text-neutral-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-neutral-800/60 rounded-md transition-colors font-mono">
                <span class="size-1 rounded-full bg-neutral-400 dark:bg-neutral-500 shrink-0"></span>
                <span class="truncate">villages</span>
              </A>
            </li>
          </ul>
        </div>
      </details>
    </li>
    <li>
      <div class="flex items-center gap-x-2 py-1 px-2 text-xs font-mono text-neutral-400 dark:text-neutral-500">
        <span class="size-1.5 rounded-full bg-neutral-300 dark:bg-neutral-600"></span>
        <span>payment</span>
      </div>
    </li>
    <li>
      <details class="group animated-details" open>
        <summary class="list-none [&::-webkit-details-marker]:hidden cursor-pointer w-full text-start flex items-center justify-between py-1.5 px-2 text-xs font-bold text-neutral-800 dark:text-neutral-200 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors font-mono">
          <div class="flex items-center gap-2 truncate">
            <svg class="size-3 text-neutral-400 group-open:rotate-90 transition-transform shrink-0" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="m9 18 6-6-6-6"/></svg>
            <span class="truncate">person</span>
          </div>
        </summary>
        <div class="w-full details-anim-content">
          <ul class="pt-0.5 ps-2.5 space-y-0.5 border-s border-neutral-200 dark:border-neutral-700 ms-2.5 my-0.5">
            <li>
              <div class="flex items-center gap-x-2 py-1 px-2 text-xs font-mono text-neutral-400 dark:text-neutral-500">
                <span class="size-1.5 rounded-full bg-neutral-300 dark:bg-neutral-600"></span>
                <span>history</span>
              </div>
            </li>
            <li>
              <details class="group animated-details">
                <summary class="list-none [&::-webkit-details-marker]:hidden cursor-pointer w-full text-start flex items-center justify-between py-1 px-2 text-xs font-medium text-neutral-700 dark:text-neutral-300 rounded-md hover:bg-neutral-100 dark:hover:bg-neutral-800/80 transition-colors font-mono">
                  <div class="flex items-center gap-2 truncate">
                    <svg class="size-3 text-neutral-400 group-open:rotate-90 transition-transform shrink-0" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="m9 18 6-6-6-6"/></svg>
                    <span class="truncate">master</span>
                  </div>
                </summary>
                <div class="w-full details-anim-content">
                  <ul class="pt-0.5 ps-2.5 space-y-0.5 border-s border-neutral-200 dark:border-neutral-700 ms-2.5 my-0.5">
                    <li>
                      <A href="/person/master/biodata" class="flex items-center gap-2 py-1 px-2 text-xs text-neutral-600 dark:text-neutral-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-neutral-800/60 rounded-md transition-colors font-mono">
                        <span class="size-1 rounded-full bg-neutral-400 dark:bg-neutral-500 shrink-0"></span>
                        <span class="truncate">biodata</span>
                      </A>
                    </li>
                    <li>
                      <A href="/person/master/individual" class="flex items-center gap-2 py-1 px-2 text-xs text-neutral-600 dark:text-neutral-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-neutral-800/60 rounded-md transition-colors font-mono">
                        <span class="size-1 rounded-full bg-neutral-400 dark:bg-neutral-500 shrink-0"></span>
                        <span class="truncate">individual</span>
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
                    <span class="truncate">reference</span>
                  </div>
                </summary>
                <div class="w-full details-anim-content">
                  <ul class="pt-0.5 ps-2.5 space-y-0.5 border-s border-neutral-200 dark:border-neutral-700 ms-2.5 my-0.5">
                    <li>
                      <A href="/person/reference/age-classification" class="flex items-center gap-2 py-1 px-2 text-xs text-neutral-600 dark:text-neutral-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-neutral-800/60 rounded-md transition-colors font-mono">
                        <span class="size-1 rounded-full bg-neutral-400 dark:bg-neutral-500 shrink-0"></span>
                        <span class="truncate">age_classification</span>
                      </A>
                    </li>
                    <li>
                      <A href="/person/reference/blood-type" class="flex items-center gap-2 py-1 px-2 text-xs text-neutral-600 dark:text-neutral-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-neutral-800/60 rounded-md transition-colors font-mono">
                        <span class="size-1 rounded-full bg-neutral-400 dark:bg-neutral-500 shrink-0"></span>
                        <span class="truncate">blood_type</span>
                      </A>
                    </li>
                    <li>
                      <A href="/person/reference/eye-color" class="flex items-center gap-2 py-1 px-2 text-xs text-neutral-600 dark:text-neutral-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-neutral-800/60 rounded-md transition-colors font-mono">
                        <span class="size-1 rounded-full bg-neutral-400 dark:bg-neutral-500 shrink-0"></span>
                        <span class="truncate">eye_color</span>
                      </A>
                    </li>
                    <li>
                      <A href="/person/reference/gender" class="flex items-center gap-2 py-1 px-2 text-xs text-neutral-600 dark:text-neutral-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-neutral-800/60 rounded-md transition-colors font-mono">
                        <span class="size-1 rounded-full bg-neutral-400 dark:bg-neutral-500 shrink-0"></span>
                        <span class="truncate">gender</span>
                      </A>
                    </li>
                    <li>
                      <A href="/person/reference/hair-color" class="flex items-center gap-2 py-1 px-2 text-xs text-neutral-600 dark:text-neutral-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-neutral-800/60 rounded-md transition-colors font-mono">
                        <span class="size-1 rounded-full bg-neutral-400 dark:bg-neutral-500 shrink-0"></span>
                        <span class="truncate">hair_color</span>
                      </A>
                    </li>
                    <li>
                      <A href="/person/reference/hair-type" class="flex items-center gap-2 py-1 px-2 text-xs text-neutral-600 dark:text-neutral-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-neutral-800/60 rounded-md transition-colors font-mono">
                        <span class="size-1 rounded-full bg-neutral-400 dark:bg-neutral-500 shrink-0"></span>
                        <span class="truncate">hair_type</span>
                      </A>
                    </li>
                    <li>
                      <A href="/person/reference/identification-type" class="flex items-center gap-2 py-1 px-2 text-xs text-neutral-600 dark:text-neutral-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-neutral-800/60 rounded-md transition-colors font-mono">
                        <span class="size-1 rounded-full bg-neutral-400 dark:bg-neutral-500 shrink-0"></span>
                        <span class="truncate">identification_type</span>
                      </A>
                    </li>
                    <li>
                      <A href="/person/reference/income" class="flex items-center gap-2 py-1 px-2 text-xs text-neutral-600 dark:text-neutral-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-neutral-800/60 rounded-md transition-colors font-mono">
                        <span class="size-1 rounded-full bg-neutral-400 dark:bg-neutral-500 shrink-0"></span>
                        <span class="truncate">income</span>
                      </A>
                    </li>
                    <li>
                      <A href="/person/reference/marital-status" class="flex items-center gap-2 py-1 px-2 text-xs text-neutral-600 dark:text-neutral-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-neutral-800/60 rounded-md transition-colors font-mono">
                        <span class="size-1 rounded-full bg-neutral-400 dark:bg-neutral-500 shrink-0"></span>
                        <span class="truncate">marital_status</span>
                      </A>
                    </li>
                    <li>
                      <A href="/person/reference/occupation" class="flex items-center gap-2 py-1 px-2 text-xs text-neutral-600 dark:text-neutral-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-neutral-800/60 rounded-md transition-colors font-mono">
                        <span class="size-1 rounded-full bg-neutral-400 dark:bg-neutral-500 shrink-0"></span>
                        <span class="truncate">occupation</span>
                      </A>
                    </li>
                    <li>
                      <A href="/person/reference/profession" class="flex items-center gap-2 py-1 px-2 text-xs text-neutral-600 dark:text-neutral-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-neutral-800/60 rounded-md transition-colors font-mono">
                        <span class="size-1 rounded-full bg-neutral-400 dark:bg-neutral-500 shrink-0"></span>
                        <span class="truncate">profession</span>
                      </A>
                    </li>
                    <li>
                      <A href="/person/reference/relative-type" class="flex items-center gap-2 py-1 px-2 text-xs text-neutral-600 dark:text-neutral-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-neutral-800/60 rounded-md transition-colors font-mono">
                        <span class="size-1 rounded-full bg-neutral-400 dark:bg-neutral-500 shrink-0"></span>
                        <span class="truncate">relative_type</span>
                      </A>
                    </li>
                    <li>
                      <A href="/person/reference/religion" class="flex items-center gap-2 py-1 px-2 text-xs text-neutral-600 dark:text-neutral-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-neutral-800/60 rounded-md transition-colors font-mono">
                        <span class="size-1 rounded-full bg-neutral-400 dark:bg-neutral-500 shrink-0"></span>
                        <span class="truncate">religion</span>
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
