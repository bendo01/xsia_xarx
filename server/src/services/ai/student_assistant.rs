//! Text side of the student-data assistant: finding the student in a question, deciding which data the question is
//! about, and building the prompt. All of it is deterministic and free of I/O. A small local model is not trusted to
//! pick tools or write queries, so the server decides what to load and the model only words the answer.

use super::generation::LlmKind;
use super::student_data::{Academic, Finance, Profile, Sensitive, StudentData, Wanted};
use crate::services::compliance::rag::Hit;

/// What a question is about
#[derive(Clone, Debug, PartialEq, Eq)]
pub struct Intent {
    pub wanted: Wanted,
    /// Words of a semester name the grades are asked for, e.g. `2023/2024 ganjil`
    pub semester: Option<String>,
    /// Whether regulations should be searched as well
    pub regulation: bool,
    /// No keyword matched, so the default sections were taken. The client can show this and let the user pick sections
    pub guessed: bool,
}

/// Lower-cases and splits on everything that is not a letter, digit or `/`, so `IPK-nya?` becomes `ipk nya`
fn words(text: &str) -> Vec<String> {
    text.to_lowercase()
        .split(|c: char| !(c.is_alphanumeric() || c == '/'))
        .filter(|w| !w.is_empty())
        .map(str::to_owned)
        .collect()
}

/// Whether the question holds one of `keywords`. A keyword of up to 4 letters must be a whole word (`sks` must not
/// match inside another word); a longer one also matches inside a word (`bayar` in `pembayaran`)
fn mentions(words: &[String], keywords: &[&str]) -> bool {
    keywords.iter().any(|kw| {
        if kw.contains(' ') {
            let padded = format!(" {} ", words.join(" "));
            padded.contains(&format!(" {kw} "))
        } else if kw.chars().count() <= 4 {
            words.iter().any(|w| w == kw)
        } else {
            words.iter().any(|w| w.contains(kw))
        }
    })
}

const ACADEMIC: &[&str] = &[
    "nilai", "ipk", "ips", "indeks", "sks", "krs", "khs", "mata kuliah", "matkul", "skripsi", "tugas akhir", "lulus", "kelas", "transkrip", "akademik",
    "semester", "prestasi", "predikat", "yudisium", "wisuda", "sidang", "remedial", "mengulang", "kkn", "pkl",
];
const FINANCE: &[&str] = &["biaya", "ukt", "spp", "tagihan", "bayar", "keuangan", "finansial", "beasiswa", "tunggakan", "lunas", "cicilan", "uang kuliah"];
const SENSITIVE: &[&str] = &[
    "nik", "ktp", "alamat", "telepon", "telpon", "telp", "email", "surel", "keluarga", "orang tua", "ortu", "ayah", "ibu", "agama", "lahir", "kelamin",
    "identitas", "pribadi", "hp", "wa", "whatsapp", "ponsel", "handphone", "kontak", "domisili", "rumah", "kk",
];
const PROFILE: &[&str] = &[
    "profil", "prodi", "program studi", "status", "angkatan", "dosen wali", "wali", "pembimbing", "konsentrasi", "jurusan", "biodata", "nim", "nama lengkap",
    "aktif", "terdaftar", "tahun masuk",
];
const EVERYTHING: &[&str] = &["lengkap", "seluruh", "semua data", "semuanya", "biodata", "rincian"];
const REGULATION: &[&str] = &[
    "aturan", "peraturan", "syarat", "ketentuan", "boleh", "wajib", "batas", "maksimal", "minimal", "sesuai", "melanggar", "regulasi", "pasal", "cuti",
    "sanksi", "kebijakan", "memenuhi", "bisa lulus",
];

/// Decides what a question is about. A question that matches nothing gets the profile and academic data only:
/// finance and personal data are returned only when the question asks for them
pub fn classify(question: &str) -> Intent {
    let w = words(question);
    let mut wanted = Wanted {
        profile: mentions(&w, PROFILE),
        academic: mentions(&w, ACADEMIC),
        finance: mentions(&w, FINANCE),
        sensitive: mentions(&w, SENSITIVE),
    };
    let mut guessed = false;
    if mentions(&w, EVERYTHING) {
        wanted = Wanted::all();
    } else if wanted.is_empty() {
        wanted.profile = true;
        wanted.academic = true;
        guessed = true;
    }
    Intent { wanted, semester: semester_hint(&w), regulation: mentions(&w, REGULATION), guessed }
}

