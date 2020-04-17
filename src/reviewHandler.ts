import WebHooks = require('@octokit/webhooks')
import { Client, Context, Config } from './types'
import mergeIfReady from './mergeIfReady'

export default async function reviewHandler(
    client: Client,
    context: Context,
    config: Config,
) {
    const event = context.payload as WebHooks.WebhookPayloadPullRequestReview
    console.log('reviewHandler: starting mergeIfReady')
    await mergeIfReady(
        client,
        context.repo.owner,
        context.repo.repo,
        event.pull_request,
        config,
    )
    console.log('reviewHandler: mergeIfReady completed')
}
