export interface ModelSelectItem {
    id: string;
    name?: string;
    label?: string;
    value?: string;
}

export const initialModelSelectItem: ModelSelectItem = {
    id: "",
    name: "",
    label: "",
    value: "",
};