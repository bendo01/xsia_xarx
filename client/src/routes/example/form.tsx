import { createSignal, onMount } from 'solid-js';
import TopBar from '~/components/navigation/TopBar';
import SlimSelect from 'slim-select';
import 'quill/dist/quill.snow.css';

export default function ExampleForm() {
    let selectRef: HTMLSelectElement | undefined;
    let multiSelectRef: HTMLSelectElement | undefined;
    let quillRef: HTMLDivElement | undefined;

    onMount(() => {
        if (selectRef) {
            new SlimSelect({ select: selectRef });
        }
        if (multiSelectRef) {
            new SlimSelect({ select: multiSelectRef });
        }
        if (quillRef) {
            import('quill').then(({ default: Quill }) => {
                new Quill(quillRef, {
                    theme: 'snow',
                    placeholder: 'Write your thoughts here...',
                modules: {
                    toolbar: [
                        ['bold', 'italic', 'underline', 'strike'],
                        ['blockquote', 'code-block'],
                        [{ 'header': 1 }, { 'header': 2 }],
                        [{ 'list': 'ordered'}, { 'list': 'bullet' }],
                        [{ 'script': 'sub'}, { 'script': 'super' }],
                        [{ 'indent': '-1'}, { 'indent': '+1' }],
                        [{ 'direction': 'rtl' }],
                        [{ 'size': ['small', false, 'large', 'huge'] }],
                        [{ 'header': [1, 2, 3, 4, 5, 6, false] }],
                        [{ 'color': [] }, { 'background': [] }],
                        [{ 'font': [] }],
                        [{ 'align': [] }],
                        ['clean'],
                        ['link', 'image', 'video']
                    ]
                }
            });
            });
        }
    });

    const inputClass = "block w-full p-3 text-sm text-neutral-900 border border-neutral-300 rounded-none bg-neutral-50 focus:ring-blue-500 focus:border-blue-500 dark:bg-neutral-800 dark:border-neutral-700 dark:text-white dark:placeholder-neutral-400 dark:focus:ring-blue-500 dark:focus:border-blue-500 transition-colors";
    const labelClass = "block mb-2 text-sm font-medium text-neutral-900 dark:text-white";

    return (
        <>
            <TopBar />
            <div class="mx-auto px-4 py-8">
                <div class="mb-8">
                    <h1 class="text-2xl sm:text-3xl font-bold text-neutral-900 dark:text-white tracking-tight">Form Elements</h1>
                    <p class="mt-2 text-sm text-neutral-600 dark:text-neutral-400">A showcase of all available form input types arranged in a vertical stack.</p>
                </div>

                <form class="flex flex-col gap-6" onSubmit={(e) => e.preventDefault()}>
                    {/* Text Input */}
                    <div>
                        <label for="text-input" class={labelClass}>Text Input</label>
                        <input type="text" id="text-input" class={inputClass} placeholder="John Doe" />
                    </div>

                    {/* Email Input */}
                    <div>
                        <label for="email-input" class={labelClass}>Email Address</label>
                        <input type="email" id="email-input" class={inputClass} placeholder="name@example.com" />
                    </div>

                    {/* Password Input */}
                    <div>
                        <label for="password-input" class={labelClass}>Password</label>
                        <input type="password" id="password-input" class={inputClass} placeholder="••••••••" />
                    </div>

                    {/* Number Input */}
                    <div>
                        <label for="number-input" class={labelClass}>Number Input</label>
                        <input type="number" id="number-input" class={inputClass} placeholder="123" />
                    </div>

                    {/* Textarea */}
                    <div>
                        <label for="textarea-input" class={labelClass}>Textarea</label>
                        <textarea id="textarea-input" rows="4" class={inputClass} placeholder="Write your thoughts here..."></textarea>
                    </div>

                    {/* Quill Text Editor */}
                    <div>
                        <label class={labelClass}>Quill Editor</label>
                        <div class="bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white rounded-none">
                            <div ref={quillRef} style="min-height: 150px;"></div>
                        </div>
                    </div>

                    {/* Single Select */}
                    <div>
                        <label for="select-input" class={labelClass}>Single Select</label>
                        <select id="select-input" ref={selectRef} class={inputClass}>
                            <option data-placeholder="true">Choose a country</option>
                            <option value="US">United States</option>
                            <option value="CA">Canada</option>
                            <option value="UK">United Kingdom</option>
                            <option value="AU">Australia</option>
                        </select>
                    </div>

                    {/* Multiple Select */}
                    <div>
                        <label for="multi-select-input" class={labelClass}>Multiple Select</label>
                        <select id="multi-select-input" ref={multiSelectRef} multiple class={inputClass}>
                            <option data-placeholder="true">Choose tags</option>
                            <option value="design">Design</option>
                            <option value="development">Development</option>
                            <option value="marketing">Marketing</option>
                        </select>
                    </div>

                    {/* Checkbox */}
                    <div>
                        <label class="flex items-center gap-3 cursor-pointer">
                            <input type="checkbox" class="w-5 h-5 text-blue-600 bg-neutral-100 border-neutral-300 rounded focus:ring-blue-500 dark:focus:ring-blue-600 dark:ring-offset-neutral-800 focus:ring-2 dark:bg-neutral-700 dark:border-neutral-600" />
                            <span class="text-sm font-medium text-neutral-900 dark:text-neutral-300">I agree to the terms and conditions</span>
                        </label>
                    </div>

                    {/* Radio Buttons */}
                    <div>
                        <span class={labelClass}>Radio Group</span>
                        <div class="flex flex-col gap-3 mt-2">
                            <label class="flex items-center gap-3 cursor-pointer">
                                <input type="radio" name="plan" value="free" class="w-5 h-5 text-blue-600 bg-neutral-100 border-neutral-300 focus:ring-blue-500 dark:focus:ring-blue-600 dark:ring-offset-neutral-800 focus:ring-2 dark:bg-neutral-700 dark:border-neutral-600" />
                                <span class="text-sm font-medium text-neutral-900 dark:text-neutral-300">Free Plan</span>
                            </label>
                            <label class="flex items-center gap-3 cursor-pointer">
                                <input type="radio" name="plan" value="pro" class="w-5 h-5 text-blue-600 bg-neutral-100 border-neutral-300 focus:ring-blue-500 dark:focus:ring-blue-600 dark:ring-offset-neutral-800 focus:ring-2 dark:bg-neutral-700 dark:border-neutral-600" />
                                <span class="text-sm font-medium text-neutral-900 dark:text-neutral-300">Pro Plan</span>
                            </label>
                        </div>
                    </div>

                    {/* File Input */}
                    <div>
                        <label for="file-input" class={labelClass}>File Upload</label>
                        <input type="file" id="file-input" class="block w-full text-sm text-neutral-900 border border-neutral-300 rounded-none cursor-pointer bg-neutral-50 dark:text-neutral-400 focus:outline-none dark:bg-neutral-800 dark:border-neutral-700 dark:placeholder-neutral-400" />
                    </div>

                    {/* Date Picker */}
                    <div>
                        <label for="date-input" class={labelClass}>Date Picker</label>
                        <input type="date" id="date-input" class={inputClass} />
                    </div>

                    {/* Time Picker */}
                    <div>
                        <label for="time-input" class={labelClass}>Time Picker</label>
                        <input type="time" id="time-input" class={inputClass} />
                    </div>

                    {/* Range Slider */}
                    <div>
                        <label for="range-input" class={labelClass}>Range Slider</label>
                        <input id="range-input" type="range" min="0" max="100" class="w-full h-2 bg-neutral-200 rounded-lg appearance-none cursor-pointer dark:bg-neutral-700" />
                    </div>

                    {/* Submit Button */}
                    <div class="pt-4 mt-4 border-t border-neutral-200 dark:border-neutral-700 flex justify-end">
                        <button type="submit" class="px-6 py-3 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-none transition-colors shadow-sm">
                            Submit Form
                        </button>
                    </div>
                </form>
            </div>
        </>
    );
}