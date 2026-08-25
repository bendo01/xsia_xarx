import { createSignal, onMount, For } from 'solid-js';
import { A } from '@solidjs/router';
import TopBar from '~/components/navigation/TopBar';
import { LocationContinentControllerIndex } from '~/controllers/location/LocationContinentController';
import { LocationRegionControllerIndex } from '~/controllers/location/LocationRegionController';
import { LocationCountryControllerIndex } from '~/controllers/location/LocationCountryController';
import { LocationProvinceControllerIndex } from '~/controllers/location/LocationProvinceController';
import { LocationRegencyTypeControllerIndex } from '~/controllers/location/LocationRegencyTypeController';
import { LocationRegencyControllerIndex } from '~/controllers/location/LocationRegencyController';
import { LocationSubDistrictControllerIndex } from '~/controllers/location/LocationSubDistrictController';
import { LocationVillageControllerIndex } from '~/controllers/location/LocationVillageController';

export default function LocationOverviewPage() {
    const [stats, setStats] = createSignal<{
        continents: number;
        regions: number;
        countries: number;
        provinces: number;
        regencyTypes: number;
        regencies: number;
        subDistricts: number;
        villages: number;
    }>({
        continents: 0,
        regions: 0,
        countries: 0,
        provinces: 0,
        regencyTypes: 0,
        regencies: 0,
        subDistricts: 0,
        villages: 0,
    });
    const [isLoading, setIsLoading] = createSignal(true);

    onMount(async () => {
        try {
            const [cont, reg, country, prov, regType, regency, subDist, village] = await Promise.allSettled([
                LocationContinentControllerIndex({ page: 1, per_page: 1 }),
                LocationRegionControllerIndex({ page: 1, per_page: 1 }),
                LocationCountryControllerIndex({ page: 1, per_page: 1 }),
                LocationProvinceControllerIndex({ page: 1, per_page: 1 }),
                LocationRegencyTypeControllerIndex({ page: 1, per_page: 1 }),
                LocationRegencyControllerIndex({ page: 1, per_page: 1 }),
                LocationSubDistrictControllerIndex({ page: 1, per_page: 1 }),
                LocationVillageControllerIndex({ page: 1, per_page: 1 }),
            ]);

            setStats({
                continents: cont.status === 'fulfilled' ? (cont.value.pagination?.total_data ?? 0) : 0,
                regions: reg.status === 'fulfilled' ? (reg.value.pagination?.total_data ?? 0) : 0,
                countries: country.status === 'fulfilled' ? (country.value.pagination?.total_data ?? 0) : 0,
                provinces: prov.status === 'fulfilled' ? (prov.value.pagination?.total_data ?? 0) : 0,
                regencyTypes: regType.status === 'fulfilled' ? (regType.value.pagination?.total_data ?? 0) : 0,
                regencies: regency.status === 'fulfilled' ? (regency.value.pagination?.total_data ?? 0) : 0,
                subDistricts: subDist.status === 'fulfilled' ? (subDist.value.pagination?.total_data ?? 0) : 0,
                villages: village.status === 'fulfilled' ? (village.value.pagination?.total_data ?? 0) : 0,
            });
        } catch (e) {
            console.error('Error fetching location stats:', e);
        } finally {
            setIsLoading(false);
        }
    });

    const modules = () => [
        {
            title: 'Continent (Benua)',
            description: 'Master continental entities (Asia, Europe, America, Africa, Australia, etc.).',
            path: '/location/continent',
            count: stats().continents,
            color: 'from-blue-600 to-blue-800',
        },
        {
            title: 'Region (Wilayah)',
            description: 'Regional geographic subcontinental zones (e.g. South East Asia).',
            path: '/location/region',
            count: stats().regions,
            color: 'from-sky-600 to-sky-800',
        },
        {
            title: 'Country (Negara)',
            description: 'Sovereign nations with ISO 3166-1/2 codes, DIKTI codes, and regional links.',
            path: '/location/country',
            count: stats().countries,
            color: 'from-indigo-600 to-indigo-800',
        },
        {
            title: 'Province (Provinsi)',
            description: 'First-level administrative territory subdivisions per country.',
            path: '/location/province',
            count: stats().provinces,
            color: 'from-emerald-600 to-emerald-800',
        },
        {
            title: 'Regency Type (Jenis Wilayah)',
            description: 'Classification types for regencies (Kabupaten, Kota Administrasi, Kota).',
            path: '/location/regency-type',
            count: stats().regencyTypes,
            color: 'from-amber-600 to-amber-800',
        },
        {
            title: 'Regency (Kabupaten / Kota)',
            description: 'Second-level administrative districts under provinces.',
            path: '/location/regency',
            count: stats().regencies,
            color: 'from-orange-600 to-orange-800',
        },
        {
            title: 'Sub-District (Kecamatan)',
            description: 'Third-level administrative units (Kecamatan / Distrik) within regencies.',
            path: '/location/sub-district',
            count: stats().subDistricts,
            color: 'from-purple-600 to-purple-800',
        },
        {
            title: 'Village (Desa / Kelurahan)',
            description: 'Fourth-level administrative villages and kelurahan records.',
            path: '/location/village',
            count: stats().villages,
            color: 'from-rose-600 to-rose-800',
        },
    ];

    return (
        <>
            <TopBar />
            <div class="px-4 py-6 max-w-7xl mx-auto space-y-6">
                <div>
                    <h1 class="text-2xl sm:text-3xl font-bold text-neutral-900 dark:text-white tracking-tight">
                        Location Management Hub
                    </h1>
                    <p class="mt-1 text-sm text-neutral-600 dark:text-neutral-400">
                        Hierarchical administrative and geospatial master datasets connected to the backend database.
                    </p>
                </div>

                <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <For each={modules()}>
                        {(mod) => (
                            <A
                                href={mod.path}
                                class="group relative flex flex-col justify-between p-5 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 hover:border-blue-500 dark:hover:border-blue-500 shadow-2xs hover:shadow-md transition-all"
                            >
                                <div>
                                    <div class="flex items-center justify-between">
                                        <h2 class="font-bold text-neutral-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                                            {mod.title}
                                        </h2>
                                        <span class="text-xs px-2 py-0.5 font-mono font-semibold bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300">
                                            {isLoading() ? '...' : `${mod.count} records`}
                                        </span>
                                    </div>
                                    <p class="mt-2 text-xs text-neutral-500 dark:text-neutral-400 line-clamp-2 leading-relaxed">
                                        {mod.description}
                                    </p>
                                </div>
                                <div class="mt-4 pt-3 border-t border-neutral-100 dark:border-neutral-800 flex items-center justify-between text-xs text-blue-600 dark:text-blue-400 font-medium">
                                    <span>Manage Records</span>
                                    <svg class="size-4 transform group-hover:translate-x-1 transition-transform" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
                                    </svg>
                                </div>
                            </A>
                        )}
                    </For>
                </div>
            </div>
        </>
    );
}
