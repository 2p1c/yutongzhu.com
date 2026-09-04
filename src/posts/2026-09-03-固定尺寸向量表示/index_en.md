<div align="center">

![What a clear and cute picture, when will I ever be able to draw like this?](./media/WeChatc58ed45f98724405c7d6e92f3edf7f4c.jpg "width=80%")

</div>

Fixed-size vector representation is actually the core subject I've been learning recently—it was only today that I learned its name: embedding.

We can simply think of a fixed-size vector as representing a piece of knowledge, and a knowledge base stores hundreds or thousands of such vectors. When the LLM receives a query, we just need to convert the query into a vector, compute the closest vectors in this vector library, and retrieve them. That is essentially answering the user's question using the knowledge base. There are many steps involved; let's go through them one by one.

First, we need to create a fixed-size vector library. This requires an embedding model—an encoder that can encode text into fixed-size vector representations. Two technical points are involved here: what content to feed into the model (the format of the input data), and which model to choose and whether to fine-tune it.

We should choose a way to input text into the model for encoding. We might have a news article, a paper, or a personal blog post. Putting the whole article or paragraph into the model for encoding may not be a good choice. A user's question may not easily match the vector representing the entire article; instead, it often matches the article's title or a specific keyword (e.g., "the weather is nice" will match "the sun is big"). Therefore, we need a chunking strategy to slice the text and select an embedding model suitable for the task scenario to encode the text (a food website and a fitness website may have different vector similarities for "salad" and "I love it").

<div align="center">

![2D projection of vectors in the knowledge base, i.e., the "knowledge surface"](./media/paste-1788489238087-0.png)

</div>

At the same time, we should also reformulate the user's question and select an appropriate embedding model (usually the same one used when creating the RAG) to convert the question into a vector so that calculations can be performed. (A bodybuilder and a cute couch potato asking "recommend me something delicious" at the same time may have vector representations that are not quite consistent).

Once we have the vector library and the user's question has been converted into a vector, we can easily compute the similarity between vectors and obtain a similarity ranking. At this point, we can select the top k most similar documents and return them together with the user's query (forming a prompt) to the LLM, or we can do further processing (such as reranking and other post-processing).

The workflow is a bit complex, but a well-designed architecture saves a lot of context while giving the LLM powerful retrieval capabilities. Moreover, it is as if the LLM can theoretically retrieve—that is, learn—any amount of information in any domain. The LLM's knowledge stops at the moment training completes; an external RAG library appended to the limited model context endows the LLM with more accurate, timely knowledge and, to some extent, reduces the hallucination problem.

There is another question: when should we use it? Perhaps we don't want the Agent to rummage through the RAG library when I just ask what time it is, retrieve the top k best matches, and organize them for the LLM to produce an answer. A reasonable approach is to let the Agent decide whether it needs to call RAG tools to obtain additional specific information. We write RAG retrieval as a tool_call, describing its purpose and when it can be invoked, and attach tags to each RAG library describing what knowledge it contains. This allows the LLM to decide on its own whether to call RAG tools and to select the most suitable knowledge base for retrieval. There are many optimization measures, such as a similarity threshold fallback—if the similarity isn't high enough, switch to another library or don't use it at all.

Fine.

**references**

[1][Advanced RAG on Hugging Face documentation using LangChain](https://huggingface.co/learn/cookbook/en/advanced_rag?utm_source=chatgpt.com)