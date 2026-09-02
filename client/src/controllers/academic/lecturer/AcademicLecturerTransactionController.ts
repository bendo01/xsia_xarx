import { masterApiIndex, masterApiShow } from '~/controllers/master/masterApiController';
import type { AcademicLecturerMasterLecturer } from '~/models/academic/lecturer/master/Lecturer';
import type { AcademicLecturerTransactionHomebase } from '~/models/academic/lecturer/transaction/Homebase';
import type { AcademicLecturerTransactionAcademicRank } from '~/models/academic/lecturer/transaction/AcademicRank';
import type { AcademicLecturerTransactionAcademicGroup } from '~/models/academic/lecturer/transaction/AcademicGroup';

interface BaseReferenceItem {
    id?: string;
    name?: string;
}

// Cache reference maps to avoid redundant network queries
let unitNameCache = new Map<string, string>();
let rankNameCache = new Map<string, string>();
let groupNameCache = new Map<string, string>();
let statusNameCache = new Map<string, string>();
let contractNameCache = new Map<string, string>();

async function ensureReferencesLoaded() {
    try {
        const promises: Promise<any>[] = [];

        if (unitNameCache.size === 0) {
            promises.push(
                masterApiIndex<BaseReferenceItem>('institution/master/units', { page: 1, per_page: 500 })
                    .then(res => {
                        if (Array.isArray(res.data)) {
                            for (const u of res.data) {
                                if (u.id && u.name) unitNameCache.set(u.id, u.name);
                            }
                        }
                    })
                    .catch(() => {})
            );
        }

        if (rankNameCache.size === 0) {
            promises.push(
                masterApiIndex<BaseReferenceItem>('academic/lecturer/reference/ranks', { page: 1, per_page: 500 })
                    .then(res => {
                        if (Array.isArray(res.data)) {
                            for (const r of res.data) {
                                if (r.id && r.name) rankNameCache.set(r.id, r.name);
                            }
                        }
                    })
                    .catch(() => {})
            );
        }

        if (groupNameCache.size === 0) {
            promises.push(
                masterApiIndex<BaseReferenceItem>('academic/lecturer/reference/groups', { page: 1, per_page: 500 })
                    .then(res => {
                        if (Array.isArray(res.data)) {
                            for (const g of res.data) {
                                if (g.id && g.name) groupNameCache.set(g.id, g.name);
                            }
                        }
                    })
                    .catch(() => {})
            );
        }

        if (statusNameCache.size === 0) {
            promises.push(
                masterApiIndex<BaseReferenceItem>('academic/lecturer/reference/statuses', { page: 1, per_page: 500 })
                    .then(res => {
                        if (Array.isArray(res.data)) {
                            for (const s of res.data) {
                                if (s.id && s.name) statusNameCache.set(s.id, s.name);
                            }
                        }
                    })
                    .catch(() => {})
            );
        }

        if (contractNameCache.size === 0) {
            promises.push(
                masterApiIndex<BaseReferenceItem>('academic/lecturer/reference/contracts', { page: 1, per_page: 500 })
                    .then(res => {
                        if (Array.isArray(res.data)) {
                            for (const c of res.data) {
                                if (c.id && c.name) contractNameCache.set(c.id, c.name);
                            }
                        }
                    })
                    .catch(() => {})
            );
        }

        await Promise.all(promises);
    } catch (e) {
        console.error('Error preloading lecturer references:', e);
    }
}

/**
 * Fetch lecturer master from academic_lecturer_master.lecturers
 */
export async function getLecturerMasterByIndividual(individualId: string): Promise<AcademicLecturerMasterLecturer | null> {
    if (!individualId || individualId === '00000000-0000-0000-0000-000000000000') return null;
    try {
        const res = await masterApiIndex<AcademicLecturerMasterLecturer>('academic/lecturer/master/lecturers', {
            page: 1,
            per_page: 100,
            individual_id: individualId,
        });
        if (Array.isArray(res.data) && res.data.length > 0) {
            const matched = res.data.find(l => l.individual_id === individualId) || res.data[0];
            return matched || null;
        }
        return null;
    } catch (err) {
        console.error('Error fetching lecturer master by individual ID:', err);
        return null;
    }
}

