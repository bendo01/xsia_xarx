import { Show } from 'solid-js';

export default function LocaleFlag(props: { locale: string }) {
    const cls = 'w-5 h-3.5 rounded-[2px] ring-1 ring-black/10 shrink-0';
    return (
        <Show
            when={props.locale === 'id'}
            fallback={
                <svg class={cls} viewBox="0 0 60 30" preserveAspectRatio="none" aria-hidden="true">
                    <rect width="60" height="30" fill="#012169" />
                    <path d="M0,0 L60,30 M60,0 L0,30" stroke="#FFFFFF" stroke-width="6" />
                    <path d="M0,0 L60,30 M60,0 L0,30" stroke="#C8102E" stroke-width="2" />
                    <path d="M30,0 V30 M0,15 H60" stroke="#FFFFFF" stroke-width="10" />
                    <path d="M30,0 V30 M0,15 H60" stroke="#C8102E" stroke-width="6" />
                </svg>
            }
        >
            <svg class={cls} viewBox="0 0 3 2" aria-hidden="true">
                <rect width="3" height="1" y="0" fill="#CE1126" />
                <rect width="3" height="1" y="1" fill="#FFFFFF" />
            </svg>
        </Show>
    );
}
