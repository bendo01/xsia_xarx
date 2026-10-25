# Daftar sitasi di article.tex
Untuk tiap referensi: kalimat di makalah yang mengutipnya, supaya klaimnya bisa dicocokkan dengan isi paper aslinya.

## [1] `permendikbudristek39_2025`
Kementerian Pendidikan, Kebudayaan, Riset, dan Teknologi, ``Peraturan Menteri Pendidikan, Kebudayaan, Riset, dan Teknologi Nomor 39 Tahun 2025 tentang Penjaminan Mutu Pen...
- **Introduction**: Higher education institutions in Indonesia are required to implement internal quality assurance and to report their academic data to the national higher education database, PDDIKTI \cite{permendikbudristek39_2025,permendikbudristek53_2023}.

## [2] `permendikbudristek53_2023`
Kementerian Pendidikan, Kebudayaan, Riset, dan Teknologi, ``Peraturan Menteri Pendidikan, Kebudayaan, Riset, dan Teknologi Nomor 53 Tahun 2023 tentang Penjaminan Mutu Pen...
- **Introduction**: Higher education institutions in Indonesia are required to implement internal quality assurance and to report their academic data to the national higher education database, PDDIKTI \cite{permendikbudristek39_2025,permendikbudristek53_2023}.

## [3] `feeder_guide`
Kementerian Pendidikan dan Kebudayaan, ``User guide UI/UX Feeder PDDIKTI, version 4.0,'' Direktorat Jenderal Pendidikan Tinggi, Dec. 2020....
- **Introduction**: Institutions submit these data through the Feeder application, which applies a set of validation rules before synchronization \cite{feeder_guide}.
- **Data Quality and Rule-Based Checking**: In Indonesian higher education, explicit validation rules remain the standard tool: the Feeder application applies built-in checks \cite{feeder_guide}, and an analysis at a statistics polytechnic derived 243 data quality rules and an assessment matrix for data reported to PDDIKTI \cite{sumadi2021dq}.
- **Compliance Rules**: The explicit rules are taken from the built-in validation of the Feeder PDDIKTI application \cite{feeder_guide}.

## [4] `liu2008iforest`
F. T. Liu, K. M. Ting, and Z.-H. Zhou, ``Isolation forest,'' in Proc. 8th IEEE Int. Conf. Data Mining (ICDM), 2008, pp. 413--422....
- **Outlier Detection**: Isolation Forest isolates a record by random splits and uses the path length as an anomaly score \cite{liu2008iforest}; Extended Isolation Forest replaces the axis-parallel splits with random hyperplanes to remove the bias this creates in the scores \cite{hariri2021eif}.
- **Machine Learning Outlier Detection**: Isolation Forest scores $x$ by $s_{\mathrm{IF}}(x)=2^{-E[h(x)]/c(n)}$, where $E[h(x)]$ is the mean path length over the trees and $c(n)$ the average path length of an unsuccessful search in a binary tree of $n$ points \cite{liu2008iforest}.

## [5] `breunig2000lof`
M. M. Breunig, H.-P. Kriegel, R. T. Ng, and J. Sander, ``LOF: Identifying density-based local outliers,'' in Proc. ACM SIGMOD Int. Conf. Management of Data, 2000, pp. 93-...
- **Outlier Detection**: Local Outlier Factor compares the local density of a record with that of its neighbors, which allows it to find outliers relative to local structure \cite{breunig2000lof}.
- **Machine Learning Outlier Detection**: LOF scores $x$ by the ratio of the mean local reachability density of its neighbors to its own density, so values near 1 are normal and larger values are anomalous \cite{breunig2000lof}.

## [6] `scikit-learn`
F. Pedregosa et al., ``Scikit-learn: Machine learning in Python,'' J. Mach. Learn. Res., vol. 12, pp. 2825--2830, 2011....
- **Outlier Detection**: These detectors are available in widely used libraries \cite{scikit-learn,chen2024pyod2}.
- **Machine Learning Outlier Detection**: Isolation Forest uses 200 trees, LOF uses $k=20$ neighbors, and the autoencoder is a multilayer perceptron with three hidden layers (sizes $2d$, $\lfloor d/2\rfloor+1$, and $2d$ for $d$ input features) trained for at most 400 iterations; the autoencoder is implemented with scikit-learn \cite{scikit-learn}.

