import { Context, Schema, User } from "koishi";

export const name = "fei-cmd-self";

const usageTemp = (botList?: string[]) =>
  `本插件需要适配器支持上报bot自身消息<br>
llonebot需要在其插件界面设置中打开“上报Bot自身发送的消息”功能

## 严重警告

本插件的功能并不符合正规使用方式，<br>
仅应群友对指令进行测试的需求制作，<br>
插件作者不鼓励正常使用中的“人机合一”行为

<div style="
  width: fit-content;
  padding: 0 1em;
  border: 0.2em solid #de3163;
  border-radius: 0.5em;
  color: #de3163;
  font-size: 1.2em;
  font-weight: bold;
">
<p>触发自身指令可能会导致严重的死循环问题</p>
<p>请在知晓风险的情况下，谨慎决定是否开启</p>
</div>
` + (botList ? `## 当前所有bot：\n<pre>${botList.join("\n")}</pre>` : "");

export let usage = usageTemp();
export interface Config {
  switch: boolean;
  selfIdArr: string[];
  debounce: number;
}

export const Config: Schema<Config> = Schema.object({
  switch: Schema.boolean().default(false).description("是否启用本插件功能"),
  selfIdArr: Schema.array(String)
    .role("table")
    .description(
      "开启本功能的bot的平台id，必须填入才会启用功能，请注意填写正确"
    ),
  debounce: Schema.number()
    .default(1000)
    .description("冷却时间，单位为毫秒，在此时间内自身发送的消息不会触发指令"),
});

export function apply(ctx: Context, config: Config) {
  if (ctx.bots.length) {
    const botList = ctx.bots.map(
      (bot) =>
        "平台：" +
        (bot.platform || "获取失败") +
        " 名称：" +
        (bot.user?.name || "获取失败") +
        " 平台id：" +
        bot.selfId
    );
    usage = usageTemp(botList);
  };

  if (config.switch) {
    let lastSelfCmdTime = 0;

    ctx.on("message", async (session) => {
      if (!config.selfIdArr.includes(session.bot.selfId)) return;
      if (Date.now() - lastSelfCmdTime < config.debounce) return;
      if (session.userId === session.bot.selfId)
        session.execute(session.content);
      lastSelfCmdTime = Date.now();
    });
  }
}