/**
 * Fetch all homebase records from academic_lecturer_transaction.homebases for a lecturer,
 * sorted latest first, and enriched with unit name, status name, and contract name.
 */
export async function getLecturerHomebases(lecturerId: string): Promise<{
    homebases: AcademicLecturerTransactionHomebase[];
    latestHomebase: AcademicLecturerTransactionHomebase | null;
}> {
    if (!lecturerId || lecturerId === '00000000-0000-0000-0000-000000000000') {
        return { homebases: [], latestHomebase: null };
    }

    try {
        await ensureReferencesLoaded();
        const res = await masterApiIndex<AcademicLecturerTransactionHomebase>('academic/lecturer/transaction/homebases', {
            page: 1,
            per_page: 100,
            lecturer_id: lecturerId,
        });

        const rawList = Array.isArray(res.data) ? res.data.filter(h => h.lecturer_id === lecturerId || !h.lecturer_id) : [];

        // Sort latest first (by updated_at, created_at)
        rawList.sort((a, b) => {
            const timeA = new Date(a.updated_at || a.created_at || 0).getTime();
            const timeB = new Date(b.updated_at || b.created_at || 0).getTime();
            return timeB - timeA;
        });

        const enrichedList = await Promise.all(
            rawList.map(async (h) => {
                let unitName = unitNameCache.get(h.unit_id);
                if (!unitName && h.unit_id && h.unit_id !== '00000000-0000-0000-0000-000000000000') {
                    try {
                        const unitRes = await masterApiShow('institution/master/units', h.unit_id);
                        if (unitRes.data?.name) {
                            unitName = unitRes.data.name;
                            unitNameCache.set(h.unit_id, unitName!);
                        }
                    } catch {}
                    if (!unitName) {
                        try {
                            const feederRes = await masterApiShow('academic/feeder/master/program-studi', h.unit_id);
                            if (feederRes.data?.name || feederRes.data?.nama_program_studi) {
                                unitName = feederRes.data.nama_program_studi || feederRes.data.name;
                                unitNameCache.set(h.unit_id, unitName!);
                            }
                        } catch {}
                    }
                }

                let statusName = statusNameCache.get(h.status_id);
                if (!statusName && h.status_id && h.status_id !== '00000000-0000-0000-0000-000000000000') {
                    try {
                        const statusRes = await masterApiShow('academic/lecturer/reference/statuses', h.status_id);
                        if (statusRes.data?.name) {
                            statusName = statusRes.data.name;
                            statusNameCache.set(h.status_id, statusName!);
                        }
                    } catch {}
                }

                let contractName = contractNameCache.get(h.contract_id);
                if (!contractName && h.contract_id && h.contract_id !== '00000000-0000-0000-0000-000000000000') {
                    try {
                        const contractRes = await masterApiShow('academic/lecturer/reference/contracts', h.contract_id);
                        if (contractRes.data?.name) {
                            contractName = contractRes.data.name;
                            contractNameCache.set(h.contract_id, contractName!);
                        }
                    } catch {}
                }

                return {
                    ...h,
                    unit_name: unitName || null,
                    status_name: statusName || null,
                    contract_name: contractName || null,
                };
            })
        );

        return {
            homebases: enrichedList,
            latestHomebase: enrichedList[0] || null,
        };
    } catch (err) {
        console.error('Error fetching lecturer homebases:', err);
        return { homebases: [], latestHomebase: null };
    }
}

/**
 * Fetch all academic rank records from academic_lecturer_transaction.academic_ranks for a lecturer,
 * sorted latest first, and enriched with rank name.
 */
