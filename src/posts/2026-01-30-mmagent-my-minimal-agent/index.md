<div align="center">

![好牛的WebGL着色器呀](./media/WeChatf5872c7d8641568dc7ea7d174206b835.jpg)

</div>

只是一个用于练习的Agent项目，我会把它接入我的一个website中作为一个ai web应用层的全栈项目，但是我可能也会把它设计成一个能在容器中运行通过API与外界通信的Agent模块，方便接入和部署。

我完全从零开始构建了这个Agent项目和我的web应用，它们可能并没有很好用，但是我可以按照自己的喜好设计它们，这也让我感到很满足。我应该只会设计一些简单的tool_call，以及试着实现完整的会话管理（其实我认为Agent循环以后会被设计的非常简单，因为模型的能力提升很快，虽然幻觉问题我想不出如何解决，目前看来上下文工程在很多场景下还是有应用的），分别是缓存层、存储层、检索层（大概是这么个意思吧）。分别用Redis, PostgreSQL和embedding向量来实现，这里可以学习一下Redis和PostgreSQL的特性，Redis存在RAM中按键检索所以快，PostgreSQL存在磁盘中所以慢但是能持久储存。以及会话是如何储存在表中的，schema是什么，每个session都有一个UUID等等。总之我会试着创造最佳的用户体验（我是讨好型人格）。

会话管理系统搭好了，采用主流的session KV + 向量库的双存储模式，PostgreSQL全量存储，Redis缓存最近10条消息缓解并发写入压力，加快会话消息读取，向量库实现跨会话消息检索（这里其实有很多可以设计的地方，可以根据设计外部知识库比如我的一些个人信息；或者工具描述向量库，从而匹配最合适的调用工具。这里就简单的将一些高价值内容存进向量库，比如用户的偏好、决策、性格等）。

就是最上面说的三层存储结构，其实要存的数据也不多，一共就两个表：sessions层在PostgreSQL中全量存储。包括uuid, user_id（后面必须要做Auth鉴权才能存进去数据，才能实现多用户多会话，每个用户管理自己的会话的功能）, messages, created_at, update_at，其中messages以json形式存储数据；还有就是语义层，用来存储语义向量，同样的表只是比上面的多一个embedding向量，后续需要实现一个embedding方法来把切分后的语句选择性转换成embedding向量存储（语义切分这里也大有门道，可以针对场景选择多种方法。还有Agent的向量库检索，一般设计成tool_call，在需要的时候调用工具进行查询）。总之，Minimax和deepseek帮我做好了一些，但是我确实掌握着所有数据字段和消息储存方式，以及总共包含的4个api：

``` curl

GET /api/sessions/{session_id} 用来拉取已有某个会话内容
POST /api/sessions/{session_id}/messages 用来发送消息
POST /api/session 用来创建会话
GET /api/users/{suer_id}/sessions 拉取某个用户的已有会话列表

```

我还可以给他们写一些状态检查或者错误码之类的，来练习一下API规范。

<div align = "center">

![磨砂玻璃底侧边栏，还可以吧](./media/WeChat96197665dafcad41fdaf01da30fd4848.jpg)

</div>

下面就可以准备接入一个完整的Agent对话api，后端通过http请求调用Agent，Agent在容器中执行runtime循环，调用工具，最终得到final answer，切分返回然后流式渲染在前端消息窗口中，大概就这样。Agent端的tool_call，后端的RAG库，Auth鉴权用户管理，这些后面慢慢补上。

