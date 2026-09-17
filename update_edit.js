const fs = require('fs');

let content = fs.readFileSync('client/src/routes/course-department/academic/course/master/curriculum/[id]/edit.tsx', 'utf8');

// Add imports
content = content.replace("import { createSignal, onMount, createEffect, Show } from 'solid-js';", 
`import { createSignal, onMount, createEffect, Show, For } from 'solid-js';
import { getBaseApiUrl, getAuthHeaders } from '~/controllers/master/masterApiController';
import { activeRoleSignal, isStaffProgramStudi } from '~/lib/authStore';`);

// Add signals
content = content.replace("const [isSubmitting, setIsSubmitting] = createSignal(false);",
`const [isSubmitting, setIsSubmitting] = createSignal(false);
    const [academicYears, setAcademicYears] = createSignal<any[]>([]);
    const [curriculumTypes, setCurriculumTypes] = createSignal<any[]>([]);
    const [academicYearId, setAcademicYearId] = createSignal('');
    const [curriculumTypeId, setCurriculumTypeId] = createSignal('');
    const [unitId, setUnitId] = createSignal('');`);

// Update fetchExisting
content = content.replace(`                setDescription(res.data.description || res.data.keterangan || '');`,
`                setDescription(res.data.description || res.data.keterangan || '');
                setAcademicYearId(res.data.academic_year_id || '');
                setCurriculumTypeId(res.data.curriculum_type_id || '');
                if (res.data.unit_id) setUnitId(res.data.unit_id);`);

// Update onMount to fetch options
content = content.replace(`    onMount(() => {
        const id = (searchParams.id as string) || '';
        fetchExisting(id);
    });`,
`    onMount(async () => {
        const id = (searchParams.id as string) || '';
        fetchExisting(id);
        
        try {
            const h = getAuthHeaders();
            const ayRes = await fetch(\`\${getBaseApiUrl()}/academic/general/reference/academic_years/options_academic_years\`, {
                method: 'POST',
                headers: h,
                body: JSON.stringify({ option_last_year: 10 })
            });
            if (ayRes.ok) {
                const ayData = await ayRes.json();
                setAcademicYears(Array.isArray(ayData) ? ayData : []);
            }

            const ctRes = await fetch(\`\${getBaseApiUrl()}/academic/course/reference/curriculum_types/options_curriculum_types\`, {
                method: 'POST',
                headers: h,
                body: JSON.stringify({})
            });
            if (ctRes.ok) {
                const ctData = await ctRes.json();
                setCurriculumTypes(Array.isArray(ctData) ? ctData : []);
            }
            
            const role = activeRoleSignal();
            if (role && role.roleable_id && role.roleable_id !== '00000000-0000-0000-0000-000000000000') {
                const rType = String(role.roleable_type || '');
                const rName = String(role.name || '').toLowerCase();
                
                if (rType === 'Unit' || rType.includes('Unit')) {
                    setUnitId(role.roleable_id);
                } else if (rType.includes('Staff') || isStaffProgramStudi(role) || rName.includes('kaprodi') || rName.includes('prodi') || rName.includes('jurusan')) {
                    try {
                        const staffRes = await masterApiShow<any>('institution/master/staffes', role.roleable_id);
                        if (staffRes.data?.unit_id) {
                            setUnitId(staffRes.data.unit_id);
                        }
                    } catch {}
                }
            }
        } catch (e) {
            console.error('Failed to load options', e);
        }
    });`);

// Update handleSubmit payload
content = content.replace(`description: description(),`, 
`description: description(),
                academic_year_id: academicYearId() || null,
                curriculum_type_id: curriculumTypeId() || null,
                unit_id: unitId() || null,`);

// Add Select inputs inside form grid
content = content.replace(`                            <div class="grid grid-cols-1 sm:grid-cols-2 gap-6">`,
`                            <div class="grid grid-cols-1 sm:grid-cols-2 gap-6">
                                <div>
                                    <label class="block text-xs font-semibold uppercase tracking-wider text-neutral-700 dark:text-neutral-300 font-mono mb-2">
                                        Academic Year <span class="text-red-500">*</span>
                                    </label>
                                    <select
                                        required
                                        value={academicYearId()}
                                        onChange={(e) => setAcademicYearId(e.currentTarget.value)}
                                        class="w-full p-2.5 text-xs sm:text-sm border border-neutral-300 dark:border-neutral-600 bg-white dark:bg-neutral-900 text-neutral-900 dark:text-white font-mono focus:ring-2 focus:ring-blue-500 outline-hidden transition-colors"
                                    >
                                        <option value="" disabled>Select Academic Year</option>
                                        <For each={academicYears()}>
                                            {(opt) => <option value={opt.id}>{opt.name}</option>}
                                        </For>
                                    </select>
                                </div>

                                <div>
                                    <label class="block text-xs font-semibold uppercase tracking-wider text-neutral-700 dark:text-neutral-300 font-mono mb-2">
                                        Curriculum Type <span class="text-red-500">*</span>
                                    </label>
                                    <select
                                        required
                                        value={curriculumTypeId()}
                                        onChange={(e) => setCurriculumTypeId(e.currentTarget.value)}
                                        class="w-full p-2.5 text-xs sm:text-sm border border-neutral-300 dark:border-neutral-600 bg-white dark:bg-neutral-900 text-neutral-900 dark:text-white font-mono focus:ring-2 focus:ring-blue-500 outline-hidden transition-colors"
                                    >
                                        <option value="" disabled>Select Curriculum Type</option>
                                        <For each={curriculumTypes()}>
                                            {(opt) => <option value={opt.id}>{opt.name}</option>}
                                        </For>
                                    </select>
                                </div>
`);

fs.writeFileSync('client/src/routes/course-department/academic/course/master/curriculum/[id]/edit.tsx', content);
