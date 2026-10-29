# Model used for research

## Embedding: multilingual-e5-base (768 dimensions)

[intfloat/multilingual-e5-base](https://huggingface.co/intfloat/multilingual-e5-base)

Replaces `sentence-transformers/paraphrase-multilingual-MiniLM-L12-v2` (384 dimensions). MiniLM is trained for paraphrase similarity, not for matching a question to a passage: the question "apakah mahasiswa dianggap insan dewasa?" did not retrieve UU 12/2012 Pasal 13 in the top 10, with dense or hybrid search. With e5-base the same question returns that article first.

| | paraphrase-multilingual-MiniLM-L12-v2 | multilingual-e5-base | bge-m3 |
| :--- | :--- | :--- | :--- |
| Dimensions | 384 | 768 | 1024 |
| Max input | 128 tokens | 512 tokens | 8192 tokens |
| Prefix | none | `query: ` / `passage: ` | none |
| Weights in the repo | `model.safetensors` | `model.safetensors` | `pytorch_model.bin` only |
| Used | no (replaced) | **yes** | no (not supported by the loader) |

e5 needs the prefixes: a stored chunk is embedded as `passage: <text>`, a question as `query: <text>`. The vector dimension follows the model, so the `ai.chunks.embedding` column is `vector(768)`, and changing the model means re-embedding every chunk.

```sh
 uv tool install "huggingface_hub[cli]"
 ```

```sh
 hf download intfloat/multilingual-e5-base config.json tokenizer.json model.safetensors --local-dir ./models/multilingual-e5-base
 ```

Existing chunks are re-embedded from their stored text, without the PDFs:

```sh
 ./xsia_xarx task compliance:generate-knowledgebase --reembed
 ```
