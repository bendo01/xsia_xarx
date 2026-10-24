# Artikel Konferensi (IEEE)

Judul: Compliance Anomaly Detection in Higher Education Academic Data Using Rule-Based and Machine Learning Methods

## Kompilasi TeX ke PDF

Jalankan dari folder ini (`journal/conference`):

```bash
make pdf        # kompilasi article.tex -> article.pdf
make clean      # hapus berkas bantu (aux, log, dll.), PDF tetap ada
make distclean  # hapus berkas bantu dan article.pdf
```

`make pdf` memakai `latexmk` bila tersedia, jika tidak memakai `tectonic`.

### Tanpa make

```bash
# TeX Live
latexmk -pdf -interaction=nonstopmode -halt-on-error article.tex

# atau Tectonic
tectonic article.tex
```

### Pemasangan

Arch Linux (TeX Live):

```bash
sudo pacman -S --needed texlive texlive-publishers
```

Tanpa sudo (Tectonic, mengunduh paket LaTeX saat kompilasi pertama):

```bash
mkdir -p ~/.local/bin
curl -sL -o /tmp/tectonic.tgz 'https://github.com/tectonic-typesetting/tectonic/releases/download/tectonic%400.17.0/tectonic-0.17.0-x86_64-unknown-linux-musl.tar.gz'
tar xzf /tmp/tectonic.tgz -C ~/.local/bin tectonic
export PATH=$HOME/.local/bin:$PATH
```

`IEEEtran.cls` sudah ada di folder ini. Daftar pustaka memakai `thebibliography` di dalam `article.tex`, jadi tidak perlu BibTeX atau Biber.

## Tools yang perlu dipasang (Omarchy / Arch Linux)

| Kebutuhan | Paket | Perintah |
|---|---|---|
| Kompilasi LaTeX | `texlive`, `texlive-publishers` (atau `tectonic`) | `sudo pacman -S --needed texlive texlive-publishers` |
| Otomasi build | `make`, `latexmk` (`latexmk` ikut TeX Live) | `sudo pacman -S --needed base-devel` |
| Cek PDF (`pdfinfo`, `pdftotext`) | `poppler` | `sudo pacman -S --needed poppler` |
| Eksperimen: Python dan paket | `uv` | `sudo pacman -S --needed uv` |
| Eksperimen: akses database | `postgresql` (klien `psql`) | `sudo pacman -S --needed postgresql` |

Paket Python eksperimen dipasang ke environment terpisah:

```bash
uv venv ~/.cache/xsia_anomaly
uv pip install --python ~/.cache/xsia_anomaly/bin/python numpy pandas scikit-learn "psycopg[binary]"
```

Menjalankan eksperimen (butuh `DATABASE_URL` ke database `xsia_rust_v1`):

```bash
cd experiment
DATABASE_URL=postgres://... ~/.cache/xsia_anomaly/bin/python run_experiment.py --seeds 10 --frac 0.05
```

## Eksperimen

Skrip eksperimen ada di `experiment/`. Hasil tabel ada di `experiment/results/`. Lihat `TODO.md` untuk pekerjaan yang tersisa.