/// The sections a client asked for by name (`profile`, `academic`, `finance`, `sensitive`), which replace the
/// keyword guess. `None` when a name is unknown or the list is empty. What is allowed is still checked per student
pub fn parse_sections(names: &[String]) -> Option<Wanted> {
    let mut wanted = Wanted::default();
    for name in names {
        match name.trim().to_ascii_lowercase().as_str() {
            "profile" => wanted.profile = true,
            "academic" => wanted.academic = true,
            "finance" => wanted.finance = true,
            "sensitive" => wanted.sensitive = true,
            _ => return None,
        }
    }
    (!wanted.is_empty()).then_some(wanted)
}

/// The question as lower-case words separated by single spaces, the form student names are matched against
pub fn normalized(question: &str) -> String {
    words(question).join(" ")
}

/// `2023/2024` and/or `ganjil`/`genap`/`pendek` from the question, as the words a semester name must contain
fn semester_hint(words: &[String]) -> Option<String> {
    let is_year_pair = |w: &str| {
        let (a, b) = w.split_once('/').unwrap_or(("", ""));
        a.len() == 4 && b.len() == 4 && a.chars().all(|c| c.is_ascii_digit()) && b.chars().all(|c| c.is_ascii_digit())
    };
    let parts: Vec<&str> = words
        .iter()
        .map(String::as_str)
        .filter(|w| is_year_pair(w) || matches!(*w, "ganjil" | "genap" | "pendek"))
        .collect();
    (!parts.is_empty()).then(|| parts.join(" "))
}

/// Tokens of the question that look like a student number: at least 5 characters with a digit in them. A number is
/// taken both as plain letters and digits and, for the few that hold dots or dashes, as written between spaces. The
/// format of `students.code` is not assumed, the caller looks every candidate up
pub fn student_codes(question: &str) -> Vec<String> {
    let mut found: Vec<String> = Vec::new();
    let mut consider = |token: &str| {
        let looks_like_code = token.chars().count() >= 5 && token.chars().any(|c| c.is_ascii_digit());
        if looks_like_code && !found.iter().any(|f| f.eq_ignore_ascii_case(token)) {
            found.push(token.to_owned());
        }
    };
    for token in question.split(|c: char| !c.is_alphanumeric()) {
        consider(token);
    }
    for token in question.split_whitespace() {
        // "12.34.56789?" -> "12.34.56789"; only when it holds punctuation of its own
        let trimmed = token.trim_matches(|c: char| !c.is_alphanumeric());
        if trimmed.chars().any(|c| !c.is_alphanumeric()) {
            consider(trimmed);
        }
    }
    found
}

/// The student numbers in a question with everything but letters and digits removed, lower-cased, so they can be
/// compared with stored numbers written with spaces, dots or dashes (`2021 01 123`, `2021.01.123` and `202101123`
/// are one number). A number split into groups of digits is joined from 2 to 5 consecutive groups. Candidates are
/// only compared for equality, so extra ones cost nothing but a longer list
pub fn compact_codes(question: &str) -> Vec<String> {
    let compact = |text: &str| text.chars().filter(|c| c.is_alphanumeric()).collect::<String>().to_lowercase();
    let mut found: Vec<String> = Vec::new();
    let mut add = |candidate: String| {
        if candidate.chars().count() >= 5 && candidate.chars().any(|c| c.is_ascii_digit()) && !found.contains(&candidate) {
            found.push(candidate);
        }
    };
    for code in student_codes(question) {
        add(compact(&code));
    }
    let tokens: Vec<&str> = question.split(|c: char| !c.is_alphanumeric()).filter(|t| !t.is_empty()).collect();
    for start in 0..tokens.len() {
        let mut joined = String::new();
        for (taken, token) in tokens[start..].iter().enumerate() {
            if !token.chars().all(|c| c.is_ascii_digit()) {
                break;
            }
            joined.push_str(token);
            if taken >= 1 && taken < 5 {
                add(joined.clone());
            }
        }
    }
    found
}

/// How much of a student's record goes into the prompt; shrunk until the prompt fits the model
#[derive(Clone, Copy, Debug, PartialEq, Eq)]
pub struct Limits {
    pub grades: usize,
    pub semesters: usize,
    pub relatives: usize,
}

