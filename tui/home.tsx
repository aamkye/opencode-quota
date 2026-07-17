import { For, Show } from "solid-js"

import {
  createOpenAiProvider,
  createZaiProvider,
  defineTuiPlugin,
  homeQuotaPercentParts,
  homeQuotaStatusRole,
  type HomeQuotaSummary,
  pluginDescriptor,
  type QuotaProviderAdapter,
} from "../shared/opencode-tools-shared.js"

const HOME_ORDER = pluginDescriptor("home").slotOrder ?? 0

function HomeQuotaLine(props: { summary: HomeQuotaSummary; theme: () => { error: string; warning: string; success: string; textMuted: string } }) {
  const primary = () => homeQuotaPercentParts(props.summary)[0]
  const secondary = () => homeQuotaPercentParts(props.summary)[1]

  return (
    <box flexDirection="row" justifyContent="center">
      <text fg={props.theme().textMuted}>{props.summary.provider}: {props.summary.plan}; </text>
      <text fg={props.theme()[homeQuotaStatusRole(primary().pct)]}>{primary().text}</text>
      <Show when={secondary()}>
        {(value) => <><text fg={props.theme().textMuted}>/</text><text fg={props.theme()[homeQuotaStatusRole(value().pct)]}>{value().text}</text></>}
      </Show>
    </box>
  )
}

const plugin = defineTuiPlugin(pluginDescriptor("home"), (context, api) => {
  const providers: QuotaProviderAdapter[] = []
  context.onCleanup(() => providers.forEach((provider) => provider.dispose()))
  providers.push(createZaiProvider(api))
  providers.push(createOpenAiProvider(api))

  api.slots.register({
    // A distinct home slot preserves the compact provider summaries during initial loading.
    order: HOME_ORDER,
    slots: {
      home_bottom() {
        return (
          <box flexDirection="column">
            <For each={providers}>
              {(provider) => <Show when={provider.home()}>{(item) => <HomeQuotaLine summary={item()} theme={() => api.theme.current} />}</Show>}
            </For>
          </box>
        )
      },
    },
  })
})

export default plugin
