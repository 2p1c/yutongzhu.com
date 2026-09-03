<div align = "center">

![Isn't the webGL animation I copied cool](./media/WeChat965f3c22c59dd9bdaea6e460e06890c3.jpg)

</div>

Agents don't seem that esoteric—context injection, session management, structured tool calls, deciding when to stop and send a message back to the user. That's about it, isn't it? Let me try it myself. (I'll definitely eat my words.)

First, I'm not trying to build some super impressive Agent like Claude code or codex. Although I think those impressive Agents on the market are essentially coding Agents, they just have special architectures and tools designed for specific scenarios or tasks. Maybe it's special context management, or different A2A communication protocols, session management architecture design, Agent loop logic design, etc. Actually, I'm not too sure either. Intuitively, I think the pi framework is very good and relatively basic, and I like its founder and the philosophy of their company. (Things injected with passion get liked by others, right?) So let's get started.

Regarding the Agent's tool system, we can discuss it from three aspects: tool definition, tool loading, and tool execution. tool_call or function_call—the principle is to first tell the LLM which tools it can call at any time, and the LLM decides when to call them. The calling method is to have the LLM return a piece of structured data (JSON schema). At runtime, the system reads this structured data, runs the corresponding tool (often some scripts or web searches), processes the tool output, and summarizes it back to the LLM. In essence, it gives the large model a way to interact with the real networked world, except that LLMs aren't smart enough yet and lack sufficient capability (context), which is why we have all these subagents, MCP, context engineering, state management, tool integration, and so on. I think once LLM intelligence reaches a certain level, just give it a bash shell and it's done—it can implement everything itself. But that should be impossible; no one would hand themselves over to probability.

<div align = "center">

![Unclear Meaning](./media/WeChat8466c0ecf5334d854737b5f0007e9f4a.jpg)

</div>

Getting back to the point, the tool definition consists of three variables: `name` `description` `parameters`, which are the tool's name, description, and parameters. These are API protocol fields, as specified by the OpenAI Chat Completions API; that is, when making a Completion HTTP request, you pass them in this way. Other fields include `model` `messages` `tool_choice`, and structures within the fields, etc. The tool field information is loaded into the context when a Loop is created; it is not placed after the message, but only loaded as the `tools` field. How to handle this information is the provider's job. (I recall research saying that context engineering is very important, guiding the LLM; generally, the earlier in the context, the greater the effect, but this is not considered when loading tools.)

After preparing the tools, we start creating the actual agent. First, we need to register the tools we just created. This is to let the LLM correctly return the structure for calling the tool and let the runtime correctly execute that structure. (I'm referring to the registration when initializing the Agent; in practice, you write the schema when creating a new tool and then register it in index.js.) According to our purpose, registration consists of two parts: putting the tool name and corresponding instance into a Map (also including execute here). When the LLM returns a schema, find the corresponding instance in the map based on the `name` in the schema and execute it. The other part is the fields to pass to the LLM, telling it what tools are available and how to use them—just pass `name`, `description`, and `parameters`:
```Typescript
this.toolSchemas = tools.map((t) => ({//tools is the constructor parameter (think of it as a variable in a struct), tools:Tool[] here tools is defined as an empty array, but its structure is defined, containing three parameters.
  type: "function",
  function: {
    name: t.name,
    description: t.description,
    parameters: t.parameters,
  },
}));
```
Here `tools` is generated using the `createTools()` function when we create the service. This function is in index.js; it generates the JSON schemas for all tools and passes them as an array to `tools`. Therefore, when creating a new tool, remember to register it here.

Alright, alright—the LLM knows what tools you have and how to use them, and the Agent also knows how to process the structure returned by the LLM and execute the corresponding tool. All this is to make this talk-only LLM learn to do some real work. Let's get the loop running, continuously appending messages to stuff the LLM full. It's not that smart after all, is it?

<div align = "center">

![APIAPIAPIAPTAPI](./media/WeChat599583f17bb502a3091b515990d57d35.jpg)

</div>