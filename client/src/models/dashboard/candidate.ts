export interface CandidateRegistrationCategorySummary {
    total_candidate: number;
    category_name: string;
}

export interface CandidateRegistrationTypeSummary {
    total_candidate: number;
    type_name: string;
}

export interface CandidateRegencySummary {
    total_candidate: number;
    regency_name: string;
}

export interface CandidateSummary {
    total_candidate: number;
    registration_category_summary: CandidateRegistrationCategorySummary[];
    registration_type_summary: CandidateRegistrationTypeSummary[];
    regency_summary: CandidateRegencySummary[];
}