## [7] `pang2021deep`
G. Pang, C. Shen, L. Cao, and A. van den Hengel, ``Deep learning for anomaly detection: A review,'' ACM Comput. Surv., vol. 54, no. 2, pp. 38:1--38:38, 2021....
- **Outlier Detection**: Anomaly detection has been surveyed extensively, including deep approaches \cite{pang2021deep} and a unified view of deep and shallow methods \cite{ruff2021unifying}.
- **Outlier Detection**: Autoencoders learn to reconstruct typical records through a low-dimensional representation, and a large reconstruction error indicates an anomaly \cite{pang2021deep,ruff2021unifying}.

## [8] `ruff2021unifying`
L. Ruff et al., ``A unifying review of deep and shallow anomaly detection,'' Proc. IEEE, vol. 109, no. 5, pp. 756--795, 2021....
- **Outlier Detection**: Anomaly detection has been surveyed extensively, including deep approaches \cite{pang2021deep} and a unified view of deep and shallow methods \cite{ruff2021unifying}.
- **Outlier Detection**: Autoencoders learn to reconstruct typical records through a low-dimensional representation, and a large reconstruction error indicates an anomaly \cite{pang2021deep,ruff2021unifying}.

## [9] `hariri2021eif`
S. Hariri, M. C. Kind, and R. J. Brunner, ``Extended isolation forest,'' IEEE Trans. Knowl. Data Eng., vol. 33, no. 4, pp. 1479--1489, Apr. 2021, doi: 10.1109/TKDE.2019.2...
- **Outlier Detection**: Isolation Forest isolates a record by random splits and uses the path length as an anomaly score \cite{liu2008iforest}; Extended Isolation Forest replaces the axis-parallel splits with random hyperplanes to remove the bias this creates in the scores \cite{hariri2021eif}.

## [10] `chen2024pyod2`
S. Chen et al., ``PyOD 2: A Python library for outlier detection with LLM-powered model selection,'' arXiv:2412.12154, 2024....
- **Outlier Detection**: These detectors are available in widely used libraries \cite{scikit-learn,chen2024pyod2}.

## [11] `han2022adbench`
S. Han, X. Hu, H. Huang, M. Jiang, and Y. Zhao, ``ADBench: Anomaly detection benchmark,'' in Proc. 36th Conf. Neural Information Processing Systems (NeurIPS), Datasets an...
- **Benchmarks and Ensembles**: Large benchmarks on tabular data show that no unsupervised detector dominates: in the ADBench study of 30 algorithms on 57 datasets, no unsupervised algorithm statistically outperformed the others \cite{han2022adbench}.
- **Experimental Setup and Evaluation Metrics**: Precision@$k$ is $|\{\text{top-}k\}\cap A|/k$ for the set $A$ of injected anomalies, and the AUC is the probability that a randomly chosen anomaly receives a higher score than a randomly chosen normal record, the metric also used in recent benchmarks \cite{han2022adbench}.

## [12] `mehta2024benchmark`
S. Mehta, S. Mehendale, N. Fernandes, J. Sarkar, S. Sarkar, and S. Saha, ``Benchmarking anomaly detection algorithms: Deep learning and beyond,'' arXiv:2402.07281, 2024....
- **Benchmarks and Ensembles**: A recent re-evaluation of classical and deep detectors, including Isolation Forest and autoencoders, revisits whether tree-based methods can match deep ones \cite{mehta2024benchmark}, and interpretable tabular detectors have been proposed for settings where an auditor must understand a flag \cite{chang2023diad}.

## [13] `chang2023diad`
C.-H. Chang, J. Yoon, S. Arik, M. Udell, and T. Pfister, ``Data-efficient and interpretable tabular anomaly detection,'' in Proc. 29th ACM SIGKDD Conf. Knowledge Discover...
- **Benchmarks and Ensembles**: A recent re-evaluation of classical and deep detectors, including Isolation Forest and autoencoders, revisits whether tree-based methods can match deep ones \cite{mehta2024benchmark}, and interpretable tabular detectors have been proposed for settings where an auditor must understand a flag \cite{chang2023diad}.

## [14] `kluttermann2023ensembles`
S. Kl\"uttermann and E. M\"uller, ``Evaluating and comparing heterogeneous ensemble methods for unsupervised anomaly detection,'' in Proc. Int. Joint Conf. Neural Network...
- **Benchmarks and Ensembles**: Evaluations of heterogeneous unsupervised ensembles study how the normalization of detector scores affects the combination \cite{kluttermann2023ensembles}, and recent ensemble methods adjust each score using the scores of neighboring records \cite{yang2024regional}.