export async function getLecturerAcademicRanks(lecturerId: string): Promise<{
    academicRanks: AcademicLecturerTransactionAcademicRank[];
    latestAcademicRank: AcademicLecturerTransactionAcademicRank | null;
}> {
    if (!lecturerId || lecturerId === '00000000-0000-0000-0000-000000000000') {
        return { academicRanks: [], latestAcademicRank: null };
    }

    try {
        await ensureReferencesLoaded();
        const res = await masterApiIndex<AcademicLecturerTransactionAcademicRank>('academic/lecturer/transaction/academic-ranks', {
            page: 1,
            per_page: 100,
            lecturer_id: lecturerId,
        });

        const rawList = Array.isArray(res.data) ? res.data.filter(r => r.lecturer_id === lecturerId || !r.lecturer_id) : [];

        // Sort latest first (by start_date, decree_date, created_at)
        rawList.sort((a, b) => {
            const timeA = new Date(a.start_date || a.decree_date || a.created_at || 0).getTime();
            const timeB = new Date(b.start_date || b.decree_date || b.created_at || 0).getTime();
            return timeB - timeA;
        });

        const enrichedList = await Promise.all(
            rawList.map(async (r) => {
                let rankName = rankNameCache.get(r.rank_id);
                if (!rankName && r.rank_id && r.rank_id !== '00000000-0000-0000-0000-000000000000') {
                    try {
                        const rankRes = await masterApiShow('academic/lecturer/reference/ranks', r.rank_id);
                        if (rankRes.data?.name) {
                            rankName = rankRes.data.name;
                            rankNameCache.set(r.rank_id, rankName!);
                        }
                    } catch {}
                }

                return {
                    ...r,
                    rank_name: rankName || null,
                };
            })
        );

        return {
            academicRanks: enrichedList,
            latestAcademicRank: enrichedList[0] || null,
        };
    } catch (err) {
        console.error('Error fetching lecturer academic ranks:', err);
        return { academicRanks: [], latestAcademicRank: null };
    }
}

/**
 * Fetch all academic group records from academic_lecturer_transaction.academic_groups for a lecturer,
 * sorted latest first, and enriched with group name.
 */
export async function getLecturerAcademicGroups(lecturerId: string): Promise<{
    academicGroups: AcademicLecturerTransactionAcademicGroup[];
    latestAcademicGroup: AcademicLecturerTransactionAcademicGroup | null;
}> {
    if (!lecturerId || lecturerId === '00000000-0000-0000-0000-000000000000') {
        return { academicGroups: [], latestAcademicGroup: null };
    }

    try {
        await ensureReferencesLoaded();
        const res = await masterApiIndex<AcademicLecturerTransactionAcademicGroup>('academic/lecturer/transaction/academic-groups', {
            page: 1,
            per_page: 100,
            lecturer_id: lecturerId,
        });

        const rawList = Array.isArray(res.data) ? res.data.filter(g => g.lecturer_id === lecturerId || !g.lecturer_id) : [];

        // Sort latest first (by start_date, decree_date, created_at)
        rawList.sort((a, b) => {
            const timeA = new Date(a.start_date || a.decree_date || a.created_at || 0).getTime();
            const timeB = new Date(b.start_date || b.decree_date || b.created_at || 0).getTime();
            return timeB - timeA;
        });

        const enrichedList = await Promise.all(
            rawList.map(async (g) => {
                let groupName = groupNameCache.get(g.group_id);
                if (!groupName && g.group_id) {
                    try {
                        const groupRes = await masterApiShow('academic/lecturer/reference/groups', g.group_id);
                        if (groupRes.data?.name) {
                            groupName = groupRes.data.name;
                            groupNameCache.set(g.group_id, groupName!);
                        }
                    } catch {}
                }

                return {
                    ...g,
                    group_name: groupName || null,
                };
            })
        );

        return {
            academicGroups: enrichedList,
            latestAcademicGroup: enrichedList[0] || null,
        };
    } catch (err) {
        console.error('Error fetching lecturer academic groups:', err);
        return { academicGroups: [], latestAcademicGroup: null };
    }
}