impl Limits {
    pub const START: Limits = Limits { grades: 40, semesters: 16, relatives: 8 };

    /// A smaller limit, `None` once there is nothing left to drop
    pub fn shrink(self) -> Option<Limits> {
        if self.grades == 0 && self.semesters <= 2 && self.relatives == 0 {
            return None;
        }
        Some(Limits { grades: self.grades / 2, semesters: (self.semesters / 2).max(2), relatives: self.relatives / 2 })
    }
}

/// Two decimals with the decimal comma used in Indonesian (`3,45`); `-` when there is no value
fn number(value: Option<f64>) -> String {
    value.map_or_else(|| "-".to_owned(), |v| format!("{v:.2}").replace('.', ","))
}

fn render_profile(p: &Profile) -> String {
    let counsellors = if p.counsellors.is_empty() { "-".to_owned() } else { p.counsellors.join(", ") };
    format!(
        "PROFIL: NIM {}; nama {}; program studi {}; konsentrasi {}; status {}; masuk {}; dosen wali {}.\n",
        p.code, p.name, p.unit, p.concentration, p.status, p.registered, counsellors
    )
}

fn render_academic(a: &Academic, limits: Limits) -> String {
    let mut out = String::from("AKADEMIK:\n");
    if let Some(ipk) = a.latest_cumulative_index {
        out.push_str(&format!("IPK terakhir {} dari {} SKS.\n", number(Some(ipk)), number(a.latest_cumulative_credit)));
    } else if !a.semesters.is_empty() {
        out.push_str("IPK belum tersedia: belum ada nilai yang tercatat.\n");
    }
    // The latest semesters are the useful ones when the list has to be cut
    let skip = a.semesters.len().saturating_sub(limits.semesters);
    for s in a.semesters.iter().skip(skip) {
        out.push_str(&format!(
            "- {}: IPS {} ({} SKS), IPK {} ({} SKS){}\n",
            s.name,
            number(s.index),
            number(s.credit),
            number(s.cumulative_index),
            number(s.cumulative_credit),
            if s.computed { " [dihitung dari nilai yang tercatat]" } else { "" }
        ));
    }
    if let Some(name) = &a.grades_semester {
        out.push_str(&format!("Nilai semester {name}:\n"));
        if a.grades.is_empty() {
            out.push_str("- (belum ada nilai)\n");
        }
        for g in a.grades.iter().take(limits.grades) {
            let mark = g.mark.map_or(String::new(), |m| format!(", angka {m:.2}"));
            out.push_str(&format!(
                "- {} {} ({} SKS): huruf {}, bobot {}{mark}\n",
                g.course_code,
                g.course,
                number(g.credit),
                g.letter.as_deref().unwrap_or("-"),
                number(g.points)
            ));
        }
        if a.grades.len() > limits.grades {
            out.push_str(&format!("- ... dan {} mata kuliah lain tidak ditampilkan\n", a.grades.len() - limits.grades));
        }
    }
    for t in &a.final_assignment {
        out.push_str(&format!(
            "Tugas akhir: {} ({})\n",
            t.title.as_deref().unwrap_or("tanpa judul"),
            if t.taken { "sudah diambil" } else { "belum diambil" }
        ));
    }
    out
}

fn render_finance(f: &Finance) -> String {
    let mut out = format!(
        "KEUANGAN: kategori biaya {}; biaya {}. Data pembayaran tidak tersedia, hanya biaya yang ditetapkan.\n",
        f.category.as_deref().unwrap_or("-"),
        number(f.fee)
    );
    for s in &f.per_semester {
        out.push_str(&format!("- {}: biaya {}\n", s.semester, number(s.fee)));
    }
    out
}

fn render_sensitive(s: &Sensitive, limits: Limits) -> String {
    let join = |items: &[String]| if items.is_empty() { "tidak tercatat".to_owned() } else { items.join("; ") };
    let mut out = format!(
        "DATA PRIBADI: NIK {}; jenis kelamin {}; agama {}; lahir di {} pada {}; alamat {}; telepon {}; email {}; nomor kartu keluarga {}.\n",
        s.national_id.as_deref().unwrap_or("tidak tercatat"),
        s.gender,
        s.religion,
        s.birth_place,
        s.birth_date,
        join(&s.addresses),
        join(&s.phones),
        join(&s.emails),
        s.family_card_number.as_deref().unwrap_or("tidak tercatat")
    );
    for r in s.relatives.iter().take(limits.relatives) {
        out.push_str(&format!("- keluarga: {} ({})\n", r.name, r.relation));
    }
    out
}

