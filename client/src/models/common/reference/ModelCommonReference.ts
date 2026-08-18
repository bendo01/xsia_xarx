export interface ModelCommonReference {
  id: string;
  code: number | string;
  alphabet_code: string;
  name: string;
  created_at: string;
  updated_at: string;
  sync_at: string | null;
  deleted_at: string | null;
  created_by: string | null;
  updated_by: string;
}

export interface ModelCommonReferenceWithMinMax extends ModelCommonReference {
  minimum: number;
  maximum: number;
}

export const initialModelCommonReference: ModelCommonReference = {
  id: "",
  code: "",
  alphabet_code: "",
  name: "",
  created_at: "",
  updated_at: "",
  sync_at: null,
  deleted_at: null,
  created_by: null,
  updated_by: "",
};

export const initialModelCommonReferenceWithMinMax: ModelCommonReferenceWithMinMax = {
  ...initialModelCommonReference,
  minimum: 0,
  maximum: 0,
};

export type UpsertDeleteMessage = {
  is_error: boolean,
  code: number
  message: string,
  errors: {},
}