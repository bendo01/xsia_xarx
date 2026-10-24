# Build the IEEE conference paper: make [pdf|clean|distclean]
# Requires TeX Live (latexmk + pdflatex) or tectonic.
TEX := article
LATEXMK := $(shell command -v latexmk 2>/dev/null)
TECTONIC := $(shell command -v tectonic 2>/dev/null)

pdf: $(TEX).pdf

$(TEX).pdf: $(TEX).tex IEEEtran.cls
ifdef LATEXMK
	latexmk -pdf -interaction=nonstopmode -halt-on-error $(TEX).tex
else ifdef TECTONIC
	tectonic $(TEX).tex
else
	@echo "No TeX toolchain found. Install one: sudo pacman -S --needed texlive texlive-publishers (provides latexmk, pdflatex, IEEEtran) or tectonic"; exit 1
endif

clean:
ifdef LATEXMK
	latexmk -c $(TEX).tex
endif
	rm -f $(TEX).aux $(TEX).log $(TEX).out $(TEX).fls $(TEX).fdb_latexmk $(TEX).synctex.gz

distclean: clean
	rm -f $(TEX).pdf

.PHONY: pdf clean distclean
