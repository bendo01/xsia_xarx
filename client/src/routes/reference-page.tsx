import { createSignal } from 'solid-js';
import TopBar from '../components/navigation/TopBar';

export default function ReferencePage() {
    return (
        <>
            <TopBar />
            <section class="bg-neutral-100 text-neutral-700 p-8 dark:bg-neutral-800 dark:text-neutral-100">
                <h1 class="text-2xl font-bold">Reference Page</h1>
                <div class="mt-4">
                    {/* Desktop Table View */}
                    <div class="hidden md:flex md:flex-col">

                    </div>
                    {/* Mobile Card View */}
                    <div class="md:hidden space-y-6">

                    </div>
                </div>
            </section>
        </>
    );
}