/// The student's data as compact text for the prompt. What the caller may not see is named so the model says
/// "not allowed" instead of guessing, but none of it is included
pub fn render_context(data: &StudentData, limits: Limits) -> String {
    let mut out = String::new();
    if let Some(p) = &data.profile {
        out.push_str(&render_profile(p));
    }
    if let Some(a) = &data.academic {
        out.push_str(&render_academic(a, limits));
    }
    if let Some(f) = &data.finance {
        out.push_str(&render_finance(f));
    }
    if let Some(s) = &data.sensitive {
        out.push_str(&render_sensitive(s, limits));
    }
    if !data.withheld.is_empty() {
        let labels: Vec<&str> = data
            .withheld
            .iter()
            .map(|w| match *w {
                "profile" => "profil",
                "academic" => "akademik",
                "finance" => "keuangan",
                _ => "data pribadi",
            })
            .collect();
        out.push_str(&format!("TIDAK DIIZINKAN untuk penanya: {}.\n", labels.join(", ")));
    }
    if out.is_empty() {
        out.push_str("(tidak ada data)\n");
    }
    out
}

const SYSTEM: &str = "Kamu adalah asisten akademik perguruan tinggi. \
Jawab dalam Bahasa Indonesia, HANYA berdasarkan DATA MAHASISWA dan ATURAN yang diberikan. \
Jawab dengan satu atau dua kalimat lengkap yang langsung menjawab pertanyaan dan menyebut hal yang ditanyakan, \
dengan bentuk seperti 'IPK terakhir Anda adalah X dari Y SKS.' di mana X dan Y diambil dari data. \
Untuk daftar, misalnya nilai beberapa mata kuliah, tulis satu butir singkat per baris. \
Salin angka, nama, dan tanggal persis seperti di data, termasuk tanda koma pada angka desimal; jangan menghitung ulang, membulatkan, atau menebak. \
Jika yang ditanyakan tidak ada di data, katakan dengan sopan bahwa informasinya belum tercatat. \
Jika data ditandai TIDAK DIIZINKAN, katakan bahwa penanya tidak berhak melihatnya dan jangan menyebut isinya. \
Jangan mengulang pertanyaan, jangan menyapa panjang, dan jangan menambahkan pengetahuan di luar data.";

/// Who the answer is addressed to
#[derive(Clone, Copy, Debug, PartialEq, Eq)]
pub enum Viewpoint {
    /// The student asking about themselves: "Anda"
    Own,
    /// A lecturer or staff member asking about a student: "mahasiswa tersebut"
    Other,
}

impl Viewpoint {
    const fn rule(self) -> &'static str {
        match self {
            Viewpoint::Own => " Penanya adalah mahasiswa itu sendiri, jadi sebut dia dengan 'Anda'.",
            Viewpoint::Other => " Penanya bukan mahasiswa itu, jadi sebut 'mahasiswa tersebut' atau namanya dan jangan memakai 'Anda'.",
        }
    }
}

/// Added only when regulations are in the prompt: a rule that never applies still leaks into a small model's answer
const REGULATION_RULE: &str = " Untuk pernyataan yang berasal dari ATURAN, sebutkan nomor sumbernya, misalnya [1].";

/// First `max` characters of `text`, cut on a word boundary where possible
fn clip(text: &str, max: usize) -> String {
    if text.chars().count() <= max {
        return text.to_owned();
    }
    let cut: String = text.chars().take(max).collect();
    let cut = cut.rsplit_once(char::is_whitespace).map_or(cut.as_str(), |(head, _)| head);
    format!("{}...", cut.trim_end())
}

/// Characters of a regulation chunk put in the prompt
const REGULATION_BODY_CHARS: usize = 500;

