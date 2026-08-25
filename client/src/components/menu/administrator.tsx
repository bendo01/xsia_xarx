import { A } from '@solidjs/router';

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
                <span>Administrator Dashboard</span>
            </A>

            {/* Tree Menu Models Exactly Matching server/tree_menu.md */}
            <div class="pt-1 border-t border-neutral-200 dark:border-neutral-800">
                <div class="px-2 py-1 flex items-center justify-between text-[10px] font-bold uppercase tracking-wider text-neutral-400 dark:text-neutral-500 font-mono">
                    <span>Models Tree</span>
                    <span>241 entities</span>
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
                              <A href="/academic/campaign/reference/attend_types" class="flex items-center gap-2 py-1 px-2 text-xs text-neutral-600 dark:text-neutral-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-neutral-800/60 rounded-md transition-colors font-mono">
                                <span class="size-1 rounded-full bg-neutral-400 dark:bg-neutral-500 shrink-0"></span>
                                <span class="truncate">attend_types</span>
                              </A>
                            </li>
                            <li>
                              <A href="/academic/campaign/reference/calendar_categories" class="flex items-center gap-2 py-1 px-2 text-xs text-neutral-600 dark:text-neutral-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-neutral-800/60 rounded-md transition-colors font-mono">
                                <span class="size-1 rounded-full bg-neutral-400 dark:bg-neutral-500 shrink-0"></span>
                                <span class="truncate">calendar_categories</span>
                              </A>
                            </li>
                            <li>
                              <A href="/academic/campaign/reference/encounter_categories" class="flex items-center gap-2 py-1 px-2 text-xs text-neutral-600 dark:text-neutral-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-neutral-800/60 rounded-md transition-colors font-mono">
                                <span class="size-1 rounded-full bg-neutral-400 dark:bg-neutral-500 shrink-0"></span>
                                <span class="truncate">encounter_categories</span>
                              </A>
                            </li>
                            <li>
                              <A href="/academic/campaign/reference/implementations" class="flex items-center gap-2 py-1 px-2 text-xs text-neutral-600 dark:text-neutral-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-neutral-800/60 rounded-md transition-colors font-mono">
                                <span class="size-1 rounded-full bg-neutral-400 dark:bg-neutral-500 shrink-0"></span>
                                <span class="truncate">implementations</span>
                              </A>
                            </li>
                            <li>
                              <A href="/academic/campaign/reference/scopes" class="flex items-center gap-2 py-1 px-2 text-xs text-neutral-600 dark:text-neutral-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-neutral-800/60 rounded-md transition-colors font-mono">
                                <span class="size-1 rounded-full bg-neutral-400 dark:bg-neutral-500 shrink-0"></span>
                                <span class="truncate">scopes</span>
                              </A>
                            </li>
                            <li>
                              <A href="/academic/campaign/reference/substances" class="flex items-center gap-2 py-1 px-2 text-xs text-neutral-600 dark:text-neutral-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-neutral-800/60 rounded-md transition-colors font-mono">
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
                              <A href="/academic/campaign/transaction/activities" class="flex items-center gap-2 py-1 px-2 text-xs text-neutral-600 dark:text-neutral-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-neutral-800/60 rounded-md transition-colors font-mono">
                                <span class="size-1 rounded-full bg-neutral-400 dark:bg-neutral-500 shrink-0"></span>
                                <span class="truncate">activities</span>
                              </A>
                            </li>
                            <li>
                              <A href="/academic/campaign/transaction/calendar_details" class="flex items-center gap-2 py-1 px-2 text-xs text-neutral-600 dark:text-neutral-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-neutral-800/60 rounded-md transition-colors font-mono">
                                <span class="size-1 rounded-full bg-neutral-400 dark:bg-neutral-500 shrink-0"></span>
                                <span class="truncate">calendar_details</span>
                              </A>
                            </li>
                            <li>
                              <A href="/academic/campaign/transaction/calendars" class="flex items-center gap-2 py-1 px-2 text-xs text-neutral-600 dark:text-neutral-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-neutral-800/60 rounded-md transition-colors font-mono">
                                <span class="size-1 rounded-full bg-neutral-400 dark:bg-neutral-500 shrink-0"></span>
                                <span class="truncate">calendars</span>
                              </A>
                            </li>
                            <li>
                              <A href="/academic/campaign/transaction/class_codes" class="flex items-center gap-2 py-1 px-2 text-xs text-neutral-600 dark:text-neutral-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-neutral-800/60 rounded-md transition-colors font-mono">
                                <span class="size-1 rounded-full bg-neutral-400 dark:bg-neutral-500 shrink-0"></span>
                                <span class="truncate">class_codes</span>
                              </A>
                            </li>
                            <li>
                              <A href="/academic/campaign/transaction/grades" class="flex items-center gap-2 py-1 px-2 text-xs text-neutral-600 dark:text-neutral-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-neutral-800/60 rounded-md transition-colors font-mono">
                                <span class="size-1 rounded-full bg-neutral-400 dark:bg-neutral-500 shrink-0"></span>
                                <span class="truncate">grades</span>
                              </A>
                            </li>
                            <li>
                              <A href="/academic/campaign/transaction/schedules" class="flex items-center gap-2 py-1 px-2 text-xs text-neutral-600 dark:text-neutral-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-neutral-800/60 rounded-md transition-colors font-mono">
                                <span class="size-1 rounded-full bg-neutral-400 dark:bg-neutral-500 shrink-0"></span>
                                <span class="truncate">schedules</span>
                              </A>
                            </li>
                            <li>
                              <A href="/academic/campaign/transaction/teach_decrees" class="flex items-center gap-2 py-1 px-2 text-xs text-neutral-600 dark:text-neutral-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-neutral-800/60 rounded-md transition-colors font-mono">
                                <span class="size-1 rounded-full bg-neutral-400 dark:bg-neutral-500 shrink-0"></span>
                                <span class="truncate">teach_decrees</span>
                              </A>
                            </li>
                            <li>
                              <A href="/academic/campaign/transaction/teach_evaluations" class="flex items-center gap-2 py-1 px-2 text-xs text-neutral-600 dark:text-neutral-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-neutral-800/60 rounded-md transition-colors font-mono">
                                <span class="size-1 rounded-full bg-neutral-400 dark:bg-neutral-500 shrink-0"></span>
                                <span class="truncate">teach_evaluations</span>
                              </A>
                            </li>
                            <li>
                              <A href="/academic/campaign/transaction/teach_lecturers" class="flex items-center gap-2 py-1 px-2 text-xs text-neutral-600 dark:text-neutral-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-neutral-800/60 rounded-md transition-colors font-mono">
                                <span class="size-1 rounded-full bg-neutral-400 dark:bg-neutral-500 shrink-0"></span>
                                <span class="truncate">teach_lecturers</span>
                              </A>
                            </li>
                            <li>
                              <A href="/academic/campaign/transaction/teaches" class="flex items-center gap-2 py-1 px-2 text-xs text-neutral-600 dark:text-neutral-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-neutral-800/60 rounded-md transition-colors font-mono">
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
                              <A href="/academic/candidate/master/candidate_unit" class="flex items-center gap-2 py-1 px-2 text-xs text-neutral-600 dark:text-neutral-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-neutral-800/60 rounded-md transition-colors font-mono">
                                <span class="size-1 rounded-full bg-neutral-400 dark:bg-neutral-500 shrink-0"></span>
                                <span class="truncate">candidate_unit</span>
                              </A>
                            </li>
                            <li>
                              <A href="/academic/candidate/master/candidates" class="flex items-center gap-2 py-1 px-2 text-xs text-neutral-600 dark:text-neutral-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-neutral-800/60 rounded-md transition-colors font-mono">
                                <span class="size-1 rounded-full bg-neutral-400 dark:bg-neutral-500 shrink-0"></span>
                                <span class="truncate">candidates</span>
                              </A>
                            </li>
                            <li>
                              <A href="/academic/candidate/master/exam_classes" class="flex items-center gap-2 py-1 px-2 text-xs text-neutral-600 dark:text-neutral-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-neutral-800/60 rounded-md transition-colors font-mono">
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
                              <A href="/academic/candidate/reference/document_types" class="flex items-center gap-2 py-1 px-2 text-xs text-neutral-600 dark:text-neutral-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-neutral-800/60 rounded-md transition-colors font-mono">
                                <span class="size-1 rounded-full bg-neutral-400 dark:bg-neutral-500 shrink-0"></span>
                                <span class="truncate">document_types</span>
                              </A>
                            </li>
                            <li>
                              <A href="/academic/candidate/reference/phases" class="flex items-center gap-2 py-1 px-2 text-xs text-neutral-600 dark:text-neutral-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-neutral-800/60 rounded-md transition-colors font-mono">
                                <span class="size-1 rounded-full bg-neutral-400 dark:bg-neutral-500 shrink-0"></span>
                                <span class="truncate">phases</span>
                              </A>
                            </li>
                            <li>
                              <A href="/academic/candidate/reference/registration_categories" class="flex items-center gap-2 py-1 px-2 text-xs text-neutral-600 dark:text-neutral-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-neutral-800/60 rounded-md transition-colors font-mono">
                                <span class="size-1 rounded-full bg-neutral-400 dark:bg-neutral-500 shrink-0"></span>
                                <span class="truncate">registration_categories</span>
                              </A>
                            </li>
                            <li>
                              <A href="/academic/candidate/reference/registration_types" class="flex items-center gap-2 py-1 px-2 text-xs text-neutral-600 dark:text-neutral-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-neutral-800/60 rounded-md transition-colors font-mono">
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
                              <A href="/academic/candidate/transaction/candidate_unit_choices" class="flex items-center gap-2 py-1 px-2 text-xs text-neutral-600 dark:text-neutral-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-neutral-800/60 rounded-md transition-colors font-mono">
                                <span class="size-1 rounded-full bg-neutral-400 dark:bg-neutral-500 shrink-0"></span>
                                <span class="truncate">candidate_unit_choices</span>
                              </A>
                            </li>
                            <li>
                              <A href="/academic/candidate/transaction/documents" class="flex items-center gap-2 py-1 px-2 text-xs text-neutral-600 dark:text-neutral-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-neutral-800/60 rounded-md transition-colors font-mono">
                                <span class="size-1 rounded-full bg-neutral-400 dark:bg-neutral-500 shrink-0"></span>
                                <span class="truncate">documents</span>
                              </A>
                            </li>
                            <li>
                              <A href="/academic/candidate/transaction/exams" class="flex items-center gap-2 py-1 px-2 text-xs text-neutral-600 dark:text-neutral-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-neutral-800/60 rounded-md transition-colors font-mono">
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
                              <A href="/academic/course/master/concentrations" class="flex items-center gap-2 py-1 px-2 text-xs text-neutral-600 dark:text-neutral-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-neutral-800/60 rounded-md transition-colors font-mono">
                                <span class="size-1 rounded-full bg-neutral-400 dark:bg-neutral-500 shrink-0"></span>
                                <span class="truncate">concentrations</span>
                              </A>
                            </li>
                            <li>
                              <A href="/academic/course/master/course_evaluation_plannings" class="flex items-center gap-2 py-1 px-2 text-xs text-neutral-600 dark:text-neutral-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-neutral-800/60 rounded-md transition-colors font-mono">
                                <span class="size-1 rounded-full bg-neutral-400 dark:bg-neutral-500 shrink-0"></span>
                                <span class="truncate">course_evaluation_plannings</span>
                              </A>
                            </li>
                            <li>
                              <A href="/academic/course/master/course_learn_plannings" class="flex items-center gap-2 py-1 px-2 text-xs text-neutral-600 dark:text-neutral-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-neutral-800/60 rounded-md transition-colors font-mono">
                                <span class="size-1 rounded-full bg-neutral-400 dark:bg-neutral-500 shrink-0"></span>
                                <span class="truncate">course_learn_plannings</span>
                              </A>
                            </li>
                            <li>
                              <A href="/academic/course/master/courses" class="flex items-center gap-2 py-1 px-2 text-xs text-neutral-600 dark:text-neutral-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-neutral-800/60 rounded-md transition-colors font-mono">
                                <span class="size-1 rounded-full bg-neutral-400 dark:bg-neutral-500 shrink-0"></span>
                                <span class="truncate">courses</span>
                              </A>
                            </li>
                            <li>
                              <A href="/academic/course/master/curriculum_details" class="flex items-center gap-2 py-1 px-2 text-xs text-neutral-600 dark:text-neutral-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-neutral-800/60 rounded-md transition-colors font-mono">
                                <span class="size-1 rounded-full bg-neutral-400 dark:bg-neutral-500 shrink-0"></span>
                                <span class="truncate">curriculum_details</span>
                              </A>
                            </li>
                            <li>
                              <A href="/academic/course/master/curriculums" class="flex items-center gap-2 py-1 px-2 text-xs text-neutral-600 dark:text-neutral-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-neutral-800/60 rounded-md transition-colors font-mono">
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
                              <A href="/academic/course/reference/competences" class="flex items-center gap-2 py-1 px-2 text-xs text-neutral-600 dark:text-neutral-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-neutral-800/60 rounded-md transition-colors font-mono">
                                <span class="size-1 rounded-full bg-neutral-400 dark:bg-neutral-500 shrink-0"></span>
                                <span class="truncate">competences</span>
                              </A>
                            </li>
                            <li>
                              <A href="/academic/course/reference/course_evaluation_bases" class="flex items-center gap-2 py-1 px-2 text-xs text-neutral-600 dark:text-neutral-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-neutral-800/60 rounded-md transition-colors font-mono">
                                <span class="size-1 rounded-full bg-neutral-400 dark:bg-neutral-500 shrink-0"></span>
                                <span class="truncate">course_evaluation_bases</span>
                              </A>
                            </li>
                            <li>
                              <A href="/academic/course/reference/curriculum_types" class="flex items-center gap-2 py-1 px-2 text-xs text-neutral-600 dark:text-neutral-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-neutral-800/60 rounded-md transition-colors font-mono">
                                <span class="size-1 rounded-full bg-neutral-400 dark:bg-neutral-500 shrink-0"></span>
                                <span class="truncate">curriculum_types</span>
                              </A>
                            </li>
                            <li>
                              <A href="/academic/course/reference/encounter_types" class="flex items-center gap-2 py-1 px-2 text-xs text-neutral-600 dark:text-neutral-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-neutral-800/60 rounded-md transition-colors font-mono">
                                <span class="size-1 rounded-full bg-neutral-400 dark:bg-neutral-500 shrink-0"></span>
                                <span class="truncate">encounter_types</span>
                              </A>
                            </li>
                            <li>
                              <A href="/academic/course/reference/evaluation_types" class="flex items-center gap-2 py-1 px-2 text-xs text-neutral-600 dark:text-neutral-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-neutral-800/60 rounded-md transition-colors font-mono">
                                <span class="size-1 rounded-full bg-neutral-400 dark:bg-neutral-500 shrink-0"></span>
                                <span class="truncate">evaluation_types</span>
                              </A>
                            </li>
                            <li>
                              <A href="/academic/course/reference/groups" class="flex items-center gap-2 py-1 px-2 text-xs text-neutral-600 dark:text-neutral-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-neutral-800/60 rounded-md transition-colors font-mono">
                                <span class="size-1 rounded-full bg-neutral-400 dark:bg-neutral-500 shrink-0"></span>
                                <span class="truncate">groups</span>
                              </A>
                            </li>
                            <li>
                              <A href="/academic/course/reference/semesters" class="flex items-center gap-2 py-1 px-2 text-xs text-neutral-600 dark:text-neutral-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-neutral-800/60 rounded-md transition-colors font-mono">
                                <span class="size-1 rounded-full bg-neutral-400 dark:bg-neutral-500 shrink-0"></span>
                                <span class="truncate">semesters</span>
                              </A>
                            </li>
                            <li>
                              <A href="/academic/course/reference/varieties" class="flex items-center gap-2 py-1 px-2 text-xs text-neutral-600 dark:text-neutral-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-neutral-800/60 rounded-md transition-colors font-mono">
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
                              <A href="/academic/general/reference/academic_year_categories" class="flex items-center gap-2 py-1 px-2 text-xs text-neutral-600 dark:text-neutral-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-neutral-800/60 rounded-md transition-colors font-mono">
                                <span class="size-1 rounded-full bg-neutral-400 dark:bg-neutral-500 shrink-0"></span>
                                <span class="truncate">academic_year_categories</span>
                              </A>
                            </li>
                            <li>
                              <A href="/academic/general/reference/academic_years" class="flex items-center gap-2 py-1 px-2 text-xs text-neutral-600 dark:text-neutral-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-neutral-800/60 rounded-md transition-colors font-mono">
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
                              <A href="/academic/lecturer/master/lecturers" class="flex items-center gap-2 py-1 px-2 text-xs text-neutral-600 dark:text-neutral-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-neutral-800/60 rounded-md transition-colors font-mono">
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
                              <A href="/academic/lecturer/reference/contracts" class="flex items-center gap-2 py-1 px-2 text-xs text-neutral-600 dark:text-neutral-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-neutral-800/60 rounded-md transition-colors font-mono">
                                <span class="size-1 rounded-full bg-neutral-400 dark:bg-neutral-500 shrink-0"></span>
                                <span class="truncate">contracts</span>
                              </A>
                            </li>
                            <li>
                              <A href="/academic/lecturer/reference/groups" class="flex items-center gap-2 py-1 px-2 text-xs text-neutral-600 dark:text-neutral-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-neutral-800/60 rounded-md transition-colors font-mono">
                                <span class="size-1 rounded-full bg-neutral-400 dark:bg-neutral-500 shrink-0"></span>
                                <span class="truncate">groups</span>
                              </A>
                            </li>
                            <li>
                              <A href="/academic/lecturer/reference/ranks" class="flex items-center gap-2 py-1 px-2 text-xs text-neutral-600 dark:text-neutral-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-neutral-800/60 rounded-md transition-colors font-mono">
                                <span class="size-1 rounded-full bg-neutral-400 dark:bg-neutral-500 shrink-0"></span>
                                <span class="truncate">ranks</span>
                              </A>
                            </li>
                            <li>
                              <A href="/academic/lecturer/reference/statuses" class="flex items-center gap-2 py-1 px-2 text-xs text-neutral-600 dark:text-neutral-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-neutral-800/60 rounded-md transition-colors font-mono">
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
                              <A href="/academic/lecturer/transaction/academic_groups" class="flex items-center gap-2 py-1 px-2 text-xs text-neutral-600 dark:text-neutral-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-neutral-800/60 rounded-md transition-colors font-mono">
                                <span class="size-1 rounded-full bg-neutral-400 dark:bg-neutral-500 shrink-0"></span>
                                <span class="truncate">academic_groups</span>
                              </A>
                            </li>
                            <li>
                              <A href="/academic/lecturer/transaction/academic_ranks" class="flex items-center gap-2 py-1 px-2 text-xs text-neutral-600 dark:text-neutral-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-neutral-800/60 rounded-md transition-colors font-mono">
                                <span class="size-1 rounded-full bg-neutral-400 dark:bg-neutral-500 shrink-0"></span>
                                <span class="truncate">academic_ranks</span>
                              </A>
                            </li>
                            <li>
                              <A href="/academic/lecturer/transaction/homebases" class="flex items-center gap-2 py-1 px-2 text-xs text-neutral-600 dark:text-neutral-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-neutral-800/60 rounded-md transition-colors font-mono">
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
                              <A href="/academic/prior_learning_recognition/reference/evaluator_types" class="flex items-center gap-2 py-1 px-2 text-xs text-neutral-600 dark:text-neutral-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-neutral-800/60 rounded-md transition-colors font-mono">
                                <span class="size-1 rounded-full bg-neutral-400 dark:bg-neutral-500 shrink-0"></span>
                                <span class="truncate">evaluator_types</span>
                              </A>
                            </li>
                            <li>
                              <A href="/academic/prior_learning_recognition/reference/evidence_categories" class="flex items-center gap-2 py-1 px-2 text-xs text-neutral-600 dark:text-neutral-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-neutral-800/60 rounded-md transition-colors font-mono">
                                <span class="size-1 rounded-full bg-neutral-400 dark:bg-neutral-500 shrink-0"></span>
                                <span class="truncate">evidence_categories</span>
                              </A>
                            </li>
                            <li>
                              <A href="/academic/prior_learning_recognition/reference/evidence_types" class="flex items-center gap-2 py-1 px-2 text-xs text-neutral-600 dark:text-neutral-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-neutral-800/60 rounded-md transition-colors font-mono">
                                <span class="size-1 rounded-full bg-neutral-400 dark:bg-neutral-500 shrink-0"></span>
                                <span class="truncate">evidence_types</span>
                              </A>
                            </li>
                            <li>
                              <A href="/academic/prior_learning_recognition/reference/professionalisms" class="flex items-center gap-2 py-1 px-2 text-xs text-neutral-600 dark:text-neutral-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-neutral-800/60 rounded-md transition-colors font-mono">
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
                              <A href="/academic/prior_learning_recognition/transaction/decrees" class="flex items-center gap-2 py-1 px-2 text-xs text-neutral-600 dark:text-neutral-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-neutral-800/60 rounded-md transition-colors font-mono">
                                <span class="size-1 rounded-full bg-neutral-400 dark:bg-neutral-500 shrink-0"></span>
                                <span class="truncate">decrees</span>
                              </A>
                            </li>
                            <li>
                              <A href="/academic/prior_learning_recognition/transaction/evaluation_details" class="flex items-center gap-2 py-1 px-2 text-xs text-neutral-600 dark:text-neutral-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-neutral-800/60 rounded-md transition-colors font-mono">
                                <span class="size-1 rounded-full bg-neutral-400 dark:bg-neutral-500 shrink-0"></span>
                                <span class="truncate">evaluation_details</span>
                              </A>
                            </li>
                            <li>
                              <A href="/academic/prior_learning_recognition/transaction/evaluations" class="flex items-center gap-2 py-1 px-2 text-xs text-neutral-600 dark:text-neutral-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-neutral-800/60 rounded-md transition-colors font-mono">
                                <span class="size-1 rounded-full bg-neutral-400 dark:bg-neutral-500 shrink-0"></span>
                                <span class="truncate">evaluations</span>
                              </A>
                            </li>
                            <li>
                              <A href="/academic/prior_learning_recognition/transaction/evaluators" class="flex items-center gap-2 py-1 px-2 text-xs text-neutral-600 dark:text-neutral-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-neutral-800/60 rounded-md transition-colors font-mono">
                                <span class="size-1 rounded-full bg-neutral-400 dark:bg-neutral-500 shrink-0"></span>
                                <span class="truncate">evaluators</span>
                              </A>
                            </li>
                            <li>
                              <A href="/academic/prior_learning_recognition/transaction/recognitions" class="flex items-center gap-2 py-1 px-2 text-xs text-neutral-600 dark:text-neutral-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-neutral-800/60 rounded-md transition-colors font-mono">
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
                              <A href="/academic/student/adviser/counsellors" class="flex items-center gap-2 py-1 px-2 text-xs text-neutral-600 dark:text-neutral-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-neutral-800/60 rounded-md transition-colors font-mono">
                                <span class="size-1 rounded-full bg-neutral-400 dark:bg-neutral-500 shrink-0"></span>
                                <span class="truncate">counsellors</span>
                              </A>
                            </li>
                            <li>
                              <A href="/academic/student/adviser/decrees" class="flex items-center gap-2 py-1 px-2 text-xs text-neutral-600 dark:text-neutral-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-neutral-800/60 rounded-md transition-colors font-mono">
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
                              <A href="/academic/student/campaign/convertions" class="flex items-center gap-2 py-1 px-2 text-xs text-neutral-600 dark:text-neutral-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-neutral-800/60 rounded-md transition-colors font-mono">
                                <span class="size-1 rounded-full bg-neutral-400 dark:bg-neutral-500 shrink-0"></span>
                                <span class="truncate">convertions</span>
                              </A>
                            </li>
                            <li>
                              <A href="/academic/student/campaign/detail_activities" class="flex items-center gap-2 py-1 px-2 text-xs text-neutral-600 dark:text-neutral-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-neutral-800/60 rounded-md transition-colors font-mono">
                                <span class="size-1 rounded-full bg-neutral-400 dark:bg-neutral-500 shrink-0"></span>
                                <span class="truncate">detail_activities</span>
                              </A>
                            </li>
                            <li>
                              <A href="/academic/student/campaign/detail_activity_evaluation_components" class="flex items-center gap-2 py-1 px-2 text-xs text-neutral-600 dark:text-neutral-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-neutral-800/60 rounded-md transition-colors font-mono">
                                <span class="size-1 rounded-full bg-neutral-400 dark:bg-neutral-500 shrink-0"></span>
                                <span class="truncate">detail_activity_evaluation_components</span>
                              </A>
                            </li>
                            <li>
                              <A href="/academic/student/campaign/student_activities" class="flex items-center gap-2 py-1 px-2 text-xs text-neutral-600 dark:text-neutral-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-neutral-800/60 rounded-md transition-colors font-mono">
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
                                      <A href="/academic/student/final_assignment/reference/adviser_categories" class="flex items-center gap-2 py-1 px-2 text-xs text-neutral-600 dark:text-neutral-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-neutral-800/60 rounded-md transition-colors font-mono">
                                        <span class="size-1 rounded-full bg-neutral-400 dark:bg-neutral-500 shrink-0"></span>
                                        <span class="truncate">adviser_categories</span>
                                      </A>
                                    </li>
                                    <li>
                                      <A href="/academic/student/final_assignment/reference/approval_types" class="flex items-center gap-2 py-1 px-2 text-xs text-neutral-600 dark:text-neutral-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-neutral-800/60 rounded-md transition-colors font-mono">
                                        <span class="size-1 rounded-full bg-neutral-400 dark:bg-neutral-500 shrink-0"></span>
                                        <span class="truncate">approval_types</span>
                                      </A>
                                    </li>
                                    <li>
                                      <A href="/academic/student/final_assignment/reference/categories" class="flex items-center gap-2 py-1 px-2 text-xs text-neutral-600 dark:text-neutral-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-neutral-800/60 rounded-md transition-colors font-mono">
                                        <span class="size-1 rounded-full bg-neutral-400 dark:bg-neutral-500 shrink-0"></span>
                                        <span class="truncate">categories</span>
                                      </A>
                                    </li>
                                    <li>
                                      <A href="/academic/student/final_assignment/reference/requirements" class="flex items-center gap-2 py-1 px-2 text-xs text-neutral-600 dark:text-neutral-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-neutral-800/60 rounded-md transition-colors font-mono">
                                        <span class="size-1 rounded-full bg-neutral-400 dark:bg-neutral-500 shrink-0"></span>
                                        <span class="truncate">requirements</span>
                                      </A>
                                    </li>
                                    <li>
                                      <A href="/academic/student/final_assignment/reference/stages" class="flex items-center gap-2 py-1 px-2 text-xs text-neutral-600 dark:text-neutral-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-neutral-800/60 rounded-md transition-colors font-mono">
                                        <span class="size-1 rounded-full bg-neutral-400 dark:bg-neutral-500 shrink-0"></span>
                                        <span class="truncate">stages</span>
                                      </A>
                                    </li>
                                    <li>
                                      <A href="/academic/student/final_assignment/reference/varieties" class="flex items-center gap-2 py-1 px-2 text-xs text-neutral-600 dark:text-neutral-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-neutral-800/60 rounded-md transition-colors font-mono">
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
                                      <A href="/academic/student/final_assignment/transaction/advisers" class="flex items-center gap-2 py-1 px-2 text-xs text-neutral-600 dark:text-neutral-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-neutral-800/60 rounded-md transition-colors font-mono">
                                        <span class="size-1 rounded-full bg-neutral-400 dark:bg-neutral-500 shrink-0"></span>
                                        <span class="truncate">advisers</span>
                                      </A>
                                    </li>
                                    <li>
                                      <A href="/academic/student/final_assignment/transaction/evaluation_details" class="flex items-center gap-2 py-1 px-2 text-xs text-neutral-600 dark:text-neutral-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-neutral-800/60 rounded-md transition-colors font-mono">
                                        <span class="size-1 rounded-full bg-neutral-400 dark:bg-neutral-500 shrink-0"></span>
                                        <span class="truncate">evaluation_details</span>
                                      </A>
                                    </li>
                                    <li>
                                      <A href="/academic/student/final_assignment/transaction/evaluation_summaries" class="flex items-center gap-2 py-1 px-2 text-xs text-neutral-600 dark:text-neutral-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-neutral-800/60 rounded-md transition-colors font-mono">
                                        <span class="size-1 rounded-full bg-neutral-400 dark:bg-neutral-500 shrink-0"></span>
                                        <span class="truncate">evaluation_summaries</span>
                                      </A>
                                    </li>
                                    <li>
                                      <A href="/academic/student/final_assignment/transaction/final_assignment_decrees" class="flex items-center gap-2 py-1 px-2 text-xs text-neutral-600 dark:text-neutral-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-neutral-800/60 rounded-md transition-colors font-mono">
                                        <span class="size-1 rounded-full bg-neutral-400 dark:bg-neutral-500 shrink-0"></span>
                                        <span class="truncate">final_assignment_decrees</span>
                                      </A>
                                    </li>
                                    <li>
                                      <A href="/academic/student/final_assignment/transaction/prerequisites" class="flex items-center gap-2 py-1 px-2 text-xs text-neutral-600 dark:text-neutral-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-neutral-800/60 rounded-md transition-colors font-mono">
                                        <span class="size-1 rounded-full bg-neutral-400 dark:bg-neutral-500 shrink-0"></span>
                                        <span class="truncate">prerequisites</span>
                                      </A>
                                    </li>
                                    <li>
                                      <A href="/academic/student/final_assignment/transaction/schedules" class="flex items-center gap-2 py-1 px-2 text-xs text-neutral-600 dark:text-neutral-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-neutral-800/60 rounded-md transition-colors font-mono">
                                        <span class="size-1 rounded-full bg-neutral-400 dark:bg-neutral-500 shrink-0"></span>
                                        <span class="truncate">schedules</span>
                                      </A>
                                    </li>
                                    <li>
                                      <A href="/academic/student/final_assignment/transaction/submissions" class="flex items-center gap-2 py-1 px-2 text-xs text-neutral-600 dark:text-neutral-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-neutral-800/60 rounded-md transition-colors font-mono">
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
                              <A href="/academic/student/master/images" class="flex items-center gap-2 py-1 px-2 text-xs text-neutral-600 dark:text-neutral-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-neutral-800/60 rounded-md transition-colors font-mono">
                                <span class="size-1 rounded-full bg-neutral-400 dark:bg-neutral-500 shrink-0"></span>
                                <span class="truncate">images</span>
                              </A>
                            </li>
                            <li>
                              <A href="/academic/student/master/students" class="flex items-center gap-2 py-1 px-2 text-xs text-neutral-600 dark:text-neutral-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-neutral-800/60 rounded-md transition-colors font-mono">
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
                              <A href="/academic/student/reference/finances" class="flex items-center gap-2 py-1 px-2 text-xs text-neutral-600 dark:text-neutral-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-neutral-800/60 rounded-md transition-colors font-mono">
                                <span class="size-1 rounded-full bg-neutral-400 dark:bg-neutral-500 shrink-0"></span>
                                <span class="truncate">finances</span>
                              </A>
                            </li>
                            <li>
                              <A href="/academic/student/reference/registrations" class="flex items-center gap-2 py-1 px-2 text-xs text-neutral-600 dark:text-neutral-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-neutral-800/60 rounded-md transition-colors font-mono">
                                <span class="size-1 rounded-full bg-neutral-400 dark:bg-neutral-500 shrink-0"></span>
                                <span class="truncate">registrations</span>
                              </A>
                            </li>
                            <li>
                              <A href="/academic/student/reference/resign_statuses" class="flex items-center gap-2 py-1 px-2 text-xs text-neutral-600 dark:text-neutral-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-neutral-800/60 rounded-md transition-colors font-mono">
                                <span class="size-1 rounded-full bg-neutral-400 dark:bg-neutral-500 shrink-0"></span>
                                <span class="truncate">resign_statuses</span>
                              </A>
                            </li>
                            <li>
                              <A href="/academic/student/reference/selection_types" class="flex items-center gap-2 py-1 px-2 text-xs text-neutral-600 dark:text-neutral-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-neutral-800/60 rounded-md transition-colors font-mono">
                                <span class="size-1 rounded-full bg-neutral-400 dark:bg-neutral-500 shrink-0"></span>
                                <span class="truncate">selection_types</span>
                              </A>
                            </li>
                            <li>
                              <A href="/academic/student/reference/statuses" class="flex items-center gap-2 py-1 px-2 text-xs text-neutral-600 dark:text-neutral-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-neutral-800/60 rounded-md transition-colors font-mono">
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
                              <A href="/academic/survey/master/answers" class="flex items-center gap-2 py-1 px-2 text-xs text-neutral-600 dark:text-neutral-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-neutral-800/60 rounded-md transition-colors font-mono">
                                <span class="size-1 rounded-full bg-neutral-400 dark:bg-neutral-500 shrink-0"></span>
                                <span class="truncate">answers</span>
                              </A>
                            </li>
                            <li>
                              <A href="/academic/survey/master/bundle_question" class="flex items-center gap-2 py-1 px-2 text-xs text-neutral-600 dark:text-neutral-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-neutral-800/60 rounded-md transition-colors font-mono">
                                <span class="size-1 rounded-full bg-neutral-400 dark:bg-neutral-500 shrink-0"></span>
                                <span class="truncate">bundle_question</span>
                              </A>
                            </li>
                            <li>
                              <A href="/academic/survey/master/bundles" class="flex items-center gap-2 py-1 px-2 text-xs text-neutral-600 dark:text-neutral-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-neutral-800/60 rounded-md transition-colors font-mono">
                                <span class="size-1 rounded-full bg-neutral-400 dark:bg-neutral-500 shrink-0"></span>
                                <span class="truncate">bundles</span>
                              </A>
                            </li>
                            <li>
                              <A href="/academic/survey/master/questions" class="flex items-center gap-2 py-1 px-2 text-xs text-neutral-600 dark:text-neutral-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-neutral-800/60 rounded-md transition-colors font-mono">
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
                              <A href="/academic/survey/reference/bundle_categories" class="flex items-center gap-2 py-1 px-2 text-xs text-neutral-600 dark:text-neutral-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-neutral-800/60 rounded-md transition-colors font-mono">
                                <span class="size-1 rounded-full bg-neutral-400 dark:bg-neutral-500 shrink-0"></span>
                                <span class="truncate">bundle_categories</span>
                              </A>
                            </li>
                            <li>
                              <A href="/academic/survey/reference/question_varieties" class="flex items-center gap-2 py-1 px-2 text-xs text-neutral-600 dark:text-neutral-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-neutral-800/60 rounded-md transition-colors font-mono">
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
                              <A href="/academic/survey/transaction/conducts" class="flex items-center gap-2 py-1 px-2 text-xs text-neutral-600 dark:text-neutral-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-neutral-800/60 rounded-md transition-colors font-mono">
                                <span class="size-1 rounded-full bg-neutral-400 dark:bg-neutral-500 shrink-0"></span>
                                <span class="truncate">conducts</span>
                              </A>
                            </li>
                            <li>
                              <A href="/academic/survey/transaction/responds" class="flex items-center gap-2 py-1 px-2 text-xs text-neutral-600 dark:text-neutral-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-neutral-800/60 rounded-md transition-colors font-mono">
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
              <A href="/auth/permission_role" class="flex items-center gap-2 py-1 px-2 text-xs text-neutral-600 dark:text-neutral-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-neutral-800/60 rounded-md transition-colors font-mono">
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
                      <A href="/building/master/buildings" class="flex items-center gap-2 py-1 px-2 text-xs text-neutral-600 dark:text-neutral-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-neutral-800/60 rounded-md transition-colors font-mono">
                        <span class="size-1 rounded-full bg-neutral-400 dark:bg-neutral-500 shrink-0"></span>
                        <span class="truncate">buildings</span>
                      </A>
                    </li>
                    <li>
                      <A href="/building/master/rooms" class="flex items-center gap-2 py-1 px-2 text-xs text-neutral-600 dark:text-neutral-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-neutral-800/60 rounded-md transition-colors font-mono">
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
                      <A href="/building/reference/categories" class="flex items-center gap-2 py-1 px-2 text-xs text-neutral-600 dark:text-neutral-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-neutral-800/60 rounded-md transition-colors font-mono">
                        <span class="size-1 rounded-full bg-neutral-400 dark:bg-neutral-500 shrink-0"></span>
                        <span class="truncate">categories</span>
                      </A>
                    </li>
                    <li>
                      <A href="/building/reference/conditions" class="flex items-center gap-2 py-1 px-2 text-xs text-neutral-600 dark:text-neutral-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-neutral-800/60 rounded-md transition-colors font-mono">
                        <span class="size-1 rounded-full bg-neutral-400 dark:bg-neutral-500 shrink-0"></span>
                        <span class="truncate">conditions</span>
                      </A>
                    </li>
                    <li>
                      <A href="/building/reference/room_types" class="flex items-center gap-2 py-1 px-2 text-xs text-neutral-600 dark:text-neutral-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-neutral-800/60 rounded-md transition-colors font-mono">
                        <span class="size-1 rounded-full bg-neutral-400 dark:bg-neutral-500 shrink-0"></span>
                        <span class="truncate">room_types</span>
                      </A>
                    </li>
                    <li>
                      <A href="/building/reference/varieties" class="flex items-center gap-2 py-1 px-2 text-xs text-neutral-600 dark:text-neutral-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-neutral-800/60 rounded-md transition-colors font-mono">
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
                      <A href="/contact/master/electronic_mails" class="flex items-center gap-2 py-1 px-2 text-xs text-neutral-600 dark:text-neutral-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-neutral-800/60 rounded-md transition-colors font-mono">
                        <span class="size-1 rounded-full bg-neutral-400 dark:bg-neutral-500 shrink-0"></span>
                        <span class="truncate">electronic_mails</span>
                      </A>
                    </li>
                    <li>
                      <A href="/contact/master/phones" class="flex items-center gap-2 py-1 px-2 text-xs text-neutral-600 dark:text-neutral-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-neutral-800/60 rounded-md transition-colors font-mono">
                        <span class="size-1 rounded-full bg-neutral-400 dark:bg-neutral-500 shrink-0"></span>
                        <span class="truncate">phones</span>
                      </A>
                    </li>
                    <li>
                      <A href="/contact/master/residences" class="flex items-center gap-2 py-1 px-2 text-xs text-neutral-600 dark:text-neutral-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-neutral-800/60 rounded-md transition-colors font-mono">
                        <span class="size-1 rounded-full bg-neutral-400 dark:bg-neutral-500 shrink-0"></span>
                        <span class="truncate">residences</span>
                      </A>
                    </li>
                    <li>
                      <A href="/contact/master/websites" class="flex items-center gap-2 py-1 px-2 text-xs text-neutral-600 dark:text-neutral-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-neutral-800/60 rounded-md transition-colors font-mono">
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
                      <A href="/contact/reference/electronic_mail_types" class="flex items-center gap-2 py-1 px-2 text-xs text-neutral-600 dark:text-neutral-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-neutral-800/60 rounded-md transition-colors font-mono">
                        <span class="size-1 rounded-full bg-neutral-400 dark:bg-neutral-500 shrink-0"></span>
                        <span class="truncate">electronic_mail_types</span>
                      </A>
                    </li>
                    <li>
                      <A href="/contact/reference/phone_types" class="flex items-center gap-2 py-1 px-2 text-xs text-neutral-600 dark:text-neutral-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-neutral-800/60 rounded-md transition-colors font-mono">
                        <span class="size-1 rounded-full bg-neutral-400 dark:bg-neutral-500 shrink-0"></span>
                        <span class="truncate">phone_types</span>
                      </A>
                    </li>
                    <li>
                      <A href="/contact/reference/residence_types" class="flex items-center gap-2 py-1 px-2 text-xs text-neutral-600 dark:text-neutral-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-neutral-800/60 rounded-md transition-colors font-mono">
                        <span class="size-1 rounded-full bg-neutral-400 dark:bg-neutral-500 shrink-0"></span>
                        <span class="truncate">residence_types</span>
                      </A>
                    </li>
                    <li>
                      <A href="/contact/reference/website_types" class="flex items-center gap-2 py-1 px-2 text-xs text-neutral-600 dark:text-neutral-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-neutral-800/60 rounded-md transition-colors font-mono">
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
                      <A href="/document/reference/archive_types" class="flex items-center gap-2 py-1 px-2 text-xs text-neutral-600 dark:text-neutral-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-neutral-800/60 rounded-md transition-colors font-mono">
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
                      <A href="/document/transaction/archives" class="flex items-center gap-2 py-1 px-2 text-xs text-neutral-600 dark:text-neutral-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-neutral-800/60 rounded-md transition-colors font-mono">
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
                      <A href="/feeder/akumulasi/jumlah_data" class="flex items-center gap-2 py-1 px-2 text-xs text-neutral-600 dark:text-neutral-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-neutral-800/60 rounded-md transition-colors font-mono">
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
                      <A href="/feeder/master/aktifitas_kuliah_mahasiswa" class="flex items-center gap-2 py-1 px-2 text-xs text-neutral-600 dark:text-neutral-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-neutral-800/60 rounded-md transition-colors font-mono">
                        <span class="size-1 rounded-full bg-neutral-400 dark:bg-neutral-500 shrink-0"></span>
                        <span class="truncate">aktifitas_kuliah_mahasiswa</span>
                      </A>
                    </li>
                    <li>
                      <A href="/feeder/master/aktifitas_mahasiswa" class="flex items-center gap-2 py-1 px-2 text-xs text-neutral-600 dark:text-neutral-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-neutral-800/60 rounded-md transition-colors font-mono">
                        <span class="size-1 rounded-full bg-neutral-400 dark:bg-neutral-500 shrink-0"></span>
                        <span class="truncate">aktifitas_mahasiswa</span>
                      </A>
                    </li>
                    <li>
                      <A href="/feeder/master/aktifitas_mengajar_dosen" class="flex items-center gap-2 py-1 px-2 text-xs text-neutral-600 dark:text-neutral-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-neutral-800/60 rounded-md transition-colors font-mono">
                        <span class="size-1 rounded-full bg-neutral-400 dark:bg-neutral-500 shrink-0"></span>
                        <span class="truncate">aktifitas_mengajar_dosen</span>
                      </A>
                    </li>
                    <li>
                      <A href="/feeder/master/anggota_aktifitas_mahasiswa" class="flex items-center gap-2 py-1 px-2 text-xs text-neutral-600 dark:text-neutral-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-neutral-800/60 rounded-md transition-colors font-mono">
                        <span class="size-1 rounded-full bg-neutral-400 dark:bg-neutral-500 shrink-0"></span>
                        <span class="truncate">anggota_aktifitas_mahasiswa</span>
                      </A>
                    </li>
                    <li>
                      <A href="/feeder/master/bidang_minat_perguruan_tinggi" class="flex items-center gap-2 py-1 px-2 text-xs text-neutral-600 dark:text-neutral-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-neutral-800/60 rounded-md transition-colors font-mono">
                        <span class="size-1 rounded-full bg-neutral-400 dark:bg-neutral-500 shrink-0"></span>
                        <span class="truncate">bidang_minat_perguruan_tinggi</span>
                      </A>
                    </li>
                    <li>
                      <A href="/feeder/master/bimbing_mahasiswa" class="flex items-center gap-2 py-1 px-2 text-xs text-neutral-600 dark:text-neutral-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-neutral-800/60 rounded-md transition-colors font-mono">
                        <span class="size-1 rounded-full bg-neutral-400 dark:bg-neutral-500 shrink-0"></span>
                        <span class="truncate">bimbing_mahasiswa</span>
                      </A>
                    </li>
                    <li>
                      <A href="/feeder/master/biodata_dosen" class="flex items-center gap-2 py-1 px-2 text-xs text-neutral-600 dark:text-neutral-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-neutral-800/60 rounded-md transition-colors font-mono">
                        <span class="size-1 rounded-full bg-neutral-400 dark:bg-neutral-500 shrink-0"></span>
                        <span class="truncate">biodata_dosen</span>
                      </A>
                    </li>
                    <li>
                      <A href="/feeder/master/biodata_mahasiswa" class="flex items-center gap-2 py-1 px-2 text-xs text-neutral-600 dark:text-neutral-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-neutral-800/60 rounded-md transition-colors font-mono">
                        <span class="size-1 rounded-full bg-neutral-400 dark:bg-neutral-500 shrink-0"></span>
                        <span class="truncate">biodata_mahasiswa</span>
                      </A>
                    </li>
                    <li>
                      <A href="/feeder/master/detail_nilai_perkuliahan_kelas" class="flex items-center gap-2 py-1 px-2 text-xs text-neutral-600 dark:text-neutral-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-neutral-800/60 rounded-md transition-colors font-mono">
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
                      <A href="/feeder/master/dosen_pembimbing" class="flex items-center gap-2 py-1 px-2 text-xs text-neutral-600 dark:text-neutral-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-neutral-800/60 rounded-md transition-colors font-mono">
                        <span class="size-1 rounded-full bg-neutral-400 dark:bg-neutral-500 shrink-0"></span>
                        <span class="truncate">dosen_pembimbing</span>
                      </A>
                    </li>
                    <li>
                      <A href="/feeder/master/dosen_pengajar_kelas_kuliah" class="flex items-center gap-2 py-1 px-2 text-xs text-neutral-600 dark:text-neutral-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-neutral-800/60 rounded-md transition-colors font-mono">
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
                      <A href="/feeder/master/hitung_transkrip_angkatan_mahasiswa" class="flex items-center gap-2 py-1 px-2 text-xs text-neutral-600 dark:text-neutral-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-neutral-800/60 rounded-md transition-colors font-mono">
                        <span class="size-1 rounded-full bg-neutral-400 dark:bg-neutral-500 shrink-0"></span>
                        <span class="truncate">hitung_transkrip_angkatan_mahasiswa</span>
                      </A>
                    </li>
                    <li>
                      <A href="/feeder/master/kartu_rencana_studi_mahasiswa" class="flex items-center gap-2 py-1 px-2 text-xs text-neutral-600 dark:text-neutral-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-neutral-800/60 rounded-md transition-colors font-mono">
                        <span class="size-1 rounded-full bg-neutral-400 dark:bg-neutral-500 shrink-0"></span>
                        <span class="truncate">kartu_rencana_studi_mahasiswa</span>
                      </A>
                    </li>
                    <li>
                      <A href="/feeder/master/kelas_kuliah" class="flex items-center gap-2 py-1 px-2 text-xs text-neutral-600 dark:text-neutral-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-neutral-800/60 rounded-md transition-colors font-mono">
                        <span class="size-1 rounded-full bg-neutral-400 dark:bg-neutral-500 shrink-0"></span>
                        <span class="truncate">kelas_kuliah</span>
                      </A>
                    </li>
                    <li>
                      <A href="/feeder/master/komponen_evaluasi_kelas" class="flex items-center gap-2 py-1 px-2 text-xs text-neutral-600 dark:text-neutral-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-neutral-800/60 rounded-md transition-colors font-mono">
                        <span class="size-1 rounded-full bg-neutral-400 dark:bg-neutral-500 shrink-0"></span>
                        <span class="truncate">komponen_evaluasi_kelas</span>
                      </A>
                    </li>
                    <li>
                      <A href="/feeder/master/konsistensi_data" class="flex items-center gap-2 py-1 px-2 text-xs text-neutral-600 dark:text-neutral-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-neutral-800/60 rounded-md transition-colors font-mono">
                        <span class="size-1 rounded-full bg-neutral-400 dark:bg-neutral-500 shrink-0"></span>
                        <span class="truncate">konsistensi_data</span>
                      </A>
                    </li>
                    <li>
                      <A href="/feeder/master/konversi_kampus_merdeka" class="flex items-center gap-2 py-1 px-2 text-xs text-neutral-600 dark:text-neutral-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-neutral-800/60 rounded-md transition-colors font-mono">
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
                      <A href="/feeder/master/mahasiswa_bimbingan_dosen" class="flex items-center gap-2 py-1 px-2 text-xs text-neutral-600 dark:text-neutral-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-neutral-800/60 rounded-md transition-colors font-mono">
                        <span class="size-1 rounded-full bg-neutral-400 dark:bg-neutral-500 shrink-0"></span>
                        <span class="truncate">mahasiswa_bimbingan_dosen</span>
                      </A>
                    </li>
                    <li>
                      <A href="/feeder/master/mahasiswa_lulusan_dropout" class="flex items-center gap-2 py-1 px-2 text-xs text-neutral-600 dark:text-neutral-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-neutral-800/60 rounded-md transition-colors font-mono">
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
                      <A href="/feeder/master/matakuliah_kurikulum" class="flex items-center gap-2 py-1 px-2 text-xs text-neutral-600 dark:text-neutral-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-neutral-800/60 rounded-md transition-colors font-mono">
                        <span class="size-1 rounded-full bg-neutral-400 dark:bg-neutral-500 shrink-0"></span>
                        <span class="truncate">matakuliah_kurikulum</span>
                      </A>
                    </li>
                    <li>
                      <A href="/feeder/master/nilai_perkuliahan_kelas" class="flex items-center gap-2 py-1 px-2 text-xs text-neutral-600 dark:text-neutral-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-neutral-800/60 rounded-md transition-colors font-mono">
                        <span class="size-1 rounded-full bg-neutral-400 dark:bg-neutral-500 shrink-0"></span>
                        <span class="truncate">nilai_perkuliahan_kelas</span>
                      </A>
                    </li>
                    <li>
                      <A href="/feeder/master/nilai_transfer_pendidikan_mahasiswa" class="flex items-center gap-2 py-1 px-2 text-xs text-neutral-600 dark:text-neutral-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-neutral-800/60 rounded-md transition-colors font-mono">
                        <span class="size-1 rounded-full bg-neutral-400 dark:bg-neutral-500 shrink-0"></span>
                        <span class="truncate">nilai_transfer_pendidikan_mahasiswa</span>
                      </A>
                    </li>
                    <li>
                      <A href="/feeder/master/penugasan_dosen" class="flex items-center gap-2 py-1 px-2 text-xs text-neutral-600 dark:text-neutral-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-neutral-800/60 rounded-md transition-colors font-mono">
                        <span class="size-1 rounded-full bg-neutral-400 dark:bg-neutral-500 shrink-0"></span>
                        <span class="truncate">penugasan_dosen</span>
                      </A>
                    </li>
                    <li>
                      <A href="/feeder/master/perguruan_tinggi" class="flex items-center gap-2 py-1 px-2 text-xs text-neutral-600 dark:text-neutral-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-neutral-800/60 rounded-md transition-colors font-mono">
                        <span class="size-1 rounded-full bg-neutral-400 dark:bg-neutral-500 shrink-0"></span>
                        <span class="truncate">perguruan_tinggi</span>
                      </A>
                    </li>
                    <li>
                      <A href="/feeder/master/periode_aktif" class="flex items-center gap-2 py-1 px-2 text-xs text-neutral-600 dark:text-neutral-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-neutral-800/60 rounded-md transition-colors font-mono">
                        <span class="size-1 rounded-full bg-neutral-400 dark:bg-neutral-500 shrink-0"></span>
                        <span class="truncate">periode_aktif</span>
                      </A>
                    </li>
                    <li>
                      <A href="/feeder/master/periode_perkuliahan" class="flex items-center gap-2 py-1 px-2 text-xs text-neutral-600 dark:text-neutral-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-neutral-800/60 rounded-md transition-colors font-mono">
                        <span class="size-1 rounded-full bg-neutral-400 dark:bg-neutral-500 shrink-0"></span>
                        <span class="truncate">periode_perkuliahan</span>
                      </A>
                    </li>
                    <li>
                      <A href="/feeder/master/perkuliahan_mahasiswa" class="flex items-center gap-2 py-1 px-2 text-xs text-neutral-600 dark:text-neutral-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-neutral-800/60 rounded-md transition-colors font-mono">
                        <span class="size-1 rounded-full bg-neutral-400 dark:bg-neutral-500 shrink-0"></span>
                        <span class="truncate">perkuliahan_mahasiswa</span>
                      </A>
                    </li>
                    <li>
                      <A href="/feeder/master/peserta_kelas_kuliah" class="flex items-center gap-2 py-1 px-2 text-xs text-neutral-600 dark:text-neutral-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-neutral-800/60 rounded-md transition-colors font-mono">
                        <span class="size-1 rounded-full bg-neutral-400 dark:bg-neutral-500 shrink-0"></span>
                        <span class="truncate">peserta_kelas_kuliah</span>
                      </A>
                    </li>
                    <li>
                      <A href="/feeder/master/prestasi_mahasiswa" class="flex items-center gap-2 py-1 px-2 text-xs text-neutral-600 dark:text-neutral-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-neutral-800/60 rounded-md transition-colors font-mono">
                        <span class="size-1 rounded-full bg-neutral-400 dark:bg-neutral-500 shrink-0"></span>
                        <span class="truncate">prestasi_mahasiswa</span>
                      </A>
                    </li>
                    <li>
                      <A href="/feeder/master/profil_perguruan_tinggi" class="flex items-center gap-2 py-1 px-2 text-xs text-neutral-600 dark:text-neutral-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-neutral-800/60 rounded-md transition-colors font-mono">
                        <span class="size-1 rounded-full bg-neutral-400 dark:bg-neutral-500 shrink-0"></span>
                        <span class="truncate">profil_perguruan_tinggi</span>
                      </A>
                    </li>
                    <li>
                      <A href="/feeder/master/program_studi" class="flex items-center gap-2 py-1 px-2 text-xs text-neutral-600 dark:text-neutral-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-neutral-800/60 rounded-md transition-colors font-mono">
                        <span class="size-1 rounded-full bg-neutral-400 dark:bg-neutral-500 shrink-0"></span>
                        <span class="truncate">program_studi</span>
                      </A>
                    </li>
                    <li>
                      <A href="/feeder/master/rencana_evaluasi" class="flex items-center gap-2 py-1 px-2 text-xs text-neutral-600 dark:text-neutral-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-neutral-800/60 rounded-md transition-colors font-mono">
                        <span class="size-1 rounded-full bg-neutral-400 dark:bg-neutral-500 shrink-0"></span>
                        <span class="truncate">rencana_evaluasi</span>
                      </A>
                    </li>
                    <li>
                      <A href="/feeder/master/rencana_pembelajaran" class="flex items-center gap-2 py-1 px-2 text-xs text-neutral-600 dark:text-neutral-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-neutral-800/60 rounded-md transition-colors font-mono">
                        <span class="size-1 rounded-full bg-neutral-400 dark:bg-neutral-500 shrink-0"></span>
                        <span class="truncate">rencana_pembelajaran</span>
                      </A>
                    </li>
                    <li>
                      <A href="/feeder/master/riwayat_fungsional_dosen" class="flex items-center gap-2 py-1 px-2 text-xs text-neutral-600 dark:text-neutral-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-neutral-800/60 rounded-md transition-colors font-mono">
                        <span class="size-1 rounded-full bg-neutral-400 dark:bg-neutral-500 shrink-0"></span>
                        <span class="truncate">riwayat_fungsional_dosen</span>
                      </A>
                    </li>
                    <li>
                      <A href="/feeder/master/riwayat_nilai_mahasiswa" class="flex items-center gap-2 py-1 px-2 text-xs text-neutral-600 dark:text-neutral-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-neutral-800/60 rounded-md transition-colors font-mono">
                        <span class="size-1 rounded-full bg-neutral-400 dark:bg-neutral-500 shrink-0"></span>
                        <span class="truncate">riwayat_nilai_mahasiswa</span>
                      </A>
                    </li>
                    <li>
                      <A href="/feeder/master/riwayat_pangkat_dosen" class="flex items-center gap-2 py-1 px-2 text-xs text-neutral-600 dark:text-neutral-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-neutral-800/60 rounded-md transition-colors font-mono">
                        <span class="size-1 rounded-full bg-neutral-400 dark:bg-neutral-500 shrink-0"></span>
                        <span class="truncate">riwayat_pangkat_dosen</span>
                      </A>
                    </li>
                    <li>
                      <A href="/feeder/master/riwayat_pendidikan_dosen" class="flex items-center gap-2 py-1 px-2 text-xs text-neutral-600 dark:text-neutral-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-neutral-800/60 rounded-md transition-colors font-mono">
                        <span class="size-1 rounded-full bg-neutral-400 dark:bg-neutral-500 shrink-0"></span>
                        <span class="truncate">riwayat_pendidikan_dosen</span>
                      </A>
                    </li>
                    <li>
                      <A href="/feeder/master/riwayat_pendidikan_mahasiswa" class="flex items-center gap-2 py-1 px-2 text-xs text-neutral-600 dark:text-neutral-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-neutral-800/60 rounded-md transition-colors font-mono">
                        <span class="size-1 rounded-full bg-neutral-400 dark:bg-neutral-500 shrink-0"></span>
                        <span class="truncate">riwayat_pendidikan_mahasiswa</span>
                      </A>
                    </li>
                    <li>
                      <A href="/feeder/master/riwayat_penelitian_dosen" class="flex items-center gap-2 py-1 px-2 text-xs text-neutral-600 dark:text-neutral-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-neutral-800/60 rounded-md transition-colors font-mono">
                        <span class="size-1 rounded-full bg-neutral-400 dark:bg-neutral-500 shrink-0"></span>
                        <span class="truncate">riwayat_penelitian_dosen</span>
                      </A>
                    </li>
                    <li>
                      <A href="/feeder/master/riwayat_sertifikasi_dosen" class="flex items-center gap-2 py-1 px-2 text-xs text-neutral-600 dark:text-neutral-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-neutral-800/60 rounded-md transition-colors font-mono">
                        <span class="size-1 rounded-full bg-neutral-400 dark:bg-neutral-500 shrink-0"></span>
                        <span class="truncate">riwayat_sertifikasi_dosen</span>
                      </A>
                    </li>
                    <li>
                      <A href="/feeder/master/skala_nilai_program_studi" class="flex items-center gap-2 py-1 px-2 text-xs text-neutral-600 dark:text-neutral-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-neutral-800/60 rounded-md transition-colors font-mono">
                        <span class="size-1 rounded-full bg-neutral-400 dark:bg-neutral-500 shrink-0"></span>
                        <span class="truncate">skala_nilai_program_studi</span>
                      </A>
                    </li>
                    <li>
                      <A href="/feeder/master/substansi_matakuliah" class="flex items-center gap-2 py-1 px-2 text-xs text-neutral-600 dark:text-neutral-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-neutral-800/60 rounded-md transition-colors font-mono">
                        <span class="size-1 rounded-full bg-neutral-400 dark:bg-neutral-500 shrink-0"></span>
                        <span class="truncate">substansi_matakuliah</span>
                      </A>
                    </li>
                    <li>
                      <A href="/feeder/master/transkrip_mahasiswa" class="flex items-center gap-2 py-1 px-2 text-xs text-neutral-600 dark:text-neutral-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-neutral-800/60 rounded-md transition-colors font-mono">
                        <span class="size-1 rounded-full bg-neutral-400 dark:bg-neutral-500 shrink-0"></span>
                        <span class="truncate">transkrip_mahasiswa</span>
                      </A>
                    </li>
                    <li>
                      <A href="/feeder/master/uji_mahasiswa" class="flex items-center gap-2 py-1 px-2 text-xs text-neutral-600 dark:text-neutral-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-neutral-800/60 rounded-md transition-colors font-mono">
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
                      <A href="/feeder/referensi/alat_transportasi" class="flex items-center gap-2 py-1 px-2 text-xs text-neutral-600 dark:text-neutral-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-neutral-800/60 rounded-md transition-colors font-mono">
                        <span class="size-1 rounded-full bg-neutral-400 dark:bg-neutral-500 shrink-0"></span>
                        <span class="truncate">alat_transportasi</span>
                      </A>
                    </li>
                    <li>
                      <A href="/feeder/referensi/bentuk_pendidikan" class="flex items-center gap-2 py-1 px-2 text-xs text-neutral-600 dark:text-neutral-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-neutral-800/60 rounded-md transition-colors font-mono">
                        <span class="size-1 rounded-full bg-neutral-400 dark:bg-neutral-500 shrink-0"></span>
                        <span class="truncate">bentuk_pendidikan</span>
                      </A>
                    </li>
                    <li>
                      <A href="/feeder/referensi/ikatan_kerja_sumber_daya_manusia" class="flex items-center gap-2 py-1 px-2 text-xs text-neutral-600 dark:text-neutral-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-neutral-800/60 rounded-md transition-colors font-mono">
                        <span class="size-1 rounded-full bg-neutral-400 dark:bg-neutral-500 shrink-0"></span>
                        <span class="truncate">ikatan_kerja_sumber_daya_manusia</span>
                      </A>
                    </li>
                    <li>
                      <A href="/feeder/referensi/jabatan_fungsional" class="flex items-center gap-2 py-1 px-2 text-xs text-neutral-600 dark:text-neutral-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-neutral-800/60 rounded-md transition-colors font-mono">
                        <span class="size-1 rounded-full bg-neutral-400 dark:bg-neutral-500 shrink-0"></span>
                        <span class="truncate">jabatan_fungsional</span>
                      </A>
                    </li>
                    <li>
                      <A href="/feeder/referensi/jalur_masuk" class="flex items-center gap-2 py-1 px-2 text-xs text-neutral-600 dark:text-neutral-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-neutral-800/60 rounded-md transition-colors font-mono">
                        <span class="size-1 rounded-full bg-neutral-400 dark:bg-neutral-500 shrink-0"></span>
                        <span class="truncate">jalur_masuk</span>
                      </A>
                    </li>
                    <li>
                      <A href="/feeder/referensi/jenis_aktifitas_mahasiswa" class="flex items-center gap-2 py-1 px-2 text-xs text-neutral-600 dark:text-neutral-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-neutral-800/60 rounded-md transition-colors font-mono">
                        <span class="size-1 rounded-full bg-neutral-400 dark:bg-neutral-500 shrink-0"></span>
                        <span class="truncate">jenis_aktifitas_mahasiswa</span>
                      </A>
                    </li>
                    <li>
                      <A href="/feeder/referensi/jenis_evaluasi" class="flex items-center gap-2 py-1 px-2 text-xs text-neutral-600 dark:text-neutral-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-neutral-800/60 rounded-md transition-colors font-mono">
                        <span class="size-1 rounded-full bg-neutral-400 dark:bg-neutral-500 shrink-0"></span>
                        <span class="truncate">jenis_evaluasi</span>
                      </A>
                    </li>
                    <li>
                      <A href="/feeder/referensi/jenis_keluar" class="flex items-center gap-2 py-1 px-2 text-xs text-neutral-600 dark:text-neutral-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-neutral-800/60 rounded-md transition-colors font-mono">
                        <span class="size-1 rounded-full bg-neutral-400 dark:bg-neutral-500 shrink-0"></span>
                        <span class="truncate">jenis_keluar</span>
                      </A>
                    </li>
                    <li>
                      <A href="/feeder/referensi/jenis_pendaftaran" class="flex items-center gap-2 py-1 px-2 text-xs text-neutral-600 dark:text-neutral-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-neutral-800/60 rounded-md transition-colors font-mono">
                        <span class="size-1 rounded-full bg-neutral-400 dark:bg-neutral-500 shrink-0"></span>
                        <span class="truncate">jenis_pendaftaran</span>
                      </A>
                    </li>
                    <li>
                      <A href="/feeder/referensi/jenis_prestasi" class="flex items-center gap-2 py-1 px-2 text-xs text-neutral-600 dark:text-neutral-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-neutral-800/60 rounded-md transition-colors font-mono">
                        <span class="size-1 rounded-full bg-neutral-400 dark:bg-neutral-500 shrink-0"></span>
                        <span class="truncate">jenis_prestasi</span>
                      </A>
                    </li>
                    <li>
                      <A href="/feeder/referensi/jenis_satuan_manajemen_sumberdaya" class="flex items-center gap-2 py-1 px-2 text-xs text-neutral-600 dark:text-neutral-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-neutral-800/60 rounded-md transition-colors font-mono">
                        <span class="size-1 rounded-full bg-neutral-400 dark:bg-neutral-500 shrink-0"></span>
                        <span class="truncate">jenis_satuan_manajemen_sumberdaya</span>
                      </A>
                    </li>
                    <li>
                      <A href="/feeder/referensi/jenis_sertifikasi" class="flex items-center gap-2 py-1 px-2 text-xs text-neutral-600 dark:text-neutral-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-neutral-800/60 rounded-md transition-colors font-mono">
                        <span class="size-1 rounded-full bg-neutral-400 dark:bg-neutral-500 shrink-0"></span>
                        <span class="truncate">jenis_sertifikasi</span>
                      </A>
                    </li>
                    <li>
                      <A href="/feeder/referensi/jenis_substansi" class="flex items-center gap-2 py-1 px-2 text-xs text-neutral-600 dark:text-neutral-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-neutral-800/60 rounded-md transition-colors font-mono">
                        <span class="size-1 rounded-full bg-neutral-400 dark:bg-neutral-500 shrink-0"></span>
                        <span class="truncate">jenis_substansi</span>
                      </A>
                    </li>
                    <li>
                      <A href="/feeder/referensi/jenis_tinggal" class="flex items-center gap-2 py-1 px-2 text-xs text-neutral-600 dark:text-neutral-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-neutral-800/60 rounded-md transition-colors font-mono">
                        <span class="size-1 rounded-full bg-neutral-400 dark:bg-neutral-500 shrink-0"></span>
                        <span class="truncate">jenis_tinggal</span>
                      </A>
                    </li>
                    <li>
                      <A href="/feeder/referensi/jenjang_pendidikan" class="flex items-center gap-2 py-1 px-2 text-xs text-neutral-600 dark:text-neutral-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-neutral-800/60 rounded-md transition-colors font-mono">
                        <span class="size-1 rounded-full bg-neutral-400 dark:bg-neutral-500 shrink-0"></span>
                        <span class="truncate">jenjang_pendidikan</span>
                      </A>
                    </li>
                    <li>
                      <A href="/feeder/referensi/kategori_kegiatan" class="flex items-center gap-2 py-1 px-2 text-xs text-neutral-600 dark:text-neutral-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-neutral-800/60 rounded-md transition-colors font-mono">
                        <span class="size-1 rounded-full bg-neutral-400 dark:bg-neutral-500 shrink-0"></span>
                        <span class="truncate">kategori_kegiatan</span>
                      </A>
                    </li>
                    <li>
                      <A href="/feeder/referensi/kebutuhan_khusus" class="flex items-center gap-2 py-1 px-2 text-xs text-neutral-600 dark:text-neutral-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-neutral-800/60 rounded-md transition-colors font-mono">
                        <span class="size-1 rounded-full bg-neutral-400 dark:bg-neutral-500 shrink-0"></span>
                        <span class="truncate">kebutuhan_khusus</span>
                      </A>
                    </li>
                    <li>
                      <A href="/feeder/referensi/lembaga_pengangkat" class="flex items-center gap-2 py-1 px-2 text-xs text-neutral-600 dark:text-neutral-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-neutral-800/60 rounded-md transition-colors font-mono">
                        <span class="size-1 rounded-full bg-neutral-400 dark:bg-neutral-500 shrink-0"></span>
                        <span class="truncate">lembaga_pengangkat</span>
                      </A>
                    </li>
                    <li>
                      <A href="/feeder/referensi/level_wilayah" class="flex items-center gap-2 py-1 px-2 text-xs text-neutral-600 dark:text-neutral-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-neutral-800/60 rounded-md transition-colors font-mono">
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
                      <A href="/feeder/referensi/pangkat_golongan" class="flex items-center gap-2 py-1 px-2 text-xs text-neutral-600 dark:text-neutral-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-neutral-800/60 rounded-md transition-colors font-mono">
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
                      <A href="/feeder/referensi/periode_lampau" class="flex items-center gap-2 py-1 px-2 text-xs text-neutral-600 dark:text-neutral-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-neutral-800/60 rounded-md transition-colors font-mono">
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
                      <A href="/feeder/referensi/status_keaktifan_pegawai" class="flex items-center gap-2 py-1 px-2 text-xs text-neutral-600 dark:text-neutral-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-neutral-800/60 rounded-md transition-colors font-mono">
                        <span class="size-1 rounded-full bg-neutral-400 dark:bg-neutral-500 shrink-0"></span>
                        <span class="truncate">status_keaktifan_pegawai</span>
                      </A>
                    </li>
                    <li>
                      <A href="/feeder/referensi/status_kepegawaian" class="flex items-center gap-2 py-1 px-2 text-xs text-neutral-600 dark:text-neutral-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-neutral-800/60 rounded-md transition-colors font-mono">
                        <span class="size-1 rounded-full bg-neutral-400 dark:bg-neutral-500 shrink-0"></span>
                        <span class="truncate">status_kepegawaian</span>
                      </A>
                    </li>
                    <li>
                      <A href="/feeder/referensi/status_mahasiswa" class="flex items-center gap-2 py-1 px-2 text-xs text-neutral-600 dark:text-neutral-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-neutral-800/60 rounded-md transition-colors font-mono">
                        <span class="size-1 rounded-full bg-neutral-400 dark:bg-neutral-500 shrink-0"></span>
                        <span class="truncate">status_mahasiswa</span>
                      </A>
                    </li>
                    <li>
                      <A href="/feeder/referensi/tahun_ajaran" class="flex items-center gap-2 py-1 px-2 text-xs text-neutral-600 dark:text-neutral-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-neutral-800/60 rounded-md transition-colors font-mono">
                        <span class="size-1 rounded-full bg-neutral-400 dark:bg-neutral-500 shrink-0"></span>
                        <span class="truncate">tahun_ajaran</span>
                      </A>
                    </li>
                    <li>
                      <A href="/feeder/referensi/tingkat_prestasi" class="flex items-center gap-2 py-1 px-2 text-xs text-neutral-600 dark:text-neutral-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-neutral-800/60 rounded-md transition-colors font-mono">
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
                      <A href="/feeder/rekapitulasi/indeks_prestasi_sementara_mahasiswa" class="flex items-center gap-2 py-1 px-2 text-xs text-neutral-600 dark:text-neutral-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-neutral-800/60 rounded-md transition-colors font-mono">
                        <span class="size-1 rounded-full bg-neutral-400 dark:bg-neutral-500 shrink-0"></span>
                        <span class="truncate">indeks_prestasi_sementara_mahasiswa</span>
                      </A>
                    </li>
                    <li>
                      <A href="/feeder/rekapitulasi/jumlah_dosen" class="flex items-center gap-2 py-1 px-2 text-xs text-neutral-600 dark:text-neutral-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-neutral-800/60 rounded-md transition-colors font-mono">
                        <span class="size-1 rounded-full bg-neutral-400 dark:bg-neutral-500 shrink-0"></span>
                        <span class="truncate">jumlah_dosen</span>
                      </A>
                    </li>
                    <li>
                      <A href="/feeder/rekapitulasi/jumlah_mahasiswa" class="flex items-center gap-2 py-1 px-2 text-xs text-neutral-600 dark:text-neutral-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-neutral-800/60 rounded-md transition-colors font-mono">
                        <span class="size-1 rounded-full bg-neutral-400 dark:bg-neutral-500 shrink-0"></span>
                        <span class="truncate">jumlah_mahasiswa</span>
                      </A>
                    </li>
                    <li>
                      <A href="/feeder/rekapitulasi/kartu_hasil_studi_mahasiswa" class="flex items-center gap-2 py-1 px-2 text-xs text-neutral-600 dark:text-neutral-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-neutral-800/60 rounded-md transition-colors font-mono">
                        <span class="size-1 rounded-full bg-neutral-400 dark:bg-neutral-500 shrink-0"></span>
                        <span class="truncate">kartu_hasil_studi_mahasiswa</span>
                      </A>
                    </li>
                    <li>
                      <A href="/feeder/rekapitulasi/kartu_rencana_studi_mahasiswa" class="flex items-center gap-2 py-1 px-2 text-xs text-neutral-600 dark:text-neutral-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-neutral-800/60 rounded-md transition-colors font-mono">
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
                      <A href="/institution/master/employees" class="flex items-center gap-2 py-1 px-2 text-xs text-neutral-600 dark:text-neutral-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-neutral-800/60 rounded-md transition-colors font-mono">
                        <span class="size-1 rounded-full bg-neutral-400 dark:bg-neutral-500 shrink-0"></span>
                        <span class="truncate">employees</span>
                      </A>
                    </li>
                    <li>
                      <A href="/institution/master/institutions" class="flex items-center gap-2 py-1 px-2 text-xs text-neutral-600 dark:text-neutral-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-neutral-800/60 rounded-md transition-colors font-mono">
                        <span class="size-1 rounded-full bg-neutral-400 dark:bg-neutral-500 shrink-0"></span>
                        <span class="truncate">institutions</span>
                      </A>
                    </li>
                    <li>
                      <A href="/institution/master/staffes" class="flex items-center gap-2 py-1 px-2 text-xs text-neutral-600 dark:text-neutral-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-neutral-800/60 rounded-md transition-colors font-mono">
                        <span class="size-1 rounded-full bg-neutral-400 dark:bg-neutral-500 shrink-0"></span>
                        <span class="truncate">staffes</span>
                      </A>
                    </li>
                    <li>
                      <A href="/institution/master/units" class="flex items-center gap-2 py-1 px-2 text-xs text-neutral-600 dark:text-neutral-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-neutral-800/60 rounded-md transition-colors font-mono">
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
                      <A href="/institution/reference/categories" class="flex items-center gap-2 py-1 px-2 text-xs text-neutral-600 dark:text-neutral-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-neutral-800/60 rounded-md transition-colors font-mono">
                        <span class="size-1 rounded-full bg-neutral-400 dark:bg-neutral-500 shrink-0"></span>
                        <span class="truncate">categories</span>
                      </A>
                    </li>
                    <li>
                      <A href="/institution/reference/position_type" class="flex items-center gap-2 py-1 px-2 text-xs text-neutral-600 dark:text-neutral-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-neutral-800/60 rounded-md transition-colors font-mono">
                        <span class="size-1 rounded-full bg-neutral-400 dark:bg-neutral-500 shrink-0"></span>
                        <span class="truncate">position_type</span>
                      </A>
                    </li>
                    <li>
                      <A href="/institution/reference/unit_types" class="flex items-center gap-2 py-1 px-2 text-xs text-neutral-600 dark:text-neutral-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-neutral-800/60 rounded-md transition-colors font-mono">
                        <span class="size-1 rounded-full bg-neutral-400 dark:bg-neutral-500 shrink-0"></span>
                        <span class="truncate">unit_types</span>
                      </A>
                    </li>
                    <li>
                      <A href="/institution/reference/varieties" class="flex items-center gap-2 py-1 px-2 text-xs text-neutral-600 dark:text-neutral-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-neutral-800/60 rounded-md transition-colors font-mono">
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
              <A href="/literate/categories" class="flex items-center gap-2 py-1 px-2 text-xs text-neutral-600 dark:text-neutral-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-neutral-800/60 rounded-md transition-colors font-mono">
                <span class="size-1 rounded-full bg-neutral-400 dark:bg-neutral-500 shrink-0"></span>
                <span class="truncate">categories</span>
              </A>
            </li>
            <li>
              <A href="/literate/educations" class="flex items-center gap-2 py-1 px-2 text-xs text-neutral-600 dark:text-neutral-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-neutral-800/60 rounded-md transition-colors font-mono">
                <span class="size-1 rounded-full bg-neutral-400 dark:bg-neutral-500 shrink-0"></span>
                <span class="truncate">educations</span>
              </A>
            </li>
            <li>
              <A href="/literate/groups" class="flex items-center gap-2 py-1 px-2 text-xs text-neutral-600 dark:text-neutral-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-neutral-800/60 rounded-md transition-colors font-mono">
                <span class="size-1 rounded-full bg-neutral-400 dark:bg-neutral-500 shrink-0"></span>
                <span class="truncate">groups</span>
              </A>
            </li>
            <li>
              <A href="/literate/levels" class="flex items-center gap-2 py-1 px-2 text-xs text-neutral-600 dark:text-neutral-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-neutral-800/60 rounded-md transition-colors font-mono">
                <span class="size-1 rounded-full bg-neutral-400 dark:bg-neutral-500 shrink-0"></span>
                <span class="truncate">levels</span>
              </A>
            </li>
            <li>
              <A href="/literate/varieties" class="flex items-center gap-2 py-1 px-2 text-xs text-neutral-600 dark:text-neutral-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-neutral-800/60 rounded-md transition-colors font-mono">
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
              <A href="/location/continents" class="flex items-center gap-2 py-1 px-2 text-xs text-neutral-600 dark:text-neutral-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-neutral-800/60 rounded-md transition-colors font-mono">
                <span class="size-1 rounded-full bg-neutral-400 dark:bg-neutral-500 shrink-0"></span>
                <span class="truncate">continents</span>
              </A>
            </li>
            <li>
              <A href="/location/countries" class="flex items-center gap-2 py-1 px-2 text-xs text-neutral-600 dark:text-neutral-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-neutral-800/60 rounded-md transition-colors font-mono">
                <span class="size-1 rounded-full bg-neutral-400 dark:bg-neutral-500 shrink-0"></span>
                <span class="truncate">countries</span>
              </A>
            </li>
            <li>
              <A href="/location/provinces" class="flex items-center gap-2 py-1 px-2 text-xs text-neutral-600 dark:text-neutral-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-neutral-800/60 rounded-md transition-colors font-mono">
                <span class="size-1 rounded-full bg-neutral-400 dark:bg-neutral-500 shrink-0"></span>
                <span class="truncate">provinces</span>
              </A>
            </li>
            <li>
              <A href="/location/regencies" class="flex items-center gap-2 py-1 px-2 text-xs text-neutral-600 dark:text-neutral-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-neutral-800/60 rounded-md transition-colors font-mono">
                <span class="size-1 rounded-full bg-neutral-400 dark:bg-neutral-500 shrink-0"></span>
                <span class="truncate">regencies</span>
              </A>
            </li>
            <li>
              <A href="/location/regency_types" class="flex items-center gap-2 py-1 px-2 text-xs text-neutral-600 dark:text-neutral-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-neutral-800/60 rounded-md transition-colors font-mono">
                <span class="size-1 rounded-full bg-neutral-400 dark:bg-neutral-500 shrink-0"></span>
                <span class="truncate">regency_types</span>
              </A>
            </li>
            <li>
              <A href="/location/regions" class="flex items-center gap-2 py-1 px-2 text-xs text-neutral-600 dark:text-neutral-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-neutral-800/60 rounded-md transition-colors font-mono">
                <span class="size-1 rounded-full bg-neutral-400 dark:bg-neutral-500 shrink-0"></span>
                <span class="truncate">regions</span>
              </A>
            </li>
            <li>
              <A href="/location/sub_districts" class="flex items-center gap-2 py-1 px-2 text-xs text-neutral-600 dark:text-neutral-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-neutral-800/60 rounded-md transition-colors font-mono">
                <span class="size-1 rounded-full bg-neutral-400 dark:bg-neutral-500 shrink-0"></span>
                <span class="truncate">sub_districts</span>
              </A>
            </li>
            <li>
              <A href="/location/villages" class="flex items-center gap-2 py-1 px-2 text-xs text-neutral-600 dark:text-neutral-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-neutral-800/60 rounded-md transition-colors font-mono">
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
                      <A href="/person/reference/age_classification" class="flex items-center gap-2 py-1 px-2 text-xs text-neutral-600 dark:text-neutral-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-neutral-800/60 rounded-md transition-colors font-mono">
                        <span class="size-1 rounded-full bg-neutral-400 dark:bg-neutral-500 shrink-0"></span>
                        <span class="truncate">age_classification</span>
                      </A>
                    </li>
                    <li>
                      <A href="/person/reference/blood_type" class="flex items-center gap-2 py-1 px-2 text-xs text-neutral-600 dark:text-neutral-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-neutral-800/60 rounded-md transition-colors font-mono">
                        <span class="size-1 rounded-full bg-neutral-400 dark:bg-neutral-500 shrink-0"></span>
                        <span class="truncate">blood_type</span>
                      </A>
                    </li>
                    <li>
                      <A href="/person/reference/eye_color" class="flex items-center gap-2 py-1 px-2 text-xs text-neutral-600 dark:text-neutral-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-neutral-800/60 rounded-md transition-colors font-mono">
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
                      <A href="/person/reference/hair_color" class="flex items-center gap-2 py-1 px-2 text-xs text-neutral-600 dark:text-neutral-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-neutral-800/60 rounded-md transition-colors font-mono">
                        <span class="size-1 rounded-full bg-neutral-400 dark:bg-neutral-500 shrink-0"></span>
                        <span class="truncate">hair_color</span>
                      </A>
                    </li>
                    <li>
                      <A href="/person/reference/hair_type" class="flex items-center gap-2 py-1 px-2 text-xs text-neutral-600 dark:text-neutral-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-neutral-800/60 rounded-md transition-colors font-mono">
                        <span class="size-1 rounded-full bg-neutral-400 dark:bg-neutral-500 shrink-0"></span>
                        <span class="truncate">hair_type</span>
                      </A>
                    </li>
                    <li>
                      <A href="/person/reference/identification_type" class="flex items-center gap-2 py-1 px-2 text-xs text-neutral-600 dark:text-neutral-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-neutral-800/60 rounded-md transition-colors font-mono">
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
                      <A href="/person/reference/marital_status" class="flex items-center gap-2 py-1 px-2 text-xs text-neutral-600 dark:text-neutral-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-neutral-800/60 rounded-md transition-colors font-mono">
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
                      <A href="/person/reference/relative_type" class="flex items-center gap-2 py-1 px-2 text-xs text-neutral-600 dark:text-neutral-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-neutral-800/60 rounded-md transition-colors font-mono">
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