## [15] `yang2024regional`
J. Yang, S. Rahardja, and S. Rahardja, ``Regional ensemble for improving unsupervised outlier detectors,'' IEEE Trans. Artif. Intell., vol. 5, no. 9, pp. 4391--4402, 2024...
- **Benchmarks and Ensembles**: Evaluations of heterogeneous unsupervised ensembles study how the normalization of detector scores affects the combination \cite{kluttermann2023ensembles}, and recent ensemble methods adjust each score using the scores of neighboring records \cite{yang2024regional}.

## [16] `whang2023dataquality`
S. E. Whang, Y. Roh, H. Song, and J.-G. Lee, ``Data collection and quality challenges in deep learning: A data-centric AI perspective,'' VLDB J., vol. 32, no. 4, pp. 791-...
- **Introduction**: Data quality problems in administrative systems are well documented: errors enter through manual entry, system integration, and inconsistent interpretation of definitions, and they are costly to correct after they propagate \cite{whang2023dataquality,zha2025dcai}.
- **Data Quality and Rule-Based Checking**: Data quality problems are a central obstacle for data-driven systems, and recent work treats data quality as a central concern of data-centric AI \cite{whang2023dataquality,zha2025dcai}.

## [17] `zha2025dcai`
D. Zha, Z. P. Bhat, K.-H. Lai, F. Yang, Z. Jiang, S. Zhong, and X. Hu, ``Data-centric artificial intelligence: A survey,'' ACM Comput. Surv., vol. 57, no. 5, pp. 129:1--1...
- **Introduction**: Data quality problems in administrative systems are well documented: errors enter through manual entry, system integration, and inconsistent interpretation of definitions, and they are costly to correct after they propagate \cite{whang2023dataquality,zha2025dcai}.
- **Data Quality and Rule-Based Checking**: Data quality problems are a central obstacle for data-driven systems, and recent work treats data quality as a central concern of data-centric AI \cite{whang2023dataquality,zha2025dcai}.

## [18] `sumadi2021dq`
A. R. Sumadi and N. Wilantika, ``Analisis kebutuhan kualitas data dan aturan bisnis data pendidikan,'' Sistemasi: Jurnal Sistem Informasi, vol. 10, no. 3, pp. 726--740, 2...
- **Introduction**: Studies of PDDIKTI reporting at Indonesian institutions likewise trace poor data quality to weak data quality management and have catalogued hundreds of business and data quality rules \cite{sumadi2021dq}.
- **Data Quality and Rule-Based Checking**: In Indonesian higher education, explicit validation rules remain the standard tool: the Feeder application applies built-in checks \cite{feeder_guide}, and an analysis at a statistics polytechnic derived 243 data quality rules and an assessment matrix for data reported to PDDIKTI \cite{sumadi2021dq}.

## [19] `gorgun2022aberrant`
G. Gorgun and O. Bulut, ``Identifying aberrant responses in intelligent tutoring systems: An application of anomaly detection methods,'' Psychol. Test Assess. Model., vol...
- **Anomaly Detection in Educational Data**: Anomaly detection has been applied to aberrant student responses in intelligent tutoring systems with several unsupervised methods \cite{gorgun2022aberrant}, and distance-based measures have been used to detect sudden changes in educational records \cite{smith2021event}.

## [20] `smith2021event`
A. D. Smith, ``Event detection in educational records: An application of big data approaches,'' Int. J. Bus. Syst. Res., vol. 15, no. 3, pp. 271--291, 2021, doi: 10.1504/...
- **Anomaly Detection in Educational Data**: Anomaly detection has been applied to aberrant student responses in intelligent tutoring systems with several unsupervised methods \cite{gorgun2022aberrant}, and distance-based measures have been used to detect sudden changes in educational records \cite{smith2021event}.

## [21] `gao2023rag`
Y. Gao et al., ``Retrieval-augmented generation for large language models: A survey,'' arXiv:2312.10997, 2023....
- **Conclusion**: Future work includes validation on naturally occurring violations and additional institutions, the remaining entities such as enrollment history and study periods, per-semester scoring with weighted voting tuned on labeled cases, and linking each flagged record to the text of the regulation it may violate so that findings are explained to auditors in natural language, for example with retrieval-augmented generation \cite{gao2023rag}.