/// Chat prompt in the format of `kind`: instructions, the student's data, optional regulations, then the question
pub fn build_prompt(kind: LlmKind, viewpoint: Viewpoint, question: &str, student_context: &str, regulations: &[Hit]) -> String {
    let mut context = format!("DATA MAHASISWA:\n{student_context}\n");
    let mut system = SYSTEM.to_owned();
    system.push_str(viewpoint.rule());
    if !regulations.is_empty() {
        system.push_str(REGULATION_RULE);
        context.push_str("ATURAN:\n");
        for (i, hit) in regulations.iter().enumerate() {
            context.push_str(&format!("[{}] {}\n{}\n\n", i + 1, hit.citation(), clip(hit.body(), REGULATION_BODY_CHARS)));
        }
    }
    let question = question.trim();
    match kind {
        LlmKind::Qwen => format!(
            "<|im_start|>system\n{system}<|im_end|>\n<|im_start|>user\n{context}PERTANYAAN: {question}<|im_end|>\n<|im_start|>assistant\n"
        ),
        // Qwen3 thinks by default; an empty think block after the assistant tag turns that off
        LlmKind::Qwen3 => format!(
            "<|im_start|>system\n{system}<|im_end|>\n<|im_start|>user\n{context}PERTANYAAN: {question}<|im_end|>\n<|im_start|>assistant\n<think>\n\n</think>\n\n"
        ),
        // Gemma has no system role, so the instructions open the user turn
        LlmKind::Gemma | LlmKind::Gemma1b => {
            format!("<bos><start_of_turn>user\n{system}\n\n{context}PERTANYAAN: {question}<end_of_turn>\n<start_of_turn>model\n")
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::services::ai::student_data::{Grade, Semester};

    #[test]
    fn finds_student_numbers() {
        assert_eq!(student_codes("Berapa IPK mahasiswa 2021010123?"), vec!["2021010123"]);
        assert_eq!(student_codes("nilai A12345 dan a12345"), vec!["A12345"]);
        assert!(student_codes("IPK saya berapa, 2023?").is_empty());
        assert!(student_codes("tahun 2023 semester 5").is_empty());
        // Codes that hold dots or dashes are also tried as written
        let dotted = student_codes("IPK 12.34.56789?");
        assert!(dotted.contains(&"12.34.56789".to_owned()), "{dotted:?}");
        assert!(student_codes("IPK 2021-0123, ya").contains(&"2021-0123".to_owned()));
    }

    #[test]
    fn numbers_written_in_groups_are_joined() {
        assert!(compact_codes("Berapa IPK mahasiswa 2021 01 123?").contains(&"202101123".to_owned()));
        assert!(compact_codes("nilai 2021.01.123 ya").contains(&"202101123".to_owned()));
        assert!(compact_codes("nim 202101123").contains(&"202101123".to_owned()));
        assert!(compact_codes("Siapa A12345?").contains(&"a12345".to_owned()));
        // Words and short numbers alone are not numbers
        assert!(compact_codes("tahun 2023 semester 5").is_empty());
        assert!(compact_codes("berapa ipk saya").is_empty());
    }

    #[test]
    fn classifies_by_topic() {
        let gpa = classify("Berapa IPK saya?").wanted;
        assert!(gpa.academic && !gpa.finance && !gpa.sensitive);
        let fee = classify("Berapa tagihan UKT saya?").wanted;
        assert!(fee.finance && !fee.academic);
        let private = classify("Apa alamat dan nomor hp saya?").wanted;
        assert!(private.sensitive && !private.finance);
    }

    #[test]
    fn short_keywords_are_whole_words() {
        // "ips" must not fire inside "tips", but a long keyword may sit inside a word
        assert!(!mentions(&words("kasih tips belajar"), &["ips"]));
        assert!(mentions(&words("tolong ips saya"), &["ips"]));
        assert!(classify("pembayaran semester ini").wanted.finance);
    }

    #[test]
    fn unmatched_question_gets_only_profile_and_academic() {
        let w = classify("Ceritakan tentang mahasiswa ini").wanted;
        assert_eq!(w, Wanted { profile: true, academic: true, finance: false, sensitive: false });
    }

    #[test]
    fn asking_for_everything_asks_for_every_section() {
        assert_eq!(classify("Tampilkan data lengkap saya").wanted, Wanted::all());
    }

    #[test]
    fn detects_regulation_questions_and_semester() {
        let intent = classify("Apakah SKS saya melanggar aturan semester 2023/2024 ganjil?");
        assert!(intent.regulation);
        assert_eq!(intent.semester.as_deref(), Some("2023/2024 ganjil"));
        assert!(!classify("Berapa IPK saya?").regulation);
        assert_eq!(classify("Berapa IPK saya?").semester, None);
    }

    #[test]
    fn withheld_sections_are_named_but_not_included() {
        let data = StudentData { withheld: vec!["finance", "sensitive"], ..StudentData::default() };
        let text = render_context(&data, Limits::START);
        assert!(text.contains("TIDAK DIIZINKAN untuk penanya: keuangan, data pribadi"));
        assert!(!text.contains("KEUANGAN:"));
    }

    #[test]
    fn limits_cut_the_grade_list_and_say_so() {
        let grade = |n: u32| Grade {
            course_code: format!("MK{n}"),
            course: format!("Mata Kuliah {n}"),
            credit: Some(3.0),
            mark: Some(80.0),
            letter: Some("A".into()),
            points: Some(4.0),
        };
        let academic = Academic {
            semesters: vec![Semester {
                name: "2023/2024 Ganjil".into(),
                index: Some(3.5),
                credit: Some(20.0),
                cumulative_index: Some(3.5),
                cumulative_credit: Some(20.0),
                computed: false,
            }],
            latest_cumulative_index: Some(3.5),
            latest_cumulative_credit: Some(20.0),
            grades_semester: Some("2023/2024 Ganjil".into()),
            grades: (1..=10).map(grade).collect(),
            final_assignment: vec![],
        };
        let data = StudentData { academic: Some(academic), ..StudentData::default() };
        let text = render_context(&data, Limits { grades: 3, semesters: 2, relatives: 0 });
        assert!(text.contains("MK3") && !text.contains("MK4"));
        assert!(text.contains("dan 7 mata kuliah lain tidak ditampilkan"));
    }

    #[test]
    fn shrinking_ends() {
        let mut limits = Limits::START;
        let mut steps = 0;
        while let Some(next) = limits.shrink() {
            limits = next;
            steps += 1;
            assert!(steps < 20, "shrink must terminate");
        }
        assert_eq!(limits.grades, 0);
    }

    #[test]
    fn prompt_has_the_chat_format_of_each_model() {
        let qwen = build_prompt(LlmKind::Qwen3, Viewpoint::Own, "IPK saya?", "PROFIL: x\n", &[]);
        assert!(qwen.starts_with("<|im_start|>system") && qwen.ends_with("</think>\n\n"));
        assert!(qwen.contains("DATA MAHASISWA:\nPROFIL: x") && !qwen.contains("ATURAN:"));
        let gemma = build_prompt(LlmKind::Gemma, Viewpoint::Own, "IPK saya?", "PROFIL: x\n", &[]);
        assert!(gemma.starts_with("<bos><start_of_turn>user") && gemma.ends_with("<start_of_turn>model\n"));
    }

    fn sections(p: bool, a: bool, f: bool, s: bool) -> Wanted {
        Wanted { profile: p, academic: a, finance: f, sensitive: s }
    }

    #[test]
    fn indonesian_question_corpus() {
        let cases = [
            ("Berapa IPK saya?", sections(false, true, false, false)),
            ("Berapa IPS semester lalu?", sections(false, true, false, false)),
            ("Berapa total SKS yang sudah saya ambil", sections(false, true, false, false)),
            ("Apa saja nilai mata kuliah saya semester ini", sections(false, true, false, false)),
            ("Siapa dosen wali saya?", sections(true, false, false, false)),
            ("Apa status kemahasiswaan saya", sections(true, false, false, false)),
            ("Berapa tagihan UKT saya semester ini?", sections(false, true, true, false)),
            ("Apakah saya sudah membayar UKT?", sections(false, false, true, false)),
            ("Apa alamat saya", sections(false, false, false, true)),
            ("Berapa nomor HP saya yang tercatat", sections(false, false, false, true)),
            ("Siapa nama orang tua saya", sections(false, false, false, true)),
            ("Berapa email dan nomor WA saya", sections(false, false, false, true)),
            ("Kapan saya wisuda?", sections(false, true, false, false)),
            ("Kirim rekap nilai dan tagihan saya", sections(false, true, true, false)),
            ("Tampilkan data lengkap saya", Wanted::all()),
            ("Beri saya biodata lengkap", Wanted::all()),
        ];
        for (question, expected) in cases {
            let intent = classify(question);
            assert_eq!(intent.wanted, expected, "{question}");
            assert!(!intent.guessed, "{question}");
        }
    }

    #[test]
    fn a_guess_is_flagged() {
        let intent = classify("Bagaimana kondisi mahasiswa ini?");
        assert!(intent.guessed);
        assert_eq!(intent.wanted, sections(true, true, false, false));
    }

    #[test]
    fn rule_questions_are_flagged_for_regulation_search() {
        let intent = classify("Apakah saya bisa lulus tahun ini?");
        assert!(intent.regulation && intent.wanted.academic);
    }

    #[test]
    fn named_sections_replace_the_guess() {
        let names = |list: &[&str]| list.iter().map(|s| s.to_string()).collect::<Vec<_>>();
        assert_eq!(parse_sections(&names(&["Finance", " academic "])), Some(sections(false, true, true, false)));
        assert_eq!(parse_sections(&names(&["finance", "salary"])), None);
        assert_eq!(parse_sections(&[]), None);
    }

    #[test]
    fn normalizing_strips_punctuation_and_case() {
        assert_eq!(normalized("  Berapa IPK-nya, M. Rizky Fadillah?? "), "berapa ipk nya m rizky fadillah");
    }

    #[test]
    fn worked_out_indexes_are_labelled_and_missing_ones_say_so() {
        let academic = Academic {
            semesters: vec![Semester {
                name: "2022/2023 Genap".into(),
                index: Some(3.0),
                credit: Some(18.0),
                cumulative_index: Some(3.0),
                cumulative_credit: Some(18.0),
                computed: true,
            }],
            latest_cumulative_index: Some(3.0),
            latest_cumulative_credit: Some(18.0),
            grades_semester: None,
            grades: vec![],
            final_assignment: vec![],
        };
        let text = render_academic(&academic, Limits::START);
        assert!(text.contains("[dihitung dari nilai yang tercatat]"));

        let none = Academic {
            semesters: vec![Semester { name: "S".into(), index: None, credit: None, cumulative_index: None, cumulative_credit: None, computed: false }],
            latest_cumulative_index: None,
            latest_cumulative_credit: None,
            grades_semester: None,
            grades: vec![],
            final_assignment: vec![],
        };
        let text = render_academic(&none, Limits::START);
        assert!(text.contains("IPK belum tersedia") && !text.contains("0.00"));
    }

    #[test]
    fn missing_personal_data_is_written_as_not_recorded() {
        let sensitive = Sensitive {
            national_id: None,
            gender: "Laki-laki".into(),
            religion: "Islam".into(),
            birth_place: "Bandung".into(),
            birth_date: "2001-02-03".into(),
            addresses: vec![],
            phones: vec![],
            emails: vec![],
            family_card_number: None,
            relatives: vec![],
        };
        let text = render_sensitive(&sensitive, Limits::START);
        assert!(text.contains("NIK tidak tercatat") && text.contains("telepon tidak tercatat"));
    }

    #[test]
    fn numbers_use_the_decimal_comma() {
        assert_eq!(number(Some(3.5)), "3,50");
        assert_eq!(number(None), "-");
        let academic = Academic {
            semesters: vec![],
            latest_cumulative_index: Some(3.456),
            latest_cumulative_credit: Some(100.0),
            grades_semester: None,
            grades: vec![],
            final_assignment: vec![],
        };
        assert!(render_academic(&academic, Limits::START).contains("IPK terakhir 3,46 dari 100,00 SKS"));
    }

    #[test]
    fn the_prompt_addresses_the_asker_correctly() {
        let own = build_prompt(LlmKind::Qwen, Viewpoint::Own, "IPK saya?", "x\n", &[]);
        assert!(own.contains("mahasiswa itu sendiri") && !own.contains("jangan memakai 'Anda'"));
        let other = build_prompt(LlmKind::Qwen, Viewpoint::Other, "IPK dia?", "x\n", &[]);
        assert!(other.contains("mahasiswa tersebut") && other.contains("jangan memakai 'Anda'"));
        assert!(own.contains("satu atau dua kalimat lengkap") && other.contains("satu atau dua kalimat lengkap"));
    }
}
