sudo pacman -S texlive-bibtexextra
sudo pacman -S plantuml graphviz
https://raw.githubusercontent.com/irhawks/plantuml.sty/refs/heads/master/plantuml.sty
sudo pacman -S texlive-bibtexextra biber
kpsewhich biblatex.sty
biber --version


xelatex desertasi.tex && biber desertasi && xelatex desertasi.tex && xelatex desertasi.tex
