<div align = "center">

![我复制的webGL动画帅不帅](./media/WeChat965f3c22c59dd9bdaea6e460e06890c3.jpg)

</div>

Agent似乎没有那么深奥——上下文注入、会话管理、结构化工具调用、判断什么时候结束然后给用户返回消息，好像也就这样是不是，我自己来试试吧。（绝对会打脸）

首先我不是要做一个多么牛逼的Agent，类似于Claude code、codex那种，虽然我觉得市面上这些牛逼的Agent其实都是coding Agent，只不过面向特定场景需求或者任务设计了特殊的架构以及工具。也许是特殊的上下文管理，或者不同的A2A通信协议，会话管理架构设计，Agent循环的逻辑设计等等，其实我也不太清楚。直觉上我觉得pi这个框架非常好，比较基础，而且我喜欢他的创始人以及他们公司的理念。（注入了热情的东西就会被别人喜欢不是吗？）所以让我们开始吧。

Agent的工具系统，我们可以从工具定义，工具加载，工具执行三个方面来进行一些讨论，tool_call或者说function_call，原理都是先告诉llm在何时可以调用哪些工具，llm自行决定何时调用，调用方法就是让llm返回一段结构化数据（JSON schema），运行时读取这个结构化数据运行相应的工具（往往是一些脚本，或者联网搜索），处理工具输出并汇总整理返回给llm。其实就是给了大模型一种方法与现实的网络世界进行交互，只不过llm还不够聪明，能力还不够（context），所以才整出了这么多的subagent，MCP，上下文工程，状态管理，工具集成等等的玩意。我觉得llm智能到达一定程度，给它一个bash就完事了，它把所有事情都实现了，但是应该不可能的，没有人会把自己交给概率。

<div align = "center">

![意味不明](./media/WeChat8466c0ecf5334d854737b5f0007e9f4a.jpg)

</div>

话说回来，工具定义就三个变量： `name` `description` `parameters`，分别是工具的名字，描述和参数。这些是API协议字段，也就是 OpenAI Chat Completions API规定的，也就是说进行Completion HTTP请求时就这么传，其他的还有 `model` `messages` `tool_choice`以及字段里面的结构等等。对于工具的字段信息都会在创建一轮Loop的时候被加载进上下文中，它不是放在message后面，它只是作为tools字段被加载，如何处理这些信息是provider做的事情。（我记得研究说过上下文工程是很重要的，起到了引导llm的作用，一般越是在上下文的前面起到的作用越大，但是在加载工具时就不考虑这个了）

在准备好工具之后我们开始真正的创建这个agent，我们首先要注册刚刚创建的工具，这是为了让llm正确返回用于调用工具的结构体并且让这个结构体被runtime正确的execute（我要说的是对于初始化Agent时候来说的注册，实际上新建tool的时候手写好schema然后在index.js里注册）。根据我们的目的，注册总共有两个部分，将工具的名字和对应的实例放进一个Map中（这里还有execute），当llm返回一个schema的时候，根据schema中的name去map中找对应的实例然后执行；还有就是要传给llm的字段，告诉它有哪些工具怎么用，只需要传name, description, parameters：
```Typescript
this.toolSchemas = tools.map((t) => ({//tools是构造函数参数（可以理解为结构体中的变量），tools:Tool[] 这里tools定义为一个空数组，但是定义了它的结构，包含三个参数。
  type: "function",
  function: {
    name: t.name,
    description: t.description,
    parameters: t.parameters,
  },
}));
```
这里的tools在我们创建服务时使用 createTools()函数生成，这个函数在index.js里，真正的生成所有tool的JSON schema并作为一个数组传给tools，因此在创建一个新的工具时记得在这里面注册一下。

好啦好啦，llm知道你有哪些tools以及如何使用，Agent也知道怎么处理llm返回的结构体并且执行对应的tool了，这一切都是为了让这个只会说话的llm学会干点实在的活。让循环跑起来吧，不断的追加messages把llm给塞满，其实它也没多聪明是吧。

<div align = "center">

![APIAPIAPIAPTAPI](./media/WeChat599583f17bb502a3091b515990d57d35.jpg)

</div>
